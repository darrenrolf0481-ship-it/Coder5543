import React, { createContext, useContext } from 'react';
import { useGitStore } from '../store/slices/gitStore';

interface GitContextType {
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

const GitContext = createContext<GitContextType | null>(null);

export const GitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useGitStore();
  return (
    <GitContext.Provider value={store}>
      {children}
    </GitContext.Provider>
  );
};

export const useGit = (): GitContextType => {
  const context = useContext(GitContext);
  if (!context) throw new Error('useGit must be used within GitProvider');
  return context;
};
