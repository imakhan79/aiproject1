import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../types';

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  age: z.number().int().min(10).max(100).optional(),
  educationLevel: z.string().optional(),
  currentSkills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  careerGoals: z.string().optional(),
  learningStyle: z.string().optional(),
  personalityRaw: z.record(z.unknown()).optional(),
  personalityType: z.string().optional(),
  onboardingComplete: z.boolean().optional(),
});

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  res.json(profile);
}

export async function upsertProfile(req: AuthRequest, res: Response): Promise<void> {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const existing = await prisma.profile.findUnique({ where: { userId: req.userId } });
  const data = {
    ...parsed.data,
    onboardingComplete: parsed.data.onboardingComplete ?? true,
    profileVersion: existing ? existing.profileVersion + 1 : 1,
  };

  const prismaData = {
    ...data,
    personalityRaw: data.personalityRaw as Record<string, unknown> ?? undefined,
  };

  const profile = await prisma.profile.upsert({
    where: { userId: req.userId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: prismaData as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { ...prismaData, userId: req.userId! } as any,
  });
  res.json(profile);
}

export async function patchProfile(req: AuthRequest, res: Response): Promise<void> {
  const parsed = profileSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const existing = await prisma.profile.findUnique({ where: { userId: req.userId } });
  if (!existing) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = await prisma.profile.update({
    where: { userId: req.userId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { ...parsed.data, profileVersion: existing.profileVersion + 1 } as any,
  });
  res.json(profile);
}
