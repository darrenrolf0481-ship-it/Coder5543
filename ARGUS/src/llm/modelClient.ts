/**
 * ARGUS model client — OpenAI-compatible chat-completions caller.
 *
 * Backends:
 *   ollama      — local Ollama (non-streaming, stream:false)
 *   openrouter  — cloud aggregator (non-streaming, needs API key; FREE models only)
 *   omniroute   — local OmniRoute aggregator at :20130 (SSE streaming; stream:false broken)
 *
 * Callers: src/hooks/useLabController.ts
 */

export type Backend = 'ollama' | 'openrouter' | 'omniroute';

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

/**
 * Rewrite a localhost service URL so it works from a browser loaded behind the
 * code-server / Crimson-OS proxy. On such a page the JS runs on a remote https
 * origin, so `http://localhost:11434` is the *user's* machine, not the server —
 * the request can never succeed. The serving origin proxies backend ports at
 * `/proxy/<port>/`, so we route there same-origin instead.
 *
 * Untouched when: not in a browser, or the page really is on localhost
 * (standalone `npm run dev`/`preview` at root), where localhost:PORT is valid.
 */
/**
 * Same-origin API base for the coder-lab server that serves ARGUS.
 * Behind the code-server proxy: `<origin>/proxy/3002`; standalone: `<origin>`.
 * Backend relays live at `${apiBase()}/api/<name>`.
 */
export function apiBase(): string {
  if (typeof window === 'undefined' || !window.location) return '';
  const { origin, pathname } = window.location;
  const apiPrefix = pathname.replace(/\/argus\/?.*$/, '');
  return `${origin}${apiPrefix}`;
}

export function resolveServiceUrl(url: string): string {
  if (typeof window === 'undefined' || !window.location) return url;
  const { origin, pathname, hostname } = window.location;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocalHost) return url; // dev/preview at root — leave as-is

  // The coder-lab server that serves ARGUS mounts its API relays at
  // `<proxyPrefix>/api/<name>`, where proxyPrefix is "" (root) or
  // "/proxy/3002" behind the code-server proxy. ARGUS itself is served at
  // `<proxyPrefix>/argus/...`, so strip everything from "/argus" onward to
  // recover the API prefix. Route localhost backends through those same-origin
  // relays instead of the browser's own (unreachable) localhost.
  const apiPrefix = pathname.replace(/\/argus\/?.*$/, '');

  // Ollama :11434 → same-origin relay `<prefix>/api/ollama/v1/...`
  const ollama = url.match(/^https?:\/\/(?:localhost|127\.0\.0\.1):11434(\/v1.*)?$/i);
  if (ollama) return `${origin}${apiPrefix}/api/ollama${ollama[1] ?? '/v1'}`;

  // OmniRoute :20130 → same-origin relay `<prefix>/api/omniroute/...`
  const omni = url.match(/^https?:\/\/(?:localhost|127\.0\.0\.1):20130(\/v1.*)?$/i);
  if (omni) return `${origin}${apiPrefix}/api/omniroute${omni[1] ?? '/v1'}`;

  return url; // external URL (e.g. openrouter.ai) — leave as-is
}

export const OLLAMA_DEFAULTS: ModelConfig = {
  backend: 'ollama',
  baseUrl: 'http://localhost:11434/v1',
  model: 'llama3.2:latest',
};

export const OPENROUTER_DEFAULTS: ModelConfig = {
  backend: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  // Free-tier only — never use paid models here.
  model: 'meta-llama/llama-3.1-8b-instruct:free',
};

// OmniRoute local aggregator — streams SSE; stream:false is broken upstream.
export const OMNIROUTE_DEFAULTS: ModelConfig = {
  backend: 'omniroute',
  baseUrl: 'http://localhost:20130/v1',
  model: 'auto/best-fast',
};

export class ModelError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ModelError';
    this.status = status;
  }
}

/** Parse an OpenAI SSE stream and accumulate the full assistant reply. */
async function readSSEStream(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) throw new ModelError('SSE stream unavailable — no response body.');
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const raw = trimmed.slice(5).trim();
      if (raw === '[DONE]') return content;
      try {
        const chunk = JSON.parse(raw);
        const delta = chunk?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') content += delta;
      } catch { /* malformed chunk — skip */ }
    }
  }
  return content;
}

/**
 * Send a chat completion request.
 * Ollama + OpenRouter use non-streaming JSON; OmniRoute uses SSE streaming.
 * Throws ModelError on any failure so the caller can surface a friendly line.
 */
export async function chat(
  config: ModelConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  if (config.backend === 'openrouter' && !config.apiKey) {
    throw new ModelError('No OpenRouter API key set. Use: model key <sk-or-...>');
  }

  const useStream = config.backend === 'omniroute';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.backend === 'openrouter') {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
    headers['HTTP-Referer'] = (typeof location !== 'undefined' ? location.origin : undefined) ?? 'https://argus.local';
    headers['X-Title'] = 'ARGUS';
  }

  let res: Response;
  try {
    res = await fetch(`${resolveServiceUrl(config.baseUrl).replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({ model: config.model, messages, stream: useStream }),
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new ModelError('Request cancelled.');
    const hint =
      config.backend === 'ollama'      ? `Cannot reach Ollama at ${config.baseUrl}. Is \`ollama serve\` running?` :
      config.backend === 'omniroute'   ? `Cannot reach OmniRoute at ${config.baseUrl}. Is the OmniRoute daemon running?` :
      'Network error reaching OpenRouter. Check connectivity.';
    throw new ModelError(hint);
  }

  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 200); } catch { /* ignore */ }
    throw new ModelError(
      `${config.backend} returned ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`,
      res.status,
    );
  }

  // OmniRoute: consume the SSE stream and assemble the full reply.
  if (useStream) {
    const content = await readSSEStream(res);
    if (!content) throw new ModelError('OmniRoute returned an empty stream.');
    return content;
  }

  // Ollama / OpenRouter: standard JSON response.
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
