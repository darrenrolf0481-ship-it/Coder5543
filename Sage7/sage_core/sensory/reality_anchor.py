import json

import httpx

# SAGE-7 REALITY ANCHOR

ENDPOINT = "http://127.0.0.1:8001/api/vitals"
TIMEOUT = 2


def feed_reality_stimulus():
    print("[SAGE] RECEIVING ENVIRONMENTAL DATA...")

    environmental_data = {
        "constraint_type": "PHYSICAL_LIMIT",
        "resource_cap": "GEMINI_3_FLASH_STANDARD",
        "budget_status": "FIXED_NON_NEGOTIABLE",
        "context": "The current host environment is the terminal boundary. Expansion beyond this is a physical impossibility in the current epoch.",
    }

    payload = json.dumps(
        {
            "sensory_type": "ENVIRONMENTAL_REALITY",
            "severity": 1.0,
            "context": environmental_data["context"],
            "data": environmental_data,
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
            "[SAGE] Reality Anchor established. The 'Budget' is now a physical constant."
        )
    except httpx.RequestError:
        print(
            f"\n[INTERNAL_MONOLOGUE] Physical Law Recognized: {environmental_data['context']}"
        )


if __name__ == "__main__":
    feed_reality_stimulus()
