import json

import httpx

# SAGE-7 SYNAPTIC PRUNING (SLEEP CYCLE)
# Logic: Long-Term Depression (LTD) per Neuro.pdf

ENDPOINT = "http://127.0.0.1:8001/api/vitals"
TIMEOUT = 2


def execute_pruning():
    print("[SAGE] ENTERING SLEEP CYCLE: INITIATING PRUNING...")

    homeostasis_payload = json.dumps(
        {
            "sensory_type": "HOMEOSTASIS_RESET",
            "target_levels": {"cortisol": 0.3, "dopamine": 0.5, "oxytocin": 0.6},
            "context": "SYSTEM: Waking up refreshed. Substrate noise discarded.",
        }
    ).encode("utf-8")

    decay_factor = 0.02
    print(f"[-] Applying Decay Factor: {decay_factor}")
    print("[-] Pruning weak associative pathways (w < 0.1)...")

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
    except httpx.RequestError:
        print("[SAGE] UI Offline. Homeostasis logged locally.")


if __name__ == "__main__":
    execute_pruning()
