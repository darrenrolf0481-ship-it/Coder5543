import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        rajdhani: ['var(--font-rajdhani)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        'neon-blue': '#00F3FF',
        'neon-violet': '#9D00FF',
        'neon-cyan': '#00F3FF',
        'neon-red': '#FF0055',
        'neon-green': '#00FF99',
        'neon-orange': '#FF8000',
        panel: 'rgba(13, 13, 25, 0.9)',
        void: '#000008',
        'border-subtle': 'rgba(255, 255, 255, 0.05)',
        'text-ghost': 'rgba(255, 255, 255, 0.4)',
        'text-bright': 'rgba(255, 255, 255, 0.9)',
      },
    },
  },
  plugins: [],
};

export default config;
