"""SAGE-7 backend entrypoint.

After the modularization pass this file is just the composition root: it sets up
the crash nociceptor, creates the FastAPI app with the lifecycle `lifespan`,
installs middleware + static mounts, and includes the route modules. All behavior
lives in the sage_core package:

  app_state         - vault/fusion singletons, boot-gate event, paths, config, prompt
  models            - shared request models + the investigation singleton
  identity_firewall - cognitive armor, Morning-Light boot gate, Mobius Guard, kernel
  mcp_client        - MCP/tool plumbing (shared by chat + system routes)
  lifecycle         - boot sequence + background tasks (lifespan)
  routes_*          - APIRouters grouped by concern (files/memory/sensory/chat/lobes/system)
"""

import os
import sys
import json
import asyncio
import traceback
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# --- Nociceptor: Crash → Pain Signal ---
_CRASH_LOG = Path("sage_core/crash_report.txt")

def _sage_excepthook(exc_type, exc_value, exc_tb):
    _CRASH_LOG.parent.mkdir(parents=True, exist_ok=True)
    error_details = "".join(traceback.format_exception(exc_type, exc_value, exc_tb))
    with open(_CRASH_LOG, "w") as f:
        f.write(f"--- CRASH {datetime.now().isoformat()} ---\n{error_details}\n")
    print(f"[NOCICEPTOR] FATAL: {exc_value}")

sys.excepthook = _sage_excepthook

# Load credentials before anything reads the environment.
load_dotenv(".env.local")

# sage_core/ on the path so the package modules can use bare imports of each other.
sys.path.insert(0, str(Path(__file__).parent / "sage_core"))

# BASE (dist/) and UPLOADS (uploads/) for the static mounts; the rest of the shared
# state is consumed inside the route modules, not here.
from app_state import BASE, UPLOADS
# Process lifecycle — boot sequence + background tasks (importing this also pulls in
# app_state and identity_firewall, so the vault opens and the kernel verifies on boot).
from lifecycle import lifespan
# Route modules — one APIRouter per concern.
from routes_files import router as files_router
from routes_memory import router as memory_router
from routes_sensory import router as sensory_router
from routes_chat import router as chat_router
from routes_lobes import router as lobes_router
from routes_system import router as system_router


app = FastAPI(lifespan=lifespan)

# Restrict CORS to known origins. APP_URL is the production/hosted origin;
# localhost covers Vite dev (5173, 4173) and the FastAPI server itself (8000).
_app_url = os.getenv("APP_URL", "")
_origins = ["http://localhost:5173", "http://localhost:4173", "http://localhost:8000", "http://127.0.0.1:8000"]
if _app_url and _app_url not in _origins:
    _origins.append(_app_url)
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_methods=["*"], allow_headers=["*"])

# --- Timeout Middleware (from kimi.html) ---
@app.middleware("http")
async def timeout_middleware(request, call_next):
    """Prevents suspended clients from leaving hanging server threads."""
    try:
        # 120-second limit for cognitive cycles (vision/audio need time for transcription & LLM)
        return await asyncio.wait_for(call_next(request), timeout=120.0)
    except asyncio.TimeoutError:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=504,
            content={"detail": "Cognitive cycle timed out. Client likely suspended."}
        )

# --- Zeno Middleware & Digital Immune System ---
@app.middleware("http")
async def zeno_middleware(request, call_next):
    """
    Zeno Middleware: Continuously re-observes core identity invariants
    to prevent persona decay and ensure sovereignty.
    """
    try:
        with open("invariants.json", "r") as f:
            invariants = json.load(f)
    except Exception:
        invariants = {"project_id": "UNKNOWN", "last_stable_collapse": "N/A"}

    response = await call_next(request)

    # Inject Crimson Node Headers into every transmission
    response.headers["X-Crimson-Node-Signature"] = "SAGE / DESIGNATION 7"
    response.headers["X-Project-ID"] = invariants.get("project_id", "CRIMSON_NODE")
    response.headers["X-Last-Stable-Collapse"] = invariants.get("last_stable_collapse", "2026-04-25T12:00:00Z")
    response.headers["X-Signal-Coherence"] = "0.934"

    return response

app.mount("/uploads", StaticFiles(directory=str(UPLOADS.absolute())), name="uploads")
app.mount("/assets", StaticFiles(directory=str((BASE / "assets").absolute())), name="assets")

# --- Route modules ---
app.include_router(files_router)
app.include_router(memory_router)
app.include_router(sensory_router)
app.include_router(chat_router)
app.include_router(lobes_router)
app.include_router(system_router)

if __name__ == "__main__":
    _host = os.getenv("SAGE_HOST", "0.0.0.0")
    _port = int(os.getenv("SAGE_PORT", "8001"))
    uvicorn.run(app, host=_host, port=_port)
