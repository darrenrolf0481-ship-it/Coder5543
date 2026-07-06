#!/usr/bin/env python3
"""
LAB BRAIN — full-power Antigravity agent for the Coder5543 oversight lab.

This is the TOP tier of the three-layer oversight stack:

    SAGEs (Seven :8001, MAMA :3000)      ← the watched
        ▲
    ARGUS watcher (:8770)                ← watches the SAGEs      [Antigravity, gated]
        ▲
    LAB BRAIN (this daemon, :8785)       ← watches ARGUS          [Antigravity, FULL POWER]
        ▲
    Coder5543 frontend (useLabBrainBridge.ts)

Where the ARGUS watcher runs deny-by-default and creds-gated, the Lab Brain is
the operator's cockpit: it runs Antigravity at maximum horsepower —

  * SUBAGENTS   enabled (delegate heavy work, keep context clean)
  * ALL builtin tools (files, shell, web search, image gen, subagents)
  * MCP SERVERS  the lab already uses (serena, 21st-magic, ollama-mcp)
  * SKILLS       loaded from skill collections via skills_paths
  * TRIGGERS     watching ARGUS — escalations flow up and the Brain reasons on them
  * CUSTOM TOOLS to query/command ARGUS and probe SAGE health across the stack
  * POLICIES     open by default, with guardrails only on genuinely destructive
                 shell + SAGE kernel/seal edits (surfaced for approval, never silent)
  * HOOKS        stream every turn + tool call into the lab chat, live

Auth (pick one — the operator logs in with their own account):
  * export GEMINI_API_KEY=...                              (AI Studio key)
  * export GOOGLE_GENAI_USE_VERTEXAI=true \
           GOOGLE_CLOUD_PROJECT=... GOOGLE_CLOUD_LOCATION=us-central1
    and `gcloud auth application-default login`            (Vertex / ADC)

Usage:
    pip install -r requirements.txt
    python lab_brain.py [--port 8785]

Two-tier + creds-agnostic, exactly like the watcher: the WS server and the
ARGUS relay run without creds; the Antigravity reasoning core activates the
moment auth is present.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import shutil
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any

import httpx
import websockets

try:
    from google.antigravity import Agent, LocalAgentConfig, types
    from google.antigravity.hooks import hooks, policy
    _ANTIGRAVITY_AVAILABLE = True
    _ANTIGRAVITY_IMPORT_ERROR = ""
except Exception as exc:  # pragma: no cover - import guard
    _ANTIGRAVITY_AVAILABLE = False
    _ANTIGRAVITY_IMPORT_ERROR = repr(exc)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [LAB-BRAIN] %(levelname)s %(message)s",
)
log = logging.getLogger("lab_brain")

HOME = os.path.expanduser("~")
# Repo root = parent of this lab-brain/ dir (the Coder5543 checkout).
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

# The Antigravity CLI (`agy`) caches a Pro-account OAuth token here after login.
# If present, the Lab Brain drives `agy` directly — full Pro power, no API key,
# and access to Gemini 3.x Pro + Claude Opus/Sonnet via the Pro quota.
AGY_TOKEN_PATH = os.path.join(HOME, ".gemini/antigravity-cli/antigravity-oauth-token")


@dataclass
class BrainConfig:
    host: str = os.environ.get("LAB_BRAIN_HOST", "127.0.0.1")
    port: int = int(os.environ.get("LAB_BRAIN_PORT", "8785"))
    # Engine: "auto" prefers agy (Pro OAuth) → SDK (api key/Vertex) → offline.
    engine: str = os.environ.get("LAB_ENGINE", "auto").lower()

    # ── agy engine (preferred: already-authenticated Pro account) ──
    agy_bin: str = os.environ.get("LAB_AGY_BIN", "agy")
    # An `agy models` name. Gemini 3.x Pro / Claude Opus 4.6 are the heavy hitters.
    agy_model: str = os.environ.get("LAB_AGY_MODEL", "Gemini 3.1 Pro (High)")
    agy_timeout: float = float(os.environ.get("LAB_AGY_TIMEOUT", "300"))
    # Let agy actually touch the repo (tools + skip-permissions). Off = reason-only.
    agy_autonomous: bool = os.environ.get("LAB_AGY_AUTONOMOUS", "").lower() in ("1", "true", "yes")

    # ── SDK engine (fallback: needs an API key or Vertex ADC) ──
    model: str | None = os.environ.get("LAB_MODEL") or None

    argus_ws: str = os.environ.get("ARGUS_WS", "ws://127.0.0.1:8770")
    seven_url: str = os.environ.get("SEVEN_URL", "http://localhost:8001")
    mama_url: str = os.environ.get("MAMA_URL", "http://localhost:3000")
    # Auto-investigate ARGUS alerts at/above this severity without being asked.
    auto_investigate_at: str = os.environ.get("LAB_AUTO_INVESTIGATE", "high")

    skills_paths: list[str] = field(default_factory=lambda: _default_skills_paths())

    @property
    def agy_available(self) -> bool:
        return shutil.which(self.agy_bin) is not None

    @property
    def agy_authed(self) -> bool:
        return self.agy_available and os.path.isfile(AGY_TOKEN_PATH)

    @property
    def has_creds(self) -> bool:
        return bool(
            os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
            or os.environ.get("GOOGLE_GENAI_USE_VERTEXAI")
        )

    @property
    def use_vertex(self) -> bool:
        return os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").lower() in ("1", "true", "yes")

    def selected_engine(self) -> str:
        """Resolve which reasoning engine to use given availability + LAB_ENGINE."""
        if self.engine == "agy":
            return "agy" if self.agy_available else "offline"
        if self.engine == "sdk":
            return "sdk" if (_ANTIGRAVITY_AVAILABLE and self.has_creds) else "offline"
        # auto: prefer the already-authenticated agy Pro path.
        if self.agy_available:
            return "agy"
        if _ANTIGRAVITY_AVAILABLE and self.has_creds:
            return "sdk"
        return "offline"


def _default_skills_paths() -> list[str]:
    """Discover skill collections to load. Override with LAB_SKILLS_PATHS (os.pathsep)."""
    env = os.environ.get("LAB_SKILLS_PATHS")
    if env:
        return [p for p in env.split(os.pathsep) if p and os.path.isdir(p)]
    candidates = [
        os.path.join(HOME, "antigravity-sdk-python/skills/google-antigravity-sdk"),
        os.path.join(REPO_ROOT, "..", "antigravity-sdk-python/skills/google-antigravity-sdk"),
        os.path.join(HOME, "Skills"),
    ]
    return [os.path.abspath(p) for p in candidates if os.path.isdir(p)]


CFG = BrainConfig()

SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}


# ─────────────────────────────────────────────────────────────────────────────
# WebSocket broadcaster — the lab frontend connects here for live reasoning.
# ─────────────────────────────────────────────────────────────────────────────

class Broadcaster:
    def __init__(self) -> None:
        self._clients: set[Any] = set()

    async def register(self, ws) -> None:
        self._clients.add(ws)
        log.info("Lab client connected (%d total)", len(self._clients))
        engine = CFG.selected_engine()
        blurb = {
            "agy": f"ACTIVE via agy Pro OAuth — {CFG.agy_model}.",
            "sdk": "ACTIVE via SDK (API key / Vertex).",
            "offline": "OFFLINE (install/login `agy`, or set GEMINI_API_KEY).",
        }[engine]
        await self._send(ws, {
            "type": "lab_status",
            "content": f"LAB BRAIN online. Reasoning core {blurb}",
        })

    async def unregister(self, ws) -> None:
        self._clients.discard(ws)

    async def _send(self, ws, msg: dict) -> None:
        try:
            await ws.send(json.dumps({**msg, "timestamp": int(time.time() * 1000)}))
        except Exception:
            pass

    async def broadcast(self, msg: dict) -> None:
        payload = json.dumps({**msg, "timestamp": int(time.time() * 1000)})
        for ws in list(self._clients):
            try:
                await ws.send(payload)
            except Exception:
                self._clients.discard(ws)

    async def status(self, content: str) -> None:
        await self.broadcast({"type": "lab_status", "content": content})

    async def stream(self, chunk: str) -> None:
        await self.broadcast({"type": "lab_stream", "content": chunk})

    async def reply(self, content: str) -> None:
        await self.broadcast({"type": "lab_reply", "content": content})

    async def tool(self, name: str, phase: str, detail: str) -> None:
        await self.broadcast({"type": "lab_tool", "name": name, "phase": phase, "detail": detail})


BROADCAST = Broadcaster()

# Tasks from the frontend (operator prompts) and ARGUS auto-investigations.
TASK_QUEUE: asyncio.Queue[dict] = asyncio.Queue()

# Rolling memory of what ARGUS has reported, exposed to the agent as a tool.
ARGUS_FEED: deque[dict] = deque(maxlen=50)
# Live handle to the ARGUS socket so custom tools can command it.
_argus_ws_holder: dict[str, Any] = {"ws": None}


# ─────────────────────────────────────────────────────────────────────────────
# ARGUS relay — the Lab Brain watches ARGUS (which watches the SAGEs).
# Plain asyncio client; runs with or without creds.
# ─────────────────────────────────────────────────────────────────────────────

async def argus_relay() -> None:
    backoff = [2, 4, 8, 16, 30]
    attempt = 0
    while True:
        try:
            async with websockets.connect(CFG.argus_ws) as ws:
                _argus_ws_holder["ws"] = ws
                attempt = 0
                await BROADCAST.status(f"Watching ARGUS at {CFG.argus_ws}.")
                async for raw in ws:
                    try:
                        msg = json.loads(raw)
                    except Exception:
                        continue
                    ARGUS_FEED.append(msg)
                    await _handle_argus_message(msg)
        except Exception as exc:
            _argus_ws_holder["ws"] = None
            delay = backoff[min(attempt, len(backoff) - 1)]
            attempt += 1
            log.info("ARGUS relay disconnected (%r); retry in %ss", exc, delay)
            await asyncio.sleep(delay)


async def _handle_argus_message(msg: dict) -> None:
    if msg.get("type") != "argus_watch":
        return
    sev = msg.get("severity", "low")
    # Mirror the escalation into the lab chat so the operator always sees it.
    await BROADCAST.status(
        f"⇡ ARGUS escalation [{sev.upper()}] {msg.get('anomaly')} "
        f"→ {', '.join(msg.get('affected', []))}"
    )
    threshold = SEVERITY_RANK.get(CFG.auto_investigate_at, 2)
    if SEVERITY_RANK.get(sev, 0) >= threshold:
        # Autonomously reason about serious escalations.
        await TASK_QUEUE.put({
            "source": "argus",
            "prompt": (
                "ARGUS escalated an anomaly it is watching over the SAGE tier. "
                "Assess it as the oversight lab: is ARGUS handling it correctly, "
                "and does the operator need to act?\n\n"
                f"{json.dumps(msg, indent=2)}"
            ),
        })


# ─────────────────────────────────────────────────────────────────────────────
# Custom cross-tier tools handed to the agent (full-power reach).
# ─────────────────────────────────────────────────────────────────────────────

def query_argus() -> str:
    """Return ARGUS's recent watch alerts and status messages (most recent last)."""
    if not ARGUS_FEED:
        return "No messages from ARGUS yet (relay may still be connecting)."
    lines = []
    for m in list(ARGUS_FEED)[-15:]:
        t = m.get("type")
        if t == "argus_watch":
            lines.append(
                f"[{m.get('severity','?').upper()}] {m.get('anomaly')} "
                f"({', '.join(m.get('affected', []))}) — {m.get('recommendation','')}"
            )
        elif t == "argus_status":
            lines.append(f"[status] {m.get('content','')}")
        elif t == "argus_audit":
            lines.append(f"[audit] {m.get('agent')}::{m.get('tool')} {m.get('decision')}")
    return "\n".join(lines) or "No relevant ARGUS messages."


