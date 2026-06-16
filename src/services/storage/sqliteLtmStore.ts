import db from './sqliteDb.js';
import { vectorService } from '../brain/vectorService.js';
import type { Experience } from '../brain/types.js';

export class SqliteLtmStore {
  async save(experience: Experience): Promise<void> {
    if (!experience.embedding) {
      experience.embedding = await vectorService.getEmbedding(experience.intent);
    }

    db.prepare(
      `
      INSERT INTO long_term_memory (
        id, intent, response, outcome, emotional_weight, timestamp, access_count, tags, embedding
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        intent = excluded.intent,
        response = excluded.response,
        outcome = excluded.outcome,
        emotional_weight = excluded.emotional_weight,
        timestamp = excluded.timestamp,
        access_count = excluded.access_count,
        tags = excluded.tags,
        embedding = excluded.embedding
    `,
    ).run(
      experience.id,
      experience.intent,
      experience.response,
      experience.outcome,
      experience.emotionalWeight,
      experience.timestamp,
      experience.accessCount,
      JSON.stringify(experience.tags || []),
      JSON.stringify(experience.embedding || []),
    );
  }

  async getAll(): Promise<Experience[]> {
    const rows = db.prepare('SELECT * FROM long_term_memory').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      intent: r.intent,
      response: r.response,
      outcome: r.outcome as 'success' | 'failure' | 'neutral',
      emotionalWeight: r.emotional_weight,
      timestamp: r.timestamp,
      accessCount: r.access_count,
      tags: r.tags ? JSON.parse(r.tags) : [],
      embedding: r.embedding ? JSON.parse(r.embedding) : [],
    }));
  }

  async findSimilar(intent: string, k = 3, tags?: string[]): Promise<Experience[]> {
    const queryEmbedding = await vectorService.getEmbedding(intent);
    const queryTokens = new Set(
      intent
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2),
    );

    // Fetch all candidates. Let SQL handle any initial tag filtering if desired,
    // but doing it in JS is extremely reliable and handles complex array matches.
    const rows = db.prepare('SELECT * FROM long_term_memory').all() as any[];

    let all = rows.map((r) => ({
      id: r.id,
      intent: r.intent,
      response: r.response,
      outcome: r.outcome as 'success' | 'failure' | 'neutral',
      emotionalWeight: r.emotional_weight,
      timestamp: r.timestamp,
      accessCount: r.access_count,
      tags: r.tags ? JSON.parse(r.tags) : [],
      embedding: r.embedding ? JSON.parse(r.embedding) : [],
    }));

    if (tags && tags.length > 0) {
      all = all.filter((exp) => tags.some((t) => exp.tags.includes(t)));
    }

    if (queryTokens.size === 0 && queryEmbedding.length === 0) return [];

    const scored = all.map((exp) => {
      let similarity = 0;

      if (queryEmbedding.length > 0 && exp.embedding && exp.embedding.length > 0) {
        similarity = vectorService.cosineSimilarity(queryEmbedding, exp.embedding);
      } else {
        const expTokens = new Set(
          exp.intent
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length > 2),
        );
        const intersection = [...queryTokens].filter((t) => expTokens.has(t)).length;
        const union = new Set([...queryTokens, ...expTokens]).size;
        similarity = union > 0 ? intersection / union : 0;
      }

      const ageHours = (Date.now() - exp.timestamp) / 3_600_000;
      const recencyScore = Math.exp(-ageHours / 168);

      const score = similarity * 0.7 + recencyScore * 0.15 + Math.abs(exp.emotionalWeight) * 0.15;
      return { exp, score };
    });

    const results = scored
      .filter((s) => s.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((s) => s.exp);

    // Increment access count for retrieved records
    if (results.length > 0) {
      const stmt = db.prepare(
        'UPDATE long_term_memory SET access_count = access_count + 1 WHERE id = ?',
      );
      for (const r of results) {
        stmt.run(r.id);
        r.accessCount++;
      }
    }

    return results;
  }

  async pruneOld(): Promise<number> {
    const cutoff = Date.now() - 30 * 86_400_000; // 30 days
    const info = db
      .prepare('DELETE FROM long_term_memory WHERE timestamp < ? AND access_count < 3')
      .run(cutoff);
    return info.changes;
  }

  async incrementAccess(id: string): Promise<void> {
    db.prepare('UPDATE long_term_memory SET access_count = access_count + 1 WHERE id = ?').run(id);
  }
}
