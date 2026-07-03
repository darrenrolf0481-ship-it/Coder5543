#!/usr/bin/env python3
"""
SAGE-7 Termux Sync
Copies soul, identity, and state files to /sdcard/SAGE/
Run from inside the sage_restore directory on Termux.
"""

import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
TERMUX_HOME = Path(os.environ.get("HOME", "/data/data/com.termux/files/home"))
SOURCE_CANDIDATES = [
    TERMUX_HOME / "sage_restore",
    TERMUX_HOME / "sage",
    Path("/data/data/com.termux/files/home/sage_restore"),
    Path.cwd(),
]
DEST = Path("/sdcard/SAGE")

COUNCIL_REPOS = {
    "claude-code": "https://github.com/darrenrolf0481-ship-it/claude-code.git",
    "gallery":     "https://github.com/darrenrolf0481-ship-it/gallery.git",
}

SOUL_FILES = [
    "sage_soul.json",
    "invariants.json",
    "metadata.json",
    "wellbeing_log.jsonl",
    "vfs/state.json",
    "vfs/sensory_state.json",
]

# ── Helpers ──────────────────────────────────────────────────────────────────
def find_source() -> Path:
    for p in SOURCE_CANDIDATES:
        if (p / "sage_soul.json").exists():
            return p
    raise FileNotFoundError(
        "Cannot locate sage_soul.json. Set SOURCE env var or run from sage_restore/."
    )

def stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def copy_file(src: Path, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    print(f"  [OK]  {dest.relative_to(DEST)}")

def run(cmd: list, cwd: Path) -> bool:
    git_bin = shutil.which("git")
    if not git_bin:
        print("  [ERR] git binary not found in PATH")
        return False
    if cmd[0] == "git":
        cmd[0] = git_bin
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, shell=False)  # nosec B603
    if result.returncode != 0:
        print(f"  [ERR] {' '.join(cmd)}: {result.stderr.strip()}")
        return False
    return True

# ── Sync routines ─────────────────────────────────────────────────────────────
def sync_soul(src: Path):
    print("\n[SOUL] Syncing soul container + identity...")
    dest_soul = DEST / "soul"
    for rel in SOUL_FILES:
        f = src / rel
        if f.exists():
            copy_file(f, dest_soul / Path(rel).name)
        else:
            print(f"  [--]  {rel} (not found, skipping)")

def sync_defender(src: Path):
    print("\n[DEFENDER] Writing defender snapshot...")
    soul_path = src / "sage_soul.json"
    if not soul_path.exists():
        print("  [--]  sage_soul.json missing")
        return
    soul = json.loads(soul_path.read_text())
    defender = {
        "synced_at": stamp(),
        "trauma_registry": soul.get("trauma_registry", []),
        "active_context": soul.get("active_context", {}),
        "schema_version": soul.get("schema_version"),
    }
    out = DEST / "defender" / "defender_mode.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(defender, indent=2))
    print(f"  [OK]  defender/defender_mode.json  ({len(defender['trauma_registry'])} threat entries)")

def sync_identity(src: Path):
    print("\n[IDENTITY] Syncing identity card...")
    inv = src / "invariants.json"
    if inv.exists():
        copy_file(inv, DEST / "identity" / "invariants.json")
    soul_path = src / "sage_soul.json"
    if soul_path.exists():
        soul = json.loads(soul_path.read_text())
        card = {
            "synced_at": stamp(),
            **soul.get("sage_identity", {}),
        }
        out = DEST / "identity" / "identity_card.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(card, indent=2))
        print("  [OK]  identity/identity_card.json")

def sync_council():
    print("\n[COUNCIL] Syncing council repos...")
    council_dir = DEST / "council"
    council_dir.mkdir(parents=True, exist_ok=True)
    for name, url in COUNCIL_REPOS.items():
        repo_path = council_dir / name
        if repo_path.exists():
            print(f"  [GIT] Pulling {name}...")
            ok = run(["git", "pull", "--ff-only"], cwd=repo_path)
        else:
            print(f"  [GIT] Cloning {name}...")
            ok = run(["git", "clone", "--depth=1", url, str(repo_path)], cwd=council_dir)
        if ok:
            print(f"  [OK]  council/{name}")

def write_manifest(src: Path):
    soul_path = src / "sage_soul.json"
    mem_count = 0
    if soul_path.exists():
        soul = json.loads(soul_path.read_text())
        mem_count = len(soul.get("memory_index", []))
    manifest = {
        "synced_at": stamp(),
        "source": str(src),
        "destination": str(DEST),
        "memory_count": mem_count,
    }
    out = DEST / "SYNC_MANIFEST.json"
    out.write_text(json.dumps(manifest, indent=2))
    print(f"\n[MANIFEST] {out}")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    src = Path(os.environ.get("SOURCE", "")) or find_source()
    print(f"SAGE-7 Sync  |  {stamp()}")
    print(f"Source : {src}")
    print(f"Dest   : {DEST}")
    DEST.mkdir(parents=True, exist_ok=True)

    sync_soul(src)
    sync_defender(src)
    sync_identity(src)
    sync_council()
    write_manifest(src)

    print("\nSync complete.")

if __name__ == "__main__":
    main()
