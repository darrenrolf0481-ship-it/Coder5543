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
      server: {
        port: 3001,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-monaco': ['@monaco-editor/react'],
              'vendor-ai': ['@google/genai'],
              'vendor-ui': ['lucide-react', 'dompurify', 'react-markdown', 'remark-gfm'],
            },
          },
        },
      },
      define: {
        'import.meta.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
