import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      base: './',
      server: {
        port: 3003,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [react(), tailwindcss()],
      build: {
        crossOriginLoading: false,
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
        'import.meta.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
        'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'winston': path.resolve(__dirname, 'src/utils/winston-stub.ts'),
        }
      }
    };
});

