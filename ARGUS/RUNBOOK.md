# ARGUS Runbook

What's actually built, how to run it, and the gotchas that will waste your
time if you don't know them. Read this before touching anything.

## TL;DR — how to see it running

This environment's HTTPS tunnel **blocks Vite's dev server** (it rejects
`<script type="module">`). Do not use `npm run dev`. Always do this instead:

```bash
npm install                       # first time only, or after a package.json change
npm run build:standalone          # bundles everything into one classic-script HTML file
npm run preview                   # serves it on :5174
```

There is no hot-reload. Every code change needs a re-run of
`build:standalone` + a browser refresh. This is annoying but it's the only
combination that reliably loads in this environment — see "Why the dev
server doesn't work" below before trying to change it.

## Optional background services

ARGUS's UI works standalone. These add live data feeds on top of it:

| Service | Command | What it does | Port |
|---|---|---|---|
| Ollama proxy | (nothing to run — it's a Vite proxy) | `/ollama` → your local Ollama at `:11434` | n/a |
| Stormologist | `npm run stormologist` or `npm run stormologist:sim` | Anomaly-detection daemon; `:sim` fires 3 synthetic alerts for testing | 8765 |
| Mock agent bridges | `npm run agents:mock` | Stand-in Seven/Sage WebSocket servers that echo replies, for testing before real agents exist | 8081 (seven), 8082 (sage) |

All three are reached through same-origin Vite proxies (`/ollama`,
`/storm`, `/seven-bridge`, `/sage-bridge`) so they work over the tunnel —
see "Why proxies exist" below.

## Chat command reference

Type these into the Chat panel:

```
help                          — full command list
attach seven / attach sage    — set routing target + gate profile (HIGH GUARD vs STANDARD)
detach                        — clear routing target

seven connect / disconnect    — dial or drop Seven's live WebSocket bridge
sage connect / disconnect     — same for Sage

provider                      — show current LLM backend/model
provider ollama|openrouter    — switch backend
model <name>                  — set model, e.g. `model llama3` or `model anthropic/claude-3.5-sonnet`
models                        — list installed Ollama models
apikey <key>                  — set OpenRouter API key
endpoint <url>                — override the active backend's URL

remember <text> #tag          — long-term memory (persists across reloads)
recall / recall threats / recall <tag>
forget <id>

swarm status / swarm activate <event> / swarm stand-down

show queue / approve <id> / deny <id>
show threats / mcp status / clear
```

Anything else you type is scanned by the 3-gate threat detector, then
either sent to the live agent bridge (if attached + connected) or the
configured LLM (if not).

## What's real vs. what's a placeholder

**Real, fully working:**
- 3-gate threat scanner (`src/security/threatScanner.ts`) — PII, sanitize,
  context-aware prompt-injection detection with an 8-message window
- LLM chat via Ollama or OpenRouter (`src/llm/llmClient.ts`) — actually
  calls the model, actually gets a reply, actually scans both directions
- Seven/Sage WebSocket bridges (`src/hooks/useAgentBridge.ts`) — actually
  connects, actually sends/receives, actually applies per-agent gate
  thresholds (Seven = HIGH GUARD tighter, Sage = STANDARD looser)
- Stormologist daemon (`stormologist-daemon.cjs`) — 6 hardcoded detection
  rules, append-only incident log, broadcasts real alerts over WebSocket
- Memory (short-term ring buffer + persisted long-term notes), swarm
  simulation (6-node cascade response), all dashboard panels, the
  syntax-highlighted code editor, the gate-activity chart

**Placeholders / need external input to become real:**
- **Seven and Sage themselves** — there is no real Seven or Sage agent
  server anywhere. `mock-agent-server.cjs` is a stand-in that echoes canned
  replies so the bridge plumbing can be tested. When real Seven/Sage
  servers exist, point them at ports 8081/8082 (or edit the proxy targets
  in `vite.config.ts`) — the exact same `seven connect`/`sage connect`
  chat commands will reach them, no code changes needed.
- **Stormologist's telemetry source** — the daemon's detection rules are
  real and its alerts really reach the dashboard, but nothing is currently
  feeding it real bridge telemetry (handshake timings, neuro-state values,
  etc.). Right now it only fires on `--simulate` synthetic data. To make it
  real, whatever process monitors the actual Seven/Sage/Mama bridges needs
  to send `{ type: 'telemetry', meta: {...} }` messages to the daemon's
  WebSocket.

## Why things are built the way they are (read before "fixing" them)

### 1. Single-file classic-script build, not the Vite dev server

The zo preview proxy blocks `<script type="module">` outright — not a MIME
issue, an outright block. `npm run dev` and even `npm run build && npm run
preview` (which still emits a module script) show a stuck "INITIALIZING
ARGUS" screen with zero errors, because the JS never even starts executing.

The fix (`build-standalone.mjs`): bundle the whole app with esbuild as a
classic IIFE, inline it plus the Tailwind CSS into one `index.html` with a
plain `<script>` tag. Zero module scripts, zero external JS requests,
nothing for the proxy to block. This is why `npm run build:standalone` is
the only reliable way to view the app here — don't "simplify" this back to
a normal Vite build without expecting the white-screen bug to return.

### 2. Everything network-facing goes through a same-origin Vite proxy

Ollama, the Stormologist daemon, and the Seven/Sage bridges all run as
plain `ws://localhost:PORT` servers. But ARGUS is viewed over an `https://`
tunnel, and browsers throw a synchronous `SecurityError` (mixed content)
when you construct a `ws://` socket from an `https://` page — this doesn't
show up as a network error, it crashes synchronously during React's
mount/render if unguarded, which looked exactly like the module-blocking
bug above and cost real time to tell apart.

Two-part fix, both required:
- `vite.config.ts` proxies `/ollama`, `/storm`, `/seven-bridge`,
  `/sage-bridge` to their real `localhost` ports.
- Every WebSocket-constructing hook (`useStormologistBridge`,
  `useAgentBridge`) derives its URL from `window.location` (`wss://` on
  https pages, `ws://` on http) and wraps `new WebSocket(...)` in try/catch
  so a failure degrades to "offline + retry," never a crash.

If you add a new WebSocket consumer, follow this pattern or it will break
the same way over the tunnel.

### 3. `localStorage` is wrapped in `safeStorage`

The zo preview iframe can block `localStorage` outright (SecurityError on
access), which — because Zustand's `persist` middleware touches storage at
module-eval time — used to crash the app before React even mounted, with
no console error to explain why. `src/store/safeStorage.ts` probes once
and falls back to an in-memory Map if blocked. Don't swap this back for
raw `localStorage` in the persist config.

### 4. No syntax-highlighting library, no Monaco

`src/components/editor/CodeEditor.tsx` is a hand-rolled ~140-line
highlighter (transparent textarea over a highlighted `<pre>`). This was
deliberate: Monaco needs web workers and dynamic module loading, exactly
the things the module-blocking proxy (see #1) breaks. Don't reach for
Monaco or CodeMirror here without re-solving #1 first.

### 5. Daemon file extension matters

`package.json` has `"type": "module"`, so any script using CommonJS
`require()` must be named `.cjs`, not `.js` — this bit us once already
(`stormologist-daemon.js` → renamed to `.cjs`). `mock-agent-server.cjs`
follows the same rule from the start.

## File map (the non-obvious parts)

```
build-standalone.mjs          the ONLY reliable build — see gotcha #1
stormologist-daemon.cjs       anomaly-detection daemon, npm run stormologist[:sim]
mock-agent-server.cjs         stand-in Seven/Sage, npm run agents:mock
vite.config.ts                all the proxies live here

src/store/
  useArgusStore.ts             main app state, persisted (safeStorage)
  useMemoryStore.ts             short-term ring buffer + persisted long-term notes
  useSwarmStore.ts              6-node swarm simulation, not persisted
  safeStorage.ts                localStorage wrapper — see gotcha #3

src/hooks/
  useLabController.ts           chat command parser + LLM/bridge routing — the "brain"
  useAgentBridge.ts              per-agent WebSocket connection + gate scanning
  useAgentBridges.ts             mounts both bridges once at app root
  bridgeRegistry.ts              lets useLabController reach the mounted bridges' send()
  useStormologistBridge.ts       consumes the daemon's WebSocket alerts

src/llm/llmClient.ts            Ollama + OpenRouter, one interface
src/security/threatScanner.ts   the 3-gate scanner, config per agent
src/components/editor/CodeEditor.tsx   hand-rolled highlighter — see gotcha #4
src/components/security/GateActivityChart.tsx   zero-dep SVG chart
```

## If the app shows a blank/stuck screen again

1. Check you ran `build:standalone`, not `dev` or plain `build`.
2. Open the page — it should show `INITIALIZING ARGUS` → `JS OK` →
   `MOUNTING ARGUS` → the actual app, in that order (see `index.html` /
   `src/main.tsx`). Wherever it stops tells you which layer broke:
   - Stuck on `INITIALIZING` → no JS ran at all → sandbox/proxy issue, not
     a code bug.
   - Stuck on `MOUNTING` or shows a red error box → React mounted but
     crashed → read the on-page error (there's an `ErrorBoundary` and a
     `window.onerror` fallback specifically so this is never silent).
3. Check `localStorage` — clear `argus-state-v1` / `argus-memory-v1` if
   you suspect stale persisted data from an older schema version.
