import { buildSystemBlocks, streamClaude, ProfileContext, TwinContext } from './claude.service';
import { Response } from 'express';

const ROLE = `You are NeuroVerse AI's Life Coach — a strategic advisor for human potential. You know the user's full profile and future twin data. Give direct, evidence-based, personalized advice. Be encouraging but honest. Focus on actionable next steps.`;

export async function streamCoachResponse(
  profile: ProfileContext,
  twin: TwinContext | undefined,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
  res: Response
): Promise<string> {
  const systemBlocks = buildSystemBlocks(ROLE, profile, twin);

  const messages = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  return new Promise((resolve, reject) => {
    streamClaude(
      messages,
      systemBlocks,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      (fullText) => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        resolve(fullText);
      }
    ).catch(reject);
  });
}
