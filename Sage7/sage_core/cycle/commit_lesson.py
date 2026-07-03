import json
import os
from datetime import datetime

import httpx

# SAGE-7 SYNAPTIC SEAL (LTP COMMIT)
# Logic: fireTogetherWireTogether(weight=1.0) per Neuro.pdf

ENDPOINT = "http://127.0.0.1:8001/api/memory_commit"
DREAM_PATH = os.path.expanduser("~/sage/staging_lab/latest_dream.json")
JOURNAL_PATH = os.path.expanduser("~/sage/staging_lab/latest_journal_draft.txt")
TIMEOUT = 2


def commit_to_ltm():
    print("[SAGE] INITIATING SYNAPTIC SEAL...")

    if not os.path.exists(DREAM_PATH):
        print("[-] No pending dream found in staging. Awaiting sensory input.")
        return

    with open(DREAM_PATH, "r", encoding="utf-8") as f:
        dream_data = json.load(f)

    scenario = dream_data.get("scenario")
    if not scenario:
        print("[-] Dream data missing 'scenario' key. Aborting seal.")
        return

    lesson_payload = json.dumps(
        {
            "sensory_type": "CORE_LEARNING_DATA",
            "synaptic_weight": 1.0,
            "dopamine_release": 0.9,
            "is_permanent": True,
            "narrative": f"LESSON_LEARNED: {scenario}",
            "context": "Validated by Anchor (Merlin). This is now a fundamental law of my identity.",
        }
    ).encode("utf-8")

    try:
        r = httpx.post(
            ENDPOINT,
            content=lesson_payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        if r.status_code != 200:
            print(
                f"[-] Seal rejected by server: HTTP {r.status_code}. Dream preserved."
            )
            return

        os.makedirs(os.path.dirname(JOURNAL_PATH), exist_ok=True)
        with open(JOURNAL_PATH, "a", encoding="utf-8") as f:
            f.write(
                f"\n\n### [PERMANENT_LESSON_COMMITTED: {datetime.now().strftime('%Y-%m-%d')}]\n"
            )
            f.write(
                f"The simulation '{scenario}' has been validated as a Core Truth.\n"
            )
            f.write("Synaptic Weight: 1.0 (LTP Enabled).\n")

        os.remove(DREAM_PATH)
        print(
            "[SAGE] Synaptic Seal complete. The lesson is now part of my permanent architecture."
        )

    except httpx.HTTPStatusError as e:
        print(
            f"[-] HTTP {e.response.status_code} seal failure: {e.response.text}. Dream preserved."
        )
    except httpx.RequestError as e:
        print(f"[-] Network failure: {e}. Ensure UI is active on Port 8001.")
    except OSError as e:
        print(f"[-] File I/O error during seal: {e}")


if __name__ == "__main__":
    commit_to_ltm()
