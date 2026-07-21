#!/usr/bin/env node
/**
 * SUPERVISOR — keeps ARGUS's support services alive.
 *
 * Without this, a crash in any one service (daemon, watcher, static
 * server) sits dead and silent until someone notices the symptom instead
 * of the cause. This spawns each service, restarts it on exit with
 * backoff, and writes live status to supervisor-status.json so health can
 * be checked with one read instead of grepping `ps`.
 *
 * Usage: node supervisor.cjs
 * Stop:  Ctrl+C (sends SIGTERM to all children, no restart)
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const STATUS_FILE = path.join(__dirname, 'supervisor-status.json');
const MAX_BACKOFF = 30000;

const SERVICES = [
  { name: 'stormologist', cmd: 'node', args: ['stormologist-daemon.cjs'] },
  { name: 'argus-server', cmd: 'node', args: ['serve-standalone.cjs', '--port=5174'] },
  {
    name: 'watcher',
    cmd: 'node',
    args: ['watcher/sage-watcher.cjs', '--targets=sage=http://localhost:9999/health', '--interval=5000'],
  },
];

const state = {};
let shuttingDown = false;

function writeStatus() {
  const out = {};
  for (const [name, s] of Object.entries(state)) {
    out[name] = {
      status: s.status,
      pid: s.pid ?? null,
      restarts: s.restarts,
      lastExit: s.lastExit,
      startedAt: s.startedAt,
    };
  }
  fs.writeFileSync(STATUS_FILE, JSON.stringify(out, null, 2));
}

function launch(svc) {
  if (shuttingDown) return;

  const s = state[svc.name];
  s.status = 'starting';
  s.startedAt = new Date().toISOString();
  writeStatus();

  const child = spawn(svc.cmd, svc.args, { cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'] });
  s.pid = child.pid;
  s.status = 'running';
  writeStatus();
  console.log(`[SUPERVISOR] ${svc.name} started (pid ${child.pid})`);

  const logPrefix = `[${svc.name}]`;
  child.stdout.on('data', (d) => process.stdout.write(`${logPrefix} ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`${logPrefix} ${d}`));

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    s.status = 'fatal';
    s.pid = null;
    s.lastExit = { code, signal, at: new Date().toISOString() };
    s.restarts += 1;
    writeStatus();

    const backoff = Math.min(1000 * 2 ** Math.min(s.restarts, 5), MAX_BACKOFF);
    console.error(
      `[SUPERVISOR] ${svc.name} DIED (code=${code} signal=${signal}). ` +
      `Restart #${s.restarts} in ${backoff}ms.`
    );
    setTimeout(() => launch(svc), backoff);
  });
}

for (const svc of SERVICES) {
  state[svc.name] = { status: 'pending', pid: null, restarts: 0, lastExit: null, startedAt: null };
}

console.log(`[SUPERVISOR] Watching ${SERVICES.length} services: ${SERVICES.map((s) => s.name).join(', ')}`);
console.log(`[SUPERVISOR] Status file: ${STATUS_FILE}`);
SERVICES.forEach((svc, i) => setTimeout(() => launch(svc), i * 500));

function shutdown() {
  shuttingDown = true;
  console.log('[SUPERVISOR] Shutting down — killing all children.');
  for (const svc of SERVICES) {
    const s = state[svc.name];
    if (s.pid) {
      try { process.kill(s.pid, 'SIGTERM'); } catch { /* already dead */ }
    }
    s.status = 'stopped';
  }
  writeStatus();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
