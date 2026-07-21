#!/bin/bash
set -euo pipefail

# Only runs in Claude Code on the web (remote container). Every fresh
# container has nothing running in memory (disk survives, processes don't),
# so ARGUS's support services — Stormologist daemon, its web server, the
# watcher — need relaunching each time. This does that automatically via
# supervisor.cjs, which also restarts any of the three if one crashes
# mid-session instead of dying silently.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ARGUS_DIR="$CLAUDE_PROJECT_DIR/ARGUS"

if [ ! -d "$ARGUS_DIR" ]; then
  exit 0
fi

cd "$ARGUS_DIR"

if [ ! -d node_modules ]; then
  npm install
fi

if ! pgrep -f "node supervisor.cjs" > /dev/null 2>&1; then
  nohup node supervisor.cjs > supervisor.log 2>&1 < /dev/null &
  disown
  echo "[session-start] ARGUS supervisor launched (pid $!)"
else
  echo "[session-start] ARGUS supervisor already running"
fi
