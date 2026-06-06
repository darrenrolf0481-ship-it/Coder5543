import { useState, useCallback, useEffect } from 'react';
import { fetchOllamaModels } from '../services/aiService';

export interface WorkerConfig {
  id: number;
  label: string;
  enabled: boolean;
  provider: 'google' | 'grok' | 'ollama' | 'openrouter';
  model: string;
  url: string;
  models: string[];
  agentId?: string;
}

export function getDefaultWorkers(): WorkerConfig[] {
  return [
    { id: 1, label: 'W1', enabled: true, provider: 'ollama', model: 'llama3.2:latest', url: 'http://127.0.0.1:11434', models: [], agentId: 'sage-adhd-sage' },
    { id: 2, label: 'W2', enabled: true, provider: 'ollama', model: 'llama3.2:latest', url: 'http://127.0.0.1:11434', models: [], agentId: 'design-ui-designer' },
    { id: 3, label: 'W3', enabled: true, provider: 'ollama', model: 'llama3.2:latest', url: 'http://127.0.0.1:11434', models: [], agentId: 'engineering-backend-architect' },
  ];
}

const DEFAULT_WORKERS = getDefaultWorkers();

export function useAiWorkers(setChatMessages?: React.Dispatch<React.SetStateAction<any[]>>) {
  const [workers, setWorkers] = useState<WorkerConfig[]>(DEFAULT_WORKERS);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  const refreshOllamaModels = useCallback(
    async (silent = false) => {
      const url = workers.find(w => w.provider === 'ollama')?.url || 'http://127.0.0.1:11434';
      setOllamaStatus('connecting');
      try {
        const fetched = await fetchOllamaModels(url);
        setAvailableModels(fetched);
        setOllamaStatus('connected');
        setOllamaError(null);
        // Assign each worker a distinct model from the fetched list
        setWorkers(prev => prev.map((w, i) => ({
          ...w,
          model: fetched.includes(w.model) ? w.model : (fetched[i % fetched.length] || w.model),
        })));
      } catch (err: any) {
        setAvailableModels([]);
        setOllamaStatus('error');
        setOllamaError(err.message || String(err));
        if (!silent && setChatMessages) {
          setChatMessages(prev => [{
            role: 'ai',
            text: `⚠️ **Ollama Connection Error**: ${err.message}\n\nSet \`OLLAMA_ORIGINS="*" ollama serve\` to allow browser access.`,
            timestamp: Date.now(),
          }, ...prev]);
        }
      }
    },
    [workers, setChatMessages]
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
    refreshOllamaModels
  };
}
