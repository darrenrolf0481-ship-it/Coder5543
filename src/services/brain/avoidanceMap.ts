import { storage } from './storage';
import type { AvoidanceEntry } from './types';

const STORAGE_KEY = 'brain_avoidance';
const DECAY_HALF_LIFE_HOURS = 72; // strength halves every 3 days
const AVOIDANCE_THRESHOLD = 0.4;

function hashPattern(pattern: string): string {
  // Simple djb2 hash, good enough for this purpose
  let h = 5381;
  for (let i = 0; i < pattern.length; i++) {
    h = ((h << 5) + h) + pattern.charCodeAt(i);
    h = h & h; // 32-bit
  }
  return (h >>> 0).toString(36);
}

function normalizePattern(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .sort()
    .join(' ');
}

function decayedStrength(entry: AvoidanceEntry): number {
  const hoursElapsed = (Date.now() - entry.lastTriggered) / 3_600_000;
  return entry.strength * Math.pow(0.5, hoursElapsed / DECAY_HALF_LIFE_HOURS);
}

export class AvoidanceMap {
  private map: Map<string, AvoidanceEntry> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const entries: AvoidanceEntry[] = JSON.parse(raw);
        entries.forEach(e => this.map.set(e.hash, e));
      }
    } catch { /* ignore */ }
  }

  private persist(): void {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify([...this.map.values()]));
    } catch { /* ignore */ }
  }

  // Record a painful/failed interaction to build avoidance
  recordPain(input: string, magnitude = 1.0): void {
    const pattern = normalizePattern(input);
    const hash = hashPattern(pattern);
    const existing = this.map.get(hash);
    if (existing) {
      existing.strength = Math.min(1, decayedStrength(existing) + 0.3 * magnitude);
      existing.count++;
      existing.lastTriggered = Date.now();
    } else {
      this.map.set(hash, { hash, pattern, strength: 0.3 * magnitude, count: 1, lastTriggered: Date.now() });
    }
    this.persist();
  }

  // Returns true if this input pattern should be avoided (strength above threshold)
  shouldAvoid(input: string): boolean {
    const pattern = normalizePattern(input);
    const hash = hashPattern(pattern);
    const entry = this.map.get(hash);
    if (!entry) return false;
    return decayedStrength(entry) >= AVOIDANCE_THRESHOLD;
  }

  // Returns the avoidance strength (0 = none, 1 = maximum)
  getStrength(input: string): number {
    const pattern = normalizePattern(input);
    const hash = hashPattern(pattern);
    const entry = this.map.get(hash);
    if (!entry) return 0;
    return decayedStrength(entry);
  }

  // Positive outcome for a pattern reduces its avoidance strength
  recordSuccess(input: string): void {
    const pattern = normalizePattern(input);
    const hash = hashPattern(pattern);
    const entry = this.map.get(hash);
    if (entry) {
      entry.strength = Math.max(0, decayedStrength(entry) - 0.2);
      if (entry.strength < 0.05) { this.map.delete(hash); }
      this.persist();
    }
  }

  pruneWeak(): void {
    for (const [key, entry] of this.map.entries()) {
      if (decayedStrength(entry) < 0.05) this.map.delete(key);
    }
    this.persist();
  }
}
