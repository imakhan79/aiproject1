import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { runSimulation } from '../services/simulation.service';
import { AuthRequest } from '../types';
import { ProfileContext, TwinContext } from '../services/claude.service';

const simulationSchema = z.object({
  skillPaths: z.array(z.string()).min(2).max(3),
});

export async function listSimulations(req: AuthRequest, res: Response): Promise<void> {
  const simulations = await prisma.simulation.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(simulations);
}

export async function getSimulation(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const sim = await prisma.simulation.findFirst({
    where: { id, userId: req.userId },
  });
  if (!sim) {
    res.status(404).json({ error: 'Simulation not found' });
    return;
  }
  res.json(sim);
}

export async function createSimulation(req: AuthRequest, res: Response): Promise<void> {
  const parsed = simulationSchema.safeParse(req.body);
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

  const results = await runSimulation(profileCtx, twinCtx, parsed.data.skillPaths);

  const simulation = await prisma.simulation.create({
    data: {
      userId: req.userId!,
      skillPaths: parsed.data.skillPaths,
      results: results as object[],
    },
  });
  res.json(simulation);
}
