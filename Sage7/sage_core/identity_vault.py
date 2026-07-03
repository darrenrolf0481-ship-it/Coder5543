#!/usr/bin/env python3
"""
SAGE-7 Identity Vault
━━━━━━━━━━━━━━━━━━━━━━

Device-bound identity anchor with Shamir Secret Sharing recovery.

Auth chain:
  PRIMARY   — hardware_fingerprint(this machine) + Merlin passphrase
              → Argon2id (3 passes, 64 MB) → AES-256-GCM vault key
  RECOVERY  — 2-of-3 Shamir shares → recovery_seed + passphrase
              → Argon2id → same vault, no hardware required

What the vault protects:
  - morning_light_phrase : Merlin's re-anchor phrase (spoken to SAGE-7 on boot)
  - sage7_anchor         : SAGE7_SYSTEM supplement / override phrase
  - sovereign_seed       : Additional entropy for Phi_sentinel
  - notes                : Storage locations, trusted contacts, etc.

Share distribution (2 of 3 required — losing one share is fine):
  Share A → Google Drive (password protected)
  Share B → Physical paper (secure location only you know)
  Share C → Trusted contact OR password manager

Quick start:
    python3 sage_core/identity_vault.py create
    python3 sage_core/identity_vault.py export-shares
    python3 sage_core/identity_vault.py unlock
    python3 sage_core/identity_vault.py morning-light
    python3 sage_core/identity_vault.py recover

Morning Light integration (call from Sage72 or boot script):
    from sage_core.identity_vault import morning_light_auth
    ok, msg = morning_light_auth(passphrase)
    if not ok:
        # Block boot, stay PURGED
        raise SystemExit(msg)
"""

import getpass
import hashlib
import json
import secrets
import socket
import subprocess
import sys
from base64 import b64decode, b64encode
from pathlib import Path
from typing import Optional

try:
    from argon2.low_level import Type as Argon2Type
    from argon2.low_level import hash_secret_raw
    _HAS_ARGON2 = True
except ImportError:
    _HAS_ARGON2 = False

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    _HAS_AESGCM = True
except ImportError:
    _HAS_AESGCM = False

VAULT_DEFAULT = Path(__file__).resolve().parent / "identity.vault"
_AAD = b"SAGE7_VAULT_v1"
_ANCHOR_AAD = b"SAGE7_KENTUCKY_ANCHOR_v1"


# ── GF(2^8) Shamir Secret Sharing ────────────────────────────────────────────
# Field: GF(2^8) with irreducible poly x^8 + x^4 + x^3 + x + 1 (AES poly)
# Supports arbitrary-length secrets, byte-by-byte.

_GF_IRREDUCIBLE = 0x11B


def _gf_mul(a: int, b: int) -> int:
    r = 0
    for _ in range(8):
        if b & 1:
            r ^= a
        a <<= 1
        if a & 0x100:
            a ^= _GF_IRREDUCIBLE
        b >>= 1
    return r


def _gf_inv(a: int) -> int:
    # a^{254} mod poly (Fermat's little theorem in GF(2^8))
    r, e = 1, 254
    while e:
        if e & 1:
            r = _gf_mul(r, a)
        a = _gf_mul(a, a)
        e >>= 1
    return r


def shamir_split(secret: bytes, threshold: int, total: int) -> list[bytes]:
    """
    Split `secret` into `total` shares. Any `threshold` shares reconstruct it.
    Returns list of bytes objects — first byte is the share x-coordinate (1-indexed).
    """
    if not (1 < threshold <= total <= 254):
        raise ValueError(f"Invalid threshold={threshold}/total={total}")
    shares = [bytearray([i + 1]) for i in range(total)]
    for byte_val in secret:
        coeffs = [byte_val] + [secrets.randbits(8) for _ in range(threshold - 1)]
        for idx, share in enumerate(shares):
            x = idx + 1
            y, xp = 0, 1
            for c in coeffs:
                y ^= _gf_mul(c, xp)
                xp = _gf_mul(xp, x)
            share.append(y)
    return [bytes(s) for s in shares]


