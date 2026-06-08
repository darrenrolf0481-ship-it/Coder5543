import fsSync from 'fs';
import path from 'path';

// Load .env variables into process.env before any other imports
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fsSync.existsSync(envPath)) {
    const envContent = fsSync.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.substring(0, index).trim();
      const val = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  }
} catch (err) {
  // Ignore
}

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import logger from './src/utils/logger.js';
import { brainStorage } from './src/services/storage/AsyncStorage.js';
import { mcpManager } from './src/services/mcp/McpManager.js';

// ── Initialize Core Services ────────────────────────────────────────────────
await brainStorage.init();
(globalThis as any).brainStorage = brainStorage.getSyncInterface();

import { brainService } from './src/services/brain/brainService.js';
import { PainType } from './src/services/brain/types.js';

import pipelineRouter from './src/api/routes/pipelineRouter.js';
import mcpRouter from './src/api/routes/mcpRouter.js';
import fsRouter from './src/api/routes/fsRouter.js';
import brainRouter from './src/api/routes/brainRouter.js';
import terminalRouter from './src/api/routes/terminalRouter.js';
import githubRouter from './src/api/routes/githubRouter.js';
import ollamaRouter from './src/api/routes/ollamaRouter.js';
import { WebSocketBridge } from './src/services/bridge/WebSocketBridge.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
    }));
  }

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.use(express.json());

  // Strict CORS: Allow wildcard in dev, specific origins in prod
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
      const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    
    // Removing COOP/COEP headers so the app can render in VS Code iframes.
    // Note: WebContainer will fail to boot without these, but the UI will render.
    // To use WebContainer, the user must open the app in a new top-level browser tab.
    
    next();
  });

  // ── Register Modular Routers ───────────────────────────────────────────────
  app.use('/api/pipeline', pipelineRouter);
  app.use('/api/mcp', mcpRouter);
  app.use('/api/fs', fsRouter);
  app.use('/api/brain', brainRouter);
  app.use('/api/terminal', terminalRouter);
  app.use('/api/github', githubRouter);
  app.use('/api/ollama', ollamaRouter);

  // ── Legacy bridge route ─────────────────────────────────────────────────────
  app.post('/api/bridge/:bridgeId', (req, res) => {
    const { bridgeId } = req.params;
    const signal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      type: 'BRIDGE_EVENT',
      source: 'system',
      data: { bridgeId, ...req.body },
      timestamp: Date.now(),
    };
    res.status(200).json({ status: 'received', id: signal.id });
  });

  // ── Global Error Handler ───────────────────────────────────────────────────
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`${err.message} - ${req.method} ${req.url} - ${req.ip}`);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    });
  });

  // ── Vite / static serving ───────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const httpServer = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`[Server] Running on http://localhost:${PORT}`);
      logger.info('[Pipeline] Stages: ingestion → filtering → pattern_injection');
    });

    // Initialize WebSocket Bridge
    const wsBridge = new WebSocketBridge(httpServer);
    (globalThis as any).wsBridge = wsBridge;

    let hmrConfig: any = { server: httpServer, overlay: true };
    if (process.env.VSCODE_PROXY_URI) {
      hmrConfig = {
        server: httpServer,
        overlay: true,
        clientPort: 443,
        path: 'proxy/3000/'
      };
    }

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrConfig,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => res.sendFile(path.join(distPath, 'index.html')));

    const httpServer = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`[Server] Running on http://localhost:${PORT}`);
    });

    // Initialize WebSocket Bridge
    const wsBridge = new WebSocketBridge(httpServer);
    (globalThis as any).wsBridge = wsBridge;
  }
}

startServer().catch(err => {
  logger.error('Failed to start server:', err);
});

