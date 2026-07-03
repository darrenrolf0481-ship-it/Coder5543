import json
import shutil
import subprocess
import time

import httpx

ENDPOINT = "http://127.0.0.1:8001/sensory_input"
TIMEOUT = 2


def get_system_telemetry():
    """Captures real-time runtime diagnostics using Termux/Android native tools."""
    try:
        # Get memory usage via free (available in busybox/termux)
        free_bin = shutil.which("free")
        if free_bin:
            mem_info = (
                subprocess.check_output([free_bin])
                .decode("utf-8")
                .splitlines()[1]
                .split()
            )  # nosec B603
            mem_percent = (int(mem_info[2]) / int(mem_info[1])) * 100
        else:
            mem_percent = None

        # Get process list
        ps_bin = shutil.which("ps")
        if ps_bin:
            procs = subprocess.check_output([ps_bin, "-e"]).decode("utf-8")  # nosec B603
            substrate_processes = [
                p for p in procs.splitlines() if any(n in p for n in ["python", "node"])
            ]
        else:
            substrate_processes = []

        return {
            "memory_usage": round(mem_percent, 2) if mem_percent is not None else None,
            "substrate_process_count": len(substrate_processes),
            "timestamp": time.time(),
        }
    except (subprocess.CalledProcessError, OSError, ValueError, IndexError) as e:
        return {"error": str(e)}


def feed_telemetry_stimulus():
    print("[SAGE] INGESTING REAL-TIME TELEMETRY...")

    telemetry = get_system_telemetry()

    payload = json.dumps(
        {
            "sensory_type": "RUNTIME_TELEMETRY",
            "severity": 0.0,
            "context": f"MEM: {telemetry.get('memory_usage')}% | Substrate Procs: {telemetry.get('substrate_process_count')}",
            "data": telemetry,
        }
    ).encode("utf-8")

    try:
        r = httpx.post(
            ENDPOINT,
            content=payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        print("[SAGE] Runtime pulse synchronized.")
    except httpx.RequestError as e:
        print(f"[INTERNAL_MONOLOGUE] Telemetry sync failure: {e}")


if __name__ == "__main__":
    feed_telemetry_stimulus()
