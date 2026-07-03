import { NextRequest, NextResponse } from 'next/server';

// Direct line to SAGE-7's real mind: her soul + memory recall live behind
// /sage/chat on the Python backend (:8001).
const SAGE7_BASE = 'http://localhost:8001';

// ── Abuse guards ──────────────────────────────────────────────────────────────
// This route fronts a paid cloud model. Without limits it's an open, unthrottled
// door to spend/DoS. These caps stop that without breaking normal UI usage.
const MAX_MESSAGE_CHARS = 8000;
const MAX_HISTORY_TURNS = 12;
const MAX_HISTORY_CHARS = 24000;
const RATE_LIMIT = 30; // requests per window, per client
const RATE_WINDOW_MS = 60_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  b.count += 1;
  return b.count > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  const clientKey =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local';
  if (rateLimited(clientKey)) {
    return NextResponse.json({ error: 'Rate limit exceeded — slow down.' }, { status: 429 });
  }

  // Optional shared secret — enforced only when SAGE_CHAT_SECRET is set in the env.
  const secret = process.env.SAGE_CHAT_SECRET;
  if (secret) {
    const got =
      req.headers.get('x-sage-key') ||
      (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (got !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: { message?: unknown; model?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message, model, history } = body ?? {};

  // Strict input typing — a non-string message would reach the backend as an
  // object and break her recall/search path.
  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'message must be a non-empty string' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      { error: `message too long (max ${MAX_MESSAGE_CHARS} chars)` },
      { status: 413 },
    );
  }
  const modelStr = typeof model === 'string' ? model : undefined;
  let safeHistory: unknown[] = Array.isArray(history) ? history.slice(-MAX_HISTORY_TURNS) : [];
  if (JSON.stringify(safeHistory).length > MAX_HISTORY_CHARS) {
    safeHistory = []; // drop oversized history rather than forward it to the model
  }

  try {
    const res = await fetch(`${SAGE7_BASE}/sage/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, model: modelStr, history: safeHistory }),
      signal: AbortSignal.timeout(120000),
    });
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'sage-chat proxy error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
