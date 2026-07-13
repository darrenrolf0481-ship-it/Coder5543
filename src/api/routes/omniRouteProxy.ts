import { Router, Request, Response } from 'express';

const router = Router();
const BASE = 'http://localhost:20130';
const PASSWORD = process.env.OMNIROUTE_PASSWORD || 'crimson2026';

let sessionCookie: string | null = null;
let cookieExpiry = 0;

async function ensureAuth(): Promise<string> {
  if (sessionCookie && Date.now() < cookieExpiry) return sessionCookie;
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD }),
  });
  const setCookie = r.headers.get('set-cookie');
  const match = setCookie?.match(/auth_token=([^;]+)/);
  if (!match) throw new Error('OmniRoute login failed');
  sessionCookie = `auth_token=${match[1]}`;
  cookieExpiry = Date.now() + 25 * 24 * 60 * 60 * 1000; // 25 days
  return sessionCookie;
}

// Proxy all /api/omniroute/* → OmniRoute /api/*
// req.url here is relative to where the router was mounted, so it starts with /
router.all('/*splat', async (req: Request, res: Response) => {
  try {
    const cookie = await ensureAuth();
    const target = `${BASE}/api${req.url}`;

    const headers: Record<string, string> = {
      Cookie: cookie,
      'Content-Type': 'application/json',
    };

    const fetchOpts: RequestInit = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(target, fetchOpts);

    // If auth expired, retry once
    if (upstream.status === 401) {
      sessionCookie = null;
      const cookie2 = await ensureAuth();
      headers.Cookie = cookie2;
      const retry = await fetch(target, { ...fetchOpts, headers });
      res.status(retry.status);
      const ct = retry.headers.get('content-type');
      if (ct) res.setHeader('Content-Type', ct);
      const text = await retry.text();
      res.send(text);
      return;
    }

    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    const text = await upstream.text();
    res.send(text);
  } catch (err: any) {
    res.status(502).json({ error: `OmniRoute proxy: ${err.message}` });
  }
});

export default router;
