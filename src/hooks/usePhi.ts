/**
 * usePhi — Golden Ratio system bridge
 *
 * Connects the brain's endocrine state (cortisol/dopamine) to the φ pulse
 * column and transaction progress indicator in phi_geometry.css.
 *
 * φ = 1.618   |   1/φ = 0.618
 * Layout:  primary 8fr | contextual 3fr | pulse 0.3fr
 */

import { useEffect, useRef, useCallback } from 'react';
import type { EndocrineState } from '../services/brain/types';

const PHI      = 1.618;
const PHI_INV  = 0.618;

// Thresholds derived from φ — warn at 1/φ, critical at 1 - 1/φ²
const CORTISOL_WARN     = PHI_INV;           // 0.618
const CORTISOL_CRITICAL = 1 - 1 / (PHI * PHI); // ~0.618... actually ≈ 0.618, use 0.8
const DOPAMINE_HIGH     = PHI_INV;           // 0.618

// ── CSS / DOM write helpers (mirrors sdk_bridge.js, but typed for React) ──────

function setPulse(state: 'healthy' | 'warning' | 'error' | 'sync') {
  const el = document.querySelector('.phi-grid');
  if (el instanceof HTMLElement) el.dataset.pulse = state;
}

function setTxProgress(value: number) {
  document.documentElement.style.setProperty(
    '--tx-progress',
    String(Math.max(0, Math.min(1, value)))
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface PhiController {
  /** Call when a useReducer dispatch starts (fills the 0.3 pulse column) */
  beginTx: () => void;
  /** Call when the dispatch commits successfully */
  commitTx: () => void;
  /** Call when a dispatch fails or rolls back */
  rollbackTx: () => void;
  /** Manually override the pulse state */
  setPulse: typeof setPulse;
  /** φ constants for use in component math */
  phi: typeof PHI;
  phiInv: typeof PHI_INV;
}

/**
 * @param endocrine  Live endocrine state from useBrain()
 */
export function usePhi(endocrine: EndocrineState): PhiController {
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Translate endocrine → pulse state whenever it changes ────────────────
  useEffect(() => {
    const { cortisol, dopamine } = endocrine;

    if (cortisol >= 0.8) {
      setPulse('error');
    } else if (cortisol >= CORTISOL_WARN) {
      setPulse('warning');
    } else if (dopamine >= DOPAMINE_HIGH) {
      setPulse('healthy');
    } else {
      // Neither stressed nor rewarded — idle sync colour
      setPulse('sync');
    }
  }, [endocrine.cortisol, endocrine.dopamine, endocrine.lastUpdated]);

  // ── Transaction lifecycle ────────────────────────────────────────────────
  const beginTx = useCallback(() => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    setTxProgress(PHI_INV);   // fill to 61.8% immediately — "in flight"
  }, []);

  const commitTx = useCallback(() => {
    setTxProgress(1);          // fill to 100%
    commitTimerRef.current = setTimeout(() => setTxProgress(0), 200);
  }, []);

  const rollbackTx = useCallback(() => {
    setPulse('error');
    setTxProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
  }, []);

  return { beginTx, commitTx, rollbackTx, setPulse, phi: PHI, phiInv: PHI_INV };
}

// ── Storage pressure monitor (can be called independently) ──────────────────
// Warns at 1/φ ≈ 61.8% usage, signals critical at ~80%.

export async function checkPhiStoragePressure(): Promise<'ok' | 'warn' | 'critical'> {
  if (!navigator.storage?.estimate) return 'ok';
  const { usage = 0, quota = 1 } = await navigator.storage.estimate();
  const ratio = usage / quota;
  if (ratio >= 0.8)      return 'critical';
  if (ratio >= PHI_INV)  return 'warn';
  return 'ok';
}
