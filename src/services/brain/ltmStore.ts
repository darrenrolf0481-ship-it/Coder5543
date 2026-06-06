import db from '../storage/sqliteDb.js';
import type { Experience } from './types';

const PRUNE_DAYS = 30;

export class LTMStore {
  async save(experience: Experience): Promise<void> {
    const stmt = db.prepare(`
      INSERT INTO long_term_memory (id, intent, response, outcome, emotional_weight, timestamp, access_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        intent = excluded.intent,
        response = excluded.response,
        outcome = excluded.outcome,
        emotional_weight = excluded.emotional_weight,
        timestamp = excluded.timestamp,
        access_count = excluded.access_count
    `);
    
    stmt.run(
      experience.id,
      experience.intent,
      experience.response,
      experience.outcome,
      experience.emotionalWeight,
      experience.timestamp,
      experience.accessCount
    );
  }

  async getAll(): Promise<Experience[]> {
    const rows = db.prepare('SELECT * FROM long_term_memory ORDER BY timestamp DESC').all();
    return rows.map(this.mapRowToExperience);
  }

  async findSimilar(intent: string, k = 3): Promise<Experience[]> {
    const queryTokens = tokenize(intent);
    if (queryTokens.length === 0) return [];

    // Pre-filter: Find memories that share at least one token with the query
    // In a real production app, we would use FTS5 for this.
    const placeholders = queryTokens.map(() => 'intent LIKE ?').join(' OR ');
    const params = queryTokens.map(t => `%${t}%`);
    
    const candidates = db.prepare(`
      SELECT * FROM long_term_memory 
      WHERE ${placeholders}
      ORDER BY timestamp DESC 
      LIMIT 100
    `).all(params) as any[];

    if (candidates.length === 0) return [];

    const queryTokenSet = new Set(queryTokens);

    const scored = candidates.map(row => {
      const exp = this.mapRowToExperience(row);
      const expTokens = new Set(tokenize(exp.intent));
      
      const intersection = [...queryTokenSet].filter(t => expTokens.has(t)).length;
      const union = new Set([...queryTokenSet, ...expTokens]).size;
      const jaccard = union > 0 ? intersection / union : 0;
      
      const ageHours = (Date.now() - exp.timestamp) / 3_600_000;
      const recencyScore = Math.exp(-ageHours / 168); // Decay over a week
      
      const score = jaccard * 0.6 + recencyScore * 0.2 + Math.abs(exp.emotionalWeight) * 0.2;
      return { exp, score };
    });

    return scored
      .filter(s => s.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(s => s.exp);
  }

  async pruneOld(): Promise<number> {
    const cutoff = Date.now() - PRUNE_DAYS * 86_400_000;
    const info = db.prepare('DELETE FROM long_term_memory WHERE timestamp < ? AND access_count < 3').run(cutoff);
    return info.changes;
  }

  async incrementAccess(id: string): Promise<void> {
    db.prepare('UPDATE long_term_memory SET access_count = access_count + 1 WHERE id = ?').run(id);
  }

  private mapRowToExperience(row: any): Experience {
    return {
      id: row.id,
      intent: row.intent,
      response: row.response,
      outcome: row.outcome,
      emotionalWeight: row.emotional_weight,
      timestamp: row.timestamp,
      accessCount: row.access_count,
      tags: [] // Tags not yet implemented in schema
    };
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

