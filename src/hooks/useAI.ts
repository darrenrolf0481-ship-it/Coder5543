import { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

/**
 * useAI - A neural interface hook for managing multi-provider AI communication.
 * 
 * This hook handles the initialization and state of different AI providers
 * (Google Gemini, Grok, and local Ollama nodes), providing a unified
 * interface for generating AI responses.
 * 
 * @param initialGrokApiKey - Optional initial key for the Grok provider.
 * @returns An object containing AI state and the generateAIResponse function.
 */
export const useAI = (initialGrokApiKey: string = '') => {
  const [aiProvider, setAiProvider] = useState<'google' | 'grok' | 'ollama'>('ollama');
  const [aiModel, setAiModel] = useState('');
  const [grokApiKey, setGrokApiKey] = useState(initialGrokApiKey);
  const [geminiApiKey, setGeminiApiKey] = useState(import.meta.env.GEMINI_API_KEY || '');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');

  const genAI = useMemo(() => {
    const key = geminiApiKey || 'AIza_placeholder';
    try {
      return new GoogleGenAI(key);
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI", e);
      return null;
    }
  }, [geminiApiKey]);

  const generateAIResponse = useCallback(async (
    prompt: string | any[],
    systemInstruction: string,
    options?: { modelType?: 'fast' | 'smart', json?: boolean, responseSchema?: any, ollamaUrl?: string }
  ) => {
    const isFast = options?.modelType === 'fast';
    const isJson = options?.json;

    if (aiProvider === 'google') {
      if (!geminiApiKey || geminiApiKey === 'AIza_placeholder') {
        throw new Error("Gemini API Key is not configured.");
      }
      const modelName = aiModel || (isFast ? 'gemini-1.5-flash' : 'gemini-1.5-pro');
      const model = genAI!.getGenerativeModel({ 
        model: modelName
      });
      
      const generationConfig: any = {
        systemInstruction: systemInstruction
      };
      if (isJson) {
        generationConfig.responseMimeType = "application/json";
        if (options?.responseSchema) {
          generationConfig.responseSchema = options.responseSchema;
        }
      }

      const contents = typeof prompt === 'string' 
        ? [{ role: 'user', parts: [{ text: prompt }] }] 
        : prompt;

      const result = await model.generateContent({
        contents,
        generationConfig
      });
      
      const response = await result.response;
      return response.text();
    } else if (aiProvider === 'grok') {
      const model = aiModel || 'grok-beta';
      const messages = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }
      ];
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokApiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: isJson ? { type: "json_object" } : undefined
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content;
    } else if (aiProvider === 'ollama') {
      const url = options?.ollamaUrl || 'http://localhost:11434';
      const model = aiModel || (ollamaModels.length > 0 ? ollamaModels[0] : 'llama3');
      const res = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }
          ],
          stream: false
        })
      });
      const data = await res.json();
      return data.message?.content;
    }
  }, [aiProvider, aiModel, grokApiKey, ollamaModels, genAI]);

  const refreshOllamaModels = useCallback(async (url: string = 'http://localhost:11434') => {
    setOllamaStatus('loading');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${url}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      if (data.models) {
        const models = data.models.map((m: any) => m.name);
        setOllamaModels(models);
        setOllamaStatus('connected');
        if (models.length > 0 && !aiModel) setAiModel(models[0]);
        return models;
      }
    } catch (err) {
      setOllamaStatus('error');
      console.error("Ollama connection failed", err);
    }
    return [];
  }, [aiModel]);

  useEffect(() => {
    if (aiProvider === 'ollama') {
      refreshOllamaModels();
    }
  }, [aiProvider, refreshOllamaModels]);

  return {
    aiProvider,
    setAiProvider,
    aiModel,
    setAiModel,
    grokApiKey,
    setGrokApiKey,
    geminiApiKey,
    setGeminiApiKey,
    ollamaModels,
    ollamaStatus,
    generateAIResponse,
    refreshOllamaModels
  };
};
