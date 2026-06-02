import { buildSystemBlocks, callClaude, ProfileContext, TwinContext } from './claude.service';

const ROLE = `You are NeuroVerse AI's Dream Capture system. You transform raw ideas and ambitions into structured, actionable project plans aligned to the user's current skills and goals. Always respond with valid JSON only, no markdown, no extra text.`;

export async function processDream(
  profile: ProfileContext,
  twin: TwinContext | undefined,
  rawInput: string
): Promise<{ title: string; structuredPlan: unknown; learningRoadmap: unknown }> {
  const systemBlocks = buildSystemBlocks(ROLE, profile, twin);

  const userPrompt = `Transform this raw idea into a structured project plan:

"${rawInput}"

Return JSON with this structure:
{
  "title": "string (catchy project name, max 6 words)",
  "overview": "string (2-3 sentence project summary)",
  "phases": [
    {
      "name": "string (phase name)",
      "duration": "string (e.g. '2 weeks')",
      "tasks": ["string", "string"],
      "resources": ["string", "string"]
    }
  ],
  "learningRoadmap": {
    "milestones": [
      {
        "week": number,
        "objective": "string",
        "skills": ["string"]
      }
    ]
  },
  "marketOpportunity": "string (1-2 sentences on market potential)",
  "fundingStrategy": "string (1-2 sentences on how to fund this)"
}

Create 3-5 phases. Create 4-8 milestones spread across 12 weeks. Align skills needed with the user's current background. Be specific and actionable.`;

  const raw = await callClaude(
    [{ role: 'user', content: userPrompt }],
    systemBlocks,
    4096
  );

  const parsed = JSON.parse(raw);
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
