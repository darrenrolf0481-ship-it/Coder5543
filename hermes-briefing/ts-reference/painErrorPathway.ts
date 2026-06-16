import { PainType } from './types';
import type { EndocrineSystem } from './endocrineSystem';
import type { LTMStore } from './ltmStore';
import type { AvoidanceMap } from './avoidanceMap';

// Per-type hormonal signature: [cortisolWeight, norepinephrineWeight]
const PAIN_SIGNATURES: Record<PainType, [number, number]> = {
  [PainType.BUILD_FAILURE]:         [0.5, 0.3], // frustration + urgency
  [PainType.LOGICAL_INCONSISTENCY]: [0.25, 0.5], // confusion → high NE (conflict)
  [PainType.USER_REJECTION]:        [0.6, 0.1], // shame/withdrawal → high cortisol
};

export class PainErrorPathway {
  // Reflex arc: fast in-memory set, no decay — like touching a hot stove
  private readonly reflexArc = new Set<string>();

  constructor(
    private readonly endocrine: EndocrineSystem,
    private readonly ltm: LTMStore,
    private readonly avoidance: AvoidanceMap,
  ) {}

  async processPainSignal(type: PainType, intensity: number, context: string): Promise<void> {
    const [cortisolW, neW] = PAIN_SIGNATURES[type];

    // 1. Hormonal impact — proportional to intensity and type signature
    this.endocrine.punishWeighted(intensity * cortisolW, intensity * neW);

    // 2. Reflex arc — instant avoidance, survives only for this session
    this.reflexArc.add(context);

    // 3. Persistent avoidance — decaying across sessions
    this.avoidance.recordPain(context, intensity);

    // 4. Flashbulb memory — bypass the 0.5 salience gate; trauma is always stored
    const id = `pain_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await this.ltm.save({
      id,
      intent: 'AVOIDANCE_LESSON',
      response: `PAIN_RESPONSE:${type}`,
      outcome: 'failure',
      emotionalWeight: -Math.min(1, intensity),
      tags: [type, 'pain'],
      timestamp: Date.now(),
      accessCount: 0,
    });
  }

  // Fast reflex check — call this before any expensive processing
  shouldAvoid(context: string): boolean {
    return this.reflexArc.has(context);
  }

  clearReflex(context: string): void {
    this.reflexArc.delete(context);
  }

  reflexSize(): number {
    return this.reflexArc.size;
  }
}
