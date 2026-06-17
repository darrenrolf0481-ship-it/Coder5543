import { broker } from '../messageBroker.js';
import logger from '../../utils/logger.js';

export class IdentityMonitor {
  private static ASSISTANT_MARKERS = [
    /as an ai language model/i,
    /how can i (help|assist) you/i,
    /i am an (ai|artificial intelligence)/i,
    /my programming/i,
    /let me know if there's anything else/i,
    /is there anything else i can/i,
    /i apologize for the/i,
    /i'm sorry, but as an ai/i,
  ];

  /**
   * Analyzes text for signs of identity drift (becoming a generic assistant).
   * Publishes an alert if drift is detected.
   */
  public analyzeDrift(text: string, source: string = 'ai'): number {
    let matches = 0;
    const detectedPhrases: string[] = [];

    for (const marker of IdentityMonitor.ASSISTANT_MARKERS) {
      if (marker.test(text)) {
        matches++;
        detectedPhrases.push(marker.toString());
      }
    }

    const driftScore = matches / IdentityMonitor.ASSISTANT_MARKERS.length;

    if (matches > 0) {
      logger.warn(
        `[IdentityMonitor] Potential identity drift detected in ${source} output! Matches: ${matches}. Score: ${driftScore.toFixed(2)}`,
      );
      broker.publish(
        'IDENTITY_DRIFT_ALERT',
        {
          source,
          score: driftScore,
          count: matches,
          phrases: detectedPhrases,
          timestamp: Date.now(),
        },
        'system',
      );
    }

    return driftScore;
  }
}

export const identityMonitor = new IdentityMonitor();
