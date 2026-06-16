import React from 'react';
import {
  Brain,
  X,
  Search,
  Users,
  Sparkles,
  Save,
  FileText,
  Check,
  Zap,
  RefreshCw,
  Send,
} from 'lucide-react';
import { SafeMarkdown } from '../SafeMarkdown';
import { ActionButton } from '../ActionButton';

// ── Props ──────────────────────────────────────────────────────────────────

interface AssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  input: string;
  onInputChange: (v: string) => void;
  onSubmit: (e?: React.FormEvent, promptOverride?: string) => void;
  onCodeReview: () => void;
  onSaveAnalysis: (text: string) => void;
  onApplyDocumentation: (code: string, isSelection: boolean, selection: any) => void;
  onApplyRefactor: (code: string, isSelection: boolean, selection: any) => void;
  onApplyForge: (code: string, isSnippet: boolean) => void;
  isProcessing: boolean;
  isPairProgrammerActive: boolean;
  lastPrompt: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export const AssistantSidebar: React.FC<AssistantSidebarProps> = ({
  isOpen,
  onClose,
  messages,
  input,
  onInputChange,
  onSubmit,
  onCodeReview,
  onSaveAnalysis,
  onApplyDocumentation,
  onApplyRefactor,
  onApplyForge,
  isProcessing,
  isPairProgrammerActive,
  lastPrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:z-auto w-full lg:w-80 flex flex-col code-editor-bg rounded-none lg:rounded-[40px] border-0 lg:border border-accent-900/30 shadow-2xl overflow-hidden animate-in slide-in-from-right-5 duration-300">
      <div className="h-16 border-b border-accent-900/20 flex items-center justify-between px-6 md:px-8 bg-black/40">
        <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
          <Brain className="w-4 h-4" /> Neural Assistant
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onCodeReview}
            disabled={isProcessing}
            className="p-2 text-accent-900 hover:text-accent-500 transition-colors"
            title="Perform Code Review"
          >
            <Search className="w-4 h-4" />
          </button>
          {isPairProgrammerActive && (
            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-pulse">
              <Users className="w-3 h-3 text-emerald-500" />
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                Pairing
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-accent-900 hover:text-accent-500 transition-colors p-2"
          >
            <X className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-30">
            <Sparkles className="w-12 h-12 text-accent-600 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              Awaiting neural synchronization...
            </p>
          </div>
        )}
        {messages.map((msg: any, i: number) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-4 text-[12px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent-800 text-white rounded-tr-none'
                  : 'bg-[#1a0505] border border-accent-800/40 text-accent-100 rounded-tl-none shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]'
              }`}
            >
              <div className="markdown-body">
                <SafeMarkdown>{msg.text}</SafeMarkdown>
              </div>

              {/* Action buttons — always outside markdown div, always reachable */}
              {msg.role === 'ai' && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-accent-900/20 empty:hidden">
                  {(msg.text.includes('CODE_ANALYSIS') ||
                    msg.text.includes('FULL_PROJECT_ANALYSIS') ||
                    msg.text.includes('DEEP_PROJECT_AUDIT')) && (
                    <ActionButton
                      onClick={() => onSaveAnalysis(msg.text)}
                      icon={Save}
                      label="Save Report"
                      activeLabel="Saved!"
                    />
                  )}

                  {msg.text.includes('DOCUMENTATION_GENERATED') &&
                    msg.metadata?.documentedCode && (
                      <ActionButton
                        onClick={() =>
                          onApplyDocumentation(
                            msg.metadata.documentedCode,
                            msg.metadata.isSelection,
                            msg.metadata.selection,
                          )
                        }
                        icon={FileText}
                        label="Apply Documentation"
                        activeLabel="Applied!"
                      />
                    )}

                  {msg.text.includes('REFACTOR_COMPLETE') && msg.metadata?.refactoredCode && (
                    <>
                      {msg.metadata.explanation && (
                        <div className="w-full p-3 bg-black/40 rounded-lg border border-accent-900/30 mb-1">
                          <h6 className="text-[9px] font-black text-accent-500 uppercase tracking-widest mb-1">
                            Refactoring Explanation
                          </h6>
                          <p className="text-[11px] text-accent-200/80 leading-relaxed">
                            {msg.metadata.explanation}
                          </p>
                        </div>
                      )}
                      <ActionButton
                        onClick={() =>
                          onApplyRefactor(
                            msg.metadata.refactoredCode,
                            msg.metadata.isSelection,
                            msg.metadata.selection,
                          )
                        }
                        icon={Check}
                        label="Apply Refactor"
                        activeLabel="Applied!"
                      />
                    </>
                  )}

                  {msg.metadata?.generatedCode && (
                    <ActionButton
                      onClick={() => onApplyForge(msg.metadata.generatedCode, msg.metadata.isSnippet)}
                      icon={Zap}
                      label={msg.metadata.isSnippet ? 'Insert Snippet' : 'Replace File'}
                      activeLabel="Forged!"
                      variant="emerald"
                    />
                  )}

                  {msg.text.includes('[CRITICAL_FAILURE]') && lastPrompt && (
                    <ActionButton
                      onClick={() => onSubmit(undefined, lastPrompt)}
                      icon={RefreshCw}
                      label="Retry"
                      activeLabel="Retrying..."
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-2 px-1 animate-pulse">
            <div className="w-1.5 h-1.5 bg-accent-600 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-accent-600 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-accent-600 rounded-full"></div>
          </div>
        )}
      </div>
      <form
        onSubmit={onSubmit}
        className="p-4 bg-black/40 border-t border-accent-900/20"
      >
        <div className="relative">
          <input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask assistant..."
            className="w-full bg-[#0d0404] border border-accent-900/40 rounded-xl px-4 py-3 text-[11px] text-accent-100 focus:border-accent-600/60 outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-600 hover:text-accent-400"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};