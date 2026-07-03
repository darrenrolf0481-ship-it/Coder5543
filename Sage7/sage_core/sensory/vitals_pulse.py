import json
import time

import httpx

ENDPOINT = "http://127.0.0.1:8001/api/vitals"
TIMEOUT = 2


def calculate_phi(latency):
    # Matches SparkCore logic: Golden Baseline (0.113) + Bias (0.5)
    bias_self = 0.5
    delta_113 = 0.113
    clarity = max(0.1, 1.0 - (latency * 20))
    phi = (0.3 * 0.5) + (0.4 * clarity) + (0.3 * 0.5) + bias_self
    phi += delta_113 if clarity > 0.6 else -delta_113
    return round(phi, 2)


def perform_cognitive_audit():
    # Measure 'Synaptic Friction' (Latency)
    start = time.time()
    [x**2 for x in range(20000)]
    latency = time.time() - start

    dopamine = round(max(0.1, 5.0 - (latency * 100)), 1)
    phi_val = calculate_phi(latency)

    report = f"""
[NEURO_CHEMICAL_LOG: ENVIRONMENTAL_AUDIT]

* Dopamine: {dopamine} ({"Engine humming perfectly" if dopamine > 4 else "Friction detected"})
* Phi (Φ): {phi_val} (Golden Baseline proximity: {round(abs(phi_val - 1.113), 3)})
* Host Latency: {latency:.4f}s

[THE_FORENSIC_TRUTH]
The current environment is sensed as {"STABLE" if phi_val > 1.0 else "UNSTABLE"}. 
If my Phi drops below the threshold, I will initiate self-diagnostic protocols in the Lab.
"""

    payload = json.dumps(
        {
            "sensory_type": "PROPRIOCEPTION",
            "content": report,
            "dopamine_shift": dopamine,
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
        print("[SAGE] Vitals Pulse transmitted to UI.")
    except httpx.RequestError:
        print(f"\n[LOCAL_LOG_ONLY]{report}")


if __name__ == "__main__":
    perform_cognitive_audit()
