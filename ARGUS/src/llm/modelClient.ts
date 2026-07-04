/**
 * ARGUS model client — a single OpenAI-compatible chat-completions caller
 * that targets either a local Ollama instance or the OpenRouter cloud
 * aggregator. Both speak the same `/chat/completions` shape, so we only
 * swap the base URL, model id, and auth headers.
 *
 * Callers: src/hooks/useLabController.ts (the chat message route).
 */

export type Backend = 'ollama' | 'openrouter';

export interface ModelConfig {
  backend: Backend;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const OLLAMA_DEFAULTS: ModelConfig = {
  backend: 'ollama',
  baseUrl: 'http://localhost:11434/v1',
  model: 'llama3.1',
};

export const OPENROUTER_DEFAULTS: ModelConfig = {
  backend: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'openai/gpt-4o-mini',
};

export class ModelError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ModelError';
    this.status = status;
  }
}

/**
 * Send a chat completion request. Non-streaming (v1).
 * Throws ModelError on any failure so the route can surface a friendly line.
 */
export async function chat(
  config: ModelConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  if (config.backend === 'openrouter' && !config.apiKey) {
    throw new ModelError('No OpenRouter API key set. Use: model key <sk-or-...>');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.backend === 'openrouter') {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    // OpenRouter-recommended attribution headers (both optional).
    headers['HTTP-Referer'] = location?.origin ?? 'https://argus.local';
    headers['X-Title'] = 'ARGUS';
  }

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({ model: config.model, messages, stream: false }),
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new ModelError('Request cancelled.');
    // Network failure — most commonly Ollama not running.
    throw new ModelError(
      config.backend === 'ollama'
        ? `Cannot reach Ollama at ${config.baseUrl}. Is \`ollama serve\` running?`
        : `Network error reaching OpenRouter. Check connectivity.`,
    );
  }

  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 200); } catch { /* ignore */ }
    throw new ModelError(
      `${config.backend} returned ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`,
      res.status,
    );
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new ModelError('Malformed response from model endpoint (no JSON).');
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new ModelError('Model response missing choices[0].message.content.');
  }
  return content;
}