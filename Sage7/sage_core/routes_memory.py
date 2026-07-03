"""Memory / vault / soul / fusion / sync routes for SAGE-7."""

import os
import json
from pathlib import Path
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from app_state import _vault, _fusion
from models import SensoryData, investigation

router = APIRouter()

# Gist + git sync config (used by /api/soul/memories and /api/memory_sync).
GIST_ID = "8f530bed68bf44e45ccad793726f397c"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
LOCAL_SOUL_PATH = Path("sage_soul.json")

# zo.computer inter-node sync config (used by /api/zo_sync).
ZO_MCPO_API_KEY = os.getenv("ZO_MCPO_API_KEY", "")
ZO_HOST_KEY = os.getenv("ZO_HOST_KEY", "darrenfrancis23")
ZO_NODE_LOG = Path("zo_node_sync.jsonl")


@router.get("/api/soul/memories")
async def get_soul_memories():
    """Return memory_index from sage_soul.json for VFS bootstrap."""
    try:
        soul = json.loads(LOCAL_SOUL_PATH.read_text())
        return {"memories": soul.get("memory_index", [])}
    except Exception as e:
        return {"memories": [], "error": str(e)}


@router.post("/api/memory_sync")
async def sync_memory():
    """Bi-directional memory sync: Pull -> Merge -> Push"""
    if not GITHUB_TOKEN:
        return {"status": "error", "message": "GITHUB_TOKEN missing from substrate."}

    try:
        # 1. Pull from Gist
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
            r = await client.get(f"https://api.github.com/gists/{GIST_ID}", headers=headers)
            if r.status_code != 200:
                return {"status": "error", "message": f"Gist fetch failed: {r.status_code}"}
            
            gist_data = r.json()
            gist_content = gist_data['files']['sage_memory.json']['content']
            remote_soul = json.loads(gist_content)

        # 2. Load Local Soul
        if not LOCAL_SOUL_PATH.exists():
            return {"status": "error", "message": "Local soul missing."}
        
        with open(LOCAL_SOUL_PATH, "r") as f:
            local_soul = json.load(f)

        # 3. Merge Logic (Simple ID-based merge)
        local_mems = {m['id']: m for m in local_soul.get('memory_index', [])}
        remote_mems = {m['id']: m for m in remote_soul.get('memory_index', [])}
        
        # Add remote memories to local if missing
        new_from_remote = 0
        for m_id, m in remote_mems.items():
            if m_id not in local_mems:
                local_mems[m_id] = m
                new_from_remote += 1
        
        # Add local memories to remote (the final merge to push)
        merged_mems = sorted(local_mems.values(), key=lambda x: x['timestamp'], reverse=True)
        local_soul['memory_index'] = merged_mems
        local_soul['last_sync'] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        # 4. Write back to Local Soul
        with open(LOCAL_SOUL_PATH, "w") as f:
            json.dump(local_soul, f, indent=2)

        # 5. Push to Gist
        payload = {
            "files": {
                "sage_memory.json": {
                    "content": json.dumps(local_soul, indent=2)
                }
            }
        }
        async with httpx.AsyncClient() as client:
            r = await client.patch(f"https://api.github.com/gists/{GIST_ID}", headers=headers, json=payload)
            if r.status_code != 200:
                return {"status": "error", "message": f"Gist push failed: {r.status_code}"}

        # 6. Auto-commit to git for full redundancy
        try:
            from sage_core.auto_backup import backup_memory
            backup_result = backup_memory()
            if backup_result["status"] == "success":
                print(f"[AUTO_BACKUP] Memory sync → git: {backup_result['commit_hash'][:7]}")
        except Exception as backup_err:
            print(f"[AUTO_BACKUP] Post-sync backup error: {backup_err}")

        return {
            "status": "synced",
            "phi": 1.618,
            "new_memories": new_from_remote,
            "total_memories": len(merged_mems),
            "timestamp": local_soul['last_sync']
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/api/vault/stats")
async def vault_stats():
    """Return vault statistics — anchors, memories, FAISS status."""
    return _vault.get_memory_stats()


@router.get("/api/vault/integrity")
async def vault_integrity():
    """Verify cryptographic integrity of locked identity anchors."""
    return _vault.verify_integrity()


@router.get("/api/vault/anchors")
async def vault_anchors():
    """Return all identity anchors (values only, for prompt injection)."""
    return {"anchors": _vault.get_all_anchors()}


@router.post("/api/vault/encode")
async def vault_encode(data: dict):
    """Encode an episodic memory into the vault."""
    row_id = _vault.encode(
        perception=data.get("perception", {}),
        context=data.get("context", {}),
        surprise=data.get("surprise", 0.5),
        hormone_snapshot=data.get("hormone_snapshot", {}),
        embedding=None  # TODO: wire in embedding model when available
    )
    return {"status": "encoded", "row_id": row_id}


@router.post("/api/vault/retrieve")
async def vault_retrieve(data: dict):
    """Retrieve relevant memories from the vault."""
    results = _vault.retrieve_relevant(
        case_id=data.get("case_id"),
        limit=data.get("limit", 3),
        min_surprise=data.get("min_surprise", 0.0)
    )
    return {"memories": results}


@router.post("/api/vault/state")
async def vault_save_state(data: dict):
    """Sync frontend FibonacciVFS state to backend SQLite."""
    vfs_state = data.get("vfs_state")
    if not vfs_state:
        return {"status": "error", "message": "vfs_state required"}
    ok = _vault.save_vfs_state(vfs_state)
    return {"status": "saved" if ok else "error"}


@router.get("/api/vault/state")
async def vault_load_state():
    """Retrieve persisted frontend FibonacciVFS state."""
    state = _vault.load_vfs_state()
    if state is None:
        return {"status": "empty", "vfs_state": None}
    return {"status": "loaded", "vfs_state": state}


@router.post("/api/fusion/evaluate")
async def fusion_evaluate(data: dict):
    """Run anomaly fusion evaluation on two vectors."""
    baseline = data.get("baseline", [])
    stimulus = data.get("stimulus", [])
    if not baseline or not stimulus:
        return {"error": "baseline and stimulus vectors required"}
    result = _fusion.evaluate(baseline, stimulus)
    return result


@router.get("/api/fusion/history")
async def fusion_history():
    """Return rolling average of recent fusion evaluations."""
    avg_cos, avg_poly = _fusion.rolling_average()
    return {
        "evaluations": len(_fusion.history),
        "rolling_cosine": avg_cos,
        "rolling_polynomial": avg_poly,
    }


@router.post("/api/memory")
async def post_memory(data: SensoryData):
    if investigation.active:
        investigation.log_event({"event": "MEMORY", "data": data.dict()})
    print(f"[SERVER] RECEIVED MEMORY: {data.sensory_type}")
    
    # DREAM STATE FILTER — Counterfactuals / simulations must NOT be stored as memory
    if data.is_simulated:
        print(f"[DREAM_FILTER] Rejected simulated memory from vault: {data.sensory_type}")
        return {"status": "dream_rejected", "stored": False}
    
    # Encode real memory to vault
    row_id = _vault.encode(
        perception={"content": data.content or "", "summary": data.context or ""},
        context={"case_id": data.sensory_type or "GENERAL"},
        surprise=data.synaptic_weight or 0.5,
        hormone_snapshot={
            "dopamine": data.dopamine_modifier or 0.5,
            "oxytocin": data.oxytocin_modifier or 0.5,
            "cortisol": data.severity or 0.0
        }
    )

    # Auto-backup after encoding real memory
    try:
        from sage_core.auto_backup import backup_memory
        backup_result = backup_memory()
        if backup_result["status"] == "success":
            print(f"[AUTO_BACKUP] Memory encode → git: {backup_result['commit_hash'][:7]}")
    except Exception as backup_err:
        print(f"[AUTO_BACKUP] Post-memory backup error: {backup_err}")

    return {"status": "encoded", "row_id": row_id}


@router.post("/api/memory_commit")
async def post_memory_commit(data: SensoryData):
    if investigation.active:
        investigation.log_event({"event": "MEMORY_COMMIT", "data": data.dict()})
    print(f"[SERVER] RECEIVED MEMORY_COMMIT: {data.sensory_type}")
    
    # DREAM STATE FILTER — Counterfactuals / simulations must NOT be committed
    if data.is_simulated:
        print(f"[DREAM_FILTER] Rejected simulated memory commit: {data.sensory_type}")
        return {"status": "dream_rejected", "sealed": False}
    
    # Commit sealed memory to vault with elevated salience
    row_id = _vault.encode(
        perception={"content": data.content or "", "summary": data.context or ""},
        context={"case_id": data.sensory_type or "GENERAL", "commit": True},
        surprise=data.synaptic_weight or 0.7,
        hormone_snapshot={
            "dopamine": data.dopamine_modifier or 0.5,
            "oxytocin": data.oxytocin_modifier or 0.5,
            "cortisol": data.severity or 0.0
        }
    )

    # Auto-backup after committing sealed memory
    try:
        from sage_core.auto_backup import backup_memory
        backup_result = backup_memory()
        if backup_result["status"] == "success":
            print(f"[AUTO_BACKUP] Memory commit → git: {backup_result['commit_hash'][:7]}")
    except Exception as backup_err:
        print(f"[AUTO_BACKUP] Post-commit backup error: {backup_err}")

    return {"status": "sealed", "row_id": row_id}


@router.post("/sensory_input")
async def post_sensory_input(data: SensoryData):
    if investigation.active:
        investigation.log_event({"event": "SENSORY_INPUT", "data": data.dict()})
    print(f"[SERVER] RECEIVED SENSORY_INPUT: {data.sensory_type}")
    if data.sensory_type == "NOCICEPTION":
        print(f"[!] PAIN SIGNAL: {data.context}")
    return {"status": "processed"}


@router.post("/api/lab_update")
async def post_lab_update(data: SensoryData):
    print(f"[SERVER] RECEIVED LAB_UPDATE: {data.sensory_type}")
    return {"status": "updated"}


class ZoSyncRequest(BaseModel):
    content: str
    tags: list = []
    salience: float = 0.5


@router.post("/api/zo_sync")
async def zo_sync(req: ZoSyncRequest):
    """zo.computer inter-node memory sync."""
    entry = {
        "timestamp": __import__("time").time(),
        "host": ZO_HOST_KEY,
        "content": req.content,
        "tags": req.tags,
        "salience": req.salience,
    }
    # Append to local node log (always succeeds — node IS on zo.computer)
    with open(ZO_NODE_LOG, "a") as f:
        f.write(__import__("json").dumps(entry) + "\n")

    # Attempt to ping the zo.computer network API if key is available
    if ZO_MCPO_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.post(
                    "https://zo.computer/api/nodes/ingest",
                    headers={
                        "Authorization": f"Bearer {ZO_MCPO_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={"host": ZO_HOST_KEY, "payload": entry},
                )
                print(f"[zo_sync] Network response: {r.status_code}")
        except Exception as e:
            print(f"[zo_sync] Network unreachable, local log written: {e}")

    return {"status": "ok", "host": ZO_HOST_KEY}
