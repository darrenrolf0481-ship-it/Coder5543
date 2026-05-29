import { storage } from './storage';
import type { EndocrineState, ProcessingMode } from './types';

const STORAGE_KEY = 'brain_endocrine';
const DECAY_RATE = 0.05;            // per hour (dopamine/cortisol)
const NE_DECAY_RATE = 0.08;         // norepinephrine decays faster than cortisol
const DOPAMINE_BOOST = 0.25;
const CORTISOL_BOOST = 0.35;
const NE_BOOST = 0.30;
const DOPAMINE_FLOOR = 0.1;
const CORTISOL_FLOOR = 0.0;
const NE_FLOOR = 0.1;

function load(): EndocrineState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      // Migrate old saves that lack norepinephrine
      if (state.norepinephrine === undefined) state.norepinephrine = 0.5;
      return state;
    }
  } catch { /* ignore */ }
  return { dopamine: 0.5, cortisol: 0.1, norepinephrine: 0.5, lastUpdated: Date.now() };
}

function save(state: EndocrineState): void {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function applyTimeDecay(state: EndocrineState): EndocrineState {
  const hoursElapsed = (Date.now() - state.lastUpdated) / 3_600_000;
  const factor = Math.pow(1 - DECAY_RATE, hoursElapsed);
  const neFactor = Math.pow(1 - NE_DECAY_RATE, hoursElapsed);
  const neBaseline = 0.5;
  return {
    dopamine: Math.max(DOPAMINE_FLOOR, DOPAMINE_FLOOR + (state.dopamine - DOPAMINE_FLOOR) * factor),
    cortisol: Math.max(CORTISOL_FLOOR, state.cortisol * factor),
    // NE decays toward a resting baseline of 0.5, not toward 0
    norepinephrine: Math.max(NE_FLOOR, neBaseline + (state.norepinephrine - neBaseline) * neFactor),
    lastUpdated: Date.now(),
  };
}

export class EndocrineSystem {
  private state: EndocrineState;

  constructor() {
    this.state = applyTimeDecay(load());
    save(this.state);
  }

  reward(magnitude = 1.0): void {
    this.state = applyTimeDecay(this.state);
    this.state.dopamine = Math.min(1, this.state.dopamine + DOPAMINE_BOOST * magnitude);
    this.state.cortisol = Math.max(CORTISOL_FLOOR, this.state.cortisol - 0.1 * magnitude);
    // Reward calms NE back toward baseline
    this.state.norepinephrine = Math.max(NE_FLOOR, this.state.norepinephrine - 0.1 * magnitude);
    save(this.state);
  }

  punish(magnitude = 1.0): void {
    this.punishWeighted(CORTISOL_BOOST * magnitude, NE_BOOST * magnitude);
  }

  // Fine-grained punish — lets PainErrorPathway apply per-type hormonal signatures
  punishWeighted(cortisolDelta: number, neDelta: number): void {
    this.state = applyTimeDecay(this.state);
    this.state.cortisol = Math.min(1, this.state.cortisol + cortisolDelta);
    this.state.dopamine = Math.max(DOPAMINE_FLOOR, this.state.dopamine - cortisolDelta * 0.4);
    this.state.norepinephrine = Math.min(1, this.state.norepinephrine + neDelta);
    save(this.state);
  }

  decay(): void {
    this.state = applyTimeDecay(this.state);
    save(this.state);
  }

  getState(): EndocrineState {
    this.state = applyTimeDecay(this.state);
    return { ...this.state };
  }

  // Higher dopamine → higher learning rate (more open to new patterns)
  getLearningRate(): number {
    const { dopamine, cortisol } = this.state;
    return Math.max(0.1, Math.min(1.0, 0.4 + dopamine * 0.4 - cortisol * 0.2));
  }

  // Higher cortisol → lower risk tolerance (stick to safe answers)
  getRiskTolerance(): number {
    const { dopamine, cortisol } = this.state;
    return Math.max(0.05, Math.min(1.0, 0.5 + dopamine * 0.3 - cortisol * 0.5));
  }

  // High NE (panic) or high cortisol (stress) → REACTIVE; calm → ANALYTICAL
  getProcessingMode(): ProcessingMode {
    const { norepinephrine, cortisol } = this.state;
    return (norepinephrine > 0.65 || cortisol > 0.7) ? 'REACTIVE' : 'ANALYTICAL';
  }
}
