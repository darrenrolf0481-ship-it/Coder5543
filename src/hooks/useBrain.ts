import { useState, useCallback, useEffect } from 'react';
import type { BrainContext, EndocrineState } from '../services/brain/types';

const API_BASE = '/api/brain';

export function useBrain() {
  const [endocrine, setEndocrine] = useState<EndocrineState | null>(null);
  const [isBrainActive, setIsBrainActive] = useState(true);

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/endocrine`);
      if (!res.ok) throw new Error('Failed to fetch endocrine state');
      const data = await res.json();
      setEndocrine(data);
    } catch (err) {
      console.error('[useBrain] Error refreshing state:', err);
    }
  }, []);

  const prepareContext = useCallback(async (input: string): Promise<BrainContext | null> => {
    if (!isBrainActive) return null;
    try {
      const res = await fetch(`${API_BASE}/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) throw new Error('Failed to prepare context');
      const { context } = await res.json();
      return context;
    } catch (err) {
      console.error('[useBrain] Error preparing context:', err);
      return null;
    }
  }, [isBrainActive]);

  const recordInteraction = useCallback(async (input: string, response: string, outcome: 'success' | 'failure' | 'neutral') => {
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
  }, []);

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
    refreshState
  };
}

