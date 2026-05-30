import { STMBuffer } from './stmBuffer';
import { LTMStore } from './ltmStore';
import { EndocrineSystem } from './endocrineSystem';
import { AssociativeLayer } from './associativeLayer';
import { AvoidanceMap } from './avoidanceMap';
import { PainErrorPathway } from './painErrorPathway';
import { PainType } from './types';
import type { BrainContext, Experience, OperationMode, WorkingMemory } from './types';

export class BrainService {
  private stm = new STMBuffer();
  private ltm = new LTMStore();
  private endocrine = new EndocrineSystem();
  private associative = new AssociativeLayer();
  private avoidance = new AvoidanceMap();
  private pain = new PainErrorPathway(this.endocrine, this.ltm, this.avoidance);

  /**
   * Pre-processes a user prompt with biological-inspired layers.
   * Returns a enriched context to be sent to the AI.
   */
  async prepareContext(input: string): Promise<BrainContext> {
    // 1. Associative Layer: Correct typos and jargon
    const { corrected, changes } = this.associative.processInput(input);

    // 2. Avoidance Map: Check if this pattern is causing "pain"
    const avoidanceStrength = this.avoidance.getStrength(corrected);
    const avoidanceActive = avoidanceStrength > 0.4;

    // 3. Memory Retrieval
    const recentStm = this.stm.getAll();
    const relevantExperiences = await this.ltm.findSimilar(corrected, 3);

    // 4. Endocrine State
    const endocrine = this.endocrine.getState();
    const learningRate = this.endocrine.getLearningRate();
    const riskTolerance = this.endocrine.getRiskTolerance();
    const processingMode = this.endocrine.getProcessingMode();

    return {
      stm: recentStm,
      relevantExperiences,
      endocrine,
      corrections: changes,
      avoidanceActive,
      learningRate,
      riskTolerance,
      processingMode
    };
  }

  /**
   * Records the outcome of an AI interaction to simulate learning and emotions.
   */
  async recordInteraction(input: string, response: string, outcome: 'success' | 'failure' | 'neutral'): Promise<void> {
    const { corrected } = this.associative.processInput(input);
    const timestamp = Date.now();
    const id = `exp_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;

    // Determine emotional weight based on outcome and current stress
    const currentCortisol = this.endocrine.getState().cortisol;
    let emotionalWeight = 0;
    
    if (outcome === 'success') {
      emotionalWeight = 0.5 + (1 - currentCortisol) * 0.5; // More rewarding if not stressed
      this.endocrine.reward(emotionalWeight);
      this.avoidance.recordSuccess(corrected);
    } else if (outcome === 'failure') {
      emotionalWeight = -0.6 - currentCortisol * 0.4; // More painful if already stressed
      this.endocrine.punish(Math.abs(emotionalWeight));
      this.avoidance.recordPain(corrected, Math.abs(emotionalWeight));
    }

    const experience: Experience = {
      id,
      intent: corrected,
      response,
      outcome,
      emotionalWeight,
      tags: [],
      timestamp,
      accessCount: 0
    };

    // Only burn to LTM if emotionally significant — neutral interactions stay in STM only
    if (Math.abs(emotionalWeight) > 0.5) {
      await this.ltm.save(experience);
    }

    // 2. Push to STM
    const memory: WorkingMemory = {
      id: `stm_${timestamp}`,
      content: corrected,
      role: 'user',
      timestamp,
      emotionalWeight
    };
    this.stm.push(memory);
    
    const aiMemory: WorkingMemory = {
      id: `stm_ai_${timestamp}`,
      content: response,
      role: 'ai',
      timestamp,
      emotionalWeight: 0 // AI responses are neutral by default
    };
    this.stm.push(aiMemory);
  }

  /**
   * Simulate a sleep cycle: consolidate memories and prune.
   */
  async sleepCycle(): Promise<{ consolidated: number; prunedLtm: number; prunedAvoidance: number }> {
    // 1. Consolidate STM to LTM (though we already do it, we can enrich it here)
    const stmItems = this.stm.drain();
    
    // 2. Prune LTM
    const prunedLtm = await this.ltm.pruneOld();

    // 3. Prune Avoidance Map
    const countBefore = 0; // We'd need to add a size() to AvoidanceMap to track this accurately
    this.avoidance.pruneWeak();

    // 4. Decay endocrine state
    this.endocrine.decay();

    return {
      consolidated: stmItems.length,
      prunedLtm,
      prunedAvoidance: 0 // Placeholder
    };
  }

  /**
   * Determines the operation mode before sending to the AI.
   * Mirrors AndroidAIBrain.processInput() routing logic.
   */
  async resolveOperationMode(input: string): Promise<OperationMode> {
    const { corrected } = this.associative.processInput(input);

    // 1. Reflex arc — fastest check, no async needed
    if (this.pain.shouldAvoid(corrected)) return 'INSTINCT_AVOID';

    // 2. Hormonal state
    const processingMode = this.endocrine.getProcessingMode();
    if (processingMode === 'REACTIVE') return 'EMERGENCY_SAFE';

    // 3. Analytical reasoning — check history and risk tolerance
    const relevantExperiences = await this.ltm.findSimilar(corrected, 3);
    const hasNegativeHistory = relevantExperiences.some(e => e.emotionalWeight < -0.3);
    const riskTolerance = this.endocrine.getRiskTolerance();
    if (hasNegativeHistory && riskTolerance < 0.3) return 'CAUTIOUS';

    return 'NORMAL';
  }

  /**
   * Records feedback after an action executes — maps success/failure to pain or reward.
   */
  async processFeedback(context: string, success: boolean, errorIntensity = 0.5): Promise<void> {
    if (!success) {
      await this.pain.processPainSignal(PainType.BUILD_FAILURE, errorIntensity, context);
    } else {
      await this.recordInteraction(context, '', 'success');
    }
  }

  getPainPathway() {
    return this.pain;
  }

  getEndocrineState() {
    return this.endocrine.getState();
  }

  getAssociativeLayer() {
    return this.associative;
  }
}

export const brainService = new BrainService();
