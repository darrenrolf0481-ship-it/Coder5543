import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /ollama/* → the local Ollama server. The browser only ever talks to
// the same origin that serves ARGUS (works through HTTPS tunnels where
// "localhost" would resolve to the viewer's device, not this machine).
const proxy = {
  '/ollama': {
    target: 'http://localhost:11434',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/ollama/, ''),
  },
  // WebSocket proxy to the Stormologist daemon so its alerts reach the
  // dashboard through the tunnel (same-origin wss → local ws).
  '/storm': {
    target: 'ws://localhost:8765',
    ws: true,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/storm/, ''),
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: true,
    proxy: proxy,
  },
  // `npm run preview` serves the production build (plain bundled .js) —
  // proxy-friendly where the dev server's live .tsx modules get blocked.
  preview: {
    port: 5174,
    host: true,
    allowedHosts: true,
    proxy: proxy,
  },
});
