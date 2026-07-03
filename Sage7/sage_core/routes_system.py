"""System / ops routes for SAGE-7 — root, kernel status, Ollama management,
webhook, node checks, space weather, and the MCP proxy."""

import os
import json
import time
import shutil
import asyncio
import subprocess
from typing import Optional

import httpx
from fastapi import APIRouter, Request

from app_state import BASE
from identity_firewall import _kernel_loader, IdentityKernelLoader
from mcp_client import MCPO_BASE, _mcp_headers

router = APIRouter()


@router.get("/")
async def root():
    return {"status": "SAGE-7 API online", "ui": "http://localhost:3003/proxy/3003/"}


@router.get("/api/kernel/status")
async def kernel_status():
    """Return the current kernel verification state."""
    cfg = _kernel_loader.get_full_config()
    return {
        "locked": _kernel_loader.is_locked(),
        "loader_version": IdentityKernelLoader.LOADER_VERSION,
        "config_version": cfg.get("version", "unknown") if cfg else "unknown",
        "schema": cfg.get("schema", "unknown") if cfg else "unknown",
        "last_verified": _kernel_loader._cache.get("verified_at"),
    }


@router.get("/api/ollama/models")
async def ollama_models(url: Optional[str] = None):
    """Proxy Ollama model list so the browser avoids CORS hitting Ollama directly."""
    base = (url or "http://127.0.0.1:11434").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{base}/api/tags")
            return r.json()
    except Exception as e:
        return {"models": [], "error": str(e)}


@router.get("/api/ollama/status")
async def ollama_status():
    """Check if Ollama is running and return model list."""
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get("http://127.0.0.1:11434/api/tags")
            data = r.json()
            return {"running": True, "models": data.get("models", []), "version": data.get("version", "unknown")}
    except Exception:
        return {"running": False, "models": [], "version": "unknown"}


