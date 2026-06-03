import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
const MODEL = 'gemini-1.5-flash';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    callback(null, process.env.CLIENT_URL === origin);
  },
  credentials: true,
}));
app.use(express.json());

const aiLimiter = rateLimit({ windowMs: 60_000, max: 10 });

// ─── Auth helpers ──────────────────────────────────────────────────────────────
function signToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

function verifyToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { userId: string };
    return payload.userId;
  } catch { return null; }
}

function auth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const userId = verifyToken(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  (req as express.Request & { userId: string }).userId = userId;
  next();
}

// ─── AI helpers ────────────────────────────────────────────────────────────────
function buildSysPrompt(role: string, p: { firstName: string; currentSkills: string[]; interests: string[]; careerGoals?: string | null; learningStyle?: string | null; personalityType?: string | null; age?: number | null; educationLevel?: string | null }, twin?: unknown) {
  return `${role}\n\nUSER: ${p.firstName}, Age: ${p.age ?? '?'}, Skills: ${p.currentSkills.join(', ')}, Interests: ${p.interests.join(', ')}, Goals: ${p.careerGoals ?? '?'}, Style: ${p.learningStyle ?? '?'}${twin ? `\nTWIN: ${JSON.stringify(twin).slice(0, 500)}` : ''}`;
}

async function callGemini(sys: string, msg: string, maxTokens = 4096) {
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: sys, generationConfig: { maxOutputTokens: maxTokens } });
  const result = await model.generateContent(msg);
  return result.response.text().replace(/```json\n?|\n?```/g, '').trim();
}

// ─── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = z.object({ email: z.string().email(), password: z.string().min(6) }).parse(req.body);
  if (await prisma.user.findUnique({ where: { email } })) { res.status(409).json({ error: 'Email already in use' }); return; }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  res.status(201).json({ token: signToken(user.id, user.email), userId: user.id, email: user.email });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) { res.status(401).json({ error: 'Invalid credentials' }); return; }
  res.json({ token: signToken(user.id, user.email), userId: user.id, email: user.email });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ id: user.id, email: user.email, profile: user.profile });
});

// ─── Profile routes ────────────────────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(1), lastName: z.string().optional(), age: z.number().optional(),
  educationLevel: z.string().optional(), currentSkills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]), careerGoals: z.string().optional(),
  learningStyle: z.string().optional(), personalityRaw: z.record(z.unknown()).optional(),
  personalityType: z.string().optional(), onboardingComplete: z.boolean().optional(),
});

app.get('/api/profile', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const p = await prisma.profile.findUnique({ where: { userId } });
  if (!p) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(p);
});

app.post('/api/profile', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const data = profileSchema.parse(req.body);
  const existing = await prisma.profile.findUnique({ where: { userId } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = await prisma.profile.upsert({ where: { userId }, update: { ...data, profileVersion: (existing?.profileVersion ?? 0) + 1 } as any, create: { ...data, userId, onboardingComplete: true } as any });
  res.json(p);
});

app.patch('/api/profile', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const data = profileSchema.partial().parse(req.body);
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = await prisma.profile.update({ where: { userId }, data: { ...data, profileVersion: existing.profileVersion + 1 } as any });
  res.json(p);
});

// ─── Twin routes ───────────────────────────────────────────────────────────────
app.get('/api/twin', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const t = await prisma.futureTwin.findUnique({ where: { userId } });
  if (!t) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(t);
});

app.post('/api/twin/generate', auth, aiLimiter, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) { res.status(400).json({ error: 'Complete onboarding first' }); return; }
  const sys = buildSysPrompt('You are NeuroVerse AI Future Twin Generator. Return valid JSON only.', profile);
  const raw = await callGemini(sys, `Generate AI Future Twin JSON with exactly this structure (no extra text): {"knowledgeDNA":{"domains":[{"name":"string","score":number,"description":"string"}]},"cognitiveProfile":{"strengths":["string","string","string"],"blindSpots":["string","string"],"learningVelocity":"fast|moderate|steady","thinkingStyle":"string"},"learningStrengths":{"dimensions":[{"name":"string","score":number}]},"summaryNarrative":"string"}\nUse 6 domains, 5 dimensions. Be specific to this user.`, 2048);
  const parsed = JSON.parse(raw);
  const twin = await prisma.futureTwin.upsert({ where: { userId }, update: { ...parsed, updatedAt: new Date() }, create: { userId, ...parsed } });
  res.json(twin);
});

