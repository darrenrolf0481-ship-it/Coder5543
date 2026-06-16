import React from 'react';
import {
  X,
  Info,
  Edit2,
  Trash2,
  Copy,
  Code2,
  MousePointer2,
  RefreshCw,
  Zap,
  StepForward,
  Wand2,
  PlayCircle,
  StopCircle,
  Sparkles,
  GitBranch,
  GitPullRequest,
  GitMerge,
  Archive,
  History,
  Check,
  Folder,
  Settings,
  Cpu,
  Globe,
  UserCircle,
  Database,
  Plus,
  Activity,
} from 'lucide-react';
import DOMPurify from 'dompurify';

// ── Types ──────────────────────────────────────────────────────────────────

interface GitRepo {
  initialized: boolean;
  branch: string;
  commits: { id: string; message: string; timestamp: number; author: string }[];
  staged: string[];
  modified: string[];
  stash: any[];
}

interface ProjectSettings {
  buildPath: string;
  compilerFlags: string;
  ollamaUrl: string;
  envVariables: { key: string; value: string }[];
  projectProfiles: { id: string; name: string; instruction: string }[];
  activeProfileId: string;
}

interface InspectedElement {
  tagName: string;
  className: string;
  id: string;
  rect: { top: number; left: number; width: number; height: number } | null;
  styles: Record<string, string>;
}

interface DebugState {
  isActive: boolean;
  currentLine: number;
  variables: Record<string, any>;
  callStack: string[];
}

// ── Terminal Mode ──────────────────────────────────────────────────────────

const TerminalOutput: React.FC<{
  isRunning: boolean;
  output: string;
}> = ({ isRunning, output }) => (
  <div className="h-full p-4 md:p-8 font-mono text-[13px] overflow-y-auto custom-scrollbar text-accent-100/80">
    {isRunning ? (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-accent-500 animate-pulse">
          <Zap className="w-3 h-3" />
          <span>NEURAL_LINK_ESTABLISHED...</span>
        </div>
        <div className="text-accent-900/60">
          [SYSTEM] Initializing virtual environment...
        </div>
        <div className="text-accent-900/60">[KERNEL] Allocating neural buffers...</div>
      </div>
    ) : (
      <pre className="whitespace-pre-wrap leading-relaxed">
        {output || '[IDLE] Neural runtime awaiting execution...'}
      </pre>
    )}
  </div>
);

// ── Preview Mode ──────────────────────────────────────────────────────────