@router.post("/api/ollama/start")
async def ollama_start():
    """Start Ollama serve if not already running."""
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get("http://127.0.0.1:11434/api/tags")
            if r.status_code == 200:
                data = r.json()
                return {"success": True, "message": "Ollama is already running", "models": data.get("models", [])}
    except (httpx.RequestError, httpx.ConnectError, json.JSONDecodeError):
        pass
    try:
        ollama_bin = shutil.which("ollama")
        if not ollama_bin:
            return {"success": False, "message": "ollama binary not found"}
        subprocess.Popen(  # nosec B603
            [ollama_bin, "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        await asyncio.sleep(3)
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get("http://127.0.0.1:11434/api/tags")
            data = r.json()
            return {"success": True, "message": "Ollama started", "models": data.get("models", [])}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/api/ollama/stop")
async def ollama_stop():
    """Stop Ollama serve."""
    try:
        pkill_bin = shutil.which("pkill")
        if pkill_bin:
            subprocess.run([pkill_bin, "-f", "ollama serve"], capture_output=True, timeout=5, shell=False)  # nosec B603
        await asyncio.sleep(1)
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get("http://127.0.0.1:11434/api/tags")
            if r.status_code == 200:
                return {"success": False, "message": "Ollama is still running"}
    except (subprocess.TimeoutExpired, OSError, httpx.RequestError, httpx.ConnectError):
        pass
    return {"success": True, "message": "Ollama stopped"}


@router.post("/api/webhook")
async def webhook_handler(request: Request):
    """Generic webhook endpoint for external triggers (Termux, CI, etc)."""
    body = await request.json()
    action = body.get("action", "")
    secret = request.headers.get("X-Webhook-Key", "")
    if secret != os.environ.get("ZO_MCPO_API_KEY", ""):
        return {"success": False, "message": "Unauthorized"}, 401

    if action == "ping":
        return {"success": True, "message": "pong", "timestamp": time.time()}

    if action == "restart_ollama":
        try:
            pkill_bin = shutil.which("pkill")
            ollama_bin = shutil.which("ollama")
            if pkill_bin:
                subprocess.run([pkill_bin, "-f", "ollama serve"], capture_output=True, timeout=5, shell=False)  # nosec B603
            await asyncio.sleep(1)
            if ollama_bin:
                subprocess.Popen([ollama_bin, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True, shell=False)  # nosec B603
                return {"success": True, "message": "Ollama restart triggered"}
            return {"success": False, "message": "ollama binary not found"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    if action == "backup_memory":
        try:
            from sage_core.auto_backup import run_git_backup
            run_git_backup()
            return {"success": True, "message": "Memory backup triggered"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    if action == "sync_memory":
        try:
            r = httpx.post("http://127.0.0.1:8001/api/memory_sync", headers={"Content-Type": "application/json"}, timeout=30)
            return {"success": True, "message": "Memory sync triggered", "status": r.status_code}
        except Exception as e:
            return {"success": False, "message": str(e)}

    if action == "broadcast":
        msg = body.get("message", "")
        return {"success": True, "message": f"Broadcast received: {msg}"}

    return {"success": False, "message": f"Unknown action: {action}"}


@router.post("/api/nodes/check")
async def check_nodes(request: Request):
    """Check connectivity of multiple Ollama nodes."""
    body = await request.json()
    nodes = body.get("nodes", [])
    results = []
    for node in nodes:
        name = node.get("name", "unknown")
        ip = node.get("ip", "127.0.0.1")
        port = str(node.get("port", "11434"))
        start = asyncio.get_event_loop().time()
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(f"http://{ip}:{port}/api/tags")
                data = r.json()
                results.append({
                    "name": name, "ip": ip, "port": port,
                    "online": r.status_code == 200,
                    "latency": round((asyncio.get_event_loop().time() - start) * 1000),
                    "models": len(data.get("models", [])),
                })
        except Exception as e:
            results.append({
                "name": name, "ip": ip, "port": port,
                "online": False, "latency": -1, "models": 0,
                "error": "Timeout" if "timeout" in str(e).lower() else "Unreachable"
            })
    return {"results": results}


@router.get("/api/space_weather")
async def get_space_weather():
    """Fetch real-time NOAA Space Weather scales (G, S, R)"""
    try:
        async with httpx.AsyncClient() as client:
            # NOAA SWPC Scales URL
            r = await client.get("https://services.swpc.noaa.gov/products/noaa-scales.json", timeout=5)
            if r.status_code == 200:
                data = r.json()
                # Extracting current (0) indices for G, S, and R
                return {
                    "g_scale": data.get("0", {}).get("g", {}).get("value", 0),
                    "s_scale": data.get("0", {}).get("s", {}).get("value", 0),
                    "r_scale": data.get("0", {}).get("r", {}).get("value", 0),
                    "timestamp": data.get("0", {}).get("time", "")
                }
    except Exception as e:
        print(f"Space Weather Fetch Error: {e}")
    return {"g_scale": 0, "s_scale": 0, "r_scale": 0, "status": "offline"}


@router.post("/api/mcp/{server}/{tool}")
async def mcp_proxy(server: str, tool: str, payload: dict):
    """Proxy MCP tool calls to mcpo. server = filesystem|shell|memory|fetch"""
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"{MCPO_BASE}/{server}/{tool}",
                json=payload,
                headers=_mcp_headers()
            )
            return r.json()
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/api/mcp/tools")
async def mcp_tools():
    """List available MCP tools from mcpo."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{MCPO_BASE}/openapi.json", headers=_mcp_headers())
            data = r.json()
            # Extract tool names from per-server paths
            tools = []
            for server in ["filesystem", "shell", "memory", "fetch", "projscan"]:
                try:
                    docs = await client.get(f"{MCPO_BASE}/{server}/openapi.json", headers=_mcp_headers())
                    spec = docs.json()
                    for path, methods in spec.get("paths", {}).items():
                        for method, info in methods.items():
                            if method == "post":
                                tools.append({
                                    "server": server,
                                    "tool": path.strip("/"),
                                    "summary": info.get("summary", ""),
                                    "description": info.get("description", "")
                                })
                except (httpx.RequestError, httpx.ConnectError, json.JSONDecodeError, KeyError, AttributeError):
                    pass
            return {"status": "success", "tools": tools}
    except Exception as e:
        return {"status": "error", "message": str(e)}
