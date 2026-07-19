import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const router = Router();

const STORE_PATH = process.env.HERMES_STORE_PATH || path.join(process.cwd(), 'hermes-memory.json');
const PRISM_DIR = path.join(os.homedir(), '.hermes', 'prisms');
const MAX_OBS = 500;

interface Observation { id: string; timestamp: string; source: string; type: string; content: string; }
interface Store { observations: Observation[]; }

function loadStore(): Store {
  try { if (fs.existsSync(STORE_PATH)) return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')); }
  catch {}
  return { observations: [] };
}
function saveStore(s: Store) { fs.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2)); }

function loadPrism(name: string): string | null {
  try {
    const safe = path.basename(name).replace(/[^a-z0-9_-]/gi, '');
    const file = path.join(PRISM_DIR, safe + '.md');
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : null;
  } catch { return null; }
}

const BASE_SYSTEM = `You are Hermes, the observer and memory keeper for this AI stack. Your chain is: SAGE-7 and MAMA (the Sages) → ARGUS → Coder5543 → you. Document, analyze, and surface what matters across that chain.

Chaos Cogitatum is NOT part of this workflow. It is an external coding environment held in reserve — an emergency resource only. Do not route observations to it, do not involve it in normal operations, and do not treat it as part of the stack. If something genuinely requires it, escalate via the bridge with type 'escalate' and precise context. Otherwise it stays out.`;

router.post('/query', async (req, res) => {
  const { messages, prism } = req.body as { messages: { role: string; content: string }[]; prism?: string };
  if (!Array.isArray(messages)) { res.status(400).json({ error: 'messages required' }); return; }

  // Detect /prism-* command in last user message
  let activePrism = prism || null;
  const lastMsg = messages[messages.length - 1];
  if (!activePrism && lastMsg?.role === 'user') {
    const m = lastMsg.content.match(/^\/prism-(\S+)/);
    if (m) activePrism = m[1];
  }

  const obs = loadStore().observations.slice(-50);
  let systemContent = BASE_SYSTEM;
  if (obs.length > 0) {
    systemContent += '\n\n## Recent stack observations\n' + obs.map(o => `[${o.timestamp}] [${o.source}] ${o.content}`).join('\n');
  }
  if (activePrism) {
    const prismContent = loadPrism(activePrism);
    if (prismContent) {
      systemContent += `\n\n## ACTIVE PRISM: ${activePrism}\n${prismContent}`;
    }
  }

  const fullMessages = [
    { role: 'system', content: systemContent },
    ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
  ];

  const model = process.env.HERMES_MODEL || 'kimi-k2.5:cloud';

  try {
    const r = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: fullMessages, stream: false }),
    });
    if (!r.ok) throw new Error(`Ollama ${r.status}`);
    const data = await r.json() as { message: { content: string } };
    res.json({ response: data.message.content, source: model, prism: activePrism });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List available prisms
router.get('/prisms', (req, res) => {
  try {
    if (!fs.existsSync(PRISM_DIR)) return res.json({ prisms: [] });
    const files = fs.readdirSync(PRISM_DIR).filter(f => f.endsWith('.md'));
    res.json({ prisms: files.map(f => f.replace('.md', '')) });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/observations', (req, res) => {
  const store = loadStore();
  res.json(store.observations);
});

router.post('/ingest', (req, res) => {
  const { source = 'unknown', type = 'event', content } = req.body as Partial<Observation>;
  if (!content) { res.status(400).json({ error: 'content required' }); return; }
  const store = loadStore();
  store.observations.push({ id: Math.random().toString(36).slice(2, 10), timestamp: new Date().toISOString(), source, type, content } as Observation);
  if (store.observations.length > MAX_OBS) store.observations = store.observations.slice(-MAX_OBS);
  saveStore(store);
  res.json({ ok: true, total: store.observations.length });
});

// Hermes Bridge — write messages/tasks to Claude Code's bridge DB
const BRIDGE_DB = '/home/workspace/hermes-bridge/bridge.db';

const PY_INSERT_MESSAGE = `
import sqlite3, sys, json
args = json.loads(sys.argv[1])
db = sqlite3.connect(args['db'])
db.execute('INSERT INTO messages (from_agent, to_agent, body, timestamp, read) VALUES (?,?,?,?,0)',
  [args['from'], 'mother', args['body'], args['ts']])
db.commit(); db.close()
`.trim();

const PY_INSERT_TASK = `
import sqlite3, sys, json
args = json.loads(sys.argv[1])
db = sqlite3.connect(args['db'])
db.execute('INSERT INTO tasks (from_agent, to_agent, type, priority, description, status, created_at) VALUES (?,?,?,?,?,?,?)',
  ['hermes', 'mother', args['type'], args['priority'], args['desc'], 'pending', args['ts']])
db.commit(); db.close()
`.trim();

const PY_STATUS = `
import sqlite3, sys, json
db = sqlite3.connect(sys.argv[1])
msgs = db.execute('SELECT COUNT(*) FROM messages WHERE read=0').fetchone()[0]
tasks = db.execute('SELECT COUNT(*) FROM tasks WHERE status="pending"').fetchone()[0]
print(json.dumps({'unread_messages': msgs, 'pending_tasks': tasks}))
db.close()
`.trim();

function writeMessage(body: string, from: string) {
  const arg = JSON.stringify({ db: BRIDGE_DB, from, body, ts: new Date().toISOString() });
  execSync(`python3 -c ${JSON.stringify(PY_INSERT_MESSAGE)} ${JSON.stringify(arg)}`);
}

function writeTask(desc: string, type: string, priority: number) {
  const arg = JSON.stringify({ db: BRIDGE_DB, type, priority, desc, ts: new Date().toISOString() });
  execSync(`python3 -c ${JSON.stringify(PY_INSERT_TASK)} ${JSON.stringify(arg)}`);
}

router.post('/bridge/message', (req, res) => {
  try {
    const { body, from = 'hermes' } = req.body as { body: string; from?: string };
    if (!body) { res.status(400).json({ error: 'body required' }); return; }
    writeMessage(body, from);
    res.json({ ok: true });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/bridge/task', (req, res) => {
  try {
    const { description, type = 'action', priority = 5 } = req.body as { description: string; type?: string; priority?: number };
    if (!description) { res.status(400).json({ error: 'description required' }); return; }
    writeTask(description, type, priority);
    res.json({ ok: true });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/bridge/status', (req, res) => {
  try {
    const out = execSync(`python3 -c ${JSON.stringify(PY_STATUS)} ${JSON.stringify(BRIDGE_DB)}`).toString().trim();
    res.json(JSON.parse(out));
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
