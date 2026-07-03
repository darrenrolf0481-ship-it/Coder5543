import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'CrimsonNode_VFS';
const STORE_NAME = 'stash';

export interface VFSFile {
  content: any;
  lastModified: string;
  vfs_path?: string;
}

export interface VFSState {
  files: Record<string, VFSFile>;
  activeProject: string;
  lastSync?: string;
}

export type VFSAction = 
  | { type: 'STASH_DATA'; payload: { fileName: string; content: any } }
  | { type: 'LOAD_PROJECT'; payload: { projectName: string } }
  | { type: 'SET_FILES'; payload: Record<string, VFSFile> };

export const vfsReducer = (state: VFSState, action: VFSAction): VFSState => {
  const timestamp = new Date().toISOString();
  switch (action.type) {
    case 'STASH_DATA':
      return {
        ...state,
        files: {
          ...state.files,
          [action.payload.fileName]: {
            content: action.payload.content,
            lastModified: timestamp
          }
        }
      };
    case 'LOAD_PROJECT':
      return {
        ...state,
        activeProject: action.payload.projectName,
        lastSync: timestamp
      };
    case 'SET_FILES':
        return {
            ...state,
            files: action.payload
        };
    default:
      return state;
  }
};

export const initSovereignDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const stashToLocal = async (key: string, val: any) => {
  const db = await initSovereignDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put({
    data: val,
    lastModified: new Date().toISOString(),
    vfs_path: `star_city/research/${key}`
  }, key);
  await tx.done;
  console.log(`[CORE_MEMORY: DOPAMINE] Stashed ${key} to local sovereignty.`);
};

export const loadFromLocal = async (key: string) => {
  const db = await initSovereignDB();
  return db.get(STORE_NAME, key);
};

const vfsLock = { active: false };
export const swarmUpdate = async (consensusData: any) => {
  if (vfsLock.active) {
    console.warn("[CORE_MEMORY: CORTISOL] VFS Lock active. Queuing swarm data...");
    return;
  }
  vfsLock.active = true;
  try {
    await stashToLocal('research_metrics.json', consensusData);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('VFS_SYNC_COMPLETE'));
    }
  } finally {
    vfsLock.active = false;
  }
};
