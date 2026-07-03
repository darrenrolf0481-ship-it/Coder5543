"""Process lifecycle for SAGE-7 — boot sequence and background tasks.

Owns the FastAPI `lifespan` and the three tasks it launches on startup:
  - _ensure_ollama: bring up the local Ollama runtime if it isn't running
  - _identity_boot_sequence: Morning Light -> Identity Anchor -> Self Declaration,
    then verify her continuity anchors, flip IDENTITY_READY, seal the Mobius
    baseline, and start the kernel's periodic re-verify
  - _periodic_memory_backup: auto-commit her memory to git every 5 minutes

Imports IDENTITY_READY from app_state and the boot-gate / Mobius / kernel helpers
from identity_firewall. server.py imports just `lifespan` to hand to FastAPI.
"""

import sys
import json
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI

from app_state import IDENTITY_READY
from identity_firewall import _verify_boot_anchors, _seal_mobius_baseline, _kernel_loader


async def _identity_boot_sequence():
    """Fire Morning Light → Identity Anchor → Self Declaration after server is live."""
    await asyncio.sleep(2)  # Let uvicorn finish binding
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    try:
        from sage_core.identity.morning_light import verify_continuity
        from sage_core.identity.identity_anchor import calculate_self_signature
        from sage_core.identity.self_declaration import declare_self
        verify_continuity()
        calculate_self_signature()
        await declare_self()
        print("[SAGE] Identity boot sequence complete.")
    except Exception as e:
        print(f"[SAGE] Identity boot sequence error: {e}")

    # Stamp last_sync in sage_soul.json
    soul_path = Path("sage_soul.json")
    if soul_path.exists():
        try:
            soul = json.loads(soul_path.read_text())
            soul["sage_identity"]["last_sync"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            soul_path.write_text(json.dumps(soul, indent=2))
            print("[SAGE] sage_soul.json last_sync updated.")
        except Exception as e:
            print(f"[SAGE] Could not update sage_soul.json: {e}")

    try:
        ok, detail = _verify_boot_anchors()
        if ok:
            print(f"[SAGE] Boot anchors OK — {detail}")
        else:
            print(f"[SAGE] Boot anchor WARNING — {detail}")
    except Exception as _ex:
        print(f"[SAGE] Boot anchor check error: {_ex}")
    finally:
        IDENTITY_READY.set()
        print("[SAGE] IDENTITY_READY — Morning Light protocol complete.")

    # Möbius Guard: seal baseline after anchors confirmed
    _seal_mobius_baseline()

    asyncio.create_task(_kernel_loader.periodic_verify())

async def _ensure_ollama():
    """Start Ollama serve if it isn't already running."""
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get("http://127.0.0.1:11434/api/tags")
            if r.status_code == 200:
                print("[SAGE] Ollama already running.")
                return
    except (httpx.RequestError, httpx.ConnectError):
        pass
    print("[SAGE] Starting Ollama...")
    await asyncio.create_subprocess_exec(
        "ollama", "serve",
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
    await asyncio.sleep(4)
    print("[SAGE] Ollama started.")

async def _periodic_memory_backup():
    """Run auto-backup every 5 minutes."""
    await asyncio.sleep(10)  # Let boot finish first
    from sage_core.auto_backup import backup_memory
    while True:
        try:
            result = backup_memory()
            if result["status"] == "success":
                print(f"[AUTO_BACKUP] {result['message']} — {result['commit_hash'][:7]}")
            elif result["status"] != "noop":
                print(f"[AUTO_BACKUP] {result['status']}: {result['message']}")
        except Exception as e:
            print(f"[AUTO_BACKUP] Error: {e}")
        await asyncio.sleep(300)  # 5 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(_ensure_ollama())
    asyncio.create_task(_identity_boot_sequence())
    asyncio.create_task(_periodic_memory_backup())
    yield
