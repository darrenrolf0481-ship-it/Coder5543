import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Handle VS Code / Zo workspace proxy routing for dev mode
  let base = './';
  const port = process.env.PORT || '3002';
  if (process.env.VSCODE_PROXY_URI) {
    const proxyUrl = process.env.VSCODE_PROXY_URI.replace('{{port}}', port);
    try {
      base = new URL(proxyUrl).pathname;
      if (!base.endsWith('/')) base += '/';
    } catch {
      base = `/proxy/${port}/`;
    }
  }

  return {
    base,
    server: {
      port: parseInt(port),
      host: '0.0.0.0',
      allowedHosts: true,
    },
    plugins: [react(), tailwindcss()],
    build: {
      crossOriginLoading: 'anonymous',
      modulePreload: { polyfill: false },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-monaco': ['@monaco-editor/react'],
            'vendor-ui': ['lucide-react', 'dompurify', 'react-markdown', 'remark-gfm'],
          },
        },
      },
    },
    define: {
      'process.env': {},
      'import.meta.env.API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY ||
          env.GEMINI_API_KEY ||
          process.env.VITE_GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY,
      ),
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY ||
          env.GEMINI_API_KEY ||
          process.env.VITE_GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY,
      ),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY ||
          env.GEMINI_API_KEY ||
          process.env.VITE_GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY,
      ),
      'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(
        env.VITE_OPENROUTER_API_KEY ||
          env.OPENROUTER_API_KEY ||
          process.env.VITE_OPENROUTER_API_KEY ||
          process.env.OPENROUTER_API_KEY,
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        winston: path.resolve(__dirname, 'src/utils/winston-stub.ts'),
      },
    },
  };
});