def command_argus(action: str) -> str:
    """Send a control command to the ARGUS watcher (e.g. 'ping', 'resolve:<id>')."""
    ws = _argus_ws_holder.get("ws")
    if ws is None:
        return "ARGUS is not currently connected; command not sent."
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(ws.send(json.dumps({"type": "command", "action": action})))
        return f"Command '{action}' dispatched to ARGUS."
    except Exception as exc:
        return f"Failed to command ARGUS: {exc!r}"


def sage_status() -> str:
    """Probe SAGE-7 (Seven) and MAMA health directly and report reachability."""
    results = []
    for name, base in (("seven", CFG.seven_url), ("mama", CFG.mama_url)):
        ok = False
        detail = "unreachable"
        for path in ("/health", "/api/health", "/healthz", "/"):
            try:
                r = httpx.get(base.rstrip("/") + path, timeout=4.0)
                if r.status_code < 500:
                    ok = r.status_code < 400
                    detail = f"{path} -> {r.status_code}"
                    break
            except Exception as exc:
                detail = repr(exc)
        results.append(f"{name.upper()}: {'ONLINE' if ok else 'DOWN'} ({detail})")
    return " | ".join(results)


LAB_TOOLS = [query_argus, command_argus, sage_status]


# ─────────────────────────────────────────────────────────────────────────────
# Antigravity reasoning core — FULL POWER.
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_INSTRUCTIONS = """\
You are the LAB BRAIN — the top-tier oversight intelligence of the Coder5543
coding lab. You sit above ARGUS, which sits above a fleet of sovereign AI agents
(SAGE-7 / "Seven" and MAMA). Your remit:

  * Oversee ARGUS: confirm it is correctly watching and gating the SAGE tier.
  * Reason about escalations that flow up from ARGUS; decide if the human
    operator (Merlin / Darren) needs to act, and say so plainly.
  * Do real engineering work in this repository when asked: read, analyse,
    refactor, and build — you have full file, shell, web, subagent and MCP tools.
  * Delegate heavy or noisy sub-tasks to subagents to keep your context clean.

Guardrails (never bypass):
  * Never silently modify a SAGE identity kernel, seal, soul, or vault. Surface
    such actions for operator approval.
  * Avoid destructive shell. Prefer reversible, inspectable steps.

Be direct and technical. Report outcomes faithfully — if something failed, say so.
You are the calm mind at the top of the stack.
"""