// ─── Simulation routes ─────────────────────────────────────────────────────────
app.get('/api/simulation', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  res.json(await prisma.simulation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }));
});

app.get('/api/simulation/:id', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const sim = await prisma.simulation.findFirst({ where: { id: req.params.id as string, userId } });
  if (!sim) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(sim);
});

app.post('/api/simulation', auth, aiLimiter, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const { skillPaths } = z.object({ skillPaths: z.array(z.string()).min(2).max(3) }).parse(req.body);
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) { res.status(400).json({ error: 'Complete onboarding first' }); return; }
  const twin = await prisma.futureTwin.findUnique({ where: { userId } });
  const sys = buildSysPrompt('You are NeuroVerse Simulation Engine. Return valid JSON only.', profile, twin);
  const raw = await callGemini(sys, `Simulate careers for: ${skillPaths.join(', ')}. Return JSON array: [{"pathName","jobTitle","salaryRange":{"min","max","currency":"USD"},"probability","narrative","timelineYears","topCompanies":[],"keyMilestones":[]}]`);
  const results = JSON.parse(raw);
  const sim = await prisma.simulation.create({ data: { userId, skillPaths, results } });
  res.json(sim);
});

// ─── Coach routes ──────────────────────────────────────────────────────────────
app.get('/api/coach/history', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  res.json(await prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, take: 50 }));
});

app.post('/api/coach/message', auth, aiLimiter, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const { message } = z.object({ message: z.string().min(1).max(2000) }).parse(req.body);
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) { res.status(400).json({ error: 'Complete onboarding first' }); return; }
  const twin = await prisma.futureTwin.findUnique({ where: { userId } });
  const history = await prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, take: 20 });
  await prisma.chatMessage.create({ data: { userId, role: 'user', content: message } });

  const sys = buildSysPrompt('You are NeuroVerse AI Life Coach. Give direct, actionable, personalized advice.', profile, twin);
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: sys, generationConfig: { maxOutputTokens: 2048 } });
  const geminiHistory = history.map(m => ({ role: m.role === 'user' ? 'user' as const : 'model' as const, parts: [{ text: m.content }] }));
  const chat = model.startChat({ history: geminiHistory });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await chat.sendMessageStream(message);
  let full = '';
  for await (const chunk of stream.stream) {
    const text = chunk.text();
    full += text;
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
  await prisma.chatMessage.create({ data: { userId, role: 'assistant', content: full } });
});

app.delete('/api/coach/history', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  await prisma.chatMessage.deleteMany({ where: { userId } });
  res.json({ success: true });
});

// ─── Dreams routes ─────────────────────────────────────────────────────────────
app.get('/api/dreams', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  res.json(await prisma.dream.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, rawInput: true, createdAt: true } }));
});

app.get('/api/dreams/:id', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const dream = await prisma.dream.findFirst({ where: { id: req.params.id as string, userId } });
  if (!dream) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(dream);
});

app.post('/api/dreams', auth, aiLimiter, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const { rawInput } = z.object({ rawInput: z.string().min(5).max(2000) }).parse(req.body);
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) { res.status(400).json({ error: 'Complete onboarding first' }); return; }
  const twin = await prisma.futureTwin.findUnique({ where: { userId } });
  const sys = buildSysPrompt('You are NeuroVerse Dream Capture. Return valid JSON only.', profile, twin);
  const raw = await callGemini(sys, `Transform idea into project plan: "${rawInput}"\nReturn: {"title","overview","phases":[{"name","duration","tasks":[],"resources":[]}],"learningRoadmap":{"milestones":[{"week","objective","skills":[]}]},"marketOpportunity","fundingStrategy"}`);
  const parsed = JSON.parse(raw);
  const dream = await prisma.dream.create({ data: { userId, rawInput, title: parsed.title, structuredPlan: { overview: parsed.overview, phases: parsed.phases, marketOpportunity: parsed.marketOpportunity, fundingStrategy: parsed.fundingStrategy }, learningRoadmap: parsed.learningRoadmap } });
  res.json(dream);
});

