import { useState } from 'react';

export function useLocalStorage<T extends object>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        return { ...initialValue, ...parsed };
      }
      return initialValue;
    } catch (error) {
      console.error("Local storage read error", error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Local storage write error", error);
    }
  };

  return [storedValue, setValue] as const;
}

export type Settings = {
  googleApi: string;
  grokApi: string;
  openRouterApi: string;
  githubToken: string;
  ollamaUrl: string;
  ollamaApi: string;
  wsUrl: string;
};

export const defaultSettings: Settings = {
  googleApi: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  grokApi: process.env.NEXT_PUBLIC_GROK_API_KEY || '',
  openRouterApi: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
  githubToken: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
  ollamaUrl: 'http://localhost:11434',
  ollamaApi: process.env.NEXT_PUBLIC_OLLAMA_API_KEY || '',
  wsUrl: typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}` : 'wss://echo.websocket.events',
};
