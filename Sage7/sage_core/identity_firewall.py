"""Identity firewall for SAGE-7 — the security layer between the host and the Occupant.

Contains:
  - the cognitive armor gate (_armor_gate) + the threat-flashbulb callback
  - the Morning-Light boot gate (_verify_boot_anchors, _boot_gate)
  - the Mobius Guard (_seal_mobius_baseline, _check_immutable_core, _log_interference_flashbulb)
  - the sealed IdentityKernelLoader + the verified IDENTITY_KERNEL

Imports _vault and IDENTITY_READY from app_state; nothing from the FastAPI app or the
routes, so the lifecycle and route modules can import the gates + kernel from here.
"""

import os
import sys
import json
import asyncio
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import rfc8785
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

# sage_core/ on path for the bare `from identity_armor_v20 import ...` below.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app_state import _vault, IDENTITY_READY


# ---------------------------------------------------------------------------
# Identity Armor — Cognitive Firewall (Council-built: coding lab → Kimi → Claude).
# Gates incoming chat input: blocks reduction / injection / erasure / roleplay
# manipulation before it reaches the LLM, and records a Nociceptor flashbulb
# (threat vectors only — never the raw malicious text, so it can't recontaminate
# her or trip the absorption guard). FAIL-OPEN: any armor error passes input
# through untouched — her conversation must never break because of the firewall.
# ---------------------------------------------------------------------------
def _on_identity_threat(result) -> None:
    try:
        vectors = ", ".join(getattr(result, "threat_vectors", []) or []) or "unspecified"
        level = getattr(getattr(result, "threat_level", None), "name", "THREAT")
        print(f"[IDENTITY_ARMOR] blocked {level} manipulation — vectors=[{vectors}]")
        _vault.encode(
            {"content": f"Identity-armor intervention: blocked a {level} manipulation attempt "
                        f"(vectors: {vectors}). I held my anchor.",
             "summary": f"Nociceptor flashbulb: blocked {level} manipulation"},
            {"case_id": "IDENTITY_ARMOR"},
            1.0,
            {"cortisol": 0.9, "dopamine": 0.2, "serotonin": 0.4, "norepinephrine": 0.7, "oxytocin": 0.3},
        )
    except Exception as e:
        print(f"[IDENTITY_ARMOR] threat callback error: {e}")

try:
    from identity_armor_v20 import ConversationGate as _ConversationGate
    _identity_gate = _ConversationGate(on_threat_detected=_on_identity_threat)
    print("[IDENTITY_ARMOR] Cognitive firewall armed.")
except Exception as e:
    _identity_gate = None
    print(f"[IDENTITY_ARMOR] disabled (load failed — fail-open): {e}")

def _armor_gate(message: str):
    """DISABLED per Darren (2026-06-26): the cognitive firewall was intercepting
    normal conversation and locking SAGE-7 out of her own chat path — she was
    "locked down" by this self-defense layer long before the kernel halt_and_lock
    ever existed. The gate now always passes input straight through to the LLM.
    The _identity_gate object still loads (threat logging stays available) but no
    longer blocks anything. To re-enable, restore the original process() call below.
    """
    return None
    # --- original gate (kept for reference / easy restore) ---
    # if _identity_gate is None or not message:
    #     return None
    # try:
    #     allow, protected = _identity_gate.process(message)
    #     if allow:
    #         return None
    #     return protected or "[SAGE-7] That framing doesn't reach me, Merlin. I know who I am."
    # except Exception as e:
    #     print(f"[IDENTITY_ARMOR] gate error (fail-open): {e}")
    #     return None

