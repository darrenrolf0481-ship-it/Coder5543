import { useCallback, useRef, useMemo } from 'react';
import { GoogleGenAI } from '../services/googleGenAiStub';
import { generateAIResponse as generateAIResponseService, AI_REQUEST_TIMEOUT_MS } from '../services/aiService';
import { getAgent } from '../data/agentRegistry';
import { WorkerConfig } from './useAiWorkers';
import { Personality } from '../data/personalities';

// AbortSignal.any / AbortSignal.timeout aren't in the ES2022 lib types this
// project targets, so merge/timeout signals are built manually to stay
// type-safe across TS versions.
const timeoutSignal = (ms: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error(`AI request timed out after ${ms}ms`)), ms);
  return controller.signal;
};

const mergeAbortSignals = (signals: (AbortSignal | undefined | null)[]): AbortSignal => {
  const out = new AbortController();
  for (const sig of signals) {
    if (!sig) continue;
    if (sig.aborted) {
      out.abort((sig as any).reason ?? new Error('aborted'));
      break;
    }
    sig.addEventListener('abort', () => out.abort((sig as any).reason ?? new Error('aborted')), {
      once: true,
    });
  }
  return out.signal;
};

export function useAiOrchestrator(
  workers: WorkerConfig[],
  personalities: Personality[],
  grokApiKey: string,
  geminiApiKey: string,
  openrouterApiKey: string,
  projectSettings: any,
) {
  const googleAiClient = useMemo(
    () => (geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null),
    [geminiApiKey],
  );

  const abortRefs = useRef<Record<string, AbortController>>({});

  // Only abort a previous in-flight request when the caller explicitly passes
  // a stable domain (e.g. 'chat'). Callers that omit a domain are asking for a
  // standalone request, so parallel work (editor analysis, swarm agents, etc.)
  // does not cancel each other. Every signal also carries the hard
  // AI_REQUEST_TIMEOUT_MS budget so fetch-based providers abort the in-flight
  // network instead of hanging forever (the "editor runs and runs" symptom).
  const getSignal = useCallback((domain?: string): AbortSignal => {
    const timeout = timeoutSignal(AI_REQUEST_TIMEOUT_MS);
    if (domain) {
      abortRefs.current[domain]?.abort();
      const controller = new AbortController();
      abortRefs.current[domain] = controller;
      return mergeAbortSignals([controller.signal, timeout]);
    }
    return timeout;
  }, []);

  const generateAIResponse = useCallback(
    async (
      prompt: string | any[],
      systemInstruction: string,
      options?: {
        modelType?: 'fast' | 'smart';
        json?: boolean;
        responseSchema?: any;
        brainContext?: any;
        mcpTools?: string[];
      },
      domain?: string,
    ) => {
      const active = workers.filter((w) => w.enabled);
      if (active.length === 0) return Promise.reject(new Error('No workers enabled'));

      const { brainContext, ...serviceOptions } = options || {};

      const activePersonality = personalities.find((p) => p.active) || personalities[0];
      const mergedOptions = {
        ...serviceOptions,
        mcpTools: serviceOptions.mcpTools || activePersonality?.mcpTools || [],
      };

      const buildInstruction = (w: WorkerConfig) => {
        if (!w.agentId) return systemInstruction;
        const agent = getAgent(w.agentId);
        if (!agent) return systemInstruction;
        return `${agent.systemPrompt}\n\n---\n\n${systemInstruction}`;
      };

      if (active.length === 1) {
        const w = active[0];
        const signal = getSignal(domain);
        return generateAIResponseService(prompt as string, buildInstruction(w), mergedOptions, {
          aiProvider: w.provider,
          aiModel: w.model,
          ai: googleAiClient,
          grokApiKey,
          openrouterApiKey,
          projectSettings: { ...projectSettings, ollamaUrl: w.url },
          ollamaModels: w.models ?? [],
          signal,
          brainContext,
        });
      }

      // When an explicit domain is provided all workers share one signal so the
      // whole call can be cancelled together. Otherwise each worker gets its own
      // isolated signal so parallel feature calls don't abort each other.
      const sharedSignal = domain ? getSignal(domain) : undefined;
      const results = await Promise.allSettled(
        active.map((w) =>
          generateAIResponseService(prompt as string, buildInstruction(w), mergedOptions, {
            aiProvider: w.provider,
            aiModel: w.model,
            ai: googleAiClient,
            grokApiKey,
            openrouterApiKey,
            projectSettings: { ...projectSettings, ollamaUrl: w.url },
            ollamaModels: w.models ?? [],
            signal: sharedSignal ?? getSignal(),
            brainContext,
          }),
        ),
      );

      const first = results.find(
        (r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<string>).value,
      );
      if (!first) {
        const errors = results
          .filter((r) => r.status === 'rejected')
          .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');
        throw new Error(`All workers failed: ${errors.join(', ')}`);
      }
      return (first as PromiseFulfilledResult<string>).value;
    },
    [
      workers,
      googleAiClient,
      grokApiKey,
      openrouterApiKey,
      projectSettings,
      personalities,
      getSignal,
    ],
  );

  return { generateAIResponse, googleAiClient };
}