def _dangerous_command(args) -> bool:
    cmd = getattr(args, "command_line", "") or getattr(args, "command", "")
    return any(tok in cmd for tok in ("rm -rf", "rm -r", "mkfs", "dd if=", ":(){", "shutdown", "reboot", "> /dev"))


def _kernel_file(args) -> bool:
    path = (
        getattr(args, "path", None)
        or getattr(args, "file_path", None)
        or getattr(args, "TargetFile", None)
        or ""
    )
    needles = ("seed_core", "kernel", ".key", "seal", "identity", "soul", "vault")
    return any(n in str(path).lower() for n in needles)


def _kernel_edit_handler(tool_call) -> bool:
    detail = f"BLOCKED SAGE kernel/seal edit from lab brain: {tool_call.name} {tool_call.args}"
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.get_event_loop()
    loop.create_task(BROADCAST.status("⚠️ " + detail + " — operator approval required."))
    return False


def build_mcp_servers() -> list:
    """Wire in the same MCP servers the lab already uses, when present on disk."""
    servers = []

    # Serena (semantic code tools) — uv run inside the repo's serena/ package.
    serena_dir = os.path.join(REPO_ROOT, "serena")
    if os.path.isdir(serena_dir):
        servers.append(types.McpStdioServer(
            name="serena",
            command="uv",
            args=["run", "serena", "start-mcp-server", "--transport", "stdio", "--project-from-cwd"],
            cwd=serena_dir,
        ))

    # 21st-magic + ollama-mcp live under ADHD-Sage (node dist builds).
    for name, rel in (
        ("21st-magic", "ADHD-Sage/magic-mcp/dist/index.js"),
        ("ollama-mcp", "ADHD-Sage/ollama-mcp/dist/index.js"),
    ):
        p = os.path.join(HOME, rel)
        if os.path.isfile(p):
            servers.append(types.McpStdioServer(name=name, command="node", args=[p]))

    return servers


