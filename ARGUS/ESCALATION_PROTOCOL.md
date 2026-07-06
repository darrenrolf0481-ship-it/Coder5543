# ARGUS Escalation Protocol

The wire contract between this repo (ARGUS + Stormologist daemon) and
external participants — specifically `argus_watcher.py` and Lab Brain,
which live in the **ADHD-Sage** repo. The two repos never share code;
everything goes over this WebSocket protocol.

```
argus_watcher.py ──telemetry──▶ STORMOLOGIST DAEMON ──storm_alert──▶ ARGUS dashboard
   (ADHD-Sage)                    (this repo, :8765)        │
                                        ▲                   └─storm_alert──▶ Lab Brain
                                        │                                     (ADHD-Sage)
                                        └──── list_incidents / resolve_incident ──┘
```

## Connection

- Endpoint: `ws://localhost:8765` (both sides run on the same code-server box)
- Start the daemon: `npm run stormologist` in `ARGUS/`
- There is **no registration handshake** — connect and you're in. On
  connect the daemon sends one `stormologist_status` message. Every
  connected client receives all `storm_alert` broadcasts; there are no
  per-client subscriptions.
- Payloads are single JSON objects, one per WebSocket text frame.

## Messages the daemon ACCEPTS

### 1. `telemetry` — what the watcher sends

```json
{ "type": "telemetry", "meta": { "...fields below...": true } }
```

The daemon evaluates `meta` against its detection rules (first match wins,
one alert per telemetry message). Fields the rules look at:

| meta field | type | rule triggered when | resulting alert |
|---|---|---|---|
| `handshakeMs` | number | `> 5000` | `bridge_handshake_timeout` (high, isolated) |
| `norepinephrine` + `serotonin` | numbers | `> 0.8` and `< 0.2` | `neuro_state_anomaly` (critical, flagged) |
| `payloadType` | string | `"classifier_injection"` | `classifier_injection_detected` (critical, flagged) |
| `payloadType` | string | `"unknown"` | `unknown_payload_detected` (critical, severed) |
| `statusCode` + `error` | number + string | `404/403` and `"model_not_found"` | `api_backend_mismatch` (medium, flagged) |
| `reconnectAttemptsPerMinute` | number | `> 10` | `rapid_reconnect_pattern` (high, quarantined) |
| `nodes` | string[] | always read | names the affected nodes in the alert (e.g. `["sage"]`) |
| `hash`, `source` | strings | optional | included in the recommendation text |

**SAGE-down detection**: the watcher should health-check each SAGE and,
on failure, send timing telemetry — e.g. a request that timed out after
7 s is `{ "type": "telemetry", "meta": { "handshakeMs": 7000, "nodes": ["sage"] } }`.
A SAGE whose API returns 404 `model_not_found` maps to the
`api_backend_mismatch` rule. Telemetry that matches no rule is silently
ignored (that's healthy traffic — send it freely).

### 2. `list_incidents` — how Lab Brain investigates

```json
{ "type": "list_incidents", "status": "open" }
```

`status` is `"open"` (default), `"resolved"`, or `"all"`. The daemon
replies **to the requester only**:

```json
{ "type": "incident_list", "incidents": [], "timestamp": 1234567890 }
```

### 3. `resolve_incident` — closing the loop after investigation

```json
{ "type": "resolve_incident", "id": "VH295UF7", "method": "restarted sage backend; model id corrected" }
```

Marks the incident resolved and broadcasts a `stormologist_status`
notice to all clients. `id` comes from the incident objects.

## Messages the daemon BROADCASTS

### `storm_alert` — sent to every connected client when a rule fires

```json
{
  "type": "storm_alert",
  "severity": "critical",
  "anomaly": "unknown_payload_detected",
  "affected": ["seven", "mama"],
  "action": "severed",
  "recommendation": "human-readable next steps",
  "timestamp": 1234567890
}
```

`severity`: low | medium | high | critical. `action`: isolated | severed |
quarantined | flagged.

**Lab Brain's trigger**: listen for `storm_alert`, investigate (optionally
pulling context via `list_incidents`), then `resolve_incident` when done.
The ARGUS dashboard receives the same broadcast and shows it in the
Security Hub / threat log / approval queue — no extra work needed.

### `stormologist_status` — informational one-liners

```json
{ "type": "stormologist_status", "content": "Incident VH295UF7 resolved: ...", "timestamp": 1234567890 }
```

## Incident object shape (forensics log entries)

```json
{
  "id": "VH295UF7",
  "timestamp": "2026-07-04T18:53:28.895Z",
  "anomaly_signature": "unknown_payload_detected",
  "affected_nodes": ["seven", "mama"],
  "isolation_action": "severed",
  "recommended_recovery": "…",
  "severity": "critical",
  "resolution_status": "open",
  "resolution_method": null
}
```

`resolution_status` is open | resolved; `resolution_method` is set by
`resolve_incident`. The log is in-memory (append-only while the daemon
runs); it resets on daemon restart. If durable forensics are needed
later, persist it — but keep it append-only per the Stormologist spec.

## Reference client (Python, for argus_watcher.py / Lab Brain)

```python
# pip install websockets
import asyncio, json, websockets

DAEMON = "ws://localhost:8765"

async def watcher_report(meta: dict):
    """Send one telemetry reading (fire-and-forget)."""
    async with websockets.connect(DAEMON) as ws:
        await ws.send(json.dumps({"type": "telemetry", "meta": meta}))

async def lab_brain_listen():
    """Stay connected; react to alerts; resolve after investigating."""
    async with websockets.connect(DAEMON) as ws:
        async for frame in ws:
            msg = json.loads(frame)
            if msg.get("type") != "storm_alert":
                continue
            # ... investigate here (agy Pro reasoning, etc.) ...
            await ws.send(json.dumps({"type": "list_incidents", "status": "open"}))
            incidents = json.loads(await ws.recv()).get("incidents", [])
            latest = incidents[-1] if incidents else None
            if latest:
                await ws.send(json.dumps({
                    "type": "resolve_incident",
                    "id": latest["id"],
                    "method": "lab-brain: <what was done>",
                }))

# example: report a SAGE health-check timeout
# asyncio.run(watcher_report({"handshakeMs": 7000, "nodes": ["sage"]}))
```

## Protocol rules (per the Stormologist charter)

- The daemon **never** modifies node state, spawns entities, or reads
  message content — telemetry is metadata only (timings, status codes,
  hashes). Don't send conversation text in `meta`.
- Uncertain → isolate. False positives beat false negatives.
- Everything is logged in plain text; the incident log is auditable.
- Adding a detection rule = editing `DETECTION_RULES` in
  `stormologist-daemon.cjs` (a human commit, not runtime self-modification).
