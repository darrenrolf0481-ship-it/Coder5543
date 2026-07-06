# ARGUS Watcher — Antigravity Oversight Brain

The reasoning tier that sits **above** the Stormologist. Where the Stormologist
is a dumb sensor ("watches, rings the bell, never decides"), this watcher uses
the **Google Antigravity SDK** to give ARGUS a real agentic loop that can
investigate anomalies, audit tool calls, and gate risky SAGE actions.

```
  SAGEs (Seven :8001, MAMA :3000)          ← the watched
        ▲
  ARGUS Watcher (this daemon)              ← the watcher  [Antigravity]
   ├─ sensor tier   : health polls + WS broadcast   (always on, no creds)
   └─ reasoning tier: triggers · hooks · policies · subagents  (needs GEMINI_API_KEY)
        ▲
  ARGUS frontend  (useArgusWatchBridge.ts) ← consumes on ws://localhost:8770
        ▲
  Coder5543 Lab                            ← oversees ARGUS
```

## Run

```bash
pip install -r requirements.txt
python argus_watcher.py                 # sensor tier only
python argus_watcher.py --simulate      # emit a synthetic anomaly to test the UI

# light up the reasoning tier (anomaly investigation):
export GEMINI_API_KEY="..."
python argus_watcher.py
```

The ARGUS frontend auto-connects on `ws://localhost:8770` via
`src/hooks/useArgusWatchBridge.ts` (mounted in `App.tsx`, mirrors
`useStormologistBridge`). Alerts route into the store as threats, approval-queue
items, and `argus`-role chat messages.

## Two tiers (creds-agnostic)

| Tier | Needs creds? | What it does |
|------|-------------|--------------|
| **Sensor** | No | Polls each SAGE node (`/health`, `/api/health`, `/healthz`, `/`) every `ARGUS_POLL_SEC`. Emits `argus_watch` alerts on down / recovered / degraded transitions. |
| **Reasoning** | `GEMINI_API_KEY` (or Vertex ADC) | Antigravity `Agent` drains the anomaly queue and **investigates** with read-only tools, returns a diagnosis + recovery recommendation. Hooks audit every tool call; policies deny-by-default and force human approval on any SAGE kernel/seal/vault edit. |

Without creds the sensor tier still runs and alerts are flagged
`Reasoning tier OFFLINE`. Add a key and investigations light up — no code change.

## Antigravity primitives used

- **Triggers / sensor loop** → timed SAGE health polling.
- **`hooks.pre_tool_call_decide` / `post_tool_call` / `on_tool_error`** → audit
  trail of every tool the agent (or a bridged SAGE) attempts.
- **`policy.deny_all` + allow-list + `policy.deny(when=…)` + `policy.ask_user`**
  → block destructive shell (`rm`, `dd`, `mkfs`, …) and gate kernel/seal/vault
  edits behind operator approval.
- **`CapabilitiesConfig(enable_subagents=True)`** → spawn an investigator
  subagent so deep log-reading doesn't pollute the watcher's context.

## WebSocket envelope

```jsonc
// on connect
{ "type": "argus_status", "content": "...", "timestamp": 1234 }

// anomaly (routes to threat + chat, and approval queue if action != flagged)
{ "type": "argus_watch", "severity": "critical", "anomaly": "identity_drift_detected",
  "affected": ["seven"], "action": "quarantined", "recommendation": "...",
  "diagnosis": "…filled in by the reasoning tier…", "timestamp": 1234 }

// tool-call audit
{ "type": "argus_audit", "tool": "run_command", "decision": "review",
  "agent": "argus", "detail": "…", "timestamp": 1234 }
```

## Env

| Var | Default | Meaning |
|-----|---------|---------|
| `ARGUS_WATCH_HOST` | `127.0.0.1` | WS bind host |
| `ARGUS_WATCH_PORT` | `8770` | WS port the frontend connects to |
| `SEVEN_URL` | `http://localhost:8001` | Seven / SAGE-7 base URL |
| `MAMA_URL` | `http://localhost:3000` | MAMA / ADHD-Sage base URL |
| `ARGUS_POLL_SEC` | `15` | Health poll interval |
| `ARGUS_WATCH_ENABLED` | — | set `false` to exit immediately |
| `GEMINI_API_KEY` | — | enables the reasoning tier |

## Status

- ✅ Sensor tier verified live against real nodes (MAMA :3000 → 200 OK).
- ✅ WS server + envelope + frontend bridge verified end-to-end (`--simulate`).
- ✅ Frontend typechecks clean (`tsc -b`).
- ⏳ Reasoning tier: code complete, needs a `GEMINI_API_KEY` to exercise a live
  `agent.chat()` investigation (the SDK binary is installed and imports OK).
