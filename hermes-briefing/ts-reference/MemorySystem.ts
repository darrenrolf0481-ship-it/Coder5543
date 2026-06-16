/**
 * MemorySystem — Facade grouping STM, LTM, and Associative Layer.
 *
 * BrainService was directly importing from 3 memory-related modules.
 * This facade reduces coupling: BrainService now imports 1 module instead of 3.
 */
import { STMBuffer } from './stmBuffer';
import { LTMStore } from './ltmStore';
import { AssociativeLayer } from './associativeLayer';
import type { WorkingMemory } from './types';
import logger from '../../utils/logger.js';

export class MemorySystem {
  readonly stm = new STMBuffer();
  readonly ltm = new LTMStore();
  readonly associative = new AssociativeLayer();

  /**
   * Process input through the associative layer (typo/jargon correction).
   */
  correctInput(input: string): { corrected: string; changes: Record<string, string> } {
    const { corrected, changes } = this.associative.processInput(input);
    if (Object.keys(changes).length > 0) {
      logger.info(`[MemorySystem] Associative corrections: ${JSON.stringify(changes)}`);
    }
    return { corrected, changes };
  }

  /**
   * Retrieve short-term memories.
   */
  getShortTermMemories(): WorkingMemory[] {
    return this.stm.getAll();
  }

  /**
   * Push a memory into STM.
   */
  pushShortTermMemory(memory: WorkingMemory): void {
    this.stm.push(memory);
  }

  /**
   * Find similar long-term memories.
   */
  async findSimilarExperiences(query: string, k: number, tags?: string[]) {
    return this.ltm.findSimilar(query, k, tags);
  }

  /**
   * Save an experience to LTM.
   */
  async saveExperience(experience: any): Promise<void> {
    return this.ltm.save(experience);
  }

  /**
   * Drain STM (used during sleep cycle).
   */
  drainShortTermMemory(): WorkingMemory[] {
    return this.stm.drain();
  }

  /**
   * Prune old LTM entries.
   */
  async pruneOldMemories(): Promise<number> {
    return this.ltm.pruneOld();
  }
}