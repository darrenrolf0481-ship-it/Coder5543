import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        node: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      boxShadow: {
        'node':  '0 0 12px rgba(14,165,233,0.4)',
        'node-lg': '0 0 30px rgba(14,165,233,0.25)',
        'threat': '0 0 12px rgba(239,68,68,0.4)',
      },
      backgroundImage: {
        'grid': 'linear-gradient(rgba(14,165,233,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-node': 'pulse-node 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-node': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 8px rgba(14,165,233,0.4)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px rgba(14,165,233,0.7)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
