import { useState, useCallback, useEffect } from 'react';
import { brainService } from '../services/brain/brainService';
import type { BrainContext, EndocrineState } from '../services/brain/types';

export function useBrain() {
  const [endocrine, setEndocrine] = useState<EndocrineState>(brainService.getEndocrineState());
  const [isBrainActive, setIsBrainActive] = useState(true);

  // Sync endocrine state periodically or after interactions
  const refreshState = useCallback(() => {
    setEndocrine(brainService.getEndocrineState());
  }, []);

  const prepareContext = useCallback(async (input: string) => {
    if (!isBrainActive) return null;
    return await brainService.prepareContext(input);
  }, [isBrainActive]);

  const recordInteraction = useCallback(async (input: string, response: string, outcome: 'success' | 'failure' | 'neutral') => {
    await brainService.recordInteraction(input, response, outcome);
    refreshState();
  }, [refreshState]);

  const sleep = useCallback(async () => {
    const stats = await brainService.sleepCycle();
    refreshState();
    return stats;
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
