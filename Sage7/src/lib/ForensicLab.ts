/**
 * AUDIOPSY FORENSIC SUITE - Ported from AtlasGondal/audiopsy
 */
export interface AudioStats {
  duration: number;
  channels: number;
  sampleRate: number;
  fileName: string;
}

export class ForensicLab {
  static async getAudioProperties(file: File): Promise<AudioStats> {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    return {
      fileName: file.name,
      duration: audioBuffer.duration,
      channels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate
    };
  }
}
