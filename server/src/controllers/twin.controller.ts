import { Response } from 'express';
import { prisma } from '../prisma/client';
import { generateTwin } from '../services/twin.service';
import { AuthRequest } from '../types';
import { ProfileContext } from '../services/claude.service';

export async function getTwin(req: AuthRequest, res: Response): Promise<void> {
  const twin = await prisma.futureTwin.findUnique({ where: { userId: req.userId } });
  if (!twin) {
    res.status(404).json({ error: 'Twin not generated yet' });
    return;
  }
  res.json(twin);
}

export async function generateTwinController(req: AuthRequest, res: Response): Promise<void> {
  const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
  if (!profile || !profile.onboardingComplete) {
    res.status(400).json({ error: 'Complete onboarding first' });
    return;
  }

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

  await generateTwin(req.userId!, profileCtx);
  const twin = await prisma.futureTwin.findUnique({ where: { userId: req.userId } });
  res.json(twin);
}