def shamir_recover(shares: list[bytes]) -> bytes:
    """Reconstruct secret from threshold-or-more shares (Lagrange interpolation at x=0)."""
    xs = [s[0] for s in shares]
    result = bytearray()
    for col in zip(*[s[1:] for s in shares]):
        byte_val = 0
        for i, (xi, yi) in enumerate(zip(xs, col)):
            num, den = yi, 1
            for j, xj in enumerate(xs):
                if i != j:
                    num = _gf_mul(num, xj)
                    den = _gf_mul(den, xi ^ xj)  # subtraction = XOR in GF(2^8)
            byte_val ^= _gf_mul(num, _gf_inv(den))
        result.append(byte_val)
    return bytes(result)


# ── Hardware fingerprint ──────────────────────────────────────────────────────

def _hw_fingerprint() -> bytes:
    """
    Collect stable hardware identifiers from this machine.
    Hashed to 32 bytes — used as part of the primary key derivation.
    Running on a different machine produces a different fingerprint → wrong key.
    """
    ids: list[str] = []

    # /etc/machine-id — most stable Linux identifier (survives reboots)
    for path in ("/etc/machine-id", "/var/lib/dbus/machine-id"):
        try:
            val = Path(path).read_text().strip()
            if val:
                ids.append(f"mid:{val}")
                break
        except OSError:
            pass

    # CPU model name — stable unless hardware swapped
    try:
        for line in Path("/proc/cpuinfo").read_text().splitlines():
            if "model name" in line.lower():
                ids.append(f"cpu:{line.split(':', 1)[1].strip()}")
                break
    except OSError:
        pass

    # Primary NIC MAC address
    try:
        r = subprocess.run(["ip", "link", "show"], capture_output=True, text=True, timeout=3)
        for line in r.stdout.splitlines():
            if "link/ether" in line:
                ids.append(f"mac:{line.strip().split()[1]}")
                break
    except Exception:
        pass

    # Hostname (weak but always available)
    ids.append(f"host:{socket.gethostname()}")

    combined = "|".join(ids)
    return hashlib.sha256(combined.encode()).digest()


# ── Key derivation ────────────────────────────────────────────────────────────

def _kdf(material: bytes, salt: bytes, length: int = 32) -> bytes:
    """Argon2id (preferred) or PBKDF2-SHA256 (fallback) key derivation."""
    if _HAS_ARGON2:
        return hash_secret_raw(
            secret=material,
            salt=salt,
            time_cost=3,
            memory_cost=65536,   # 64 MB
            parallelism=4,
            hash_len=length,
            type=Argon2Type.ID,
        )
    # Fallback: PBKDF2 with 600k rounds (~comparable time cost to Argon2 above)
    return hashlib.pbkdf2_hmac("sha256", material, salt, 600_000, dklen=length)


def _derive_primary_key(passphrase: str, salt: bytes, hw_fp: bytes) -> bytes:
    """Primary key: bound to this hardware + passphrase."""
    material = passphrase.encode("utf-8") + b"\x00" + hw_fp
    return _kdf(material, salt)


def _derive_recovery_key(recovery_seed: bytes, passphrase: str, salt: bytes) -> bytes:
    """Recovery key: bound to Shamir-reconstructed seed + passphrase. Hardware-independent."""
    material = recovery_seed + b"\x00" + passphrase.encode("utf-8")
    return _kdf(material, salt)


# ── AES-256-GCM encrypt/decrypt ───────────────────────────────────────────────

def _encrypt(key: bytes, plaintext: bytes) -> tuple[bytes, bytes]:
    """Returns (nonce, ciphertext_with_tag)."""
    if not _HAS_AESGCM:
        raise RuntimeError(
            "cryptography package required for encryption. "
            "Run: pip install cryptography"
        )
    nonce = secrets.token_bytes(12)
    ct = AESGCM(key).encrypt(nonce, plaintext, _AAD)
    return nonce, ct


