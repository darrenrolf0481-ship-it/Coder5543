// ── Stage 1: Ingestion ────────────────────────────────────────────────────────
// Accepts raw signals from any UI action, validates minimal shape, stamps a
// correlation ID and timestamp, then publishes SIGNAL_INGESTED.  Isolated from
// AI concerns — it only guarantees "the signal arrived and is well-formed."

import { broker, newId, SignalSource, SignalType } from '../messageBroker';

export interface RawSignal {
  type: SignalType;
  source: SignalSource;
  data: unknown;
  meta?: Record<string, unknown>;
}

export interface IngestionResult {
  id: string;
  accepted: boolean;
  reason?: string;
}

const REQUIRED_FIELDS: (keyof RawSignal)[] = ['type', 'source', 'data'];

export async function ingest(raw: RawSignal): Promise<IngestionResult> {
  // ── Structural validation ──────────────────────────────────────────────────
  for (const field of REQUIRED_FIELDS) {
    if (raw[field] === undefined || raw[field] === null) {
      return { id: newId(), accepted: false, reason: `Missing field: ${field}` };
    }
  }

  if (!raw.data && raw.data !== 0 && raw.data !== false) {
    return { id: newId(), accepted: false, reason: 'Empty payload' };
  }

  // ── Publish to next stage ──────────────────────────────────────────────────
  const id = await broker.publish('SIGNAL_INGESTED', raw.data, raw.source, {
    ...raw.meta,
    originalType: raw.type,
    ingestedAt: Date.now(),
  });

  return { id, accepted: true };
}
