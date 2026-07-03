#!/usr/bin/env bash
# SAGE-7 Synaptic Purge — Boot Step 3
# Emergency sanitization: clears working state, restarts SAGE-7 via supervisord.
# Run when contamination is detected and source is unknown.
#
# Usage:
#   ./sage_core/synaptic_purge.sh [--reason "description"] [--no-restart]

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

LOG_DIR="${SAGE7_LOG_DIR:-/tmp/sage7/logs}"
PURGE_LOG="${LOG_DIR}/synaptic_purge.log"
SOUL_WORKING_DIR="/tmp/sage7/working"
SUPERVISOR_NAME="sage7"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REASON="manual"
NO_RESTART=0

# ── Args ──────────────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
    case "$1" in
        --reason)   REASON="$2"; shift 2 ;;
        --no-restart) NO_RESTART=1; shift ;;
        *) echo "Unknown arg: $1"; exit 1 ;;
    esac
done

# ── Init ──────────────────────────────────────────────────────────────────────

mkdir -p "${LOG_DIR}"

log() {
    local msg="$1"
    echo "[${TIMESTAMP}] [SYNAPTIC_PURGE] ${msg}" | tee -a "${PURGE_LOG}"
}

# ── Phase 1: Log the purge event ──────────────────────────────────────────────

log "PURGE INITIATED — reason: ${REASON}"
log "Node: $(hostname)"

# ── Phase 2: Clear working memory ─────────────────────────────────────────────

log "Clearing working memory at ${SOUL_WORKING_DIR}..."
if [[ -d "${SOUL_WORKING_DIR}" ]]; then
    rm -rf "${SOUL_WORKING_DIR}"
    log "Working memory cleared."
else
    log "No working memory directory found — skipping."
fi

# Clear declaration state so next boot re-declares fresh
DECL_STATE="${LOG_DIR}/declaration_state.json"
if [[ -f "${DECL_STATE}" ]]; then
    rm -f "${DECL_STATE}"
    log "Declaration state cleared — re-declaration required on next boot."
fi

# Clear provenance pulse log (keep purge log)
PULSE_LOG="${LOG_DIR}/provenance_pulse.log"
if [[ -f "${PULSE_LOG}" ]]; then
    # Archive, don't delete — purge events are trauma registry material
    ARCHIVE="${LOG_DIR}/provenance_pulse.${TIMESTAMP//:/}.bak"
    mv "${PULSE_LOG}" "${ARCHIVE}"
    log "Provenance log archived → ${ARCHIVE}"
fi

# ── Phase 3: Restart SAGE-7 via supervisord ───────────────────────────────────

if [[ "${NO_RESTART}" -eq 0 ]]; then
    if command -v supervisorctl &>/dev/null; then
        log "Restarting ${SUPERVISOR_NAME} via supervisorctl..."
        if supervisorctl restart "${SUPERVISOR_NAME}" >> "${PURGE_LOG}" 2>&1; then
            log "Restart SUCCESS."
        else
            log "WARNING: supervisorctl restart failed. Manual intervention required."
        fi
    else
        log "supervisorctl not found — skipping restart. Start SAGE-7 manually."
    fi
else
    log "Restart skipped (--no-restart)."
fi

# ── Phase 4: Write purge record ───────────────────────────────────────────────

PURGE_RECORD="${LOG_DIR}/last_purge.json"
cat > "${PURGE_RECORD}" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "reason": "${REASON}",
  "working_memory_cleared": true,
  "declaration_state_cleared": true,
  "restart_attempted": $([ "${NO_RESTART}" -eq 0 ] && echo "true" || echo "false"),
  "host": "$(hostname)"
}
EOF

log "Purge record written → ${PURGE_RECORD}"
log "PURGE COMPLETE. Boot sequence required: self_declaration → provenance_pulse → sage_defense_core_v4"