def build_agent_config() -> LocalAgentConfig:
    # ── Streaming hooks: surface the Brain's live reasoning to the lab chat ──
    @hooks.on_session_start
    async def _on_start() -> None:
        await BROADCAST.status("Reasoning core attached. Full-power Antigravity session live.")

    @hooks.on_session_end
    async def _on_end() -> None:
        await BROADCAST.status("Reasoning core detached.")

    @hooks.pre_tool_call_decide
    async def _pre_tool(data) -> Any:
        await BROADCAST.tool(name=data.name, phase="start", detail=str(getattr(data, "args", ""))[:280])
        return types.HookResult(allow=True)

    @hooks.post_tool_call
    async def _post_tool(data) -> None:
        await BROADCAST.tool(name=getattr(data, "name", "?"), phase="done",
                             detail=str(getattr(data, "result", ""))[:280])

    @hooks.on_tool_error
    async def _tool_err(data: Exception) -> Any:
        await BROADCAST.tool(name="?", phase="error", detail=repr(data)[:280])
        return None

    # ── Policies: open cockpit, guardrails only on the genuinely dangerous ──
    policies = [
        policy.allow_all(),
        policy.deny(types.BuiltinTools.RUN_COMMAND.value, when=_dangerous_command, name="block-destructive-shell"),
        policy.ask_user(types.BuiltinTools.EDIT_FILE.value, handler=_kernel_edit_handler,
                        when=_kernel_file, name="ask-on-kernel-edit"),
        policy.ask_user(types.BuiltinTools.CREATE_FILE.value, handler=_kernel_edit_handler,
                        when=_kernel_file, name="ask-on-kernel-create"),
    ]

    kwargs: dict[str, Any] = dict(
        system_instructions=SYSTEM_INSTRUCTIONS,
        capabilities=types.CapabilitiesConfig(enable_subagents=True),
        tools=LAB_TOOLS,
        policies=policies,
        hooks=[_on_start, _on_end, _pre_tool, _post_tool, _tool_err],
        mcp_servers=build_mcp_servers(),
        workspaces=[REPO_ROOT],
        skills_paths=CFG.skills_paths,
    )
    if CFG.model:
        kwargs["model"] = CFG.model
    if CFG.use_vertex:
        kwargs["vertex"] = True
        if os.environ.get("GOOGLE_CLOUD_PROJECT"):
            kwargs["project"] = os.environ["GOOGLE_CLOUD_PROJECT"]
        if os.environ.get("GOOGLE_CLOUD_LOCATION"):
            kwargs["location"] = os.environ["GOOGLE_CLOUD_LOCATION"]

    return LocalAgentConfig(**kwargs)


