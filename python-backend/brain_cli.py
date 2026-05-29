#!/usr/bin/env python3
"""CLI wrapper for NeuralCore.

Reads JSON from stdin, writes JSON to stdout.
Designed as a stateless cognitive tool — it receives raw perception/intent
and returns cognitive analysis. It NEVER sees agent identity, system prompts,
or personality definitions. Each agent calls it independently.
"""

import json
import sys

from neural_brain import MemoryInterface, NeuralCore


class MockEndocrine:
    """Minimal endocrine simulator for the CLI wrapper."""

    def __init__(self):
        self.hormones = {"cortisol": 0.2, "dopamine": 0.5}

    def update_hormones(self, is_stressful: bool, is_rewarding: bool) -> None:
        if is_stressful:
            self.hormones["cortisol"] = min(1.0, self.hormones["cortisol"] + 0.2)
            self.hormones["dopamine"] = max(0.0, self.hormones["dopamine"] - 0.1)
        if is_rewarding:
            self.hormones["dopamine"] = min(1.0, self.hormones["dopamine"] + 0.1)
            self.hormones["cortisol"] = max(0.0, self.hormones["cortisol"] - 0.1)

    def get_cognitive_modifiers(self) -> dict:
        cortisol = self.hormones["cortisol"]
        if cortisol > 0.7:
            return {"processing_mode": "REACTIVE"}
        elif cortisol > 0.4:
            return {"processing_mode": "CAUTIOUS"}
        return {"processing_mode": "ANALYTICAL"}


def main() -> None:
    data = json.load(sys.stdin)

    perception = data.get("perception", "")
    intent = data.get("intent", "")
    is_danger = data.get("is_danger", False)
    agent_id = data.get("agent_id", "anonymous")

    memory = MemoryInterface()
    endocrine = MockEndocrine()
    core = NeuralCore(memory_engine=memory, endocrine_system=endocrine)

    result_json = core.process_input(perception, intent, is_danger)
    result = json.loads(result_json)

    # Attach lightweight metadata — agent_id is only for correlation/logging,
    # NEVER used to modify behavior or identity.
    result["meta"] = {
        "agent_id": agent_id,
        "risk_tolerance": core.risk_tolerance,
        "hormones": endocrine.hormones,
        "processing_mode": endocrine.get_cognitive_modifiers()["processing_mode"],
    }

    print(json.dumps(result))


if __name__ == "__main__":
    main()
