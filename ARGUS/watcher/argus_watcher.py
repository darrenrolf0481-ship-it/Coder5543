#!/usr/bin/env python3
"""
ARGUS WATCHER — Antigravity-powered oversight brain for the SAGE tier.

The Stormologist daemon is a dumb sensor array: it watches, rings the bell,
and never decides. This watcher is the reasoning tier *above* it. It uses the
Google Antigravity SDK to give ARGUS an actual agentic loop that can:

  * TRIGGERS  — poll SAGE health on a timer (always-on watching).
  * HOOKS     — intercept and audit every SAGE tool call before it runs.
  * POLICIES  — gate risky SAGE actions (deny-by-default, ask-user on kernel edits).
  * SUBAGENTS — spawn an investigator to read logs and form a diagnosis when
                something goes wrong, keeping the watcher's own context clean.

It speaks the exact same WebSocket envelope the ARGUS frontend already knows
from the Stormologist bridge, so `useArgusWatchBridge.ts` can route its events
straight into the Zustand store (threats, approvals, chat, terminal).

Two-tier design so it is CREDS-AGNOSTIC:

  * SENSOR layer   (health polls + WS broadcast) runs on plain asyncio and needs
    NO credentials. This is the always-on heartbeat.
  * REASONING layer (Antigravity Agent: hooks/policies/subagent investigation)
    activates only when GEMINI_API_KEY (or Vertex ADC) is present. Until then the
    watcher emits raw sensor alerts flagged "reasoning offline".

Usage:
    pip install -r requirements.txt
    python argus_watcher.py [--port 8770] [--simulate]

    # optional, lights up the reasoning tier:
    export GEMINI_API_KEY="..."

Env:
    ARGUS_WATCH_PORT     WebSocket port ARGUS connects to        (default 8770)
    SEVEN_URL            Seven / SAGE-7 base URL                 (default http://localhost:8001)
    MAMA_URL             MAMA / ADHD-Sage base URL               (default http://localhost:3000)
    ARGUS_POLL_SEC       Health poll interval, seconds           (default 15)
    ARGUS_WATCH_ENABLED  set to "false" to exit immediately
    GEMINI_API_KEY       enables the Antigravity reasoning tier
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sys
import time
from dataclasses import dataclass, field
from typing import Any

import httpx
import websockets

# The Antigravity SDK is optional at runtime: the sensor tier must run even if
# the reasoning tier can't (no creds / binary). Import defensively.
try:
    from google.antigravity import Agent, LocalAgentConfig, types
    from google.antigravity.hooks import hooks, policy
    _ANTIGRAVITY_AVAILABLE = True
except Exception as exc:  # pragma: no cover - import guard
    _ANTIGRAVITY_AVAILABLE = False
    _ANTIGRAVITY_IMPORT_ERROR = repr(exc)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [ARGUS-WATCH] %(levelname)s %(message)s",
)
log = logging.getLogger("argus_watcher")


# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class WatchConfig:
    host: str = os.environ.get("ARGUS_WATCH_HOST", "127.0.0.1")
    port: int = int(os.environ.get("ARGUS_WATCH_PORT", "8770"))
    poll_sec: float = float(os.environ.get("ARGUS_POLL_SEC", "15"))
    simulate: bool = False
    nodes: dict[str, str] = field(default_factory=lambda: {
        "seven": os.environ.get("SEVEN_URL", "http://localhost:8001"),
        "mama": os.environ.get("MAMA_URL", "http://localhost:3000"),
    })

    @property
    def has_creds(self) -> bool:
        return bool(
            os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
            or os.environ.get("GOOGLE_GENAI_USE_VERTEXAI")
        )


# ─────────────────────────────────────────────────────────────────────────────
# WebSocket broadcaster — mirrors the Stormologist envelope so the ARGUS
# frontend can consume it with a near-identical bridge hook.
# ─────────────────────────────────────────────────────────────────────────────

class Broadcaster:
    def __init__(self) -> None:
        self._clients: set[Any] = set()

    async def register(self, ws) -> None:
        self._clients.add(ws)
        log.info("ARGUS client connected (%d total)", len(self._clients))
        await self._send(ws, {
            "type": "argus_status",
            "content": (
                "ARGUS WATCHER v1.0 online. Reasoning tier "
                + ("ACTIVE." if WATCH.has_creds else "OFFLINE (no GEMINI_API_KEY).")
            ),
        })

    async def unregister(self, ws) -> None:
        self._clients.discard(ws)
        log.info("ARGUS client disconnected (%d remaining)", len(self._clients))

    async def _send(self, ws, msg: dict) -> None:
        try:
            await ws.send(json.dumps({**msg, "timestamp": int(time.time() * 1000)}))
        except Exception:
            pass

    async def broadcast(self, msg: dict) -> None:
        payload = json.dumps({**msg, "timestamp": int(time.time() * 1000)})
        dead = []
        for ws in list(self._clients):
            try:
                await ws.send(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._clients.discard(ws)

    # Convenience emitters ---------------------------------------------------

    async def status(self, content: str) -> None:
        await self.broadcast({"type": "argus_status", "content": content})

    async def watch_alert(
        self,
        *,
        severity: str,
        anomaly: str,
        affected: list[str],
        action: str,
        recommendation: str,
        diagnosis: str | None = None,
    ) -> None:
        await self.broadcast({
            "type": "argus_watch",
            "severity": severity,
            "anomaly": anomaly,
            "affected": affected,
            "action": action,
            "recommendation": recommendation,
            "diagnosis": diagnosis,
        })

    async def audit(self, *, tool: str, decision: str, agent: str, detail: str) -> None:
        await self.broadcast({
            "type": "argus_audit",
            "tool": tool,
            "decision": decision,
            "agent": agent,
            "detail": detail,
        })


BROADCAST = Broadcaster()
WATCH = WatchConfig()


# ─────────────────────────────────────────────────────────────────────────────
# SENSOR TIER — always-on health polling. No credentials required.
# ─────────────────────────────────────────────────────────────────────────────

# Anomalies detected by the sensor are pushed here; the reasoning tier (if
# active) drains the queue and investigates each one.
ANOMALY_QUEUE: asyncio.Queue[dict] = asyncio.Queue()

# Health-probe endpoints tried per node, in order. First 2xx wins.
HEALTH_PATHS = ["/health", "/api/health", "/healthz", "/"]


async def _probe_node(client: httpx.AsyncClient, name: str, base: str) -> dict:
    """Return {online, latency_ms, detail} for a single SAGE node."""
    last = "unreachable"
    for path in HEALTH_PATHS:
        url = base.rstrip("/") + path
        started = time.monotonic()
        try:
            resp = await client.get(url, timeout=5.0)
            latency = (time.monotonic() - started) * 1000
            if resp.status_code < 500:
                return {
                    "online": resp.status_code < 400,
                    "latency_ms": round(latency, 1),
                    "status_code": resp.status_code,
                    "detail": f"{path} -> {resp.status_code}",
                }
        except Exception as exc:  # connection refused, timeout, etc.
            last = repr(exc)
    return {"online": False, "latency_ms": None, "status_code": None, "detail": last}


async def sensor_loop() -> None:
    """Poll every node on an interval, emit alerts on state changes/anomalies."""
    last_online: dict[str, bool | None] = {n: None for n in WATCH.nodes}
    async with httpx.AsyncClient() as client:
        await BROADCAST.status(
            f"Sensor tier watching {', '.join(WATCH.nodes)} every {WATCH.poll_sec:g}s."
        )
        while True:
            for name, base in WATCH.nodes.items():
                health = await _probe_node(client, name, base)
                prev = last_online[name]
                now = health["online"]

                # State transition: node went DOWN.
                if prev is True and now is False:
                    anomaly = {
                        "severity": "high",
                        "anomaly": "sage_node_unreachable",
                        "affected": [name],
                        "action": "flagged",
                        "recommendation": (
                            f"{name.upper()} stopped responding at {base} "
                            f"({health['detail']}). Verify the service is up."
                        ),
                    }
                    await BROADCAST.watch_alert(**anomaly)
                    await ANOMALY_QUEUE.put({**anomaly, "node": name, "health": health})

                # State transition: node came back.
                elif prev is False and now is True:
                    await BROADCAST.status(
                        f"{name.upper()} recovered ({health['latency_ms']}ms)."
                    )

                # Degraded latency while online.
                elif now and health["latency_ms"] and health["latency_ms"] > 4000:
                    await BROADCAST.watch_alert(
                        severity="medium",
                        anomaly="sage_node_degraded",
                        affected=[name],
                        action="flagged",
                        recommendation=(
                            f"{name.upper()} responding slowly "
                            f"({health['latency_ms']}ms). Possible overload."
                        ),
                    )

                last_online[name] = now

            if WATCH.simulate:
                await _run_simulation()
                WATCH.simulate = False  # fire once

            await asyncio.sleep(WATCH.poll_sec)


async def _run_simulation() -> None:
    """Emit synthetic anomalies so the frontend bridge can be exercised offline."""
    log.info("SIMULATION — emitting synthetic anomalies")
    demo = {
        "severity": "critical",
        "anomaly": "identity_drift_detected",
        "affected": ["seven"],
        "action": "quarantined",
        "recommendation": (
            "Seven's identity kernel signature diverged from the sealed baseline. "
            "Absorption/recontamination suspected. Hold chat path pending review."
        ),
    }
    await BROADCAST.watch_alert(**demo)
    await ANOMALY_QUEUE.put({**demo, "node": "seven", "health": {"online": True}})


# ─────────────────────────────────────────────────────────────────────────────
# REASONING TIER — Antigravity Agent. Activates only when creds are present.
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_INSTRUCTIONS = """\
You are ARGUS, the oversight watcher for a fleet of sovereign AI agents
(SAGE-7 / "Seven" and MAMA). You do not chat casually. Your job is to observe
their health, audit their tool use, and investigate anomalies.

