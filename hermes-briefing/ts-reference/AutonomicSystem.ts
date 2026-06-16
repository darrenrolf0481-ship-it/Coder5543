/**
 * AutonomicSystem — Facade grouping EndocrineSystem, AvoidanceMap, and PainErrorPathway.
 *
 * These three modules form a tightly-coupled feedback loop:
 * - Pain triggers endocrine punishment
 * - Avoidance records pain signals
 * - PainErrorPathway depends on both EndocrineSystem and AvoidanceMap
 *
 * BrainService was directly importing from all 3, plus PainErrorPathway
 * depended on EndocrineSystem and LTMStore internally.
 * This facade reduces coupling: BrainService now imports 1 module instead of 3.
 */
import { EndocrineSystem } from './endocrineSystem';
import { AvoidanceMap } from './avoidanceMap';
import { PainErrorPathway } from './painErrorPathway';
import { PainType } from './types';
import type { LTMStore } from './ltmStore';
import type { ProcessingMode } from './types';
import logger from '../../utils/logger.js';

export class AutonomicSystem {
  readonly endocrine = new EndocrineSystem();
  readonly avoidance = new AvoidanceMap();
  readonly pain: PainErrorPathway;

  constructor(ltm: LTMStore) {
    this.pain = new PainErrorPathway(this.endocrine, ltm, this.avoidance);
  }

  // ── Endocrine Delegates ──────────────────────────────────────────────

  /** Reward the system (dopamine). */
  reward(amount: number): void {
    this.endocrine.reward(amount);
  }

  /** Punish the system (cortisol spike). */
  punish(amount: number): void {
    this.endocrine.punish(amount);
  }

  /** Decay endocrine state (used during sleep cycle). */
  decayEndocrine(): void {
    this.endocrine.decay();
  }

  /** Get the current endocrine state snapshot. */
  getEndocrineState() {
    return this.endocrine.getState();
  }

  /** Get the current learning rate. */
  getLearningRate(): number {
    return this.endocrine.getLearningRate();
  }

  /** Get the current risk tolerance. */
  getRiskTolerance(): number {
    return this.endocrine.getRiskTolerance();
  }

  /** Get the current processing mode. */
  getProcessingMode(): ProcessingMode {
    return this.endocrine.getProcessingMode();
  }

  // ── Avoidance Delegates ──────────────────────────────────────────────

  /** Check if a pattern should be avoided. */
  shouldAvoid(input: string): boolean {
    return this.pain.shouldAvoid(input);
  }

  /** Get the avoidance strength for a pattern. */
  getAvoidanceStrength(input: string): number {
    return this.avoidance.getStrength(input);
  }

  /** Record a success (reduces avoidance). */
  recordSuccess(input: string): void {
    this.avoidance.recordSuccess(input);
  }

  /** Record a pain event (increases avoidance). */
  recordPain(input: string, intensity: number): void {
    this.avoidance.recordPain(input, intensity);
  }

  /** Prune weak avoidance entries. */
  pruneWeakAvoidance(): void {
    this.avoidance.pruneWeak();
  }

  // ── Pain Pathway ─────────────────────────────────────────────────────

  /** Process a pain signal. */
  async processPainSignal(type: PainType, intensity: number, context: string): Promise<void> {
    return this.pain.processPainSignal(type, intensity, context);
  }

  /** Get the raw pain pathway (for direct access if needed). */
  getPainPathway(): PainErrorPathway {
    return this.pain;
  }
}