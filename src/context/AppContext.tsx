import React, { createContext, useContext, ReactNode } from 'react';
import { ProjectFile } from '../hooks/editor/useEditorFileSystem';
import { WorkerConfig } from '../hooks/useAiWorkers';
import { Personality } from '../data/personalities';
import { GitRepoState, Commit } from '../hooks/useGitLogic';
import { DebugState } from '../hooks/editor/useDebuggerLogic';
import { ProjectSettings } from '../hooks/useProjectSettings';
import { SwarmAgent, SwarmLog } from '../hooks/useSwarmState';
import { StorageFile } from '../hooks/useSystemStates';
import { TrafficEvent, DriftAlert } from '../hooks/useBrain';
import { EndocrineState, BrainContext } from '../services/brain/types';

interface AppContextType {
  // Navigation & Theme
  activeTab: string;
  setActiveTab: (tab: any) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Brain & Monitoring
  endocrine: EndocrineState | null;
  isBrainActive: boolean;
  setIsBrainActive: (v: boolean) => void;
  traffic: TrafficEvent[];
  driftAlert: DriftAlert | null;
  clearDriftAlert: () => void;
  vaultMemories: any[];
  fetchVault: () => Promise<void>;
  prepareContext: (input: string, personalityId?: number) => Promise<BrainContext | null>;
  recordInteraction: (
    input: string,
    response: string,
    outcome: 'success' | 'failure' | 'neutral',
  ) => Promise<void>;
  sleep: () => Promise<any>;
  refreshState: () => Promise<void>;

  // AI Orchestration
  isAiProcessing: boolean;
  setIsAiProcessing: (v: boolean) => void;
  generateAIResponse: any;
  pipeline: any;
  ai: any;

  // Workers & Models
  workers: WorkerConfig[];
  setWorkers: React.Dispatch<React.SetStateAction<WorkerConfig[]>>;
  availableModels: string[];
  ollamaStatus: string;
  refreshOllamaModels: (silent?: boolean) => Promise<void>;

  // Personalities
  personalities: Personality[];
  setPersonalities: React.Dispatch<React.SetStateAction<Personality[]>>;
  activePersonality: Personality;

  // File System
  projectFiles: ProjectFile[];
  setProjectFiles: React.Dispatch<React.SetStateAction<ProjectFile[]>>;
  activeFileId: string;
  setActiveFileId: (id: string) => void;
  markFileDirty: (id: string) => void;

  // Editor
  editorContent: string;
  setEditorContent: (v: string) => void;
  editorLanguage: string;
  setEditorLanguage: (v: string) => void;
  editorMode: string;
  setEditorMode: (v: any) => void;
  editorOutput: string;
  setEditorOutput: React.Dispatch<React.SetStateAction<string>>;
  debouncedEditorContent: string;

  // Git
  gitRepo: GitRepoState;
  setGitRepo: React.Dispatch<React.SetStateAction<GitRepoState>>;

  // Debugger
  debugState: DebugState;
  setDebugState: React.Dispatch<React.SetStateAction<DebugState>>;
  breakpoints: number[];
  setBreakpoints: React.Dispatch<React.SetStateAction<number[]>>;

  // Settings
  projectSettings: ProjectSettings;
  setProjectSettings: React.Dispatch<React.SetStateAction<ProjectSettings>>;

  // Swarm
  swarmAnxiety: number;
  swarmAgents: SwarmAgent[];
  swarmLogs: SwarmLog[];

  // Termux & Storage
  termuxStatus: string;
  storageFiles: StorageFile[];

  // Modals & UI State
  isMobileFileTreeOpen: boolean;
  setIsMobileFileTreeOpen: (v: boolean) => void;
  isEditorAssistantOpen: boolean;
  setIsEditorAssistantOpen: (v: boolean) => void;

  // Analysis Handlers
  debugAnalysis: any;
  runStaticAnalysis: () => Promise<void>;
  runDynamicTracing: () => Promise<void>;
  handleScanCode: () => Promise<void>;
  handleAnalyzeCode: () => Promise<void>;
  handleFullProjectAnalysis: () => Promise<void>;
  handleDeepProjectAudit: () => Promise<void>;
  handleRunCode: () => Promise<void>;
  getRefactoringSuggestions: () => Promise<void>;

  // Forge Handlers
  generatePrompt: string;
  setGeneratePrompt: (v: string) => void;
  generateMode: 'snippet' | 'file';
  setGenerateMode: (v: 'snippet' | 'file') => void;
  isGenerateModalOpen: boolean;
  setIsGenerateModalOpen: (v: boolean) => void;
  templateConfirmKey: any;
  handleFormatCode: (isMobile?: boolean) => Promise<void>;
  handleRefactorCode: () => Promise<void>;
  handleRefactorAllFiles: () => Promise<void>;
  executeGenerateCode: () => Promise<void>;
  handleApplyForge: (code: string, isSnippet?: boolean) => void;
  handleApplyRefactor: (refactoredCode: string, isSelection: boolean, selection: any) => void;
  handleGenerateCode: () => void;
  handleLoadTemplate: (key: any) => void;
  confirmLoadTemplate: () => void;
  handleSaveAnalysis: (text: string) => void;

