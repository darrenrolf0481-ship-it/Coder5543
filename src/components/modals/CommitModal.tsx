import React from 'react';
import { X, GitBranch, GitMerge } from 'lucide-react';

interface CommitModalProps {
  isCommitModalOpen: boolean;
  setIsCommitModalOpen: (open: boolean) => void;
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  confirmGitCommit: () => void;
  stagedFilesCount: number;
}

export const CommitModal: React.FC<CommitModalProps> = ({
  isCommitModalOpen,
  setIsCommitModalOpen,
  commitMessage,
  setCommitMessage,
  confirmGitCommit,
  stagedFilesCount,
}) => {
  if (!isCommitModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#0d0404] border border-accent-900/30 rounded-[30px] shadow-[0_0_100px_var(--color-accent-800)/20] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-accent-900/20 bg-black/40 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="p-2 bg-accent-900/20 rounded-xl">
              <GitBranch className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-accent-100 uppercase tracking-tighter">
                Neural Commit
              </h3>
              <p className="text-[10px] text-accent-900 font-bold tracking-widest uppercase">
                Synchronizing {stagedFilesCount} changes to neural history
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCommitModalOpen(false)}
            className="p-2 text-accent-900 hover:text-accent-500 transition-colors"
            aria-label="Close commit modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-accent-800 uppercase tracking-[0.3em]">
              Commit Directive
            </label>
            <input
              autoFocus
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmGitCommit();
              }}
              placeholder="E.g., feat: modularize neural core infrastructure..."
              className="w-full bg-black/60 border border-accent-900/40 rounded-xl px-5 py-4 text-sm text-accent-100 focus:border-accent-500/60 outline-none transition-all"
              aria-label="Commit message input"
            />
          </div>
        </div>
        <div className="p-6 border-t border-accent-900/20 bg-black/40 flex justify-end">
          <button
            onClick={confirmGitCommit}
            disabled={!commitMessage.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 bg-accent-700 hover:bg-accent-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-50"
            aria-label="Confirm Commit"
          >
            <GitMerge className="w-4 h-4" /> Finalize Commit
          </button>
        </div>
      </div>
    </div>
  );
};
