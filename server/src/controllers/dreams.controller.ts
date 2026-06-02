import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { processDream } from '../services/dreams.service';
import { AuthRequest } from '../types';
import { ProfileContext, TwinContext } from '../services/claude.service';

const dreamInputSchema = z.object({ rawInput: z.string().min(5).max(2000) });
const dreamPatchSchema = z.object({ title: z.string().min(1).optional() });

export async function listDreams(req: AuthRequest, res: Response): Promise<void> {
  const dreams = await prisma.dream.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, rawInput: true, createdAt: true },
  });
  res.json(dreams);
}

export async function getDream(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const dream = await prisma.dream.findFirst({
    where: { id, userId: req.userId },
  });
  if (!dream) {
    res.status(404).json({ error: 'Dream not found' });
    return;
  }
  res.json(dream);
}

export async function createDream(req: AuthRequest, res: Response): Promise<void> {
  const parsed = dreamInputSchema.safeParse(req.body);
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

  const { title, structuredPlan, learningRoadmap } = await processDream(
    profileCtx,
    twinCtx,
    parsed.data.rawInput
  );

  const dream = await prisma.dream.create({
    data: {
      userId: req.userId!,
      rawInput: parsed.data.rawInput,
      title,
      structuredPlan: structuredPlan as object,
      learningRoadmap: learningRoadmap as object,
    },
  });
  res.json(dream);
}

export async function patchDream(req: AuthRequest, res: Response): Promise<void> {
  const parsed = dreamPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  const id = req.params.id as string;
  const dream = await prisma.dream.findFirst({ where: { id, userId: req.userId } });
  if (!dream) {
    res.status(404).json({ error: 'Dream not found' });
    return;
  }
  const updated = await prisma.dream.update({ where: { id }, data: parsed.data });
  res.json(updated);
}

export async function deleteDream(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const dream = await prisma.dream.findFirst({ where: { id, userId: req.userId } });
  if (!dream) {
    res.status(404).json({ error: 'Dream not found' });
    return;
  }
  await prisma.dream.delete({ where: { id } });
  res.json({ success: true });
}
