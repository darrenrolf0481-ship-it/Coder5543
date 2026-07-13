// Builds a single self-contained index.html with ALL JS inlined as a
// classic (non-module) <script>. Same approach as ARGUS/build-standalone.mjs
// and for the same reason: the zo preview tunnel blocks `<script
// type="module">` outright, so the normal Vite dev server and even the
// normal `vite build` output (which is a module script) never execute —
// the splash screen dies after its 6s timeout and the app is unreachable.
// See ARGUS/RUNBOOK.md "Why the dev server doesn't work" for the history.
//
//   npm run build:standalone   → writes standalone/index.html + dist/index.html
//   npm start                  → Express serves dist/ (now classic-script) on :3002
//                                with the full API + WebSocket bridge, same origin
//
import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = 'standalone';
mkdirSync(OUT, { recursive: true });

// 1. Get Tailwind-processed CSS by running the normal vite build once.
//    (@tailwindcss/vite generates the utilities, so plain esbuild can't.)
console.log('[standalone] building CSS via vite…');
execSync('npx vite build', { stdio: 'inherit', env: { ...process.env, PORT: '3002' } });
const assetsDir = 'dist/assets';
const css = readdirSync(assetsDir)
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(path.join(assetsDir, f), 'utf8'))
  .join('\n');

// 2. Bundle the app as a classic IIFE. CSS imports are neutralised — we
//    inline the vite-processed CSS above instead. Mirrors vite.config.ts:
//    same winston→stub alias, same env-key injection.
console.log('[standalone] bundling JS as classic IIFE via esbuild…');
const envKeys = {
  VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
  VITE_OPENROUTER_API_KEY:
    process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '',
};
await build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outfile: `${OUT}/bundle.js`,
  jsx: 'automatic',
  minify: true,
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env': '{}',
    'import.meta.env': JSON.stringify(envKeys),
  },
  alias: {
    winston: path.resolve(__dirname, 'src/utils/winston-stub.ts'),
    '@': __dirname,
  },
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  plugins: [
    {
      name: 'ignore-css',
      setup(b) {
        b.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
      },
    },
  ],
});
// Sequences the HTML parser treats specially inside an inline <script>
// (`</script`, `<script`, `<!--`) appear in this bundle inside string
// literals (project templates embed sample HTML) and would terminate or
// corrupt the script element. Escape their `<` as \x3C — identical at JS
// runtime, invisible to the HTML parser.
const js = readFileSync(`${OUT}/bundle.js`, 'utf8')
  .replace(/<\/script/gi, '\\x3C/script')
  .replace(/<script/gi, '\\x3Cscript')
  .replace(/<!--/g, '\\x3C!--');

// 3. Assemble the single-file HTML from the real index.html so the splash
//    screen, boot logs, and SW-unregister logic all behave identically.
const srcHtml = readFileSync('index.html', 'utf8');
const moduleTag = '<script type="module" src="/src/index.tsx"></script>';
if (!srcHtml.includes(moduleTag)) {
  throw new Error('[standalone] index.html no longer contains the expected module script tag');
}
// NB: replacement callbacks, not strings — minified JS/CSS contain `$&`-style
// sequences that String.replace would otherwise expand as special patterns.
const html = srcHtml
  .replace('</head>', () => `    <style>${css}</style>\n  </head>`)
  .replace(moduleTag, () => `<script>${js}</script>`);

// Write to standalone/ (portable single file) AND overwrite dist/index.html
// so `npm start` (production Express) serves the classic-script version.
writeFileSync(`${OUT}/index.html`, html);
writeFileSync('dist/index.html', html);
console.log(
  `[standalone] wrote ${OUT}/index.html and dist/index.html (${(html.length / 1024).toFixed(0)} kB, JS inline, classic script)`,
);
