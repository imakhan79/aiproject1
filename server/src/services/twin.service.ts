import { prisma } from '../prisma/client';
import { buildSystemBlocks, callClaude, ProfileContext } from './claude.service';

const ROLE = `You are NeuroVerse AI's Future Twin Generator. Your job is to analyze a user's profile and produce their AI Future Twin — a deep cognitive and knowledge analysis. Always respond with valid JSON only, no markdown, no extra text.`;

export async function generateTwin(userId: string, profile: ProfileContext): Promise<void> {
  const systemBlocks = buildSystemBlocks(ROLE, profile);

  const userPrompt = `Analyze this user's profile and generate their AI Future Twin. Return a JSON object with exactly this structure:
{
  "knowledgeDNA": {
    "domains": [
      { "name": "string (domain name)", "score": number (0-100), "description": "string (1 sentence)" }
    ]
  },
  "cognitiveProfile": {
    "strengths": ["string", "string", "string"],
    "blindSpots": ["string", "string"],
    "learningVelocity": "string (fast/moderate/steady)",
    "thinkingStyle": "string (analytical/creative/systems/etc)"
  },
  "learningStrengths": {
    "dimensions": [
      { "name": "string", "score": number (0-100) }
    ]
  },
  "summaryNarrative": "string (2-3 sentences describing this person's potential and unique strengths)"
}

Include 6-8 domains in knowledgeDNA (e.g. Technology, Business, Creative, Communication, Analytics, Leadership, Science, Arts — pick the most relevant).
Include 5-7 dimensions in learningStrengths (e.g. Problem Solving, Critical Thinking, Adaptability, Collaboration, Self-Direction, Innovation, Resilience).
Base all scores on the user's skills, interests, and goals. Be insightful and specific, not generic.`;

  const raw = await callClaude(
    [{ role: 'user', content: userPrompt }],
    systemBlocks,
    8192
  );

  const parsed = JSON.parse(raw);

  await prisma.futureTwin.upsert({
    where: { userId },
    update: {
      knowledgeDNA: parsed.knowledgeDNA,
      cognitiveProfile: parsed.cognitiveProfile,
      learningStrengths: parsed.learningStrengths,
      summaryNarrative: parsed.summaryNarrative,
      updatedAt: new Date(),
    },
    create: {
      userId,
      knowledgeDNA: parsed.knowledgeDNA,
      cognitiveProfile: parsed.cognitiveProfile,
      learningStrengths: parsed.learningStrengths,
      summaryNarrative: parsed.summaryNarrative,
    },
  });
}