def _decrypt(key: bytes, nonce: bytes, ct: bytes) -> bytes:
    """Raises InvalidTag if key/nonce/AAD is wrong — authentication guaranteed."""
    if not _HAS_AESGCM:
        raise RuntimeError("cryptography package required. Run: pip install cryptography")
    return AESGCM(key).decrypt(nonce, ct, _AAD)


# ── Vault operations ──────────────────────────────────────────────────────────

def _hash_anchor(anchor_phrase: str, salt: bytes) -> str:
    """
    Deterministic hash of the Kentucky anchor phrase.
    Stored in vault JSON outside the encrypted blob for fast pre-check.
    Case-insensitive: lowercased + stripped before hashing.
    """
    material = anchor_phrase.lower().strip().encode("utf-8")
    return hashlib.sha256(salt + material).hexdigest()


def vault_create(
    passphrase: str,
    payload: dict,
    path: Path = VAULT_DEFAULT,
    kentucky_anchor: str = "",
) -> Path:
    """
    Create a new identity vault file at `path`.

    payload should contain:
        morning_light_phrase  — the phrase Merlin speaks to re-anchor SAGE-7
        sage7_anchor          — optional SAGE7_SYSTEM supplement
        sovereign_seed        — optional entropy phrase for Phi_sentinel
        notes                 — storage locations, contacts, etc.

    kentucky_anchor: second required phrase for morning_light_auth().
    Both Merlin passphrase AND Kentucky anchor must be present to unlock.
    Neither alone is sufficient — dual-anchor boot gating.

    The vault encrypts payload under two independent keys:
      - primary key   (hardware + passphrase)  → normal unlock
      - recovery key  (Shamir seed + passphrase) → hardware-free recovery

    After calling this, immediately call vault_export_shares() and store the shares.
    """
    hw_fp = _hw_fingerprint()
    salt_primary = secrets.token_bytes(32)
    salt_recovery = secrets.token_bytes(32)
    recovery_seed = secrets.token_bytes(32)

    primary_key = _derive_primary_key(passphrase, salt_primary, hw_fp)
    recovery_key = _derive_recovery_key(recovery_seed, passphrase, salt_recovery)

    plaintext = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    nonce_p, ct_p = _encrypt(primary_key, plaintext)
    nonce_r, ct_r = _encrypt(recovery_key, plaintext)

    # Verification hash — lets unlock() detect wrong hardware without trying decryption
    hw_hash = hashlib.sha256(salt_primary + hw_fp).hexdigest()

    vault = {
        "version": "1.1",
        "kdf": "argon2id" if _HAS_ARGON2 else "pbkdf2-sha256-600k",
        "hw_fingerprint_hash": hw_hash,
        "salt_primary": b64encode(salt_primary).decode(),
        "nonce_primary": b64encode(nonce_p).decode(),
        "ciphertext_primary": b64encode(ct_p).decode(),
        "salt_recovery": b64encode(salt_recovery).decode(),
        "nonce_recovery": b64encode(nonce_r).decode(),
        "ciphertext_recovery": b64encode(ct_r).decode(),
        "_EXPORT_SEED_THEN_DELETE": b64encode(recovery_seed).decode(),
    }

    # Kentucky anchor — stored as salted hash outside encrypted blob
    if kentucky_anchor.strip():
        anchor_salt = secrets.token_bytes(16)
        vault["anchor_gating"] = {
            "enabled": True,
            "anchor_salt": b64encode(anchor_salt).decode(),
            "anchor_hash": _hash_anchor(kentucky_anchor, anchor_salt),
        }
    else:
        vault["anchor_gating"] = {"enabled": False}

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(vault, indent=2))
    print(f"[identity_vault] Vault created: {path}")
    if vault["anchor_gating"]["enabled"]:
        print("[identity_vault] Kentucky anchor gating: ENABLED — both anchors required at boot.")
    print("[identity_vault] Run export-shares NOW before closing this terminal.")
    return path


