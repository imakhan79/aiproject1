import { buildSystemPrompt, callGemini, ProfileContext, TwinContext } from './claude.service';

const ROLE = `You are NeuroVerse AI's Future Simulation Engine. Simulate parallel career futures for users based on their profile and chosen skill paths. Always respond with valid JSON only, no markdown, no extra text.`;

export async function runSimulation(
  profile: ProfileContext,
  twin: TwinContext | undefined,
  skillPaths: string[]
): Promise<unknown[]> {
  const systemPrompt = buildSystemPrompt(ROLE, profile, twin);

  const userMessage = `Simulate career outcomes for these skill paths: ${skillPaths.join(', ')}.

Current year is 2026. Return a JSON array where each element represents one skill path scenario:
[
  {
    "pathName": "string",
    "jobTitle": "string",
    "salaryRange": { "min": number, "max": number, "currency": "USD" },
    "probability": number (0-100),
    "narrative": "string (2-3 sentences)",
    "timelineYears": number,
    "topCompanies": ["string", "string", "string"],
    "keyMilestones": ["string", "string", "string"]
  }
]`;

  const raw = await callGemini(systemPrompt, userMessage, 4096);
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned);
}
