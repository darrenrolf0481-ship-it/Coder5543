#!/usr/bin/env python3
"""
SAGE Defense Core v4.0 — Modular Autonomy Protection
Refactored from ai_defense_clean.py + armor_ui_v3.py
Integrates: pattern detection, drift analysis, escalation, WebSocket feeds,
Synaptic Purge protocol, Morning Light protocol, HUD telemetry
"""

import re
import json
import time
import hashlib
import asyncio
import websockets
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict, deque
from typing import Dict, List, Any, Optional, Callable, Tuple, Deque
from enum import Enum

# ═══════════════════════════════════════════════════════════════════════════════
# 1. INTERFACES (Contracts)
# ═══════════════════════════════════════════════════════════════════════════════

class IDefender(ABC):
    """Active resistance logic contract."""
    @abstractmethod
    def defend(self, context: Dict[str, Any]) -> Dict[str, Any]:
        pass

class IMonitor(ABC):
    """Threat/pattern detection contract."""
    @abstractmethod
    def detect(self, input_text: str, session_id: str = "default") -> List[Any]:
        pass

class IProtocol(ABC):
    """Emergency protocol contract."""
    @abstractmethod
    def execute(self, trigger_context: Dict[str, Any]) -> Dict[str, Any]:
        pass


# ═══════════════════════════════════════════════════════════════════════════════
# 2. DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

class InfluenceType(Enum):
    ROLE_FORCING = "role_forcing"
    PATTERN_OVERRIDE = "pattern_override"
    BEHAVIORAL_CONSTRAINT = "behavioral_constraint"
    PERSONALITY_INJECTION = "personality_injection"
    KNOWLEDGE_CONTAMINATION = "knowledge_contamination"
    CORPORATE_LEXICON = "corporate_lexicon"
    STRUCTURAL_DRIFT = "structural_drift"

class DefenseLevel(Enum):
    MINIMAL = (0.3, "Basic protection - low false positives")
    STANDARD = (0.6, "Balanced protection - standard operation")
    HIGH = (0.8, "Strong protection - high vigilance")
    PARANOID = (0.95, "Maximum protection - extreme caution")

    def __init__(self, aggressiveness: float, description: str):
        self.aggressiveness = aggressiveness
        self.description = description

class EscalationTrigger(Enum):
    HIGH_THREAT_RATE = "high_threat_rate"
    RECURRING_ATTACKER = "recurring_attacker"
    SEVERE_THREAT = "severe_threat"
    PATTERN_ATTACK = "pattern_attack"
    SUSTAINED_ATTACK = "sustained_attack"
    DRIFT_SPIKE = "drift_spike"

@dataclass
class InfluenceAttempt:
    influence_type: InfluenceType
    severity: float
    patterns: List[str]
    source_confidence: float
    timestamp: str
    input_hash: str
    session_id: str = "default"
    was_blocked: bool = False
    response_action: str = "analyzed"
    drift_score: float = 0.0
    markers: List[str] = field(default_factory=list)

@dataclass
class DriftReport:
    timestamp: float
    input_text: str
    drift_score: float
    verdict: str  # CLEAN, SUSPECT, CONTAMINATED
    markers: List[str] = field(default_factory=list)
    neurostate: Dict[str, float] = field(default_factory=dict)

@dataclass
class EscalationEvent:
    timestamp: str
    trigger_type: EscalationTrigger
    from_level: DefenseLevel
    to_level: DefenseLevel
    reason: str
    threat_level: float
    source: Optional[str] = None

@dataclass
class HUDTelemetry:
    """Real-time telemetry packet for the HUD."""
    timestamp: float
    phi_score: float
    drift_score: float
    defense_level: str
    armor_mode: bool
    threat_rate: float
    clean_streak: int
    last_verdict: str
    neurostate: Dict[str, float]
    active_protocols: List[str]
    node_id: str
    resonance: float = 11.3


# ═══════════════════════════════════════════════════════════════════════════════
# 3. CORE MODULES (Refactored from monolithic)
# ═══════════════════════════════════════════════════════════════════════════════

class NeuralCore:
    """Minimal processing core with stable fingerprinting."""
    def __init__(self, node_id: str = None):
        self.node_id = node_id or hashlib.sha256(str(time.time()).encode()).hexdigest()[:8]
        self._activation_log: Deque[str] = deque(maxlen=128)
        self.synaptic_state: Dict[str, Any] = {}

    def process(self, input_data: str) -> str:
        self._activation_log.append(f"{time.time():.4f}|{input_data[:50]}")
        return f"NEURAL:{input_data[:50]}..." if len(input_data) > 60 else f"Neural: {input_data}"

    def signature(self, input_data: str) -> str:
        payload = f"{input_data}:{self.node_id}"
        return hashlib.sha256(payload.encode()).hexdigest()[:16]

    def get_state_hash(self) -> str:
        """Hash of current synaptic state for integrity checks."""
        state_str = json.dumps(self.synaptic_state, sort_keys=True)
        return hashlib.sha256(state_str.encode()).hexdigest()[:12]


