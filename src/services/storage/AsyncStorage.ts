import db from './sqliteDb.js';
import logger from '../../utils/logger.js';

export class AsyncStorage {
  async init() {
    // SQLite DB is initialized in its own module
    logger.info('[AsyncStorage] Initialized with SQLite backend');
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const row = db.prepare('SELECT value FROM key_value_store WHERE key = ?').get(key) as
        | { value: string }
        | undefined;
      return row ? row.value : null;
    } catch (e) {
      logger.error(`[AsyncStorage] Error reading ${key}:`, e);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      db.prepare(
        'INSERT INTO key_value_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ).run(key, value);
    } catch (e) {
      logger.error(`[AsyncStorage] Error saving ${key}:`, e);
      throw e;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      db.prepare('DELETE FROM key_value_store WHERE key = ?').run(key);
    } catch (e) {
      logger.error(`[AsyncStorage] Error removing ${key}:`, e);
    }
  }

  getSyncInterface() {
    return {
      getItem: (key: string) => {
        try {
          const row = db.prepare('SELECT value FROM key_value_store WHERE key = ?').get(key) as
            | { value: string }
            | undefined;
          return row ? row.value : null;
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          db.prepare(
            'INSERT INTO key_value_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
          ).run(key, value);
        } catch {}
      },
    };
  }
}

export const brainStorage = new AsyncStorage();
