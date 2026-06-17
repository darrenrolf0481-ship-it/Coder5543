import { storage } from './storage';
import { vectorService } from './vectorService';
import type { Experience } from './types';

const STORAGE_KEY = 'brain_ltm_experiences';
const PRUNE_DAYS = 30;

function readAll(): Experience[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(experiences: Experience[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(experiences));
}

// A promise-based execution queue to serialize all database operations
class PromiseQueue {
  private queue = Promise.resolve();

  enqueue<T>(operation: () => Promise<T> | T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

const dbQueue = new PromiseQueue();

export class LTMStore {
  async save(experience: Experience): Promise<void> {
    // Ensure embedding exists for semantic search
    if (!experience.embedding) {
      experience.embedding = await vectorService.getEmbedding(experience.intent);
    }

    return dbQueue.enqueue(() => {
      const all = readAll();
      const idx = all.findIndex((e) => e.id === experience.id);
      if (idx >= 0) {
        all[idx] = experience;
      } else {
        all.push(experience);
      }
      writeAll(all);
    });
  }

  async getAll(): Promise<Experience[]> {
    return dbQueue.enqueue(() => {
      return readAll();
    });
  }

  async findSimilar(intent: string, k = 3, tags?: string[]): Promise<Experience[]> {
    const queryEmbedding = await vectorService.getEmbedding(intent);
    const queryTokens = new Set(tokenize(intent));

    return dbQueue.enqueue(() => {
      let all = readAll();

      // Filter by tags if provided
      if (tags && tags.length > 0) {
        all = all.filter((exp) => tags.some((t) => exp.tags.includes(t)));
      }

      if (queryTokens.size === 0 && queryEmbedding.length === 0) return [];

      const scored = all.map((exp) => {
        let similarity = 0;

        // 1. Semantic Similarity (Primary)
        if (queryEmbedding.length > 0 && exp.embedding && exp.embedding.length > 0) {
          similarity = vectorService.cosineSimilarity(queryEmbedding, exp.embedding);
        } else {
          // 2. Jaccard Similarity (Fallback)
          const expTokens = new Set(tokenize(exp.intent));
          const intersection = [...queryTokens].filter((t) => expTokens.has(t)).length;
          const union = new Set([...queryTokens, ...expTokens]).size;
          similarity = union > 0 ? intersection / union : 0;
        }

        const ageHours = (Date.now() - exp.timestamp) / 3_600_000;
        const recencyScore = Math.exp(-ageHours / 168);

        // Hybrid Score: 70% similarity, 15% recency, 15% emotional weight
        const score = similarity * 0.7 + recencyScore * 0.15 + Math.abs(exp.emotionalWeight) * 0.15;
        return { exp, score };
      });

      const results = scored
        .filter((s) => s.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((s) => s.exp);

      // Log access for these memories
      results.forEach((r) => {
        const exp = all.find((e) => e.id === r.id);
        if (exp) exp.accessCount++;
      });
      if (results.length > 0) writeAll(all);

      return results;
    });
  }

  async pruneOld(): Promise<number> {
    return dbQueue.enqueue(() => {
      const cutoff = Date.now() - PRUNE_DAYS * 86_400_000;
      const all = readAll();
      const kept = all.filter((e) => e.timestamp >= cutoff || e.accessCount >= 3);
      writeAll(kept);
      return all.length - kept.length;
    });
  }

  async incrementAccess(id: string): Promise<void> {
    return dbQueue.enqueue(() => {
      const all = readAll();
      const exp = all.find((e) => e.id === id);
      if (exp) {
        exp.accessCount++;
        writeAll(all);
      }
    });
  }
}

export const ltmStore = new LTMStore();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}
