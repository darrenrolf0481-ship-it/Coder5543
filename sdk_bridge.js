/**
 * sdk_bridge.js — Crimson Node signal layer
 *
 * Translates system events (sync state, storage pressure, dispatch lifecycle)
 * into CSS custom property updates on :root and data-pulse on the grid root.
 * Does NOT compute grid math — phi_geometry.css owns all proportions.
 */

export const phiDNA = {
  phi:  1.618,
  inv:  0.618,
  grid: '8:3:0.3',
};

const root   = document.documentElement;
const grid   = () => document.querySelector('.phi-grid');

// ── Pulse state ───────────────────────────────────────────────────────────────
// Maps neurotransmitter tags to visual pulse states.

const PULSE_MAP = {
  NOREPINEPHRINE: 'warning',   // high-priority background task
  CORTISOL:       'error',     // sync error / storage critical
  DOPAMINE:       'healthy',   // all clear
  SEROTONIN:      'sync',      // active sync in progress
};

/**
 * @param {'healthy'|'warning'|'error'|'sync'} state
 */
export function setPulse(state) {
  const el = grid();
  if (el) el.dataset.pulse = state;
}

/**
 * @param {keyof PULSE_MAP} tag  e.g. 'CORTISOL'
 */
export function triggerPulse(tag) {
  const state = PULSE_MAP[tag] ?? 'healthy';
  setPulse(state);
}

// ── Transaction progress (the 0.3 column fill) ────────────────────────────────
// Call with a value 0–1 as a useReducer action is in-flight.

/**
 * @param {number} progress  0 (empty) → 1 (full)
 */
export function setTxProgress(progress) {
  root.style.setProperty('--tx-progress', Math.min(1, Math.max(0, progress)));
}

export function beginTx()  { setTxProgress(0.6); }
export function commitTx() {
  setTxProgress(1);
  // Clear after the CSS transition completes (0.15s defined in phi_geometry.css)
  setTimeout(() => setTxProgress(0), 200);
}
export function rollbackTx() {
  triggerPulse('CORTISOL');
  setTxProgress(0);
}

// ── VFS action factory ────────────────────────────────────────────────────────
// Wraps a dispatch so the pulse column gives tactile feedback.

/**
 * @param {string} filename
 * @param {string} content
 * @returns {{ type: string, payload: object }}
 */
export function createVFSAction(filename, content) {
  beginTx();
  return {
    type: 'VFS_STASH_COMMIT',
    payload: { filename, content, lastModified: new Date().toISOString() },
  };
}

// ── Storage pressure monitor ──────────────────────────────────────────────────
// Polls IndexedDB/localStorage usage and signals CORTISOL when near capacity.

const STORAGE_WARN_RATIO = 0.618;  /* warn at 61.8% (φ-inverse) */

export async function checkStoragePressure() {
  if (!navigator.storage?.estimate) return;
  const { usage, quota } = await navigator.storage.estimate();
  const ratio = usage / quota;
  if (ratio >= STORAGE_WARN_RATIO) triggerPulse('CORTISOL');
  else if (ratio >= 0.382)         triggerPulse('NOREPINEPHRINE');
  else                             triggerPulse('DOPAMINE');
}