  // Debugger Handlers
  handleToggleCurrentLineBreakpoint: () => void;
  handleStartDebug: () => Promise<void>;
  handleStopDebug: () => void;
  handleStep: () => Promise<void>;
  handleDebugRefactor: () => Promise<void>;
  handleApplyDebugRefactor: () => void;

  // Chat Handlers
  handleEditorAssistantSubmit: (e?: React.FormEvent, promptOverride?: string) => Promise<void>;
  handleStudioSubmit: (e: React.FormEvent) => Promise<void>;
  handleReviewCode: () => Promise<void>;
  handleCodeReview: () => Promise<void>;
  handleExplainCode: () => Promise<void>;
  handleAnalyzeData: () => Promise<void>;
  handleGenerateDocs: () => Promise<void>;
  handleApplyDocumentation: (documentedCode: string, isSelection: boolean, selection: any) => void;
  lastEditorAssistantPrompt: string;

  // Inspector Handlers
  handleInspectMouseMove: (e: React.MouseEvent) => void;
  handleInspectClick: (e: React.MouseEvent) => void;
  handleStyleChange: (property: string, value: string) => void;
  inspectedElement: any;
  setInspectedElement: any;
  inspectedElementRef: React.MutableRefObject<HTMLElement | null>;
  previewContainerRef: React.RefObject<HTMLDivElement>;

  // Git Handlers
  handleGitInit: () => void;
  handleGitStash: () => void;
  handleGitPop: () => void;
  handleGitStage: (id: string) => void;
  handleGitStageAll: () => void;
  handleGitUnstage: (id: string) => void;
  handleGitCommit: () => void;
  confirmGitCommit: () => void;
  handleGitSaveAll: () => void;
  handleGitPush: () => Promise<void>;
  handleGitPull: () => Promise<void>;
  commitMessage: string;
  setCommitMessage: (v: string) => void;
  isCommitModalOpen: boolean;
  setIsCommitModalOpen: (v: boolean) => void;
  postCommitModalOpen: boolean;
  setPostCommitModalOpen: (v: boolean) => void;

  // File System Handlers
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleFileSwitch: (id: string) => void;
  createFile: (parentId: string | null) => void;
  createFolder: (parentId: string | null) => void;
  renameItem: (id: string) => void;
  handleConfirmRename: () => void;
  handleConfirmCreate: () => void;
  deleteItem: (id: string) => void;
  confirmDeleteItem: (id: string) => void;
  toggleFolder: (id: string) => void;
  handleStorageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleTermuxFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;

  // Node Bridge Handlers
  handleTermuxImport: (name: string, content: string, path: string) => void;
  terminalOutput: string[];
  termInput: string;
  setTermInput: (v: string) => void;
  termSuggestion: string;
  setTermSuggestion: (v: string) => void;
  termSuggestions: string[];
  setTermSuggestions: (v: string[]) => void;
  selectedSuggestionIndex: number;
  terminal: any;
  handleTerminalCommand: (cmd: any) => void;
  handleTermInputChange: (val: string) => void;
  handleTermKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  // Swarm Handlers
  triggerSwarmCycle: () => Promise<void>;

  // Extra UI state
  cursorLine: number;
  setCursorLine: (v: number) => void;
  editorAssistantInput: string;
  setEditorAssistantInput: (v: string) => void;
  editorAssistantMessages: any[];
  setEditorAssistantMessages: (v: any) => void;
  isScanningCode: boolean;
  scanResults: number[];
  isRunningCode: boolean;
  setIsRunningCode: (v: boolean) => void;
  isLivePreviewEnabled: boolean;
  setIsLivePreviewEnabled: (v: boolean) => void;
  isInspectorActive: boolean;
  setIsInspectorActive: (v: boolean) => void;
  isPairProgrammerActive: boolean;
  setIsPairProgrammerActive: (v: boolean) => void;
  tnKnowledgePacks: any[];
  setTnKnowledgePacks: (v: any) => void;
  sdParams: any;
  setSdParams: (v: any) => void;
  negativePrompt: string;
  setNegativePrompt: (v: string) => void;
  studioInput: string;
  setStudioInput: (v: string) => void;
  chatSummary: string;
  setChatSummary: (v: string) => void;
  validationErrors: Record<string, string>;
  validateProjectSettings: (settings: any) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode; value: AppContextType }> = ({
  children,
  value,
}) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
