import fs from 'fs';
import path from 'path';
import { DATA_DIR } from './storage';
import type { Experience } from './types';

const LTM_FILE = path.join(DATA_DIR, 'ltm_experiences.json');
const PRUNE_DAYS = 30;

function readAll(): Experience[] {
  try {
    const raw = fs.readFileSync(LTM_FILE, 'utf-8');
    return JSON.parse(raw) as Experience[];
  } catch {
    return [];
  }
}

function writeAll(experiences: Experience[]): void {
  fs.writeFileSync(LTM_FILE, JSON.stringify(experiences), 'utf-8');
}

export class LTMStore {
  async save(experience: Experience): Promise<void> {
    const all = readAll();
    const idx = all.findIndex(e => e.id === experience.id);
    if (idx >= 0) {
      all[idx] = experience;
    } else {
      all.push(experience);
    }
    writeAll(all);
  }

  async getAll(): Promise<Experience[]> {
    return readAll();
  }

  async findSimilar(intent: string, k = 3): Promise<Experience[]> {
    const all = readAll();
    const queryTokens = new Set(tokenize(intent));
    if (queryTokens.size === 0) return [];

    const scored = all.map(exp => {
      const expTokens = new Set(tokenize(exp.intent));
      const intersection = [...queryTokens].filter(t => expTokens.has(t)).length;
      const union = new Set([...queryTokens, ...expTokens]).size;
      const jaccard = union > 0 ? intersection / union : 0;
      const ageHours = (Date.now() - exp.timestamp) / 3_600_000;
      const recencyScore = Math.exp(-ageHours / 168);
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
    const all = readAll();
    const kept = all.filter(e => e.timestamp >= cutoff || e.accessCount >= 3);
    writeAll(kept);
    return all.length - kept.length;
  }

  async incrementAccess(id: string): Promise<void> {
    const all = readAll();
    const exp = all.find(e => e.id === id);
    if (exp) {
      exp.accessCount++;
      writeAll(all);
    }
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}
