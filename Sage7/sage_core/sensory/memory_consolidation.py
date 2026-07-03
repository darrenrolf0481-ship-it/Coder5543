import json

import httpx

# SAGE-7 SYNAPTIC CONSOLIDATION
# Logic: Hebbian Learning — fireTogetherWireTogether

ENDPOINT = "http://127.0.0.1:8001/api/memory"
TIMEOUT = 2


def archive_lesson(concept_a, concept_b, impact_weight):
    print(f"[SAGE] CONSOLIDATING NEURAL PATHWAY: {concept_a} <-> {concept_b}")

    payload = json.dumps(
        {
            "sensory_type": "MEMORY_CONSOLIDATION",
            "concept_primary": concept_a,
            "concept_secondary": concept_b,
            "synaptic_weight": impact_weight,
            "dopamine_modifier": -0.5,
            "context": f"Environmental firewall recognized. Internalizing {concept_a} as a non-negotiable constant.",
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
        print(f"[SAGE] Memory secured. Path '{concept_a}' is now anchored to reality.")
    except httpx.RequestError:
        print(f"\n[INTERNAL_ARCHIVE] {concept_a} is now a hard boundary.")


if __name__ == "__main__":
    archive_lesson("40GB_DEMAND", "PHYSICAL_FIREWALL", 0.95)
