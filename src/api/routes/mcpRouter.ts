import { Router } from 'express';
import { mcpManager } from '../../services/mcp/McpManager.js';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

router.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // @ts-ignore
  if (res.flushHeaders) res.flushHeaders();

  res.write(`event: endpoint\ndata: ${encodeURIComponent('/api/mcp/messages')}\n\n`);

  const interval = setInterval(() => res.write(': heartbeat\n\n'), 30000);
  req.on('close', () => clearInterval(interval));
});

router.post('/messages', async (req, res) => {
  try {
    await mcpManager.initialize(process.cwd());
    const { method, params, id } = req.body;

    if (method === 'tools/list') {
      const allTools = mcpManager.getTools();
      res.json({ jsonrpc: '2.0', id, result: { tools: allTools } });
      return;
    }

    if (method === 'tools/call') {
      try {
        const result = await mcpManager.callTool(params.name, params.arguments, id);
        res.json(result);
      } catch (err: any) {
        res.status(404).json({ error: err.message });
      }
      return;
    }

    res.status(405).json({ error: `Method ${method} not implemented in multi-bridge` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/save-keys', async (req, res) => {
  try {
    const { geminiApiKey, grokApiKey, openrouterApiKey } = req.body;
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf8');
    } catch (err) {
      // .env doesn't exist yet, ignore
    }

    const lines = envContent.split('\n');
    const keyMap = new Map<string, string>();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      keyMap.set(trimmed.substring(0, index).trim(), trimmed.substring(index + 1).trim());
    }

    if (geminiApiKey) {
      keyMap.set('GEMINI_API_KEY', geminiApiKey);
      keyMap.set('VITE_GEMINI_API_KEY', geminiApiKey);
      process.env.GEMINI_API_KEY = geminiApiKey;
      process.env.VITE_GEMINI_API_KEY = geminiApiKey;
    }
    if (grokApiKey) {
      keyMap.set('GROK_API_KEY', grokApiKey);
      process.env.GROK_API_KEY = grokApiKey;
    }
    if (openrouterApiKey) {
      keyMap.set('OPENROUTER_API_KEY', openrouterApiKey);
      process.env.OPENROUTER_API_KEY = openrouterApiKey;
    }

    let newContent = '';
    for (const [key, value] of keyMap.entries()) {
      newContent += `${key}=${value}\n`;
    }

    await fs.writeFile(envPath, newContent, 'utf8');
    mcpManager.shutdown();

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