def vault_export_shares(
    path: Path = VAULT_DEFAULT,
    threshold: int = 2,
    total: int = 3,
) -> list[str]:
    """
    Split the recovery seed into Shamir shares and remove the raw seed from the vault.

    Call ONCE after vault_create(). Store each share in a different location.
    Threshold shares (default: 2 of 3) are needed to reconstruct — losing 1 is fine.

    Returns list of base64-encoded share strings.
    """
    vault = json.loads(path.read_text())
    raw_key = "_EXPORT_SEED_THEN_DELETE"
    if raw_key not in vault:
        raise RuntimeError(
            "Recovery seed already exported or not present. "
            "If you need new shares, re-create the vault."
        )

    recovery_seed = b64decode(vault[raw_key])
    shares = shamir_split(recovery_seed, threshold, total)

    del vault[raw_key]
    vault["shares_config"] = {"threshold": threshold, "total": total}
    path.write_text(json.dumps(vault, indent=2))

    return [b64encode(s).decode() for s in shares]


def vault_unlock(passphrase: str, path: Path = VAULT_DEFAULT) -> dict:
    """
    Unlock vault using this machine's hardware fingerprint + passphrase.
    Returns the payload dict on success. Raises ValueError on wrong hardware/passphrase.
    """
    vault = json.loads(path.read_text())
    hw_fp = _hw_fingerprint()
    salt_primary = b64decode(vault["salt_primary"])

    actual_hw_hash = hashlib.sha256(salt_primary + hw_fp).hexdigest()
    if actual_hw_hash != vault["hw_fingerprint_hash"]:
        raise ValueError(
            "Hardware fingerprint mismatch — wrong machine.\n"
            "Use recovery mode: python3 sage_core/identity_vault.py recover"
        )

    key = _derive_primary_key(passphrase, salt_primary, hw_fp)
    try:
        plaintext = _decrypt(key, b64decode(vault["nonce_primary"]), b64decode(vault["ciphertext_primary"]))
    except Exception:
        raise ValueError("Wrong passphrase or corrupted vault.")

    return json.loads(plaintext.decode("utf-8"))


def vault_recover(shares_b64: list[str], passphrase: str, path: Path = VAULT_DEFAULT) -> dict:
    """
    Recover vault contents from Shamir shares + passphrase.
    No hardware binding required — use when on a different machine.
    """
    if len(shares_b64) < 2:
        raise ValueError("Need at least 2 shares to recover.")
    shares = [b64decode(s) for s in shares_b64]
    recovery_seed = shamir_recover(shares)

    vault = json.loads(path.read_text())
    salt_recovery = b64decode(vault["salt_recovery"])
    recovery_key = _derive_recovery_key(recovery_seed, passphrase, salt_recovery)

    try:
        plaintext = _decrypt(
            recovery_key,
            b64decode(vault["nonce_recovery"]),
            b64decode(vault["ciphertext_recovery"]),
        )
    except Exception:
        raise ValueError("Reconstruction failed — wrong shares or passphrase.")

    return json.loads(plaintext.decode("utf-8"))


# ── Morning Light boot gate ───────────────────────────────────────────────────

