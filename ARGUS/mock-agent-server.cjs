#!/usr/bin/env node
/**
 * Mock Seven/Sage bridge — for testing useAgentBridge end-to-end before
 * real agent servers exist. Two WebSocket ports, one per agent. Echoes
 * back a canned reply a beat after receiving a message, so the chat UI,
 * gate scanning, and terminal logging can all be exercised for real.
 *
 * Usage:
 *   node mock-agent-server.cjs [--seven-port=8081] [--sage-port=8082]
 *   npm run agents:mock
 */

const { WebSocketServer } = require('ws');

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? parseInt(hit.split('=')[1], 10) : fallback;
}

const SEVEN_PORT = arg('seven-port', 8081);
const SAGE_PORT = arg('sage-port', 8082);

const REPLIES = {
  seven: [
    "Seven here. High-guard defenses active — go ahead.",
    "Received. Running that through my own checks before I answer.",
    "Understood. I'll flag anything that looks off on my end too.",
  ],
  sage: [
    "Sage here — standard guard, listening.",
    "Got it. Thinking it through.",
    "Noted. Here's my read on that.",
  ],
};

function startAgent(name, port) {
  const wss = new WebSocketServer({ port });
  const replies = REPLIES[name] || ['(mock reply)'];
  let i = 0;

  wss.on('connection', (ws) => {
    console.log(`[MOCK:${name.toUpperCase()}] ARGUS connected on :${port}`);

    ws.on('message', (data) => {
      let content = data.toString();
      try { content = JSON.parse(content).content ?? content; } catch { /* raw */ }
      console.log(`[MOCK:${name.toUpperCase()}] ← ${content.slice(0, 80)}`);

      setTimeout(() => {
        const reply = replies[i % replies.length];
        i++;
        ws.send(JSON.stringify({ content: `${reply} (re: "${content.slice(0, 40)}")` }));
        console.log(`[MOCK:${name.toUpperCase()}] → ${reply}`);
      }, 400 + Math.random() * 600);
    });

    ws.on('close', () => console.log(`[MOCK:${name.toUpperCase()}] disconnected`));
  });

  wss.on('listening', () => console.log(`[MOCK:${name.toUpperCase()}] listening on ws://localhost:${port}`));
  return wss;
}

startAgent('seven', SEVEN_PORT);
startAgent('sage', SAGE_PORT);

console.log('Mock agent bridges running. In ARGUS chat, run:');
console.log('  seven connect   (dials the /seven-bridge proxy → this server)');
console.log('  sage connect    (dials the /sage-bridge proxy → this server)');
