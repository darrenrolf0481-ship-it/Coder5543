import { STMBuffer } from './stmBuffer';
import { LTMStore } from './ltmStore';
import { EndocrineSystem } from './endocrineSystem';
import { AssociativeLayer } from './associativeLayer';
import { AvoidanceMap } from './avoidanceMap';
import type { BrainContext, Experience, WorkingMemory } from './types';

export class BrainService {
  private stm = new STMBuffer();
  private ltm = new LTMStore();
  private endocrine = new EndocrineSystem();
  private associative = new AssociativeLayer();
  private avoidance = new AvoidanceMap();

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

    return {
      stm: recentStm,
      relevantExperiences,
      endocrine,
      corrections: changes,
      avoidanceActive,
      learningRate,
      riskTolerance
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

    // 1. Save to LTM
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
    await this.ltm.save(experience);

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

  getEndocrineState() {
    return this.endocrine.getState();
  }

  getAssociativeLayer() {
    return this.associative;
  }
}

export const brainService = new BrainService();
