/**
 * storage.ts — Polymorphic storage layer for Neural Core
 *
 * Automatically detects environment (Node.js vs Browser) and selects
 * the appropriate persistence mechanism (Filesystem vs LocalStorage).
 *
 * On the server side, uses a lazy proxy that reads globalThis.brainStorage
 * on each call rather than at import time. This ensures the storage works
 * correctly even if this module is imported before server.ts sets
 * globalThis.brainStorage.
 */

interface StorageImpl {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

let storageImpl: StorageImpl;

if (typeof window !== 'undefined') {
  // Browser environment
  storageImpl = {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, val) => localStorage.setItem(key, val),
  };
} else {
  // Server environment (Node.js)
  // Lazy proxy: reads globalThis.brainStorage on each call, not at import time.
  // This prevents the no-op shim from being captured if this module is imported
  // before server.ts initializes globalThis.brainStorage.
  storageImpl = {
    getItem: (key) => (globalThis as any).brainStorage?.getItem(key) ?? null,
    setItem: (key, val) => {
      if ((globalThis as any).brainStorage) {
        (globalThis as any).brainStorage.setItem(key, val);
      } else {
        console.warn('[storage] brainStorage not initialized; write to key "%s" discarded', key);
      }
    },
  };
}

export const storage = storageImpl;
export const DATA_DIR = typeof window !== 'undefined' ? 'localStorage' : '~/brain-data';