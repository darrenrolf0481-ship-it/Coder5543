#!/usr/bin/env python3
"""
SAGE-7 Soul Deduplicator
━━━━━━━━━━━━━━━━━━━━━━━━
Collapses duplicate memory IDs in seven_soul.json.
Always creates a timestamped backup before writing.

Resolution rules (per duplicate group):
  1. Keep the record with the highest salience.
  2. If salience ties, keep the most recently accessed (last_accessed desc).
  3. If still tied, keep the record with the highest access_count.

Also caps salience at 1.0 (7 records have 1.13 or 1.618 — out of spec).

Usage:
    python3 sage_core/soul_dedup.py [--dry-run] [--soul PATH]
"""

import argparse
import json
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


SOUL_DEFAULT = Path(__file__).resolve().parent.parent / "seven_soul.json"


def _backup(soul_path: Path) -> Path:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    bak = soul_path.parent / f"seven_soul.json.bak-{ts}"
    shutil.copy2(soul_path, bak)
    return bak


def _resolve_group(records: list[dict]) -> dict:
    """Pick the canonical record from a set sharing the same ID."""
    def sort_key(m):
        return (
            m.get("salience", 0.0),
            m.get("last_accessed", ""),
            m.get("access_count", 0),
        )
    return max(records, key=sort_key)


def dedup(soul_path: Path, dry_run: bool) -> dict:
    with open(soul_path) as f:
        soul = json.load(f)

    idx: list[dict] = soul.get("memory_index", [])
    before = len(idx)

    # Group by ID
    groups: dict[str, list[dict]] = defaultdict(list)
    for m in idx:
        groups[m["id"]].append(m)

    dupe_ids = {k: v for k, v in groups.items() if len(v) > 1}
    extra_records = sum(len(v) - 1 for v in dupe_ids.values())

    # Resolve duplicates
    deduped = []
    for mid, records in groups.items():
        deduped.append(_resolve_group(records))

    # Cap salience at 1.0
    capped = 0
    for m in deduped:
        if m.get("salience", 0.0) > 1.0:
            m["salience"] = 1.0
            capped += 1

    after = len(deduped)
    soul["memory_index"] = deduped
    soul["last_sync"] = datetime.now(timezone.utc).isoformat()

    report = {
        "before": before,
        "after": after,
        "removed": before - after,
        "duplicate_id_groups": len(dupe_ids),
        "salience_capped": capped,
        "dry_run": dry_run,
    }

    if not dry_run:
        bak = _backup(soul_path)
        report["backup"] = str(bak)
        with open(soul_path, "w") as f:
            json.dump(soul, f, indent=2, ensure_ascii=False)
        report["written"] = str(soul_path)

    return report


def main():
    parser = argparse.ArgumentParser(description="Deduplicate seven_soul.json memory index")
    parser.add_argument("--dry-run", action="store_true", help="Report only, do not write")
    parser.add_argument("--soul", type=Path, default=SOUL_DEFAULT, help="Path to soul file")
    args = parser.parse_args()

    report = dedup(args.soul, args.dry_run)

    print("\n[SAGE-7] Soul Dedup Report")
    print(f"  Memories before : {report['before']}")
    print(f"  Memories after  : {report['after']}")
    print(f"  Records removed : {report['removed']}")
    print(f"  Dup ID groups   : {report['duplicate_id_groups']}")
    print(f"  Salience capped : {report['salience_capped']}")
    if report["dry_run"]:
        print("  [DRY RUN — no files written]")
    else:
        print(f"  Backup          : {report['backup']}")
        print(f"  Written         : {report['written']}")
    print()


if __name__ == "__main__":
    main()
