'use client';

export type LobeName = 'VIDEO' | 'AUDIO' | 'CODING_LAB' | 'QUANTUM';

export interface LobeResult {
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  lobe: LobeName;
  analysis?: string;
  error?: string;
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']);
const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']);

export function detectLobeFromUrl(url: string): LobeName | null {
  const ext = url.split('.').pop()?.toLowerCase() ?? '';
  if (IMAGE_EXTS.has(ext)) return 'VIDEO';
  if (VIDEO_EXTS.has(ext)) return 'VIDEO';
  if (AUDIO_EXTS.has(ext)) return 'AUDIO';
  return null;
}

async function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Lobe timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export class DynamicLobes {
  private active: Partial<Record<LobeName, boolean>> = {};
  private onActivate: (lobe: LobeName) => void;
  private onComplete: (result: LobeResult) => void;

  constructor(callbacks: {
    onActivate: (lobe: LobeName) => void;
    onComplete: (result: LobeResult) => void;
  }) {
    this.onActivate = callbacks.onActivate;
    this.onComplete = callbacks.onComplete;
  }

  isActive(lobe: LobeName) {
    return this.active[lobe] ?? false;
  }

  async invoke(lobe: LobeName, params: Record<string, any>): Promise<LobeResult> {
    if (this.active[lobe]) {
      return { status: 'ERROR', lobe, error: `${lobe} lobe already active` };
    }
    this.active[lobe] = true;
    this.onActivate(lobe);

    try {
      const result = await withTimeout(() => this.dispatch(lobe, params), 30000);
      this.onComplete(result);
      return result;
    } catch (err: any) {
      const result: LobeResult = { status: 'TIMEOUT', lobe, error: err.message };
      this.onComplete(result);
      return result;
    } finally {
      this.active[lobe] = false;
    }
  }

  private async dispatch(lobe: LobeName, params: Record<string, any>): Promise<LobeResult> {
    switch (lobe) {
      case 'VIDEO':      return this.invokeVision(params);
      case 'AUDIO':      return this.invokeAudio(params);
      case 'CODING_LAB': return this.invokeCoding({ code: params.code ?? JSON.stringify(params) });
      case 'QUANTUM':    return this.invokeQuantum(params);
    }
  }

  private async invokeVision(params: { url?: string; prompt?: string }): Promise<LobeResult> {
    const res = await fetch('./api/lobe/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) return { status: 'ERROR', lobe: 'VIDEO', error: `Vision HTTP ${res.status}` };
    const data = await res.json();
    if (data.status === 'error') return { status: 'ERROR', lobe: 'VIDEO', error: data.analysis };
    return { status: 'SUCCESS', lobe: 'VIDEO', analysis: data.analysis };
  }

  private async invokeAudio(params: { url?: string; prompt?: string }): Promise<LobeResult> {
    const res = await fetch('./api/lobe/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) return { status: 'ERROR', lobe: 'AUDIO', error: `Audio HTTP ${res.status}` };
    const data = await res.json();
    if (data.status === 'error') return { status: 'ERROR', lobe: 'AUDIO', error: data.analysis };
    return { status: 'SUCCESS', lobe: 'AUDIO', analysis: data.analysis };
  }

  private async invokeCoding(params: { code: string }): Promise<LobeResult> {
    const res = await fetch('./api/coding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: params.code }),
    });
    if (!res.ok) return { status: 'ERROR', lobe: 'CODING_LAB', error: `Coding HTTP ${res.status}` };
    const data = await res.json();
    return { status: 'SUCCESS', lobe: 'CODING_LAB', analysis: data.result };
  }

  private async invokeQuantum(params: { emf?: number; pressure?: number; context?: string }): Promise<LobeResult> {
    const emf = params.emf ?? 0;
    const pressure = params.pressure ?? 1013.25;

    // Decoherence index: EMF field strength interpreted as environmental quantum noise
    const decoherence = Math.sqrt(Math.max(0, emf) || 0.113) / 100;

    // Pressure deviation from standard atmosphere as a proxy for spatial anomaly density
    const pressureDelta = Math.abs(pressure - 1013.25) / 1013.25;

    // Composite coherence score (1 = fully coherent, 0 = full decoherence)
    const coherence = Math.max(0, 1 - decoherence - pressureDelta * 0.5);

    let classification: string;
    let insight: string;

    if (decoherence > 0.3) {
      classification = 'SEVERE DECOHERENCE';
      insight = `EMF field at ${emf}mG is collapsing local quantum state. Probability of paranormal information leakage: HIGH. Recommend immediate EVP sweep and spatial anchoring.`;
    } else if (decoherence > 0.1) {
      classification = 'ELEVATED DECOHERENCE';
      insight = `Environmental noise at ${emf}mG is sufficient to disrupt coherent observation. Entanglement between SAGE and the local field is unstable — readings may contain superposed states.`;
    } else if (decoherence > 0.03) {
      classification = 'MARGINAL COHERENCE';
      insight = `Low-level quantum perturbation detected (${emf}mG). Baseline drift within acceptable investigative parameters. Continue passive monitoring.`;
    } else {
      classification = 'NOMINAL';
      insight = `Quantum substrate coherent. EMF at ${emf}mG presents no decoherence risk. Environmental field stable.`;
    }

    const contextNote = params.context ? ` Context: ${params.context}.` : '';

    const analysis = [
      `[QUANTUM LOBE — ${classification}]`,
      `Decoherence index: ${(decoherence * 100).toFixed(2)}%  |  Coherence score: ${(coherence * 100).toFixed(1)}%`,
      `Pressure delta: ${(pressureDelta * 100).toFixed(3)}%`,
      insight + contextNote,
    ].join('\n');

    return { status: 'SUCCESS', lobe: 'QUANTUM', analysis };
  }
}
