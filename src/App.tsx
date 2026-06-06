import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Download, X, Cpu, Check } from 'lucide-react';

// Hooks
import { useBrain } from './hooks/useBrain';
import { usePhi } from './hooks/usePhi';
import { usePersonalities } from './hooks/usePersonalities';
import { useProjectSettings } from './hooks/useProjectSettings';
import { useAiWorkers } from './hooks/useAiWorkers';
import { useAiOrchestrator } from './hooks/useAiOrchestrator';
import { usePipeline } from './hooks/usePipeline';
import { useAiRequest } from './hooks/useAiRequest';
import { useSystemStates } from './hooks/useSystemStates';
import { useGitLogic } from './hooks/useGitLogic';
import { useEditorFileSystem } from './hooks/editor/useEditorFileSystem';
import { useEditorLogic } from './hooks/editor/useEditorLogic';
import { useAnalysisHandlers } from './hooks/editor/useAnalysisHandlers';
import { useForgeHandlers } from './hooks/editor/useForgeHandlers';
import { useInspectorHandlers } from './hooks/editor/useInspectorHandlers';
import { useDebuggerLogic } from './hooks/editor/useDebuggerLogic';
import { useDebuggerHandlers } from './hooks/editor/useDebuggerHandlers';
import { useChatHandlers } from './hooks/useChatHandlers';
import { useSwarm } from './hooks/useSwarm';
import { useTerminal } from './hooks/terminal/useTerminal';
import { useTerminalLogic } from './hooks/terminal/useTerminalLogic';

// Layout & Panels
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MainHeader } from './components/layout/MainHeader';
import { ToolNeuronPanel } from './components/panels/ToolNeuronPanel';
import { TerminalPanel } from './components/panels/TerminalPanel';
import { EditorPanel } from './components/panels/EditorPanel';
import { AnalysisPanel } from './components/panels/AnalysisPanel';
import { NodeBridgePanel } from './components/panels/NodeBridgePanel';
import { StoragePanel } from './components/panels/StoragePanel';
import { BrainPanel } from './components/panels/BrainPanel';
import { SettingsPanel } from './components/panels/SettingsPanel';

// Modals & Registry
import { CommitModal } from './components/modals/CommitModal';
import { GenerateModal } from './components/modals/GenerateModal';
import { TemplateModal } from './components/modals/TemplateModal';
import { AppProvider } from './context/AppContext';
import { PROJECT_TEMPLATES } from './services/templates';
import { AGENT_DOMAINS, getAgentsByDomain } from './data/agentRegistry';
import { PatternResult } from './services/pipeline/patternInjectionService';

