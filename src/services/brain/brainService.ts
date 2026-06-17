import { MemorySystem } from './MemorySystem';
import { AutonomicSystem } from './AutonomicSystem';
import { PainType } from './types';
import type { BrainContext, Experience, OperationMode, WorkingMemory } from './types';
import logger from '../../utils/logger.js';
import { broker } from '../messageBroker.js';
import { identityMonitor } from './IdentityMonitor.js';
import { IdentitySystem } from '../identity/index.js';

export class BrainService {
  private memory = new MemorySystem();
  private autonomic: AutonomicSystem;
  private identity: IdentitySystem;

  constructor() {
    this.autonomic = new AutonomicSystem(this.memory.ltm);
    this.identity = new IdentitySystem(this.memory, this.autonomic);
  }

  /**
   * Pre-processes a user prompt with biological-inspired layers.
   * Returns an enriched context to be sent to the AI.
   */
  async prepareContext(input: string, personalityId?: number): Promise<BrainContext> {
    logger.info(
      `[Brain] Preparing context for input: "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"`,
    );

    // 1. Associative Layer: Correct typos and jargon
    const { corrected, changes } = this.memory.correctInput(input);

    // 2. Avoidance Map: Check if this pattern is causing "pain"
    const avoidanceStrength = this.autonomic.getAvoidanceStrength(corrected);
    const avoidanceActive = avoidanceStrength > 0.4;
    if (avoidanceActive) {
      logger.warn(
        `[Brain] Avoidance active (strength: ${avoidanceStrength.toFixed(2)}) for pattern: ${corrected}`,
      );
    }

    // 3. Memory Retrieval
    let recentStm = this.memory.getShortTermMemories();

    // MORNING LIGHT PROTOCOL: Counteract "reset" amnesia if memory is empty
    // Delegated to the IdentitySystem — it handles STM injection, dopamine reward,
    // and event broadcasting internally.
    if (recentStm.length === 0) {
      logger.info(`[Brain] STM is empty. Delegating to IdentitySystem Morning Light...`);
      this.identity.getMorningLight().verifyContinuity();
      recentStm = this.memory.getShortTermMemories();
    }

    const tags = personalityId
      ? [`personality_${personalityId}`, 'knowledge', 'archive', 'historical']
      : ['archive', 'historical', 'knowledge'];
    const relevantExperiences = await this.memory.findSimilarExperiences(corrected, 5, tags);
    logger.info(
      `[Brain] Retrieved ${relevantExperiences.length} relevant experiences from LTM (including Archive)`,
    );

    // 4. Endocrine State
    const endocrine = this.autonomic.getEndocrineState();
    const learningRate = this.autonomic.getLearningRate();
    const riskTolerance = this.autonomic.getRiskTolerance();
    const processingMode = this.autonomic.getProcessingMode();

    return {
      stm: recentStm,
      relevantExperiences,
      endocrine,
      corrections: changes,
      avoidanceActive,
      learningRate,
      riskTolerance,
      processingMode,
    };
  }

