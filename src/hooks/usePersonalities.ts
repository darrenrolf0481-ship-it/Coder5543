import { useState, useMemo, useEffect, useRef } from 'react';
import { resolveApiUrl } from '../utils/apiUrl';
import { GoogleGenAI } from '../services/googleGenAiStub';
import { INITIAL_PERSONALITIES } from '../data/personalities';
import type { Personality } from '../data/personalities';

export function usePersonalities() {
  const [personalities, setPersonalities] = useState<Personality[]>(INITIAL_PERSONALITIES);

  // Memoize the initial preferences from localStorage to avoid redundant parsing
  const initialPrefs = useMemo(() => {
    try {
      const stored = localStorage.getItem('node_preferences');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    if (initialPrefs.geminiApiKey) return initialPrefs.geminiApiKey;
    try {
      return (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    } catch {
      return '';
    }
  });

  const [grokApiKey, setGrokApiKey] = useState<string>(() => {
    if (initialPrefs.grokApiKey) return initialPrefs.grokApiKey;
    return '';
  });

  const [openrouterApiKey, setOpenrouterApiKey] = useState<string>(() => {
    if (initialPrefs.openrouterApiKey) return initialPrefs.openrouterApiKey;
    try {
      return (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
    } catch {
      return '';
    }
  });

  const googleAiClient = useMemo(
    () => (geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null),
    [geminiApiKey],
  );

  const activePersonality = useMemo(
    () => personalities.find((p) => p.active) || personalities[0],
    [personalities],
  );

  const lastSavedKeys = useRef({ geminiApiKey, grokApiKey, openrouterApiKey });

  useEffect(() => {
    // Save locally
    const preferences = {
      aiProvider: 'ollama',
      aiModel: 'llama3.2:latest',
      geminiApiKey,
      grokApiKey,
      openrouterApiKey,
    };
    try {
      const stored = localStorage.getItem('node_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.aiProvider !== 'ollama' || parsed.aiModel !== 'llama3.2:latest') {
          parsed.aiProvider = 'ollama';
          parsed.aiModel = 'llama3.2:latest';
        }
        Object.assign(preferences, parsed);
      }
      preferences.geminiApiKey = geminiApiKey;
      preferences.grokApiKey = grokApiKey;
      preferences.openrouterApiKey = openrouterApiKey;
      localStorage.setItem('node_preferences', JSON.stringify(preferences));
    } catch (err) {
      console.warn('Failed to save preferences to localStorage:', err);
    }

    // Check if keys actually changed before sending to backend
    if (
      geminiApiKey === lastSavedKeys.current.geminiApiKey &&
      grokApiKey === lastSavedKeys.current.grokApiKey &&
      openrouterApiKey === lastSavedKeys.current.openrouterApiKey
    ) {
      return;
    }

    // Debounce save to backend
    const handler = setTimeout(() => {
      fetch(resolveApiUrl('mcp/save-keys'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey, grokApiKey, openrouterApiKey }),
      })
        .then(() => {
          lastSavedKeys.current = { geminiApiKey, grokApiKey, openrouterApiKey };
        })
        .catch((err) => console.error('Failed to save keys to backend:', err));
    }, 1000);

    return () => clearTimeout(handler);
  }, [geminiApiKey, grokApiKey, openrouterApiKey]);

  return {
    personalities,
    setPersonalities,
    grokApiKey,
    setGrokApiKey,
    geminiApiKey,
    setGeminiApiKey,
    openrouterApiKey,
    setOpenrouterApiKey,
    googleAiClient,
    activePersonality,
  };
}
