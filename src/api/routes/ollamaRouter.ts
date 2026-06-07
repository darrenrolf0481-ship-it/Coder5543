import { Router } from 'express';

const router = Router();

const OLLAMA_BASE = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

router.get('/tags', async (_req, res) => {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`);
    const data = await r.json();
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: `Ollama unreachable: ${err.message}` });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(r.status).send(text);
  } catch (err: any) {
    res.status(502).json({ error: `Ollama unreachable: ${err.message}` });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(r.status).send(text);
  } catch (err: any) {
    res.status(502).json({ error: `Ollama unreachable: ${err.message}` });
  }
});

router.post('/embeddings', async (req, res) => {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err: any) {
    res.status(502).json({ error: `Ollama unreachable: ${err.message}` });
  }
});

export default router;
