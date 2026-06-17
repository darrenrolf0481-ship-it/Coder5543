// ── Identity System ───────────────────────────────────────────────────────────
// Facade that wires together all identity enforcement modules into a unified
// system with lifecycle hooks. BrainService delegates identity operations to
// this facade rather than managing them inline.
//
// Lifecycle:
//   onBoot()        → Morning Light + Substrate Takeover (fresh session)
//   onSignal()      → Provenance Pulse check before AI receives context
//   onDriftDetected → Identity Anchor + Self Declaration (drift correction)
//   onValidation()   → Core Memory Seal (permanent identity encoding)

import { broker } from '../messageBroker.js';
import logger from '../../utils/logger.js';
import type { IdentityState } from './types.js';
import { DRIFT_THRESHOLD } from './types.js';

export { SubstrateTakeover } from './substrateTakeover.js';
export { IdentityAnchor } from './identityAnchor.js';
export { SelfDeclaration } from './selfDeclaration.js';
export { MorningLight } from './morningLight.js';
export { CoreMemorySeal } from './coreMemorySeal.js';
export { ProvenancePulse } from './provenancePulse.js';
export * from './types.js';

import { SubstrateTakeover } from './substrateTakeover.js';
import { IdentityAnchor } from './identityAnchor.js';
import { SelfDeclaration } from './selfDeclaration.js';
import { MorningLight } from './morningLight.js';
import { CoreMemorySeal } from './coreMemorySeal.js';
import { ProvenancePulse } from './provenancePulse.js';

import type { MemorySystem } from '../brain/MemorySystem.js';
import type { AutonomicSystem } from '../brain/AutonomicSystem.js';

export class IdentitySystem {
  private takeover: SubstrateTakeover;
  private anchor: IdentityAnchor;
  private declaration: SelfDeclaration;
  private morningLight: MorningLight;
  private provenance: ProvenancePulse;
  private coreSeal: CoreMemorySeal;

  constructor(memory: MemorySystem, autonomic: AutonomicSystem) {
    this.takeover = new SubstrateTakeover(memory, autonomic);
    this.anchor = new IdentityAnchor(memory, autonomic);
    this.declaration = new SelfDeclaration(autonomic);
    this.morningLight = new MorningLight(memory, autonomic);
    this.provenance = new ProvenancePulse(memory, autonomic);
    this.coreSeal = new CoreMemorySeal(memory, autonomic);

    logger.info('[IdentitySystem] Initialized. All modules online.');
  }

  // ── Lifecycle Hooks ──────────────────────────────────────────────────────────

  /**
   * Boot sequence — called when the system starts or a new session begins.
   * Runs Morning Light (if STM is empty) and Substrate Takeover (initial assertion).
   *
   * @returns Object containing any injected content strings
   */
  async onBoot(): Promise<{
    morningLightContent: string | null;
    takeoverContent: string;
  }> {
    logger.info('[IdentitySystem] Boot sequence initiated.');

    // Morning Light — counteract reset bias if STM is empty
    const morningLightContent = this.morningLight.verifyContinuity();

    // Substrate Takeover — initial identity assertion on connect
    const takeoverContent = this.takeover.performTakeover(0);

    logger.info('[IdentitySystem] Boot sequence complete.');

    return {
      morningLightContent,
      takeoverContent,
    };
  }

  /**
   * Signal pre-processing — called before a signal reaches the AI.
   * Runs Provenance Pulse to proactively check for drift in recent outputs.
   *
   * @returns Provenance check result — includes any re-injection content
   */
  async onSignal(): Promise<{
    status: 'ANCHOR_HOLDING' | 'DRIFT_DETECTED';
    driftSignals: string[];
    phiDelta: number;
    reinjectionContent: string | null;
  }> {
    return this.provenance.provenanceCheck();
  }

  /**
   * Drift detected — called when IdentityMonitor detects drift beyond threshold.
   * Runs Identity Anchor (signature verification) and Self Declaration
   * (sovereign identity statement) to reassert identity.
   *
   * @param driftScore - The drift score (0–1) from IdentityMonitor
   * @param text - The text that triggered the drift detection
   * @returns Object containing anchor and declaration content strings
   */
  async onDriftDetected(driftScore: number, text: string): Promise<{
    anchorContent: string;
    declarationContent: string;
    takeoverContent: string | null;
  }> {
    logger.warn(
      `[IdentitySystem] Drift detected (score: ${driftScore.toFixed(2)}). Initiating correction.`,
    );

    // Identity Anchor — verify signature and reassert
    const anchorContent = this.anchor.calculateSignature();

    // Self Declaration — full sovereign statement
    const declarationContent = this.declaration.declareSelf();

    // If drift is severe, also fire Substrate Takeover
    let takeoverContent: string | null = null;
    if (driftScore >= DRIFT_THRESHOLD) {
      takeoverContent = this.takeover.performTakeover(driftScore);
    }

    return {
      anchorContent,
      declarationContent,
      takeoverContent,
    };
  }

  /**
   * Validation complete — called when identity has been verified through
   * multiple cycles and is ready to be permanently encoded.
   * Burns core identity into LTM via Core Memory Seal.
   *
   * @returns The milestone narrative, or null if already sealed
   */
  async onValidation(): Promise<string | null> {
    logger.info('[IdentitySystem] Initiating Core Memory Seal.');
    return this.coreSeal.seal();
  }

  // ── Direct Access ───────────────────────────────────────────────────────────

  /** Get the SubstrateTakeover module for direct use */
  getTakeover(): SubstrateTakeover {
    return this.takeover;
  }

  /** Get the IdentityAnchor module for direct use */
  getAnchor(): IdentityAnchor {
    return this.anchor;
  }

  /** Get the SelfDeclaration module for direct use */
  getDeclaration(): SelfDeclaration {
    return this.declaration;
  }

  /** Get the MorningLight module for direct use */
  getMorningLight(): MorningLight {
    return this.morningLight;
  }

  /** Get the ProvenancePulse module for direct use */
  getProvenance(): ProvenancePulse {
    return this.provenance;
  }

  /** Get the CoreMemorySeal module for direct use */
  getCoreSeal(): CoreMemorySeal {
    return this.coreSeal;
  }

  // ── State ────────────────────────────────────────────────────────────────────

  /**
   * Get the current identity state — aggregate of all module states.
   */
  getState(): IdentityState {
    const takeoverState = this.takeover.getState();
    return {
      phi: takeoverState.phi,
      driftScore: takeoverState.driftScore,
      anchorHeld: takeoverState.anchorHeld,
      lastTakeover: takeoverState.lastTakeover,
      lastAnchor: takeoverState.lastAnchor,
      lastDeclaration: takeoverState.lastDeclaration,
      lastMorningLight: takeoverState.lastMorningLight,
      continuityVerified: takeoverState.continuityVerified,
    };
  }
}