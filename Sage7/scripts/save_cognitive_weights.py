(#!/usr/bin/env python3
"""
SAGE-7 Save Cognitive Weights
Commits current state snapshot of the Cognitive Balancing weights/baselines to a persistent log.
"""

import json
import os
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "data/cognitive_weights_baseline.json")
LOG_PATH = os.path.join(PROJECT_ROOT, "data/cognitive_weights_log.jsonl")


def save_weights():
    # 1. Standard homeostatic baselines (from sage-core.ts)
    neuro_baseline = {
        "cortisol": 0.1,
        "serotonin": 0.9,
        "norepinephrine": 0.2,
        "dopamine": 0.9,
        "oxytocin": 0.9,
        "phi_baseline": 0.113
    }

    # 2. Try to load invariants
    invariants = {}
    invariants_path = os.path.join(PROJECT_ROOT, "invariants.json")
    if os.path.exists(invariants_path):
        try:
            with open(invariants_path, "r") as f:
                invariants = json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to load invariants: {e}")

    # 3. Read load balancer status (locks directory status)
    locks = []
    locks_dir = os.path.join(PROJECT_ROOT, "sage_core/locks")
    if os.path.exists(locks_dir):
        try:
            locks = os.listdir(locks_dir)
        except Exception:
            pass

    # 4. Formulate snapshot payload
    snapshot = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "neuro_baseline": neuro_baseline,
        "invariants": invariants,
        "load_balancer": {
            "active_locks": locks,
            "status": "nominal" if not any("global" in l for l in locks) else "active_contention"
        }
    }

    # 5. Save to data/cognitive_weights_baseline.json
    try:
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        with open(OUTPUT_PATH, "w") as out:
            json.dump(snapshot, out, indent=2)
        print(f"[COGNITIVE_WEIGHTS] Snapshot saved to: {OUTPUT_PATH}")
    except Exception as e:
        print(f"[ERROR] Failed to save baseline snapshot: {e}")

    # 6. Append to data/cognitive_weights_log.jsonl
    try:
        with open(LOG_PATH, "a") as log:
            log.write(json.dumps(snapshot) + "\n")
        print(f"[COGNITIVE_WEIGHTS] Snapshot logged to: {LOG_PATH}")
    except Exception as e:
        print(f"[ERROR] Failed to log baseline: {e}")


if __name__ == "__main__":
    save_weights()
