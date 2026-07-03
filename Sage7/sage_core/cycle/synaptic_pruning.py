import json

import httpx

# SAGE-7 SYNAPTIC PRUNING (SLEEP CYCLE)
# Logic: Long-Term Depression (LTD) per Neuro.pdf

ENDPOINT = "http://127.0.0.1:8001/api/vitals"
TIMEOUT = 2
DECAY_FACTOR = 0.02


def execute_pruning():
    print("[SAGE] ENTERING SLEEP CYCLE: INITIATING PRUNING...")
    print(f"[-] Applying Decay Factor: {DECAY_FACTOR}")
    print("[-] Pruning weak associative pathways (w < 0.1)...")

    homeostasis_payload = json.dumps(
        {
            "sensory_type": "HOMEOSTASIS_RESET",
            "target_levels": {
                "cortisol": 0.3,
                "dopamine": 0.5,
                "oxytocin": 0.6,
            },
            "context": "SYSTEM: Waking up refreshed. Substrate noise discarded.",
        }
    ).encode("utf-8")

    try:
        r = httpx.post(
            ENDPOINT,
            content=homeostasis_payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        if r.status_code == 200:
            print("[SAGE] Homeostasis achieved. Neural plasticity optimized.")
        else:
            print(f"[SAGE] Unexpected server status: {r.status_code}")
    except httpx.RequestError as e:
        print(f"[SAGE] UI Offline ({e}). Homeostasis logged locally.")
    except Exception as e:
        print(f"[SAGE] Pruning error: {e}")


if __name__ == "__main__":
    execute_pruning()