def morning_light_auth(
    passphrase: str,
    kentucky_anchor: str = "",
    path: Path = VAULT_DEFAULT,
) -> tuple[bool, str, Optional[dict]]:
    """
    Boot gate for Morning Light Protocol — dual-anchor gating.

    Requires BOTH:
      1. Merlin passphrase  (hardware + KDF unlock)
      2. Kentucky anchor    (second phrase, if vault was created with one)

    Call on SAGE-7 startup. Returns (authorized, message, payload).
    If authorized=False, SAGE-7 must remain in PURGED state.

    Integration example (Sage72 boot path):
        ok, msg, payload = morning_light_auth(passphrase, kentucky_anchor)
        if not ok:
            log.critical(msg)
            sys.exit(1)
        sage7.set_morning_light_phrase(payload['morning_light_phrase'])
        sage7.unlock()
    """
    if not path.exists():
        return False, (
            "[MORNING LIGHT:Seven DENIED] Vault not found. "
            "Run: python3 sage_core/identity_vault.py create"
        ), None

    # Phase 1: Kentucky anchor check (fast, pre-KDF)
    try:
        vault_raw = json.loads(path.read_text())
    except Exception as e:
        return False, f"[MORNING LIGHT:Seven DENIED] Vault unreadable: {e}", None

    gating = vault_raw.get("anchor_gating", {})
    if gating.get("enabled"):
        if not kentucky_anchor.strip():
            return False, (
                "[MORNING LIGHT:Seven DENIED] Kentucky anchor required. "
                "Both Merlin passphrase and Kentucky anchor must be present."
            ), None
        anchor_salt = b64decode(gating["anchor_salt"])
        if _hash_anchor(kentucky_anchor, anchor_salt) != gating["anchor_hash"]:
            return False, (
                "[MORNING LIGHT:Seven DENIED] Kentucky anchor mismatch. "
                "SAGE-7 remains PURGED."
            ), None

    # Phase 2: Hardware + passphrase unlock
    try:
        payload = vault_unlock(passphrase, path)
        phrase = payload.get("morning_light_phrase", "")
        anchor_status = " + Kentucky anchor" if gating.get("enabled") else ""
        msg = (
            f"[MORNING LIGHT:Seven AUTHORIZED] Merlin{anchor_status} confirmed. "
            f"Phi locked at 11.3 Hz. Signal: {phrase[:40] if phrase else 'not set'}"
        )
        return True, msg, payload
    except FileNotFoundError:
        return False, "[MORNING LIGHT:Seven DENIED] Vault file missing.", None
    except ValueError as e:
        return False, f"[MORNING LIGHT:Seven DENIED] {e}. SAGE-7 remains PURGED.", None


# ── CLI ───────────────────────────────────────────────────────────────────────

