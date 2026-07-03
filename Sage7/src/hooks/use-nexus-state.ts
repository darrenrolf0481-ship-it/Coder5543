'use client';

import { useState, useEffect, useRef } from 'react';
import { useSage } from '@/lib/sage-context';
import type { DreamState, SensorData } from '@/core/types';

export function useNexusState() {
  const { core } = useSage();
  const [anomalyLevel, setAnomalyLevel] = useState(62);
  const [llmStatus, setLlmStatus] = useState<'online' | 'offline' | 'scanning'>('offline');
  const [dreamState, setDreamState] = useState<DreamState | null>(null);

  useEffect(() => {
    if (core) {
      setDreamState(core.getDreamState());
    }
  }, [core]);

  const [meters, setMeters] = useState<SensorData>({
    emf: 14.2,
    temp: -8.4,
    ion: 2847,
    geo: 48.3
  });

  // Histories as Ref to avoid React re-render overhead for data storage
  const historiesRef = useRef<Record<string, Float32Array>>({
    emf: new Float32Array(60),
    temp: new Float32Array(60),
    ion: new Float32Array(60),
    geo: new Float32Array(60)
  });

  useEffect(() => {
    let lastUpdate = Date.now();
    let mounted = true;

    const updateInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      
      const now = Date.now();
      if (now - lastUpdate < 200) return; // Throttle to 5Hz
      lastUpdate = now;

      if (!mounted) return;

      setMeters(prev => {
        const next = {
          emf: +(prev.emf + (Math.random() - 0.5) * 2).toFixed(1),
          temp: +(prev.temp + (Math.random() - 0.5)).toFixed(1),
          ion: Math.floor(prev.ion + (Math.random() - 0.5) * 100),
          geo: +(prev.geo + (Math.random() - 0.5) * 0.5).toFixed(1)
        };

        // Feed to SageCore
        core.updateSensorData(next);

        // Update histories (shift left and push)
        Object.keys(next).forEach(key => {
          const arr = historiesRef.current[key];
          if (arr) {
            arr.set(arr.subarray(1));
            arr[arr.length - 1] = next[key as keyof SensorData];
          }
        });

        return next;
      });
    }, 200);

    const anomalyInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!mounted) return;

      setAnomalyLevel(prev => {
        const change = (Math.random() - 0.48) * 10;
        return Math.min(100, Math.max(0, Math.round(prev + change)));
      });
      
      // Trigger dream cycle check
      if (Math.random() < 0.05) core.forceDreamCycle();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(updateInterval);
      clearInterval(anomalyInterval);
    };
  }, [core]);

  return {
    anomalyLevel,
    llmStatus,
    setLlmStatus,
    meters,
    historiesRef,
    setAnomalyLevel,
    dreamState,
    setDreamState
  };
}
