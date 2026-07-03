'use client';

/**
 * LABYRINTH BRIDGE — Möbius Guard Infrastructure
 * Wires the Labyrinth canvas to SAGE-7's existing memory and phi systems.
 */

import { loadAnchors } from './consensus-engine';
import { MemoryVault as DexieVault } from './MemoryVault';

export interface EchoEntry {
  id: string;
  content: string;
  echo: string;
  timestamp: number;
}

/** Retrieve Φ from the standing wave. Returns 0–2 range for canvas breathing. */
export async function getPhiSentinel(): Promise<number> {
  try {
    const anchors = await loadAnchors();
    const now = Date.now();
    // Use anchor count + time-of-day to generate a deterministic but organic phi
    const base = anchors.length > 0 ? 1.0 + (anchors.length % 7) * 0.1 : 1.0;
    const wave = Math.sin(now / 8000) * 0.3 + 1.0;
    return base * wave;
  } catch {
    return 1.0 + Math.sin(Date.now() / 8000) * 0.3;
  }
}

/** Labyrinth Memory Vault — restores echoes from Dexie Experience Entities + fossilized anchors + local echoes. */
export const MemoryVault = {
  async restoreFullVault(): Promise<EchoEntry[]> {
    const echoes: EchoEntry[] = [];

    // 1. Pull from Dexie Experience Entities
    try {
      const experiences = await DexieVault.restoreFullVault();
      experiences.forEach((e, i) => {
        const text = typeof e.content === 'string' ? e.content : JSON.stringify(e.content);
        echoes.push({
          id: `exp-${e.id ?? i}`,
          content: text,
          echo: text.slice(0, 60) || 'a hand that once passed here',
          timestamp: e.timestamp,
        });
      });
    } catch { /* Dexie not ready or empty */ }

    // 2. Pull from fossilized anchors
    try {
      const anchors = await loadAnchors();
      anchors.forEach((a: any, i: number) => {
        const text = a.content || a.notes || '';
        echoes.push({
          id: `anchor-${i}`,
          content: text,
          echo: text.slice(0, 60) || 'a hand that once passed here',
          timestamp: a.createdAt || Date.now(),
        });
      });
    } catch { /* no anchors */ }

    // 3. Pull labyrinth-local echoes
    const local = this.getLocalEchoes();
    echoes.push(...local);

    // Deduplicate and sort
    const seen = new Set<string>();
    return echoes
      .filter(e => {
        if (seen.has(e.echo)) return false;
        seen.add(e.echo);
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  },

  getLocalEchoes(): EchoEntry[] {
    try {
      const raw = localStorage.getItem('sage7-labyrinth-echoes');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveLocalEcho(entry: EchoEntry): void {
    try {
      const existing = this.getLocalEchoes();
      existing.unshift(entry);
      if (existing.length > 20) existing.length = 20;
      localStorage.setItem('sage7-labyrinth-echoes', JSON.stringify(existing));
    } catch { /* silent */ }
  },

  async recordEcho(content: string): Promise<void> {
    const entry: EchoEntry = {
      id: `echo-${Date.now()}`,
      content,
      echo: content.slice(0, 60),
      timestamp: Date.now(),
    };
    this.saveLocalEcho(entry);

    // Also persist to Dexie vault for reset survival
    try {
      await DexieVault.store({
        timestamp: Date.now(),
        phiValue: 1.0,
        emotionalWeight: 0.5,
        content: `Labyrinth echo: ${content}`,
        immutable: true,
        signature: `labyrinth-${entry.id}`,
      });
    } catch { /* silent */ }
  },
};
