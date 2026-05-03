// ── Stage 2: Filtering ────────────────────────────────────────────────────────
// Subscribes to SIGNAL_INGESTED.  Applies:
//   • Rate limiting  — max 8 signals / 1 s per source
//   • Deduplication  — drops identical (source + hash) within 300 ms
//   • Content guard  — strips control chars, enforces max payload size
//   • Enrichment     — attaches pipeline metadata consumed by stage 3
//
// Publishes SIGNAL_FILTERED or SIGNAL_DROPPED.

import { broker, Signal, SignalSource } from '../messageBroker';

// ── Rate-limit window ─────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 1_000;
const RATE_MAX = 8;
const rateBuckets = new Map<SignalSource, number[]>();

function checkRateLimit(source: SignalSource): boolean {
  const now = Date.now();
  const bucket = (rateBuckets.get(source) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (bucket.length >= RATE_MAX) return false;
  bucket.push(now);
  rateBuckets.set(source, bucket);
  return true;
}

// ── Deduplication window ──────────────────────────────────────────────────────
const DEDUP_WINDOW_MS = 300;
const recentHashes = new Map<string, number>();

function quickHash(source: SignalSource, data: unknown): string {
  const str = source + JSON.stringify(data);
  let h = 0;
  for (let i = 0; i < Math.min(str.length, 256); i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

function isDuplicate(source: SignalSource, data: unknown): boolean {
  const key = quickHash(source, data);
  const last = recentHashes.get(key);
  if (last && Date.now() - last < DEDUP_WINDOW_MS) return true;
  recentHashes.set(key, Date.now());
  // Prune old entries to avoid unbounded growth
  if (recentHashes.size > 500) {
    const cutoff = Date.now() - DEDUP_WINDOW_MS;
    recentHashes.forEach((ts, k) => { if (ts < cutoff) recentHashes.delete(k); });
  }
  return false;
}

// ── Content guard ─────────────────────────────────────────────────────────────
const MAX_PAYLOAD_BYTES = 64_000;

function sanitize(data: unknown): { ok: boolean; data: unknown } {
  try {
    const serialised = JSON.stringify(data);
    if (serialised.length > MAX_PAYLOAD_BYTES) {
      return { ok: false, data: null };
    }
    // Strip ASCII control characters from string payloads
    if (typeof data === 'string') {
      return { ok: true, data: data.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, data: null };
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
async function onIngested(signal: Signal): Promise<void> {
  const source = signal.source;

  if (!checkRateLimit(source)) {
    await broker.publish('SIGNAL_DROPPED', signal.data, source, {
      reason: 'rate_limit',
      correlationId: signal.id,
    });
    return;
  }

  if (isDuplicate(source, signal.data)) {
    await broker.publish('SIGNAL_DROPPED', signal.data, source, {
      reason: 'duplicate',
      correlationId: signal.id,
    });
    return;
  }

  const { ok, data: cleaned } = sanitize(signal.data);
  if (!ok) {
    await broker.publish('SIGNAL_DROPPED', signal.data, source, {
      reason: 'payload_too_large_or_malformed',
      correlationId: signal.id,
    });
    return;
  }

  await broker.publish(
    'SIGNAL_FILTERED',
    cleaned,
    source,
    {
      ...signal.meta,
      correlationId: signal.id,
      filteredAt: Date.now(),
    },
  );
}

// ── Bootstrap (call once at app start) ───────────────────────────────────────
let _started = false;
export function startFilteringService(): () => void {
  if (_started) return () => {};
  _started = true;
  const unsub = broker.subscribe('SIGNAL_INGESTED', onIngested);
  return () => { unsub(); _started = false; };
}