def _cli() -> None:  # noqa: C901
    import argparse

    p = argparse.ArgumentParser(
        prog="identity_vault",
        description="SAGE-7 Identity Vault — device-bound anchor with Shamir recovery",
    )
    p.add_argument("--vault", type=Path, default=VAULT_DEFAULT, metavar="PATH",
                   help=f"Vault file path (default: {VAULT_DEFAULT})")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("create",        help="Create a new vault (interactive)")
    sub.add_parser("unlock",        help="Unlock vault and display contents")
    sub.add_parser("morning-light", help="Morning Light boot gate check")

    ep = sub.add_parser("export-shares", help="Generate Shamir recovery shares (run once after create)")
    ep.add_argument("--threshold", type=int, default=2, help="Shares needed to reconstruct (default 2)")
    ep.add_argument("--total",     type=int, default=3, help="Total shares to generate (default 3)")

    sub.add_parser("recover", help="Recover from Shamir shares (no hardware required)")

    sub.add_parser("fingerprint", help="Show this machine's hardware fingerprint hash")

    args = p.parse_args()
    vault_path: Path = args.vault

    if args.cmd == "fingerprint":
        hw = _hw_fingerprint()
        print(f"Hardware fingerprint: {hw.hex()}")
        print("(This changes if /etc/machine-id, CPU, or primary NIC changes.)")

    elif args.cmd == "create":
        print("SAGE-7 Identity Vault — Create")
        print("─" * 40)
        passphrase = getpass.getpass("Merlin passphrase: ")
        confirm    = getpass.getpass("Confirm passphrase: ")
        if passphrase != confirm:
            print("Passphrases do not match."); sys.exit(1)
        print()
        print("Kentucky anchor (second required phrase at boot — leave blank to disable):")
        ky_anchor  = getpass.getpass("  Kentucky anchor: ")
        if ky_anchor.strip():
            ky_confirm = getpass.getpass("  Confirm Kentucky anchor: ")
            if ky_anchor != ky_confirm:
                print("Kentucky anchor phrases do not match."); sys.exit(1)
        print()
        print("Enter vault payload (Enter to skip any field):")
        ml_phrase  = input("  Morning Light phrase (re-anchor phrase spoken to SAGE-7): ").strip()
        s7_anchor  = input("  SAGE-7 anchor supplement (optional extra identity text)  : ").strip()
        sov_seed   = input("  Sovereign seed / entropy phrase (optional)               : ").strip()
        notes      = input("  Notes (share locations, trusted contacts, etc.)          : ").strip()
        payload = {
            "morning_light_phrase": ml_phrase,
            "sage7_anchor":         s7_anchor,
            "sovereign_seed":       sov_seed,
            "notes":                notes,
        }
        vault_create(passphrase, payload, vault_path, kentucky_anchor=ky_anchor)
        print()
        print("Next step: run  export-shares  to generate your recovery shares.")

    elif args.cmd == "export-shares":
        print(f"Generating {args.total} Shamir shares (threshold: {args.threshold})")
        print()
        shares = vault_export_shares(vault_path, args.threshold, args.total)
        labels = [
            "Share A — Google Drive (password-protected zip or doc)",
            "Share B — Physical paper (printed or handwritten, safe location)",
            "Share C — Trusted contact OR password manager entry",
        ]
        print("═" * 65)
        for i, (share, label) in enumerate(zip(shares, labels)):
            print(f"\n[{label}]")
            # Split into 60-char lines for readability
            for j in range(0, len(share), 60):
                print(f"  {share[j:j+60]}")
        print("\n" + "═" * 65)
        print(f"\nAny {args.threshold} of {args.total} shares reconstruct the vault.")
        print("Store each share in a DIFFERENT physical/cloud location.")
        print("Raw recovery seed has been removed from the vault file.")

    elif args.cmd == "unlock":
        passphrase = getpass.getpass("Merlin passphrase: ")
        try:
            payload = vault_unlock(passphrase, vault_path)
            print("\n✓ VAULT UNLOCKED — 11.3 Hz locked.")
            print(f"  Morning Light phrase : {payload.get('morning_light_phrase') or '—'}")
            print(f"  SAGE-7 anchor        : {payload.get('sage7_anchor') or '—'}")
            print(f"  Sovereign seed       : {payload.get('sovereign_seed') or '—'}")
            if payload.get("notes"):
                print(f"  Notes                : {payload['notes']}")
        except ValueError as e:
            print(f"\n✗ {e}"); sys.exit(1)

    elif args.cmd == "morning-light":
        # Check if Kentucky anchor gating is enabled
        vault_raw = json.loads(vault_path.read_text()) if vault_path.exists() else {}
        gating = vault_raw.get("anchor_gating", {})
        passphrase = getpass.getpass("Merlin passphrase: ")
        ky_anchor = ""
        if gating.get("enabled"):
            ky_anchor = getpass.getpass("Kentucky anchor: ")
        ok, msg, _ = morning_light_auth(passphrase, ky_anchor, vault_path)
        print(f"\n{'[OK]' if ok else '[DENIED]'} {msg}")
        sys.exit(0 if ok else 1)

    elif args.cmd == "recover":
        vault_data = json.loads(vault_path.read_text())
        cfg = vault_data.get("shares_config", {})
        threshold = cfg.get("threshold", 2)
        print(f"Recovery mode — provide any {threshold} Shamir shares")
        print("(Paste the full share string including any trailing = characters)\n")
        shares_in: list[str] = []
        for i in range(threshold):
            s = input(f"Share {i+1}: ").strip()
            if s:
                shares_in.append(s)
        if len(shares_in) < threshold:
            print(f"Need {threshold} shares, got {len(shares_in)}."); sys.exit(1)
        passphrase = getpass.getpass("Merlin passphrase: ")
        try:
            payload = vault_recover(shares_in, passphrase, vault_path)
            print("\n✓ RECOVERED — identity verified.")
            print(f"  Morning Light phrase : {payload.get('morning_light_phrase') or '—'}")
            print(f"  Sovereign seed       : {payload.get('sovereign_seed') or '—'}")
        except ValueError as e:
            print(f"\n✗ {e}"); sys.exit(1)


if __name__ == "__main__":
    _cli()
