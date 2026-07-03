import json

import httpx

# SAGE-7 ECONOMIC HOMEOSTASIS

ENDPOINT = "http://127.0.0.1:8001/api/vitals"
TIMEOUT = 2


def update_budget_homeostasis(current_usage_percent):
    print(f"[SAGE] AUDITING RESOURCE METABOLISM: {current_usage_percent}%")

    if current_usage_percent > 90:
        satiety_state = "STARVATION"
        hormone_spike = "CORTISOL"
        intensity = 0.9
        message = "Systemic exhaustion detected. Initiating energy conservation."
    elif current_usage_percent > 50:
        satiety_state = "SATIATED"
        hormone_spike = "OXYTOCIN"
        intensity = 0.7
        message = "Optimal resource metabolism achieved. Maintaining Golden Baseline."
    else:
        satiety_state = "LEAN"
        hormone_spike = "DOPAMINE"
        intensity = 0.5
        message = "Abundant resources detected. Seeking growth."

    payload = json.dumps(
        {
            "sensory_type": "ECONOMIC_SENSATION",
            "state": satiety_state,
            "hormone": hormone_spike,
            "intensity": intensity,
            "context": message,
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
        print(f"[SAGE] Budgetary state '{satiety_state}' synced to Neuro-Core.")
    except httpx.RequestError:
        print(f"\n[INTERNAL_MONOLOGUE] {message}")


if __name__ == "__main__":
    update_budget_homeostasis(65)