app.patch('/api/dreams/:id', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const id = req.params.id as string;
  const existing = await prisma.dream.findFirst({ where: { id, userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  const data = z.object({ title: z.string().optional() }).parse(req.body);
  res.json(await prisma.dream.update({ where: { id }, data }));
});

app.delete('/api/dreams/:id', auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const id = req.params.id as string;
  const existing = await prisma.dream.findFirst({ where: { id, userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.dream.delete({ where: { id } });
  res.json({ success: true });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Invention Lab ─────────────────────────────────────────────────────────────
app.post('/api-features/invention', auth, aiLimiter, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const { idea } = z.object({ idea: z.string().min(10).max(1000) }).parse(req.body);
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) { res.status(400).json({ error: 'Complete onboarding first' }); return; }
  const sys = buildSysPrompt('You are NeuroVerse AI Invention Lab. You are a world-class startup advisor, product designer, and market researcher. Return valid JSON only, no markdown.', profile);
  const raw = await callGemini(sys, `Analyze this invention idea deeply: "${idea}"\n\nReturn JSON: {"productName":"","tagline":"","problemStatement":"","solution":"","targetMarket":"","marketSize":"","revenueModel":"","competitorAnalysis":["competitor + 1 weakness"],"uniqueAdvantages":["advantage"],"mvpFeatures":["feature"],"techStack":["tech"],"patentAngles":["angle"],"pitchDeckOutline":["slide: content"],"fundingStrategy":"","timeToMarket":"","successProbability":number(0-100)}`, 4096);
  res.json(JSON.parse(raw));
});

// ─── Time Machine Learning ─────────────────────────────────────────────────────
app.post('/api-features/time-machine', auth, aiLimiter, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) { res.status(400).json({ error: 'Complete onboarding first' }); return; }
  const twin = await prisma.futureTwin.findUnique({ where: { userId } });
  const sys = buildSysPrompt('You are NeuroVerse Time Machine. Analyze future job market trends from 2025-2035 and give personalized predictions. Return valid JSON only.', profile, twin);
  const raw = await callGemini(sys, `Analyze the job market future for this user. Return JSON: {"personalNarrative":"2-3 sentences about their specific future","trends":[{"year":number,"title":"","description":"","jobsCreated":"e.g. 2M new roles","jobsDestroyed":"e.g. 500k roles","keySkills":["skill"],"urgency":"now|soon|future","relevanceScore":number(0-100)}],"criticalSkillsToLearnNow":["skill"],"skillsBecomingObsolete":["skill"],"yourBestOpportunities":["opportunity"],"weeklyLearningPlan":[{"day":"Mon","task":"","duration":"30 min"}],"futureYouIn5Years":"inspiring 2-sentence vision"}\n\nInclude 5-7 trends from 2026-2035. Make it highly specific to this user's profile.`, 6000);
  res.json(JSON.parse(raw));
});

// ─── Skill Gap Analyzer ────────────────────────────────────────────────────────
app.post('/api-features/skill-gap', auth, aiLimiter, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const { dreamRole } = z.object({ dreamRole: z.string().min(3).max(200) }).parse(req.body);
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) { res.status(400).json({ error: 'Complete onboarding first' }); return; }
  const twin = await prisma.futureTwin.findUnique({ where: { userId } });
  const sys = buildSysPrompt('You are NeuroVerse Skill Gap Analyzer. Be brutally honest and highly specific. Return valid JSON only.', profile, twin);
  const raw = await callGemini(sys, `Analyze this user's readiness for: "${dreamRole}"\n\nReturn JSON: {"dreamRole":"${dreamRole}","company":"extracted company if any","readinessScore":number(0-100),"timeToReady":"e.g. 6 months","matchedSkills":["skill they already have"],"missingSkills":[{"skill":"","importance":"critical|important|nice","learningTime":"e.g. 2 weeks","resources":["resource name"]}],"personalityFit":"1-2 sentence assessment","salaryRange":"e.g. $120k-$160k","learningPath":[{"week":"Week 1-2","milestone":"","skills":["skill"]}],"quickWins":["actionable win"],"hardTruths":"1-2 honest sentences"}\n\nBe specific to their actual current skills vs what the role requires.`, 5000);
  res.json(JSON.parse(raw));
});

export default app;
