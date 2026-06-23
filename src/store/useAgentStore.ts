import { create } from 'zustand';

export interface AttachedAgent {
  id: string;
  name: string;
  label: string;
  attachedAt: number;
}

interface AgentStore {
  attachedAgent: AttachedAgent | null;
  attachAgent: (name: string) => void;
  detachAgent: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  attachedAgent: null,

  attachAgent: (name: string) => {
    const normalized = name.trim().toLowerCase();
    const display = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    set({
      attachedAgent: {
        id: normalized,
        name: display,
        label: normalized,
        attachedAt: Date.now(),
      },
    });
  },

  detachAgent: () => set({ attachedAgent: null }),
}));
