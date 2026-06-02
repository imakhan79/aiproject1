import { prisma } from '../prisma/client';
import { buildSystemPrompt, callGemini, ProfileContext } from './claude.service';

const ROLE = `You are NeuroVerse AI's Future Twin Generator. Analyze the user's profile and produce their AI Future Twin — a deep cognitive and knowledge analysis. Always respond with valid JSON only, no markdown, no extra text.`;

export async function generateTwin(userId: string, profile: ProfileContext): Promise<void> {
  const systemPrompt = buildSystemPrompt(ROLE, profile);

  const userMessage = `Analyze this user's profile and generate their AI Future Twin. Return a JSON object with exactly this structure:
{
  "knowledgeDNA": {
    "domains": [
      { "name": "string", "score": number (0-100), "description": "string (1 sentence)" }
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
  "summaryNarrative": "string (2-3 sentences)"
}

Include 6-8 domains in knowledgeDNA. Include 5-7 dimensions in learningStrengths. Base scores on the user's skills, interests, and goals.`;

  const raw = await callGemini(systemPrompt, userMessage, 8192);
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned);

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
