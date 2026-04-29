import { create } from 'zustand';

interface GitStore {
  initialized: boolean;
  branch: string;
  commits: any[];
  staged: string[];
  modified: string[];
  stash: any[];
  init: (branch: string) => void;
  setInitialized: (val: boolean) => void;
  setCommits: (commits: any[]) => void;
  stageFile: (fileId: string) => void;
  unstageFile: (fileId: string) => void;
  setModified: (files: string[]) => void;
  setStash: (stash: any[]) => void;
}

export const useGitStore = create<GitStore>((set) => ({
  initialized: false,
  branch: '',
  commits: [],
  staged: [],
  modified: [],
  stash: [],
  init: (branch) => set({ initialized: true, branch }),
  setInitialized: (val) => set({ initialized: val }),
  setCommits: (commits) => set({ commits }),
  stageFile: (fileId) => set((state) => ({ 
    staged: [...state.staged, fileId],
    modified: state.modified.filter(id => id !== fileId)
  })),
  unstageFile: (fileId) => set((state) => ({ 
    modified: [...state.modified, fileId],
    staged: state.staged.filter(id => id !== fileId)
  })),
  setModified: (files) => set({ modified: files }),
  setStash: (stash) => set({ stash }),
}));
