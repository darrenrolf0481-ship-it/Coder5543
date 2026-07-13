import { useState, useCallback, useEffect } from 'react';
import { fetchOllamaModels } from '../services/aiService';

export interface WorkerConfig {
  id: number;
  label: string;
  enabled: boolean;
  provider: 'google' | 'grok' | 'ollama' | 'openrouter' | 'antigravity';
  model: string;
  url: string;
  models: string[];
  agentId?: string;
}

export function getDefaultWorkers(): WorkerConfig[] {
  return [
    {
      id: 1,
      label: 'W1',
      enabled: true,
      provider: 'ollama',
      model: 'gemma4:31b-cloud',
      url: 'http://127.0.0.1:11434',
      models: [],
      agentId: 'sage-adhd-sage',
    },
    {
      id: 2,
      label: 'W2',
      enabled: true,
      provider: 'ollama',
      model: 'gemma4:31b-cloud',
      url: 'http://127.0.0.1:11434',
      models: [],
      agentId: 'design-ui-designer',
    },
    {
      id: 3,
      label: 'W3',
      enabled: true,
      provider: 'ollama',
      model: 'gemma4:31b-cloud',
      url: 'http://127.0.0.1:11434',
      models: [],
      agentId: 'engineering-backend-architect',
    },
  ];
}

const DEFAULT_WORKERS = getDefaultWorkers();

export function useAiWorkers(setChatMessages?: React.Dispatch<React.SetStateAction<any[]>>) {
  const [workers, setWorkers] = useState<WorkerConfig[]>(DEFAULT_WORKERS);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    'idle',
  );
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  const refreshOllamaModels = useCallback(
    async (silent = false) => {
      const ollamaWorkers = workers.filter((w) => w.provider === 'ollama');
      if (ollamaWorkers.length === 0) {
        setOllamaStatus('idle');
        setAvailableModels([]);
        return;
      }

      setOllamaStatus('connecting');
      setOllamaError(null);

      // Group by URL so workers pointing at different Ollama hosts get the right model list.
      const urls = Array.from(new Set(ollamaWorkers.map((w) => w.url || 'http://127.0.0.1:11434')));

      try {
        const results = await Promise.all(
          urls.map(async (url) => {
            const fetched = await fetchOllamaModels(url);
            return { url, fetched };
          }),
        );

        const allModels = Array.from(new Set(results.flatMap((r) => r.fetched)));
        setAvailableModels(allModels);
        setOllamaStatus('connected');
        setOllamaError(null);

        setWorkers((prev) =>
          prev.map((w) => {
            if (w.provider !== 'ollama') return w;
            const url = w.url || 'http://127.0.0.1:11434';
            const fetched = results.find((r) => r.url === url)?.fetched ?? [];
            const currentValid = fetched.includes(w.model);
            return {
              ...w,
              models: fetched,
              model: currentValid ? w.model : fetched[0] || w.model,
            };
          }),
        );
      } catch (err: any) {
        setAvailableModels([]);
        setOllamaStatus('error');
        setOllamaError(err.message || String(err));
        if (!silent && setChatMessages) {
          setChatMessages((prev) => [
            {
              role: 'ai',
              text: `⚠️ **Ollama Connection Error**: ${err.message}\n\nMake sure Ollama is running and reachable (e.g. \`OLLAMA_HOST=http://127.0.0.1:11434 npm run dev\`).`,
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        }
      }
    },
    [workers, setChatMessages],
  );

  useEffect(() => {
    refreshOllamaModels(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    workers,
    setWorkers,
    availableModels,
    ollamaStatus,
    ollamaError,
    refreshOllamaModels,
  };
}
