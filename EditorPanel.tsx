import React from 'react';
import {
  FolderOpen, X, Brain, LayoutTemplate, Upload, Folder,
  Save, ShieldCheck, Globe, MessageSquare, Circle, Network,
  ShieldAlert, FileText, Paintbrush, Smartphone, Wand2, Layers,
  Users, Bug, GitBranch, Play, Zap, Activity, Search,
  Sparkles, Send, MousePointer2, RefreshCw, Info, Edit2,
  Layout, Trash2, Plus, Code2, Check, GitPullRequest, GitMerge,
  History, Archive, StepForward, PlayCircle, StopCircle, Settings,
  UserCircle, Database, BarChart3, Copy, Cpu,
} from 'lucide-react';
import { FileTree } from '../FileTree';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';

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
  handleEditorAssistantSubmit: (e: React.FormEvent) => void;
  handleCodeReview: () => void;
  handleSaveAnalysis: (analysisText: string) => void;
  handleApplyDocumentation: (documentedCode: string, isSelection: boolean, selection: any) => void;
  handleApplyRefactor: (refactoredCode: string, isSelection: boolean, selection: any) => void;
  handleApplyForge: (code: string, isSnippet: boolean) => void;

  // AI processing
  isAiProcessing: boolean;
  handleExplainCode: () => void;
  handleFullProjectAnalysis: () => void;
  handleDeepProjectAudit: () => void;
  handleGenerateDocs: () => void;
  handleFormatCode: (isMobile: boolean) => void;
  handleRefactorCode: () => void;
  handleRefactorAllFiles: () => void;
  handleReviewCode: () => void;
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
  projectFiles, activeFileId, setProjectFiles, handleFileSwitch, handleFileUpload,
  editorContent, setEditorContent, editorLanguage, setEditorLanguage,
  editorOutput, setEditorOutput, editorMode, setEditorMode, theme,
  debouncedEditorContent,
  isRunningCode, isScanningCode, scanResults, handleRunCode, handleScanCode,
  lastSavedTime, forceSave,
  isLivePreviewEnabled, setIsLivePreviewEnabled,
  isInspectorActive, setIsInspectorActive,
  inspectedElement, setInspectedElement, inspectedElementRef, previewContainerRef,
  handleInspectMouseMove, handleInspectClick, handleStyleChange,
  isPairProgrammerActive, setIsPairProgrammerActive,
  isEditorAssistantOpen, setIsEditorAssistantOpen,
  editorAssistantMessages, editorAssistantInput, setEditorAssistantInput,
  handleEditorAssistantSubmit, handleCodeReview, handleSaveAnalysis,
  handleApplyDocumentation, handleApplyRefactor, handleApplyForge,
  isAiProcessing, handleExplainCode, handleFullProjectAnalysis,
  handleDeepProjectAudit, handleGenerateDocs, handleFormatCode,
  handleRefactorCode, handleRefactorAllFiles, handleReviewCode,
  handleAnalyzeData, handleGenerateCode,
  breakpoints, cursorLine, debugState, debugRefactorResult, setDebugRefactorResult,
  handleToggleCurrentLineBreakpoint, handleStartDebug, handleStopDebug,
  handleStep, handleDebugRefactor, handleApplyDebugRefactor, handleEditorDidMount,
  gitRepo, setGitRepo, handleGitInit, handleGitPull, handleGitPush,
  handleGitStash, handleGitPop, handleGitSaveAll, handleGitCommit,
  handleGitStage, handleGitStageAll, handleGitUnstage,
  projectSettings, setProjectSettings, validateProjectSettings,
  validationErrors, ollamaStatus, refreshOllamaModels,
  isMobileFileTreeOpen, setIsMobileFileTreeOpen,
  setIsGenerateModalOpen, setIsTemplateModalOpen,
  swarmAnxiety, setTerminalOutput,
}) => {
  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Phi 11.3 grid: sidebar(3) + pulse-border(0.3) + editor(8) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 md:gap-0 min-h-0">
        {/* File Tree Sidebar — 3/11.3 phi units */}
        <div className={`fixed inset-0 z-50 lg:relative lg:z-auto w-full lg:w-[26%] flex flex-col code-editor-bg rounded-none lg:rounded-[40px] border-0 lg:border border-red-900/30 shadow-2xl overflow-hidden transition-all duration-300 ${isMobileFileTreeOpen ? 'flex' : 'hidden lg:flex'}`}>
          <div className="h-16 border-b border-red-900/20 flex items-center justify-between px-6 md:px-8 bg-black/40 shrink-0">
            <h4 className="text-[10px] md:text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
              <FolderOpen className="w-4 h-4" /> Project Files
            </h4>
            <button
              onClick={() => setIsMobileFileTreeOpen(false)}
              className="lg:hidden p-2 text-red-500 hover:bg-red-900/20 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] mb-4"
            >
              <Brain className="w-4 h-4 shrink-0" />
              <span className="truncate">AI Generate</span>
            </button>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-100 bg-red-900/40 border border-red-500/30 hover:bg-red-800/60 transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
              >
                <LayoutTemplate className="w-4 h-4 shrink-0" />
                <span className="truncate">Template</span>
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-950/40 border border-red-900/30 hover:bg-red-900/20 transition-all cursor-pointer">
                <Upload className="w-4 h-4 shrink-0" />
                <span className="truncate">File</span>
                <input type="file" className="hidden" multiple onChange={handleFileUpload} />
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-950/40 border border-red-900/30 hover:bg-red-900/20 transition-all cursor-pointer">
                <Folder className="w-4 h-4 shrink-0" />
                <span className="truncate">Folder</span>
                <input type="file" className="hidden" {...{ webkitdirectory: "", directory: "" } as any} multiple onChange={handleFileUpload} />
              </label>
            </div>

            <FileTree
              files={projectFiles}
              activeFileId={activeFileId}
              gitRepo={gitRepo}
              onFilesChange={setProjectFiles}
              onFileSelect={(id, file) => handleFileSwitch(id)}
              onProjectCreate={(name) => setTerminalOutput(prev => [...prev, `[PROJECT] Created: ${name}`])}
            />
          </div>
        </div>

        {/* Phi Pulse Border — 0.3/11.3 health indicator driven by swarmAnxiety */}
        <div
          title={`Swarm Anxiety: ${(swarmAnxiety * 100).toFixed(1)}%`}
          className={`hidden lg:block w-1.5 mx-2 rounded-full self-stretch shrink-0 transition-all duration-1000 ${
            swarmAnxiety > 0.6
              ? 'bg-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse'
              : swarmAnxiety > 0.3
                ? 'bg-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.5)] animate-pulse'
                : 'bg-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.2)]'
          }`}
        />

        {/* Editor Section — 8/11.3 phi units */}
        <div className="flex-1 flex flex-col code-editor-bg rounded-[30px] md:rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden min-h-[400px]">
          <div className="h-auto min-h-16 border-b border-red-900/20 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 bg-black/40 py-2 md:py-0 gap-4">
            <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4 md:gap-6 overflow-x-auto custom-scrollbar">
              <div className="flex bg-red-950/20 p-1 rounded-xl border border-red-900/20 shrink-0">
                {['python', 'cpp', 'rust', 'java', 'html'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setEditorLanguage(lang)}
                    className={`px-3 md:px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${editorLanguage === lang ? 'bg-red-700 text-white shadow-lg' : 'text-red-900 hover:text-red-500'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <button
                onClick={forceSave}
                title="Save (Ctrl+S)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-900/30 border border-red-700/40 text-red-400 hover:bg-red-700 hover:text-white transition-all shrink-0"
              >
                <Save className="w-3 h-3" />
                <span className="hidden sm:inline">Save</span>
              </button>
              {lastSavedTime && (
                <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-red-900 uppercase tracking-widest animate-in fade-in duration-500 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">Saved</span> {lastSavedTime}
                </div>
              )}
            </div>
            <div className="w-full md:w-auto flex items-center gap-2 md:gap-4 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
              <button
                onClick={() => setIsLivePreviewEnabled(!isLivePreviewEnabled)}
                className={`p-2 md:p-2.5 border rounded-xl transition-all group shrink-0 ${isLivePreviewEnabled ? 'bg-red-700 border-red-500 text-white' : 'bg-red-950/40 border-red-900/30 text-red-500 hover:bg-red-900/20'}`}
                title="Live Preview"
              >
                <Globe className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => setIsEditorAssistantOpen(!isEditorAssistantOpen)}
                className={`p-2 md:p-2.5 border rounded-xl transition-all group shrink-0 ${isEditorAssistantOpen ? 'bg-red-700 border-red-500 text-white' : 'bg-red-950/40 border-red-900/30 text-red-500 hover:bg-red-900/20'}`}
                title="Neural Assistant"
              >
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleToggleCurrentLineBreakpoint}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group shrink-0"
                title="Toggle Breakpoint"
              >
                <Circle className={`w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform ${breakpoints.includes(cursorLine) ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <button
                onClick={handleExplainCode}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="AI Analysis"
              >
                <Brain className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleFullProjectAnalysis}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="Full Project Analysis"
              >
                <Network className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleDeepProjectAudit}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="Deep Project Audit"
              >
                <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleGenerateDocs}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="Generate Documentation"
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => handleFormatCode(false)}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="Format Code"
              >
                <Paintbrush className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => handleFormatCode(true)}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="Mobile Format"
              >
                <Smartphone className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleRefactorCode}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="AI Refactor Current File"
              >
                <Wand2 className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleRefactorAllFiles}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="AI Refactor Entire Project"
              >
                <Layers className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleReviewCode}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="AI Code Review"
              >
                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleAnalyzeData}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="AI Data Analysis"
              >
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleScanCode}
                className={`p-2 md:p-2.5 border rounded-xl transition-all group shrink-0 ${isScanningCode ? 'bg-red-700 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-red-950/40 border-red-900/30 text-red-500 hover:bg-red-900/20'}`}
                title="Scan Code for Errors"
              >
                <Activity className={`w-4 h-4 md:w-5 md:h-5 ${isScanningCode ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
              </button>
              <button
                onClick={handleGenerateCode}
                disabled={isAiProcessing}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50 shrink-0"
                title="Neural Forge (Generate Code)"
              >
                <Zap className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => setIsPairProgrammerActive(!isPairProgrammerActive)}
                className={`p-2 md:p-2.5 border rounded-xl transition-all group shrink-0 ${isPairProgrammerActive ? 'bg-emerald-700 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-950/40 border-red-900/30 text-red-500 hover:bg-red-900/20'}`}
                title="AI Pair Programmer Mode"
              >
                <Users className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleStartDebug}
                disabled={isRunningCode || debugState.isActive}
                className="p-2 md:p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group shrink-0"
                title="Neural Debugger"
              >
                <Bug className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => setEditorMode('git')}
                className={`p-2 md:p-2.5 border rounded-xl transition-all group shrink-0 ${editorMode === 'git' ? 'bg-red-700 border-red-500 text-white' : 'bg-red-950/40 border-red-900/30 text-red-500 hover:bg-red-900/20'}`}
                title="Neural Git"
              >
                <GitBranch className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-50 shrink-0"
              >
                {isRunningCode ? <Zap className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Play className="w-3 h-3 md:w-4 md:h-4" />}
                Execute
              </button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden">
            {isScanningCode && (
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay"></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                <div className="absolute inset-0 p-4 font-mono text-sm leading-normal text-transparent">
                  {editorContent.split('\n').map((line, i) => (
                    <div key={i} className={`relative ${scanResults.includes(i + 1) ? 'bg-red-500/20 border-l-2 border-red-500' : ''}`}>
                      <span className="opacity-0">{line || ' '}</span>
                      {scanResults.includes(i + 1) && (
                        <span className="absolute right-4 top-0 text-[10px] text-red-500 font-black uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded">Issue Detected</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Editor
              height="100%"
              language={editorLanguage === 'python' ? 'python' : editorLanguage === 'javascript' ? 'javascript' : editorLanguage === 'typescript' ? 'typescript' : 'html'}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={editorContent}
              onChange={(value) => setEditorContent(value || '')}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                fontFamily: 'JetBrains Mono',
              }}
            />
          </div>
        </div>

        {/* Assistant Sidebar */}
        {isEditorAssistantOpen && (
          <div className="fixed inset-0 z-50 lg:relative lg:z-auto w-full lg:w-80 flex flex-col code-editor-bg rounded-none lg:rounded-[40px] border-0 lg:border border-red-900/30 shadow-2xl overflow-hidden animate-in slide-in-from-right-5 duration-300">
            <div className="h-16 border-b border-red-900/20 flex items-center justify-between px-6 md:px-8 bg-black/40">
              <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                <Brain className="w-4 h-4" /> Neural Assistant
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCodeReview}
                  disabled={isAiProcessing}
                  className="p-2 text-red-900 hover:text-red-500 transition-colors"
                  title="Perform Code Review"
                >
                  <Search className="w-4 h-4" />
                </button>
                {isPairProgrammerActive && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-pulse">
                    <Users className="w-3 h-3 text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Pairing</span>
                  </div>
                )}
                <button onClick={() => setIsEditorAssistantOpen(false)} className="text-red-900 hover:text-red-500 transition-colors p-2">
                  <X className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
              {editorAssistantMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-30">
                  <Sparkles className="w-12 h-12 text-red-600 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting neural synchronization...</p>
                </div>
              )}
              {editorAssistantMessages.map((msg: any, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[90%] rounded-2xl p-4 text-[12px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-red-800 text-white rounded-tr-none'
                      : 'bg-red-950/20 border border-red-900/20 text-red-100 rounded-tl-none'
                  }`}>
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>

                    {/* Action buttons — always outside markdown div, always reachable */}
                    {msg.role === 'ai' && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-red-900/20 empty:hidden">

                        {(msg.text.includes('CODE_ANALYSIS') || msg.text.includes('FULL_PROJECT_ANALYSIS') || msg.text.includes('DEEP_PROJECT_AUDIT')) && (
                          <button
                            onClick={() => handleSaveAnalysis(msg.text)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-900/40 border border-red-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-100 hover:bg-red-800/60 transition-all active:scale-95"
                          >
                            <Save className="w-3 h-3" />
                            Save Report
                          </button>
                        )}

                        {msg.text.includes('DOCUMENTATION_GENERATED') && msg.metadata?.documentedCode && (
                          <button
                            onClick={() => handleApplyDocumentation(msg.metadata.documentedCode, msg.metadata.isSelection, msg.metadata.selection)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-700 border border-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-all active:scale-95"
                          >
                            <FileText className="w-3 h-3" />
                            Apply Documentation
                          </button>
                        )}

                        {msg.text.includes('REFACTOR_COMPLETE') && msg.metadata?.refactoredCode && (
                          <>
                            {msg.metadata.explanation && (
                              <div className="w-full p-3 bg-black/40 rounded-lg border border-red-900/30 mb-1">
                                <h6 className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Refactoring Explanation</h6>
                                <p className="text-[11px] text-red-200/80 leading-relaxed">{msg.metadata.explanation}</p>
                              </div>
                            )}
                            <button
                              onClick={() => handleApplyRefactor(msg.metadata.refactoredCode, msg.metadata.isSelection, msg.metadata.selection)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-red-700 border border-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-all active:scale-95"
                            >
                              <Check className="w-3 h-3" />
                              Apply Refactor
                            </button>
                          </>
                        )}

                        {msg.metadata?.generatedCode && (
                          <button
                            onClick={() => handleApplyForge(msg.metadata.generatedCode, msg.metadata.isSnippet)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-700 border border-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-emerald-600 transition-all active:scale-95"
                          >
                            <Zap className="w-3 h-3" />
                            {msg.metadata.isSnippet ? 'Insert Snippet' : 'Replace File'}
                          </button>
                        )}

                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAiProcessing && (
                <div className="flex gap-2 px-1 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                </div>
              )}
            </div>
            <form onSubmit={handleEditorAssistantSubmit} className="p-4 bg-black/40 border-t border-red-900/20">
              <div className="relative">
                <input
                  value={editorAssistantInput}
                  onChange={(e) => setEditorAssistantInput(e.target.value)}
                  placeholder="Ask assistant..."
                  className="w-full bg-[#0d0404] border border-red-900/40 rounded-xl px-4 py-3 text-[11px] text-red-100 focus:border-red-600/60 outline-none"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-400">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Output Section */}
        <div className="w-full lg:w-96 flex flex-col code-editor-bg rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden">
          <div className="h-16 border-b border-red-900/20 flex items-center px-8 bg-black/40 justify-between">
            <div className="flex bg-red-950/20 p-1 rounded-xl border border-red-900/20">
              <button
                onClick={() => setEditorMode('code')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'code' ? 'bg-red-700 text-white shadow-lg' : 'text-red-900 hover:text-red-500'}`}
              >
                Terminal
              </button>
              <button
                onClick={() => setEditorMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'preview' ? 'bg-red-700 text-white shadow-lg' : 'text-red-900 hover:text-red-500'}`}
              >
                Preview
              </button>
              <button
                onClick={() => setEditorMode('debug')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'debug' ? 'bg-red-700 text-white shadow-lg' : 'text-red-900 hover:text-red-500'}`}
              >
                Debugger
              </button>
              <button
                onClick={() => setEditorMode('git')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'git' ? 'bg-red-700 text-white shadow-lg' : 'text-red-900 hover:text-red-500'}`}
              >
                Git
              </button>
              <button
                onClick={() => setEditorMode('settings')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${editorMode === 'settings' ? 'bg-red-700 text-white shadow-lg' : 'text-red-900 hover:text-red-500'}`}
              >
                Config
              </button>
            </div>
            <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
              <Activity className="w-4 h-4" /> Runtime
            </h4>
          </div>
          <div className="flex-1 overflow-hidden relative bg-black/20">
            {editorMode === 'code' && (
              <div className="h-full p-4 md:p-8 font-mono text-[13px] overflow-y-auto custom-scrollbar text-red-100/80">
                {isRunningCode ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-500 animate-pulse">
                      <Zap className="w-3 h-3" />
                      <span>NEURAL_LINK_ESTABLISHED...</span>
                    </div>
                    <div className="text-red-900/60">[SYSTEM] Initializing virtual environment...</div>
                    <div className="text-red-900/60">[KERNEL] Allocating neural buffers...</div>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {editorOutput || "[IDLE] Neural runtime awaiting execution..."}
                  </pre>
                )}
              </div>
            )}
            {editorMode === 'preview' && (
              <div className="h-full flex flex-col">
                {/* Preview Toolbar */}
                <div className="p-4 bg-red-950/20 border-b border-red-900/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsInspectorActive(!isInspectorActive)}
                      className={`p-2 rounded-lg transition-all ${isInspectorActive ? 'bg-red-700 text-white shadow-lg' : 'bg-red-950/40 border border-red-900/30 text-red-500 hover:bg-red-900/20'}`}
                      title="Toggle Component Inspector"
                    >
                      <MousePointer2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditorContent(editorContent)}
                      className="p-2 bg-red-950/40 border border-red-900/30 text-red-500 rounded-lg hover:bg-red-900/20 transition-all"
                      title="Refresh Preview"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live UI Preview</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-mono text-emerald-500/60 uppercase">Synchronized</span>
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
                      className="w-full min-h-full bg-black/40 rounded-2xl border border-red-900/20 overflow-hidden relative"
                      dangerouslySetInnerHTML={{ __html: isLivePreviewEnabled ? DOMPurify.sanitize(debouncedEditorContent) : '' }}
                    />

                    {/* Inspector Highlight Overlay */}
                    {inspectedElement && inspectedElement.rect && (
                      <div
                        className="absolute pointer-events-none border-2 border-red-500 bg-red-500/10 z-50 transition-all duration-75"
                        style={{
                          top: inspectedElement.rect.top + 24,
                          left: inspectedElement.rect.left + 24,
                          width: inspectedElement.rect.width,
                          height: inspectedElement.rect.height
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-red-700 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap">
                          {inspectedElement.tagName} {inspectedElement.id && `#${inspectedElement.id}`}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inspector Details Panel */}
                  {inspectedElement && (
                    <div className="w-full md:w-80 absolute md:relative right-0 top-0 bottom-0 z-50 bg-[#080101] border-l border-red-900/30 p-6 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300">
                      <button
                        onClick={() => {
                          // Clean up tracking attribute
                          if (previewContainerRef.current) {
                            previewContainerRef.current.querySelectorAll('[data-neural-inspect]').forEach(el => {
                              el.removeAttribute('data-neural-inspect');
                            });
                            // Sync back one last time without the attribute
                            const contentWrapper = previewContainerRef.current.querySelector('.bg-black\\/40');
                            if (contentWrapper) {
                              setEditorContent(contentWrapper.innerHTML);
                            }
                          }
                          setInspectedElement(null);
                          setIsInspectorActive(false);
                          inspectedElementRef.current = null;
                        }}
                        className="absolute top-4 right-4 p-2 text-red-900 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="space-y-6 md:space-y-8">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[11px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                              <Info className="w-4 h-4" /> Component Info
                            </h5>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  if (inspectedElementRef.current) {
                                    navigator.clipboard.writeText(inspectedElementRef.current.outerHTML);
                                    setEditorOutput(prev => prev + "[SYSTEM] Element HTML copied to clipboard.\n");
                                  }
                                }}
                                className="p-1.5 bg-red-950/40 border border-red-900/30 rounded-lg text-red-500 hover:bg-red-900/20 transition-all"
                                title="Copy HTML"
                              >
                                <Code2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (inspectedElementRef.current && confirm('Are you sure you want to delete this element?')) {
                                    inspectedElementRef.current.remove();
                                    setInspectedElement(null);
                                    const contentWrapper = previewContainerRef.current?.querySelector('.bg-black\\/40');
                                    if (contentWrapper) {
                                      setEditorContent(contentWrapper.innerHTML);
                                    }
                                  }
                                }}
                                className="p-1.5 bg-red-950/40 border border-red-900/30 rounded-lg text-red-500 hover:bg-red-900/20 transition-all"
                                title="Delete Element"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-red-900 uppercase font-black">Tag</span>
                              <span className="text-[11px] font-mono text-red-100 uppercase">{inspectedElement.tagName}</span>
                            </div>
                            {inspectedElement.id && (
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-red-900 uppercase font-black">ID</span>
                                <span className="text-[11px] font-mono text-red-100">{inspectedElement.id}</span>
                              </div>
                            )}
                            <div className="space-y-1">
                              <span className="text-[10px] text-red-900 uppercase font-black">Classes</span>
                              <div className="text-[10px] font-mono text-red-100/60 break-all leading-relaxed">
                                {inspectedElement.className || 'None'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[11px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                              <Edit2 className="w-4 h-4" /> Style Editor
                            </h5>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const styleStr = Object.entries(inspectedElement.styles)
                                    .map(([k, v]) => `${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}: ${v};`)
                                    .join(' ');
                                  navigator.clipboard.writeText(styleStr);
                                  setEditorOutput(prev => prev + "[SYSTEM] Styles copied to clipboard.\n");
                                }}
                                className="p-1.5 bg-red-950/40 border border-red-900/30 rounded-lg text-red-500 hover:bg-red-900/20 transition-all"
                                title="Copy Styles"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  const prop = prompt('Enter CSS property name (e.g., border-radius):');
                                  if (prop) {
                                    const camelProp = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
                                    handleStyleChange(camelProp, '');
                                  }
                                }}
                                className="p-1.5 bg-red-900/20 border border-red-900/30 rounded-lg text-red-500 hover:bg-red-900/40 transition-all"
                                title="Add Property"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (inspectedElementRef.current) {
                                    inspectedElementRef.current.style.cssText = '';
                                    // Re-fetch styles
                                    const styles = window.getComputedStyle(inspectedElementRef.current);
                                    setInspectedElement((prev: any) => {
                                      if (!prev) return null;
                                      const newStyles: Record<string, string> = {};
                                      Object.keys(prev.styles).forEach(key => {
                                        newStyles[key] = (styles as any)[key];
                                      });
                                      return { ...prev, styles: newStyles };
                                    });
                                    // Sync back
                                    const contentWrapper = previewContainerRef.current?.querySelector('.bg-black\\/40');
                                    if (contentWrapper) {
                                      setEditorContent(contentWrapper.innerHTML);
                                    }
                                  }
                                }}
                                className="p-1.5 bg-red-950/40 border border-red-900/30 rounded-lg text-red-500 hover:bg-red-900/20 transition-all"
                                title="Reset Styles"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {Object.entries(inspectedElement.styles).map(([key, value]) => (
                              <div key={key} className="flex flex-col gap-1 p-3 bg-red-950/5 border border-red-900/10 rounded-xl group/style">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] text-red-900 uppercase font-black">{key}</span>
                                  <button
                                    onClick={() => {
                                      if (inspectedElementRef.current) {
                                        inspectedElementRef.current.style.removeProperty(key.replace(/[A-Z]/g, m => "-" + m.toLowerCase()));
                                        setInspectedElement((prev: any) => {
                                          if (!prev) return null;
                                          const newStyles = { ...prev.styles };
                                          delete newStyles[key];
                                          return { ...prev, styles: newStyles };
                                        });
                                        const contentWrapper = previewContainerRef.current?.querySelector('.bg-black\\/40');
                                        if (contentWrapper) {
                                          setEditorContent(contentWrapper.innerHTML);
                                        }
                                      }
                                    }}
                                    className="opacity-0 group-hover/style:opacity-100 text-red-900 hover:text-red-500 transition-all"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={value as string}
                                  onChange={(e) => handleStyleChange(key, e.target.value)}
                                  className="bg-transparent border-none outline-none text-[10px] font-mono text-red-100 w-full focus:text-red-500 transition-colors"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h5 className="text-[11px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                            <Layout className="w-4 h-4" /> Geometry
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-red-950/5 border border-red-900/10 rounded-xl">
                              <span className="block text-[8px] text-red-900 uppercase font-black mb-1">Width</span>
                              <span className="text-[10px] font-mono text-red-100">{Math.round(inspectedElement.rect?.width || 0)}px</span>
                            </div>
                            <div className="p-3 bg-red-950/5 border border-red-900/10 rounded-xl">
                              <span className="block text-[8px] text-red-900 uppercase font-black mb-1">Height</span>
                              <span className="text-[10px] font-mono text-red-100">{Math.round(inspectedElement.rect?.height || 0)}px</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {editorMode === 'debug' && (
              <div className="h-full flex flex-col">
                <div className="p-4 bg-red-950/20 border-b border-red-900/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={handleStep} disabled={isAiProcessing || !debugState.isActive} className="p-2 bg-red-700 rounded-lg text-white hover:bg-red-600 transition-all disabled:opacity-50" title="Step Forward">
                      <StepForward className="w-4 h-4" />
                    </button>
                    <button onClick={handleDebugRefactor} disabled={isAiProcessing || !debugState.isActive} className="p-2 bg-red-950/40 border border-red-900/30 text-red-500 rounded-lg hover:bg-red-900/20 transition-all disabled:opacity-50" title="AI Debug Refactor">
                      <Wand2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleStartDebug} disabled={isAiProcessing} className="p-2 bg-red-950/40 border border-red-900/30 text-red-500 rounded-lg hover:bg-red-900/20 transition-all disabled:opacity-50" title="Restart Debugger">
                      <PlayCircle className="w-4 h-4" />
                    </button>
                    <button onClick={handleStopDebug} className="p-2 bg-red-950/40 border border-red-900/30 text-red-500 rounded-lg hover:bg-red-900/20 transition-all" title="Stop Debugger">
                      <StopCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Line: {debugState.currentLine}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-red-800 uppercase tracking-widest">Variables</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(debugState.variables).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between p-3 bg-red-950/10 border border-red-900/10 rounded-xl font-mono text-[11px]">
                          <span className="text-red-400">{k}</span>
                          <span className="text-red-100">{JSON.stringify(v)}</span>
                        </div>
                      ))}
                      {Object.keys(debugState.variables).length === 0 && (
                        <p className="text-[10px] text-red-900 italic">No variables in scope.</p>
                      )}
                    </div>
                  </div>

                  {debugRefactorResult && (
                    <div className="p-5 bg-red-900/10 border border-red-500/30 rounded-3xl space-y-4 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> AI Debug Refactor
                        </h5>
                        <button onClick={() => setDebugRefactorResult(null)} className="text-red-900 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-black/40 rounded-xl border border-red-900/20 font-mono text-[10px] text-red-100/80 overflow-x-auto">
                          <pre>{debugRefactorResult.refactoredCode}</pre>
                        </div>
                        <p className="text-[11px] text-red-100/60 leading-relaxed italic">
                          {debugRefactorResult.explanation}
                        </p>
                        <button
                          onClick={handleApplyDebugRefactor}
                          className="w-full py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg transition-all"
                        >
                          Apply Refactor
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-red-800 uppercase tracking-widest">Call Stack</h5>
                    <div className="space-y-2">
                      {debugState.callStack.map((frame, i) => (
                        <div key={i} className="flex items-center gap-3 text-[11px] font-mono text-red-100/60">
                          <span className="text-red-900">#{i}</span>
                          <span>{frame}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-red-800 uppercase tracking-widest">Breakpoints</h5>
                    <div className="flex flex-wrap gap-2">
                      {breakpoints.map(line => (
                        <div key={line} className="px-3 py-1 bg-red-900/20 border border-red-500/30 rounded-full text-[10px] text-red-500 font-black">
                          Line {line}
                        </div>
                      ))}
                      {breakpoints.length === 0 && (
                        <p className="text-[10px] text-red-900 italic">No breakpoints set.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {editorMode === 'git' && (
              <div className="h-full flex flex-col">
                {!gitRepo.initialized ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center space-y-6">
                    <GitBranch className="w-16 h-16 text-red-900/40" />
                    <div className="space-y-2">
                      <h5 className="text-[12px] font-black text-red-500 uppercase tracking-widest">Neural Repository Not Found</h5>
                      <p className="text-[10px] text-red-900/60 leading-relaxed max-w-[240px]">Initialize a repository to begin tracking neural state changes and synchronization.</p>
                    </div>
                    <button
                      onClick={handleGitInit}
                      className="px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all"
                    >
                      Initialize Repository
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 bg-red-950/20 border-b border-red-900/20 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest">
                          <GitBranch className="w-3 h-3" />
                          {gitRepo.branch}
                        </div>
                        <div className="h-4 w-px bg-red-900/30" />
                        <div className="flex items-center gap-3">
                          <button onClick={handleGitPull} title="Pull" className="text-red-900 hover:text-red-500 transition-colors"><GitPullRequest className="w-4 h-4" /></button>
                          <button onClick={handleGitPush} title="Push" className="text-red-900 hover:text-red-500 transition-colors"><GitMerge className="w-4 h-4" /></button>
                          <button onClick={handleGitStash} title="Stash" className="text-red-900 hover:text-red-500 transition-colors"><Archive className="w-4 h-4" /></button>
                          <button onClick={handleGitPop} title="Pop Stash" className="text-red-900 hover:text-red-500 transition-colors"><History className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGitSaveAll}
                          disabled={gitRepo.modified.length === 0 && gitRepo.staged.length === 0}
                          className="px-4 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-100 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-30 border border-red-800/30"
                        >
                          Save All
                        </button>
                        <button
                          onClick={handleGitCommit}
                          disabled={gitRepo.staged.length === 0}
                          className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-30"
                        >
                          Commit
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 md:space-y-8 custom-scrollbar">
                      {/* Staged Changes */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center justify-between">
                          Staged Changes
                          <span className="text-red-900/40">{gitRepo.staged.length}</span>
                        </h5>
                        <div className="space-y-1">
                          {gitRepo.staged.map(id => {
                            const file = projectFiles.find(f => f.id === id);
                            return (
                              <div key={id} className="flex items-center justify-between p-3 bg-red-950/10 border border-red-900/10 rounded-xl group">
                                <div className="flex items-center gap-3">
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-[11px] font-mono text-red-100">{file?.name}</span>
                                </div>
                                <button onClick={() => handleGitUnstage(id)} className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-red-900 hover:text-red-500 uppercase tracking-widest transition-all">Unstage</button>
                              </div>
                            );
                          })}
                          {gitRepo.staged.length === 0 && <p className="text-[10px] text-red-900/40 italic">No staged changes.</p>}
                        </div>
                      </div>

                      {/* Modified Changes */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center justify-between">
                          Modified
                          {gitRepo.modified.length > 0 && (
                            <button onClick={handleGitStageAll} className="text-[9px] font-black text-red-900 hover:text-red-500 uppercase tracking-widest transition-all">Stage All</button>
                          )}
                          <span className="text-red-900/40">{gitRepo.modified.length}</span>
                        </h5>
                        <div className="space-y-1">
                          {gitRepo.modified.map(id => {
                            const file = projectFiles.find(f => f.id === id);
                            return (
                              <div key={id} className="flex items-center justify-between p-3 bg-red-950/5 border border-red-900/5 rounded-xl group">
                                <div className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  <span className="text-[11px] font-mono text-red-100/60">{file?.name}</span>
                                </div>
                                <button onClick={() => handleGitStage(id)} className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-red-900 hover:text-red-500 uppercase tracking-widest transition-all">Stage</button>
                              </div>
                            );
                          })}
                          {gitRepo.modified.length === 0 && <p className="text-[10px] text-red-900/40 italic">No modified files.</p>}
                        </div>
                      </div>

                      {/* Commit History */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                          <History className="w-3 h-3" />
                          History
                        </h5>
                        <div className="space-y-4 border-l border-red-900/20 ml-2 pl-4">
                          {gitRepo.commits.map(commit => (
                            <div key={commit.id} className="relative space-y-1">
                              <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-red-900 border border-red-500/30" />
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-red-100">{commit.message}</span>
                                <span className="text-[9px] font-mono text-red-900">{commit.id}</span>
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-red-900/60 uppercase tracking-widest">
                                <span>{commit.author}</span>
                                <span>{new Date(commit.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          ))}
                          {gitRepo.commits.length === 0 && <p className="text-[10px] text-red-900/40 italic">No commit history.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {editorMode === 'settings' && (
              <div className="h-full flex flex-col p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <h5 className="text-[12px] font-black text-red-500 uppercase tracking-widest flex items-center gap-3">
                    <Settings className="w-4 h-4" /> Project Configuration
                  </h5>
                  <p className="text-[10px] text-red-900/60 leading-relaxed">Manage neural build paths, compiler directives, and environment state.</p>
                </div>

                <div className="space-y-6">
                  {/* Build Path */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                      <Folder className="w-3 h-3" /> Build Output Path
                    </label>
                    <input
                      value={projectSettings.buildPath}
                      onChange={(e) => {
                        const newSettings = {...projectSettings, buildPath: e.target.value};
                        setProjectSettings(newSettings);
                        validateProjectSettings(newSettings);
                      }}
                      className={`w-full bg-red-950/10 border ${validationErrors.buildPath ? 'border-red-500' : 'border-red-900/20'} rounded-xl px-4 py-3 text-[11px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all`}
                    />
                    {validationErrors.buildPath && <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">{validationErrors.buildPath}</p>}
                  </div>

                  {/* Compiler Flags */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                      <Cpu className="w-3 h-3" /> Neural Compiler Flags
                    </label>
                    <input
                      value={projectSettings.compilerFlags}
                      onChange={(e) => {
                        const newSettings = {...projectSettings, compilerFlags: e.target.value};
                        setProjectSettings(newSettings);
                        validateProjectSettings(newSettings);
                      }}
                      className={`w-full bg-red-950/10 border ${validationErrors.compilerFlags ? 'border-red-500' : 'border-red-900/20'} rounded-xl px-4 py-3 text-[11px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all`}
                    />
                    {validationErrors.compilerFlags && <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">{validationErrors.compilerFlags}</p>}
                  </div>

                  {/* Ollama URL */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Ollama Node URL
                      </label>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          ollamaStatus === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                          ollamaStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                          ollamaStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-[8px] font-mono uppercase tracking-tighter opacity-40">
                          {ollamaStatus}
                        </span>
                        <button
                          onClick={() => refreshOllamaModels()}
                          className="p-1 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Refresh Models"
                        >
                          <Zap size={10} className="text-red-500/60" />
                        </button>
                      </div>
                    </div>
                    <input
                      value={projectSettings.ollamaUrl}
                      onChange={(e) => {
                        const newSettings = {...projectSettings, ollamaUrl: e.target.value};
                        setProjectSettings(newSettings);
                        validateProjectSettings(newSettings);
                      }}
                      className={`w-full bg-red-950/10 border ${validationErrors.ollamaUrl ? 'border-red-500' : 'border-red-900/20'} rounded-xl px-4 py-3 text-[11px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all`}
                      placeholder="http://127.0.0.1:11434"
                    />
                    {validationErrors.ollamaUrl && <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">{validationErrors.ollamaUrl}</p>}
                  </div>

                  {/* Project Profiles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                        <UserCircle className="w-3 h-3" /> Project Profiles
                      </label>
                      <button
                        onClick={() => setProjectSettings({
                          ...projectSettings,
                          projectProfiles: [...projectSettings.projectProfiles, { id: Date.now().toString(), name: 'New Profile', instruction: 'New instructions...' }]
                        })}
                        className="p-1.5 bg-red-900/20 border border-red-900/30 rounded-lg text-red-500 hover:bg-red-900/40 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <select
                      value={projectSettings.activeProfileId}
                      onChange={(e) => setProjectSettings({...projectSettings, activeProfileId: e.target.value})}
                      className="w-full bg-red-950/10 border border-red-900/20 rounded-xl px-4 py-2 text-[10px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all"
                    >
                      {projectSettings.projectProfiles.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {projectSettings.projectProfiles.map((p, idx) => (
                      <div key={p.id} className="space-y-2 bg-red-950/10 p-3 rounded-xl border border-red-900/10">
                        <input
                          placeholder="Profile Name"
                          value={p.name}
                          onChange={(e) => {
                            const newProfiles = [...projectSettings.projectProfiles];
                            newProfiles[idx].name = e.target.value;
                            setProjectSettings({...projectSettings, projectProfiles: newProfiles});
                          }}
                          className="w-full bg-transparent border-b border-red-900/20 px-2 py-1 text-[10px] font-black text-red-100 outline-none"
                        />
                        <textarea
                          placeholder="Instructions"
                          value={p.instruction}
                          onChange={(e) => {
                            const newProfiles = [...projectSettings.projectProfiles];
                            newProfiles[idx].instruction = e.target.value;
                            setProjectSettings({...projectSettings, projectProfiles: newProfiles});
                          }}
                          className="w-full bg-transparent border border-red-900/20 rounded-lg px-2 py-1 text-[10px] font-mono text-red-100 outline-none h-20"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Environment Variables */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                        <Database className="w-3 h-3" /> Environment Variables
                      </label>
                      <button
                        onClick={() => setProjectSettings({
                          ...projectSettings,
                          envVariables: [...projectSettings.envVariables, { key: '', value: '' }]
                        })}
                        className="p-1.5 bg-red-900/20 border border-red-900/30 rounded-lg text-red-500 hover:bg-red-900/40 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {projectSettings.envVariables.map((env, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex gap-2">
                            <input
                              placeholder="KEY"
                              value={env.key}
                              onChange={(e) => {
                                const newEnv = [...projectSettings.envVariables];
                                newEnv[idx].key = e.target.value;
                                const newSettings = {...projectSettings, envVariables: newEnv};
                                setProjectSettings(newSettings);
                                validateProjectSettings(newSettings);
                              }}
                              className={`flex-1 bg-red-950/10 border ${validationErrors[`env_key_${idx}`] ? 'border-red-500' : 'border-red-900/20'} rounded-xl px-4 py-2 text-[10px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all`}
                            />
                            <input
                              placeholder="VALUE"
                              value={env.value}
                              onChange={(e) => {
                                const newEnv = [...projectSettings.envVariables];
                                newEnv[idx].value = e.target.value;
                                const newSettings = {...projectSettings, envVariables: newEnv};
                                setProjectSettings(newSettings);
                                validateProjectSettings(newSettings);
                              }}
                              className={`flex-2 bg-red-950/10 border ${validationErrors[`env_value_${idx}`] ? 'border-red-500' : 'border-red-900/20'} rounded-xl px-4 py-2 text-[10px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all`}
                            />
                            <button
                              onClick={() => {
                                const newEnv = projectSettings.envVariables.filter((_, i) => i !== idx);
                                const newSettings = {...projectSettings, envVariables: newEnv};
                                setProjectSettings(newSettings);
                                validateProjectSettings(newSettings);
                              }}
                              className="p-2 text-red-900 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          {(validationErrors[`env_key_${idx}`] || validationErrors[`env_value_${idx}`]) && (
                            <div className="flex flex-col gap-0.5 px-1">
                              {validationErrors[`env_key_${idx}`] && <p className="text-[8px] text-red-500 font-black uppercase tracking-widest">{validationErrors[`env_key_${idx}`]}</p>}
                              {validationErrors[`env_value_${idx}`] && <p className="text-[8px] text-red-500 font-black uppercase tracking-widest">{validationErrors[`env_value_${idx}`]}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
