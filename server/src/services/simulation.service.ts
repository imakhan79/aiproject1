import { buildSystemBlocks, callClaude, ProfileContext, TwinContext } from './claude.service';

const ROLE = `You are NeuroVerse AI's Future Simulation Engine. You simulate parallel career futures for users based on their profile and chosen skill paths. Always respond with valid JSON only, no markdown, no extra text.`;

export async function runSimulation(
  profile: ProfileContext,
  twin: TwinContext | undefined,
  skillPaths: string[]
): Promise<unknown[]> {
  const systemBlocks = buildSystemBlocks(ROLE, profile, twin);

  const userPrompt = `Simulate career outcomes for the following skill paths for this user: ${skillPaths.join(', ')}.

Current year is 2026. Return a JSON array where each element represents one skill path scenario:
[
  {
    "pathName": "string",
    "jobTitle": "string (most likely job title in 5 years)",
    "salaryRange": { "min": number, "max": number, "currency": "USD" },
    "probability": number (0-100, likelihood of achieving this outcome),
    "narrative": "string (2-3 sentences describing this future)",
    "timelineYears": number (years to reach this outcome),
    "topCompanies": ["string", "string", "string"],
    "keyMilestones": ["string", "string", "string"]
  }
]

Be realistic but inspiring. Base probabilities on the user's current skills and alignment with the chosen path. Higher alignment = higher probability.`;

  const raw = await callClaude(
    [{ role: 'user', content: userPrompt }],
    systemBlocks,
    4096
  );

  return JSON.parse(raw);
}
