#!/usr/bin/env node
/**
 * SAGE WATCHER — reference implementation of the "watcher" role from
 * ESCALATION_PROTOCOL.md. Health-checks agent endpoints on an interval
 * and reports telemetry (timings + status codes ONLY — never content)
 * to the Stormologist daemon, which decides whether to raise an alert.
 *
 * The full reasoning-tier watcher lives in the ADHD-Sage repo; this one
 * is deliberately dumb so the loop can run before that lands.
 *
 * Usage:
 *   node watcher/sage-watcher.cjs --targets=sage=http://localhost:8000/health,seven=http://localhost:8001/health
 *   npm run watcher -- --targets=sage=http://localhost:8000/health
 *
 * Flags (all optional except --targets):
 *   --targets=name=url[,name=url...]   endpoints to health-check (or env SAGE_TARGETS)
 *   --daemon=ws://localhost:8765       Stormologist daemon
 *   --interval=15000                   ms between check rounds
 *   --timeout=5000                     ms before a check counts as a handshake timeout
 *   --fail-threshold=1                 consecutive failures before reporting (charter
 *                                      default 1: uncertain → isolate)
 */

const WebSocket = require('ws');

function flag(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
}

const DAEMON = flag('daemon', 'ws://localhost:8765');
const INTERVAL = parseInt(flag('interval', '15000'), 10);
const TIMEOUT = parseInt(flag('timeout', '5000'), 10);
const FAIL_THRESHOLD = parseInt(flag('fail-threshold', '1'), 10);

const targetSpec = flag('targets', process.env.SAGE_TARGETS ?? '');
const TARGETS = targetSpec
  .split(',')
  .filter(Boolean)
  .map((pair) => {
    const i = pair.indexOf('=');
    return { name: pair.slice(0, i), url: pair.slice(i + 1), fails: 0 };
  });

if (TARGETS.length === 0) {
  console.error('No targets. Usage: --targets=sage=http://localhost:8000/health[,seven=...]');
  process.exit(1);
}

// ── Daemon link (auto-reconnect) ────────────────────────────────────────────

let ws = null;
function connectDaemon() {
  ws = new WebSocket(DAEMON);
  ws.on('open', () => console.log(`[WATCHER] Linked to Stormologist at ${DAEMON}`));
  ws.on('close', () => {
    console.log('[WATCHER] Daemon link down — retrying in 5s');
    setTimeout(connectDaemon, 5000);
  });
  ws.on('error', () => { /* close handler reconnects */ });
  ws.on('message', () => { /* watcher only reports; alerts are the dashboard's job */ });
}
connectDaemon();

function sendTelemetry(meta) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'telemetry', meta }));
    console.log(`[WATCHER] telemetry → ${JSON.stringify(meta)}`);
  } else {
    console.log(`[WATCHER] daemon offline — dropped: ${JSON.stringify(meta)}`);
  }
}

// ── Health checks ───────────────────────────────────────────────────────────

async function checkTarget(t) {
  const start = Date.now();
  const ctrl = new AbortController();
  const killer = setTimeout(() => ctrl.abort(), TIMEOUT);

  try {
    const res = await fetch(t.url, { signal: ctrl.signal });
    clearTimeout(killer);
    const ms = Date.now() - start;

    if (res.ok) {
      if (t.fails >= FAIL_THRESHOLD) console.log(`[WATCHER] ${t.name} RECOVERED (${ms}ms)`);
      t.fails = 0;
      return;
    }

    t.fails++;
    const body = await res.text().catch(() => '');
    if ([404, 403].includes(res.status) && /model.?not.?found/i.test(body)) {
      // Backend rotated/lost its model — the api_backend_mismatch rule.
      if (t.fails >= FAIL_THRESHOLD) {
        sendTelemetry({ statusCode: res.status, error: 'model_not_found', nodes: [t.name] });
      }
    } else {
      // Honest report: send the status code; if no daemon rule matches,
      // the daemon ignores it (per protocol, healthy/unclassified traffic
      // is fine to send).
      if (t.fails >= FAIL_THRESHOLD) {
        sendTelemetry({ statusCode: res.status, nodes: [t.name] });
        console.log(`[WATCHER] ${t.name} unhealthy: HTTP ${res.status} (no matching daemon rule — logged only)`);
      }
    }
  } catch {
    clearTimeout(killer);
    t.fails++;
    // Timeout or connection refused: the handshake never completed within
    // budget. Report the full elapsed wait (>= TIMEOUT for aborts; for a
    // fast ECONNREFUSED we still report the budget as the effective wait,
    // since "down" and "too slow" are the same condition to the daemon).
    const elapsed = Math.max(Date.now() - start, TIMEOUT + 1);
    if (t.fails >= FAIL_THRESHOLD) {
      sendTelemetry({ handshakeMs: elapsed, nodes: [t.name] });
    }
  }
}

async function round() {
  await Promise.all(TARGETS.map(checkTarget));
}

console.log(`[WATCHER] Watching ${TARGETS.map((t) => `${t.name}(${t.url})`).join(', ')}`);
console.log(`[WATCHER] interval=${INTERVAL}ms timeout=${TIMEOUT}ms fail-threshold=${FAIL_THRESHOLD}`);
round();
setInterval(round, INTERVAL);
