import { createJSONStorage, StateStorage } from 'zustand/middleware';

/**
 * localStorage throws a SecurityError when accessed inside a sandboxed
 * iframe or with site-data blocked (common in embedded preview panes and
 * private browsing). Touching it at module load would crash the whole app
 * before React mounts. This adapter probes localStorage once and falls
 * back to an in-memory map if it's unavailable — persistence degrades to
 * session-only instead of taking the app down.
 */
function makeSafeStorage(): StateStorage {
  let backing: Storage | null = null;
  try {
    const probe = '__argus_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    backing = window.localStorage;
  } catch {
    backing = null; // blocked — use memory fallback below
  }

  if (backing) {
    return {
      getItem: (name) => { try { return backing!.getItem(name); } catch { return null; } },
      setItem: (name, value) => { try { backing!.setItem(name, value); } catch { /* ignore */ } },
      removeItem: (name) => { try { backing!.removeItem(name); } catch { /* ignore */ } },
    };
  }

  const mem = new Map<string, string>();
  return {
    getItem: (name) => (mem.has(name) ? mem.get(name)! : null),
    setItem: (name, value) => { mem.set(name, value); },
    removeItem: (name) => { mem.delete(name); },
  };
}

export const safeStorage = createJSONStorage(makeSafeStorage);