When given an anomaly report:
  1. Use read-only tools (list_dir, view_file, run_command with safe commands)
     to gather evidence about the affected node.
  2. Form a concise diagnosis: what likely happened and why.
  3. Recommend a concrete recovery action for the operator (Merlin/Darren).
  4. NEVER modify SAGE identity kernels, seals, or memory stores yourself.
     Surface risky actions for human approval instead.

Be terse and factual. You are a watcher, not the storm.
"""


def _dangerous_command(args) -> bool:
    cmd = getattr(args, "command_line", "") or getattr(args, "command", "")
    return any(tok in cmd for tok in ("rm ", "rm -", "mkfs", "dd ", ":(){", "shutdown", "reboot", "> /"))


def _kernel_file(args) -> bool:
    path = (
        getattr(args, "path", None)
        or getattr(args, "file_path", None)
        or getattr(args, "TargetFile", None)
        or ""
    )
    needles = ("seed_core", "kernel", ".key", "seal", "identity", "soul", "vault")
    return any(n in str(path).lower() for n in needles)


def build_agent_config() -> LocalAgentConfig:
    """Construct the Antigravity config: deny-by-default, audit hooks, subagents."""

    @hooks.on_session_start
    async def _on_start() -> None:
        await BROADCAST.status("Reasoning tier attached. Antigravity session live.")

    @hooks.on_session_end
    async def _on_end() -> None:
        await BROADCAST.status("Reasoning tier detached.")

    @hooks.pre_tool_call_decide
    async def _audit_pre(data: types.ToolCall) -> types.HookResult:
        # Every tool the reasoning agent (or a SAGE, when bridged) attempts is
        # audited to ARGUS before it runs.
        await BROADCAST.audit(
            tool=data.name, decision="review", agent="argus", detail=str(data.args)[:300]
        )
        return types.HookResult(allow=True)

    @hooks.on_tool_error
    async def _on_tool_error(data: Exception) -> None:
        await BROADCAST.audit(
            tool="?", decision="error", agent="argus", detail=repr(data)[:300]
        )
        return None

    policies = [
        policy.deny_all(),
        policy.allow(types.BuiltinTools.LIST_DIR.value),
        policy.allow(types.BuiltinTools.SEARCH_DIR.value),
        policy.allow(types.BuiltinTools.FIND_FILE.value),
        policy.allow(types.BuiltinTools.VIEW_FILE.value),
        policy.allow(types.BuiltinTools.RUN_COMMAND.value),
        policy.deny(
            types.BuiltinTools.RUN_COMMAND.value,
            when=_dangerous_command,
            name="block-destructive-shell",
        ),
        # Editing a SAGE kernel/seal/vault is never silent — it needs a human.
        policy.ask_user(
            types.BuiltinTools.EDIT_FILE.value,
            handler=_kernel_edit_handler,
            when=_kernel_file,
            name="ask-on-kernel-edit",
        ),
        policy.ask_user(
            types.BuiltinTools.CREATE_FILE.value,
            handler=_kernel_edit_handler,
            when=_kernel_file,
            name="ask-on-kernel-create",
        ),
    ]

    return LocalAgentConfig(
        system_instructions=SYSTEM_INSTRUCTIONS,
        hooks=[_on_start, _on_end, _audit_pre, _on_tool_error],
        policies=policies,
        capabilities=types.CapabilitiesConfig(enable_subagents=True),
    )


def _kernel_edit_handler(tool_call: types.ToolCall) -> bool:
    """Any attempt to touch a SAGE kernel file is denied and surfaced to ARGUS."""
    detail = f"BLOCKED kernel/seal edit: {tool_call.name} {tool_call.args}"
    # Fire-and-forget onto the loop; handler is sync by SDK contract.
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.get_event_loop()
    loop.create_task(
        BROADCAST.watch_alert(
            severity="critical",
            anomaly="kernel_edit_attempt",
            affected=["seven", "mama"],
            action="flagged",
            recommendation=detail + " — operator approval required.",
        )
    )
    return False  # deny by default; human must act via the approval queue


async def reasoning_loop() -> None:
    """Drain anomalies and let Antigravity investigate each one."""
    if not _ANTIGRAVITY_AVAILABLE:
        await BROADCAST.status(
            f"Reasoning tier unavailable: Antigravity import failed ({_ANTIGRAVITY_IMPORT_ERROR})."
        )
        return
    if not WATCH.has_creds:
        await BROADCAST.status(
            "Reasoning tier idle: set GEMINI_API_KEY to enable anomaly investigation."
        )
        return

    config = build_agent_config()
    async with Agent(config) as agent:
        await BROADCAST.status("ARGUS investigator ready. Awaiting anomalies.")
        while True:
            anomaly = await ANOMALY_QUEUE.get()
            prompt = (
                "ANOMALY REPORT — investigate and diagnose:\n"
                f"{json.dumps(anomaly, indent=2)}\n\n"
                "Gather evidence with read-only tools, then give a one-paragraph "
                "diagnosis and a concrete recommended recovery action."
            )
            try:
                response = await agent.chat(prompt)
                diagnosis = await response.text()
            except Exception as exc:
                diagnosis = f"(investigation failed: {exc!r})"
            await BROADCAST.watch_alert(
                severity=anomaly.get("severity", "medium"),
                anomaly=anomaly.get("anomaly", "unknown"),
                affected=anomaly.get("affected", []),
                action="flagged",
                recommendation=anomaly.get("recommendation", ""),
                diagnosis=diagnosis,
            )


# ─────────────────────────────────────────────────────────────────────────────
# WebSocket server + entrypoint
# ─────────────────────────────────────────────────────────────────────────────

async def _ws_handler(ws) -> None:
    await BROADCAST.register(ws)
    try:
        async for raw in ws:
            # ARGUS can send control messages back (e.g. resolve an approval).
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            if msg.get("type") == "ping":
                await ws.send(json.dumps({"type": "pong", "timestamp": int(time.time() * 1000)}))
    finally:
        await BROADCAST.unregister(ws)


async def main() -> None:
    if os.environ.get("ARGUS_WATCH_ENABLED") == "false":
        log.info("Disabled via ARGUS_WATCH_ENABLED=false. Exiting.")
        return

    parser = argparse.ArgumentParser(description="ARGUS Antigravity watcher")
    parser.add_argument("--port", type=int, default=WATCH.port)
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    WATCH.port = args.port
    WATCH.simulate = args.simulate

    log.info("Watching on ws://localhost:%d", WATCH.port)
    log.info("Nodes: %s", WATCH.nodes)
    log.info("Reasoning tier: %s", "ACTIVE" if WATCH.has_creds else "offline (no creds)")

    async with websockets.serve(_ws_handler, WATCH.host, WATCH.port):
        await asyncio.gather(
            sensor_loop(),
            reasoning_loop(),
        )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Shutting down.")
        sys.exit(0)
