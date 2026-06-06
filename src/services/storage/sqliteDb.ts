import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import logger from '../../utils/logger.js';

const dbPath = path.join(os.homedir(), 'brain-data', 'brain.db');

// Ensure directory exists
import fs from 'fs';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS long_term_memory (
    id TEXT PRIMARY KEY,
    intent TEXT NOT NULL,
    response TEXT NOT NULL,
    outcome TEXT NOT NULL,
    emotional_weight REAL DEFAULT 0,
    timestamp INTEGER NOT NULL,
    access_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_ltm_timestamp ON long_term_memory(timestamp);
  CREATE INDEX IF NOT EXISTS idx_ltm_outcome ON long_term_memory(outcome);
`);

logger.info(`[SQLite] Database initialized at ${dbPath}`);

export default db;
