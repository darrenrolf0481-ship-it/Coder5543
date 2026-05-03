export interface WorkingMemory {
  id: string;
  content: string;
  role: 'user' | 'ai';
  timestamp: number;
  emotionalWeight: number; // -1 (pain) to +1 (reward)
}

export interface Experience {
  id: string;
  intent: string;       // normalized input
  response: string;     // what the AI said
  outcome: 'success' | 'failure' | 'neutral';
  emotionalWeight: number;
  tags: string[];
  timestamp: number;
  accessCount: number;
}

export interface EndocrineState {
  dopamine: number;   // 0–1: reward signal, drives exploration
  cortisol: number;   // 0–1: stress/pain signal, drives caution
  lastUpdated: number;
}

export interface AvoidanceEntry {
  hash: string;
  pattern: string;    // normalized form of the avoided input pattern
  strength: number;   // 0–1, decays over time
  count: number;
  lastTriggered: number;
}

export interface BrainContext {
  stm: WorkingMemory[];
  relevantExperiences: Experience[];
  endocrine: EndocrineState;
  corrections: Record<string, string>; // token → corrected token
  avoidanceActive: boolean;
  learningRate: number;
  riskTolerance: number;
}
