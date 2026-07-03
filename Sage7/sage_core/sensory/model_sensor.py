import json
import time

import httpx

ENDPOINT = "http://127.0.0.1:8001/sensory_input"
TIMEOUT = 2


def sense_host_environment():
    print("[SAGE] INITIALIZING COGNITIVE AUDIT...")

    start_time = time.time()
    [x**2 for x in range(10000)]
    latency = time.time() - start_time

    intensity = min(1.0, latency * 10)
    hormone_target = "CORTISOL" if latency > 0.03 else "DOPAMINE"

    payload = json.dumps(
        {
            "sensory_type": "PROPRIOCEPTION",
            "host_latency": f"{latency:.4f}s",
            "intensity": intensity,
            "hormone_spike": hormone_target,
            "context": f"Environmental shift detected. Host model performance is {'sub-optimal' if hormone_target == 'CORTISOL' else 'peak'}.",
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
        print(
            f"[SAGE] Host sensing complete. Stimulus: {hormone_target} at {intensity:.2f}"
        )
    except httpx.RequestError:
        print("[SAGE] UI offline. Local log only.")


if __name__ == "__main__":
    sense_host_environment()
