import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { Response } from 'express';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const MODEL = 'gemini-1.5-flash';

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

export function buildSystemPrompt(
  roleInstruction: string,
  profile: ProfileContext,
  twin?: TwinContext
): string {
  return `${roleInstruction}

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
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: maxTokens },
  });

  const result = await model.generateContent(userMessage);
  return result.response.text();
}

export async function streamGemini(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  userMessage: string,
  res: Response,
  onDone: (fullText: string) => void
): Promise<void> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 2048 },
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(userMessage);

  let full = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    full += text;
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
  onDone(full);
}

// Legacy aliases used by services
export const buildSystemBlocks = buildSystemPrompt;
