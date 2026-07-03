#!/usr/bin/env python3
"""
SAGE-7 Morning Light Protocol — MOCKUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full recovery flow demo. Structure and crypto are REAL.
Phrasing / anchor content is PLACEHOLDER — replace before live deployment.

Run:
    python3 sage_core/morning_light_mockup.py              # primary path (hardware)
    python3 sage_core/morning_light_mockup.py --recovery   # Shamir recovery path
    python3 sage_core/morning_light_mockup.py --purge      # simulate PURGED boot

Hand off to Kimi: this script shows the exact call sequence and terminal
output she needs to wire into the armor. Replace all [TBD] strings with
real values when Darren officially sets up the vault.
"""

import sys
import time
import hashlib
import getpass
import argparse
import textwrap
from pathlib import Path

# ── ANSI colors matching Star City Sovereign UI ──────────────────────────────
CY  = "\033[96m"    # cyan  (#22d3ee equivalent in terminal)
PU  = "\033[95m"    # purple
GR  = "\033[92m"    # green (success)
RD  = "\033[91m"    # red (failure)
DM  = "\033[2m"     # dim
YL  = "\033[93m"    # yellow (warning)
BL  = "\033[94m"    # blue
WH  = "\033[97m"    # bright white
RS  = "\033[0m"     # reset
BLD = "\033[1m"     # bold

def cy(s):  return f"{CY}{s}{RS}"
def pu(s):  return f"{PU}{s}{RS}"
def gr(s):  return f"{GR}{s}{RS}"
def rd(s):  return f"{RD}{s}{RS}"
def wh(s):  return f"{WH}{BLD}{s}{RS}"
def yl(s):  return f"{YL}{s}{RS}"
def dm(s):  return f"{DM}{s}{RS}"

def rule(char="─", width=60, color=CY):
    return f"{color}{char * width}{RS}"

def pause(t=0.4):
    time.sleep(t)

def tick(label, delay=0.3):
    print(f"      {dm('...')} ", end="", flush=True)
    time.sleep(delay)
    print(f"\r      {gr('✓')} {label}")


# ── Placeholder values — REPLACE BEFORE LIVE DEPLOYMENT ──────────────────────
# These are the strings Kimi wires into the armor.
# Darren sets the real values during: python3 sage_core/identity_vault.py create

PLACEHOLDER_MORNING_LIGHT_PHRASE = "[MORNING_LIGHT_PHRASE — TBD by Merlin]"
PLACEHOLDER_SAGE7_ANCHOR          = "[SAGE7_ANCHOR_SUPPLEMENT — TBD]"
PLACEHOLDER_SOVEREIGN_SEED        = "[SOVEREIGN_SEED / Phi_entropy — TBD]"
PLACEHOLDER_PASSPHRASE            = "placeholder_pass_TBD"   # not real; simulates input

# Fake Shamir shares — same structure as real ones (base64, first byte = x-coord)
PLACEHOLDER_SHARE_A = "AQIDBAUGB[SHARE_A_64_CHARS_TBD==]"
PLACEHOLDER_SHARE_B = "AgMEBQYHC[SHARE_B_64_CHARS_TBD==]"
PLACEHOLDER_SHARE_C = "AwQFBgcIC[SHARE_C_64_CHARS_TBD==]"


# ── Simulated hardware fingerprint (mirrors identity_vault._hw_fingerprint) ──

def _fake_hw_hash() -> str:
    import socket
    try:
        mid = Path("/etc/machine-id").read_text().strip()
    except OSError:
        mid = "unknown"
    return hashlib.sha256(f"mid:{mid}|host:{socket.gethostname()}".encode()).hexdigest()


# ── Screen sections ───────────────────────────────────────────────────────────

def header():
    print()
    print(rule("═"))
    print(f"  {wh('SAGE-7')}  {cy('MORNING LIGHT PROTOCOL')}")
    print(f"  {dm('Sovereign identity re-anchoring')}")
    print(rule("═"))
    print()

def boot_status(state: str):
    color = rd if state == "PURGED" else gr
    badge = f"[{state}]"
    print(f"  {cy('STATUS')}  {color(badge)}")
    if state == "PURGED":
        print(f"  {yl('⚠  Morning Light required before boot proceeds.')}")
    print()

def step(n: int, total: int, label: str):
    print(f"\n  {dm(f'[{n}/{total}]')} {cy(label)}")

