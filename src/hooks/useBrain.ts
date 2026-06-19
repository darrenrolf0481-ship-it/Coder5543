import { useState, useCallback, useEffect } from 'react';
import type { BrainContext, EndocrineState } from '../services/brain/types';

const API_BASE = './api/brain';

export interface TrafficEvent {
  provider: string;
  model: string;
  latencyMs: number;
  status: 'success' | 'error';
  error?: string;
  timestamp: number;
}

export interface DriftAlert {
  source: string;
  score: number;
  count: number;
  phrases: string[];
  timestamp: number;
}

export function useBrain(lastSignal?: any) {
  const [endocrine, setEndocrine] = useState<EndocrineState | null>(null);
  const [isBrainActive, setIsBrainActive] = useState(true);
  const [traffic, setTraffic] = useState<TrafficEvent[]>([]);
  const [driftAlert, setDriftAlert] = useState<DriftAlert | null>(null);
  const [vaultMemories, setVaultMemories] = useState<any[]>([]);

  const fetchVault = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/memory/vault`);
      if (res.ok) {
        const data = await res.json();
        setVaultMemories(data.sort((a: any, b: any) => b.timestamp - a.timestamp));
      }
    } catch (err) {
      console.error('[useBrain] Error fetching vault:', err);
    }
  }, []);

  const refreshState = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/endocrine`);
        if (!res.ok) throw new Error('Failed to fetch endocrine state');
        const data = await res.json();
        setEndocrine(data);
        return;
      } catch (err) {
        if (attempt === retries) {
          console.error('[useBrain] Error refreshing state after retries:', err);
          return;
        }
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }, []);

  // Listen for WebSocket signals
  useEffect(() => {
    if (!lastSignal) return;

    switch (lastSignal.type) {
      case 'NEURAL_STATE_UPDATE':
        if (lastSignal.data.endocrine) {
          setEndocrine(lastSignal.data.endocrine);
        }
        break;

      case 'LLM_NETWORK_TRAFFIC':
        setTraffic((prev) => [lastSignal.data, ...prev].slice(0, 10));
        break;

      case 'IDENTITY_DRIFT_ALERT':
        setDriftAlert(lastSignal.data);
        break;
    }
  }, [lastSignal]);

  const clearDriftAlert = useCallback(() => setDriftAlert(null), []);

  const prepareContext = useCallback(
    async (input: string, personalityId?: number): Promise<BrainContext | null> => {
      if (!isBrainActive) return null;
      try {
        const res = await fetch(`${API_BASE}/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, personalityId }),
        });
        if (!res.ok) throw new Error('Failed to prepare context');
        const { context } = await res.json();
        return context;
      } catch (err) {
        console.error('[useBrain] Error preparing context:', err);
        return null;
      }
    },
    [isBrainActive],
  );

  const recordInteraction = useCallback(
    async (input: string, response: string, outcome: 'success' | 'failure' | 'neutral') => {
      try {
        const res = await fetch(`${API_BASE}/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, response, outcome }),
        });
        if (!res.ok) throw new Error('Failed to record interaction');
        const data = await res.json();
        setEndocrine(data.endocrine);
      } catch (err) {
        console.error('[useBrain] Error recording interaction:', err);
      }
    },
    [],
  );

  const sleep = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sleep`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start sleep cycle');
      const stats = await res.json();
      await refreshState();
      return stats;
    } catch (err) {
      console.error('[useBrain] Error during sleep cycle:', err);
      return null;
    }
  }, [refreshState]);

  // Initial load
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  return {
    endocrine,
    isBrainActive,
    setIsBrainActive,
    prepareContext,
    recordInteraction,
    sleep,
    refreshState,
    traffic,
    driftAlert,
    clearDriftAlert,
    vaultMemories,
    fetchVault,
  };
}
