import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const STORE_PATH = process.env.HERMES_STORE_PATH || path.join(process.cwd(), 'hermes-memory.json');
const MAX_OBS = 500;

interface Observation { id: string; timestamp: string; source: string; type: string; content: string; }
interface Store { observations: Observation[]; }

function loadStore(): Store {
  try { if (fs.existsSync(STORE_PATH)) return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')); }
  catch {}
  return { observations: [] };
}
function saveStore(s: Store) { fs.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2)); }

const SYSTEM_PROMPT = `You are Hermes, the observer and memory keeper for a multi-agent system (Crimson OS, ARGUS, SAGE-7). Your job is careful reasoning, analysis, and documentation. You see everything happening across the stack.`;

router.post('/query', async (req, res) => {
  const { messages } = req.body as { messages: { role: string; content: string }[] };
  if (!Array.isArray(messages)) { res.status(400).json({ error: 'messages required' }); return; }

  const obs = loadStore().observations.slice(-50);
  const systemContent = obs.length > 0
    ? SYSTEM_PROMPT + '\n\n## Recent stack observations\n' + obs.map(o => `[${o.timestamp}] [${o.source}] ${o.content}`).join('\n')
    : SYSTEM_PROMPT;

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
    res.json({ response: data.message.content, source: model });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

export default router;