export default function App() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<
    'terminal' | 'analysis' | 'termux' | 'storage' | 'settings' | 'editor' | 'toolneuron' | 'brain'
  >('toolneuron');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Remove splash screen on mount
  useEffect(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 350);
    }
  }, []);

  // Neural Core & Golden Ratio Layout
  const { endocrine, isBrainActive, setIsBrainActive, prepareContext, recordInteraction, sleep, refreshState } = useBrain();
  const phi = usePhi(endocrine);

  // Model slots & Personalities
  const {
    personalities,
    setPersonalities,
    grokApiKey,
    setGrokApiKey,
    geminiApiKey,
    setGeminiApiKey,
    openrouterApiKey,
    setOpenrouterApiKey,
    googleAiClient,
    activePersonality
  } = usePersonalities();

  const { projectSettings, setProjectSettings, validationErrors, validateProjectSettings } = useProjectSettings();

  // Chat & Studio State
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      role: 'ai',
      text: 'Neural Interface Active. Multi-Agent MCP Swarm Synchronized with Local & Global Hardware. Projscan, 21st-Magic, and GitHub protocols online.',
      timestamp: Date.now(),
    },
  ]);
  const [chatSummary, setChatSummary] = useState('');
  const [studioInput, setStudioInput] = useState('');
  const [studioRefImage] = useState<any>(null); // Read-only stub for simple bridge
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Workers
  const { workers, setWorkers, availableModels, ollamaStatus, refreshOllamaModels } = useAiWorkers(setChatMessages);

  // AI Orchestration
  const { generateAIResponse } = useAiOrchestrator(workers, personalities, grokApiKey, geminiApiKey, openrouterApiKey, projectSettings);
  const pipeline = usePipeline(generateAIResponse as any);
  const ai = useAiRequest(generateAIResponse);

  // System States
  const {
    termuxStatus, setTermuxStatus,
    termuxFiles, setTermuxFiles,
    storageFiles, setStorageFiles,
    isVaultUnlocked, setIsVaultUnlocked,
    negativePrompt, setNegativePrompt,
    sdParams, setSdParams
  } = useSystemStates();

  // Terminal
  const terminal = useTerminal('~/crimson-node/sd-webui', '/data/data/com.termux/files/home');

  // Modals & Extra UI
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [postCommitModalOpen, setPostCommitModalOpen] = useState(false);
  const [workerSheetOpen, setWorkerSheetOpen] = useState(false);

  // Biological Logic / Brain config (local setting overrides)
  const [brainConfig, setBrainConfig] = useState({
    runtime: 'python',
    logic: '',
    mappedPaths: ['/sdcard/Download/Crimson-Weights', '/data/data/com.termux/files/home'],
  });
  const [brainRefFile, setBrainRefFile] = useState<any>(null);

  // RAG Vector state
  const [tnKnowledgePacks, setTnKnowledgePacks] = useState<any[]>([
    { id: 1, name: 'Medical_Core_v2', size: '1.2GB', status: 'indexed' },
    { id: 2, name: 'Legal_Archive_2025', size: '850MB', status: 'indexed' },
  ]);

  // Circular reference proxies for Git/FileSystem interaction
  const gitRepoRef = useRef<any>({
    initialized: false,
    branch: 'main',
    commits: [],
    staged: [],
    modified: [],
    stash: [],
  });
  const setGitRepoRef = useRef<any>(() => {});

  const gitRepoProxy = new Proxy({}, {
    get(_, prop) {
      return gitRepoRef.current[prop];
    }
  });
  const setGitRepoProxy = useCallback((val: any) => {
    setGitRepoRef.current(val);
  }, []);

  // File System State
  const fsState = useEditorFileSystem(
    phi,
    gitRepoProxy,
    setGitRepoProxy,
    (updater: any) => {
      // Stub to receive editor output updates from file system activity
      const val = typeof updater === 'function' ? updater(editorOutputRef.current) : updater;
      setEditorOutput(val);
    },
    (updater: any) => {
      const val = typeof updater === 'function' ? updater(terminalOutputRef.current) : updater;
      terminal.setTerminalOutput(val);
    },
    setTermuxFiles,
    setStorageFiles
  );

  // Git State
  const gitState = useGitLogic(
    fsState.projectFiles,
    fsState.setProjectFiles,
    (updater: any) => {
      const val = typeof updater === 'function' ? updater(editorOutputRef.current) : updater;
      setEditorOutput(val);
    },
    fsState.activeFileId
  );

  // Sync references
  gitRepoRef.current = gitState.gitRepo;
  setGitRepoRef.current = gitState.setGitRepo;

  // Editor State
  const editorState = useEditorLogic(
    fsState.projectFiles,
    fsState.setProjectFiles,
    fsState.activeFileId,
    fsState.setActiveFileId,
    fsState.markFileDirty,
    fsState.editorLanguage,
    fsState.setEditorLanguage,
    (updater: any) => {
      const val = typeof updater === 'function' ? updater(editorOutputRef.current) : updater;
      setEditorOutput(val);
    },
    gitState.gitRepo,
    gitState.setGitRepo
  );

  // Track editor/terminal output refs to avoid dependencies loops
  const editorOutputRef = useRef('');
  const [editorOutput, setEditorOutputInternal] = useState('');
  const setEditorOutput = useCallback((val: any) => {
    setEditorOutputInternal((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      editorOutputRef.current = next;
      return next;
    });
  }, []);

  const terminalOutputRef = useRef<string[]>([]);
  useEffect(() => {
    terminalOutputRef.current = terminal.terminalOutput;
  }, [terminal.terminalOutput]);

  // Code Analysis State
  const analysisState = useAnalysisHandlers(
    editorState.editorContent,
    fsState.editorLanguage,
    editorState.editorAssistantInput,
    setEditorOutput,
    editorState.setEditorAssistantMessages,
    editorState.setIsEditorAssistantOpen,
    setIsAiProcessing,
    recordInteraction,
    fsState.projectFiles,
    pipeline,
    editorState.isScanningCode,
    editorState.setIsScanningCode,
    editorState.setScanResults,
    activePersonality,
    prepareContext,
    editorState.setIsRunningCode,
    editorState.setEditorMode
  );

  // Code Forger State
  const forgeState = useForgeHandlers(
    editorState.editorContent,
    editorState.setEditorContent,
    fsState.editorLanguage,
    fsState.setEditorLanguage,
    editorState.setEditorMode,
    setEditorOutput,
    setIsAiProcessing,
    activePersonality,
    prepareContext,
    editorState.setEditorAssistantMessages,
    editorState.setIsEditorAssistantOpen,
    fsState.projectFiles,
    fsState.setProjectFiles,
    fsState.activeFileId,
    fsState.setActiveFileId,
    fsState.markFileDirty,
    editorState.monacoEditorRef,
    gitState.setGitRepo,
    setIsTemplateModalOpen
  );

  // Visual Inspector State
  const inspectorState = useInspectorHandlers(
    editorState.isInspectorActive,
    editorState.setIsInspectorActive,
    editorState.setInspectedElement,
    editorState.inspectedElementRef,
    editorState.previewContainerRef,
    editorState.setEditorContent
  );

  // Debugger Logic & Handlers
  const debuggerLogic = useDebuggerLogic();
  const debuggerState = useDebuggerHandlers(
    editorState.editorContent,
    fsState.editorLanguage,
    editorState.setEditorContent,
    setEditorOutput,
    setIsAiProcessing,
    editorState.setEditorAssistantMessages,
    editorState.setIsEditorAssistantOpen,
    debuggerLogic.debugState,
    debuggerLogic.setDebugState,
    debuggerLogic.setDebugRefactorResult,
    debuggerLogic.debugRefactorResult,
    debuggerLogic.breakpoints,
    debuggerLogic.setBreakpoints,
    editorState.isRunningCode,
    editorState.cursorLine
  );

  // Swarm Setup
  const swarm = useSwarm(pipeline.dispatch);

  // Terminal State
  const terminalState = useTerminalLogic(terminal, {
    activeTab,
    setActiveTab: setActiveTab as any,
    editorLanguage: fsState.editorLanguage,
    editorMode: editorState.editorMode,
    projectFiles: fsState.projectFiles,
    setProjectFiles: fsState.setProjectFiles,
    termuxStatus,
    ollamaStatus,
    isVaultUnlocked,
    swarmAnxiety: swarm.swarmAnxiety,
    personalities,
    activePersonality,
    setIsAiProcessing,
    generateAIResponse,
  });

  // Chat & assistant Submit handlers
  const chatState = useChatHandlers(
    editorState.editorContent,
    fsState.editorLanguage,
    chatMessages,
    setChatMessages,
    editorState.editorAssistantInput,
    editorState.setEditorAssistantInput,
    editorState.editorAssistantMessages,
    editorState.setEditorAssistantMessages,
    editorState.setIsEditorAssistantOpen,
    setIsAiProcessing,
    activePersonality,
    projectSettings,
    chatSummary,
    studioInput,
    setStudioInput,
    studioRefImage,
    fsState.projectFiles,
    fsState.setProjectFiles,
    fsState.activeFileId,
    fsState.setActiveFileId,
    editorState.setEditorContent,
    fsState.setEditorLanguage,
    editorState.setEditorMode,
    fsState.markFileDirty,
    setEditorOutput
  );

  // Pipeline Event Synchronization
  useEffect(() => {
    const unsub = pipeline.onResponse((result: PatternResult) => {
      if (result.responseType === 'code_output') {
        setEditorOutput(
          typeof result.payload === 'string' ? result.payload : '[ERROR] Empty response.'
        );
        editorState.setIsRunningCode(false);
      } else if (result.responseType === 'scan_result') {
        const lines = Array.isArray(result.payload) ? (result.payload as number[]) : [];
        editorState.setScanResults(lines);
        editorState.setIsScanningCode(false);
      } else if (result.responseType === 'swarm_update') {
        const update = result.payload as {
          consensus: boolean;
          confidence: number;
          summary: string;
        };
        if (update.consensus) {
          swarm.setSwarmLogs((prev) => [
            {
              id: Date.now(),
              type: 'consensus',
              message: `Consensus: ${update.summary} (${(update.confidence * 100).toFixed(0)}%)`,
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
          swarm.setSwarmAnxiety((prev) => Math.max(0.05, prev - 0.02));
        } else {
          swarm.setSwarmLogs((prev) => [
            {
              id: Date.now(),
              type: 'pain',
              message: `Conflict: ${update.summary}`,
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
          swarm.setSwarmAnxiety((prev) => Math.min(1.0, prev + 0.15));
        }
        swarm.setSwarmAgents((prev) => prev.map((a) => ({ ...a, status: 'idle' as const })));
        setIsAiProcessing(false);
      }
    });

    const unsubErr = pipeline.onError((err) => {
      console.error('[Pipeline error]', err);
      if (err.signal?.source === 'editor') {
        setEditorOutput(`[CRITICAL] Neural runtime bridge failure — ${err.error}`);
        editorState.setIsRunningCode(false);
        editorState.setIsScanningCode(false);
      } else if (err.signal?.source === 'swarm') {
        setIsAiProcessing(false);
      }
    });

    return () => {
      unsub();
      unsubErr();
    };
  }, [pipeline, editorState, swarm, setEditorOutput]);

  // Unified Git commit/pull/save helpers
  const handleGitCommit = () => {
    if (gitState.gitRepo.staged.length === 0) return;
    setCommitMessage('');
    setIsCommitModalOpen(true);
  };

  const confirmGitCommit = () => {
    const message = commitMessage.replace(/[^\w\s\-.,!?():]/g, '').trim().slice(0, 200);
    if (!message || gitState.gitRepo.staged.length === 0) return;
    setIsCommitModalOpen(false);
    setCommitMessage('');

    const newCommit = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: Date.now(),
      author: 'Operator',
    };

    gitState.setGitRepo((prev: any) => ({
      ...prev,
      commits: [newCommit, ...prev.commits],
      staged: [],
    }));
    setEditorOutput(
      (prev) => prev + `[GIT] Committed ${gitState.gitRepo.staged.length} files: ${message}\n`
    );
    setPostCommitModalOpen(true);
  };

  const handleGitSaveAll = () => {
    if (gitState.gitRepo.modified.length === 0 && gitState.gitRepo.staged.length === 0) return;

    gitState.setGitRepo((prev: any) => {
      const newStaged = [...new Set([...prev.staged, ...prev.modified])];
      const newCommit = {
        id: Math.random().toString(36).substring(2, 9),
        message: 'WIP: Automated save',
        timestamp: Date.now(),
        author: 'System',
      };

      setEditorOutput(
        (out) => out + `[GIT] Committed ${newStaged.length} files: WIP: Automated save\n`
      );

      return {
        ...prev,
        staged: [],
        modified: [],
        commits: [newCommit, ...prev.commits],
      };
    });
  };

  const handleGitPull = async () => {
    setIsAiProcessing(true);
    setEditorOutput((prev) => prev + '[GIT] Pulling from GitHub...\n');
    try {
      const response = await fetch('./api/github/pull');
      const data = await response.json();
      if (data.ok) {
        setEditorOutput((prev) => prev + '[GIT] Successfully pulled from GitHub.\n');
      } else {
        setEditorOutput((prev) => prev + '[GIT] ERROR: Pull failed. Check server GITHUB_TOKEN.\n');
      }
    } catch {
      setEditorOutput((prev) => prev + '[GIT] ERROR: Could not reach server.\n');
    }
    setIsAiProcessing(false);
  };

  // Node bridge import wrapper
  const handleTermuxImport = (name: string, content: string, path: string) => {
    const ext = name.split('.').pop() ?? 'text';
    const langMap: Record<string, string> = {
      py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
      html: 'html', css: 'css', rs: 'rust', go: 'go', cpp: 'cpp', json: 'json', md: 'markdown', sh: 'shell'
    };
    const newFile = {
      id: `termux_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      type: 'file' as const,
      parentId: 'root',
      language: langMap[ext] ?? 'text',
      content,
    };
    fsState.setProjectFiles((prev) => [...prev, newFile]);
    fsState.setActiveFileId(newFile.id);
    editorState.setEditorContent(content);
    fsState.setEditorLanguage(newFile.language);
    setActiveTab('editor');
    terminal.setTerminalOutput((prev) => [...prev, `[IMPORT] ${path} → project`]);
  };

  const handleKnowledgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPacks = Array.from(files).map((file: any, index) => ({
      id: Date.now() + index,
      name: file.name.replace(/\.[^/.]+$/, ''),
      size: (file.size / (1024 * 1024)).toFixed(1) + 'MB',
      status: 'indexing' as const,
    }));

    setTnKnowledgePacks((prev) => [...prev, ...newPacks]);
    terminal.setTerminalOutput((prev) => [
      ...prev,
      `[RAG] Ingesting ${newPacks.length} knowledge vectors...`,
    ]);

    for (const pack of newPacks) {
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000));
      setTnKnowledgePacks((prev) =>
        prev.map((p) => (p.id === pack.id ? { ...p, status: 'indexed' as const } : p))
      );
      terminal.setTerminalOutput((prev) => [
        ...prev,
        `[SUCCESS] Knowledge Pack '${pack.name}' indexed and ready.`,
      ]);
    }
  };

  // Unified application context value
  const contextValue = {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,

    isAiProcessing,
    setIsAiProcessing,
    generateAIResponse,
    pipeline,
    ai,

    workers,
    setWorkers,
    availableModels,
    ollamaStatus,
    refreshOllamaModels,

    personalities,
    setPersonalities,
    activePersonality,

    projectFiles: fsState.projectFiles,
    setProjectFiles: fsState.setProjectFiles,
    activeFileId: fsState.activeFileId,
    setActiveFileId: fsState.setActiveFileId,
    markFileDirty: fsState.markFileDirty,

    editorContent: editorState.editorContent,
    setEditorContent: editorState.setEditorContent,
    editorLanguage: fsState.editorLanguage,
    setEditorLanguage: fsState.setEditorLanguage,
    editorMode: editorState.editorMode,
    setEditorMode: editorState.setEditorMode,
    editorOutput,
    setEditorOutput,
    debouncedEditorContent: editorState.debouncedEditorContent,

    gitRepo: gitState.gitRepo,
    setGitRepo: gitState.setGitRepo,

    debugState: debuggerLogic.debugState,
    setDebugState: debuggerLogic.setDebugState,
    breakpoints: debuggerLogic.breakpoints,
    setBreakpoints: debuggerLogic.setBreakpoints,

    projectSettings,
    setProjectSettings,

    swarmAnxiety: swarm.swarmAnxiety,
    swarmAgents: swarm.swarmAgents,
    swarmLogs: swarm.swarmLogs,

    termuxStatus,
    storageFiles,

    isMobileFileTreeOpen: editorState.isMobileFileTreeOpen,
    setIsMobileFileTreeOpen: editorState.setIsMobileFileTreeOpen,
    isEditorAssistantOpen: editorState.isEditorAssistantOpen,
    setIsEditorAssistantOpen: editorState.setIsEditorAssistantOpen,

    // Analysis
    debugAnalysis: analysisState.debugAnalysis,
    runStaticAnalysis: analysisState.runStaticAnalysis,
    runDynamicTracing: analysisState.runDynamicTracing,
    handleScanCode: analysisState.handleScanCode,
    handleAnalyzeCode: analysisState.handleAnalyzeCode,
    handleFullProjectAnalysis: analysisState.handleFullProjectAnalysis,
    handleDeepProjectAudit: analysisState.handleDeepProjectAudit,
    handleRunCode: analysisState.handleRunCode,
    getRefactoringSuggestions: analysisState.getRefactoringSuggestions,

    // Forge
    generatePrompt: forgeState.generatePrompt,
    setGeneratePrompt: forgeState.setGeneratePrompt,
    generateMode: forgeState.generateMode,
    setGenerateMode: forgeState.setGenerateMode,
    isGenerateModalOpen: forgeState.isGenerateModalOpen,
    setIsGenerateModalOpen: forgeState.setIsGenerateModalOpen,
    templateConfirmKey: forgeState.templateConfirmKey,
    handleFormatCode: forgeState.handleFormatCode,
    handleRefactorCode: forgeState.handleRefactorCode,
    handleRefactorAllFiles: forgeState.handleRefactorAllFiles,
    executeGenerateCode: forgeState.executeGenerateCode,
    handleApplyForge: forgeState.handleApplyForge,
    handleApplyRefactor: forgeState.handleApplyRefactor,
    handleGenerateCode: forgeState.handleGenerateCode,
    handleLoadTemplate: forgeState.handleLoadTemplate,
    confirmLoadTemplate: forgeState.confirmLoadTemplate,
    handleSaveAnalysis: forgeState.handleSaveAnalysis,

    // Debugger
    handleToggleCurrentLineBreakpoint: debuggerState.handleToggleCurrentLineBreakpoint,
    handleStartDebug: debuggerState.handleStartDebug,
    handleStopDebug: debuggerState.handleStopDebug,
    handleStep: debuggerState.handleStep,
    handleDebugRefactor: debuggerState.handleDebugRefactor,
    handleApplyDebugRefactor: debuggerState.handleApplyDebugRefactor,

    // Chat
    handleEditorAssistantSubmit: chatState.handleEditorAssistantSubmit,
    handleStudioSubmit: chatState.handleStudioSubmit,
    handleReviewCode: chatState.handleReviewCode,
    handleCodeReview: chatState.handleCodeReview,
    handleExplainCode: chatState.handleExplainCode,
    handleAnalyzeData: chatState.handleAnalyzeData,
    handleGenerateDocs: chatState.handleGenerateDocs,
    handleApplyDocumentation: chatState.handleApplyDocumentation,
    lastEditorAssistantPrompt: chatState.lastEditorAssistantPrompt,

    // Inspector
    handleInspectMouseMove: inspectorState.handleInspectMouseMove,
    handleInspectClick: inspectorState.handleInspectClick,
    handleStyleChange: inspectorState.handleStyleChange,
    inspectedElement: editorState.inspectedElement,
    setInspectedElement: editorState.setInspectedElement,
    inspectedElementRef: editorState.inspectedElementRef,
    previewContainerRef: editorState.previewContainerRef,

    // Git Handlers
    handleGitInit: gitState.handleGitInit,
    handleGitStash: () => {
      gitState.setGitRepo((prev: any) => ({ ...prev, stash: [...prev.stash, prev.modified] }));
      setEditorOutput((prev: string) => prev + '[GIT] Stashed modifications.\n');
    },
    handleGitPop: () => {
      gitState.setGitRepo((prev: any) => {
        if (prev.stash.length === 0) return prev;
        return { ...prev, stash: prev.stash.slice(0, -1), modified: [...new Set([...prev.modified, ...prev.stash[prev.stash.length - 1]])] };
      });
      setEditorOutput((prev: string) => prev + '[GIT] Popped stash.\n');
    },
    handleGitStage: gitState.handleGitStage,
    handleGitStageAll: gitState.handleGitStageAll,
    handleGitUnstage: gitState.handleGitUnstage,
    handleGitCommit,
    confirmGitCommit,
    handleGitSaveAll,
    handleGitPush: () => gitState.handleGitPush(setIsAiProcessing),
    handleGitPull,
    commitMessage,
    setCommitMessage,
    isCommitModalOpen,
    setIsCommitModalOpen,
    postCommitModalOpen,
    setPostCommitModalOpen,

    // File System Handlers
    handleFileUpload: fsState.handleFileUpload,
    handleFileSwitch: fsState.handleFileSwitch,
    createFile: fsState.createFile,
    createFolder: fsState.createFolder,
    renameItem: fsState.renameItem,
    handleConfirmRename: fsState.handleConfirmRename,
    handleConfirmCreate: fsState.handleConfirmCreate,
    deleteItem: fsState.deleteItem,
    confirmDeleteItem: fsState.confirmDeleteItem,
    toggleFolder: fsState.toggleFolder,
    handleStorageUpload: fsState.handleStorageUpload,
    handleTermuxFileUpload: fsState.handleTermuxFileUpload,

    // Node Bridge Handlers
    handleTermuxImport,
    terminalOutput: terminal.terminalOutput,
    termInput: terminal.termInput,
    setTermInput: terminal.setTermInput,
    termSuggestion: terminal.termSuggestion,
    setTermSuggestion: terminal.setTermSuggestion,
    termSuggestions: terminal.termSuggestions,
    setTermSuggestions: terminal.setTermSuggestions,
    selectedSuggestionIndex: terminal.selectedSuggestionIndex,
    terminal,
    handleTerminalCommand: terminalState.handleTerminalCommand,
    handleTermInputChange: terminalState.handleTermInputChange,
    handleTermKeyDown: terminalState.handleTermKeyDown,

    // Swarm Handlers
    triggerSwarmCycle: async () => {
      await swarm.triggerSwarmCycle(activePersonality.name, setIsAiProcessing);
    },

    // Extra UI / Parameters
    cursorLine: editorState.cursorLine,
    setCursorLine: editorState.setCursorLine,
    editorAssistantInput: editorState.editorAssistantInput,
    setEditorAssistantInput: editorState.setEditorAssistantInput,
    editorAssistantMessages: editorState.editorAssistantMessages,
    setEditorAssistantMessages: editorState.setEditorAssistantMessages,
    isScanningCode: editorState.isScanningCode,
    scanResults: editorState.scanResults,
    isRunningCode: editorState.isRunningCode,
    setIsRunningCode: editorState.setIsRunningCode,
    isLivePreviewEnabled: editorState.isLivePreviewEnabled,
    setIsLivePreviewEnabled: editorState.setIsLivePreviewEnabled,
    isInspectorActive: editorState.isInspectorActive,
    setIsInspectorActive: editorState.setIsInspectorActive,
    isPairProgrammerActive: editorState.isPairProgrammerActive,
    setIsPairProgrammerActive: editorState.setIsPairProgrammerActive,
    tnKnowledgePacks,
    setTnKnowledgePacks,
    sdParams,
    setSdParams,
    negativePrompt,
    setNegativePrompt,
    studioInput,
    setStudioInput,
    chatSummary,
    setChatSummary,
    validationErrors,
    validateProjectSettings
  };

  return (
    <AppProvider value={contextValue}>
      <div
        className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#050101] text-[#00ff00] font-sans selection:bg-red-900/40 overflow-hidden"
        style={{ opacity: 1, visibility: 'visible', display: 'flex' }}
      >
        {/* φ Pulse Column — fixed right edge, doesn't affect layout */}
        <div
          className="phi-grid phi-grid__pulse fixed right-0 top-0 bottom-0 w-[3px] md:w-[4px] z-50 pointer-events-none"
          aria-hidden="true"
        />

        {/* Sidebar Navigation - Hidden on mobile */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Bottom Navigation - Visible only on mobile */}
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Interface */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#0a0a0c] pb-14 md:pb-0 overflow-hidden">
          <MainHeader
            activeTab={activeTab}
            setIsMobileFileTreeOpen={editorState.setIsMobileFileTreeOpen}
            setWorkerSheetOpen={setWorkerSheetOpen}
            ollamaStatus={ollamaStatus}
            workers={workers}
            setWorkers={setWorkers}
            availableModels={availableModels}
            refreshOllamaModels={refreshOllamaModels}
            personalities={personalities}
            setPersonalities={setPersonalities}
            activePersonality={activePersonality}
            termuxStatus={termuxStatus}
          />

          <div className="flex-1 min-h-0 flex flex-col relative">
            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(185,28,28,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(185,28,28,0.2)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Panel Router */}
            {activeTab === 'toolneuron' && (
              <ToolNeuronPanel
                chatMessages={chatMessages}
                studioInput={studioInput}
                setStudioInput={setStudioInput}
                handleStudioSubmit={chatState.handleStudioSubmit}
                isVaultUnlocked={isVaultUnlocked}
                setIsVaultUnlocked={setIsVaultUnlocked}
                swarmAnxiety={swarm.swarmAnxiety}
                swarmAgents={swarm.swarmAgents}
                swarmLogs={swarm.swarmLogs}
                triggerSwarmCycle={async () => {
                  await swarm.triggerSwarmCycle(activePersonality.name, setIsAiProcessing);
                }}
                isAiProcessing={isAiProcessing}
                debugAnalysis={analysisState.debugAnalysis}
                runStaticAnalysis={analysisState.runStaticAnalysis}
                runDynamicTracing={analysisState.runDynamicTracing}
                getRefactoringSuggestions={analysisState.getRefactoringSuggestions}
                activePersonality={activePersonality}
                tnKnowledgePacks={tnKnowledgePacks}
                handleKnowledgeUpload={handleKnowledgeUpload}
                setActiveTab={setActiveTab}
                onApplyCode={(code, mode) => {
                  if (mode === 'refactor') {
                    forgeState.handleApplyRefactor(code, false, null);
                  } else {
                    forgeState.handleApplyForge(code, false);
                  }
                  setActiveTab('editor');
                }}
                onSaveReport={(text) => {
                  forgeState.handleSaveAnalysis(text);
                  setActiveTab('editor');
                }}
              />
            )}

            {activeTab === 'terminal' && (
              <TerminalPanel
                terminalOutput={terminal.terminalOutput}
                isAiProcessing={isAiProcessing}
                activePersonality={activePersonality}
                termInput={terminal.termInput}
                setTermInput={terminal.setTermInput}
                termSuggestion={terminal.termSuggestion}
                setTermSuggestion={terminal.setTermSuggestion}
                termSuggestions={terminal.termSuggestions}
                setTermSuggestions={terminal.setTermSuggestions}
                selectedSuggestionIndex={terminal.selectedSuggestionIndex}
                handleTermInputChange={terminalState.handleTermInputChange}
                handleTermKeyDown={terminalState.handleTermKeyDown}
                handleTerminalCommand={terminalState.handleTerminalCommand}
                realCwd={terminal.realCwd}
              />
            )}

            {activeTab === 'editor' && (
              <EditorPanel
                projectFiles={fsState.projectFiles}
                activeFileId={fsState.activeFileId}
                setProjectFiles={fsState.setProjectFiles}
                handleFileSwitch={fsState.handleFileSwitch}
                handleFileUpload={fsState.handleFileUpload}
                editorContent={editorState.editorContent}
                setEditorContent={(v: string) => {
                  editorState.setEditorContent(v);
                  if (fsState.activeFileId) fsState.markFileDirty(fsState.activeFileId);
                }}
                editorLanguage={fsState.editorLanguage}
                setEditorLanguage={fsState.setEditorLanguage}
                editorOutput={editorOutput}
                setEditorOutput={setEditorOutput}
                editorMode={editorState.editorMode}
                setEditorMode={editorState.setEditorMode}
                theme={theme}
                debouncedEditorContent={editorState.debouncedEditorContent}
                isRunningCode={editorState.isRunningCode}
                isScanningCode={editorState.isScanningCode}
                scanResults={editorState.scanResults}
                handleRunCode={analysisState.handleRunCode}
                handleScanCode={analysisState.handleScanCode}
                lastSavedTime={editorState.lastSavedTime}
                forceSave={editorState.forceSave}
                saveToFile={editorState.saveToFile}
                isLivePreviewEnabled={editorState.isLivePreviewEnabled}
                setIsLivePreviewEnabled={editorState.setIsLivePreviewEnabled}
                isInspectorActive={editorState.isInspectorActive}
                setIsInspectorActive={editorState.setIsInspectorActive}
                inspectedElement={editorState.inspectedElement}
                setInspectedElement={editorState.setInspectedElement}
                inspectedElementRef={editorState.inspectedElementRef}
                previewContainerRef={editorState.previewContainerRef}
                handleInspectMouseMove={inspectorState.handleInspectMouseMove}
                handleInspectClick={inspectorState.handleInspectClick}
                handleStyleChange={inspectorState.handleStyleChange}
                isPairProgrammerActive={editorState.isPairProgrammerActive}
                setIsPairProgrammerActive={editorState.setIsPairProgrammerActive}
                isEditorAssistantOpen={editorState.isEditorAssistantOpen}
                setIsEditorAssistantOpen={editorState.setIsEditorAssistantOpen}
                editorAssistantMessages={editorState.editorAssistantMessages}
                editorAssistantInput={editorState.editorAssistantInput}
                setEditorAssistantInput={editorState.setEditorAssistantInput}
                handleEditorAssistantSubmit={chatState.handleEditorAssistantSubmit}
                handleCodeReview={chatState.handleCodeReview}
                handleSaveAnalysis={forgeState.handleSaveAnalysis}
                handleApplyDocumentation={chatState.handleApplyDocumentation}
                handleApplyRefactor={forgeState.handleApplyRefactor}
                handleApplyForge={forgeState.handleApplyForge}
                isAiProcessing={isAiProcessing}
                lastEditorAssistantPrompt={chatState.lastEditorAssistantPrompt}
                handleExplainCode={chatState.handleExplainCode}
                handleFullProjectAnalysis={analysisState.handleFullProjectAnalysis}
                handleDeepProjectAudit={analysisState.handleDeepProjectAudit}
                handleGenerateDocs={debuggerState.handleToggleCurrentLineBreakpoint /* Dummy JSDoc wrapper placeholder stub */}
                handleFormatCode={forgeState.handleFormatCode}
                handleRefactorCode={forgeState.handleRefactorCode}
                handleRefactorAllFiles={forgeState.handleRefactorAllFiles}
                handleReviewCode={chatState.handleReviewCode}
                handleAnalyzeData={chatState.handleAnalyzeData}
                handleGenerateCode={forgeState.handleGenerateCode}
                breakpoints={debuggerLogic.breakpoints}
                cursorLine={editorState.cursorLine}
                debugState={debuggerLogic.debugState}
                debugRefactorResult={debuggerLogic.debugRefactorResult}
                setDebugRefactorResult={debuggerLogic.setDebugRefactorResult}
                handleToggleCurrentLineBreakpoint={debuggerState.handleToggleCurrentLineBreakpoint}
                handleStartDebug={debuggerState.handleStartDebug}
                handleStopDebug={debuggerState.handleStopDebug}
                handleStep={debuggerState.handleStep}
                handleDebugRefactor={debuggerState.handleDebugRefactor}
                handleApplyDebugRefactor={debuggerState.handleApplyDebugRefactor}
                handleEditorDidMount={editorState.handleEditorDidMount}
                gitRepo={gitState.gitRepo}
                setGitRepo={gitState.setGitRepo}
                handleGitInit={gitState.handleGitInit}
                handleGitPull={handleGitPull}
                handleGitPush={() => gitState.handleGitPush(setIsAiProcessing)}
                handleGitStash={() => {
                  gitState.setGitRepo((prev: any) => ({ ...prev, stash: [...prev.stash, prev.modified] }));
                  setEditorOutput((prev: string) => prev + '[GIT] Stashed modifications.\n');
                }}
                handleGitPop={() => {
                  gitState.setGitRepo((prev: any) => {
                    if (prev.stash.length === 0) return prev;
                    return { ...prev, stash: prev.stash.slice(0, -1), modified: [...new Set([...prev.modified, ...prev.stash[prev.stash.length - 1]])] };
                  });
                  setEditorOutput((prev: string) => prev + '[GIT] Popped stash.\n');
                }}
                handleGitSaveAll={handleGitSaveAll}
                handleGitCommit={handleGitCommit}
                handleGitStage={gitState.handleGitStage}
                handleGitStageAll={gitState.handleGitStageAll}
                handleGitUnstage={gitState.handleGitUnstage}
                projectSettings={projectSettings}
                setProjectSettings={setProjectSettings}
                validateProjectSettings={validateProjectSettings}
                validationErrors={validationErrors}
                ollamaStatus={ollamaStatus}
                refreshOllamaModels={refreshOllamaModels}
                isMobileFileTreeOpen={editorState.isMobileFileTreeOpen}
                setIsMobileFileTreeOpen={editorState.setIsMobileFileTreeOpen}
                setIsGenerateModalOpen={forgeState.setIsGenerateModalOpen}
                setIsTemplateModalOpen={setIsTemplateModalOpen}
                swarmAnxiety={swarm.swarmAnxiety}
                setTerminalOutput={terminal.setTerminalOutput}
              />
            )}

            {activeTab === 'analysis' && (
              <AnalysisPanel
                editorContent={editorState.editorContent}
                editorOutput={editorOutput}
                isAiProcessing={isAiProcessing}
                editorAssistantInput={editorState.editorAssistantInput}
                setEditorAssistantInput={editorState.setEditorAssistantInput}
                handleAnalyzeCode={analysisState.handleAnalyzeCode}
                projectFiles={fsState.projectFiles}
                activeFileId={fsState.activeFileId}
              />
            )}

            {activeTab === 'termux' && (
              <NodeBridgePanel
                termuxFiles={termuxFiles}
                setTermuxFiles={setTermuxFiles}
                setTermuxStatus={setTermuxStatus}
                handleTermuxFileUpload={fsState.handleTermuxFileUpload}
                onImportFile={handleTermuxImport}
              />
            )}

            {activeTab === 'storage' && (
              <StoragePanel
                storageFiles={storageFiles}
                setStorageFiles={setStorageFiles}
                handleStorageUpload={fsState.handleStorageUpload}
              />
            )}

            {activeTab === 'brain' && <BrainPanel />}

            {activeTab === 'settings' && (
              <SettingsPanel
                theme={theme}
                toggleTheme={toggleTheme}
                personalities={personalities}
                setPersonalities={setPersonalities}
                grokApiKey={grokApiKey}
                setGrokApiKey={setGrokApiKey}
                geminiApiKey={geminiApiKey}
                setGeminiApiKey={setGeminiApiKey}
                openrouterApiKey={openrouterApiKey}
                setOpenrouterApiKey={setOpenrouterApiKey}
                brainConfig={brainConfig}
                setBrainConfig={setBrainConfig}
                brainRefFile={brainRefFile}
                setBrainRefFile={setBrainRefFile}
                isAiProcessing={isAiProcessing}
                setIsAiProcessing={setIsAiProcessing}
                setTerminalOutput={terminal.setTerminalOutput}
                setActiveTab={setActiveTab}
                generateAIResponse={generateAIResponse}
                activePersonality={activePersonality}
              />
            )}
          </div>
        </main>

        {/* Commit Modal */}
        <CommitModal
          isCommitModalOpen={isCommitModalOpen}
          setIsCommitModalOpen={setIsCommitModalOpen}
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          confirmGitCommit={confirmGitCommit}
          stagedFilesCount={gitState.gitRepo.staged.length}
        />

        {/* Delete Confirm Modal */}
        {fsState.deleteConfirmId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-[#0d0404] border border-red-900/30 rounded-[30px] shadow-[0_0_60px_rgba(185,28,28,0.2)] overflow-hidden">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-black text-red-100 uppercase tracking-tighter">Delete Item?</h3>
                <p className="text-sm text-red-100/60">This will permanently remove the item and all its contents. This cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => fsState.confirmDeleteItem(fsState.deleteConfirmId!)}
                    className="flex-1 py-3 bg-red-800 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => fsState.setDeleteConfirmId(null)}
                    className="flex-1 py-3 bg-transparent border border-red-900/30 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-950/30 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Modal */}
        <TemplateModal
          isTemplateModalOpen={isTemplateModalOpen}
          setIsTemplateModalOpen={setIsTemplateModalOpen}
          handleLoadTemplate={forgeState.handleLoadTemplate}
        />

        {/* Template Confirm Modal */}
        {forgeState.templateConfirmKey && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-[#0d0404] border border-red-900/30 rounded-[30px] shadow-[0_0_60px_rgba(185,28,28,0.2)] overflow-hidden">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-black text-red-100 uppercase tracking-tighter">Load Template?</h3>
                <p className="text-sm text-red-100/60">
                  Loading <span className="text-red-400 font-bold">"{PROJECT_TEMPLATES[forgeState.templateConfirmKey].name}"</span> will overwrite your current project.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={forgeState.confirmLoadTemplate}
                    className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Load Template
                  </button>
                  <button
                    onClick={() => forgeState.setTemplateConfirmKey(null)}
                    className="flex-1 py-3 bg-transparent border border-red-900/30 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-950/30 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post Commit Sync Modal */}
        {postCommitModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#0d0404] border border-red-900/30 rounded-[30px] shadow-[0_0_100px_rgba(185,28,28,0.2)] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-red-900/20 bg-black/40 flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-red-100 uppercase tracking-tighter">
                    Commit Successful
                  </h3>
                  <p className="text-[10px] text-red-900 font-bold tracking-widest uppercase">
                    Local state synchronized
                  </p>
                </div>
                <button
                  onClick={() => setPostCommitModalOpen(false)}
                  className="p-2 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all shrink-0 ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-red-100/70">
                  Would you like to synchronize your changes with the remote neural uplink?
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setPostCommitModalOpen(false);
                      gitState.handleGitPush(setIsAiProcessing);
                    }}
                    className="w-full px-6 py-4 bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Push Changes
                  </button>
                  <button
                    onClick={() => {
                      setPostCommitModalOpen(false);
                      handleGitPull();
                    }}
                    className="w-full px-6 py-4 bg-[#0a0202] text-red-400 border border-red-900/50 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-950/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Pull Changes
                  </button>
                  <button
                    onClick={() => setPostCommitModalOpen(false)}
                    className="w-full px-6 py-4 bg-transparent text-red-600/50 rounded-xl font-black text-xs uppercase tracking-widest hover:text-red-500 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Modal */}
        <GenerateModal
          isGenerateModalOpen={forgeState.isGenerateModalOpen}
          setIsGenerateModalOpen={forgeState.setIsGenerateModalOpen}
          generateMode={forgeState.generateMode}
          setGenerateMode={forgeState.setGenerateMode}
          generatePrompt={forgeState.generatePrompt}
          setGeneratePrompt={forgeState.setGeneratePrompt}
          executeGenerateCode={forgeState.executeGenerateCode}
          isAiProcessing={isAiProcessing}
        />

        {/* Worker Config Bottom Sheet — mobile only */}
        {workerSheetOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setWorkerSheetOpen(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
              className="relative bg-[#0a0202] border-t border-red-900/40 rounded-t-3xl p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                  <h3 className="text-sm font-black text-red-100 uppercase tracking-widest">Neural Workers</h3>
                  <p className="text-[10px] text-red-700 mt-0.5">{availableModels.length} Ollama models available</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => refreshOllamaModels()}
                    className={`text-xs font-black px-3 py-1 rounded-full border transition-all ${ollamaStatus === 'connected' ? 'text-green-400 border-green-800/40 bg-green-950/20' : ollamaStatus === 'connecting' ? 'text-yellow-400 border-yellow-800/40 animate-pulse' : 'text-red-500 border-red-900/40 bg-red-950/20'}`}
                  >
                    ↻ {ollamaStatus}
                  </button>
                  <button onClick={() => setWorkerSheetOpen(false)} className="text-red-700 hover:text-red-400 text-lg leading-none">
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {availableModels.length === 0 && ollamaStatus !== 'connecting' && (
                  <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4 space-y-2">
                    <p className="text-xs font-black text-red-500 uppercase tracking-widest">Ollama Not Connected</p>
                    {ollamaStatus === 'error' && (
                      <p className="text-[11px] text-red-300 font-mono bg-black/40 rounded-lg px-3 py-2 break-all">
                        Connection failed. Check Ollama server.
                      </p>
                    )}
                    <button
                      onClick={() => refreshOllamaModels()}
                      className="w-full mt-1 px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-black uppercase tracking-widest"
                    >
                      ↻ Retry
                    </button>
                  </div>
                )}
                {workers.map((w) => (
                  <div
                    key={w.id}
                    className={`rounded-2xl border p-4 space-y-3 transition-all ${w.enabled ? 'bg-red-950/20 border-red-800/40' : 'bg-red-950/5 border-red-900/20 opacity-60'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-red-300 uppercase tracking-widest">Worker {w.id}</span>
                        {w.enabled && w.model && (
                          <p className="text-[10px] text-red-500 font-mono mt-0.5 truncate">{w.model}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setWorkers((prev) => prev.map((x) => (x.id === w.id ? { ...x, enabled: !x.enabled } : x)))}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${w.enabled ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]' : 'bg-red-900/30 text-red-700'}`}
                      >
                        {w.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div>
                      <p className="text-[9px] text-red-700 uppercase tracking-widest mb-1 font-black">Provider</p>
                      <select
                        value={w.provider}
                        onChange={(e) =>
                          setWorkers((prev) =>
                            prev.map((x) =>
                              x.id === w.id
                                ? {
                                    ...x,
                                    provider: e.target.value as any,
                                    model: e.target.value === 'google' ? 'gemini-2.5-flash' : e.target.value === 'grok' ? 'grok-beta' : e.target.value === 'openrouter' ? 'meta-llama/llama-3.3-70b-instruct:free' : x.model || 'llama3.2:latest',
                                  }
                                : x
                            )
                          )
                        }
                        disabled={!w.enabled}
                        className="w-full bg-black/60 border border-red-900/30 rounded-xl px-4 py-3 text-sm text-red-100 font-mono outline-none focus:border-red-600/60 transition-all disabled:opacity-40"
                      >
                        <option value="ollama" className="bg-[#0a0202]">Ollama</option>
                        <option value="google" className="bg-[#0a0202]">Google Gemini</option>
                        <option value="grok" className="bg-[#0a0202]">xAI Grok</option>
                        <option value="openrouter" className="bg-[#0a0202]">OpenRouter</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-[9px] text-red-700 uppercase tracking-widest mb-1 font-black">Model</p>
                      <select
                        value={w.model}
                        onChange={(e) => setWorkers((prev) => prev.map((x) => (x.id === w.id ? { ...x, model: e.target.value } : x)))}
                        disabled={!w.enabled}
                        className="w-full bg-black/60 border border-red-900/30 rounded-xl px-4 py-3 text-sm text-red-100 font-mono outline-none focus:border-red-600/60 transition-all disabled:opacity-40"
                      >
                        {w.provider === 'ollama' && availableModels.length > 0
                          ? availableModels.map((m) => <option key={m} value={m} className="bg-[#0a0202]">{m}</option>)
                          : w.provider === 'google'
                            ? ['gemini-2.5-flash', 'gemini-2.5-pro'].map((m) => <option key={m} value={m} className="bg-[#0a0202]">{m}</option>)
                            : w.provider === 'grok'
                              ? ['grok-beta', 'grok-2-latest'].map((m) => <option key={m} value={m} className="bg-[#0a0202]">{m}</option>)
                              : w.provider === 'openrouter'
                                ? ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat', 'google/gemini-2.5-flash', 'meta-llama/llama-3-8b-instruct:free'].map((m) => <option key={m} value={m} className="bg-[#0a0202]">{m}</option>)
                                : <option value={w.model} className="bg-[#0a0202]">{w.model}</option>}
                      </select>
                    </div>
                    <div>
                      <p className="text-[9px] text-red-700 uppercase tracking-widest mb-1 font-black">Agent Role</p>
                      <select
                        value={w.agentId || ''}
                        onChange={(e) => setWorkers((prev) => prev.map((x) => (x.id === w.id ? { ...x, agentId: e.target.value || undefined } : x)))}
                        disabled={!w.enabled}
                        className="w-full bg-black/60 border border-red-900/30 rounded-xl px-4 py-3 text-sm text-red-300 font-mono outline-none focus:border-red-600/60 transition-all disabled:opacity-40"
                      >
                        <option value="" className="bg-[#0a0202]">🤖 General (no role)</option>
                        {AGENT_DOMAINS.map((domain) => (
                          <optgroup key={domain} label={domain} className="bg-[#0a0202]">
                            {getAgentsByDomain(domain).map((a) => (
                              <option key={a.id} value={a.id} className="bg-[#0a0202]">
                                {a.emoji} {a.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppProvider>
  );
}
