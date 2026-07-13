import { Router } from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const router = Router();

const AGY_TOKEN_PATH = path.join(os.homedir(), '.gemini/antigravity-cli/antigravity-oauth-token');

function resolveAgyBin(): string {
  if (process.env.AGY_BIN) return process.env.AGY_BIN;
  const localBin = path.join(os.homedir(), '.local/bin/agy');
  return fs.existsSync(localBin) ? localBin : 'agy';
}

const AGY_BIN = resolveAgyBin();

function runAgy(
  args: string[],
  timeoutMs: number,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(AGY_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => proc.kill('SIGKILL'), timeoutMs);
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => { clearTimeout(timer); resolve({ code: code ?? -1, stdout, stderr }); });
    proc.on('error', (err) => { clearTimeout(timer); resolve({ code: -1, stdout, stderr: String(err) }); });
  });
}

router.get('/status', async (_req, res) => {
  const authed = fs.existsSync(AGY_TOKEN_PATH);
  if (!authed) {
    res.json({ status: 'unauthenticated', models: [] });
    return;
  }
  try {
    const r = await runAgy(['models', '--json'], 10000);
    let models: string[] = [];
    try { models = JSON.parse(r.stdout); } catch { models = []; }
    res.json({ status: 'authenticated', models });
  } catch {
    res.json({ status: 'authenticated', models: [] });
  }
});

router.post('/chat', async (req, res) => {
  const { messages, model } = req.body as { messages?: any[]; model?: string };
  if (!messages?.length) {
    res.status(400).json({ error: 'messages required' });
    return;
  }
  if (!fs.existsSync(AGY_TOKEN_PATH)) {
    res.status(401).json({ error: 'Antigravity not authenticated. Run `agy` in terminal to log in.' });
    return;
  }

  const last = messages[messages.length - 1];
  const prompt = typeof last?.content === 'string'
    ? last.content
    : Array.isArray(last?.content)
      ? last.content.map((c: any) => c.text || '').join('')
      : String(last);

  const args = ['-p', prompt];
  if (model) args.push('--model', model);

  try {
    const r = await runAgy(args, 300000);
    const text = r.stdout.trim();
    if (r.code !== 0 && !text) {
      res.status(502).json({ error: `agy error (rc=${r.code}): ${r.stderr.slice(0, 400)}` });
      return;
    }
    res.json({ choices: [{ message: { role: 'assistant', content: text || '(no output)' } }] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
