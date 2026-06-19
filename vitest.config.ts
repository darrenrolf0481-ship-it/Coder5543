import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.projscan-cache/**', '**/Zachs/**', '**/projects/**','**/Coder5543/**', '**/ADHD-Sage/**','**/Sage7/**'],
  },
});