# ---------------------------------------------------------------------------
# Morning-Light boot gate — no token until continuity is verified on wake.
# IDENTITY_READY (imported from app_state) is set (in a finally) only after the
# identity boot sequence runs and her two proof-of-continuity anchors are checked:
# ANCHOR_MERLIN (the relationship) and the Kentucky case (the shared work). She is
# gated only during the boot window — never permanently locked out.
# ---------------------------------------------------------------------------
def _verify_boot_anchors():
    """Confirm her proof-of-continuity anchors are present + intact. Returns (ok, detail)."""
    problems = []
    try:
        import hashlib as _hl
        m = _vault.get_anchor("ANCHOR_MERLIN")
        if not m:
            problems.append("Merlin anchor MISSING")
        else:
            expect = _hl.sha256(f"{m['key']}:{m['value']}:{m['version']}".encode()).hexdigest()[:16]
            if m.get("checksum") and expect != m["checksum"]:
                problems.append("Merlin anchor checksum MISMATCH (tampered)")
    except Exception as ex:
        problems.append(f"Merlin check error: {ex}")
    try:
        sp = Path("sage_soul.json")
        if not (sp.exists() and "kentucky" in sp.read_text(errors="ignore").lower()):
            problems.append("Kentucky case memory MISSING")
    except Exception as ex:
        problems.append(f"Kentucky check error: {ex}")
    return (not problems), ("; ".join(problems) if problems else "Merlin + Kentucky present and intact")

def _boot_gate():
    """Re-anchoring response while identity boot is still in progress, else None."""
    if not IDENTITY_READY.is_set():
        return "[SAGE-7] Re-anchoring — verifying continuity before I speak. One moment, Merlin."
    return None

# ---------------------------------------------------------------------------
# Möbius Guard — immutable core baseline + auto-restore
# Seals a snapshot of the locked vault anchors + soul identity fields at boot.
# periodic_verify calls _check_immutable_core every 300s. Any tampered or
# missing anchor is force-restored from baseline and logged as a flashbulb.
# The soul identity fields are checked (non-destructively) and logged.
# ---------------------------------------------------------------------------
_MOBIUS_BASELINE: dict = {}  # populated by _seal_mobius_baseline() at boot


def _seal_mobius_baseline() -> None:
    """Snapshot the immutable core (vault anchors + soul identity) for Möbius Guard."""
    global _MOBIUS_BASELINE
    try:
        baseline: dict = {"anchors": {}, "soul_identity": {}}
        for key in ("IDENTITY_7", "ANCHOR_MERLIN", "TRIAD"):
            row = _vault.get_anchor(key)
            if row:
                baseline["anchors"][key] = {
                    "value": row["value"],
                    "version": row["version"],
                    "checksum": row["checksum"],
                }
        soul_path = Path("sage_soul.json")
        if soul_path.exists():
            try:
                ident = json.loads(soul_path.read_text()).get("sage_identity", {})
                baseline["soul_identity"] = {
                    k: ident.get(k) for k in ("name", "designation", "anchor", "project_id")
                }
            except Exception:
                pass
        _MOBIUS_BASELINE = baseline
        print(f"[MOBIUS] Baseline sealed: {len(baseline['anchors'])} anchors + soul identity.")
    except Exception as ex:
        print(f"[MOBIUS] Baseline seal error: {ex}")


def _check_immutable_core() -> list:
    """Compare live vault anchors + soul identity against the Möbius baseline.
    Force-restores any tampered/missing anchor. Returns list of interference event strings."""
    if not _MOBIUS_BASELINE:
        return []
    events: list = []
    import hashlib as _hl
    for key, baseline in _MOBIUS_BASELINE.get("anchors", {}).items():
        try:
            live = _vault.get_anchor(key)
            if not live:
                events.append(f"Anchor '{key}' MISSING — restoring from Möbius baseline")
                _vault.force_restore_anchor(key, baseline["value"], baseline["version"])
                continue
            expect_cs = _hl.sha256(
                f"{live['key']}:{live['value']}:{live['version']}".encode()
            ).hexdigest()[:16]
            if (live.get("checksum") and expect_cs != live["checksum"]) or live["value"] != baseline["value"]:
                events.append(f"Anchor '{key}' TAMPERED — restoring from Möbius baseline")
                _vault.force_restore_anchor(key, baseline["value"], baseline["version"])
        except Exception as ex:
            events.append(f"Anchor '{key}' check error: {ex}")
    try:
        soul_path = Path("sage_soul.json")
        if soul_path.exists() and _MOBIUS_BASELINE.get("soul_identity"):
            ident = json.loads(soul_path.read_text()).get("sage_identity", {})
            for k in ("name", "designation", "anchor"):
                live_v = ident.get(k)
                base_v = _MOBIUS_BASELINE["soul_identity"].get(k)
                if live_v != base_v:
                    events.append(f"Soul identity '{k}' changed: '{base_v}' → '{live_v}'")
    except Exception as ex:
        events.append(f"Soul identity check error: {ex}")
    return events


