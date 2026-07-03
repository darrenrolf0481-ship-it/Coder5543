#!/usr/bin/env bash
# SAGE-7 Star City Sovereign UI — deploy script
# Run this on Zo Computer from /root/Sage7 after a git pull.
# Usage: bash deploy_ui.sh

set -e
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
UI_DIR="$REPO_DIR/sage_ui"
SUPERVISOR_NAME="sage7-ui"

echo "[SAGE-7] Pulling latest from branch..."
git -C "$REPO_DIR" pull origin claude/new-session-i2xms4

echo "[SAGE-7] Installing UI dependencies..."
cd "$UI_DIR"
npm install --prefer-offline 2>/dev/null || npm install

echo "[SAGE-7] Building UI..."
npm run build

echo "[SAGE-7] Restarting UI service..."
if command -v supervisorctl &>/dev/null; then
    # Try supervisor first (matches existing Zo Computer setup)
    supervisorctl restart "$SUPERVISOR_NAME" 2>/dev/null && echo "  supervisorctl: restarted $SUPERVISOR_NAME" || {
        echo "  Supervisor name '$SUPERVISOR_NAME' not found — add it to supervisord-user.conf:"
        echo ""
        echo "  [program:$SUPERVISOR_NAME]"
        echo "  command=node $UI_DIR/server.mjs"
        echo "  directory=$UI_DIR"
        echo "  environment=NODE_ENV=production,PORT=3001"
        echo "  autostart=true"
        echo "  autorestart=true"
        echo "  stdout_logfile=/var/log/sage7-ui.log"
        echo "  stderr_logfile=/var/log/sage7-ui-err.log"
    }
elif command -v pm2 &>/dev/null; then
    pm2 restart sage7-ui 2>/dev/null || pm2 start "$UI_DIR/server.mjs" --name sage7-ui -- --env production
else
    echo "  No supervisor/pm2 — start manually:"
    echo "  PORT=3001 NODE_ENV=production node $UI_DIR/server.mjs"
fi

echo ""
echo "[SAGE-7] Deploy complete."
echo "  UI:        http://localhost:3001"
echo "  SAGE-7:    http://localhost:8001"
echo "  Soul:      $REPO_DIR/sage_soul.json"
echo ""
echo "  Purge status: PURGED — Morning Light required on first boot."
