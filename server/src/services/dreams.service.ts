import { buildSystemPrompt, callGemini, ProfileContext, TwinContext } from './claude.service';

const ROLE = `You are NeuroVerse AI's Dream Capture system. Transform raw ideas and ambitions into structured, actionable project plans aligned to the user's current skills and goals. Always respond with valid JSON only, no markdown, no extra text.`;

export async function processDream(
  profile: ProfileContext,
  twin: TwinContext | undefined,
  rawInput: string
): Promise<{ title: string; structuredPlan: unknown; learningRoadmap: unknown }> {
  const systemPrompt = buildSystemPrompt(ROLE, profile, twin);

  const userMessage = `Transform this raw idea into a structured project plan:

"${rawInput}"

Return JSON with this structure:
{
  "title": "string (catchy project name, max 6 words)",
  "overview": "string (2-3 sentence project summary)",
  "phases": [
    {
      "name": "string",
      "duration": "string (e.g. '2 weeks')",
      "tasks": ["string", "string"],
      "resources": ["string", "string"]
    }
  ],
  "learningRoadmap": {
    "milestones": [
      { "week": number, "objective": "string", "skills": ["string"] }
    ]
  },
  "marketOpportunity": "string (1-2 sentences)",
  "fundingStrategy": "string (1-2 sentences)"
}

Create 3-5 phases and 4-8 milestones spread across 12 weeks.`;

  const raw = await callGemini(systemPrompt, userMessage, 4096);
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    title: parsed.title,
    structuredPlan: {
      overview: parsed.overview,
      phases: parsed.phases,
      marketOpportunity: parsed.marketOpportunity,
      fundingStrategy: parsed.fundingStrategy,
    },
    learningRoadmap: parsed.learningRoadmap,
  };
}
