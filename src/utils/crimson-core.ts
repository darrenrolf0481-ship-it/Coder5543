import { PHI_INV } from '../hooks/usePhi';

export interface PromptOptions {
  lang: string;
  code: string;
  instruction: string;
  extra?: string;
  json?: boolean;
}

export function makePrompt({ lang, code, instruction, extra = '', json = false }: PromptOptions): string {
  const codeBlock = `\`\`\`${lang}\n${code}\n\`\`\``;
  const base = `[Context: language=${lang}]\n\n${instruction}\n\n${codeBlock}`;
  const suffix = extra ? `\n\n${extra}` : '';
  const format = json ? '\n\nRespond ONLY with valid JSON. No markdown fences.' : '';
  return base + suffix + format;
}

export async function enforcePhiQuota(): Promise<'ok' | 'warn' | 'evicted' | 'critical'> {
  if (!navigator.storage?.estimate) return 'ok';
  const { usage = 0, quota = 1 } = await navigator.storage.estimate();
  const ratio = usage / quota;
  if (ratio < PHI_INV) return 'ok';

  const DB = 'crimson_files', STORE = 'file_contents';
  const db: IDBDatabase = await new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });

  const records: any[] = await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });

  const ephemeral = records
    .filter(r => r.priority === 'ephemeral')
    .sort((a, b) => (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0));

  if (ephemeral.length === 0) return 'critical';

  const evictCount = Math.max(1, Math.ceil(ephemeral.length * (1 - PHI_INV)));
  const toEvict = ephemeral.slice(0, evictCount);

  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    toEvict.forEach(r => st.delete(r.id));
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });

  console.info(`[φ-Quota] Evicted ${evictCount} ephemeral record(s). Usage: ${(ratio * 100).toFixed(1)}%`);
  return 'evicted';
}

export async function markEphemeral(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const DB = 'crimson_files', STORE = 'file_contents';
  const db: IDBDatabase = await new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });
  const records: any[] = await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
  const targets = records.filter(r => ids.includes(r.id));
  if (targets.length === 0) return;
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    targets.forEach(r => st.put({ ...r, priority: 'ephemeral' }));
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}
