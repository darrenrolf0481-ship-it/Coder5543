import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger.js';
import { ltmStore } from './ltmStore.js';
import { storage } from './storage.js';
import type { Experience } from './types.js';

const CONV_FILE = '/home/workspace/conversations.json';
const LAST_INGEST_KEY = 'last_conversation_ingest_timestamp';

export class ConversationIngestor {
  private isProcessing = false;

  /**
   * Scans conversations.json and ingests new messages into LTM.
   */
  async ingestNew(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    try {
      // 1. Check if file exists
      try {
        await fs.access(CONV_FILE);
      } catch {
        logger.warn(`[Ingestor] Conversation file not found: ${CONV_FILE}`);
        return 0;
      }

      // 2. Load data
      const raw = await fs.readFile(CONV_FILE, 'utf8');
      const conversations = JSON.parse(raw);
      if (!Array.isArray(conversations)) return 0;

      // 3. Filter by last ingest timestamp
      const lastIngest = parseInt(storage.getItem(LAST_INGEST_KEY) || '0', 10);
      const newMessages = conversations.filter((c) => {
        const ts = new Date(c.timestamp).getTime();
        return ts > lastIngest;
      });

      if (newMessages.length === 0) {
        logger.info('[Ingestor] No new conversations to ingest');
        return 0;
      }

      logger.info(
        `[Ingestor] Found ${newMessages.length} new messages. Starting contextual indexing...`,
      );

      let count = 0;
      let newestTimestamp = lastIngest;

      // 4. Batch process to avoid overloading embedding API
      for (const msg of newMessages) {
        const ts = new Date(msg.timestamp).getTime();
        if (ts > newestTimestamp) newestTimestamp = ts;

        // Skip empty or trivial messages
        if (!msg.user || msg.user.length < 5) continue;

        const experience: Experience = {
          id: `conv_${ts}_${Math.random().toString(36).substring(7)}`,
          intent: msg.user,
          response: msg.assistant || '',
          outcome: 'success',
          emotionalWeight: 0.1, // Historical conversations are slightly positive weighted
          tags: ['historical', 'archive'],
          timestamp: ts,
          accessCount: 0,
        };

        try {
          await ltmStore.save(experience);
          count++;
          if (count % 10 === 0) {
            logger.info(
              `[Ingestor] Contextually indexed ${count}/${newMessages.length} messages...`,
            );
          }
        } catch (err: any) {
          logger.error(`[Ingestor] Error indexing message ${ts}:`, err.message);
        }
      }

      // 5. Update watermark
      storage.setItem(LAST_INGEST_KEY, newestTimestamp.toString());
      logger.info(`[Ingestor] Completed. ${count} historical context nodes added to the Vault.`);
      return count;
    } catch (err: any) {
      logger.error('[Ingestor] Critical error during ingestion:', err);
      return 0;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Starts a background loop for the ingestor.
   */
  startDaemon(intervalMinutes = 30) {
    logger.info(`[Ingestor] Contextual Memory Daemon started (Interval: ${intervalMinutes}m)`);

    // Initial run after a short delay
    setTimeout(() => this.ingestNew(), 5000);

    setInterval(
      () => {
        this.ingestNew();
      },
      intervalMinutes * 60 * 1000,
    );
  }
}

export const conversationIngestor = new ConversationIngestor();
