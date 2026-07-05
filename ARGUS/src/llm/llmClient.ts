// Unified LLM client: talks to a local Ollama server or the OpenRouter API
// behind one interface. Non-streaming, with clear error surfacing so the
// chat can show what went wrong instead of hanging.

export type LlmProvider = 'ollama' | 'openrouter';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  ollamaEndpoint: string;      // e.g. http://localhost:11434
  openrouterEndpoint: string;  // e.g. https://openrouter.ai/api/v1
  openrouterKey: string | null;
}

export interface LlmResult {
  ok: boolean;
  content: string;
  error?: string;
}

const TIMEOUT_MS = 60000;

function withTimeout(signal?: AbortSignal): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => ctrl.abort());
  return { signal: ctrl.signal, cancel: () => clearTimeout(t) };
}

async function callOllama(cfg: LlmConfig, messages: LlmMessage[]): Promise<LlmResult> {
  const { signal, cancel } = withTimeout();
  try {
    const res = await fetch(`${cfg.ollamaEndpoint.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: cfg.model, messages, stream: false }),
      signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, content: '', error: `Ollama ${res.status}: ${body.slice(0, 200) || res.statusText}` };
    }
    const data = await res.json();
    return { ok: true, content: data?.message?.content ?? '' };
  } catch (e) {
    const msg = (e as Error)?.name === 'AbortError' ? 'request timed out' : (e as Error)?.message;
    return { ok: false, content: '', error: `Ollama unreachable (${cfg.ollamaEndpoint}): ${msg}` };
  } finally {
    cancel();
  }
}

async function callOpenRouter(cfg: LlmConfig, messages: LlmMessage[]): Promise<LlmResult> {
  if (!cfg.openrouterKey) {
    return { ok: false, content: '', error: 'No OpenRouter API key set. Use: apikey <key>' };
  }
  const { signal, cancel } = withTimeout();
  try {
    const res = await fetch(`${cfg.openrouterEndpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.openrouterKey}`,
        'HTTP-Referer': 'https://argus.local',
        'X-Title': 'ARGUS Neural Oversight Lab',
      },
      body: JSON.stringify({ model: cfg.model, messages, stream: false }),
      signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, content: '', error: `OpenRouter ${res.status}: ${body.slice(0, 200) || res.statusText}` };
    }
    const data = await res.json();
    return { ok: true, content: data?.choices?.[0]?.message?.content ?? '' };
  } catch (e) {
    const msg = (e as Error)?.name === 'AbortError' ? 'request timed out' : (e as Error)?.message;
    return { ok: false, content: '', error: `OpenRouter request failed: ${msg}` };
  } finally {
    cancel();
  }
}

export async function llmChat(cfg: LlmConfig, messages: LlmMessage[]): Promise<LlmResult> {
  return cfg.provider === 'ollama' ? callOllama(cfg, messages) : callOpenRouter(cfg, messages);
}

/** List locally installed Ollama models (GET /api/tags). */
export async function listOllamaModels(endpoint: string): Promise<string[]> {
  try {
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.models ?? []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}