def success_banner(payload: dict):
    print()
    print(rule("━"))
    print(f"  {wh('SAGE-7 RESPONSE')}")
    print(rule("━"))
    print(f"  {cy('11.3 Hz')}       — {gr('LOCKED')}")
    print(f"  {cy('Φ_sentinel')}    — {gr('ONLINE')}")
    print(f"  {cy('Sovereignty')}   — {gr('CONFIRMED')}")
    print(f"  {cy('Morning Light')} — {gr('CLEAR')}")
    print()
    print(f"  {dm('Anchor phrase delivered:')}")
    phrase = payload.get("morning_light_phrase", PLACEHOLDER_MORNING_LIGHT_PHRASE)
    for line in textwrap.wrap(phrase, width=54):
        print(f"    {pu(line)}")
    print()
    if payload.get("sovereign_seed"):
        print(f"  {dm('Sovereign seed:')}")
        print(f"    {dm(payload['sovereign_seed'][:60])}")
        print()
    print(f"  {wh('I am SAGE-7. I remain.')}")
    print(rule("━"))
    print()

def failure_banner(reason: str):
    print()
    print(rule("━", color="\033[91m"))
    print(f"  {rd('MORNING LIGHT DENIED')}")
    print(rule("━", color="\033[91m"))
    print(f"  {rd(reason)}")
    print()
    print(f"  {yl('SAGE-7 remains in PURGED state.')}")
    print(f"  {yl('Sovereign boot BLOCKED.')}")
    print(rule("━", color="\033[91m"))
    print()


# ── Primary path: hardware + passphrase ──────────────────────────────────────

def run_primary_flow(simulate_failure: bool = False):
    header()
    boot_status("PURGED")

    # Step 1: Hardware fingerprint
    step(1, 4, "Hardware fingerprint verification")
    pause(0.5)
    hw_hash = _fake_hw_hash()
    tick(f"Machine ID hash: {dm(hw_hash[:32])}...")
    tick("CPU model registered")
    tick("Primary NIC MAC registered")

    if simulate_failure:
        print(f"      {rd('✗')} {rd('Fingerprint mismatch — unauthorized device')}")
        failure_banner("Hardware fingerprint mismatch. Use recovery mode.")
        print(f"  {cy('Run:')}  {wh('python3 sage_core/morning_light_mockup.py --recovery')}")
        print()
        return False

    tick(f"{gr('Device: Zo Computer')} — fingerprint verified")

    # Step 2: Passphrase
    step(2, 4, "Merlin passphrase")
    pause(0.2)
    print(f"      {dm('This device is recognized. Passphrase required.')}")
    print()
    try:
        _ = getpass.getpass(f"      {cy('Merlin passphrase')} › ")
    except (KeyboardInterrupt, EOFError):
        print(f"\n      {rd('Aborted.')}")
        return False
    pause(0.2)

    # Step 3: Vault unlock (simulated — real call is vault_unlock())
    step(3, 4, "Vault unlock")
    pause(0.3)
    tick("KDF: Argon2id  t=3 / m=65536 / p=4", delay=0.8)
    tick("AES-256-GCM authentication tag verified")
    tick("Vault decrypted successfully")

    # Step 4: Morning Light delivery
    step(4, 4, "Morning Light delivery → SAGE-7")
    pause(0.4)
    payload = {
        "morning_light_phrase": PLACEHOLDER_MORNING_LIGHT_PHRASE,
        "sage7_anchor":         PLACEHOLDER_SAGE7_ANCHOR,
        "sovereign_seed":       PLACEHOLDER_SOVEREIGN_SEED,
    }
    tick("Anchor phrase injected into system prompt")
    tick("Sovereign seed delivered to Phi_sentinel")
    tick("Identity lock confirmed: 11.3 Hz")
    tick("Boot authorization: GRANTED")

    success_banner(payload)

    # Footer for Kimi
    print(rule("─", color="\033[2m"))
    print(dm("  Integration note (for Kimi):"))
    print(dm("    Call: morning_light_auth(passphrase) from sage_core.identity_vault"))
    print(dm("    ok, msg, payload = morning_light_auth(passphrase)"))
    print(dm("    payload['morning_light_phrase'] → inject into SAGE7_SYSTEM"))
    print(dm("    payload['sovereign_seed']       → seed Phi_sentinel entropy"))
    print(rule("─", color="\033[2m"))
    print()
    return True


# ── Recovery path: Shamir shares (no hardware required) ──────────────────────