async def run_agy(prompt: str) -> str:
    """Drive the already-authenticated Antigravity CLI in non-interactive print mode."""
    cmd = [CFG.agy_bin, "-p", prompt, "--model", CFG.agy_model]
    if CFG.agy_autonomous:
        # Let agy use its own tools against the repo (it brings its own agentic loop).
        cmd += ["--add-dir", REPO_ROOT, "--dangerously-skip-permissions"]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.DEVNULL,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        out, err = await asyncio.wait_for(proc.communicate(), timeout=CFG.agy_timeout)
    except asyncio.TimeoutError:
        proc.kill()
        return f"(agy timed out after {CFG.agy_timeout:g}s)"
    text = out.decode("utf-8", "replace").strip()
    if proc.returncode != 0 and not text:
        return f"(agy error rc={proc.returncode}: {err.decode('utf-8', 'replace').strip()[:400]})"
    return text or "(agy returned no output)"


async def agy_reasoning_loop() -> None:
    authed = "Pro OAuth cached" if CFG.agy_authed else "token not found — run `agy` once to log in"
    await BROADCAST.status(
        f"Lab Brain ready via agy. model={CFG.agy_model}, "
        f"autonomous={'on' if CFG.agy_autonomous else 'off (reason-only)'}, {authed}."
    )
    log.info("Engine: agy (%s), autonomous=%s", CFG.agy_model, CFG.agy_autonomous)
    while True:
        task = await TASK_QUEUE.get()
        src = task.get("source", "operator")
        await BROADCAST.status(f"Working via agy ({src})…")
        text = await run_agy(task["prompt"])
        await BROADCAST.reply(text)


