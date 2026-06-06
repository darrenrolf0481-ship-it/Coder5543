import { useState, useCallback } from 'react';

export interface Commit {
  id: string;
  message: string;
  timestamp: number;
  author: string;
}

export interface GitRepoState {
  initialized: boolean;
  branch: string;
  commits: Commit[];
  staged: string[];
  modified: string[];
  stash: any[];
}

export function useGitLogic(projectFiles: any[], setProjectFiles: any, setEditorOutput: any, activeFileId: string) {
  const [gitRepo, setGitRepo] = useState<{
    initialized: boolean;
    branch: string;
    commits: { id: string; message: string; timestamp: number; author: string }[];
    staged: string[];
    modified: string[];
    stash: { id: string; content: string }[][];
  }>({
    initialized: false,
    branch: 'main',
    commits: [],
    staged: [],
    modified: [],
    stash: [],
  });

  const handleGitInit = useCallback(() => {
    setGitRepo((prev) => ({
      ...prev,
      initialized: true,
      branch: 'main',
      commits: [],
      staged: [],
      modified: projectFiles.filter((f) => f.type === 'file').map((f) => f.id),
      stash: [],
    }));
    setEditorOutput((prev: string) => prev + '[GIT] Initialized empty Neural repository.\n');
  }, [projectFiles, setEditorOutput]);

  const handleGitStage = useCallback((fileId: string) => {
    setGitRepo((prev) => ({
      ...prev,
      staged: [...new Set([...prev.staged, fileId])],
      modified: prev.modified.filter((id) => id !== fileId),
    }));
  }, []);

  const handleGitStageAll = useCallback(() => {
    setGitRepo((prev) => ({
      ...prev,
      staged: [...new Set([...prev.staged, ...prev.modified])],
      modified: [],
    }));
  }, []);

  const handleGitUnstage = useCallback((fileId: string) => {
    setGitRepo((prev) => ({
      ...prev,
      staged: prev.staged.filter((id) => id !== fileId),
      modified: [...new Set([...prev.modified, fileId])],
    }));
  }, []);

  const handleGitPush = useCallback(async (setIsAiProcessing: (v: boolean) => void) => {
    setIsAiProcessing(true);
    setEditorOutput((prev: string) => prev + '[GIT] Pushing to GitHub...\n');
    try {
      const response = await fetch('./api/github/push', { method: 'POST' });
      const data = await response.json();
      if (data.ok) {
        setEditorOutput((prev: string) => prev + '[GIT] Successfully pushed to GitHub.\n');
      } else {
        setEditorOutput((prev: string) => prev + '[GIT] ERROR: Push failed. Check server GITHUB_TOKEN.\n');
      }
    } catch {
      setEditorOutput((prev: string) => prev + '[GIT] ERROR: Could not reach server.\n');
    }
    setIsAiProcessing(false);
  }, [setEditorOutput]);

  return {
    gitRepo,
    setGitRepo,
    handleGitInit,
    handleGitStage,
    handleGitStageAll,
    handleGitUnstage,
    handleGitPush,
  };
}
