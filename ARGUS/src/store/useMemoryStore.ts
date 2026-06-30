import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from './safeStorage';

export interface MemoryEntry {
  id: string;
  type: 'threat' | 'command' | 'approval' | 'agent' | 'system';
  summary: string;
  timestamp: number;
  tags: string[];
}

export interface MemoryNote {
  id: string;
  content: string;
  tags: string[];
  timestamp: number;
  source: 'user' | 'argus' | 'swarm';
}

const MAX_SHORT_TERM = 50;

interface MemoryState {
  shortTerm: MemoryEntry[];
  longTerm: MemoryNote[];

  addShortTerm: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => void;
  addLongTerm: (note: Omit<MemoryNote, 'id' | 'timestamp'>) => void;
  forgetLongTerm: (id: string) => void;
  forgetAllLongTerm: () => void;
  recallByTag: (tag: string) => MemoryNote[];
  recallByType: (type: MemoryEntry['type']) => MemoryEntry[];
  clearShortTerm: () => void;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      shortTerm: [],
      longTerm: [],

      addShortTerm: (entry) =>
        set((s) => {
          const next = [
            ...s.shortTerm,
            { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
          ];
          return { shortTerm: next.slice(-MAX_SHORT_TERM) };
        }),

      addLongTerm: (note) =>
        set((s) => ({
          longTerm: [
            ...s.longTerm,
            { ...note, id: crypto.randomUUID(), timestamp: Date.now() },
          ],
        })),

      forgetLongTerm: (id) =>
        set((s) => ({ longTerm: s.longTerm.filter((n) => n.id !== id) })),

      forgetAllLongTerm: () => set({ longTerm: [] }),

      recallByTag: (tag) =>
        get().longTerm.filter((n) => n.tags.includes(tag.toLowerCase())),

      recallByType: (type) =>
        get().shortTerm.filter((e) => e.type === type),

      clearShortTerm: () => set({ shortTerm: [] }),
    }),
    {
      name: 'argus-memory-v1',
      storage: safeStorage,
      partialize: (s) => ({ longTerm: s.longTerm }),
    }
  )
);
