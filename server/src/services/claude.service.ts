import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export interface ProfileContext {
  firstName: string;
  lastName?: string | null;
  age?: number | null;
  educationLevel?: string | null;
  currentSkills: string[];
  interests: string[];
  careerGoals?: string | null;
  learningStyle?: string | null;
  personalityType?: string | null;
}

export interface TwinContext {
  knowledgeDNA?: unknown;
  cognitiveProfile?: unknown;
  learningStrengths?: unknown;
  summaryNarrative?: string;
}

export function buildSystemBlocks(
  roleInstruction: string,
  profile: ProfileContext,
  twin?: TwinContext
): Anthropic.Messages.TextBlockParam[] {
  const profileText = `
USER PROFILE:
Name: ${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}
Age: ${profile.age ?? 'Not specified'}
Education: ${profile.educationLevel ?? 'Not specified'}
Current Skills: ${profile.currentSkills.join(', ') || 'None listed'}
Interests: ${profile.interests.join(', ') || 'None listed'}
Career Goals: ${profile.careerGoals ?? 'Not specified'}
Learning Style: ${profile.learningStyle ?? 'Not specified'}
Personality Type: ${profile.personalityType ?? 'Not determined'}
${twin ? `
AI FUTURE TWIN DATA:
Knowledge DNA: ${JSON.stringify(twin.knowledgeDNA)}
Cognitive Profile: ${JSON.stringify(twin.cognitiveProfile)}
Learning Strengths: ${JSON.stringify(twin.learningStrengths)}
Twin Summary: ${twin.summaryNarrative ?? ''}
` : ''}`.trim();

  return [
    { type: 'text', text: roleInstruction },
    {
      type: 'text',
      text: profileText,
      cache_control: { type: 'ephemeral' },
    } as Anthropic.Messages.TextBlockParam & { cache_control: { type: 'ephemeral' } },
  ];
}

export async function callClaude(
  messages: Anthropic.Messages.MessageParam[],
  systemBlocks: Anthropic.Messages.TextBlockParam[],
  maxTokens = 4096
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemBlocks,
    messages,
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

export async function streamClaude(
  messages: Anthropic.Messages.MessageParam[],
  systemBlocks: Anthropic.Messages.TextBlockParam[],
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void
): Promise<void> {
  let full = '';
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemBlocks,
    messages,
  });

  stream.on('text', (text) => {
    full += text;
    onChunk(text);
  });

  await stream.finalMessage();
  onDone(full);
}