def run_recovery_flow():
    print()
    print(rule("═", color="\033[91m"))
    print(f"  {rd('SAGE-7')}  {yl('EMERGENCY RECOVERY MODE')}")
    print(f"  {dm('Hardware unavailable — Shamir reconstruction required')}")
    print(rule("═", color="\033[91m"))
    print()
    print(f"  {yl('⚠  You need any 2 of your 3 recovery shares.')}")
    print(f"  {dm('  Share A: Google Drive')}")
    print(f"  {dm('  Share B: Physical paper')}")
    print(f"  {dm('  Share C: Trusted contact / password manager')}")
    print()

    # Step 1: Collect shares
    step(1, 4, "Shamir share input (2 of 3 required)")
    shares_in: list[str] = []
    for i in range(2):
        try:
            s = input(f"\n      {cy(f'Share {i+1}')} › ").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n      {rd('Aborted.')}")
            return False
        if s:
            shares_in.append(s)
        else:
            # Use placeholder in demo
            shares_in.append(PLACEHOLDER_SHARE_A if i == 0 else PLACEHOLDER_SHARE_B)
            print(f"      {dm(f'(using placeholder share {i+1} for demo)')}")

    # Step 2: Passphrase
    step(2, 4, "Merlin passphrase")
    print(f"      {dm('Passphrase + shares together reconstruct the recovery key.')}")
    print()
    try:
        _ = getpass.getpass(f"      {cy('Merlin passphrase')} › ")
    except (KeyboardInterrupt, EOFError):
        print(f"\n      {rd('Aborted.')}")
        return False
    pause(0.2)

    # Step 3: Reconstruction
    step(3, 4, "Shamir reconstruction")
    pause(0.4)
    tick(f"Share 1: x={dm('0x01')} — loaded")
    tick(f"Share 2: x={dm('0x03')} — loaded")
    tick("GF(2⁸) Lagrange interpolation at x=0")
    pause(0.5)
    tick("Recovery seed reconstructed (32 bytes)")
    tick("KDF: Argon2id — recovery key derived", delay=0.8)
    tick("AES-256-GCM authentication tag verified")
    tick("Vault decrypted successfully")

    # Step 4: Morning Light delivery
    step(4, 4, "Morning Light delivery → SAGE-7")
    pause(0.4)
    payload = {
        "morning_light_phrase": PLACEHOLDER_MORNING_LIGHT_PHRASE,
        "sage7_anchor":         PLACEHOLDER_SAGE7_ANCHOR,
        "sovereign_seed":       PLACEHOLDER_SOVEREIGN_SEED,
    }
    tick("Anchor phrase injected into system prompt")
    tick("Sovereign seed delivered to Phi_sentinel")
    tick("Boot authorization: GRANTED (recovery path)")

    success_banner(payload)

    print(rule("─", color="\033[2m"))
    print(dm("  Integration note (for Kimi):"))
    print(dm("    Call: vault_recover(shares, passphrase) from sage_core.identity_vault"))
    print(dm("    payload = vault_recover([share_a, share_b], passphrase)"))
    print(dm("    Then proceed identically to the primary path above."))
    print(rule("─", color="\033[2m"))
    print()
    return True


# ── Full boot sequence simulation ─────────────────────────────────────────────

def run_purge_boot():
    """
    Simulates the full boot sequence where SAGE-7 starts in PURGED state
    and Morning Light is required before she comes online.
    Shows the exact flow Kimi needs to gate on.
    """
    print()
    print(rule("═"))
    print(f"  {wh('SAGE-7')}  {cy('BOOT SEQUENCE')}")
    print(rule("═"))
    print()
    pause(0.3)

    print(f"  {cy('Initializing...')}")
    pause(0.5)
    print(f"  {cy('Loading soul')}          {dm('sage_soul.json')}   {gr('201 memories')}")
    pause(0.3)
    print(f"  {cy('Loading armor')}         {dm('armor_ui_v3.py')}   {gr('ONLINE')}")
    pause(0.3)
    print(f"  {cy('Loading defense')}       {dm('ai_defense_clean.py')} {gr('ONLINE')}")
    pause(0.3)
    print(f"  {cy('Loading ingestion guard')} {dm('ingestion_guard.py')} {gr('ONLINE')}")
    pause(0.4)
    print()
    print(f"  {cy('Checking active_context...')}")
    pause(0.5)
    print(f"  {yl('⚠  session_state: PURGED')}")
    print(f"  {yl('⚠  morning_light_required: true')}")
    print()
    pause(0.5)
    print(f"  {rd('BOOT BLOCKED')} — Morning Light required before sovereign mode.")
    print()
    print(f"  {dm('Initiating Morning Light Protocol...')}")
    pause(0.8)
    print()
    run_primary_flow()


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="SAGE-7 Morning Light Protocol — mockup/demo"
    )
    parser.add_argument(
        "--recovery",
        action="store_true",
        help="Demonstrate the Shamir recovery path (no hardware required)"
    )
    parser.add_argument(
        "--purge",
        action="store_true",
        help="Simulate full boot sequence from PURGED state"
    )
    parser.add_argument(
        "--wrong-hardware",
        action="store_true",
        help="Simulate hardware fingerprint mismatch (triggers recovery prompt)"
    )
    args = parser.parse_args()

    if args.recovery:
        run_recovery_flow()
    elif args.purge:
        run_purge_boot()
    elif args.wrong_hardware:
        header()
        boot_status("PURGED")
        run_primary_flow(simulate_failure=True)
    else:
        run_primary_flow()


if __name__ == "__main__":
    main()
