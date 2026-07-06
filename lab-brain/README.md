# Lab Brain — Full-Power Antigravity Oversight Agent

The **top tier** of the three-layer oversight stack. Where the ARGUS watcher
runs deny-by-default and creds-gated, the Lab Brain is the operator's cockpit:
Antigravity at maximum horsepower.

```
  SAGEs (Seven :8001, MAMA :3000)      ← the watched
        ▲
  ARGUS watcher (:8770)                ← watches the SAGEs   [Antigravity, gated]
        ▲
  LAB BRAIN (this daemon, :8785)       ← watches ARGUS       [Antigravity, FULL POWER]
        ▲
  Coder5543 frontend  (src/hooks/useLabBrainBridge.ts, mounted in App.tsx)
```

## Run

```bash
pip install -r requirements.txt
python lab_brain.py                 # auto-selects the best available engine
```

### Engines (auto-selected; override with `LAB_ENGINE=agy|sdk`)

**1. `agy` — Antigravity CLI Pro OAuth (preferred, no API key).**
If the `agy` CLI is installed and logged in (`~/.gemini/antigravity-cli/antigravity-oauth-token`
present), the Brain drives it directly. This uses your **Google AI Pro** account
and unlocks **Gemini 3.x Pro** and **Claude Opus/Sonnet 4.6** via the Pro quota —
no key, no billing project. To log in once (headless): run `agy` in the terminal
and complete the browser OAuth handoff.

```bash
export LAB_AGY_MODEL="Gemini 3.1 Pro (High)"   # any `agy models` name
export LAB_AGY_AUTONOMOUS=true                 # let agy use tools on the repo (default: reason-only)
python lab_brain.py
```

**2. `sdk` — Python SDK (fallback, needs a key).**
```bash
export GEMINI_API_KEY="..."         # AI Studio key (free tier = Flash only, rate-limited)
#   — or Vertex / ADC —
export GOOGLE_GENAI_USE_VERTEXAI=true GOOGLE_CLOUD_PROJECT=... GOOGLE_CLOUD_LOCATION=us-central1
gcloud auth application-default login
python lab_brain.py
```

The Coder5543 frontend auto-connects on `ws://localhost:8785` via
`useLabBrainBridge(setChatMessages)` — the Brain's status, tool calls, and
replies stream straight into the lab chat. `labBrain.sendTask(prompt)` (returned
by the hook) tasks it from the UI.

## Full-power surface (every Antigravity primitive wired)

| Primitive | How it's used |
|-----------|---------------|
| **Subagents** | `CapabilitiesConfig(enable_subagents=True)` — delegate heavy/noisy work, keep context clean |
| **Builtin tools** | All 12 (files, shell, `SEARCH_WEB`, `GENERATE_IMAGE`, `START_SUBAGENT`, …) via `allow_all` |
| **MCP servers** | Auto-wired from the lab stack when present: `serena` (uv), `21st-magic`, `ollama-mcp` |
| **Skills** | `skills_paths` auto-discovered (SDK skill + `~/Skills`); override `LAB_SKILLS_PATHS` |
| **Triggers** | ARGUS relay — high/critical escalations from `:8770` auto-trigger the Brain to reason |
| **Custom tools** | `query_argus()`, `command_argus(action)`, `sage_status()` — cross-tier reach |
| **Policies** | Open cockpit (`allow_all`) + guardrails: block destructive shell, `ask_user` on SAGE kernel/seal/vault edits |
| **Hooks** | `on_session_*`, `pre/post_tool_call`, `on_tool_error` → live reasoning streamed to chat |
| **Workspaces** | `REPO_ROOT` (the Coder5543 checkout) — the Brain can read/reason about the whole lab |
| **Auth** | `GEMINI_API_KEY` or Vertex ADC (`vertex/project/location`) |

## Two tiers (creds-agnostic)

| Tier | Needs creds? | What it does |
|------|-------------|--------------|
| **Relay + WS** | No | Watches ARGUS on `:8770`, mirrors escalations into the lab chat, serves the frontend. |
| **Reasoning** | `GEMINI_API_KEY` / Vertex ADC | Full Antigravity agent: investigates escalations, does real repo engineering, uses MCP/subagents/skills. |

Without creds the relay still runs and operator prompts get a clear "authenticate
to engage" reply (the UI never hangs). Add auth + restart → full power, no code change.

## WebSocket envelope

```jsonc
{ "type": "lab_status", "content": "...", "timestamp": 1234 }              // status line → chat (system)
{ "type": "lab_tool",   "name": "run_command", "phase": "start|done|error", "detail": "...", "timestamp": 1234 }
{ "type": "lab_stream", "content": "partial…", "timestamp": 1234 }         // streamed reasoning → chat (ai)
{ "type": "lab_reply",  "content": "final answer", "timestamp": 1234 }     // final reply → chat (ai)

// client → daemon
{ "type": "task", "prompt": "…" }     // operator tasks the Brain
{ "type": "ping" }
```

## Env

| Var | Default | Meaning |
|-----|---------|---------|
| `LAB_BRAIN_HOST` | `127.0.0.1` | WS bind host |
| `LAB_BRAIN_PORT` | `8785` | WS port the frontend connects to |
| `LAB_MODEL` | *(sdk default)* | Set to your account's most capable model (e.g. a Gemini 3 Pro) |
| `ARGUS_WS` | `ws://127.0.0.1:8770` | ARGUS watcher to relay from |
| `SEVEN_URL` / `MAMA_URL` | `:8001` / `:3000` | SAGE health-probe targets |
| `LAB_AUTO_INVESTIGATE` | `high` | Min severity that auto-triggers investigation |
| `LAB_SKILLS_PATHS` | *(auto)* | `os.pathsep`-separated skill dirs |
| `LAB_BRAIN_ENABLED` | — | set `false` to exit immediately |

## Status

- ✅ Compiles + ruff clean.
- ✅ **Reasoning core LIVE via `agy` Pro OAuth** — verified with a real generation
  (Gemini 3.1 Pro). No API key needed; `agy models` exposes Gemini 3.x Pro + Claude Opus/Sonnet 4.6.
- ✅ Full-power SDK config also builds (serena MCP auto-detected, skills discovered, 3 custom tools) as fallback.
- ✅ `sage_status()` verified live (MAMA :3000 → 200 OK).
- ✅ WS server + envelope + ARGUS-escalation-to-chat verified end-to-end.
- ✅ Frontend `tsc --noEmit` clean; bridge mounted in `App.tsx`.
