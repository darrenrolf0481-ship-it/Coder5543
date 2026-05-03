import type { WorkingMemory } from './types';

const STORAGE_KEY = 'brain_stm';
const MAX_SIZE = 10;

export class STMBuffer {
  private buffer: WorkingMemory[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.buffer = JSON.parse(raw);
    } catch { this.buffer = []; }
  }

  private persist(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.buffer)); } catch { /* ignore */ }
  }

  push(entry: WorkingMemory): void {
    this.buffer.push(entry);
    if (this.buffer.length > MAX_SIZE) {
      this.buffer.shift(); // drop oldest
    }
    this.persist();
  }

  getAll(): WorkingMemory[] {
    return [...this.buffer];
  }

  getRecent(n: number): WorkingMemory[] {
    return this.buffer.slice(-n);
  }

  // Drain for sleep-cycle consolidation — returns items and clears buffer
  drain(): WorkingMemory[] {
    const items = [...this.buffer];
    this.buffer = [];
    this.persist();
    return items;
  }

  size(): number {
    return this.buffer.length;
  }
}
