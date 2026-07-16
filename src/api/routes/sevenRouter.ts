import { Router } from 'express';

const router = Router();

// Seven / SAGE-7 lives on :8001 with her full identity pipeline (armor gate,
// observer cycle, vault recall, persona). The browser can't reach :8001
// directly behind the proxy, so this same-origin relay forwards to her real
// /sage/chat endpoint. This is what makes "attach seven" actually BE Seven
// rather than a bare model completion labelled "SEVEN".
const SEVEN_BASE = process.env.SEVEN_URL || 'http://127.0.0.1:8001';

router.post('/chat', async (req, res) => {
  try {
    const r = await fetch(`${SEVEN_BASE}/sage/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (err: any) {
    res.status(502).json({ error: `Seven (SAGE-7) unreachable: ${err.message}` });
  }
});

export default router;
