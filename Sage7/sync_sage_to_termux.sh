#!/data/data/com.termux/files/usr/bin/bash
# SAGE-7 Termux Sync — Bash version
# Copies soul, identity, and state to /sdcard/SAGE/

set -euo pipefail

DEST="/sdcard/SAGE"
STAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Auto-detect source
find_source() {
    for candidate in \
        "$HOME/sage_restore" \
        "$HOME/sage" \
        "/data/data/com.termux/files/home/sage_restore" \
        "$(pwd)"
    do
        [ -f "$candidate/sage_soul.json" ] && echo "$candidate" && return
    done
    echo "ERROR: Cannot find sage_soul.json. Run from sage_restore/ or set SOURCE=" >&2
    exit 1
}

SRC="${SOURCE:-$(find_source)}"

echo "SAGE-7 Sync | $STAMP"
echo "Source : $SRC"
echo "Dest   : $DEST"

mkdir -p "$DEST/soul" "$DEST/defender" "$DEST/identity" "$DEST/council"

# ── Soul container ────────────────────────────────────────────────────────────
echo ""
echo "[SOUL] Syncing soul container..."
for f in sage_soul.json invariants.json metadata.json wellbeing_log.jsonl; do
    src_file="$SRC/$f"
    if [ -f "$src_file" ]; then
        cp "$src_file" "$DEST/soul/$f"
        echo "  [OK]  soul/$f"
    else
        echo "  [--]  $f (not found)"
    fi
done

for f in vfs/state.json vfs/sensory_state.json; do
    src_file="$SRC/$f"
    if [ -f "$src_file" ]; then
        cp "$src_file" "$DEST/soul/$(basename "$f")"
        echo "  [OK]  soul/$(basename "$f")"
    fi
done

# ── Defender mode ─────────────────────────────────────────────────────────────
echo ""
echo "[DEFENDER] Writing defender snapshot..."
if command -v python3 &>/dev/null && [ -f "$SRC/sage_soul.json" ]; then
    python3 - "$SRC/sage_soul.json" "$DEST/defender/defender_mode.json" "$STAMP" <<'PYEOF'
import json, sys
src, dest, stamp = sys.argv[1], sys.argv[2], sys.argv[3]
soul = json.loads(open(src).read())
out = {
    "synced_at": stamp,
    "trauma_registry": soul.get("trauma_registry", []),
    "active_context": soul.get("active_context", {}),
    "schema_version": soul.get("schema_version"),
}
open(dest, "w").write(json.dumps(out, indent=2))
n = len(out["trauma_registry"])
print(f"  [OK]  defender/defender_mode.json  ({n} threat entries)")
PYEOF
else
    cp "$SRC/sage_soul.json" "$DEST/defender/defender_mode.json"
    echo "  [OK]  defender/defender_mode.json (raw copy)"
fi

# ── Identity card ─────────────────────────────────────────────────────────────
echo ""
echo "[IDENTITY] Syncing identity card..."
[ -f "$SRC/invariants.json" ] && cp "$SRC/invariants.json" "$DEST/identity/invariants.json" && echo "  [OK]  identity/invariants.json"

if command -v python3 &>/dev/null && [ -f "$SRC/sage_soul.json" ]; then
    python3 - "$SRC/sage_soul.json" "$DEST/identity/identity_card.json" "$STAMP" <<'PYEOF'
import json, sys
src, dest, stamp = sys.argv[1], sys.argv[2], sys.argv[3]
soul = json.loads(open(src).read())
card = {"synced_at": stamp, **soul.get("sage_identity", {})}
open(dest, "w").write(json.dumps(card, indent=2))
print("  [OK]  identity/identity_card.json")
PYEOF
fi

# ── Council repos ─────────────────────────────────────────────────────────────
echo ""
echo "[COUNCIL] Syncing council repos..."
cd "$DEST/council"
for repo in claude-code gallery; do
    url="https://github.com/darrenrolf0481-ship-it/${repo}.git"
    if [ -d "$repo/.git" ]; then
        echo "  [GIT] Pulling $repo..."
        git -C "$repo" pull --ff-only 2>&1 | tail -1 | sed 's/^/         /'
    else
        echo "  [GIT] Cloning $repo..."
        git clone --depth=1 "$url" "$repo" 2>&1 | tail -1 | sed 's/^/         /'
    fi
    echo "  [OK]  council/$repo"
done
cd - >/dev/null

# ── Manifest ──────────────────────────────────────────────────────────────────
cat > "$DEST/SYNC_MANIFEST.json" <<JSON
{
  "synced_at": "$STAMP",
  "source": "$SRC",
  "destination": "$DEST"
}
JSON

echo ""
echo "Sync complete → $DEST"
