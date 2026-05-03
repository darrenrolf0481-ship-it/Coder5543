// ── Stage 3: Pattern Injection ────────────────────────────────────────────────
// Subscribes to SIGNAL_FILTERED.  Matches signal metadata against registered
// patterns and routes to the appropriate AI provider call.  Implements
// exponential-backoff retry (max 3 attempts) and moves exhausted signals to the
// broker's dead-letter queue via a PIPELINE_ERROR event.
//
// All AI provider calls are made through the injected `aiExecutor` so this
// service stays decoupled from React state and can be unit-tested independently.

import { broker, Signal, SignalSource } from '../messageBroker';

export type AIExecutor = (
  prompt: string,
  system: string,
  opts?: { modelType?: 'fast' | 'smart'; json?: boolean },
) => Promise<string>;

export type PatternHandler = (
  signal: Signal,
  execute: AIExecutor,
) => Promise<PatternResult>;

export interface PatternResult {
  responseType: 'ai_output' | 'swarm_update' | 'code_output' | 'scan_result' | 'noop';
  payload: unknown;
  correlationId: string;
}

interface Pattern {
  id: string;
  match: (signal: Signal) => boolean;
  handler: PatternHandler;
}

// ── Retry helpers ─────────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, BASE_DELAY_MS * 2 ** attempt));
    }
  }
  throw new Error('Unreachable');
}

// ── Built-in patterns ─────────────────────────────────────────────────────────
const builtinPatterns: Pattern[] = [
  {
    id: 'chat_message',
    match: s => s.source === 'chat',
    handler: async (signal, execute) => {
      const prompt = (signal.data as { prompt: string; system: string; ctx?: string }).prompt;
      const system = (signal.data as any).system ?? 'You are a helpful AI assistant.';
      const ctx    = (signal.data as any).ctx ?? '';
      const result = await withRetry(() => execute(ctx ? `${ctx}\n\n${prompt}` : prompt, system, { modelType: 'smart' }));
      return { responseType: 'ai_output', payload: result, correlationId: signal.id };
    },
  },
  {
    id: 'code_run',
    match: s => s.source === 'editor' && (signal => !!(signal.meta?.subtype === 'run'))(s),
    handler: async (signal, execute) => {
      const { language, code } = signal.data as { language: string; code: string };
      const result = await withRetry(() =>
        execute(
          `Execute this ${language} code in a simulated environment and return terminal-style output:\n${code}`,
          'You are the Crimson OS Neural Runtime. Simulate execution and produce realistic terminal output.',
          { modelType: 'smart' },
        ),
      );
      return { responseType: 'code_output', payload: result, correlationId: signal.id };
    },
  },
  {
    id: 'code_scan',
    match: s => s.source === 'scanner',
    handler: async (signal, execute) => {
      const { language, code } = signal.data as { language: string; code: string };
      const result = await withRetry(() =>
        execute(
          `Language: ${language}\nCode:\n${code}\n\nReturn ONLY a JSON array of 1-indexed line numbers with issues. Example: [3,15]. Empty array if none.`,
          'You are a strict code linter. Output ONLY a valid JSON array of integers.',
          { modelType: 'fast', json: true },
        ),
      );
      let lines: number[] = [];
      try { lines = JSON.parse(result.replace(/```json\n?|```/g, '').trim()); } catch { /* ignore */ }
      return { responseType: 'scan_result', payload: lines, correlationId: signal.id };
    },
  },
  {
    id: 'swarm_cycle',
    match: s => s.source === 'swarm',
    handler: async (signal, execute) => {
      const { agentCount, activePersonality } = signal.data as { agentCount: number; activePersonality: string };
      const result = await withRetry(() =>
        execute(
          `Simulate a swarm consensus cycle for ${agentCount} neural agents using personality: ${activePersonality}. Decide: consensus or conflict? Output JSON: { "consensus": bool, "confidence": 0-1, "summary": "..." }`,
          'You are the Crimson OS Swarm Orchestrator. Be concise. Output only valid JSON.',
          { modelType: 'fast', json: true },
        ),
      );
      let parsed: { consensus: boolean; confidence: number; summary: string } = {
        consensus: Math.random() > 0.25,
        confidence: 0.7,
        summary: 'Simulated cycle',
      };
      try { parsed = JSON.parse(result); } catch { /* use fallback */ }
      return { responseType: 'swarm_update', payload: parsed, correlationId: signal.id };
    },
  },
  {
    id: 'editor_ai',
    match: s => s.source === 'editor',
    handler: async (signal, execute) => {
      const { prompt, system, modelType } = signal.data as {
        prompt: string;
        system: string;
        modelType?: 'fast' | 'smart';
      };
      const result = await withRetry(() => execute(prompt, system, { modelType: modelType ?? 'smart' }));
      return { responseType: 'ai_output', payload: result, correlationId: signal.id };
    },
  },
];

// ── Service ───────────────────────────────────────────────────────────────────
export class PatternInjectionService {
  private patterns: Pattern[] = [...builtinPatterns];
  private executor!: AIExecutor;

  init(executor: AIExecutor): void {
    this.executor = executor;
  }

  registerPattern(pattern: Pattern): void {
    this.patterns.unshift(pattern); // custom patterns take priority
  }

  async onFiltered(signal: Signal): Promise<void> {
    const pattern = this.patterns.find(p => p.match(signal));
    if (!pattern) {
      // No registered pattern — pass through as noop
      await broker.publish('AI_RESPONSE_RECEIVED', { responseType: 'noop', payload: null, correlationId: signal.id }, signal.source);
      return;
    }

    await broker.publish('AI_REQUEST_QUEUED', { patternId: pattern.id, correlationId: signal.id }, signal.source, signal.meta);

    try {
      const result = await pattern.handler(signal, this.executor);
      await broker.publish('AI_RESPONSE_RECEIVED', result, signal.source, {
        ...signal.meta,
        patternId: pattern.id,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await broker.publish('AI_REQUEST_FAILED', { error: errMsg, correlationId: signal.id }, signal.source, signal.meta);
      await broker.publish('PIPELINE_ERROR', { stage: 'pattern_injection', error: errMsg, signal }, signal.source);
    }
  }
}

export const patternInjectionService = new PatternInjectionService();

let _started = false;
export function startPatternInjectionService(executor: AIExecutor): () => void {
  if (_started) return () => {};
  _started = true;
  patternInjectionService.init(executor);
  const unsub = broker.subscribe('SIGNAL_FILTERED', s => patternInjectionService.onFiltered(s));
  return () => { unsub(); _started = false; };
}
