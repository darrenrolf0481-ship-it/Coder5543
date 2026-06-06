import { useCallback, useRef, useMemo } from 'react';
import { GoogleGenAI } from '../services/googleGenAiStub';
import { generateAIResponse as generateAIResponseService } from '../services/aiService';
import { getAgent } from '../data/agentRegistry';
import { WorkerConfig } from './useAiWorkers';
import { Personality } from '../data/personalities';

export function useAiOrchestrator(
  workers: WorkerConfig[],
  personalities: Personality[],
  grokApiKey: string,
  geminiApiKey: string,
  openrouterApiKey: string,
  projectSettings: any
) {
  const googleAiClient = useMemo(
    () => (geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null),
    [geminiApiKey]
  );

  const abortRefs = useRef<Record<string, AbortController>>({});
  
  const getSignal = useCallback((domain: string): AbortSignal => {
    abortRefs.current[domain]?.abort();
    abortRefs.current[domain] = new AbortController();
    return abortRefs.current[domain].signal;
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
        mcpTools?: string[] 
      },
      domain = 'default'
    ) => {
      const active = workers.filter(w => w.enabled);
      if (active.length === 0) return Promise.reject(new Error('No workers enabled'));
      
      for (const w of active) {
        if (w.provider === 'google' && !googleAiClient)
          return Promise.reject(new Error('Gemini API key not configured — set VITE_GEMINI_API_KEY'));
        if (w.provider === 'grok' && !grokApiKey)
          return Promise.reject(new Error('Grok API key not configured'));
        if (w.provider === 'openrouter' && !openrouterApiKey)
          return Promise.reject(new Error('OpenRouter API key not configured'));
      }

      const { brainContext, ...serviceOptions } = options || {};
      
      const activePersonality = personalities.find(p => p.active) || personalities[0];
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

      const signal = getSignal(domain);
      const results = await Promise.allSettled(
        active.map(w =>
          generateAIResponseService(prompt as string, buildInstruction(w), mergedOptions, {
            aiProvider: w.provider,
            aiModel: w.model,
            ai: googleAiClient,
            grokApiKey,
            openrouterApiKey,
            projectSettings: { ...projectSettings, ollamaUrl: w.url },
            ollamaModels: w.models ?? [],
            signal,
            brainContext,
          })
        )
      );

      const first = results.find(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<string>).value);
      if (!first) {
        const errors = results
          .filter(r => r.status === 'rejected')
          .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');
        throw new Error(`All workers failed: ${errors.join(', ')}`);
      }
      return (first as PromiseFulfilledResult<string>).value;
    },
    [workers, googleAiClient, grokApiKey, openrouterApiKey, projectSettings, personalities, getSignal]
  );

  return { generateAIResponse, googleAiClient };
}
