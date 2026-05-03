import type { EndocrineState } from './types';

const STORAGE_KEY = 'brain_endocrine';
const DECAY_RATE = 0.05;       // per hour
const DOPAMINE_BOOST = 0.25;
const CORTISOL_BOOST = 0.35;
const DOPAMINE_FLOOR = 0.1;
const CORTISOL_FLOOR = 0.0;

function load(): EndocrineState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { dopamine: 0.5, cortisol: 0.1, lastUpdated: Date.now() };
}

function save(state: EndocrineState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function applyTimeDecay(state: EndocrineState): EndocrineState {
  const hoursElapsed = (Date.now() - state.lastUpdated) / 3_600_000;
  const factor = Math.pow(1 - DECAY_RATE, hoursElapsed);
  return {
    dopamine: Math.max(DOPAMINE_FLOOR, DOPAMINE_FLOOR + (state.dopamine - DOPAMINE_FLOOR) * factor),
    cortisol: Math.max(CORTISOL_FLOOR, state.cortisol * factor),
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
    save(this.state);
  }

  punish(magnitude = 1.0): void {
    this.state = applyTimeDecay(this.state);
    this.state.cortisol = Math.min(1, this.state.cortisol + CORTISOL_BOOST * magnitude);
    this.state.dopamine = Math.max(DOPAMINE_FLOOR, this.state.dopamine - 0.15 * magnitude);
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
}
