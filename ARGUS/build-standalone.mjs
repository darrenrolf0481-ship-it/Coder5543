// Builds a single self-contained index.html with ALL JS inlined as a
// classic (non-module) <script>. This sidesteps environments whose proxy
// blocks `<script type="module">` or mis-serves /assets/*.js — there are
// no external module requests at all, everything is in one file.
//
//   npm run build:standalone   → writes standalone/index.html + dist/index.html
//
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const OUT = 'standalone';
mkdirSync(OUT, { recursive: true });

// 1. Get Tailwind-processed CSS by running the normal vite build once.
//    (Also produces dist/ which `npm run preview` will serve.)
console.log('[standalone] building CSS via vite…');
execSync('vite build', { stdio: 'inherit' });
const assets = 'dist/assets';
const cssName = readdirSync(assets).find((f) => f.endsWith('.css'));
const css = cssName ? readFileSync(`${assets}/${cssName}`, 'utf8') : '';

// 2. Bundle the app as a classic IIFE. CSS imports are neutralised — we
//    inline the vite-processed CSS above instead.
console.log('[standalone] bundling JS as classic IIFE via esbuild…');
await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  format: 'iife',
  outfile: `${OUT}/bundle.js`,
  jsx: 'automatic',
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  plugins: [{
    name: 'ignore-css',
    setup(b) {
      b.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
    },
  }],
});
const js = readFileSync(`${OUT}/bundle.js`, 'utf8');

// 3. Assemble the single-file HTML.
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ARGUS — Neural Oversight Lab</title>
    <style>${css}</style>
    <style>
      #argus-boot { position: fixed; inset: 0; display: flex; align-items: center;
        justify-content: center; background: #03070f; color: #38bdf8;
        font: 14px/1.5 monospace; letter-spacing: .3em; text-align: center; padding: 16px; }
    </style>
  </head>
  <body>
    <div id="root"><div id="argus-boot">INITIALIZING ARGUS&hellip;</div></div>
    <script>${js}</script>
  </body>
</html>
`;
// Write to standalone/ (portable single file) AND overwrite dist/index.html
// so `npm run preview` serves the classic-script version directly.
writeFileSync(`${OUT}/index.html`, html);
writeFileSync('dist/index.html', html);
console.log(`[standalone] wrote ${OUT}/index.html and dist/index.html (${(html.length / 1024).toFixed(0)} kB, JS inline, classic script)`);
