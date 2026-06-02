import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { streamCoachResponse } from '../services/coach.service';
import { AuthRequest } from '../types';
import { ProfileContext, TwinContext } from '../services/claude.service';

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
});

export async function getHistory(req: AuthRequest, res: Response): Promise<void> {
  const messages = await prisma.chatMessage.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  res.json(messages);
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
  if (!profile) {
    res.status(400).json({ error: 'Complete onboarding first' });
    return;
  }

  const twin = await prisma.futureTwin.findUnique({ where: { userId: req.userId } });
  const history = await prisma.chatMessage.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  await prisma.chatMessage.create({
    data: { userId: req.userId!, role: 'user', content: parsed.data.message },
  });

  const profileCtx: ProfileContext = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    age: profile.age,
    educationLevel: profile.educationLevel,
    currentSkills: profile.currentSkills,
    interests: profile.interests,
    careerGoals: profile.careerGoals,
    learningStyle: profile.learningStyle,
    personalityType: profile.personalityType,
  };

  const twinCtx: TwinContext | undefined = twin
    ? {
        knowledgeDNA: twin.knowledgeDNA,
        cognitiveProfile: twin.cognitiveProfile,
        learningStrengths: twin.learningStrengths,
        summaryNarrative: twin.summaryNarrative,
      }
    : undefined;

  const assistantText = await streamCoachResponse(
    profileCtx,
    twinCtx,
    history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    parsed.data.message,
    res
  );

  await prisma.chatMessage.create({
    data: { userId: req.userId!, role: 'assistant', content: assistantText },
  });
}

export async function clearHistory(req: AuthRequest, res: Response): Promise<void> {
  await prisma.chatMessage.deleteMany({ where: { userId: req.userId } });
  res.json({ success: true });
}
