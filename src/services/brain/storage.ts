/**
 * storage.ts — Polymorphic storage layer for Neural Core
 * 
 * Automatically detects environment (Node.js vs Browser) and selects
 * the appropriate persistence mechanism (Filesystem vs LocalStorage).
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
  // We use a global proxy to avoid bundling Node modules in the frontend
  storageImpl = (globalThis as any).brainStorage || {
    getItem: () => null,
    setItem: () => {},
  };
}

export const storage = storageImpl;
export const DATA_DIR = typeof window !== 'undefined' ? 'localStorage' : '~/brain-data';
