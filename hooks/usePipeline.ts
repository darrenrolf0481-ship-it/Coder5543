// ── usePipeline ───────────────────────────────────────────────────────────────
// React hook that bootstraps all three pipeline stages (ingestion → filtering →
// pattern injection), wires them to the shared broker, and exposes a stable
// `dispatch()` API plus live pipeline stats to the host component.

import { useEffect, useCallback, useRef, useState } from 'react';
import { broker, Signal, SignalSource, SignalType } from '../services/messageBroker';
import { ingest, RawSignal } from '../services/pipeline/ingestionService';
import { startFilteringService } from '../services/pipeline/filteringService';
import { startPatternInjectionService, AIExecutor, PatternResult } from '../services/pipeline/patternInjectionService';

export interface PipelineStats {
  dlqCount: number;
  openCircuits: number;
  queueDepth: number;
}

export interface DispatchOptions {
  meta?: Record<string, unknown>;
}

export interface UsePipelineReturn {
  dispatch: (type: SignalType, source: SignalSource, data: unknown, opts?: DispatchOptions) => Promise<string | null>;
  stats: PipelineStats;
  onResponse: (handler: (result: PatternResult) => void) => () => void;
  onError: (handler: (err: { stage: string; error: string; signal: Signal }) => void) => () => void;
  replayDLQ: (id: string) => Promise<boolean>;
  getDLQ: () => Signal[];
}

export function usePipeline(executor: AIExecutor): UsePipelineReturn {
  const [stats, setStats] = useState<PipelineStats>({ dlqCount: 0, openCircuits: 0, queueDepth: 0 });
  const queueDepth = useRef(0);

  // ── Bootstrap services once ───────────────────────────────────────────────
  useEffect(() => {
    const stopFiltering = startFilteringService();
    const stopInjection = startPatternInjectionService(executor);

    // Track in-flight requests for queue depth metric
    const unsubQueued = broker.subscribe('AI_REQUEST_QUEUED', () => {
      queueDepth.current++;
      setStats(s => ({ ...s, queueDepth: queueDepth.current }));
    });

    const unsubDone = broker.subscribe('AI_RESPONSE_RECEIVED', () => {
      queueDepth.current = Math.max(0, queueDepth.current - 1);
      const s = broker.stats();
      setStats({ dlqCount: s.dlq, openCircuits: s.openCircuits, queueDepth: queueDepth.current });
    });

    const unsubFail = broker.subscribe('AI_REQUEST_FAILED', () => {
      queueDepth.current = Math.max(0, queueDepth.current - 1);
      const s = broker.stats();
      setStats({ dlqCount: s.dlq, openCircuits: s.openCircuits, queueDepth: queueDepth.current });
    });

    return () => {
      stopFiltering();
      stopInjection();
      unsubQueued();
      unsubDone();
      unsubFail();
    };
  // executor identity is stable (wrapped in useCallback in App); only run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── dispatch ──────────────────────────────────────────────────────────────
  const dispatch = useCallback(
    async (type: SignalType, source: SignalSource, data: unknown, opts?: DispatchOptions): Promise<string | null> => {
      const raw: RawSignal = { type, source, data, meta: opts?.meta };
      const result = await ingest(raw);
      if (!result.accepted) {
        console.warn('[Pipeline] Ingestion rejected:', result.reason, raw);
        return null;
      }
      return result.id;
    },
    [],
  );

  // ── response subscriber factory ───────────────────────────────────────────
  const onResponse = useCallback((handler: (result: PatternResult) => void): (() => void) => {
    return broker.subscribe('AI_RESPONSE_RECEIVED', signal => handler(signal.data as PatternResult));
  }, []);

  // ── error subscriber factory ──────────────────────────────────────────────
  const onError = useCallback(
    (handler: (err: { stage: string; error: string; signal: Signal }) => void): (() => void) => {
      return broker.subscribe('PIPELINE_ERROR', signal =>
        handler(signal.data as { stage: string; error: string; signal: Signal }),
      );
    },
    [],
  );

  const replayDLQ = useCallback((id: string) => broker.replayDLQ(id), []);
  const getDLQ    = useCallback(() => broker.getDLQ(), []);

  return { dispatch, stats, onResponse, onError, replayDLQ, getDLQ };
}
