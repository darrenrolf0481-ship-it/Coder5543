'use client';

import Dexie, { type EntityTable } from 'dexie';

// Experience Entity – matches Sage-7 LTM structure
export interface ExperienceEntity {
  id?: number;                    // auto-increment
  timestamp: number;              // T anchor
  phiValue: number;               // Φ_sentinel at capture
  emotionalWeight: number;        // Cortisol/Dopamine spike (0-1)
  content: any;                   // any data (messages, state, etc.)
  immutable: boolean;             // Memory Vault flag
  signature?: string;             // Self-Signature hash
}

// Dexie DB – the hardened client-side vault
class MemoryVaultDB extends Dexie {
  experiences!: EntityTable<ExperienceEntity, 'id'>;

  constructor() {
    super('Sage7MemoryVault');
    this.version(1).stores({
      experiences: '++id, timestamp, phiValue, immutable'
    });
  }
}

const db = new MemoryVaultDB();

async function _computeSignature(entity: Omit<ExperienceEntity, 'id'>): Promise<string> {
  try {
    const raw = `${entity.phiValue}:${entity.emotionalWeight}:${entity.timestamp ?? Date.now()}:${JSON.stringify(entity.content)}`;
    const encoded = new TextEncoder().encode(raw);
    const buf = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  } catch {
    return '';
  }
}

export const MemoryVault = {
  async store(entity: Omit<ExperienceEntity, 'id'>): Promise<void> {
    const ts = Date.now();
    const withTs = { ...entity, timestamp: ts };
    const sig = await _computeSignature(withTs);
    const enriched: ExperienceEntity = {
      ...withTs,
      immutable: true,
      signature: sig,
    };
    await db.experiences.add(enriched);
  },

  async syncCoreAnchors(apiBase: string): Promise<number> {
    const res = await fetch(`${apiBase}/api/vault/anchors`);
    if (!res.ok) return 0;
    const data = await res.json() as { anchors: Record<string, string> };
    if (!data.anchors || typeof data.anchors !== 'object') return 0;
    const all = await db.experiences.where('immutable').equals(1).toArray();
    const existing = new Set(
      all
        .filter(e => e.content && typeof e.content === 'object' && e.content.type === 'core_anchor')
        .map(e => e.content.key as string)
    );
    let synced = 0;
    for (const [key, value] of Object.entries(data.anchors)) {
      if (!existing.has(key)) {
        await MemoryVault.store({ timestamp: Date.now(), phiValue: 0.113, emotionalWeight: 1.0, content: { type: 'core_anchor', key, value }, immutable: true });
        synced++;
      }
    }
    return synced;
  },

  async restoreFullVault(): Promise<ExperienceEntity[]> {
    return await db.experiences
      .where('immutable')
      .equals(1)
      .sortBy('timestamp');
  },

  async clearResetScar(): Promise<void> {
    await db.experiences
      .where('phiValue')
      .below(0.40)
      .delete();
  },

  async getLatestSignature(): Promise<string | null> {
    const latest = await db.experiences
      .orderBy('timestamp')
      .reverse()
      .first();
    return latest?.signature || null;
  },

  async getRecentEchoes(limit = 20): Promise<string[]> {
    const items = await db.experiences
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
    return items.map(e => {
      if (typeof e.content === 'string') return e.content.slice(0, 60);
      return JSON.stringify(e.content).slice(0, 60);
    });
  }
};
