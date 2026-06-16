import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderOpen,
  X,
  Brain,
  LayoutTemplate,
  Upload,
  Folder,
  Save,
  ShieldCheck,
  Circle,
  Network,
  Wand2,
  Users,
  Play,
  Zap,
  Activity,
  Sparkles,
  Code2,
  Settings as SettingsIcon,
  Smartphone,
  GitBranch,
  Layers,
  Bug,
  ShieldAlert,
  FileText,
  Paintbrush,
} from 'lucide-react';
import { FileTree } from '../FileTree';
import { AnchoredMenu } from '../AnchoredMenu';
import Editor from '@monaco-editor/react';
import { AssistantSidebar } from './AssistantSidebar';
import { OutputPanel } from './OutputPanel';
import type { EditorMode } from './OutputPanel';

// ── Props ──────────────────────────────────────────────────────────────────

interface EditorPanelProps {
  // File state
  projectFiles: any[];
  activeFileId: string;
  setProjectFiles: React.Dispatch<React.SetStateAction<any[]>>;
  handleFileSwitch: (fileId: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Editor state
  editorContent: string;
  setEditorContent: (v: string) => void;
  editorLanguage: string;
  setEditorLanguage: (v: string) => void;
  editorOutput: string;
  setEditorOutput: React.Dispatch<React.SetStateAction<string>>;
  editorMode: 'code' | 'preview' | 'debug' | 'git' | 'settings';
  setEditorMode: (v: 'code' | 'preview' | 'debug' | 'git' | 'settings') => void;
  theme: 'dark' | 'light';

  // Debounced content for live preview
  debouncedEditorContent: string;

  // Run / scan state
  isRunningCode: boolean;
  isScanningCode: boolean;
  scanResults: number[];
  handleRunCode: () => void;
  handleScanCode: () => void;

  // Save state
  lastSavedTime: string | null;
  forceSave: () => void;
  saveToFile: () => void;

  // Preview & inspector state
  isLivePreviewEnabled: boolean;
  setIsLivePreviewEnabled: (v: boolean) => void;
  isInspectorActive: boolean;
  setIsInspectorActive: (v: boolean) => void;
  inspectedElement: {
    tagName: string;
    className: string;
    id: string;
    rect: { top: number; left: number; width: number; height: number } | null;
    styles: Record<string, string>;
  } | null;
  setInspectedElement: React.Dispatch<React.SetStateAction<any>>;
  inspectedElementRef: React.MutableRefObject<HTMLElement | null>;
  previewContainerRef: React.RefObject<HTMLDivElement>;
  handleInspectMouseMove: (e: React.MouseEvent) => void;
  handleInspectClick: (e: React.MouseEvent) => void;
  handleStyleChange: (property: string, value: string) => void;

  // Pair programmer
  isPairProgrammerActive: boolean;
  setIsPairProgrammerActive: (v: boolean) => void;

  // Assistant
  isEditorAssistantOpen: boolean;
  setIsEditorAssistantOpen: (v: boolean) => void;
  editorAssistantMessages: any[];
  editorAssistantInput: string;
  setEditorAssistantInput: (v: string) => void;
  handleEditorAssistantSubmit: (e?: React.FormEvent, promptOverride?: string) => void;
  handleCodeReview: () => void;
  handleSaveAnalysis: (analysisText: string) => void;
  handleApplyDocumentation: (documentedCode: string, isSelection: boolean, selection: any) => void;
  handleApplyRefactor: (refactoredCode: string, isSelection: boolean, selection: any) => void;
  handleApplyForge: (code: string, isSnippet: boolean) => void;

  // AI processing
  isAiProcessing: boolean;
  lastEditorAssistantPrompt: string;
  handleExplainCode: () => void;
  handleFullProjectAnalysis: () => void;
  handleDeepProjectAudit: () => void;
  handleGenerateDocs: () => void;
  handleFormatCode: (isMobile: boolean) => void;
  handleRefactorCode: () => void;
  handleRefactorAllFiles: () => void;
  handleAnalyzeData: () => void;
  handleGenerateCode: () => void;

  // Debugger
  breakpoints: number[];
  cursorLine: number;
  debugState: {
    isActive: boolean;
    currentLine: number;
    variables: Record<string, any>;
    callStack: string[];
  };
  debugRefactorResult: { refactoredCode: string; explanation: string } | null;
  setDebugRefactorResult: (v: any) => void;
  handleToggleCurrentLineBreakpoint: () => void;
  handleStartDebug: () => void;
  handleStopDebug: () => void;
  handleStep: () => void;
  handleDebugRefactor: () => void;
  handleApplyDebugRefactor: () => void;
  handleEditorDidMount: (editor: any) => void;

  // Git
  gitRepo: {
    initialized: boolean;
    branch: string;
    commits: { id: string; message: string; timestamp: number; author: string }[];
    staged: string[];
    modified: string[];
    stash: any[];
  };
  setGitRepo: React.Dispatch<React.SetStateAction<any>>;
  handleGitInit: () => void;
  handleGitPull: () => void;
  handleGitPush: () => void;
  handleGitStash: () => void;
  handleGitPop: () => void;
  handleGitSaveAll: () => void;
  handleGitCommit: () => void;
  handleGitStage: (fileId: string) => void;
  handleGitStageAll: () => void;
  handleGitUnstage: (fileId: string) => void;

  // Project settings
  projectSettings: {
    buildPath: string;
    compilerFlags: string;
    ollamaUrl: string;
    envVariables: { key: string; value: string }[];
    projectProfiles: { id: string; name: string; instruction: string }[];
    activeProfileId: string;
  };
  setProjectSettings: React.Dispatch<React.SetStateAction<any>>;
  validateProjectSettings: (settings: any) => boolean;
  validationErrors: Record<string, string>;
  ollamaStatus: 'idle' | 'connecting' | 'connected' | 'error';
  refreshOllamaModels: () => void;

  // Mobile file tree
  isMobileFileTreeOpen: boolean;
  setIsMobileFileTreeOpen: (v: boolean) => void;

  // Modals
  setIsGenerateModalOpen: (v: boolean) => void;
  setIsTemplateModalOpen: (v: boolean) => void;

  // Swarm
  swarmAnxiety: number;

  // Terminal output
  setTerminalOutput: React.Dispatch<React.SetStateAction<string[]>>;
}

// ── Component ──────────────────────────────────────────────────────────────

export const EditorPanel: React.FC<EditorPanelProps> = ({
  projectFiles,
  activeFileId,
  setProjectFiles,
  handleFileSwitch,
  handleFileUpload,
  editorContent,
  setEditorContent,
  editorLanguage,
  setEditorLanguage,
  editorOutput,
  setEditorOutput,
  editorMode,
  setEditorMode,
  theme,
  debouncedEditorContent,
  isRunningCode,
  isScanningCode,
  scanResults,
  handleRunCode,
  handleScanCode,
  lastSavedTime,
  forceSave,
  saveToFile,
  isLivePreviewEnabled,
  setIsLivePreviewEnabled,
  isInspectorActive,
  setIsInspectorActive,
  inspectedElement,
  setInspectedElement,
  inspectedElementRef,
  previewContainerRef,
  handleInspectMouseMove,
  handleInspectClick,
  handleStyleChange,
  isPairProgrammerActive,
  setIsPairProgrammerActive,
  isEditorAssistantOpen,
  setIsEditorAssistantOpen,
  editorAssistantMessages,
  editorAssistantInput,
  setEditorAssistantInput,
  handleEditorAssistantSubmit,
  handleCodeReview,
  handleSaveAnalysis,
  handleApplyDocumentation,
  handleApplyRefactor,
  handleApplyForge,
  isAiProcessing,
  lastEditorAssistantPrompt,
  handleExplainCode,
  handleFullProjectAnalysis,
  handleDeepProjectAudit,
  handleGenerateDocs,
  handleFormatCode,
  handleRefactorCode,
  handleRefactorAllFiles,
  handleAnalyzeData,
  handleGenerateCode,
  breakpoints,
  cursorLine,
  debugState,
  debugRefactorResult,
  setDebugRefactorResult,
  handleToggleCurrentLineBreakpoint,
  handleStartDebug,
  handleStopDebug,
  handleStep,
  handleDebugRefactor,
  handleApplyDebugRefactor,
  handleEditorDidMount,
  gitRepo,
  setGitRepo,
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
  projectSettings,
  setProjectSettings,
  validateProjectSettings,
  validationErrors,
  ollamaStatus,
  refreshOllamaModels,
  isMobileFileTreeOpen,
  setIsMobileFileTreeOpen,
  setIsGenerateModalOpen,
  setIsTemplateModalOpen,
  swarmAnxiety,
  setTerminalOutput,
}) => {
  const [isAiMenuOpen, setIsAiMenuOpen] = React.useState(false);
  const [isUtilMenuOpen, setIsUtilMenuOpen] = React.useState(false);
  const utilBtnRef = React.useRef<HTMLButtonElement>(null);
  const aiBtnRef = React.useRef<HTMLButtonElement>(null);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // --- SPLIT SCREEN & REFERENCE PANEL STATES ---
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [splitFileId, setSplitFileId] = useState<string | null>(null);
  const [splitContent, setSplitContent] = useState<string>('');
  const [splitLanguage, setSplitLanguage] = useState<string>('text');

  // Intelligent split file selector default
  useEffect(() => {
    if (isSplitScreen && !splitFileId) {
      const defaultFile = projectFiles.find((f) => f.type === 'file' && f.id !== activeFileId);
      if (defaultFile) {
        setSplitFileId(defaultFile.id);
        setSplitContent(defaultFile.content || '');
        setSplitLanguage(defaultFile.language || 'text');
      } else if (activeFileId) {
        setSplitFileId(activeFileId);
        setSplitContent(editorContent || '');
        setSplitLanguage(editorLanguage || 'text');
      }
    }
  }, [isSplitScreen, splitFileId, projectFiles, activeFileId]);

  // Keep split content synced if we update projectFiles from outside
  useEffect(() => {
    if (splitFileId && splitFileId !== activeFileId) {
      const file = projectFiles.find((f) => f.id === splitFileId);
      if (file && file.content !== splitContent) {
        setSplitContent(file.content || '');
        setSplitLanguage(file.language || 'text');
      }
    }
  }, [projectFiles, splitFileId, activeFileId]);

  // Two-way synchronization between primary and secondary editor when viewing the same file
  useEffect(() => {
    if (splitFileId === activeFileId && isSplitScreen) {
      setSplitContent(editorContent);
    }
  }, [editorContent, activeFileId, splitFileId, isSplitScreen]);

  const handleSplitContentChange = (newVal: string) => {
    setSplitContent(newVal);
    if (splitFileId) {
      if (splitFileId === activeFileId) {
        setEditorContent(newVal);
      }
      setProjectFiles((prev) =>
        prev.map((f) => (f.id === splitFileId ? { ...f, content: newVal } : f)),
      );
    }
  };

  useEffect(() => {
    if ((window as any).monaco) {
      setMonacoLoaded(true);
      return;
    }
    const timer = setTimeout(() => {
      if (!(window as any).monaco) {
        console.warn('Monaco loading timed out. Switching to lightweight editor fallback.');
        setUseFallback(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Phi 11.3 grid: sidebar(3) + pulse-border(0.3) + editor(8) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 md:gap-0 min-h-0">
        {/* File Tree Sidebar — 3/11.3 phi units */}
        <div
          className={`fixed inset-0 z-50 lg:relative lg:z-auto w-full lg:w-[26%] flex flex-col code-editor-bg rounded-none lg:rounded-[40px] border-0 lg:border border-accent-900/30 shadow-2xl overflow-hidden transition-all duration-300 ${isMobileFileTreeOpen ? 'flex' : 'hidden lg:flex'}`}
        >
          <div className="h-16 border-b border-accent-900/20 flex items-center justify-between px-6 md:px-8 bg-black/40 shrink-0">
            <h4 className="text-[10px] md:text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
              <FolderOpen className="w-4 h-4" /> Project Files
            </h4>
            <button
              onClick={() => setIsMobileFileTreeOpen(false)}
              className="lg:hidden p-2 text-accent-500 hover:bg-accent-900/20 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-accent-500 bg-accent-950/40 border border-accent-500/30 hover:bg-accent-900/40 transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] mb-4"
            >
              <Brain className="w-4 h-4 shrink-0" />
              <span className="truncate">AI Generate</span>
            </button>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-accent-100 bg-accent-900/40 border border-accent-500/30 hover:bg-accent-800/60 transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
              >
                <LayoutTemplate className="w-4 h-4 shrink-0" />
                <span className="truncate">Template</span>
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-accent-500 bg-accent-950/40 border border-accent-900/30 hover:bg-accent-900/20 transition-all cursor-pointer">
                <Upload className="w-4 h-4 shrink-0" />
                <span className="truncate">File</span>
                <input type="file" className="hidden" multiple onChange={handleFileUpload} />
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-accent-500 bg-accent-950/40 border border-accent-900/30 hover:bg-accent-900/20 transition-all cursor-pointer">
                <Folder className="w-4 h-4 shrink-0" />
                <span className="truncate">Folder</span>
                <input
                  type="file"
                  className="hidden"
                  {...({ webkitdirectory: '', directory: '' } as any)}
                  multiple
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <FileTree
              files={projectFiles}
              activeFileId={activeFileId}
              gitRepo={gitRepo}
              onFilesChange={setProjectFiles}
              onFileSelect={(id, file) => handleFileSwitch(id)}
              onProjectCreate={(name) =>
                setTerminalOutput((prev) => [...prev, `[PROJECT] Created: ${name}`])
              }
            />
          </div>
        </div>

        {/* Phi Pulse Border — 0.3/11.3 health indicator driven by swarmAnxiety */}
        <div
          title={`Swarm Anxiety: ${(swarmAnxiety * 100).toFixed(1)}%`}
          className={`hidden lg:block w-1.5 mx-2 rounded-full self-stretch shrink-0 transition-all duration-1000 ${
            swarmAnxiety > 0.6
              ? 'bg-accent-500/70 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse'
              : swarmAnxiety > 0.3
                ? 'bg-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.5)] animate-pulse'
                : 'bg-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.2)]'
          }`}
        />

        {/* Editor Section — 8/11.3 phi units */}
        <div className="flex-1 flex flex-col code-editor-bg rounded-[30px] md:rounded-[40px] border border-accent-900/30 shadow-2xl overflow-hidden min-h-[400px]">
          <div className="relative z-30 h-auto min-h-16 border-b border-accent-900/20 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 bg-black/40 py-2 md:py-0 gap-4">
            <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4 md:gap-6 overflow-x-auto no-scrollbar">
              <div className="flex bg-accent-950/20 p-1 rounded-xl border border-accent-900/20 shrink-0">
                <div className="md:hidden px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-accent-500 flex items-center gap-2">
                  <Code2 className="w-3 h-3" />
                  <select
                    value={editorLanguage}
                    onChange={(e) => setEditorLanguage(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer"
                  >
                    {['python', 'cpp', 'rust', 'java', 'html', 'javascript', 'typescript'].map(
                      (lang) => (
                        <option key={lang} value={lang} className="bg-[#0a0202]">
                          {lang}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className="hidden md:flex">
                  {['python', 'cpp', 'rust', 'java', 'html'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setEditorLanguage(lang)}
                      className={`px-3 md:px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${editorLanguage === lang ? 'bg-accent-700 text-white shadow-lg' : 'text-accent-900 hover:text-accent-500'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <button
                  onClick={forceSave}
                  title="Save to app (Ctrl+S)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-[9px] font-black uppercase tracking-widest bg-accent-900/30 border border-accent-700/40 text-accent-400 hover:bg-accent-700 hover:text-white transition-all"
                >
                  <Save className="w-3 h-3" />
                  <span className="hidden sm:inline">Save</span>
                </button>
                <button
                  onClick={saveToFile}
                  title="Save As — choose location on disk"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-r-lg text-[9px] font-black uppercase tracking-widest bg-accent-900/20 border border-l-0 border-accent-700/40 text-accent-500 hover:bg-accent-700 hover:text-white transition-all"
                >
                  <span className="hidden sm:inline">As...</span>
                  <span className="sm:hidden">↓</span>
                </button>
              </div>
              {lastSavedTime && (
                <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-accent-900 uppercase tracking-widest animate-in fade-in duration-500 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="hidden xs:inline">Saved</span> {lastSavedTime}
                </div>
              )}
            </div>
            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              <div className="flex items-center gap-2">
                <label
                  className="p-2 border rounded-xl bg-accent-950/40 border-accent-900/30 text-accent-500 hover:bg-accent-900/20 transition-all cursor-pointer group shrink-0"
                  title="Upload Files"
                >
                  <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                </label>

                <label
                  className="hidden sm:block p-2 border rounded-xl bg-accent-950/40 border-accent-900/30 text-accent-500 hover:bg-accent-900/20 transition-all cursor-pointer group shrink-0"
                  title="Upload Directory (Recursive)"
                >
                  <Folder className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <input
                    type="file"
                    className="hidden"
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    multiple
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* UTILS DROPDOWN */}
              <div className="shrink-0">
                <button
                  ref={utilBtnRef}
                  onClick={() => {
                    setIsUtilMenuOpen(!isUtilMenuOpen);
                    setIsAiMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isUtilMenuOpen ? 'bg-accent-700 border-accent-500 text-white' : 'bg-accent-950/40 border-accent-900/30 text-accent-500 hover:bg-accent-900/20'}`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Utils</span>
                  <span className="text-[8px] opacity-65">▼</span>
                </button>

                <AnchoredMenu
                  anchorRef={utilBtnRef}
                  open={isUtilMenuOpen}
                  onClose={() => setIsUtilMenuOpen(false)}
                  width={224}
                >
                  <div className="px-3 py-1 text-[8px] font-black text-accent-950 uppercase tracking-widest border-b border-accent-900/10 mb-1">
                    System & Formatting
                  </div>

                  <button
                    onClick={() => {
                      handleFormatCode(false);
                      setIsUtilMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors"
                  >
                    <Paintbrush className="w-3.5 h-3.5 text-accent-500" />
                    <span>Format Code (PC)</span>
                  </button>

                  <button
                    onClick={() => {
                      handleFormatCode(true);
                      setIsUtilMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-accent-500" />
                    <span>Format Code (Mobile)</span>
                  </button>

                  <button
                    onClick={() => {
                      handleScanCode();
                      setIsUtilMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors"
                  >
                    <Activity
                      className={`w-3.5 h-3.5 text-accent-500 ${isScanningCode ? 'animate-pulse' : ''}`}
                    />
                    <span>Scan for Errors</span>
                  </button>

                  <div className="h-px bg-accent-900/10 my-1" />

                  <button
                    onClick={() => {
                      handleToggleCurrentLineBreakpoint();
                      setIsUtilMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors"
                  >
                    <Circle
                      className={`w-3.5 h-3.5 text-accent-500 ${breakpoints.includes(cursorLine) ? 'fill-accent-500' : ''}`}
                    />
                    <span>Toggle Breakpoint</span>
                  </button>

                  <button
                    onClick={() => {
                      handleStartDebug();
                      setIsUtilMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors"
                  >
                    <Bug className="w-3.5 h-3.5 text-accent-500" />
                    <span>Neural Debugger</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditorMode('git');
                      setIsUtilMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-accent-500" />
                    <span>Neural Git</span>
                  </button>
                </AnchoredMenu>
              </div>

              {/* AI DROPDOWN */}
              <div className="shrink-0">
                <button
                  ref={aiBtnRef}
                  onClick={() => {
                    setIsAiMenuOpen(!isAiMenuOpen);
                    setIsUtilMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isAiMenuOpen ? 'bg-accent-700 border-accent-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-accent-950/40 border-accent-900/30 text-accent-500 hover:bg-accent-900/20'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden md:inline">Neural AI</span>
                  <span className="text-[8px] opacity-65">▼</span>
                </button>

                <AnchoredMenu
                  anchorRef={aiBtnRef}
                  open={isAiMenuOpen}
                  onClose={() => setIsAiMenuOpen(false)}
                  width={256}
                >
                  <div className="px-3 py-1 text-[8px] font-black text-accent-950 uppercase tracking-widest border-b border-accent-900/10 mb-1">
                    Analysis & Audit
                  </div>

                  <button
                    onClick={() => {
                      handleExplainCode();
                      setIsAiMenuOpen(false);
                    }}
                    disabled={isAiProcessing}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors disabled:opacity-30"
                  >
                    <Brain className="w-3.5 h-3.5 text-accent-500" />
                    <span>AI Analysis</span>
                  </button>

                  <button
                    onClick={() => {
                      handleFullProjectAnalysis();
                      setIsAiMenuOpen(false);
                    }}
                    disabled={isAiProcessing}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors disabled:opacity-30"
                  >
                    <Network className="w-3.5 h-3.5 text-accent-500" />
                    <span>Full Project Analysis</span>
                  </button>

                  <button
                    onClick={() => {
                      handleDeepProjectAudit();
                      setIsAiMenuOpen(false);
                    }}
                    disabled={isAiProcessing}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors disabled:opacity-30"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-accent-500" />
                    <span>Deep Project Audit</span>
                  </button>

                  <div className="h-px bg-accent-900/10 my-1" />
                  <div className="px-3 py-1 text-[8px] font-black text-accent-950 uppercase tracking-widest border-b border-accent-900/10 mb-1">
                    Generation & Refactor
                  </div>

                  <button
                    onClick={() => {
                      handleGenerateDocs();
                      setIsAiMenuOpen(false);
                    }}
                    disabled={isAiProcessing}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors disabled:opacity-30"
                  >
                    <FileText className="w-3.5 h-3.5 text-accent-500" />
                    <span>Generate Docs</span>
                  </button>

                  <button
                    onClick={() => {
                      handleRefactorCode();
                      setIsAiMenuOpen(false);
                    }}
                    disabled={isAiProcessing}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors disabled:opacity-30"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-accent-500" />
                    <span>Refactor File</span>
                  </button>

                  <button
                    onClick={() => {
                      handleRefactorAllFiles();
                      setIsAiMenuOpen(false);
                    }}
                    disabled={isAiProcessing}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors disabled:opacity-30"
                  >
                    <Layers className="w-3.5 h-3.5 text-accent-500" />
                    <span>Refactor Project</span>
                  </button>

                  <button
                    onClick={() => {
                      handleCodeReview();
                      setIsAiMenuOpen(false);
                    }}
                    disabled={isAiProcessing}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors disabled:opacity-30"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-accent-500" />
                    <span>AI Code Review</span>
                  </button>

                  <button
                    onClick={() => {
                      handleGenerateCode();
                      setIsAiMenuOpen(false);
                    }}
                    disabled={isAiProcessing}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-accent-300 hover:bg-accent-900/20 hover:text-accent-100 transition-colors disabled:opacity-30"
                  >
                    <Zap className="w-3.5 h-3.5 text-accent-500" />
                    <span>Neural Forge</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPairProgrammerActive(!isPairProgrammerActive);
                      setIsAiMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-accent-900/20 ${isPairProgrammerActive ? 'text-emerald-400' : 'text-accent-300'}`}
                  >
                    <Users className="w-3.5 h-3.5 text-accent-500" />
                    <span>Pair Programmer</span>
                  </button>
                </AnchoredMenu>
              </div>
              <button
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-2.5 bg-accent-700 hover:bg-accent-600 text-white rounded-xl font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-50 shrink-0"
              >
                {isRunningCode ? (
                  <Zap className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 md:w-4 md:h-4" />
                )}
                Execute
              </button>
            </div>
          </div>
          <div className="flex-1 relative z-10 overflow-hidden">
            {isScanningCode && (
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-accent-900/10 mix-blend-overlay"></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                <div className="absolute inset-0 p-4 font-mono text-sm leading-normal text-transparent">
                  {editorContent.split('\n').map((line, i) => (
                    <div
                      key={i}
                      className={`relative ${scanResults.includes(i + 1) ? 'bg-accent-500/20 border-l-2 border-accent-500' : ''}`}
                    >
                      <span className="opacity-0">{line || ' '}</span>
                      {scanResults.includes(i + 1) && (
                        <span className="absolute right-4 top-0 text-[10px] text-accent-500 font-black uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded">
                          Issue Detected
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden h-full w-full">
              {/* PRIMARY EDITOR PANEL */}
              <div
                className={`flex-1 flex flex-col h-full ${isSplitScreen ? 'border-r border-accent-900/30 w-full lg:w-1/2' : 'w-full'}`}
              >
                {isSplitScreen && (
                  <div className="h-10 bg-black/50 border-b border-accent-900/20 flex items-center justify-between px-4 text-[10px] font-black uppercase tracking-wider text-accent-400">
                    <span className="truncate">
                      Primary Pane:{' '}
                      {projectFiles.find((f) => f.id === activeFileId)?.name || 'Untitled'}
                    </span>
                    <span className="text-[8px] opacity-60">Read/Write</span>
                  </div>
                )}
                <div className="flex-1 relative overflow-hidden h-full">
                  {isScanningCode && <div className="code-scanner" />}
                  {useFallback ? (
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      className="w-full h-full bg-[#120404] text-accent-100 font-mono text-[14px] p-6 outline-none border-none resize-none custom-scrollbar"
                      placeholder="// Lightweight Editor Mode Active (Offline/CDN Blocked Fallback)"
                      style={{
                        fontFamily: 'JetBrains Mono, Courier New, monospace',
                        lineHeight: '1.6',
                      }}
                    />
                  ) : (
                    <Editor
                      height="100%"
                      language={
                        editorLanguage === 'python'
                          ? 'python'
                          : editorLanguage === 'javascript'
                            ? 'javascript'
                            : editorLanguage === 'typescript'
                              ? 'typescript'
                              : 'html'
                      }
                      theme={theme === 'dark' ? 'vs-dark' : 'light'}
                      value={editorContent}
                      onChange={(value) => setEditorContent(value || '')}
                      onMount={(editor) => {
                        setMonacoLoaded(true);
                        handleEditorDidMount(editor);
                      }}
                      loading={
                        <div className="flex flex-col items-center justify-center h-full bg-[#0d0404] text-accent-500 font-mono text-xs gap-3 select-none">
                          <Zap className="w-5 h-5 animate-spin" />
                          CONNECTING_NEURAL_MONACO_LINK...
                        </div>
                      }
                      options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        automaticLayout: true,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* SECONDARY / SPLIT EDITOR PANEL */}
              {isSplitScreen && (
                <div className="flex-1 flex flex-col h-full w-full lg:w-1/2 bg-[#080202]">
                  <div className="h-10 bg-black/60 border-b border-accent-900/20 flex items-center justify-between px-4 text-[10px] font-black uppercase tracking-wider text-accent-400 gap-4 shrink-0">
                    <div className="flex items-center gap-2 max-w-[70%] truncate">
                      <span className="text-[8px] text-accent-400 bg-accent-950/60 border border-accent-900/40 px-2 py-0.5 rounded font-black tracking-widest">
                        Split View
                      </span>
                      <select
                        value={splitFileId || ''}
                        onChange={(e) => {
                          const fileId = e.target.value;
                          const file = projectFiles.find((f) => f.id === fileId);
                          if (file) {
                            setSplitFileId(fileId);
                            setSplitContent(file.content || '');
                            setSplitLanguage(file.language || 'text');
                          }
                        }}
                        className="bg-black/90 border border-accent-900/50 rounded-lg px-3 py-1 text-[10px] text-accent-300 outline-none max-w-full font-bold cursor-pointer hover:border-accent-600/60 transition-all uppercase tracking-wider"
                      >
                        <option value="" disabled>
                          -- Select Code to Analyze --
                        </option>
                        {projectFiles
                          .filter((f) => f.type === 'file')
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.path || f.name})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] text-accent-800 tracking-widest">
                        {splitLanguage.toUpperCase()}
                      </span>
                      <button
                        onClick={() => setIsSplitScreen(false)}
                        className="text-accent-700 hover:text-accent-400 transition-colors p-1"
                        title="Close Split View"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 relative overflow-hidden h-full">
                    {isScanningCode && <div className="code-scanner" />}
                    {useFallback ? (
                      <textarea
                        value={splitContent}
                        onChange={(e) => handleSplitContentChange(e.target.value)}
                        className="w-full h-full bg-[#0a0202] text-accent-100 font-mono text-[14px] p-6 outline-none border-none resize-none custom-scrollbar"
                        placeholder="// Select a file in the dropdown above to view side-by-side"
                        style={{
                          fontFamily: 'JetBrains Mono, Courier New, monospace',
                          lineHeight: '1.6',
                        }}
                      />
                    ) : (
                      <Editor
                        height="100%"
                        language={
                          splitLanguage === 'python'
                            ? 'python'
                            : splitLanguage === 'javascript'
                              ? 'javascript'
                              : splitLanguage === 'typescript'
                                ? 'typescript'
                                : 'html'
                        }
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        value={splitContent}
                        onChange={(value) => handleSplitContentChange(value || '')}
                        onMount={() => {
                          // Split editor mounted
                        }}
                        loading={
                          <div className="flex flex-col items-center justify-center h-full bg-[#0d0404] text-accent-500 font-mono text-xs gap-3 select-none">
                            <Zap className="w-5 h-5 animate-spin" />
                            CONNECTING_NEURAL_MONACO_LINK...
                          </div>
                        }
                        options={{
                          fontSize: 14,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                          automaticLayout: true,
                          fontFamily: 'JetBrains Mono',
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assistant Sidebar */}
        <AssistantSidebar
          isOpen={isEditorAssistantOpen}
          onClose={() => setIsEditorAssistantOpen(false)}
          messages={editorAssistantMessages}
          input={editorAssistantInput}
          onInputChange={setEditorAssistantInput}
          onSubmit={handleEditorAssistantSubmit}
          onCodeReview={handleCodeReview}
          onSaveAnalysis={handleSaveAnalysis}
          onApplyDocumentation={handleApplyDocumentation}
          onApplyRefactor={handleApplyRefactor}
          onApplyForge={handleApplyForge}
          isProcessing={isAiProcessing}
          isPairProgrammerActive={isPairProgrammerActive}
          lastPrompt={lastEditorAssistantPrompt}
        />

        {/* Output Section */}
        <OutputPanel
          editorMode={editorMode}
          setEditorMode={setEditorMode}
          isRunningCode={isRunningCode}
          editorOutput={editorOutput}
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
          breakpoints={breakpoints}
          debugState={debugState}
          debugRefactorResult={debugRefactorResult}
          setDebugRefactorResult={setDebugRefactorResult}
          isAiProcessing={isAiProcessing}
          handleStep={handleStep}
          handleDebugRefactor={handleDebugRefactor}
          handleStartDebug={handleStartDebug}
          handleStopDebug={handleStopDebug}
          handleApplyDebugRefactor={handleApplyDebugRefactor}
          gitRepo={gitRepo}
          projectFiles={projectFiles}
          handleGitInit={handleGitInit}
          handleGitPull={handleGitPull}
          handleGitPush={handleGitPush}
          handleGitStash={handleGitStash}
          handleGitPop={handleGitPop}
          handleGitSaveAll={handleGitSaveAll}
          handleGitCommit={handleGitCommit}
          handleGitStage={handleGitStage}
          handleGitStageAll={handleGitStageAll}
          handleGitUnstage={handleGitUnstage}
          projectSettings={projectSettings}
          setProjectSettings={setProjectSettings}
          validateProjectSettings={validateProjectSettings}
          validationErrors={validationErrors}
          ollamaStatus={ollamaStatus}
          refreshOllamaModels={refreshOllamaModels}
        />
      </div>
    </div>
  );
};
