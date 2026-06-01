// ── Message Broker ──────────────────────────────────────────────���─────────────
// Typed in-process pub/sub bus with correlation IDs, dead-letter queue, and
// per-handler circuit breakers. Designed to be instantiated once and shared
// across all three pipeline stages (ingestion → filtering → pattern-injection).

export type SignalSource = 'terminal' | 'chat' | 'editor' | 'swarm' | 'scanner' | 'system';

export type SignalType =
  | 'SIGNAL_RAW'              // pre-ingestion, directly from user action
  | 'SIGNAL_INGESTED'         // passed ingestion (has correlation ID + timestamp)
  | 'SIGNAL_FILTERED'         // passed filtering (validated, enriched, rate-limit ok)
  | 'SIGNAL_DROPPED'          // rejected by filter (logged, not propagated)
  | 'AI_REQUEST_QUEUED'       // about to call AI provider
  | 'AI_RESPONSE_RECEIVED'    // AI call completed successfully
  | 'AI_REQUEST_FAILED'       // AI call failed (retries exhausted)
  | 'SWARM_CYCLE_START'
  | 'SWARM_CONSENSUS'
  | 'SWARM_CONFLICT'
  | 'CODE_RUN_REQUESTED'
  | 'CODE_SCAN_REQUESTED'
  | 'PIPELINE_ERROR';         // unhandled error anywhere in the pipeline

export interface Signal<T = unknown> {
  id: string;                 // correlation ID (uuid-lite)
  type: SignalType;
  source: SignalSource;
  data: T;
  timestamp: number;
  retries: number;
  meta?: Record<string, unknown>;
}

type Handler<T = unknown> = (signal: Signal<T>) => void | Promise<void>;

interface CircuitBreaker {
  failures: number;
  lastFailure: number;
  open: boolean;
}

const CIRCUIT_TRIP = 3;           // consecutive failures to open circuit
const CIRCUIT_RESET_MS = 15_000;  // half-open after 15 s
const DLQ_MAX = 100;

let _seq = 0;
export function newId(): string {
  return `${Date.now().toString(36)}-${(++_seq).toString(36)}`;
}

export class MessageBroker {
  private channels = new Map<string, Set<Handler>>();
  private dlq: Signal[] = [];
  private breakers = new Map<Handler, CircuitBreaker>();

  subscribe<T = unknown>(type: SignalType | '*', handler: Handler<T>): () => void {
    const key = type as string;
    if (!this.channels.has(key)) this.channels.set(key, new Set());
    this.channels.get(key)!.add(handler as Handler);
    return () => this.channels.get(key)?.delete(handler as Handler);
  }

  async publish<T = unknown>(
    type: SignalType,
    data: T,
    source: SignalSource,
    meta?: Record<string, unknown>,
    retries = 0,
  ): Promise<string> {
    const signal: Signal<T> = {
      id: newId(),
      type,
      source,
      data,
      timestamp: Date.now(),
      retries,
      meta,
    };
    await this._dispatch(signal);
    return signal.id;
  }

  // Re-emit a signal from the dead-letter queue by its ID.
  async replayDLQ(id: string): Promise<boolean> {
    const idx = this.dlq.findIndex(s => s.id === id);
    if (idx === -1) return false;
    const [signal] = this.dlq.splice(idx, 1);
    signal.retries = 0;
    await this._dispatch(signal);
    return true;
  }

  getDLQ(): Signal[] {
    return [...this.dlq];
  }

  clearDLQ(): void {
    this.dlq = [];
  }

  stats(): { channels: number; dlq: number; openCircuits: number } {
    let openCircuits = 0;
    this.breakers.forEach(b => { if (b.open) openCircuits++; });
    return { channels: this.channels.size, dlq: this.dlq.length, openCircuits };
  }

  private async _dispatch(signal: Signal): Promise<void> {
    const handlers = new Set<Handler>([
      ...(this.channels.get(signal.type) ?? []),
      ...(this.channels.get('*') ?? []),
    ]);

    for (const handler of handlers) {
      const breaker = this._getBreaker(handler);

      // Half-open check — reset after timeout
      if (breaker.open && Date.now() - breaker.lastFailure > CIRCUIT_RESET_MS) {
        breaker.open = false;
        breaker.failures = 0;
      }
      if (breaker.open) continue;

      try {
        await handler(signal);
        breaker.failures = 0;
      } catch (err) {
        breaker.failures++;
        breaker.lastFailure = Date.now();
        if (breaker.failures >= CIRCUIT_TRIP) {
          breaker.open = true;
          console.error(`[Broker] Circuit OPEN for handler after ${CIRCUIT_TRIP} failures`, err);
        }
        if (this.dlq.length < DLQ_MAX) this.dlq.push(signal);
      }
    }
  }

  private _getBreaker(handler: Handler): CircuitBreaker {
    if (!this.breakers.has(handler)) {
      this.breakers.set(handler, { failures: 0, lastFailure: 0, open: false });
    }
    return this.breakers.get(handler)!;
  }
}

// Singleton broker shared across all pipeline stages.
export const broker = new MessageBroker();
