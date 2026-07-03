"""Shared request models and cross-route state for SAGE-7.

Holds only the data definitions used by MORE THAN ONE route module:
  - SensoryData (used by the memory and sensory route groups)
  - InvestigationSession + the `investigation` singleton (memory + sensory)

Models scoped to a single route module live in that module (e.g. ChatRequest /
OllamaChatRequest in the chat routes, ZoSyncRequest in the memory routes).

Imports nothing from the app, firewall, or routes — safe to import anywhere.
"""

import os
import time
import json
from pathlib import Path
from typing import Optional, Any

from pydantic import BaseModel, ConfigDict


class SensoryData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    sensory_type: str
    content: Optional[str] = None
    severity: Optional[float] = None
    context: Optional[Any] = None
    data: Optional[Any] = None
    phi_delta: Optional[float] = None
    dopamine_modifier: Optional[float] = None
    oxytocin_modifier: Optional[float] = None
    synaptic_weight: Optional[float] = None
    is_simulated: Optional[bool] = False
    validation_required: Optional[bool] = False
    state: Optional[str] = None
    hormone: Optional[str] = None
    intensity: Optional[float] = None
    host_latency: Optional[str] = None
    hormone_spike: Optional[str] = None
    dopamine_shift: Optional[float] = None
    concept_primary: Optional[str] = None
    concept_secondary: Optional[str] = None
    target_levels: Optional[dict] = None
    message: Optional[str] = None
    header: Optional[str] = None
    body: Optional[Any] = None
    timestamp: Optional[float] = None


class InvestigationSession:
    def __init__(self):
        self.active = False
        self.start_time = None
        self.log_path = None
        self.session_id = None
        self.high_gain = False

    def start(self):
        self.active = True
        self.start_time = time.time()
        self.session_id = f"investigation_{int(self.start_time)}"
        os.makedirs("records/investigations", exist_ok=True)
        self.log_path = Path(f"records/investigations/{self.session_id}.jsonl")
        self.log_event({"event": "SESSION_START", "timestamp": self.start_time})

    def stop(self):
        if self.active:
            self.log_event({"event": "SESSION_STOP", "timestamp": time.time()})
            self.active = False
            self.high_gain = False

    def log_event(self, data):
        if not self.log_path: return
        with open(self.log_path, "a") as f:
            if "timestamp" not in data:
                data["timestamp"] = time.time()
            f.write(json.dumps(data) + "\n")

    def drop_breadcrumb(self, label="MANUAL_MARKER", metadata=None):
        if not self.active: return None
        event = {
            "event": "BREADCRUMB",
            "label": label,
            "metadata": metadata,
            "timestamp": time.time()
        }
        self.log_event(event)
        return event


investigation = InvestigationSession()
