import { Router, type Request } from 'express';

const router = Router();

const DEFAULT_OLLAMA_BASE = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

function getOllamaBase(req: Request): string {
  const header = req.headers['x-ollama-host'];
  if (typeof header === 'string' && /^https?:\/\/.+/.test(header)) {
    return header.replace(/\/$/, '');
  }
  return DEFAULT_OLLAMA_BASE;
}

router.get('/tags', async (req, res) => {
  try {
    const r = await fetch(`${getOllamaBase(req)}/api/tags`);
    const data = await r.json();
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: `Ollama unreachable: ${err.message}` });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const r = await fetch(`${getOllamaBase(req)}/api/chat`, {
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
    const r = await fetch(`${getOllamaBase(req)}/api/generate`, {
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
    const r = await fetch(`${getOllamaBase(req)}/api/embeddings`, {
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

/**
 * OpenAI-compatible passthrough. Ollama natively serves the OpenAI shape at
 * `/v1/*` (e.g. /v1/chat/completions). Browsers behind the proxy can't reach
 * `localhost:11434` directly, so ARGUS calls this same-origin relay instead:
 *   <base>/api/ollama/v1/chat/completions  →  ollama :11434/v1/chat/completions
 * Handles both streaming and non-streaming by relaying the raw body/stream.
 */
router.all(/^\/v1\/.*/, async (req, res) => {
  try {
    const target = `${getOllamaBase(req)}${req.originalUrl.replace(/^.*\/api\/ollama/, '')}`;
    const r = await fetch(target, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body),
    });
    res.status(r.status);
    const ct = r.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    const text = await r.text();
    res.send(text);
  } catch (err: any) {
    res.status(502).json({ error: `Ollama unreachable: ${err.message}` });
  }
});

export default router;
