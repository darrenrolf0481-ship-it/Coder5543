import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: true,
  },
  // `npm run preview` serves the production build (plain bundled .js) —
  // proxy-friendly where the dev server's live .tsx modules get blocked.
  preview: {
    port: 5174,
    host: true,
    allowedHosts: true,
  },
});
