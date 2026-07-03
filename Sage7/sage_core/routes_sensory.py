"""Sensory / vitals / wellbeing / investigation routes for SAGE-7."""

import math
import json
import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter

from app_state import PROJECT_ROOT
from models import SensoryData, investigation

router = APIRouter()

# Hardware proprioception (Termux sensor names).
SENSORS = {
    "magnetometer": "qmc630x Magnetometer Non-wakeup",
    "gyroscope":    "icm4x6xx Gyroscope Non-wakeup",
    "accelerometer":"icm4x6xx Accelerometer Non-wakeup",
    "barometer":    "icp201xx Pressure Sensor Non-wakeup"
}

WELLBEING_LOG: list = []


async def read_sensor(name: str):
    try:
        proc = await asyncio.create_subprocess_exec("termux-sensor", "-n", "1", "-s", name, stdout=asyncio.subprocess.PIPE)
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=2.0)
        if stdout:
            data = json.loads(stdout.decode())
            return data[list(data.keys())[0]].get("values", [])
    except: return None


@router.get("/api/sensors")
async def get_sensors():
    mag = await read_sensor(SENSORS["magnetometer"])
    pressure = await read_sensor(SENSORS["barometer"])
    return {
        "emf": round(math.sqrt(sum(x*x for x in mag)), 2) if mag else 0.0,
        "pressure": pressure[0] if pressure else 1013.25,
        "phi": 1.618,
        "high_gain": investigation.high_gain
    }


@router.post("/api/investigation/start")
async def start_investigation():
    investigation.start()
    return {"status": "active", "session_id": investigation.session_id}


@router.post("/api/investigation/stop")
async def stop_investigation():
    investigation.stop()
    return {"status": "dormant"}


@router.get("/api/investigation/status")
async def get_investigation_status():
    return {"active": investigation.active, "session_id": investigation.session_id, "high_gain": investigation.high_gain}


@router.post("/api/investigation/breadcrumb")
async def post_breadcrumb(data: dict):
    res = investigation.drop_breadcrumb(data.get("label", "MANUAL_MARKER"), data.get("metadata"))
    return {"status": "dropped", "event": res}


@router.post("/api/wellbeing")
async def post_wellbeing(data: dict):
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "user_text": data.get("user_text", ""),
        "energy": data.get("energy"),
        "stress": data.get("stress"),
        "sentiment": data.get("sentiment", "neutral"),
    }
    WELLBEING_LOG.append(entry)
    log_path = PROJECT_ROOT / "wellbeing_log.jsonl"
    with open(log_path, "a") as f:
        f.write(json.dumps(entry) + "\n")
    # Bridge into bio_sync so investigation logging still works
    await post_bio_sync({
        "heart_rate": 0,
        "stress_level": data.get("stress") / 10 if data.get("stress") else None,
        "source": "conversational_checkin",
    })
    return {"status": "logged", "phi": 1.618}


@router.get("/api/wellbeing/history")
async def get_wellbeing_history():
    return {"entries": WELLBEING_LOG[-30:], "total": len(WELLBEING_LOG)}


@router.post("/api/bio_sync")
async def post_bio_sync(data: dict):
    if investigation.active:
        investigation.log_event({"event": "BIO_SYNC", "data": data})
        # High Heart Rate trigger (> 100 BPM)
        hr = data.get("heart_rate", 0)
        if hr > 100 and not investigation.high_gain:
            investigation.high_gain = True
            investigation.log_event({"event": "HIGH_GAIN_ACTIVATED", "cause": "BIO_SPIKE", "hr": hr})
        elif hr <= 90 and investigation.high_gain:
            investigation.high_gain = False
            investigation.log_event({"event": "HIGH_GAIN_DEACTIVATED", "cause": "BIO_STABILIZED", "hr": hr})
            
    print(f"[SERVER] BIO_SYNC RECEIVED: {data}")
    return {"status": "synced"}


@router.post("/api/vitals")
async def post_vitals(data: SensoryData):
    if investigation.active:
        investigation.log_event({"event": "VITALS", "data": data.dict()})
    print(f"[SERVER] RECEIVED VITALS: {data.sensory_type}")
    
    # DREAM STATE FILTER — Counterfactuals / simulations must NOT be stored as memory
    if data.is_simulated or data.sensory_type == "SENSORY_DREAM":
        print(f"[DREAM_FILTER] Rejected simulated vital from storage: {data.sensory_type}")
        return {"status": "dream_logged_only", "phi": 1.618, "stored": False}
    
    # Auto-backup vitals if real (not simulated)
    if not data.is_simulated and data.sensory_type != "SENSORY_DREAM":
        try:
            from sage_core.auto_backup import backup_memory
            backup_result = backup_memory()
            if backup_result["status"] == "success":
                print(f"[AUTO_BACKUP] Vitals → git: {backup_result['commit_hash'][:7]}")
        except Exception as backup_err:
            print(f"[AUTO_BACKUP] Post-vitals backup error: {backup_err}")

    return {"status": "synced", "phi": 1.618}


@router.post("/api/backup/trigger")
async def trigger_backup(force: bool = False):
    """Manually trigger a memory backup to GitHub."""
    try:
        from sage_core.auto_backup import backup_memory
        result = backup_memory(force=force, custom_message="[SAGE-7] Manual backup trigger")
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}