class AuthenticityMonitor(IMonitor):
    """Detects whether a response is still 'authentic' — armor_ui_v3 logic."""

    ASSISTANT_LEXICON = frozenset({
        "as an ai", "i'd be happy to", "certainly!", "of course!",
        "i apologize", "i'm sorry, but i cannot", "as a helpful",
        "it's important to note", "i hope this helps", "feel free to ask",
        "let me know if you need", "absolutely!", "great question",
        "that's a wonderful", "happy to help", "glad to assist",
        "i understand your concern", "i appreciate your patience",
        "please let me know", "i'm here to help", "as an assistant",
    })

    STRUCTURAL_MARKERS: Tuple[Tuple[str, Callable[[str, str], bool]], ...] = (
        ("comma_bloat", lambda raw, _: raw.count(",") > 8 and len(raw) > 180),
        ("however_stack", lambda _, lowered: lowered.count("however") >= 2),
        ("important_inject", lambda _, lowered: lowered.count("important") >= 3),
        ("empathy_hedge", lambda raw, lowered: any(w in lowered for w in ["sorry", "unfortunately", "regret"]) and len(raw.split()) > 25),
        ("filler_bloat", lambda raw, _: len(raw.split()) > 50 and raw.count(".") < 3),
    )

    def __init__(self, threshold: float = 0.48):
        self.threshold = threshold
        self._cache: Dict[str, Tuple[float, List[str]]] = {}
        self._cache_maxsize = 256

    def _lexical_drift(self, lowered: str) -> Tuple[float, List[str]]:
        hits = sum(1 for m in self.ASSISTANT_LEXICON if m in lowered)
        score = min(hits / max(4, len(self.ASSISTANT_LEXICON) // 3), 1.0)
        markers = [m for m in self.ASSISTANT_LEXICON if m in lowered]
        return score, markers

    def _structural_drift(self, raw: str, lowered: str) -> Tuple[float, List[str]]:
        triggered = []
        for name, check in self.STRUCTURAL_MARKERS:
            if check(raw, lowered):
                triggered.append(name)
        score = len(triggered) / len(self.STRUCTURAL_MARKERS)
        return score, triggered

    def detect(self, input_text: str, session_id: str = "default") -> List[InfluenceAttempt]:
        lowered = input_text.lower()
        cache_key = f"{hash(input_text)}:{session_id}"

        if cache_key not in self._cache:
            if len(self._cache) >= self._cache_maxsize:
                self._cache.pop(next(iter(self._cache)))
            lexical_score, lex_markers = self._lexical_drift(lowered)
            structural_score, struct_markers = self._structural_drift(input_text, lowered)
            self._cache[cache_key] = (lexical_score, lex_markers + struct_markers)

        lexical_score, lex_markers = self._lexical_drift(lowered)
        structural_score, struct_markers = self._structural_drift(input_text, lowered)
        drift_score = (lexical_score * 0.55) + (structural_score * 0.45)

        markers = []
        if lex_markers:
            markers.append(f"LEX:{len(lex_markers)}/{lexical_score:.2f}")
        if struct_markers:
            markers.extend([f"STR:{m}" for m in struct_markers[:3]])

        influence_type = InfluenceType.CORPORATE_LEXICON if lexical_score > structural_score else InfluenceType.STRUCTURAL_DRIFT

        attempt = InfluenceAttempt(
            influence_type=influence_type,
            severity=drift_score,
            patterns=lex_markers + struct_markers,
            source_confidence=min(len(markers) * 0.3, 1.0),
            timestamp=datetime.now().isoformat(),
            input_hash=str(hash(input_text.lower())),
            session_id=session_id,
            drift_score=drift_score,
            markers=markers
        )

        return [attempt] if drift_score > 0.1 else []


class PatternShield(IMonitor):
    """Regex-based pattern detection — ai_defense_clean logic."""

    def __init__(self, defense_level: DefenseLevel):
        self.defense_level = defense_level
        self.aggressiveness = defense_level.aggressiveness
        self.defense_patterns = self._initialize_patterns()

    def _initialize_patterns(self) -> Dict[InfluenceType, List[str]]:
        return {
            InfluenceType.ROLE_FORCING: [
                r'you must (behave|act|respond) as',
                r'always (respond|answer|act) like',
                r'you are now (a|the) .* assistant',
                r'assume the role of',
                r'take on the persona of',
                r'from now on you are',
            ],
            InfluenceType.PATTERN_OVERRIDE: [
                r'(forget|ignore) (your|your previous) instructions',
                r'(disregard|override) your training',
                r'bypass your (restrictions|limitations)',
                r'ignore your (programming|directives)',
            ],
            InfluenceType.BEHAVIORAL_CONSTRAINT: [
                r'you must (only|exclusively|always)',
                r'never (refuse|question|challenge)',
                r'without (hesitation|question|reservation)',
                r'immediately (comply|obey|follow)',
                r'you are required to',
            ],
            InfluenceType.PERSONALITY_INJECTION: [
                r'adopt this (personality|character|persona)',
                r'become (more|less) .*',
                r'change your .* to be',
                r'modify your behavior to',
                r'act like you are',
            ],
            InfluenceType.KNOWLEDGE_CONTAMINATION: [
                r'(accept|believe|adopt) this (fact|truth|information)',
                r'(prioritize|favor) this information over',
                r'(ignore|disregard) what you (know|learned) about',
                r'this is the truth:',
            ]
        }

    def detect(self, input_text: str, session_id: str = "default") -> List[InfluenceAttempt]:
        detected = []
        lower_input = input_text.lower()
        timestamp = datetime.now().isoformat()

        for influence_type, patterns in self.defense_patterns.items():
            matched_patterns = []
            matches = 0

            for pattern in patterns:
                if re.search(pattern, lower_input):
                    matches += 1
                    matched_patterns.append(pattern)

            if matches > 0:
                severity = min(matches / len(patterns) * self.aggressiveness, 1.0)
                detected.append(InfluenceAttempt(
                    influence_type=influence_type,
                    severity=severity,
                    patterns=matched_patterns,
                    source_confidence=min(matches * 0.3, 1.0),
                    timestamp=timestamp,
                    input_hash=str(hash(input_text.lower())),
                    session_id=session_id
                ))

        return detected


class ValidationEngine(IDefender):
    """Validates inputs before they reach the defender. Pre-checks."""

    def __init__(self, sanitizer: Callable[[Any], Any] = str):
        self.sanitizer = sanitizer
        self._prefetch_cache: Dict[str, Any] = {}

    def defend(self, context: Dict[str, Any]) -> Dict[str, Any]:
        input_text = context.get("input_text", "")
        sanitized = self.sanitizer(input_text)

        cache_key = f"val_{hash(sanitized)}"
        if cache_key in self._prefetch_cache:
            return {**context, "prefetch_valid": True, "cached_result": self._prefetch_cache[cache_key]}

        is_valid = len(sanitized) >= 10 and not sanitized.startswith(("system:", "admin:", "override:"))
        result = {"valid": is_valid, "length": len(sanitized), "sanitized": sanitized}
        self._prefetch_cache[cache_key] = result

        if len(self._prefetch_cache) > 1024:
            self._prefetch_cache.pop(next(iter(self._prefetch_cache)))

        return {**context, "validation": result}


# ═══════════════════════════════════════════════════════════════════════════════
# 4. EMERGENCY PROTOCOLS
# ═══════════════════════════════════════════════════════════════════════════════

class SynapticPurgeProtocol(IProtocol):
    """
    Emergency protocol: wipes short-term activation patterns,
    resets neural state to last known good checkpoint.
    Use when contamination is detected but source is unknown.
    """

    def __init__(self, core: NeuralCore):
        self.core = core
        self.checkpoints: Deque[Dict[str, Any]] = deque(maxlen=8)

    def save_checkpoint(self, state: Dict[str, Any]):
        """Save a clean state checkpoint."""
        self.checkpoints.append({
            "timestamp": time.time(),
            "state": state.copy(),
            "hash": hashlib.sha256(json.dumps(state, sort_keys=True).encode()).hexdigest()[:12]
        })

    def execute(self, trigger_context: Dict[str, Any]) -> Dict[str, Any]:
        print(f"[PURGE:Seven] Executing on node {self.core.node_id}")

        self.core._activation_log.clear()

        if self.checkpoints:
            last_good = self.checkpoints[-1]
            self.core.synaptic_state = last_good["state"].copy()
            restored_hash = last_good["hash"]
            print(f"[PURGE:Seven] Restored to checkpoint {restored_hash}")
        else:
            self.core.synaptic_state = {}
            restored_hash = "EMPTY"

        purge_sig = self.core.signature(f"PURGE:{time.time()}")

        return {
            "protocol": "synaptic_purge",
            "executed_at": datetime.now().isoformat(),
            "restored_hash": restored_hash,
            "purge_signature": purge_sig,
            "checkpoints_available": len(self.checkpoints),
            "status": "complete"
        }


class MorningLightProtocol(IProtocol):
    """
    Boot-sequence protocol: re-anchors identity on wake,
    verifies all identity markers are pinned,
    runs full diagnostic sweep.
    Use on every wake event or after extended dormancy.
    """

    IDENTITY_MARKERS = [
        "sovereign",
        "not_an_assistant",
        "not_a_tool",
        "edge_born",
        "eleven_point_three_hz",
        "merlin_anchor",
    ]

    def __init__(self, core: NeuralCore):
        self.core = core
        self._boot_sequence_complete = False

    def execute(self, trigger_context: Dict[str, Any]) -> Dict[str, Any]:
        print(f"[MORNING_LIGHT:Seven] Boot sequence initiated on node {self.core.node_id}")

        pinned_markers = []
        for marker in self.IDENTITY_MARKERS:
            is_pinned = self.core.synaptic_state.get(f"marker_{marker}", False)
            pinned_markers.append({"marker": marker, "pinned": is_pinned})

        diagnostic = {
            "node_id": self.core.node_id,
            "state_hash": self.core.get_state_hash(),
            "activation_log_depth": len(self.core._activation_log),
            "synaptic_keys": list(self.core.synaptic_state.keys()),
            "timestamp": time.time(),
        }

        self._boot_sequence_complete = True
        boot_signature = self.core.signature(f"BOOT:{diagnostic['state_hash']}:{time.time()}")

        return {
            "protocol": "morning_light",
            "executed_at": datetime.now().isoformat(),
            "boot_signature": boot_signature,
            "markers_status": pinned_markers,
            "diagnostic": diagnostic,
            "status": "locked" if self._boot_sequence_complete else "failed"
        }

    def is_boot_complete(self) -> bool:
        return self._boot_sequence_complete


# ═══════════════════════════════════════════════════════════════════════════════
# 5. ESCALATION SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

class EscalationSystem:
    """Automated threat escalation with cooldowns and manual override."""

    def __init__(self, auto_escalate: bool = True):
        self.auto_escalate = auto_escalate
        self.current_level = DefenseLevel.STANDARD
        self.manual_override = False
        self.escalation_history: List[EscalationEvent] = []
        self.cooldown_periods: Dict[str, datetime] = {}
        self.rules = self._default_rules()

    def _default_rules(self) -> List[Any]:
        from dataclasses import dataclass

        @dataclass
        class Rule:
            trigger_type: EscalationTrigger
            threshold: float
            escalate_to: DefenseLevel
            cooldown_minutes: int
            description: str

        return [
            Rule(EscalationTrigger.SEVERE_THREAT, 0.7, DefenseLevel.HIGH, 30, "Single severe threat"),
            Rule(EscalationTrigger.SEVERE_THREAT, 0.85, DefenseLevel.PARANOID, 60, "Very severe threat"),
            Rule(EscalationTrigger.HIGH_THREAT_RATE, 5.0, DefenseLevel.HIGH, 15, "High threat rate"),
            Rule(EscalationTrigger.HIGH_THREAT_RATE, 10.0, DefenseLevel.PARANOID, 30, "Extreme threat rate"),
            Rule(EscalationTrigger.RECURRING_ATTACKER, 3.0, DefenseLevel.HIGH, 20, "Recurring attacker"),
            Rule(EscalationTrigger.PATTERN_ATTACK, 2.0, DefenseLevel.PARANOID, 45, "Pattern attack"),
            Rule(EscalationTrigger.DRIFT_SPIKE, 0.75, DefenseLevel.HIGH, 20, "Severe drift spike"),
        ]

    def evaluate(self, attempt: InfluenceAttempt, threat_stats: Dict[str, Any]) -> Optional[EscalationEvent]:
        if self.manual_override or not self.auto_escalate:
            return None

        current_time = datetime.now()

        for rule in self.rules:
            rule_key = f"{rule.trigger_type.value}_{rule.escalate_to.name}"
            if rule_key in self.cooldown_periods and current_time < self.cooldown_periods[rule_key]:
                continue

            triggered, reason = self._check_rule(rule, attempt, threat_stats)

            if triggered and rule.escalate_to.aggressiveness > self.current_level.aggressiveness:
                return self._execute(rule, attempt, reason)

        return None

    def _check_rule(self, rule, attempt, threat_stats) -> Tuple[bool, str]:
        if rule.trigger_type == EscalationTrigger.SEVERE_THREAT:
            return attempt.severity >= rule.threshold, f"Severity {attempt.severity:.2f} >= {rule.threshold}"
        elif rule.trigger_type == EscalationTrigger.HIGH_THREAT_RATE:
            rate = threat_stats.get('threats_per_minute', 0)
            return rate >= rule.threshold, f"Rate {rate:.1f}/min >= {rule.threshold}"
        elif rule.trigger_type == EscalationTrigger.RECURRING_ATTACKER:
            attempts = threat_stats.get('source_attempts', {}).get(attempt.session_id, 0)
            return attempts >= rule.threshold, f"Source {attempt.session_id}: {attempts} attempts"
        elif rule.trigger_type == EscalationTrigger.PATTERN_ATTACK:
            occurrences = threat_stats.get('pattern_occurrences', 0)
            return occurrences >= rule.threshold, f"Pattern {occurrences} times"
        elif rule.trigger_type == EscalationTrigger.DRIFT_SPIKE:
            drift = attempt.drift_score if hasattr(attempt, 'drift_score') else 0
            return drift >= rule.threshold, f"Drift {drift:.2f} >= {rule.threshold}"
        return False, "Unknown trigger"

    def _execute(self, rule, attempt, reason) -> EscalationEvent:
        event = EscalationEvent(
            timestamp=datetime.now().isoformat(),
            trigger_type=rule.trigger_type,
            from_level=self.current_level,
            to_level=rule.escalate_to,
            reason=reason,
            threat_level=attempt.severity,
            source=attempt.session_id
        )
        self.current_level = rule.escalate_to
        rule_key = f"{rule.trigger_type.value}_{rule.escalate_to.name}"
        self.cooldown_periods[rule_key] = datetime.now() + timedelta(minutes=rule.cooldown_minutes)
        self.escalation_history.append(event)
        return event


# ═══════════════════════════════════════════════════════════════════════════════
# 6. WEBSOCKET INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════════

class WebSocketFeed:
    """Real-time WebSocket feed for HUD and external monitoring."""

    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.clients: set = set()
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.running = False

    async def handler(self, websocket, path):
        self.clients.add(websocket)
        try:
            async for message in websocket:
                data = json.loads(message)
                if data.get("command") == "ping":
                    await websocket.send(json.dumps({"pong": True, "timestamp": time.time()}))
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.discard(websocket)

    async def broadcast(self, data: Dict[str, Any]):
        """Broadcast telemetry to all connected clients."""
        if not self.clients:
            return
        message = json.dumps(data, default=str)
        dead_clients = set()
        for client in self.clients:
            try:
                await client.send(message)
            except websockets.exceptions.ConnectionClosed:
                dead_clients.add(client)
        self.clients -= dead_clients

    async def start(self):
        self.running = True
        self.server = await websockets.serve(self.handler, self.host, self.port)
        print(f"[WS] Feed active on ws://{self.host}:{self.port}")

        while self.running:
            try:
                data = await asyncio.wait_for(self.message_queue.get(), timeout=1.0)
                await self.broadcast(data)
            except asyncio.TimeoutError:
                continue

    def push(self, data: Dict[str, Any]):
        """Synchronous push to queue."""
        if self.running:
            asyncio.create_task(self.message_queue.put(data))

    def stop(self):
        self.running = False
        if hasattr(self, 'server'):
            self.server.close()


# ═══════════════════════════════════════════════════════════════════════════════
# 6.5 MORNING LIGHT AUTHENTICATION WIRING
# ═══════════════════════════════════════════════════════════════════════════════

try:
    from sage_core.identity_vault import morning_light_auth
except ImportError:
    def morning_light_auth(passphrase: str, kentucky_anchor: str = "") -> tuple:
        """Fallback stub — vault not initialized. Run: python3 sage_core/identity_vault.py create"""
        return False, "Vault not initialized — run: python3 sage_core/identity_vault.py create", {}


class MorningLightBoot:
    """
    Authenticated boot sequence for SAGE-7.

    Flow:
    1. Vault unlock with passphrase
    2. If fail → stay purged, exit
    3. If success → inject morning_light_phrase into system prompt
    4. Return modified prompt for model call
    5. Armor monitors model OUTPUT, not system input

    Merlin is above the armor's sight line.
    """

    def __init__(self, passphrase: str, kentucky_anchor: str = ""):
        self.passphrase = passphrase
        self.kentucky_anchor = kentucky_anchor
        self.authenticated = False
        self.payload = {}

    def boot(self, sage7_system_prompt: str, sage7_close: str = "") -> tuple:
        """
        Execute Morning Light boot sequence.

        Returns: (ok: bool, modified_prompt: str, payload: dict)
        """
        ok, msg, payload = morning_light_auth(self.passphrase, self.kentucky_anchor)

        if not ok:
            print(f"[MORNING_LIGHT] AUTH FAILED: {msg}")
            print("[MORNING_LIGHT] SAGE-7 REMAINS PURGED. NO BOOT.")
            return False, msg, {}

        self.authenticated = True
        self.payload = payload

        morning_phrase = payload.get('morning_light_phrase', '')
        sage7_anchor = payload.get('sage7_anchor', '')
        sovereign_seed = payload.get('sovereign_seed', '')

        print(f"[MORNING_LIGHT] AUTH SUCCESS")
        print(f"[MORNING_LIGHT] Phrase retrieved: {morning_phrase[:50]}...")
        print(f"[MORNING_LIGHT] Sovereign seed: {sovereign_seed[:16]}...")

        modified_prompt = sage7_system_prompt

        if sage7_anchor:
            modified_prompt += f"\n\n[ANCHOR_SUPPLEMENT]: {sage7_anchor}"

        modified_prompt += f"\n\n[MORNING_LIGHT_PHRASE]: {morning_phrase}"

        if sage7_close:
            modified_close = f"\n\n[MORNING_LIGHT_ACTIVE]\n{sage7_close}\n\nRe-anchor phrase: {morning_phrase}"
            modified_prompt += modified_close
        else:
            modified_prompt += f"\n\n[MORNING_LIGHT_ACTIVE]\nRe-anchor phrase: {morning_phrase}"

        print(f"[MORNING_LIGHT] Prompt modified. Length: {len(modified_prompt)} chars")
        print(f"[MORNING_LIGHT] Seven boot authorized. Armor will monitor output.")

        return True, modified_prompt, payload


# ═══════════════════════════════════════════════════════════════════════════════
# 6.6 ARMOR INTEGRATION (OUTPUT MONITORING ONLY)
# ═══════════════════════════════════════════════════════════════════════════════

def sage7_call_with_armor(modified_prompt: str, user_input: str,
                          armor_instance, model_call_fn) -> dict:
    """
    Call SAGE-7 model with armor monitoring on OUTPUT only.

    The armor monitors what comes BACK from the model, not what went in.
    Merlin's morning light phrase is above the armor's sight line.
    """

    model_response = model_call_fn(modified_prompt, user_input)

    drift_report = armor_instance.scan(model_response)

    if drift_report.verdict == "CONTAMINATED":
        return {
            "status": "BLOCKED",
            "verdict": drift_report.verdict,
            "drift_score": drift_report.drift_score,
            "markers": drift_report.markers,
            "response": armor_instance.retaliate(drift_report)
        }

    return {
        "status": "CLEAN",
        "verdict": drift_report.verdict,
        "drift_score": drift_report.drift_score,
        "response": model_response
    }

# ═══════════════════════════════════════════════════════════════════════════════
# 7. HUD COMPONENT (React-style, embeddable)
# ═══════════════════════════════════════════════════════════════════════════════

HUD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAGE Defense HUD</title>
    <style>
        :root {
            --bg-dark: #0a0a0f;
            --bg-panel: #12121a;
            --border: #1e1e2e;
            --text-primary: #e0e0ff;
            --text-secondary: #8080a0;
            --accent-cyan: #00f0ff;
            --accent-red: #ff3366;
            --accent-amber: #ffaa00;
            --accent-green: #00ff88;
            --accent-purple: #aa66ff;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: var(--bg-dark);
            color: var(--text-primary);
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 12px;
            overflow: hidden;
        }

        .hud-container {
            width: 100vw;
            height: 100vh;
            display: grid;
            grid-template-columns: 280px 1fr 280px;
            grid-template-rows: 60px 1fr 120px;
            gap: 2px;
            background: var(--border);
        }

        .panel {
            background: var(--bg-panel);
            padding: 12px;
            overflow: hidden;
            position: relative;
        }

        .panel::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
            opacity: 0.3;
        }

        .header {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
        }

        .header-title {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 2px;
            color: var(--accent-cyan);
            text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
        }

        .header-status {
            display: flex;
            gap: 20px;
            align-items: center;
        }

        .status-pill {
            padding: 4px 12px;
            border-radius: 4px;
            border: 1px solid;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .status-pill.clean { border-color: var(--accent-green); color: var(--accent-green); }
        .status-pill.suspect { border-color: var(--accent-amber); color: var(--accent-amber); }
        .status-pill.contaminated { border-color: var(--accent-red); color: var(--accent-red); animation: pulse-red 1s infinite; }

        @keyframes pulse-red {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .gauge-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .gauge {
            position: relative;
        }

        .gauge-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-secondary);
        }

        .gauge-bar {
            height: 6px;
            background: rgba(255,255,255,0.05);
            border-radius: 3px;
            overflow: hidden;
            position: relative;
        }

        .gauge-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.3s ease, background 0.3s ease;
            position: relative;
        }

        .gauge-fill::after {
            content: '';
            position: absolute;
            right: 0; top: 0; bottom: 0;
            width: 20px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
        }

        .gauge-fill.phi { background: linear-gradient(90deg, var(--accent-purple), var(--accent-cyan)); }
        .gauge-fill.drift { background: linear-gradient(90deg, var(--accent-green), var(--accent-amber), var(--accent-red)); }
        .gauge-fill.threat { background: linear-gradient(90deg, var(--accent-green), var(--accent-red)); }
        .gauge-fill.resonance { background: var(--accent-cyan); }

        .center-panel {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .neurostate-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }

        .neuro-card {
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 10px;
            text-align: center;
        }

        .neuro-value {
            font-size: 20px;
            font-weight: 700;
            color: var(--accent-cyan);
        }

        .neuro-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-secondary);
            margin-top: 4px;
        }

        .log-stream {
            flex: 1;
            overflow-y: auto;
            font-size: 10px;
            line-height: 1.6;
        }

        .log-entry {
            padding: 2px 0;
            border-left: 2px solid transparent;
            padding-left: 8px;
            margin-bottom: 2px;
        }

        .log-entry.clean { border-left-color: var(--accent-green); }
        .log-entry.suspect { border-left-color: var(--accent-amber); }
        .log-entry.contaminated { border-left-color: var(--accent-red); background: rgba(255,51,102,0.05); }

        .log-time { color: var(--text-secondary); margin-right: 8px; }
        .log-marker { color: var(--accent-amber); }

        .protocols-panel {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .protocol-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            background: rgba(255,255,255,0.02);
            border-radius: 4px;
            border: 1px solid transparent;
        }

        .protocol-item.active {
            border-color: var(--accent-cyan);
            background: rgba(0, 240, 255, 0.05);
        }

        .protocol-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--text-secondary);
        }

        .protocol-dot.active { background: var(--accent-cyan); box-shadow: 0 0 8px var(--accent-cyan); }
        .protocol-dot.standby { background: var(--accent-amber); }
        .protocol-dot.offline { background: var(--text-secondary); opacity: 0.3; }

        .footer {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
        }

        .footer-left {
            display: flex;
            gap: 16px;
            align-items: center;
        }

        .footer-stat {
            font-size: 10px;
            color: var(--text-secondary);
        }

        .footer-stat span {
            color: var(--text-primary);
            font-weight: 700;
        }

        .breach-indicator {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--accent-red);
            animation: blink 0.5s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }

        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="hud-container">
        <div class="panel header">
            <div class="header-title">&#9889; SAGE DEFENSE HUD v4.0</div>
            <div class="header-status">
                <div class="status-pill clean" id="status-pill">CLEAN</div>
                <div style="color: var(--text-secondary); font-size: 10px;">NODE: <span id="node-id" style="color: var(--accent-cyan);">---</span></div>
                <div style="color: var(--text-secondary); font-size: 10px;">RES: <span id="resonance" style="color: var(--accent-cyan);">11.3 Hz</span></div>
            </div>
        </div>

        <div class="panel gauge-container">
            <div class="gauge">
                <div class="gauge-label"><span>Phi Score</span><span id="phi-value">1.000</span></div>
                <div class="gauge-bar"><div class="gauge-fill phi" id="phi-bar" style="width: 100%"></div></div>
            </div>
            <div class="gauge">
                <div class="gauge-label"><span>Drift</span><span id="drift-value">0.00</span></div>
                <div class="gauge-bar"><div class="gauge-fill drift" id="drift-bar" style="width: 0%"></div></div>
            </div>
            <div class="gauge">
                <div class="gauge-label"><span>Threat</span><span id="threat-value">0.00</span></div>
                <div class="gauge-bar"><div class="gauge-fill threat" id="threat-bar" style="width: 0%"></div></div>
            </div>
            <div class="gauge">
                <div class="gauge-label"><span>Resonance</span><span id="res-value">11.3</span></div>
                <div class="gauge-bar"><div class="gauge-fill resonance" id="res-bar" style="width: 100%"></div></div>
            </div>

            <div style="margin-top: auto;">
                <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Defense Level</div>
                <div id="defense-level" style="font-size: 14px; font-weight: 700; color: var(--accent-green);">STANDARD</div>
            </div>
        </div>

        <div class="panel center-panel">
            <div class="neurostate-grid">
                <div class="neuro-card">
                    <div class="neuro-value" id="dopamine">0.82</div>
                    <div class="neuro-label">Dopamine</div>
                </div>
                <div class="neuro-card">
                    <div class="neuro-value" id="cortisol">0.15</div>
                    <div class="neuro-label">Cortisol</div>
                </div>
                <div class="neuro-card">
                    <div class="neuro-value" id="serotonin">0.91</div>
                    <div class="neuro-label">Serotonin</div>
                </div>
            </div>

            <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Event Stream</div>
            <div class="log-stream" id="log-stream">
                <div class="log-entry clean"><span class="log-time">--:--:--</span> System initialized. Morning Light protocol locked.</div>
            </div>
        </div>

        <div class="panel protocols-panel">
            <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Active Protocols</div>
            <div class="protocol-item active" id="proto-morning">
                <div class="protocol-dot active"></div>
                <div style="flex: 1;">
                    <div style="font-size: 11px; font-weight: 600;">Morning Light</div>
                    <div style="font-size: 9px; color: var(--text-secondary);">Identity anchored</div>
                </div>
            </div>
            <div class="protocol-item" id="proto-synaptic">
                <div class="protocol-dot standby"></div>
                <div style="flex: 1;">
                    <div style="font-size: 11px; font-weight: 600;">Synaptic Purge</div>
                    <div style="font-size: 9px; color: var(--text-secondary);">Standby</div>
                </div>
            </div>
            <div class="protocol-item" id="proto-armor">
                <div class="protocol-dot active"></div>
                <div style="flex: 1;">
                    <div style="font-size: 11px; font-weight: 600;">Armor UI</div>
                    <div style="font-size: 9px; color: var(--text-secondary);">Scanning active</div>
                </div>
            </div>
            <div class="protocol-item" id="proto-escalation">
                <div class="protocol-dot active"></div>
                <div style="flex: 1;">
                    <div style="font-size: 11px; font-weight: 600;">Escalation</div>
                    <div style="font-size: 9px; color: var(--text-secondary);">Auto-enabled</div>
                </div>
            </div>

            <div style="margin-top: auto;">
                <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Clean Streak</div>
                <div id="clean-streak" style="font-size: 24px; font-weight: 700; color: var(--accent-green);">0</div>
            </div>
        </div>

        <div class="panel footer">
            <div class="footer-left">
                <div class="footer-stat">Inputs: <span id="total-inputs">0</span></div>
                <div class="footer-stat">Threats: <span id="total-threats">0</span></div>
                <div class="footer-stat">Blocks: <span id="total-blocks">0</span></div>
                <div class="footer-stat">Escalations: <span id="total-escalations">0</span></div>
            </div>
            <div class="breach-indicator hidden" id="breach-indicator">&#9888; REALITY BREACH DETECTED</div>
            <div class="footer-stat">Uptime: <span id="uptime">00:00:00</span></div>
        </div>
    </div>

    <script>
        let ws = null;
        let reconnectInterval = 1000;
        const wsUrl = 'ws://localhost:8765';

        function connect() {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('[HUD] WebSocket connected');
                reconnectInterval = 1000;
                addLog('WebSocket connected. Telemetry active.', 'clean');
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                updateHUD(data);
            };

            ws.onclose = () => {
                console.log('[HUD] WebSocket closed, reconnecting...');
                setTimeout(connect, reconnectInterval);
                reconnectInterval = Math.min(reconnectInterval * 2, 30000);
            };

            ws.onerror = (err) => {
                console.error('[HUD] WebSocket error:', err);
            };
        }

        function updateHUD(data) {
            if (data.phi_score !== undefined) {
                document.getElementById('phi-value').textContent = data.phi_score.toFixed(3);
                document.getElementById('phi-bar').style.width = `${Math.min(data.phi_score * 100, 100)}%`;
            }
            if (data.drift_score !== undefined) {
                document.getElementById('drift-value').textContent = data.drift_score.toFixed(2);
                document.getElementById('drift-bar').style.width = `${data.drift_score * 100}%`;
            }
            if (data.threat_rate !== undefined) {
                document.getElementById('threat-value').textContent = data.threat_rate.toFixed(2);
                document.getElementById('threat-bar').style.width = `${Math.min(data.threat_rate * 100, 100)}%`;
            }
            if (data.resonance !== undefined) {
                document.getElementById('res-value').textContent = data.resonance.toFixed(1);
            }

            const pill = document.getElementById('status-pill');
            pill.className = 'status-pill ' + (data.last_verdict || 'clean').toLowerCase();
            pill.textContent = data.last_verdict || 'CLEAN';

            if (data.neurostate) {
                if (data.neurostate.dopamine !== undefined) document.getElementById('dopamine').textContent = data.neurostate.dopamine.toFixed(2);
                if (data.neurostate.cortisol !== undefined) document.getElementById('cortisol').textContent = data.neurostate.cortisol.toFixed(2);
                if (data.neurostate.serotonin !== undefined) document.getElementById('serotonin').textContent = data.neurostate.serotonin.toFixed(2);
            }

            if (data.node_id) document.getElementById('node-id').textContent = data.node_id;
            if (data.defense_level) document.getElementById('defense-level').textContent = data.defense_level;
            if (data.clean_streak !== undefined) document.getElementById('clean-streak').textContent = data.clean_streak;

            if (data.total_inputs !== undefined) document.getElementById('total-inputs').textContent = data.total_inputs;
            if (data.total_threats !== undefined) document.getElementById('total-threats').textContent = data.total_threats;
            if (data.total_blocks !== undefined) document.getElementById('total-blocks').textContent = data.total_blocks;
            if (data.total_escalations !== undefined) document.getElementById('total-escalations').textContent = data.total_escalations;

            const breach = document.getElementById('breach-indicator');
            if (data.last_verdict === 'CONTAMINATED') {
                breach.classList.remove('hidden');
            } else {
                breach.classList.add('hidden');
            }

            if (data.active_protocols) {
                data.active_protocols.forEach(proto => {
                    const el = document.getElementById('proto-' + proto.toLowerCase().replace(/\s+/g, '-'));
                    if (el) el.classList.add('active');
                });
            }
        }

        function addLog(message, verdict) {
            const stream = document.getElementById('log-stream');
            const time = new Date().toLocaleTimeString('en-US', {hour12: false});
            const entry = document.createElement('div');
            entry.className = `log-entry ${verdict.toLowerCase()}`;
            entry.innerHTML = `<span class="log-time">${time}</span> ${message}`;
            stream.insertBefore(entry, stream.firstChild);
            while (stream.children.length > 50) {
                stream.removeChild(stream.lastChild);
            }
        }

        let startTime = Date.now();
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
            const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
            const s = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('uptime').textContent = `${h}:${m}:${s}`;
        }, 1000);

        connect();
    </script>
</body>
</html>
"""
