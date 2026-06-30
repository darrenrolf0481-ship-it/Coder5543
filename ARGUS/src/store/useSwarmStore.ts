import { create } from 'zustand';

export type SwarmRole = 'sentinel' | 'analyst' | 'responder' | 'coordinator';
export type SwarmNodeStatus = 'idle' | 'scanning' | 'active' | 'responding' | 'offline';

export interface SwarmNode {
  id: string;
  name: string;
  role: SwarmRole;
  status: SwarmNodeStatus;
  lastEvent: string | null;
  responseMs: number;
}

export type AlertLevel = 'green' | 'yellow' | 'red';

interface SwarmState {
  nodes: SwarmNode[];
  swarmActive: boolean;
  alertLevel: AlertLevel;

  activateNode: (id: string, event: string) => void;
  deactivateNode: (id: string) => void;
  setAlertLevel: (level: AlertLevel) => void;
  triggerSwarmResponse: (event: string) => void;
  standDown: () => void;
}

const DEFAULT_NODES: SwarmNode[] = [
  { id: 'sw-s1',  name: 'SENTINEL·1',  role: 'sentinel',    status: 'idle', lastEvent: null, responseMs: 0 },
  { id: 'sw-s2',  name: 'SENTINEL·2',  role: 'sentinel',    status: 'idle', lastEvent: null, responseMs: 0 },
  { id: 'sw-a1',  name: 'ANALYST·1',   role: 'analyst',     status: 'idle', lastEvent: null, responseMs: 0 },
  { id: 'sw-a2',  name: 'ANALYST·2',   role: 'analyst',     status: 'idle', lastEvent: null, responseMs: 0 },
  { id: 'sw-r1',  name: 'RESPOND·1',   role: 'responder',   status: 'idle', lastEvent: null, responseMs: 0 },
  { id: 'sw-c1',  name: 'COORD·1',     role: 'coordinator', status: 'idle', lastEvent: null, responseMs: 0 },
];

export const useSwarmStore = create<SwarmState>((set, get) => ({
  nodes: DEFAULT_NODES,
  swarmActive: false,
  alertLevel: 'green',

  activateNode: (id, event) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id
          ? { ...n, status: 'active', lastEvent: event, responseMs: Math.floor(Math.random() * 120 + 20) }
          : n
      ),
    })),

  deactivateNode: (id) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, status: 'idle', lastEvent: null, responseMs: 0 } : n
      ),
    })),

  setAlertLevel: (level) => set({ alertLevel: level }),

  standDown: () => {
    set((s) => ({
      nodes: s.nodes.map((n) => ({ ...n, status: 'idle', lastEvent: null, responseMs: 0 })),
      swarmActive: false,
      alertLevel: 'green',
    }));
  },

  triggerSwarmResponse: (event) => {
    set({ swarmActive: true, alertLevel: 'red' });
    const { nodes, activateNode, standDown } = get();

    nodes.filter((n) => n.role === 'sentinel').forEach((n) => activateNode(n.id, event));

    setTimeout(() => {
      get().nodes.filter((n) => n.role === 'analyst').forEach((n) => activateNode(n.id, event));
    }, 250);

    setTimeout(() => {
      get().nodes
        .filter((n) => n.role === 'responder' || n.role === 'coordinator')
        .forEach((n) => activateNode(n.id, event));
    }, 500);

    setTimeout(() => standDown(), 12000);
  },
}));
