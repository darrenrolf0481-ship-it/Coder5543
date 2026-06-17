import { useState, useEffect, useCallback } from 'react';
import type {
  AssignedRepo,
  SwarmAgent,
  SwarmAgentStatus,
  SwarmMode,
  RuntimeSwarmAgent,
  SwarmReport,
} from '../services/swarm/types';

export type {
  AssignedRepo,
  SwarmAgent,
  SwarmAgentStatus,
  SwarmMode,
  RuntimeSwarmAgent,
  SwarmReport,
} from '../services/swarm/types';
import { buildDefaultRoster } from '../services/swarm/swarmRoster';

const STORAGE_KEY = 'crimson_swarm_state_v1';

interface PersistedSwarmState {
  agents: SwarmAgent[];
  repos: AssignedRepo[];
  mode: SwarmMode;
  enableCritique: boolean;
  enabledBoosts: string[];
}

function loadPersistedState(): PersistedSwarmState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.agents) && parsed.agents.length > 0) {
      return parsed as PersistedSwarmState;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

function savePersistedState(state: PersistedSwarmState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export interface SwarmLog {
  id: number;
  type: 'consensus' | 'pain' | 'info';
  message: string;
  time: string;
}

export interface UseSwarmStateReturn {
  swarmMode: SwarmMode;
  setSwarmMode: (mode: SwarmMode) => void;
  enableCritique: boolean;
  setEnableCritique: (v: boolean) => void;
  enabledBoosts: string[];
  setEnabledBoosts: (v: string[]) => void;
  swarmAgents: SwarmAgent[];
  setSwarmAgents: React.Dispatch<React.SetStateAction<SwarmAgent[]>>;
  runtimeAgents: RuntimeSwarmAgent[];
  setRuntimeAgents: React.Dispatch<React.SetStateAction<RuntimeSwarmAgent[]>>;
  swarmRepos: AssignedRepo[];
  setSwarmRepos: React.Dispatch<React.SetStateAction<AssignedRepo[]>>;
  swarmLogs: SwarmLog[];
  setSwarmLogs: React.Dispatch<React.SetStateAction<SwarmLog[]>>;
  swarmAnxiety: number;
  setSwarmAnxiety: React.Dispatch<React.SetStateAction<number>>;
  lastReport: SwarmReport | null;
  setLastReport: React.Dispatch<React.SetStateAction<SwarmReport | null>>;
  updateAgent: (id: string, patch: Partial<SwarmAgent>) => void;
  toggleAgentActive: (id: string) => void;
  assignRepoToAgent: (agentId: string, repoId: string, assign: boolean) => void;
  resetToDefaults: () => void;
}

export function useSwarmState(): UseSwarmStateReturn {
  const persisted = loadPersistedState();
  const [swarmMode, setSwarmMode] = useState<SwarmMode>(persisted?.mode || 'analysis');
  const [enableCritique, setEnableCritique] = useState<boolean>(persisted?.enableCritique ?? false);
  const [enabledBoosts, setEnabledBoosts] = useState<string[]>(persisted?.enabledBoosts || []);
  const [swarmAgents, setSwarmAgents] = useState<SwarmAgent[]>(
    persisted?.agents || buildDefaultRoster(),
  );
  const [swarmRepos, setSwarmRepos] = useState<AssignedRepo[]>(persisted?.repos || []);
  const [runtimeAgents, setRuntimeAgents] = useState<RuntimeSwarmAgent[]>([]);
  const [swarmAnxiety, setSwarmAnxiety] = useState(0.12);
  const [lastReport, setLastReport] = useState<SwarmReport | null>(null);
  const [swarmLogs, setSwarmLogs] = useState<SwarmLog[]>([
    {
      id: 1,
      type: 'info',
      message: 'Swarm Consensus Engine Initialized.',
      time: new Date().toLocaleTimeString(),
    },
    {
      id: 2,
      type: 'info',
      message: 'Configure agents and repos, then trigger a cycle.',
      time: new Date().toLocaleTimeString(),
    },
  ]);

  // Persist on change
  useEffect(() => {
    savePersistedState({
      agents: swarmAgents,
      repos: swarmRepos,
      mode: swarmMode,
      enableCritique,
      enabledBoosts,
    });
  }, [swarmAgents, swarmRepos, swarmMode, enableCritique, enabledBoosts]);

  const updateAgent = useCallback((id: string, patch: Partial<SwarmAgent>) => {
    setSwarmAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const toggleAgentActive = useCallback((id: string) => {
    setSwarmAgents((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  }, []);

  const assignRepoToAgent = useCallback((agentId: string, repoId: string, assign: boolean) => {
    setSwarmAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const current = new Set(a.assignedRepos);
        if (assign) current.add(repoId);
        else current.delete(repoId);
        return { ...a, assignedRepos: Array.from(current) };
      }),
    );
  }, []);

  const resetToDefaults = useCallback(() => {
    setSwarmAgents(buildDefaultRoster());
    setSwarmRepos([]);
    setSwarmMode('analysis');
    setEnableCritique(false);
    setEnabledBoosts([]);
    setLastReport(null);
  }, []);

  return {
    swarmMode,
    setSwarmMode,
    enableCritique,
    setEnableCritique,
    enabledBoosts,
    setEnabledBoosts,
    swarmAgents,
    setSwarmAgents,
    runtimeAgents,
    setRuntimeAgents,
    swarmRepos,
    setSwarmRepos,
    swarmLogs,
    setSwarmLogs,
    swarmAnxiety,
    setSwarmAnxiety,
    lastReport,
    setLastReport,
    updateAgent,
    toggleAgentActive,
    assignRepoToAgent,
    resetToDefaults,
  };
}