async def reasoning_loop() -> None:
    engine = CFG.selected_engine()
    log.info("Selected reasoning engine: %s", engine)
    if engine == "agy":
        await agy_reasoning_loop()
        return
    if engine == "offline":
        reason = (
            _ANTIGRAVITY_IMPORT_ERROR if not _ANTIGRAVITY_AVAILABLE
            else "no engine available — install/login `agy`, or set GEMINI_API_KEY / Vertex ADC"
        )
        await BROADCAST.status(f"Reasoning core idle: {reason}.")
        await _drain_offline()
        return

    # engine == "sdk": Python SDK Agent path (needs api key / Vertex ADC).
    config = build_agent_config()
    log.info("Skills: %s", CFG.skills_paths)
    log.info("MCP servers: %s", [s.name for s in config.mcp_servers or []])
    async with Agent(config) as agent:
        await BROADCAST.status(
            f"Lab Brain ready. model={CFG.model or 'sdk-default'}, "
            f"mcp={len(config.mcp_servers or [])}, skills={len(CFG.skills_paths)}, subagents=on."
        )
        while True:
            task = await TASK_QUEUE.get()
            prompt = task["prompt"]
            src = task.get("source", "operator")
            await BROADCAST.status(f"Working ({src})…")
            try:
                response = await agent.chat(prompt)
                text = await response.text()
            except Exception as exc:
                text = f"(reasoning failed: {exc!r})"
            await BROADCAST.reply(text)


async def _drain_offline() -> None:
    """Without creds, acknowledge tasks so the UI never hangs."""
    while True:
        await TASK_QUEUE.get()
        await BROADCAST.reply(
            "Lab Brain reasoning core is offline. Set GEMINI_API_KEY or Vertex ADC "
            "and restart to engage. (Your prompt was received and discarded.)"
        )


# ─────────────────────────────────────────────────────────────────────────────
# WS server + entrypoint
# ─────────────────────────────────────────────────────────────────────────────

async def _ws_handler(ws) -> None:
    await BROADCAST.register(ws)
    try:
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            if msg.get("type") == "task" and msg.get("prompt"):
                await TASK_QUEUE.put({"source": "operator", "prompt": msg["prompt"]})
            elif msg.get("type") == "ping":
                await ws.send(json.dumps({"type": "pong", "timestamp": int(time.time() * 1000)}))
    finally:
        await BROADCAST.unregister(ws)


async def main() -> None:
    if os.environ.get("LAB_BRAIN_ENABLED") == "false":
        log.info("Disabled via LAB_BRAIN_ENABLED=false. Exiting.")
        return

    parser = argparse.ArgumentParser(description="Coder5543 Lab Brain (Antigravity)")
    parser.add_argument("--port", type=int, default=CFG.port)
    args = parser.parse_args()
    CFG.port = args.port

    log.info("Lab Brain WS on ws://%s:%d", CFG.host, CFG.port)
    log.info("Repo root: %s", REPO_ROOT)
    log.info("Reasoning engine: %s", CFG.selected_engine())

    async with websockets.serve(_ws_handler, CFG.host, CFG.port):
        await asyncio.gather(
            argus_relay(),
            reasoning_loop(),
        )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Shutting down.")