const PreviewPanel: React.FC<{
  isInspectorActive: boolean;
  setIsInspectorActive: (v: boolean) => void;
  editorContent: string;
  setEditorContent: (v: string) => void;
  isLivePreviewEnabled: boolean;
  debouncedEditorContent: string;
  inspectedElement: InspectedElement | null;
  setInspectedElement: React.Dispatch<React.SetStateAction<any>>;
  inspectedElementRef: React.MutableRefObject<HTMLElement | null>;
  previewContainerRef: React.RefObject<HTMLDivElement>;
  handleInspectMouseMove: (e: React.MouseEvent) => void;
  handleInspectClick: (e: React.MouseEvent) => void;
  handleStyleChange: (property: string, value: string) => void;
  setEditorOutput: React.Dispatch<React.SetStateAction<string>>;
}> = ({
  isInspectorActive,
  setIsInspectorActive,
  editorContent,
  setEditorContent,
  isLivePreviewEnabled,
  debouncedEditorContent,
  inspectedElement,
  setInspectedElement,
  inspectedElementRef,
  previewContainerRef,
  handleInspectMouseMove,
  handleInspectClick,
  handleStyleChange,
  setEditorOutput,
}) => (
  <div className="h-full flex flex-col">
    {/* Preview Toolbar */}
    <div className="p-4 bg-accent-950/20 border-b border-accent-900/20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsInspectorActive(!isInspectorActive)}
          className={`p-2 rounded-lg transition-all ${isInspectorActive ? 'bg-accent-700 text-white shadow-lg' : 'bg-accent-950/40 border border-accent-900/30 text-accent-500 hover:bg-accent-900/20'}`}
          title="Toggle Component Inspector"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setEditorContent(editorContent)}
          className="p-2 bg-accent-950/40 border border-accent-900/30 text-accent-500 rounded-lg hover:bg-accent-900/20 transition-all"
          title="Refresh Preview"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-black text-accent-500 uppercase tracking-widest">
          Live UI Preview
        </span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-500/60 uppercase">
            Synchronized
          </span>
        </div>
      </div>
    </div>

    <div className="flex-1 flex min-h-0">
      <div
        ref={previewContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-6 relative"
        onMouseMove={handleInspectMouseMove}
        onClick={handleInspectClick}
      >
        <div
          className="w-full min-h-full bg-black/40 rounded-2xl border border-accent-900/20 overflow-hidden relative"
          dangerouslySetInnerHTML={{
            __html: isLivePreviewEnabled
              ? DOMPurify.sanitize(debouncedEditorContent)
              : '',
          }}
        />
        {/* Inspector Highlight Overlay */}
        {inspectedElement && inspectedElement.rect && (
          <div
            className="absolute pointer-events-none border-2 border-accent-500 bg-accent-500/10 z-50 transition-all duration-75"
            style={{
              top: inspectedElement.rect.top + 24,
              left: inspectedElement.rect.left + 24,
              width: inspectedElement.rect.width,
              height: inspectedElement.rect.height,
            }}
          >
            <div className="absolute -top-6 left-0 bg-accent-700 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">
              {inspectedElement.tagName}{' '}
              {inspectedElement.id && `#${inspectedElement.id}`}
            </div>
          </div>
        )}
      </div>

      {/* Inspector Details Panel */}
      {inspectedElement && (
        <div className="w-full md:w-80 absolute md:relative right-0 top-0 bottom-0 z-50 bg-[#080101] border-l border-accent-900/30 p-6 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300">
          <button
            onClick={() => {
              if (previewContainerRef.current) {
                previewContainerRef.current
                  .querySelectorAll('[data-neural-inspect]')
                  .forEach((el) => {
                    el.removeAttribute('data-neural-inspect');
                  });
                const contentWrapper =
                  previewContainerRef.current.querySelector('.bg-black\\/40');
                if (contentWrapper) {
                  setEditorContent(contentWrapper.innerHTML);
                }
              }
              setInspectedElement(null);
              setIsInspectorActive(false);
              inspectedElementRef.current = null;
            }}
            className="absolute top-4 right-4 p-2 text-accent-900 hover:text-accent-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-black text-accent-500 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4" /> Component Info
                </h5>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (inspectedElementRef.current) {
                        navigator.clipboard.writeText(
                          inspectedElementRef.current.outerHTML,
                        );
                        setEditorOutput(
                          (prev) => prev + '[SYSTEM] Element HTML copied to clipboard.\n',
                        );
                      }
                    }}
                    className="p-1.5 bg-accent-950/40 border border-accent-900/30 rounded-lg text-accent-500 hover:bg-accent-900/20 transition-all"
                    title="Copy HTML"
                  >
                    <Code2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        inspectedElementRef.current &&
                        confirm('Are you sure you want to delete this element?')
                      ) {
                        inspectedElementRef.current.remove();
                        setInspectedElement(null);
                        const contentWrapper =
                          previewContainerRef.current?.querySelector('.bg-black\\/40');
                        if (contentWrapper) {
                          setEditorContent(contentWrapper.innerHTML);
                        }
                      }
                    }}
                    className="p-1.5 bg-accent-950/40 border border-accent-900/30 rounded-lg text-accent-500 hover:bg-accent-900/20 transition-all"
                    title="Delete Element"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-accent-950/10 border border-accent-900/20 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-accent-900 uppercase font-black">
                    Tag
                  </span>
                  <span className="text-[11px] font-mono text-accent-100 uppercase">
                    {inspectedElement.tagName}
                  </span>
                </div>
                {inspectedElement.id && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-accent-900 uppercase font-black">
                      ID
                    </span>
                    <span className="text-[11px] font-mono text-accent-100">
                      {inspectedElement.id}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[10px] text-accent-900 uppercase font-black">
                    Classes
                  </span>
                  <div className="text-[10px] font-mono text-accent-100/60 break-all leading-relaxed">
                    {inspectedElement.className || 'None'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-black text-accent-500 uppercase tracking-widest flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Style Editor
                </h5>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const styleStr = Object.entries(inspectedElement.styles)
                        .map(
                          ([k, v]) =>
                            `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${v};`,
                        )
                        .join(' ');
                      navigator.clipboard.writeText(styleStr);
                      setEditorOutput(
                        (prev) => prev + '[SYSTEM] Styles copied to clipboard.\n',
                      );
                    }}
                    className="p-1.5 bg-accent-950/40 border border-accent-900/30 rounded-lg text-accent-500 hover:bg-accent-900/20 transition-all"
                    title="Copy Styles"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      const prop = prompt(
                        'Enter CSS property name (e.g., border-radius):',
                      );
                      if (prop) {
                        const value = inspectedElement.styles[prop] || inspectedElement.styles[prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
                        if (value) {
                          navigator.clipboard.writeText(`${prop}: ${value}`);
                          setEditorOutput(
                            (prev) => prev + `[SYSTEM] Copied: ${prop}: ${value}\n`,
                          );
                        }
                      }
                    }}
                    className="p-1.5 bg-accent-950/40 border border-accent-900/30 rounded-lg text-accent-500 hover:bg-accent-900/20 transition-all"
                    title="Copy Single Property"
                  >
                    <Code2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(inspectedElement.styles).map(([prop, value]) => (
                  <div
                    key={prop}
                    className="flex items-center justify-between p-2 bg-accent-950/10 border border-accent-900/10 rounded-xl group"
                  >
                    <span className="text-[10px] font-mono text-accent-500">
                      {prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-accent-100/60">
                        {value}
                      </span>
                      <button
                        onClick={() => {
                          const newValue = prompt(`Change ${prop}:`, value);
                          if (newValue !== null) {
                            handleStyleChange(prop, newValue);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-accent-900 hover:text-accent-500 transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ── Debug Mode ──────────────────────────────────────────────────────────

const DebugPanel: React.FC<{
  debugState: DebugState;
  debugRefactorResult: { refactoredCode: string; explanation: string } | null;
  setDebugRefactorResult: (v: any) => void;
  breakpoints: number[];
  isAiProcessing: boolean;
  onStep: () => void;
  onDebugRefactor: () => void;
  onStartDebug: () => void;
  onStopDebug: () => void;
  onApplyDebugRefactor: () => void;
}> = ({
  debugState,
  debugRefactorResult,
  setDebugRefactorResult,
  breakpoints,
  isAiProcessing,
  onStep,
  onDebugRefactor,
  onStartDebug,
  onStopDebug,
  onApplyDebugRefactor,
}) => (
  <div className="h-full flex flex-col">
    <div className="p-4 bg-accent-950/20 border-b border-accent-900/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={onStep}
          disabled={isAiProcessing || !debugState.isActive}
          className="p-2 bg-accent-700 rounded-lg text-white hover:bg-accent-600 transition-all disabled:opacity-50"
          title="Step Forward"
        >
          <StepForward className="w-4 h-4" />
        </button>
        <button
          onClick={onDebugRefactor}
          disabled={isAiProcessing || !debugState.isActive}
          className="p-2 bg-accent-950/40 border border-accent-900/30 text-accent-500 rounded-lg hover:bg-accent-900/20 transition-all disabled:opacity-50"
          title="AI Debug Refactor"
        >
          <Wand2 className="w-4 h-4" />
        </button>
        <button
          onClick={onStartDebug}
          disabled={isAiProcessing}
          className="p-2 bg-accent-950/40 border border-accent-900/30 text-accent-500 rounded-lg hover:bg-accent-900/20 transition-all disabled:opacity-50"
          title="Restart Debugger"
        >
          <PlayCircle className="w-4 h-4" />
        </button>
        <button
          onClick={onStopDebug}
          className="p-2 bg-accent-950/40 border border-accent-900/30 text-accent-500 rounded-lg hover:bg-accent-900/20 transition-all"
          title="Stop Debugger"
        >
          <StopCircle className="w-4 h-4" />
        </button>
      </div>
      <span className="text-[10px] font-black text-accent-500 uppercase tracking-widest">
        Line: {debugState.currentLine}
      </span>
    </div>
    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
      <div className="space-y-3">
        <h5 className="text-[10px] font-black text-accent-800 uppercase tracking-widest">
          Variables
        </h5>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(debugState.variables).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between p-3 bg-accent-950/10 border border-accent-900/10 rounded-xl font-mono text-[11px]"
            >
              <span className="text-accent-400">{k}</span>
              <span className="text-accent-100">{JSON.stringify(v)}</span>
            </div>
          ))}
          {Object.keys(debugState.variables).length === 0 && (
            <p className="text-[10px] text-accent-900 italic">No variables in scope.</p>
          )}
        </div>
      </div>

      {debugRefactorResult && (
        <div className="p-5 bg-accent-900/10 border border-accent-500/30 rounded-3xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-black text-accent-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> AI Debug Refactor
            </h5>
            <button
              onClick={() => setDebugRefactorResult(null)}
              className="text-accent-900 hover:text-accent-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-black/40 rounded-xl border border-accent-900/20 font-mono text-[10px] text-accent-100/80 overflow-x-auto">
              <pre>{debugRefactorResult.refactoredCode}</pre>
            </div>
            <p className="text-[11px] text-accent-100/60 leading-relaxed italic">
              {debugRefactorResult.explanation}
            </p>
            <button
              onClick={onApplyDebugRefactor}
              className="w-full py-2 bg-accent-700 hover:bg-accent-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg transition-all"
            >
              Apply Refactor
            </button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        <h5 className="text-[10px] font-black text-accent-800 uppercase tracking-widest">
          Call Stack
        </h5>
        <div className="space-y-2">
          {debugState.callStack.map((frame, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-[11px] font-mono text-accent-100/60"
            >
              <span className="text-accent-900">#{i}</span>
              <span>{frame}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h5 className="text-[10px] font-black text-accent-800 uppercase tracking-widest">
          Breakpoints
        </h5>
        <div className="flex flex-wrap gap-2">
          {breakpoints.map((line) => (
            <div
              key={line}
              className="px-3 py-1 bg-accent-900/20 border border-accent-500/30 rounded-full text-[10px] text-accent-500 font-black"
            >
              Line {line}
            </div>
          ))}
          {breakpoints.length === 0 && (
            <p className="text-[10px] text-accent-900 italic">No breakpoints set.</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ── Git Mode ──────────────────────────────────────────────────────────

const GitPanel: React.FC<{
  gitRepo: GitRepo;
  projectFiles: any[];
  onGitInit: () => void;
  onGitPull: () => void;
  onGitPush: () => void;
  onGitStash: () => void;
  onGitPop: () => void;
  onGitSaveAll: () => void;
  onGitCommit: () => void;
  onGitStage: (id: string) => void;
  onGitStageAll: () => void;
  onGitUnstage: (id: string) => void;
}> = ({
  gitRepo,
  projectFiles,
  onGitInit,
  onGitPull,
  onGitPush,
  onGitStash,
  onGitPop,
  onGitSaveAll,
  onGitCommit,
  onGitStage,
  onGitStageAll,
  onGitUnstage,
}) => (
  <div className="h-full flex flex-col">
    {!gitRepo.initialized ? (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center space-y-6">
        <GitBranch className="w-16 h-16 text-accent-900/40" />
        <div className="space-y-2">
          <h5 className="text-[12px] font-black text-accent-500 uppercase tracking-widest">
            Neural Repository Not Found
          </h5>
          <p className="text-[10px] text-accent-900/60 leading-relaxed max-w-[240px]">
            Initialize a repository to begin tracking neural state changes and
            synchronization.
          </p>
        </div>
        <button
          onClick={onGitInit}
          className="px-6 py-2.5 bg-accent-700 hover:bg-accent-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all"
        >
          Initialize Repository
        </button>
      </div>
    ) : (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 bg-accent-950/20 border-b border-accent-900/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-accent-500 uppercase tracking-widest">
              <GitBranch className="w-3 h-3" />
              {gitRepo.branch}
            </div>
            <div className="h-4 w-px bg-accent-900/30" />
            <div className="flex items-center gap-3">
              <button
                onClick={onGitPull}
                title="Pull"
                className="text-accent-900 hover:text-accent-500 transition-colors"
              >
                <GitPullRequest className="w-4 h-4" />
              </button>
              <button
                onClick={onGitPush}
                title="Push"
                className="text-accent-900 hover:text-accent-500 transition-colors"
              >
                <GitMerge className="w-4 h-4" />
              </button>
              <button
                onClick={onGitStash}
                title="Stash"
                className="text-accent-900 hover:text-accent-500 transition-colors"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={onGitPop}
                title="Pop Stash"
                className="text-accent-900 hover:text-accent-500 transition-colors"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onGitSaveAll}
              disabled={gitRepo.modified.length === 0 && gitRepo.staged.length === 0}
              className="px-4 py-1.5 bg-accent-900/50 hover:bg-accent-800 text-accent-100 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-30 border border-accent-800/30"
            >
              Save All
            </button>
            <button
              onClick={onGitCommit}
              disabled={gitRepo.staged.length === 0}
              className="px-4 py-1.5 bg-accent-700 hover:bg-accent-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-30"
            >
              Commit
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 md:space-y-8 custom-scrollbar">
          {/* Staged Changes */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black text-accent-800 uppercase tracking-widest flex items-center justify-between">
              Staged Changes
              <span className="text-accent-900/40">{gitRepo.staged.length}</span>
            </h5>
            <div className="space-y-1">
              {gitRepo.staged.map((id) => {
                const file = projectFiles.find((f) => f.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-3 bg-accent-950/10 border border-accent-900/10 rounded-xl group"
                  >
                    <div className="flex items-center gap-3">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-[11px] font-mono text-accent-100">
                        {file?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => onGitUnstage(id)}
                      className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-accent-900 hover:text-accent-500 uppercase tracking-widest transition-all"
                    >
                      Unstage
                    </button>
                  </div>
                );
              })}
              {gitRepo.staged.length === 0 && (
                <p className="text-[10px] text-accent-900/40 italic">
                  No staged changes.
                </p>
              )}
            </div>
          </div>

          {/* Modified Changes */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black text-accent-800 uppercase tracking-widest flex items-center justify-between">
              Modified
              {gitRepo.modified.length > 0 && (
                <button
                  onClick={onGitStageAll}
                  className="text-[9px] font-black text-accent-900 hover:text-accent-500 uppercase tracking-widest transition-all"
                >
                  Stage All
                </button>
              )}
              <span className="text-accent-900/40">{gitRepo.modified.length}</span>
            </h5>
            <div className="space-y-1">
              {gitRepo.modified.map((id) => {
                const file = projectFiles.find((f) => f.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-3 bg-accent-950/5 border border-accent-900/5 rounded-xl group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                      <span className="text-[11px] font-mono text-accent-100/60">
                        {file?.name}
                      </span>
                    </div>
                    <button
                      onClick={() => onGitStage(id)}
                      className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-accent-900 hover:text-accent-500 uppercase tracking-widest transition-all"
                    >
                      Stage
                    </button>
                  </div>
                );
              })}
              {gitRepo.modified.length === 0 && (
                <p className="text-[10px] text-accent-900/40 italic">
                  No modified files.
                </p>
              )}
            </div>
          </div>

          {/* Commit History */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black text-accent-800 uppercase tracking-widest flex items-center gap-2">
              <History className="w-3 h-3" />
              History
            </h5>
            <div className="space-y-4 border-l border-accent-900/20 ml-2 pl-4">
              {gitRepo.commits.map((commit) => (
                <div key={commit.id} className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-accent-900 border border-accent-500/30" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-accent-100">
                      {commit.message}
                    </span>
                    <span className="text-[9px] font-mono text-accent-900">
                      {commit.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-accent-900/60 uppercase tracking-widest">
                    <span>{commit.author}</span>
                    <span>{new Date(commit.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {gitRepo.commits.length === 0 && (
                <p className="text-[10px] text-accent-900/40 italic">
                  No commit history.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

// ── Settings Mode ──────────────────────────────────────────────────────

const SettingsPanel: React.FC<{
  projectSettings: ProjectSettings;
  setProjectSettings: React.Dispatch<React.SetStateAction<any>>;
  validateProjectSettings: (settings: any) => boolean;
  validationErrors: Record<string, string>;
  ollamaStatus: 'idle' | 'connecting' | 'connected' | 'error';
  refreshOllamaModels: () => void;
}> = ({
  projectSettings,
  setProjectSettings,
  validateProjectSettings,
  validationErrors,
  ollamaStatus,
  refreshOllamaModels,
}) => (
  <div className="h-full flex flex-col p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
    <div className="space-y-2">
      <h5 className="text-[12px] font-black text-accent-500 uppercase tracking-widest flex items-center gap-3">
        <Settings className="w-4 h-4" /> Project Configuration
      </h5>
      <p className="text-[10px] text-accent-900/60 leading-relaxed">
        Manage neural build paths, compiler directives, and environment state.
      </p>
    </div>

    <div className="space-y-6">
      {/* Build Path */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-accent-800 uppercase tracking-widest flex items-center gap-2">
          <Folder className="w-3 h-3" /> Build Output Path
        </label>
        <input
          value={projectSettings.buildPath}
          onChange={(e) => {
            const newSettings = { ...projectSettings, buildPath: e.target.value };
            setProjectSettings(newSettings);
            validateProjectSettings(newSettings);
          }}
          className={`w-full bg-accent-950/10 border ${validationErrors.buildPath ? 'border-accent-500' : 'border-accent-900/20'} rounded-xl px-4 py-3 text-[11px] font-mono text-accent-100 outline-none focus:border-accent-600/40 transition-all`}
        />
        {validationErrors.buildPath && (
          <p className="text-[9px] text-accent-500 font-black uppercase tracking-widest">
            {validationErrors.buildPath}
          </p>
        )}
      </div>

      {/* Compiler Flags */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-accent-800 uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-3 h-3" /> Neural Compiler Flags
        </label>
        <input
          value={projectSettings.compilerFlags}
          onChange={(e) => {
            const newSettings = { ...projectSettings, compilerFlags: e.target.value };
            setProjectSettings(newSettings);
            validateProjectSettings(newSettings);
          }}
          className={`w-full bg-accent-950/10 border ${validationErrors.compilerFlags ? 'border-accent-500' : 'border-accent-900/20'} rounded-xl px-4 py-3 text-[11px] font-mono text-accent-100 outline-none focus:border-accent-600/40 transition-all`}
        />
        {validationErrors.compilerFlags && (
          <p className="text-[9px] text-accent-500 font-black uppercase tracking-widest">
            {validationErrors.compilerFlags}
          </p>
        )}
      </div>

      {/* Ollama URL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-accent-800 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-3 h-3" /> Ollama Node URL
          </label>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                ollamaStatus === 'connected'
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                  : ollamaStatus === 'connecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : ollamaStatus === 'error'
                      ? 'bg-accent-500'
                      : 'bg-gray-500'
              }`}
            />
            <span className="text-[8px] font-mono uppercase tracking-tighter opacity-40">
              {ollamaStatus}
            </span>
            <button
              onClick={() => refreshOllamaModels()}
              className="p-1 hover:bg-accent-500/10 rounded-md transition-colors"
              title="Refresh Models"
            >
              <Zap size={10} className="text-accent-500/60" />
            </button>
          </div>
        </div>
        <input
          value={projectSettings.ollamaUrl}
          onChange={(e) => {
            const newSettings = { ...projectSettings, ollamaUrl: e.target.value };
            setProjectSettings(newSettings);
            validateProjectSettings(newSettings);
          }}
          className={`w-full bg-accent-950/10 border ${validationErrors.ollamaUrl ? 'border-accent-500' : 'border-accent-900/20'} rounded-xl px-4 py-3 text-[11px] font-mono text-accent-100 outline-none focus:border-accent-600/40 transition-all`}
          placeholder="http://127.0.0.1:11434"
        />
        {validationErrors.ollamaUrl && (
          <p className="text-[9px] text-accent-500 font-black uppercase tracking-widest">
            {validationErrors.ollamaUrl}
          </p>
        )}
      </div>

      {/* Project Profiles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-accent-800 uppercase tracking-widest flex items-center gap-2">
            <UserCircle className="w-3 h-3" /> Project Profiles
          </label>
          <button
            onClick={() =>
              setProjectSettings({
                ...projectSettings,
                projectProfiles: [
                  ...projectSettings.projectProfiles,
                  {
                    id: Date.now().toString(),
                    name: 'New Profile',
                    instruction: 'New instructions...',
                  },
                ],
              })
            }
            className="p-1.5 bg-accent-900/20 border border-accent-900/30 rounded-lg text-accent-500 hover:bg-accent-900/40 transition-all"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <select
          value={projectSettings.activeProfileId}
          onChange={(e) =>
            setProjectSettings({ ...projectSettings, activeProfileId: e.target.value })
          }
          className="w-full bg-accent-950/10 border border-accent-900/20 rounded-xl px-4 py-2 text-[10px] font-mono text-accent-100 outline-none focus:border-accent-600/40 transition-all"
        >
          {projectSettings.projectProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {projectSettings.projectProfiles.map((p, idx) => (
          <div
            key={p.id}
            className="space-y-2 bg-accent-950/10 p-3 rounded-xl border border-accent-900/10"
          >
            <input
              placeholder="Profile Name"
              value={p.name}
              onChange={(e) => {
                const newProfiles = [...projectSettings.projectProfiles];
                newProfiles[idx].name = e.target.value;
                setProjectSettings({
                  ...projectSettings,
                  projectProfiles: newProfiles,
                });
              }}
              className="w-full bg-transparent border-b border-accent-900/20 px-2 py-1 text-[10px] font-black text-accent-100 outline-none"
            />
            <textarea
              placeholder="Instructions"
              value={p.instruction}
              onChange={(e) => {
                const newProfiles = [...projectSettings.projectProfiles];
                newProfiles[idx].instruction = e.target.value;
                setProjectSettings({
                  ...projectSettings,
                  projectProfiles: newProfiles,
                });
              }}
              className="w-full bg-transparent border border-accent-900/20 rounded-lg px-2 py-1 text-[10px] font-mono text-accent-100 outline-none h-20"
            />
          </div>
        ))}
      </div>

      {/* Environment Variables */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-accent-800 uppercase tracking-widest flex items-center gap-2">
            <Database className="w-3 h-3" /> Environment Variables
          </label>
          <button
            onClick={() =>
              setProjectSettings({
                ...projectSettings,
                envVariables: [...projectSettings.envVariables, { key: '', value: '' }],
              })
            }
            className="p-1.5 bg-accent-900/20 border border-accent-900/30 rounded-lg text-accent-500 hover:bg-accent-900/40 transition-all"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {projectSettings.envVariables.map((env: { key: string; value: string }, idx: number) => (
            <div key={idx} className="space-y-1">
              <div className="flex gap-2">
                <input
                  placeholder="KEY"
                  value={env.key}
                  onChange={(e) => {
                    const newEnv = [...projectSettings.envVariables];
                    newEnv[idx].key = e.target.value;
                    const newSettings = { ...projectSettings, envVariables: newEnv };
                    setProjectSettings(newSettings);
                    validateProjectSettings(newSettings);
                  }}
                  className={`flex-1 bg-accent-950/10 border ${validationErrors[`env_key_${idx}`] ? 'border-accent-500' : 'border-accent-900/20'} rounded-xl px-4 py-2 text-[10px] font-mono text-accent-100 outline-none focus:border-accent-600/40 transition-all`}
                />
                <input
                  placeholder="VALUE"
                  value={env.value}
                  onChange={(e) => {
                    const newEnv = [...projectSettings.envVariables];
                    newEnv[idx].value = e.target.value;
                    const newSettings = { ...projectSettings, envVariables: newEnv };
                    setProjectSettings(newSettings);
                    validateProjectSettings(newSettings);
                  }}
                  className={`flex-2 bg-accent-950/10 border ${validationErrors[`env_value_${idx}`] ? 'border-accent-500' : 'border-accent-900/20'} rounded-xl px-4 py-2 text-[10px] font-mono text-accent-100 outline-none focus:border-accent-600/40 transition-all`}
                />
                <button
                  onClick={() => {
                    const newEnv = projectSettings.envVariables.filter(
                      (_: any, i: number) => i !== idx,
                    );
                    const newSettings = { ...projectSettings, envVariables: newEnv };
                    setProjectSettings(newSettings);
                    validateProjectSettings(newSettings);
                  }}
                  className="p-2 text-accent-900 hover:text-accent-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {(validationErrors[`env_key_${idx}`] ||
                validationErrors[`env_value_${idx}`]) && (
                <div className="flex flex-col gap-0.5 px-1">
                  {validationErrors[`env_key_${idx}`] && (
                    <p className="text-[8px] text-accent-500 font-black uppercase tracking-widest">
                      {validationErrors[`env_key_${idx}`]}
                    </p>
                  )}
                  {validationErrors[`env_value_${idx}`] && (
                    <p className="text-[8px] text-accent-500 font-black uppercase tracking-widest">
                      {validationErrors[`env_value_${idx}`]}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── Output Panel (Composition Root) ──────────────────────────────────────

export type EditorMode = 'code' | 'preview' | 'debug' | 'git' | 'settings';

interface OutputPanelProps {
  editorMode: EditorMode;
  setEditorMode: (v: EditorMode) => void;
  // Terminal props
  isRunningCode: boolean;
  editorOutput: string;
  // Preview props
  isInspectorActive: boolean;
  setIsInspectorActive: (v: boolean) => void;
  editorContent: string;
  setEditorContent: (v: string) => void;
  isLivePreviewEnabled: boolean;
  debouncedEditorContent: string;
  inspectedElement: InspectedElement | null;
  setInspectedElement: React.Dispatch<React.SetStateAction<any>>;
  inspectedElementRef: React.MutableRefObject<HTMLElement | null>;
  previewContainerRef: React.RefObject<HTMLDivElement>;
  handleInspectMouseMove: (e: React.MouseEvent) => void;
  handleInspectClick: (e: React.MouseEvent) => void;
  handleStyleChange: (property: string, value: string) => void;
  setEditorOutput: React.Dispatch<React.SetStateAction<string>>;
  // Debug props
  breakpoints: number[];
  debugState: DebugState;
  debugRefactorResult: { refactoredCode: string; explanation: string } | null;
  setDebugRefactorResult: (v: any) => void;
  isAiProcessing: boolean;
  handleStep: () => void;
  handleDebugRefactor: () => void;
  handleStartDebug: () => void;
  handleStopDebug: () => void;
  handleApplyDebugRefactor: () => void;
  // Git props
  gitRepo: GitRepo;
  projectFiles: any[];
  handleGitInit: () => void;
  handleGitPull: () => void;
  handleGitPush: () => void;
  handleGitStash: () => void;
  handleGitPop: () => void;
  handleGitSaveAll: () => void;
  handleGitCommit: () => void;
  handleGitStage: (id: string) => void;
  handleGitStageAll: () => void;
  handleGitUnstage: (id: string) => void;
  // Settings props
  projectSettings: ProjectSettings;
  setProjectSettings: React.Dispatch<React.SetStateAction<any>>;
  validateProjectSettings: (settings: any) => boolean;
  validationErrors: Record<string, string>;
  ollamaStatus: 'idle' | 'connecting' | 'connected' | 'error';
  refreshOllamaModels: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  editorMode,
  setEditorMode,
  isRunningCode,
  editorOutput,
  // Preview
  isInspectorActive,
  setIsInspectorActive,
  editorContent,
  setEditorContent,
  isLivePreviewEnabled,
  debouncedEditorContent,
  inspectedElement,
  setInspectedElement,
  inspectedElementRef,
  previewContainerRef,
  handleInspectMouseMove,
  handleInspectClick,
  handleStyleChange,
  setEditorOutput,
  // Debug
  breakpoints,
  debugState,
  debugRefactorResult,
  setDebugRefactorResult,
  isAiProcessing,
  handleStep,
  handleDebugRefactor,
  handleStartDebug,
  handleStopDebug,
  handleApplyDebugRefactor,
  // Git
  gitRepo,
  projectFiles,
  handleGitInit,
  handleGitPull,
  handleGitPush,
  handleGitStash,
  handleGitPop,
  handleGitSaveAll,
  handleGitCommit,
  handleGitStage,
  handleGitStageAll,
  handleGitUnstage,
  // Settings
  projectSettings,
  setProjectSettings,
  validateProjectSettings,
  validationErrors,
  ollamaStatus,
  refreshOllamaModels,
}) => (
  <div className="w-full lg:w-96 flex flex-col code-editor-bg rounded-[40px] border border-accent-900/30 shadow-2xl overflow-hidden">
    <div className="h-16 border-b border-accent-900/20 flex items-center px-8 bg-black/40 justify-between">
      <div className="flex bg-accent-950/20 p-1 rounded-xl border border-accent-900/20">
        <button
          onClick={() => setEditorMode('code')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'code' ? 'bg-accent-700 text-white shadow-lg' : 'text-accent-900 hover:text-accent-500'}`}
        >
          Terminal
        </button>
        <button
          onClick={() => setEditorMode('preview')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'preview' ? 'bg-accent-700 text-white shadow-lg' : 'text-accent-900 hover:text-accent-500'}`}
        >
          Preview
        </button>
        <button
          onClick={() => setEditorMode('debug')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'debug' ? 'bg-accent-700 text-white shadow-lg' : 'text-accent-900 hover:text-accent-500'}`}
        >
          Debugger
        </button>
        <button
          onClick={() => setEditorMode('git')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'git' ? 'bg-accent-700 text-white shadow-lg' : 'text-accent-900 hover:text-accent-500'}`}
        >
          Git
        </button>
        <button
          onClick={() => setEditorMode('settings')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'settings' ? 'bg-accent-700 text-white shadow-lg' : 'text-accent-900 hover:text-accent-500'}`}
        >
          Config
        </button>
      </div>
      <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
        <Activity className="w-4 h-4" /> Runtime
      </h4>
    </div>
    <div className="flex-1 overflow-hidden relative bg-black/20">
      {editorMode === 'code' && (
        <TerminalOutput isRunning={isRunningCode} output={editorOutput} />
      )}
      {editorMode === 'preview' && (
        <PreviewPanel
          isInspectorActive={isInspectorActive}
          setIsInspectorActive={setIsInspectorActive}
          editorContent={editorContent}
          setEditorContent={setEditorContent}
          isLivePreviewEnabled={isLivePreviewEnabled}
          debouncedEditorContent={debouncedEditorContent}
          inspectedElement={inspectedElement}
          setInspectedElement={setInspectedElement}
          inspectedElementRef={inspectedElementRef}
          previewContainerRef={previewContainerRef}
          handleInspectMouseMove={handleInspectMouseMove}
          handleInspectClick={handleInspectClick}
          handleStyleChange={handleStyleChange}
          setEditorOutput={setEditorOutput}
        />
      )}
      {editorMode === 'debug' && (
        <DebugPanel
          debugState={debugState}
          debugRefactorResult={debugRefactorResult}
          setDebugRefactorResult={setDebugRefactorResult}
          breakpoints={breakpoints}
          isAiProcessing={isAiProcessing}
          onStep={handleStep}
          onDebugRefactor={handleDebugRefactor}
          onStartDebug={handleStartDebug}
          onStopDebug={handleStopDebug}
          onApplyDebugRefactor={handleApplyDebugRefactor}
        />
      )}
      {editorMode === 'git' && (
        <GitPanel
          gitRepo={gitRepo}
          projectFiles={projectFiles}
          onGitInit={handleGitInit}
          onGitPull={handleGitPull}
          onGitPush={handleGitPush}
          onGitStash={handleGitStash}
          onGitPop={handleGitPop}
          onGitSaveAll={handleGitSaveAll}
          onGitCommit={handleGitCommit}
          onGitStage={handleGitStage}
          onGitStageAll={handleGitStageAll}
          onGitUnstage={handleGitUnstage}
        />
      )}
      {editorMode === 'settings' && (
        <SettingsPanel
          projectSettings={projectSettings}
          setProjectSettings={setProjectSettings}
          validateProjectSettings={validateProjectSettings}
          validationErrors={validationErrors}
          ollamaStatus={ollamaStatus}
          refreshOllamaModels={refreshOllamaModels}
        />
      )}
    </div>
  </div>
);