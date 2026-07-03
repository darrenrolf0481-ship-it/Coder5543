import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Patch for restricted environments (Android/Termux, containers)
// where uv_interface_addresses syscall is blocked (error 13)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const os = require('os');
try {
  os.networkInterfaces();
} catch {
  os.networkInterfaces = () => ({});
}

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''),
    'process.env.NEXT_PUBLIC_GEMINI_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
    'process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ''),
    'process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID': JSON.stringify(process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'FGY2WhTYpPnrIDTdsKH5'),
    'global': 'window',
    'process.env': {},
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': 'http://127.0.0.1:8001',
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    crossOriginLoading: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
});
