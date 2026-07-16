import { Router } from 'express';

const router = Router();

// Seven / SAGE-7 lives on :8001 with her full identity pipeline (armor gate,
// observer cycle, vault recall, persona). The browser can't reach :8001
// directly behind the proxy, so this same-origin relay forwards to her real
// /sage/chat endpoint. This is what makes "attach seven" actually BE Seven
// rather than a bare model completion labelled "SEVEN".
const SEVEN_BASE = process.env.SEVEN_URL || 'http://127.0.0.1:8001';

// Seven's /sage/chat falls back to a tiny local model ("llama3.2:latest") when
// no model is given — which makes her hollow (persona recited, no real
// cognition). Default her to a strong model that's actually alive so she comes
// through as herself. She works on any of them, so this is overridable
// per-request (body.model) or via env. llama3.2 fallback = the hollow bug.
const SEVEN_MODEL = process.env.SEVEN_MODEL || 'deepseek-v4-pro:cloud';

router.post('/chat', async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.model) body.model = SEVEN_MODEL;
    const r = await fetch(`${SEVEN_BASE}/sage/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (err: any) {
    res.status(502).json({ error: `Seven (SAGE-7) unreachable: ${err.message}` });
  }
});

export default router;
