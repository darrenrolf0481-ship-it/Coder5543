import express from 'express';
import { createServer as createViteServer } from 'vite';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import os from 'os';

// ── Inject Node-specific storage for the brain service ────────────────────────
const BRAIN_DATA_DIR = path.join(os.homedir(), 'brain-data');
if (!await fs.access(BRAIN_DATA_DIR).then(() => true).catch(() => false)) {
  await fs.mkdir(BRAIN_DATA_DIR, { recursive: true });
}

(globalThis as any).brainStorage = {
  getItem: (key: string) => {
    try {
      const p = path.join(BRAIN_DATA_DIR, `${key.replace(/[^a-z0-9_-]/gi, '_')}.json`);
      // We use a sync read here because the brain service expects a sync storage API (localStorage-like)
      const data = require('fs').readFileSync(p, 'utf-8');
      return data;
    } catch { return null; }
  },
  setItem: (key: string, value: string) => {
    try {
      const p = path.join(BRAIN_DATA_DIR, `${key.replace(/[^a-z0-9_-]/gi, '_')}.json`);
      require('fs').writeFileSync(p, value, 'utf-8');
    } catch (e) { console.error('[ServerStorage] Error saving brain data:', e); }
  }
};

import { brainService } from './src/services/brain/brainService.js';
import { PainType } from './src/services/brain/types.js';

// ── MCP Server Management ───────────────────────────────────────────────────
import { ChildProcess } from 'child_process';

interface McpServerInstance {
  name: string;
  type: 'library' | 'process' | 'remote';
  handle: any; // McpServerHandle for libraries, ChildProcess for processes
  tools: any[];
}

let mcpInstances: McpServerInstance[] = [];

async function initMcpServers() {
  if (mcpInstances.length > 0) return;

  // 1. Load Projscan (Library)
  try {
    const { createMcpServer } = await import('./projscan/src/mcp/server.js');
    const { getToolDefinitions } = await import('./projscan/src/mcp/tools.js');
    const handle = createMcpServer(process.cwd());
    mcpInstances.push({
      name: 'projscan',
      type: 'library',
      handle,
      tools: getToolDefinitions()
    });
    console.log('[MCP] Projscan integrated');
  } catch (err) { console.warn('[MCP] Projscan load failed:', err); }

  // 2. Load 21st-Magic (Process)
  const magicPath = path.join(os.homedir(), 'ADHD-Sage/magic-mcp/dist/index.js');
  if (await fs.access(magicPath).then(() => true).catch(() => false)) {
    const child = spawn('node', [magicPath], { stdio: ['pipe', 'pipe', 'inherit'] });
    // Fetch tools from child via stdio JSON-RPC
    const fetchTools = () => new Promise<any[]>((resolve) => {
      let output = '';
      const onData = (data: Buffer) => {
        output += data.toString();
        try {
          // Check for valid JSON response to tools/list
          if (output.includes('"result":')) {
            const res = JSON.parse(output.split('\n').find(l => l.includes('"result":')) || '{}');
            if (res.result?.tools) {
              child.stdout.off('data', onData);
              resolve(res.result.tools);
            }
          }
        } catch {}
      };
      child.stdout.on('data', onData);
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 'init_list', method: 'tools/list' }) + '\n');
    });

    try {
      const tools = await Promise.race([fetchTools(), new Promise<any[]>((_, reject) => setTimeout(() => reject('timeout'), 5000))]);
      mcpInstances.push({ name: '21st-magic', type: 'process', handle: child, tools });
      console.log('[MCP] 21st-Magic integrated');
    } catch { console.warn('[MCP] 21st-Magic integration timed out'); }
  }

  // 3. Load Ollama-MCP (Process)
  const ollamaMcpPath = path.join(os.homedir(), 'ADHD-Sage/ollama-mcp/dist/index.js');
  if (await fs.access(ollamaMcpPath).then(() => true).catch(() => false)) {
    const child = spawn('node', [ollamaMcpPath], { stdio: ['pipe', 'pipe', 'inherit'] });
    const fetchTools = () => new Promise<any[]>((resolve) => {
      let output = '';
      const onData = (data: Buffer) => {
        output += data.toString();
        try {
          if (output.includes('"result":')) {
            const res = JSON.parse(output.split('\n').find(l => l.includes('"result":')) || '{}');
            if (res.result?.tools) {
              child.stdout.off('data', onData);
              resolve(res.result.tools);
            }
          }
        } catch {}
      };
      child.stdout.on('data', onData);
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 'init_list', method: 'tools/list' }) + '\n');
    });

    try {
      const tools = await Promise.race([fetchTools(), new Promise<any[]>((_, reject) => setTimeout(() => reject('timeout'), 5000))]);
      mcpInstances.push({ name: 'ollama-mcp', type: 'process', handle: child, tools });
      console.log('[MCP] Ollama-MCP integrated');
    } catch { console.warn('[MCP] Ollama-MCP integration timed out'); }
  }

  // 4. GitHub (Remote Proxy / Mock)
  // We'll expose the tools but handle them via our existing GitHub proxy logic
  // to avoid needing a full remote MCP client for now.
  mcpInstances.push({
    name: 'github',
    type: 'remote',
    handle: null,
    tools: [
      { name: 'github_list_issues', description: 'List issues in the repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } } } },
      { name: 'github_get_issue', description: 'Get details of a specific issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' } } } },
      // ... more tools could be added here
    ]
  });
}

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Server-side signal broker (mirrors client MessageBroker for SSE push) ─────
const serverBus = new EventEmitter();
serverBus.setMaxListeners(50);

