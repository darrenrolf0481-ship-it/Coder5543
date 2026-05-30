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
  dopamine: number;        // 0–1: reward signal, drives exploration
  cortisol: number;        // 0–1: stress/pain signal, drives caution
  norepinephrine: number;  // 0–1: focus/panic signal, shifts processing mode
  lastUpdated: number;
}

export type ProcessingMode = 'REACTIVE' | 'ANALYTICAL';

export enum PainType {
  BUILD_FAILURE       = 'BUILD_FAILURE',        // Code/task failed to execute
  LOGICAL_INCONSISTENCY = 'LOGICAL_INCONSISTENCY', // Contradictory reasoning detected
  USER_REJECTION      = 'USER_REJECTION',        // Explicit negative feedback from user
}

export interface AvoidanceEntry {
  hash: string;
  pattern: string;    // normalized form of the avoided input pattern
  strength: number;   // 0–1, decays over time
  count: number;
  lastTriggered: number;
}

export type OperationMode =
  | 'INSTINCT_AVOID'   // reflex arc triggered — skip processing entirely
  | 'EMERGENCY_SAFE'   // REACTIVE hormonal state — fast, conservative
  | 'CAUTIOUS'         // ANALYTICAL + negative history + low risk tolerance
  | 'NORMAL';          // ANALYTICAL, no red flags

export interface BrainContext {
  stm: WorkingMemory[];
  relevantExperiences: Experience[];
  endocrine: EndocrineState;
  corrections: Record<string, string>; // token → corrected token
  avoidanceActive: boolean;
  learningRate: number;
  riskTolerance: number;
  processingMode: ProcessingMode;
}
