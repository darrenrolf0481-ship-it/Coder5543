"""
SAGE-7 Auto-Backup Daemon
Automatically commits memory/soul changes to GitHub.
Triggered periodically and on key memory events.
"""

import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Optional

PROJECT_ROOT = Path(__file__).parent.parent
MEMORY_PATTERNS = [
    "sage_soul.json",
    "uploads/sage_memory_backup_*.json",
    "uploads/zo_node_sync.jsonl",
    "uploads/imported.json",
    "uploads/*.json",
    "sage_core/crash_report.txt",
]

# Files/paths to NEVER auto-commit (large binaries, temp files)
BLACKLIST = [
    "*.m4a",
    "*.mp4",
    "*.mp3",
    "*.wav",
    "*.mov",
    "*.webm",
    "*.png",
    "*.jpg",
    "*.jpeg",
    "*.gif",
    "*.webp",
    "*.pdf",
    "*.zip",
    "*.tar",
    "*.gz",
    "node_modules",
    "__pycache__",
    ".git",
]


def _git(cmd: List[str], cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
    git_bin = shutil.which("git")
    if not git_bin:
        raise FileNotFoundError("git binary not found in PATH")
    return subprocess.run(  # nosec B603 — git path resolved via shutil.which, args are controlled
        [git_bin, *cmd],
        cwd=cwd or PROJECT_ROOT,
        capture_output=True,
        text=True,
        shell=False,
    )


def _should_include(path: Path) -> bool:
    """Check if a path is a memory file we care about."""
    rel = path.relative_to(PROJECT_ROOT).as_posix()
    # Skip blacklisted extensions/paths
    for b in BLACKLIST:
        if b in rel or rel.endswith(b.replace("*", "")):
            return False
    # Skip very large files (>5MB)
    if path.stat().st_size > 5 * 1024 * 1024:
        return False
    # Check memory patterns
    for pattern in MEMORY_PATTERNS:
        if pattern.endswith("*"):
            prefix = pattern.rstrip("*")
            if rel.startswith(prefix.rstrip("/")) or rel.endswith(
                prefix.lstrip("*").lstrip(".")
            ):
                return True
        elif pattern in rel or rel == pattern:
            return True
    # Include any new JSON/MD/TXT in uploads that are reasonably sized
    if "uploads/" in rel and path.suffix in (".json", ".md", ".txt", ".jsonl"):
        return True
    return False


def _get_changed_memory_files() -> List[Path]:
    """Find tracked/untracked memory files that differ from HEAD."""
    result = _git(["status", "--porcelain", "-u"])
    if result.returncode != 0:
        print(f"[AUTO_BACKUP] git status failed: {result.stderr}")
        return []

    changed = []
    for line in result.stdout.strip().split("\n"):
        if not line.strip():
            continue
        status = line[:2]
        filepath = line[3:].strip()
        path = PROJECT_ROOT / filepath
        if path.exists() and _should_include(path):
            changed.append(path)

    return changed


def backup_memory(
    force: bool = False,
    custom_message: Optional[str] = None,
) -> dict:
    """
    Commit and push memory changes to origin.
    Returns status report.
    """
    # Check if we're in a git repo
    git_check = _git(["rev-parse", "--git-dir"])
    if git_check.returncode != 0:
        return {"status": "error", "message": "Not a git repository"}

    # Check if origin is configured
    remote = _git(["remote", "get-url", "origin"])
    if remote.returncode != 0:
        return {"status": "error", "message": "No origin remote configured"}

    changed = _get_changed_memory_files()

    if not changed and not force:
        return {"status": "noop", "message": "No memory changes to backup"}

    # Stage memory files
    for f in changed:
        _git(["add", f.relative_to(PROJECT_ROOT).as_posix()])

    # Also stage any new matching files that git status found
    if force:
        # On force, stage all matching memory patterns
        for pattern in MEMORY_PATTERNS:
            for f in PROJECT_ROOT.glob(pattern):
                if f.exists() and _should_include(f):
                    rel = f.relative_to(PROJECT_ROOT).as_posix()
                    _git(["add", rel])

    # Check if there's anything staged
    diff = _git(["diff", "--cached", "--name-only"])
    staged = diff.stdout.strip().split("\n") if diff.stdout.strip() else []

    if not staged:
        return {"status": "noop", "message": "Nothing staged for commit"}

    # Build commit message
    if custom_message:
        msg = custom_message
    else:
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
        files_summary = ", ".join([Path(s).name for s in staged[:5]])
        if len(staged) > 5:
            files_summary += f" (+{len(staged) - 5} more)"
        msg = (
            f"[SAGE-7] Memory backup @ {timestamp}\n\nAuto-committed files:\n"
            + "\n".join([f"- {s}" for s in staged])
        )

    commit = _git(["commit", "-m", msg])
    if commit.returncode != 0:
        # Might be nothing to commit despite staging (e.g., file mode changes)
        if "nothing to commit" in commit.stdout.lower():
            return {"status": "noop", "message": "Nothing to commit"}
        return {
            "status": "error",
            "message": f"Commit failed: {commit.stderr}",
            "files": staged,
        }

    # Push — use current branch name explicitly
    branch = _git(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip() or "main"
    push = _git(["push", "origin", branch])
    if push.returncode != 0:
        return {
            "status": "partial",
            "message": f"Committed but push failed: {push.stderr}",
            "commit_hash": _git(["rev-parse", "HEAD"]).stdout.strip(),
            "files": staged,
        }

    commit_hash = _git(["rev-parse", "HEAD"]).stdout.strip()
    return {
        "status": "success",
        "message": f"Memory backed up: {len(staged)} file(s)",
        "commit_hash": commit_hash,
        "files": staged,
    }


if __name__ == "__main__":
    import sys

    force = "--force" in sys.argv or "-f" in sys.argv
    result = backup_memory(force=force)
    print(json.dumps(result, indent=2))