interface ServerSignal {
  id: string;
  type: string;
  source: string;
  data: unknown;
  timestamp: number;
}

const serverDLQ: ServerSignal[] = [];
const DLQ_MAX = 100;

let _seq = 0;
function newId(): string {
  return `srv-${Date.now().toString(36)}-${(++_seq).toString(36)}`;
}

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });

  // ── Pipeline status ─────────────────────────────────────────────────────────
  app.get('/api/pipeline/status', (_req, res) => {
    res.json({
      status: 'operational',
      stages: ['ingestion', 'filtering', 'pattern_injection'],
      dlqDepth: serverDLQ.length,
      timestamp: Date.now(),
    });
  });

  // ── Dead-letter queue ───────────────────────────────────────────────────────
  app.get('/api/pipeline/dlq', (_req, res) => {
    res.json({ count: serverDLQ.length, items: serverDLQ });
  });

  app.post('/api/pipeline/dlq/retry', (req, res) => {
    const { id } = req.body as { id?: string };
    if (!id) {
      res.status(400).json({ error: 'id required' });
      return;
    }
    const idx = serverDLQ.findIndex(s => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Signal not found in DLQ' });
      return;
    }
    const [signal] = serverDLQ.splice(idx, 1);
    serverBus.emit('signal', { ...signal, retried: true });
    res.json({ replayed: signal.id });
  });

  app.delete('/api/pipeline/dlq', (_req, res) => {
    const count = serverDLQ.length;
    serverDLQ.length = 0;
    res.json({ cleared: count });
  });

  // ── External signal injection (webhook → pipeline) ──────────────────────────
  app.post('/api/pipeline/inject', (req, res) => {
    const { type, source, data } = req.body as Partial<ServerSignal>;
    if (!type || !source || data === undefined) {
      res.status(400).json({ error: 'type, source, and data are required' });
      return;
    }
    const signal: ServerSignal = { id: newId(), type, source, data, timestamp: Date.now() };

    // Basic filtering: drop if payload > 64 KB
    try {
      if (JSON.stringify(data).length > 64_000) {
        if (serverDLQ.length < DLQ_MAX) serverDLQ.push(signal);
        res.status(413).json({ error: 'Payload too large — moved to DLQ', id: signal.id });
        return;
      }
    } catch {
      res.status(400).json({ error: 'Unserializable payload' });
      return;
    }

    serverBus.emit('signal', signal);
    res.status(202).json({ accepted: true, id: signal.id });
  });

  // ── Server-Sent Events stream (server → client real-time push) ──────────────
  app.get('/api/pipeline/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onSignal = (signal: ServerSignal) => {
      res.write(`data: ${JSON.stringify(signal)}\n\n`);
    };

    serverBus.on('signal', onSignal);

    // Heartbeat every 25 s to keep connection alive through proxies
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      serverBus.off('signal', onSignal);
    });
  });

  // ── MCP Bridge (SSE → JSON-RPC) ─────────────────────────────────────────────
  app.get('/api/mcp/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // MCP SSE transport protocol requires an initial 'endpoint' event
    // with the URL where POST messages should be sent.
    res.write(`event: endpoint\ndata: ${encodeURIComponent('/api/mcp/messages')}\n\n`);

    // Keep-alive heartbeat
    const interval = setInterval(() => res.write(': heartbeat\n\n'), 30000);
    req.on('close', () => clearInterval(interval));
  });

  app.post('/api/mcp/messages', async (req, res) => {
    try {
      await initMcpServers();
      const { method, params, id } = req.body;

      if (method === 'tools/list') {
        const allTools = mcpInstances.flatMap(inst => inst.tools);
        res.json({ jsonrpc: '2.0', id, result: { tools: allTools } });
        return;
      }

      if (method === 'tools/call') {
        const toolName = params.name;
        const instance = mcpInstances.find(inst => inst.tools.some(t => t.name === toolName));
        if (!instance) {
          res.status(404).json({ error: `Tool ${toolName} not found` });
          return;
        }

        if (instance.type === 'library') {
          const response = await instance.handle.handleMessage(JSON.stringify(req.body));
          res.json(JSON.parse(response));
        } else if (instance.type === 'process') {
          const child = instance.handle as ChildProcess;
          const callId = `call_${Date.now()}`;
          const onData = (data: Buffer) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
              if (line.includes(`"id":"${callId}"`) || line.includes(`"id":${id}`)) {
                child.stdout.off('data', onData);
                try { res.json(JSON.parse(line)); } catch {}
                return;
              }
            }
          };
          child.stdout.on('data', onData);
          child.stdin?.write(JSON.stringify({ ...req.body, id: callId }) + '\n');
        } else if (instance.type === 'remote' && instance.name === 'github') {
          // Map MCP call to our internal GitHub proxy
          const token = process.env.GITHUB_TOKEN;
          if (!token) { res.status(500).json({ error: 'GITHUB_TOKEN not configured' }); return; }
          // Simplified mock implementation for example
          res.json({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `GitHub tool ${toolName} called with params ${JSON.stringify(params)}. Result: Mocked success.` }] } });
        }
        return;
      }

      res.status(405).json({ error: `Method ${method} not implemented in multi-bridge` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Legacy bridge route ─────────────────────────────────────────────────────
  app.post('/api/bridge/:bridgeId', (req, res) => {
    const { bridgeId } = req.params;
    const signal: ServerSignal = {
      id: newId(),
      type: 'BRIDGE_EVENT',
      source: 'system',
      data: { bridgeId, ...req.body },
      timestamp: Date.now(),
    };
    serverBus.emit('signal', signal);
    res.status(200).json({ status: 'received', id: signal.id });
  });

  // ── GitHub proxy — token stays server-side, never sent to the browser ───────
  app.post('/api/github/push', async (_req, res) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) { res.status(500).json({ error: 'GITHUB_TOKEN not configured' }); return; }
    try {
      const ghRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'neural-repo' }),
      });
      res.status(ghRes.ok ? 200 : ghRes.status).json({ ok: ghRes.ok });
    } catch {
      res.status(500).json({ error: 'GitHub request failed' });
    }
  });

  app.get('/api/github/pull', async (_req, res) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) { res.status(500).json({ error: 'GITHUB_TOKEN not configured' }); return; }
    try {
      const ghRes = await fetch('https://api.github.com/user/repos', {
        headers: { Authorization: `token ${token}` },
      });
      const data = ghRes.ok ? await ghRes.json() : [];
      res.status(ghRes.ok ? 200 : ghRes.status).json({ ok: ghRes.ok, data });
    } catch {
      res.status(500).json({ error: 'GitHub request failed' });
    }
  });

  // ── Ollama proxy — avoids CORS when browser calls Ollama directly ──────────
  const OLLAMA_BASE = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

  app.get('/api/ollama/tags', async (_req, res) => {
    try {
      const r = await fetch(`${OLLAMA_BASE}/api/tags`);
      const data = await r.json();
      res.json(data);
    } catch (err: any) {
      res.status(502).json({ error: `Ollama unreachable: ${err.message}` });
    }
  });

  app.post('/api/ollama/chat', async (req, res) => {
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

  app.post('/api/ollama/generate', async (req, res) => {
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

  // ── Termux filesystem API ───────────────────────────────────────────────────
  const TERMUX_HOME = process.env.HOME ?? '/data/data/com.termux/files/home';
  const FS_ROOTS = [TERMUX_HOME, process.cwd()];

  function isSafePath(p: string): boolean {
    const norm = path.resolve(p);
    return FS_ROOTS.some(root => norm.startsWith(path.resolve(root)));
  }

  app.get('/api/fs/browse', async (req, res) => {
    const dirPath = (req.query.path as string) || TERMUX_HOME;
    if (!isSafePath(dirPath)) { res.status(403).json({ error: 'Path not allowed' }); return; }
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      res.json({
        path: dirPath,
        parent: path.dirname(dirPath),
        entries: entries
          .filter(e => !e.name.startsWith('.'))
          .map(e => ({
            name: e.name,
            type: e.isDirectory() ? 'dir' : 'file',
            path: path.join(dirPath, e.name),
          }))
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.name.localeCompare(b.name);
          }),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/fs/read', async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) { res.status(400).json({ error: 'path required' }); return; }
    if (!isSafePath(filePath)) { res.status(403).json({ error: 'Path not allowed' }); return; }
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      res.json({ content });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Brain API ───────────────────────────────────────────────────────────────
  app.post('/api/brain/context', async (req, res) => {
    const { input } = req.body as { input?: string };
    if (!input) { res.status(400).json({ error: 'input required' }); return; }
    const [context, mode] = await Promise.all([
      brainService.prepareContext(input),
      brainService.resolveOperationMode(input),
    ]);
    res.json({ context, mode });
  });

  app.get('/api/brain/endocrine', (_req, res) => {
    res.json(brainService.getEndocrineState());
  });

  app.post('/api/brain/feedback', async (req, res) => {
    const { context, success, errorIntensity } = req.body as {
      context?: string; success?: boolean; errorIntensity?: number;
    };
    if (context === undefined || success === undefined) {
      res.status(400).json({ error: 'context and success required' }); return;
    }
    await brainService.processFeedback(context, success, errorIntensity ?? 0.5);
    res.json({ ok: true, endocrine: brainService.getEndocrineState() });
  });

  app.post('/api/brain/pain', async (req, res) => {
    const { type, intensity, context } = req.body as {
      type?: string; intensity?: number; context?: string;
    };
    if (!type || !context || intensity === undefined) {
      res.status(400).json({ error: 'type, intensity, and context required' }); return;
    }
    if (!Object.values(PainType).includes(type as PainType)) {
      res.status(400).json({ error: `type must be one of: ${Object.values(PainType).join(', ')}` }); return;
    }
    await brainService.getPainPathway().processPainSignal(type as PainType, intensity, context);
    res.json({ ok: true, endocrine: brainService.getEndocrineState() });
  });

  app.post('/api/brain/sleep', async (_req, res) => {
    const result = await brainService.sleepCycle();
    res.json(result);
  });

  // ── Python Brain Bridge ─────────────────────────────────────────────────────
  // Stateless cognitive tool. Agents call it with raw perception/intent.
  // The Python layer NEVER sees agent identity, system prompts, or personalities.
  app.post('/api/python-brain/process', (req, res) => {
    const { perception, intent, is_danger, agent_id } = req.body as {
      perception?: string;
      intent?: string;
      is_danger?: boolean;
      agent_id?: string;
    };
    if (!perception || !intent) {
      res.status(400).json({ error: 'perception and intent required' });
      return;
    }

    const payload = JSON.stringify({
      perception,
      intent,
      is_danger: !!is_danger,
      agent_id: agent_id || 'anonymous',
    });

    const python = spawn('python3', ['python-backend/brain_cli.py'], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONPATH: process.cwd() },
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    python.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    python.on('close', (code) => {
      if (code !== 0) {
        res.status(500).json({ error: 'Python brain failed', detail: stderr });
        return;
      }
      try {
        res.json(JSON.parse(stdout));
      } catch {
        res.status(500).json({ error: 'Invalid JSON from Python brain', raw: stdout });
      }
    });

    python.stdin.write(payload);
    python.stdin.end();
  });

  // ── Terminal exec ───────────────────────────────────────────────────────────
  const TERMUX_HOME_DIR = '/data/data/com.termux/files/home';

  app.get('/api/terminal/cwd', (_req, res) => {
    res.json({ cwd: TERMUX_HOME_DIR });
  });

  // Strip ANSI/VT100 escape sequences from shell output
  const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');

  app.post('/api/terminal/exec', async (req, res) => {
    const { cmd, cwd } = req.body as { cmd?: string; cwd?: string };
    if (!cmd) { res.status(400).json({ error: 'cmd required' }); return; }

    const workingDir = cwd || TERMUX_HOME_DIR;

    // cd is special — resolve the new path and return it
    if (/^cd(\s|$)/.test(cmd.trim())) {
      const cdArg = cmd.trim().replace(/^cd\s*/, '').trim() || TERMUX_HOME_DIR;
      // Quote the arg to handle spaces; tilde is expanded by the shell before quoting
      const quotedArg = cdArg === '~' || cdArg.startsWith('~/') ? cdArg : `"${cdArg.replace(/"/g, '\\"')}"`;
      try {
        const { stdout } = await execAsync(`cd ${quotedArg} && pwd`, { cwd: workingDir, shell: '/bin/sh', timeout: 5000 });
        const newCwd = stdout.trim();
        res.json({ stdout: '', stderr: '', exitCode: 0, newCwd });
      } catch (err: any) {
        res.json({ stdout: '', stderr: err.message ?? String(err), exitCode: 1, newCwd: workingDir });
      }
      return;
    }

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: workingDir,
        shell: '/bin/sh',
        timeout: 30000,
        maxBuffer: 1024 * 512,
        env: { ...process.env, TERM: 'dumb', NO_COLOR: '1' },
      });
      res.json({ stdout: stripAnsi(stdout), stderr: stripAnsi(stderr), exitCode: 0, newCwd: workingDir });
    } catch (err: any) {
      res.json({
        stdout: stripAnsi(err.stdout ?? ''),
        stderr: stripAnsi(err.stderr ?? err.message ?? String(err)),
        exitCode: err.code ?? 1,
        newCwd: workingDir,
      });
    }
  });

  // ── Vite / static serving ───────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const httpServer = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      console.log('[Pipeline] Stages: ingestion → filtering → pattern_injection');
    });

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer, overlay: false },  // attach HMR WS to the same http server; overlay disabled for proxy access
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => res.sendFile(path.join(distPath, 'index.html')));

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  }
}

startServer();
