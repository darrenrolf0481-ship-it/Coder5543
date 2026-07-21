#!/usr/bin/env node
/**
 * Serves standalone/index.html as plain static files — no framework, no
 * module resolution, nothing for the tunnel proxy to trip on. This is what
 * actually serves ARGUS in this environment (not `vite preview`, which
 * serves dist/ and can drift out of sync with the classic-script build).
 *
 * Usage: node serve-standalone.cjs [--port=5174]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv.find((a) => a.startsWith('--port='))?.split('=')[1] ?? '5174', 10);
const DIR = path.join(__dirname, 'standalone');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  const filepath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filepath)] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const size = fs.statSync(path.join(DIR, 'index.html')).size;
  console.log(`[SERVE] ARGUS standalone on :${PORT} (${(size / 1024).toFixed(0)} kB, ${DIR})`);
});
