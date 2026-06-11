// Must be the first import: loads .env into process.env before any module below
// reads it at load time (ESM evaluates imports depth-first, in source order).
import './src/utils/loadEnv.js';

import path from 'path';

import express, { Request, Response, NextFunction, Express, Router } from 'express';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import logger from './src/utils/logger.js';
import { brainStorage } from './src/services/storage/AsyncStorage.js';
import { mcpManager } from './src/services/mcp/McpManager.js';
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
import { conversationIngestor } from './src/services/brain/ConversationIngestor.js';

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

// Origins permitted by CORS in production (dev uses a wildcard).
const ALLOWED_ORIGINS = [3000, 3001, 3002, 3003].flatMap((port) => [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
]);

function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (!isProduction()) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

  // Required for WebContainers (Local Core) to boot.
  // NOTE: This might block the app from rendering inside a VS Code simple browser iframe.
  // If you get a blank screen in VS Code, open the preview URL in a normal Chrome/Edge tab.
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  next();
}

// API surface: each entry mounts `router` at `/api/<name>`.
const API_ROUTERS: ReadonlyArray<readonly [string, Router]> = [
  ['pipeline', pipelineRouter],
  ['mcp', mcpRouter],
  ['fs', fsRouter],
  ['brain', brainRouter],
  ['terminal', terminalRouter],
  ['github', githubRouter],
  ['ollama', ollamaRouter],
];

function registerRouters(app: Express, prefix = ''): void {
  for (const [name, router] of API_ROUTERS) {
    app.use(`${prefix}/api/${name}`, router);
  }
}

// Legacy fire-and-forget bridge endpoint, kept for backward compatibility.
function registerLegacyBridge(app: Express, prefix = ''): void {
  app.post(`${prefix}/api/bridge/:bridgeId`, (req, res) => {
    const { bridgeId } = req.params;
    const signal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'BRIDGE_EVENT',
      source: 'system',
      data: { bridgeId, ...req.body },
      timestamp: Date.now(),
    };
    res.status(200).json({ status: 'received', id: signal.id });
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
  const proxyPrefix = process.env.VSCODE_PROXY_URI ? `/proxy/${PORT}` : null;

  // Start Contextual Memory Daemon
  conversationIngestor.startDaemon(60); // Run every 60 minutes

  if (isProduction()) {
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
    }));
  }

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: true,
  }));

  app.use(express.json());
  app.use(corsMiddleware);

  // ── Register Modular Routers (mirrored behind the VS Code proxy when present) ─
  registerRouters(app);
  registerLegacyBridge(app);
  if (proxyPrefix) {
    registerRouters(app, proxyPrefix);
    registerLegacyBridge(app, proxyPrefix);
  }

  // ── Static SPA in production (Vite middleware is attached after listen, below) ─
  if (isProduction()) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[Server] Running on http://localhost:${PORT}`);
    if (!isProduction()) {
      logger.info('[Pipeline] Stages: ingestion → filtering → pattern_injection');
    }
  });

  // Initialize WebSocket Bridge
  const wsBridge = new WebSocketBridge(httpServer);
  (globalThis as any).wsBridge = wsBridge;

  // ── Vite dev middleware (HMR needs the live httpServer) ─────────────────────
  if (!isProduction()) {
    const hmrConfig: any = process.env.VSCODE_PROXY_URI
      ? { server: httpServer, overlay: true, clientPort: 443, path: 'hmr' }
      : { server: httpServer, overlay: true };

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrConfig,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // ── Global Error Handler (must be registered last) ──────────────────────────
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`${err.message} - ${req.method} ${req.url} - ${req.ip}`);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    });
  });
}

// ── Bootstrap ───────────────────────────────────────────────────────────────
// Initialize core services before the server accepts traffic.
await brainStorage.init();
(globalThis as any).brainStorage = brainStorage.getSyncInterface();

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
});

