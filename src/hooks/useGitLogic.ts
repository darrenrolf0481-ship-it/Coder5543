import { useState, useCallback } from 'react';
import { resolveApiUrl } from '../utils/apiUrl';

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

export interface GitScanResult {
  branch: string;
  remote: string;
  modified: string[];
  staged: string[];
  ahead: number;
  behind: number;
  hasConflicts: boolean;
  lastCommit: string | null;
  timestamp: number;
}

export function useGitLogic(
  projectFiles: any[],
  setProjectFiles: any,
  setEditorOutput: any,
  activeFileId: string,
  setChatMessages?: React.Dispatch<React.SetStateAction<any[]>>,
) {
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

  const handleGitPush = useCallback(
    async (setIsAiProcessing: (v: boolean) => void) => {
      setIsAiProcessing(true);
      setEditorOutput((prev: string) => prev + '[GIT] Pushing to GitHub...\n');
      try {
        const response = await fetch(resolveApiUrl('github/push'), { method: 'POST' });
        const data = await response.json();
        if (data.ok) {
          setEditorOutput((prev: string) => prev + '[GIT] Successfully pushed to GitHub.\n');
        } else {
          setEditorOutput(
            (prev: string) => prev + '[GIT] ERROR: Push failed. Check server GITHUB_TOKEN.\n',
          );
        }
      } catch {
        setEditorOutput((prev: string) => prev + '[GIT] ERROR: Could not reach server.\n');
      }
      setIsAiProcessing(false);
    },
    [setEditorOutput],
  );

  const [gitScanResult, setGitScanResult] = useState<GitScanResult | null>(null);
  const [isScanningGit, setIsScanningGit] = useState(false);

  const handleGitScan = useCallback(async () => {
    setIsScanningGit(true);
    setEditorOutput((prev: string) => prev + '[GIT] Scanning repository...\n');

    try {
      const response = await fetch(resolveApiUrl('github/scan'));
      const data = await response.json();

      if (data.ok) {
        const scan: GitScanResult = {
          branch: data.branch || 'main',
          remote: data.remote || 'origin',
          modified: data.modified || [],
          staged: data.staged || [],
          ahead: data.ahead || 0,
          behind: data.behind || 0,
          hasConflicts: data.hasConflicts || false,
          lastCommit: data.lastCommit || null,
          timestamp: Date.now(),
        };

        setGitScanResult(scan);

        const scanSummary =
          `**Git Repository Scan**\n\n` +
          `• **Branch:** \`${scan.branch}\`\n` +
          `• **Behind:** ${scan.behind} commit(s)\n` +
          `• **Ahead:** ${scan.ahead} commit(s)\n` +
          `• **Modified:** ${scan.modified.length} file(s)\n` +
          `• **Staged:** ${scan.staged.length} file(s)\n` +
          `• **Conflict Risk:** ${scan.hasConflicts ? '⚠️ Yes' : '✅ No'}`;

        setChatMessages?.((prev: any[]) => [
          ...prev,
          { role: 'ai', text: scanSummary, timestamp: Date.now() },
        ]);

        setEditorOutput((prev: string) => prev + '[GIT] Scan complete and posted to chat.\n');
      } else {
        setEditorOutput((prev: string) => prev + `[GIT] Scan failed: ${data.error}\n`);
      }
    } catch {
      setEditorOutput((prev: string) => prev + '[GIT] ERROR: Could not reach server.\n');
    }

    setIsScanningGit(false);
  }, [setEditorOutput, setChatMessages]);

  return {
    gitRepo,
    setGitRepo,
    handleGitInit,
    handleGitStage,
    handleGitStageAll,
    handleGitUnstage,
    handleGitPush,
    gitScanResult,
    isScanningGit,
    handleGitScan,
  };
}
