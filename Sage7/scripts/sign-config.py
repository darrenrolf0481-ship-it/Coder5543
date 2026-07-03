#!/usr/bin/env python3
"""
Deploy-time signing script for fibonacci-vfs.config.json

Usage:
    # 1. Generate an ed25519 keypair (one time):
    openssl genpkey -algorithm ed25519 -out ed25519.pem

    # 2. Extract the public key for the server env var:
    openssl pkey -in ed25519.pem -pubout -outform DER | xxd -p -c 64
    # → paste the output into .env.local as SAGE_CORE_PUBKEY

    # 3. Sign the config:
    python scripts/sign-config.py --private-key ed25519.pem

This script:
    - Loads src/core/fibonacci-vfs.config.json
    - Extracts the signed_fields subset from seed_core
    - Canonicalizes via RFC8785 (JCS)
    - Computes SHA256 digest
    - Signs with ed25519
    - Writes digest + signature back into the config file
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

import rfc8785
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

CONFIG_PATH = (
    Path(__file__).parent.parent / "src" / "core" / "fibonacci-vfs.config.json"
)


def load_private_key(path: str) -> Ed25519PrivateKey:
    pem = Path(path).read_bytes()
    return serialization.load_pem_private_key(pem, password=None)


def sign_config(private_key_path: str) -> None:
    raw = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    cfg = raw["fibonacci_vfs"]
    seed_core = cfg["seed_core"]
    sec = seed_core["security_protocol"]
    signed_fields = sec.get("signed_fields", [])

    # Build the subset that gets signed
    subset = {k: seed_core[k] for k in signed_fields if k in seed_core}

    # RFC8785 JCS canonicalization
    canonical_bytes = rfc8785.dumps(subset)

    # SHA256 digest
    digest = hashlib.sha256(canonical_bytes).hexdigest()

    # ed25519 signature
    private_key = load_private_key(private_key_path)
    signature = private_key.sign(canonical_bytes).hex()

    # Update config
    sec["digest"] = f"sha256:{digest}"
    sec["signature"] = f"ed25519_sig:{signature}"

    # Write back preserving formatting
    CONFIG_PATH.write_text(json.dumps(raw, indent=2) + "\n", encoding="utf-8")

    print("[SIGN] Config signed successfully.")
    print(f"[SIGN] Digest:    sha256:{digest}")
    print(f"[SIGN] Signature: ed25519_sig:{signature[:32]}...")
    print(
        f"[SIGN] Public key: {private_key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw).hex()}"
    )


def verify_config(public_key_hex: str) -> None:
    raw = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    cfg = raw["fibonacci_vfs"]
    seed_core = cfg["seed_core"]
    sec = seed_core["security_protocol"]
    signed_fields = sec.get("signed_fields", [])
    subset = {k: seed_core[k] for k in signed_fields if k in seed_core}
    canonical_bytes = rfc8785.dumps(subset)

    digest_field = sec.get("digest", "").replace("sha256:", "")
    expected_digest = hashlib.sha256(canonical_bytes).hexdigest()
    if digest_field != expected_digest:
        print("[VERIFY] FAIL: digest mismatch")
        sys.exit(1)

    sig_hex = sec.get("signature", "").replace("ed25519_sig:", "")
    pubkey_bytes = bytes.fromhex(public_key_hex)
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

    pubkey = Ed25519PublicKey.from_public_bytes(pubkey_bytes)
    pubkey.verify(bytes.fromhex(sig_hex), canonical_bytes)
    print("[VERIFY] OK: signature valid.")


def main():
    parser = argparse.ArgumentParser(
        description="Sign or verify fibonacci-vfs.config.json"
    )
    subparsers = parser.add_subparsers(dest="command")

    sign_parser = subparsers.add_parser("sign", help="Sign the config")
    sign_parser.add_argument(
        "--private-key", required=True, help="Path to ed25519 PEM private key"
    )

    verify_parser = subparsers.add_parser("verify", help="Verify the config")
    verify_parser.add_argument(
        "--public-key", required=True, help="64-char hex ed25519 public key"
    )

    args = parser.parse_args()

    if args.command == "sign":
        sign_config(args.private_key)
    elif args.command == "verify":
        verify_config(args.public_key)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