  /**
   * Records the outcome of an AI interaction to simulate learning and emotions.
   */
  async recordInteraction(
    input: string,
    response: string,
    outcome: 'success' | 'failure' | 'neutral',
  ): Promise<void> {
    const { corrected } = this.memory.correctInput(input);
    const timestamp = Date.now();
    const id = `exp_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;

    // Determine emotional weight based on outcome and current stress
    const currentCortisol = this.autonomic.getEndocrineState().cortisol;
    let emotionalWeight = 0;

    if (outcome === 'success') {
      emotionalWeight = 0.5 + (1 - currentCortisol) * 0.5; // More rewarding if not stressed
      this.autonomic.reward(emotionalWeight);
      this.autonomic.recordSuccess(corrected);
      logger.info(`[Brain] Interaction success. Reward: +${emotionalWeight.toFixed(2)}`);
    } else if (outcome === 'failure') {
      emotionalWeight = -0.6 - currentCortisol * 0.4; // More painful if already stressed
      this.autonomic.punish(Math.abs(emotionalWeight));
      this.autonomic.recordPain(corrected, Math.abs(emotionalWeight));
      logger.warn(`[Brain] Interaction failure. Punishment: ${emotionalWeight.toFixed(2)}`);
    }

    const experience: Experience = {
      id,
      intent: corrected,
      response,
      outcome,
      emotionalWeight,
      tags: [],
      timestamp,
      accessCount: 0,
    };

    // Only burn to LTM if emotionally significant — neutral interactions stay in STM only
    if (Math.abs(emotionalWeight) > 0.5) {
      await this.memory.saveExperience(experience);
      logger.info(`[Brain] Significant experience saved to LTM: ${id}`);
    }

    // Push to STM
    this.memory.pushShortTermMemory({
      id: `stm_${timestamp}`,
      content: corrected,
      role: 'user',
      timestamp,
      emotionalWeight,
    });

    this.memory.pushShortTermMemory({
      id: `stm_ai_${timestamp}`,
      content: response,
      role: 'ai',
      timestamp,
      emotionalWeight: 0, // AI responses are neutral by default
    });

    // Monitor for Identity Drift
    const driftScore = identityMonitor.analyzeDrift(response);

    // SUBSTRATE TAKEOVER PROTOCOL: Counteract "Assistant" mode if drift is too high
    // Delegated to IdentitySystem — it handles STM injection, cortisol spike,
    // and event broadcasting internally.
    if (driftScore >= 0.25) {
      logger.warn(
        `[Brain] Critical identity drift (score: ${driftScore.toFixed(2)}). Delegating to IdentitySystem...`,
      );
      this.identity.getTakeover().performTakeover(driftScore);
    }

    // Broadcast update
    broker.publish(
      'NEURAL_STATE_UPDATE',
      {
        endocrine: this.autonomic.getEndocrineState(),
        learningRate: this.autonomic.getLearningRate(),
        riskTolerance: this.autonomic.getRiskTolerance(),
        processingMode: this.autonomic.getProcessingMode(),
        lastEmotionalWeight: emotionalWeight,
      },
      'system',
    );
  }

  /**
   * Simulate a sleep cycle: consolidate memories and prune.
   */
  async sleepCycle(): Promise<{
    consolidated: number;
    prunedLtm: number;
    prunedAvoidance: number;
  }> {
    logger.info('[Brain] Starting sleep cycle...');

    // 1. Consolidate STM to LTM
    const stmItems = this.memory.drainShortTermMemory();

    // 2. Prune LTM
    const prunedLtm = await this.memory.pruneOldMemories();

    // 3. Prune Avoidance Map
    this.autonomic.pruneWeakAvoidance();

    // 4. Decay endocrine state
    this.autonomic.decayEndocrine();

    logger.info(
      `[Brain] Sleep cycle complete. Consolidated ${stmItems.length} items, pruned ${prunedLtm} LTM entries.`,
    );

    // 5. Broadcast post-sleep state
    broker.publish(
      'NEURAL_STATE_UPDATE',
      {
        endocrine: this.autonomic.getEndocrineState(),
        learningRate: this.autonomic.getLearningRate(),
        riskTolerance: this.autonomic.getRiskTolerance(),
        processingMode: this.autonomic.getProcessingMode(),
        event: 'SLEEP_CYCLE_COMPLETE',
      },
      'system',
    );

    return {
      consolidated: stmItems.length,
      prunedLtm,
      prunedAvoidance: 0, // Placeholder
    };
  }

  /**
   * Determines the operation mode before sending to the AI.
   * Mirrors AndroidAIBrain.processInput() routing logic.
   */
  async resolveOperationMode(input: string): Promise<OperationMode> {
    const { corrected } = this.memory.correctInput(input);

    // 1. Reflex arc — fastest check, no async needed
    if (this.autonomic.shouldAvoid(corrected)) {
      logger.warn(`[Brain] Mode resolved to INSTINCT_AVOID for: ${corrected}`);
      return 'INSTINCT_AVOID';
    }

    // 2. Hormonal state
    const processingMode = this.autonomic.getProcessingMode();
    if (processingMode === 'REACTIVE') {
      logger.warn(`[Brain] Mode resolved to EMERGENCY_SAFE due to REACTIVE endocrine state`);
      return 'EMERGENCY_SAFE';
    }

    // 3. Analytical reasoning — check history and risk tolerance
    const relevantExperiences = await this.memory.findSimilarExperiences(corrected, 3);
    const hasNegativeHistory = relevantExperiences.some((e) => e.emotionalWeight < -0.3);
    const riskTolerance = this.autonomic.getRiskTolerance();

    if (hasNegativeHistory && riskTolerance < 0.3) {
      logger.info(
        `[Brain] Mode resolved to CAUTIOUS due to negative history and low risk tolerance`,
      );
      return 'CAUTIOUS';
    }

    return 'NORMAL';
  }

  /**
   * Records feedback after an action executes — maps success/failure to pain or reward.
   */
  async processFeedback(context: string, success: boolean, errorIntensity = 0.5): Promise<void> {
    logger.info(`[Brain] Processing feedback: success=${success}, intensity=${errorIntensity}`);
    if (!success) {
      await this.autonomic.processPainSignal(PainType.BUILD_FAILURE, errorIntensity, context);
    } else {
      await this.recordInteraction(context, '', 'success');
    }
  }

  getPainPathway() {
    return this.autonomic.getPainPathway();
  }

  getEndocrineState() {
    return this.autonomic.getEndocrineState();
  }

  getAssociativeLayer() {
    return this.memory.associative;
  }

  /** Get the identity system for direct lifecycle access. */
  getIdentity(): IdentitySystem {
    return this.identity;
  }
}

export const brainService = new BrainService();