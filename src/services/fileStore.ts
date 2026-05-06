const DB_NAME = 'crimson_files';
const STORE   = 'file_contents';
const VERSION = 1;

// ── φ Quota Partitioning ──────────────────────────────────────────────────────
// IndexedDB budget is split using the golden ratio:
//   Primary   (NOREPINEPHRINE / high-importance): 61.8% = 1/φ
//   Ephemeral (FIELD_LOG / routine):              38.2% = 1 - 1/φ
//
// When storage pressure rises, ephemeral records are evicted first,
// preserving the primary partition until the last possible moment.

const PHI_INV         = 0.618;
const EPHEMERAL_SHARE = 0.382;    // 38.2% for low-priority content
const WARN_RATIO      = PHI_INV;  // warn at 61.8% total usage

type Priority = 'primary' | 'ephemeral';

interface FileRecord {
  id: string;
  content: string;
  priority?: Priority;
  lastAccessed?: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

export async function saveFileContents(
  files: Array<{ id: string; content: string; priority?: Priority }>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    files.forEach(f => store.put({
      ...f,
      priority: f.priority ?? 'primary',
      lastAccessed: Date.now(),
    }));
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function loadFileContents(): Promise<Record<string, string>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const map: Record<string, string> = {};
      for (const e of req.result as FileRecord[]) {
        map[e.id] = e.content;
      }
      resolve(map);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFileContent(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// ── φ Quota Manager ───────────────────────────────────────────────────────────

/**
 * Check storage pressure and evict ephemeral records if over the φ threshold.
 *
 * Eviction order:
 *  1. Ephemeral records, oldest-last-accessed first
 *  2. Only touches primary records if ephemeral partition is already empty
 *
 * @returns 'ok' | 'warn' | 'evicted' | 'critical'
 */
export async function enforcePhiQuota(): Promise<'ok' | 'warn' | 'evicted' | 'critical'> {
  if (!navigator.storage?.estimate) return 'ok';

  const { usage = 0, quota = 1 } = await navigator.storage.estimate();
  const ratio = usage / quota;

  if (ratio < WARN_RATIO) return 'ok';

  const db = await openDB();
  const records = await new Promise<FileRecord[]>((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result as FileRecord[]);
    req.onerror   = () => rej(req.error);
  });

  // Sort ephemeral records oldest-first
  const ephemeral = records
    .filter(r => (r.priority ?? 'primary') === 'ephemeral')
    .sort((a, b) => (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0));

  if (ephemeral.length === 0) return 'critical';

  // Evict the oldest 38.2% of ephemeral records
  const evictCount = Math.max(1, Math.ceil(ephemeral.length * EPHEMERAL_SHARE));
  const toEvict = ephemeral.slice(0, evictCount);

  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    toEvict.forEach(r => store.delete(r.id));
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });

  console.info(`[φ-Quota] Evicted ${evictCount} ephemeral record(s). Usage ratio: ${(ratio * 100).toFixed(1)}%`);
  return 'evicted';
}

/**
 * Mark file IDs as ephemeral — eligible for φ-quota eviction.
 * Call for auto-generated files, temp analysis outputs, AI-forged snippets, etc.
 */
export async function markEphemeral(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDB();
  const records = await new Promise<FileRecord[]>((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result as FileRecord[]);
    req.onerror   = () => rej(req.error);
  });

  const targets = records.filter(r => ids.includes(r.id));
  if (targets.length === 0) return;

  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    targets.forEach(r => store.put({ ...r, priority: 'ephemeral' }));
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}
