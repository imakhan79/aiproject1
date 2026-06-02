export interface User {
  id: string;
  email: string;
  profile?: Profile | null;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string | null;
  age?: number | null;
  educationLevel?: string | null;
  currentSkills: string[];
  interests: string[];
  careerGoals?: string | null;
  learningStyle?: string | null;
  personalityType?: string | null;
  onboardingComplete: boolean;
  profileVersion: number;
}

export interface KnowledgeDomain {
  name: string;
  score: number;
  description: string;
}

export interface CognitiveProfile {
  strengths: string[];
  blindSpots: string[];
  learningVelocity: string;
  thinkingStyle: string;
}

export interface LearningDimension {
  name: string;
  score: number;
}

export interface FutureTwin {
  id: string;
  userId: string;
  knowledgeDNA: { domains: KnowledgeDomain[] };
  cognitiveProfile: CognitiveProfile;
  learningStrengths: { dimensions: LearningDimension[] };
  summaryNarrative: string;
  generatedAt: string;
  updatedAt: string;
}

export interface SimulationScenario {
  pathName: string;
  jobTitle: string;
  salaryRange: { min: number; max: number; currency: string };
  probability: number;
  narrative: string;
  timelineYears: number;
  topCompanies: string[];
  keyMilestones: string[];
}

export interface Simulation {
  id: string;
  userId: string;
  skillPaths: string[];
  results: SimulationScenario[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface DreamPhase {
  name: string;
  duration: string;
  tasks: string[];
  resources: string[];
}

export interface DreamMilestone {
  week: number;
  objective: string;
  skills: string[];
}

export interface Dream {
  id: string;
  userId: string;
  rawInput: string;
  title: string;
  structuredPlan: {
    overview: string;
    phases: DreamPhase[];
    marketOpportunity: string;
    fundingStrategy: string;
  };
  learningRoadmap: { milestones: DreamMilestone[] };
  createdAt: string;
}

export interface DreamSummary {
  id: string;
  title: string;
  rawInput: string;
  createdAt: string;
}
