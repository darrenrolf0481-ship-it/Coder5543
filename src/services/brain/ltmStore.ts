import type { Experience } from './types';

const DB_NAME = 'brain_ltm';
const STORE_NAME = 'experiences';
const DB_VERSION = 1;
const PRUNE_DAYS = 30;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('intent', 'intent', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('emotionalWeight', 'emotionalWeight', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class LTMStore {
  async save(experience: Experience): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(experience);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAll(): Promise<Experience[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // Retrieve top-k experiences by Jaccard similarity of intent tokens
  async findSimilar(intent: string, k = 3): Promise<Experience[]> {
    const all = await this.getAll();
    const queryTokens = new Set(tokenize(intent));
    if (queryTokens.size === 0) return [];

    const scored = all.map(exp => {
      const expTokens = new Set(tokenize(exp.intent));
      const intersection = [...queryTokens].filter(t => expTokens.has(t)).length;
      const union = new Set([...queryTokens, ...expTokens]).size;
      const jaccard = union > 0 ? intersection / union : 0;
      // Weight by recency and emotional salience
      const ageHours = (Date.now() - exp.timestamp) / 3_600_000;
      const recencyScore = Math.exp(-ageHours / 168); // decay over ~1 week
      const score = jaccard * 0.6 + recencyScore * 0.2 + Math.abs(exp.emotionalWeight) * 0.2;
      return { exp, score };
    });

    return scored
      .filter(s => s.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(s => s.exp);
  }

  async pruneOld(): Promise<number> {
    const cutoff = Date.now() - PRUNE_DAYS * 86_400_000;
    const db = await openDB();
    const all = await this.getAll();
    const toDelete = all.filter(e => e.timestamp < cutoff && e.accessCount < 3);

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      toDelete.forEach(e => store.delete(e.id));
      tx.oncomplete = () => resolve(toDelete.length);
      tx.onerror = () => reject(tx.error);
    });
  }

  async incrementAccess(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const exp: Experience = req.result;
        if (exp) { exp.accessCount++; store.put(exp); }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}