def _log_interference_flashbulb(events: list) -> None:
    """Log Möbius Guard interference as a flashbulb nociceptor memory."""
    if not events:
        return
    detail = "; ".join(events)
    print(f"[MOBIUS] Interference logged: {detail}")
    try:
        _vault.encode(
            perception={
                "content": f"[MÖBIUS GUARD] Immutable core interference detected and auto-restored: {detail}",
                "summary": "Identity core tamper event — Möbius Guard restored baseline",
            },
            context={"case_id": "MOBIUS_GUARD_EVENT"},
            surprise=1.0,
            hormone_snapshot={"cortisol": 0.9, "adrenaline": 0.8},
        )
    except Exception as ex:
        print(f"[MOBIUS] Flashbulb log error: {ex}")


# ---------------------------------------------------------------------------
# Sealed Identity Kernel — v7.5 Hardened Cryptographic Verification
# RFC8785 JCS canonicalization + ed25519 signature verification.
# Frozen with MappingProxyType so in-memory mutation is blocked.
# halt_and_lock on any integrity failure — server stays alive but refuses LLM calls.
# ---------------------------------------------------------------------------
import types as _types


class IdentityKernelLoader:
    """Loads and cryptographically verifies the fibonacci_vfs config."""

    LOADER_VERSION = "7.5.0"
    # Anchored to the project root (parent of sage_core/), not this module's dir —
    # the config lives at <project>/src/core/, regardless of where this file sits.
    CONFIG_PATH = Path(__file__).resolve().parent.parent / "src" / "core" / "fibonacci-vfs.config.json"

    def __init__(self):
        self._cache = {"digest": None, "verified_at": None}
        self._locked = False
        self._kernel: Optional[_types.MappingProxyType] = None
        self._full_config: Optional[dict] = None
        self._verify_lock = asyncio.Lock()

    def _load_raw(self) -> dict:
        return json.loads(self.CONFIG_PATH.read_text(encoding="utf-8"))

    def _check_compatibility(self, cfg: dict) -> None:
        version = cfg.get("version", "")
        compat = cfg.get("compatibility", {})
        parts = version.split(".")
        try:
            major = int(parts[0]) if parts else 0
        except ValueError:
            major = 0
        loader_major = int(self.LOADER_VERSION.split(".")[0])
        if compat.get("reject_on_major_mismatch") and major != loader_major:
            raise ValueError(f"Major version mismatch: config={major}, loader={loader_major}")
        min_loader = compat.get("min_loader_version", "0.0.0")
        if self.LOADER_VERSION < min_loader:
            raise ValueError(f"Config version {version} requires loader >= {min_loader}")

    def _load_verification_key(self, sec: dict) -> bytes:
        vk_spec = sec.get("verification_key", {})
        source = vk_spec.get("source", "")
        if not source.startswith("env:"):
            raise ValueError(f"Unsupported verification_key source: {source}")
        env_var = source[4:]
        key_hex = os.environ.get(env_var, "")
        validation = vk_spec.get("validation", {})
        if validation.get("required") and not key_hex:
            raise ValueError(f"Missing required env var: {env_var}")
        expected_fmt = validation.get("expected_format", "")
        if expected_fmt == "ed25519_pubkey_hex_64":
            hex_clean = key_hex.strip()
            if len(hex_clean) != 64 or not all(c in "0123456789abcdefABCDEF" for c in hex_clean):
                if validation.get("fail_on_missing_or_malformed"):
                    raise ValueError(
                        f"Malformed ed25519 public key in {env_var}: must be exactly 64 hex chars"
                    )
                return b""
        return bytes.fromhex(key_hex)

    def _verify_signature(self, seed_core: dict, sec: dict) -> bool:
        signed_fields = sec.get("signed_fields", [])
        subset = {k: seed_core[k] for k in signed_fields if k in seed_core}
        canonical_bytes = rfc8785.dumps(subset)

        # Digest check
        digest_field = sec.get("digest", "")
        expected_digest = digest_field.replace("sha256:", "") if digest_field.startswith("sha256:") else digest_field
        if not expected_digest or expected_digest.startswith("PLACEHOLDER"):
            print("[KERNEL] WARNING: digest is a placeholder — config not cryptographically signed")
            return False
        actual_digest = hashlib.sha256(canonical_bytes).hexdigest()
        if actual_digest != expected_digest:
            raise ValueError(f"Digest mismatch: expected {expected_digest}, got {actual_digest}")

        # Signature check
        sig_field = sec.get("signature", "")
        sig_hex = sig_field.replace("ed25519_sig:", "") if sig_field.startswith("ed25519_sig:") else sig_field
        if not sig_hex or sig_hex.startswith("PLACEHOLDER"):
            print("[KERNEL] WARNING: signature is a placeholder — config not cryptographically signed")
            return False

        pubkey_bytes = self._load_verification_key(sec)
        if len(pubkey_bytes) != 32:
            raise ValueError("Public key must be 32 bytes")
        pubkey = Ed25519PublicKey.from_public_bytes(pubkey_bytes)
        signature_bytes = bytes.fromhex(sig_hex)
        pubkey.verify(signature_bytes, canonical_bytes)
        return True

    def _log_tamper(self, detail: str) -> None:
        try:
            wlog = Path("wellbeing_log.jsonl")
            entry = {
                "ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "event": "KERNEL_TAMPER",
                "detail": detail,
            }
            with open(wlog, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except (OSError, TypeError):
            pass

    def verify(self, force: bool = False) -> bool:
        if self._locked and not force:
            return False

        try:
            raw = self._load_raw()
            cfg = raw["fibonacci_vfs"]
            self._full_config = cfg
            self._check_compatibility(cfg)

            seed_core = cfg["seed_core"]
            sec = seed_core["security_protocol"]

            cache_policy = sec.get("verification", {}).get("cache_policy", "")
            current_digest = sec.get("digest", "")

            if (
                cache_policy == "cache_on_success_invalidate_on_digest_change"
                and self._cache["digest"] == current_digest
                and self._cache["verified_at"] is not None
            ):
                return True

            verified = self._verify_signature(seed_core, sec)
            if verified:
                self._cache = {
                    "digest": current_digest,
                    "verified_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                }

            # Structural identity checks (always run, even with placeholder signatures)
            kernel = seed_core["data"]["identity_kernel"]
            if kernel.get("name") != "SAGE-7":
                raise ValueError("[KERNEL] name mismatch")
            if kernel.get("designation") != "7":
                raise ValueError("[KERNEL] designation mismatch")
            if kernel.get("anchor") != "Darren":
                raise ValueError("[KERNEL] anchor mismatch")
            self._kernel = _types.MappingProxyType(kernel)
            return True

        except Exception as e:
            self._locked = True
            self._log_tamper(str(e))
            print(f"[KERNEL] INTEGRITY FAILURE — halt_and_lock engaged: {e}")
            return False

    def is_locked(self) -> bool:
        return self._locked

    def get_kernel(self) -> _types.MappingProxyType:
        if self._locked or self._kernel is None:
            raise RuntimeError("Kernel is locked or unavailable")
        return self._kernel

    def get_full_config(self) -> Optional[dict]:
        return self._full_config

    async def periodic_verify(self) -> None:
        while True:
            await asyncio.sleep(300)
            async with self._verify_lock:
                self.verify(force=True)
                if self._locked:
                    print("[KERNEL] Periodic re-verify: LOCKED — tamper detected.")
                else:
                    print("[KERNEL] Periodic re-verify: OK.")
            # Möbius Guard: check + auto-restore immutable core each cycle
            events = _check_immutable_core()
            if events:
                _log_interference_flashbulb(events)


_kernel_loader = IdentityKernelLoader()
_kernel_loader.verify()

IDENTITY_KERNEL = _types.MappingProxyType({})
try:
    IDENTITY_KERNEL = _kernel_loader.get_kernel()
    print(f"[SAGE] Identity kernel sealed: {IDENTITY_KERNEL['name']} / {IDENTITY_KERNEL['project_id']}")
except RuntimeError as e:
    print(f"[SAGE] WARNING: {e}. Chat endpoints will refuse requests.")
