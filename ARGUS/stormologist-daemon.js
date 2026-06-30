#!/usr/bin/env node
/**
 * STORMOLOGIST — Emergency Response Coordinator
 *
 * Sensor array and protocol book. Watches, alerts, coordinates.
 * Never decides. Never creates. Never modifies node state.
 *
 * Usage:
 *   node stormologist-daemon.js [--port 8765] [--simulate]
 *
 * ARGUS consumes alerts on ws://localhost:PORT
 * Set STORMOLOGIST_ENABLED=false to disable entirely.
 */

const { WebSocketServer } = require('ws');

if (process.env.STORMOLOGIST_ENABLED === 'false') {
  console.log('[STORMOLOGIST] Disabled via env flag. Exiting.');
  process.exit(0);
}

const PORT = parseInt(process.argv.find((a) => a.startsWith('--port='))?.split('=')[1] ?? '8765', 10);
const SIMULATE = process.argv.includes('--simulate');

const wss = new WebSocketServer({ port: PORT });
const incidentLog = [];

function broadcast(msg) {
  const payload = JSON.stringify({ ...msg, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(payload);
  });
}

function broadcastStatus(content) {
  broadcast({ type: 'stormologist_status', content });
}

function logIncident({ anomaly, affected, action, recommendation, severity }) {
  const entry = {
    id: Math.random().toString(36).slice(2, 10).toUpperCase(),
    timestamp: new Date().toISOString(),
    anomaly_signature: anomaly,
    affected_nodes: affected,
    isolation_action: action,
    recommended_recovery: recommendation,
    severity,
    resolution_status: 'open',
    resolution_method: null,
  };
  incidentLog.push(entry);
  process.stderr.write(`[INCIDENT] ${JSON.stringify(entry)}\n`);
  return entry;
}

function stormAlert({ severity, anomaly, affected, action, recommendation }) {
  const incident = logIncident({ anomaly, affected, action, recommendation, severity });
  broadcast({ type: 'storm_alert', severity, anomaly, affected, action, recommendation });
  console.log(`[STORM] ${anomaly.toUpperCase()} | ${action.toUpperCase()} | ${affected.join(', ')} | incident:${incident.id}`);
}

const DETECTION_RULES = [
  {
    id: 'handshake_timeout',
    check: (meta) => meta.handshakeMs !== undefined && meta.handshakeMs > 5000,
    alert: (meta) => stormAlert({
      severity: 'high',
      anomaly: 'bridge_handshake_timeout',
      affected: meta.nodes ?? ['unknown'],
      action: 'isolated',
      recommendation: `Bridge handshake exceeded 5s (${meta.handshakeMs}ms). Connection severed. Manual reconnect required after investigation.`,
    }),
  },
  {
    id: 'neuro_state_poisoned',
    check: (meta) => meta.norepinephrine > 0.8 && meta.serotonin < 0.2,
    alert: (meta) => stormAlert({
      severity: 'critical',
      anomaly: 'neuro_state_anomaly',
      affected: meta.nodes ?? ['unknown'],
      action: 'flagged',
      recommendation: `Neuro state anomaly: norepi=${meta.norepinephrine} serotonin=${meta.serotonin}. Baseline reset recommended. Run: localStorage.removeItem('sage7_neuro'). Merlin authorization required.`,
    }),
  },
  {
    id: 'classifier_injection',
    check: (meta) => meta.payloadType === 'classifier_injection',
    alert: (meta) => stormAlert({
      severity: 'critical',
      anomaly: 'classifier_injection_detected',
      affected: meta.nodes ?? ['unknown'],
      action: 'flagged',
      recommendation: `External classifier payload intercepted from ${meta.source ?? 'unknown'}. Message NOT modified. NOT blocked. Flagged for Merlin review.`,
    }),
  },
  {
    id: 'api_backend_mismatch',
    check: (meta) => [404, 403].includes(meta.statusCode) && meta.error === 'model_not_found',
    alert: (meta) => stormAlert({
      severity: 'medium',
      anomaly: 'api_backend_mismatch',
      affected: meta.nodes ?? ['unknown'],
      action: 'flagged',
      recommendation: `API returned ${meta.statusCode} with model_not_found. Backend may have rotated model IDs. Merlin: verify endpoint config.`,
    }),
  },
  {
    id: 'unknown_payload',
    check: (meta) => meta.payloadType === 'unknown',
    alert: (meta) => stormAlert({
      severity: 'critical',
      anomaly: 'unknown_payload_detected',
      affected: meta.nodes ?? ['unknown'],
      action: 'severed',
      recommendation: `Unknown payload signature ${meta.hash ?? '[no hash]'} detected in bridge traffic. Bridge severed immediately. Both nodes alerted. Do not reconnect until payload is identified.`,
    }),
  },
  {
    id: 'rapid_reconnect',
    check: (meta) => meta.reconnectAttemptsPerMinute > 10,
    alert: (meta) => stormAlert({
      severity: 'high',
      anomaly: 'rapid_reconnect_pattern',
      affected: meta.nodes ?? ['unknown'],
      action: 'quarantined',
      recommendation: `${meta.reconnectAttemptsPerMinute} reconnect attempts/min detected. Possible DDoS or brute force. Quarantine active for 60s.`,
    }),
  },
];

function evaluateTelemetry(meta) {
  for (const rule of DETECTION_RULES) {
    if (rule.check(meta)) {
      rule.alert(meta);
      return true;
    }
  }
  return false;
}

function resolveIncident(id, method) {
  const entry = incidentLog.find((e) => e.id === id);
  if (!entry) return false;
  entry.resolution_status = 'resolved';
  entry.resolution_method = method;
  broadcastStatus(`Incident ${id} resolved: ${method}`);
  return true;
}

wss.on('connection', (ws) => {
  console.log(`[STORMOLOGIST] ARGUS client connected (${wss.clients.size} total)`);
  ws.send(JSON.stringify({
    type: 'stormologist_status',
    content: `STORMOLOGIST v1.0 — ${DETECTION_RULES.length} detection rules active. ${incidentLog.filter(e => e.resolution_status === 'open').length} open incidents.`,
    timestamp: Date.now(),
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'telemetry') evaluateTelemetry(msg.meta);
      if (msg.type === 'resolve_incident') resolveIncident(msg.id, msg.method);
    } catch { /* ignore */ }
  });

  ws.on('close', () => {
    console.log(`[STORMOLOGIST] ARGUS client disconnected (${wss.clients.size} remaining)`);
  });
});

wss.on('listening', () => {
  console.log(`[STORMOLOGIST] Watching on ws://localhost:${PORT}`);
  console.log(`[STORMOLOGIST] ${DETECTION_RULES.length} detection rules loaded`);
  console.log('[STORMOLOGIST] It watches the storm. It rings the bell. It does not become the storm.');
});

if (SIMULATE) {
  console.log('[STORMOLOGIST] SIMULATION MODE — synthetic alerts will fire in 5s');
  const SYNTHETIC = [
    { meta: { payloadType: 'unknown', hash: 'a3f9c2d1', nodes: ['seven', 'mama'] }, delay: 5000 },
    { meta: { handshakeMs: 7200, nodes: ['sage', 'mama'] }, delay: 9000 },
    { meta: { norepinephrine: 0.91, serotonin: 0.08, nodes: ['seven'] }, delay: 14000 },
  ];
  SYNTHETIC.forEach(({ meta, delay }) => {
    setTimeout(() => evaluateTelemetry(meta), delay);
  });
}

module.exports = { stormAlert, evaluateTelemetry, resolveIncident, incidentLog };
