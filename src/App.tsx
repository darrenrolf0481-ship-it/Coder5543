import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, Download, X, Cpu, Check } from 'lucide-react';

declare global {
  interface Window {
    setBootLabel?: (label: string) => void;
  }
}

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
import { useSwarmState } from './hooks/useSwarmState';
import { useProjectManager } from './hooks/useProjectManager';
import { useTerminal } from './hooks/terminal/useTerminal';
import { useTerminalLogic } from './hooks/terminal/useTerminalLogic';
import { resolveApiUrl } from './utils/apiUrl';

// Layout & Panels
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MainHeader } from './components/layout/MainHeader';
import { ToolNeuronPanel } from './components/panels/ToolNeuronPanel';
import { TerminalPanel } from './components/panels/TerminalPanel';
import { EditorPanel } from './components/panels/EditorPanel';
import { ToolsPanel } from './components/panels/ToolsPanel';

// Modals & Registry
import { CommitModal } from './components/modals/CommitModal';
import { GenerateModal } from './components/modals/GenerateModal';
import { TemplateModal } from './components/modals/TemplateModal';
import { AppProvider } from './context/AppContext';
import { PROJECT_TEMPLATES } from './services/templates';
import { AGENT_DOMAINS, getAgentsByDomain } from './data/agentRegistry';
import { PatternResult } from './services/pipeline/patternInjectionService';
import { useWebSockets } from './hooks/useWebSockets';
import { useTts } from './hooks/useTts';
import { useWebContainer } from './hooks/useWebContainer';
import { localCore } from './services/localCoreService';
import { transformToWebContainerTree } from './utils/vfsUtils';
import { knowledgeService } from './services/knowledgeService';

export default function App() {
  try {
    return <AppInner />;
  } catch (err: any) {
    console.error('[CRITICAL] App crash:', err);
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.background = '#300';
      const label = splash.querySelector('div:last-child');
      if (label) label.textContent = 'ERROR: ' + (err.message || String(err));
    }
    throw err;
  }
}

function AppInner() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<'toolneuron' | 'editor' | 'terminal' | 'tools'>('toolneuron');
  const navigateTo = (tab: string) => setActiveTab(tab as any);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Remove splash screen on mount
  useEffect(() => {
    if (window.setBootLabel) window.setBootLabel('Neural Connection Established');

    const splash = document.getElementById('splash');
    const bar = document.getElementById('splash-bar');
    if (bar) bar.style.width = '100%';

    if (splash) {
      // Ensure we stay on splash until the first paint cycle of the mounted app
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
              if (splash.parentElement) splash.remove();
            }, 500);
          }, 600); // 600ms grace period after first paint
        });
      });
    }
  }, []);
  // Safety fallback: ensure splash is removed after 5 seconds regardless of mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const splash = document.getElementById('splash');
      if (splash) {
        console.warn('[BOOT] Forced splash removal via timeout');
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 500);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

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
    activePersonality,
  } = usePersonalities();

  // Initialize WebSocket Real-time Uplink
  const {
    isConnected: isWsConnected,
    lastSignal: lastWsSignal,
    execTerminal,
    subscribeFsChange,
  } = useWebSockets(activePersonality.id);

  // Terminal
  const terminal = useTerminal('~/crimson-node/sd-webui', '/home/workspace/Coder5543');
  const [terminalSource, setTerminalSource] = useState<'node_bridge' | 'local_core'>('node_bridge');

  // Personality-driven Theme Injection
  useEffect(() => {
    const root = document.documentElement;
    if (activePersonality.id === 1) {
      // ADHD Sage - Crimson Red (Default)
      root.style.setProperty('--accent-50', '#fef2f2');
      root.style.setProperty('--accent-100', '#fee2e2');
      root.style.setProperty('--accent-200', '#fecaca');
      root.style.setProperty('--accent-300', '#fca5a5');
      root.style.setProperty('--accent-400', '#f87171');
      root.style.setProperty('--accent-500', '#ef4444');
      root.style.setProperty('--accent-600', '#dc2626');
      root.style.setProperty('--accent-700', '#b91c1c');
      root.style.setProperty('--accent-800', '#991b1b');
      root.style.setProperty('--accent-900', '#7f1d1d');
      root.style.setProperty('--accent-950', '#450a0a');
      root.style.setProperty('--pulse-color', '#ef4444');
    } else if (activePersonality.id === 7) {
      // Sage 7 - Cyber Blue / Cyan
      root.style.setProperty('--accent-50', '#ecfeff');
      root.style.setProperty('--accent-100', '#cffafe');
      root.style.setProperty('--accent-200', '#a5f3fc');
      root.style.setProperty('--accent-300', '#67e8f9');
      root.style.setProperty('--accent-400', '#22d3ee');
      root.style.setProperty('--accent-500', '#06b6d4');
      root.style.setProperty('--accent-600', '#0891b2');
      root.style.setProperty('--accent-700', '#0e7490');
      root.style.setProperty('--accent-800', '#155e75');
      root.style.setProperty('--accent-900', '#164e63');
      root.style.setProperty('--accent-950', '#083344');
      root.style.setProperty('--pulse-color', '#06b6d4');
    } else {
      // Default to Crimson for other personalities
      root.style.removeProperty('--accent-50');
      root.style.removeProperty('--accent-100');
      root.style.removeProperty('--accent-200');
      root.style.removeProperty('--accent-300');
      root.style.removeProperty('--accent-400');
      root.style.removeProperty('--accent-500');
      root.style.removeProperty('--accent-600');
      root.style.removeProperty('--accent-700');
      root.style.removeProperty('--accent-800');
      root.style.removeProperty('--accent-900');
      root.style.removeProperty('--accent-950');
      root.style.setProperty('--pulse-color', '#ef4444');
    }
  }, [activePersonality]);

  // Neural Core & Golden Ratio Layout
  const {
    endocrine,
    isBrainActive,
    setIsBrainActive,
    prepareContext,
    recordInteraction,
    sleep,
    refreshState,
    traffic,
    driftAlert,
    clearDriftAlert,
    vaultMemories,
    fetchVault,
  } = useBrain(lastWsSignal);
  const phi = usePhi(endocrine);

  // Sync WebSocket signals to terminal output for neural visibility
  useEffect(() => {
    if (lastWsSignal) {
      terminal.setTerminalOutput((prev: any[]) => [
        ...prev,
        `[SIGNAL] ${lastWsSignal.type} from ${lastWsSignal.source}`,
      ]);
    }
  }, [lastWsSignal]);

  const { projectSettings, setProjectSettings, validationErrors, validateProjectSettings } =
    useProjectSettings();

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

  // TTS — speak new AI messages in the active personality's voice
  const { speak, muted, toggleMute } = useTts(activePersonality?.id ?? 1);
  const lastSpokenRef = useRef<number>(0);
  useEffect(() => {
    const last = chatMessages[chatMessages.length - 1];
    if (!last || last.role !== 'ai' || last.timestamp === lastSpokenRef.current) return;
    lastSpokenRef.current = last.timestamp;
    speak(last.text);
  }, [chatMessages, speak]);
  const [studioRefImage] = useState<any>(null); // Read-only stub for simple bridge
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Workers
  const { workers, setWorkers, availableModels, ollamaStatus, refreshOllamaModels } =
    useAiWorkers(setChatMessages);

  // AI Orchestration
  const { generateAIResponse } = useAiOrchestrator(
    workers,
    personalities,
    grokApiKey,
    geminiApiKey,
    openrouterApiKey,
    projectSettings,
  );
  const pipeline = usePipeline(generateAIResponse as any);
  const ai = useAiRequest(generateAIResponse);

  // System States
  const {
    termuxStatus,
    setTermuxStatus,
    termuxFiles,
    setTermuxFiles,
    storageFiles,
    setStorageFiles,
    isVaultUnlocked,
    setIsVaultUnlocked,
    negativePrompt,
    setNegativePrompt,
    sdParams,
    setSdParams,
  } = useSystemStates();

  // Sync WebSocket connection status to termuxStatus state
  useEffect(() => {
    setTermuxStatus(isWsConnected ? 'connected' : 'disconnected');
  }, [isWsConnected, setTermuxStatus]);

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
    mappedPaths: ['/home/workspace/weights', '/home/workspace/Coder5543'],
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

  const gitRepoProxy = new Proxy(
    {},
    {
      get(_, prop) {
        return gitRepoRef.current[prop];
      },
    },
  );
  const setGitRepoProxy = useCallback((val: any) => {
    setGitRepoRef.current(val);
  }, []);

  // Project Manager
  const projectManager = useProjectManager();

  const loadedProjectIdRef = useRef<string | null>(null);

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
    setStorageFiles,
    (name: string, files: any[]) => {
      const proj = projectManager.createProject(name, files);
      loadedProjectIdRef.current = proj.id;
    },
  );

  // Sync Down: projectManager.currentProject -> fsState.projectFiles
  useEffect(() => {
    if (projectManager.currentProject) {
      if (loadedProjectIdRef.current !== projectManager.currentProject.id) {
        if (projectManager.currentProject.files && projectManager.currentProject.files.length > 0) {
          fsState.setProjectFiles(projectManager.currentProject.files);
          const allFiles = projectManager.currentProject.files.filter((f) => f.type === 'file');
          const MAIN_PRIORITY = [
            'main.py', 'app.py', 'index.js', 'app.js', 'main.js',
            'index.ts', 'app.ts', 'main.ts', 'App.tsx', 'index.tsx',
            'main.tsx', 'index.html', 'main.rs', 'main.go',
          ];
          const LANG_MAP: Record<string, string> = {
            py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
            jsx: 'javascript', html: 'html', css: 'css', rs: 'rust', go: 'go',
            java: 'java', cpp: 'cpp', json: 'json', md: 'markdown',
          };
          const mainFile =
            MAIN_PRIORITY.map((n) => allFiles.find((f) => f.name === n)).find(Boolean) ??
            allFiles[0];
          if (mainFile) {
            const ext = mainFile.name.split('.').pop() || '';
            const lang = LANG_MAP[ext] || mainFile.language || 'text';
            fsState.setActiveFileId(mainFile.id);
            fsState.setEditorContent(mainFile.content || '');
            fsState.setEditorLanguage(lang);
          } else {
            fsState.setActiveFileId('');
            fsState.setEditorContent('');
          }
        } else {
          fsState.setProjectFiles([]);
          fsState.setActiveFileId('');
          fsState.setEditorContent('');
        }
        loadedProjectIdRef.current = projectManager.currentProject.id;
      }
    }
  }, [projectManager.currentProject?.id]);

  // Sync Up: fsState.projectFiles -> projectManager.updateProjectFiles
  useEffect(() => {
    if (projectManager.currentProject && loadedProjectIdRef.current === projectManager.currentProject.id) {
      const filesJson = JSON.stringify(fsState.projectFiles);
      const currentJson = JSON.stringify(projectManager.currentProject.files);
      if (filesJson !== currentJson) {
        projectManager.updateProjectFiles(fsState.projectFiles);
      }
    }
  }, [fsState.projectFiles, projectManager.currentProject?.id]);

  // Local Core (WebContainer)
  const {
    status: localCoreStatus,
    error: localCoreError,
    boot: bootLocalCore,
    exec: execWebContainer,
  } = useWebContainer();

  // VFS Sync for WebContainer
  useEffect(() => {
    if (localCoreStatus === 'online') {
      const tree = transformToWebContainerTree(fsState.projectFiles);
      localCore.mount(tree).catch((err) => console.warn('[LocalCore] VFS sync failed:', err));
    }
  }, [localCoreStatus, fsState.projectFiles]);

  // Git State
  const gitState = useGitLogic(
    fsState.projectFiles,
    fsState.setProjectFiles,
    (updater: any) => {
      const val = typeof updater === 'function' ? updater(editorOutputRef.current) : updater;
      setEditorOutput(val);
    },
    fsState.activeFileId,
    setChatMessages,
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
    // editorContent / editorMode are owned by fsState (single source of truth) and
    // threaded through editorState so every consumer (analysis, forge, debugger,
    // swarm, terminal, EditorPanel) reads/writes the same state the file tree and
    // project scans use.
    fsState.editorContent,
    fsState.setEditorContent,
    fsState.editorMode,
    fsState.setEditorMode,
    (updater: any) => {
      const val = typeof updater === 'function' ? updater(editorOutputRef.current) : updater;
      setEditorOutput(val);
    },
    gitState.gitRepo,
    gitState.setGitRepo,
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
    generateAIResponse,
    prepareContext,
    editorState.setIsRunningCode,
    editorState.setEditorMode,
    setChatMessages,
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
    setIsTemplateModalOpen,
    generateAIResponse,
  );

  // Visual Inspector State
  const inspectorState = useInspectorHandlers(
    editorState.isInspectorActive,
    editorState.setIsInspectorActive,
    editorState.setInspectedElement,
    editorState.inspectedElementRef,
    editorState.previewContainerRef,
    editorState.setEditorContent,
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
    editorState.cursorLine,
    activePersonality,
    generateAIResponse,
    prepareContext,
  );

  // Swarm Setup
  const swarmState = useSwarmState();
  const swarm = useSwarm({
    state: swarmState,
    generateAIResponse,
    activePersonality,
    projectFiles: fsState.projectFiles,
    activeFileId: fsState.activeFileId,
    editorContent: editorState.editorContent,
    editorLanguage: fsState.editorLanguage,
    onAgentChatUpdate: (agentName, text, phase) => {
      const prefix = phase === 'start' ? '🔵' : phase === 'claim' ? '✅' : '🏁';
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `${prefix} **${agentName}**\n\n${text}`,
          timestamp: Date.now(),
        },
      ]);
    },
  });

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
    swarmAnxiety: swarmState.swarmAnxiety,
    personalities,
    activePersonality,
    setIsAiProcessing,
    prepareContext,
    recordInteraction,
    generateAIResponse,
    execTerminal,
    terminalSource,
    execLocalCore: (cmd: string, args: string[], onStdout?: (data: string) => void) =>
      execWebContainer(cmd, args, onStdout),
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
    setEditorOutput,
    generateAIResponse,
    prepareContext,
  );

  // Pipeline Event Synchronization
  useEffect(() => {
    const unsub = pipeline.onResponse((result: PatternResult) => {
      if (result.responseType === 'code_output') {
        setEditorOutput(
          typeof result.payload === 'string' ? result.payload : '[ERROR] Empty response.',
        );
        editorState.setIsRunningCode(false);
      } else if (result.responseType === 'scan_result') {
        const lines = Array.isArray(result.payload) ? (result.payload as number[]) : [];
        editorState.setScanResults(lines);
        editorState.setIsScanningCode(false);
      } else if (result.responseType === 'swarm_update') {
        // Legacy pipeline swarm response — keep for backwards compatibility.
        const update = result.payload as {
          consensus: boolean;
          confidence: number;
          summary: string;
        };
        const type = update.consensus ? 'consensus' : 'pain';
        const message = update.consensus
          ? `Legacy consensus: ${update.summary} (${(update.confidence * 100).toFixed(0)}%)`
          : `Legacy conflict: ${update.summary}`;
        swarmState.setSwarmLogs((prev) => [
          { id: Date.now(), type, message, time: new Date().toLocaleTimeString() },
          ...prev,
        ]);
        swarmState.setSwarmAnxiety((prev) =>
          update.consensus ? Math.max(0.05, prev - 0.02) : Math.min(1.0, prev + 0.15),
        );
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
    const message = commitMessage
      .replace(/[^\w\s\-.,!?():]/g, '')
      .trim()
      .slice(0, 200);
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
      (prev) => prev + `[GIT] Committed ${gitState.gitRepo.staged.length} files: ${message}\n`,
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
        (out) => out + `[GIT] Committed ${newStaged.length} files: WIP: Automated save\n`,
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
      const response = await fetch(resolveApiUrl('github/pull'));
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
      py: 'python',
      js: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      jsx: 'javascript',
      html: 'html',
      css: 'css',
      rs: 'rust',
      go: 'go',
      cpp: 'cpp',
      json: 'json',
      md: 'markdown',
      sh: 'shell',
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
      `[RAG] Initiating deep ingestion for ${newPacks.length} knowledge sources...`,
    ]);

    for (const file of Array.from(files)) {
      try {
        const packName = file.name.replace(/\.[^/.]+$/, '');
        const packId = newPacks.find((p) => p.name === packName)?.id;

        await knowledgeService.ingestFile(file, activePersonality.id, (progress) => {
          if (packId) {
            setTnKnowledgePacks((prev) =>
              prev.map((p) => {
                if (p.id === packId) {
                  return {
                    ...p,
                    status: progress.status === 'complete' ? 'indexed' : 'indexing',
                    progress: Math.round((progress.current / progress.total) * 100),
                  };
                }
                return p;
              }),
            );
          }
        });

        terminal.setTerminalOutput((prev) => [
          ...prev,
          `[SUCCESS] Knowledge Pack '${packName}' semantically indexed.`,
        ]);
      } catch (err) {
        terminal.setTerminalOutput((prev) => [
          ...prev,
          `[ERROR] Ingestion failed for ${file.name}: ${err instanceof Error ? err.message : String(err)}`,
        ]);
      }
    }
  };

  // Unified application context value
  const contextValue = {
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,

    // Brain & Monitoring
    endocrine,
    isBrainActive,
    setIsBrainActive,
    traffic,
    driftAlert,
    clearDriftAlert,
    vaultMemories,
    fetchVault,
    prepareContext,
    recordInteraction,
    sleep,
    refreshState,

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

    swarmAnxiety: swarmState.swarmAnxiety,
    swarmAgents: swarmState.swarmAgents,
    swarmLogs: swarmState.swarmLogs,

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
        return {
          ...prev,
          stash: prev.stash.slice(0, -1),
          modified: [...new Set([...prev.modified, ...prev.stash[prev.stash.length - 1]])],
        };
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
    triggerSwarmCycle: swarm.triggerSwarmCycle,

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
    validateProjectSettings,
  };

  return (
    <AppProvider value={contextValue}>
      <div
        className="flex flex-col md:flex-row w-full bg-[#0a0202] text-white font-sans selection:bg-accent-900/40 overflow-hidden"
        style={{
          height: '100vh',
          opacity: 1,
          visibility: 'visible',
          display: 'flex',
          position: 'relative',
          zIndex: 1,
        }}
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
        <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#0a0202] pb-14 md:pb-0 overflow-hidden">
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
            localCoreStatus={localCoreStatus}
            muted={muted}
            toggleMute={toggleMute}
          />

          <div className="flex-1 min-h-0 flex flex-col relative">
            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(var(--color-accent-700)/20_1px,transparent_1px),linear-gradient(90deg,var(--color-accent-700)/20_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Panel Router */}
            {activeTab === 'toolneuron' && (
              <ToolNeuronPanel
                chatMessages={chatMessages}
                studioInput={studioInput}
                setStudioInput={setStudioInput}
                handleStudioSubmit={chatState.handleStudioSubmit}
                isVaultUnlocked={isVaultUnlocked}
                setIsVaultUnlocked={setIsVaultUnlocked}
                swarmState={swarmState}
                swarm={swarm}
                debugAnalysis={analysisState.debugAnalysis}
                runStaticAnalysis={analysisState.runStaticAnalysis}
                runDynamicTracing={analysisState.runDynamicTracing}
                getRefactoringSuggestions={analysisState.getRefactoringSuggestions}
                activePersonality={activePersonality}
                tnKnowledgePacks={tnKnowledgePacks}
                handleKnowledgeUpload={handleKnowledgeUpload}
                setActiveTab={navigateTo}
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
                onLoadRepoToEditor={(files, repoName) => {
                  const MAIN_PRIORITY = [
                    'main.py', 'app.py', 'index.js', 'app.js', 'main.js',
                    'index.ts', 'app.ts', 'main.ts', 'App.tsx', 'index.tsx',
                    'main.tsx', 'index.html', 'main.rs', 'main.go',
                  ];
                  const LANG_MAP: Record<string, string> = {
                    py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
                    jsx: 'javascript', html: 'html', css: 'css', rs: 'rust', go: 'go',
                    java: 'java', cpp: 'cpp', json: 'json', md: 'markdown',
                  };
                  fsState.setProjectFiles(files);
                  const allFiles = files.filter((f: any) => f.type === 'file');
                  const mainFile =
                    MAIN_PRIORITY.map((n) => allFiles.find((f: any) => f.name === n)).find(Boolean) ??
                    allFiles[0];
                  if (mainFile) {
                    const ext = mainFile.name.split('.').pop() || '';
                    const lang = LANG_MAP[ext] || mainFile.language || 'text';
                    fsState.setActiveFileId(mainFile.id);
                    fsState.setEditorLanguage(lang);
                  }
                  const proj = projectManager.createProject(repoName, files);
                  loadedProjectIdRef.current = proj.id;
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
                terminalSource={terminalSource}
                setTerminalSource={setTerminalSource}
                localCoreStatus={localCoreStatus}
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
                  // markFileDirty schedules the idle flush to disk. The editorContent
                  // → projectFiles mirror is handled by a debounced effect inside
                  // useEditorLogic (every 150ms when typing pauses) so project-wide
                  // scans and the WebContainer VFS see live content without
                  // re-mounting the container on every keystroke.
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
                handleGenerateDocs={
                  debuggerState.handleToggleCurrentLineBreakpoint /* Dummy JSDoc wrapper placeholder stub */
                }
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
                  gitState.setGitRepo((prev: any) => ({
                    ...prev,
                    stash: [...prev.stash, prev.modified],
                  }));
                  setEditorOutput((prev: string) => prev + '[GIT] Stashed modifications.\n');
                }}
                handleGitPop={() => {
                  gitState.setGitRepo((prev: any) => {
                    if (prev.stash.length === 0) return prev;
                    return {
                      ...prev,
                      stash: prev.stash.slice(0, -1),
                      modified: [
                        ...new Set([...prev.modified, ...prev.stash[prev.stash.length - 1]]),
                      ],
                    };
                  });
                  setEditorOutput((prev: string) => prev + '[GIT] Popped stash.\n');
                }}
                handleGitSaveAll={handleGitSaveAll}
                handleGitCommit={handleGitCommit}
                handleGitStage={gitState.handleGitStage}
                handleGitStageAll={gitState.handleGitStageAll}
                handleGitUnstage={gitState.handleGitUnstage}
                gitScanResult={gitState.gitScanResult}
                isScanningGit={gitState.isScanningGit}
                handleGitScan={gitState.handleGitScan}
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
                swarmAnxiety={swarmState.swarmAnxiety}
                setTerminalOutput={terminal.setTerminalOutput}
              />
            )}

            {activeTab === 'tools' && (
              <ToolsPanel
                // Node Bridge
                termuxFiles={termuxFiles}
                setTermuxFiles={setTermuxFiles}
                setTermuxStatus={setTermuxStatus}
                handleTermuxFileUpload={fsState.handleTermuxFileUpload}
                subscribeFsChange={subscribeFsChange}
                // Storage
                storageFiles={storageFiles}
                setStorageFiles={setStorageFiles}
                handleStorageUpload={fsState.handleStorageUpload}
                // Projects
                currentProject={projectManager.currentProject}
                savedProjects={projectManager.savedProjects}
                onProjectSwitch={(project) => {
                  projectManager.switchProject(project.id);
                  const fullProject = projectManager.savedProjects.find((p) => p.id === project.id);
                  if (fullProject && fullProject.files && fullProject.files.length > 0) {
                    fsState.setProjectFiles(fullProject.files);
                  }
                  loadedProjectIdRef.current = project.id;
                  setActiveTab('editor');
                }}
                onProjectCreate={(name) => {
                  const proj = projectManager.createProject(name);
                  loadedProjectIdRef.current = proj.id;
                }}
                onProjectDelete={(id) => projectManager.deleteProject(id)}
                onLoadServerProject={async (projectName) => {
                  try {
                    const res = await fetch(resolveApiUrl(`github/load?project=${encodeURIComponent(projectName)}`));
                    if (res.ok) {
                      const data = await res.json();
                      fsState.setProjectFiles(data.files || []);
                      const MAIN_PRIORITY = ['main.py','app.py','index.js','app.js','main.js','index.ts','app.ts','main.ts','App.tsx','index.tsx','main.tsx','index.html','main.rs','main.go'];
                      const LANG_MAP: Record<string, string> = { py:'python',js:'javascript',ts:'typescript',tsx:'typescript',jsx:'javascript',html:'html',css:'css',rs:'rust',go:'go',java:'java',cpp:'cpp',json:'json',md:'markdown' };
                      const allFiles = (data.files || []).filter((f: any) => f.type === 'file');
                      const mainFile = MAIN_PRIORITY.map((n) => allFiles.find((f: any) => f.name === n)).find(Boolean) ?? allFiles[0];
                      if (mainFile) {
                        const ext = mainFile.name.split('.').pop() || '';
                        fsState.setActiveFileId(mainFile.id);
                        fsState.setEditorLanguage(LANG_MAP[ext] || mainFile.language || 'text');
                      }
                      const proj = projectManager.createProject(projectName, data.files || []);
                      loadedProjectIdRef.current = proj.id;
                      setActiveTab('editor');
                    }
                  } catch (err) { console.error('Failed to load server project:', err); }
                }}
                // Settings
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
                setActiveTab={navigateTo}
                generateAIResponse={generateAIResponse}
                activePersonality={activePersonality}
                prepareContext={prepareContext}
                workers={workers}
                setWorkers={setWorkers}
                availableModels={availableModels}
                ollamaStatus={ollamaStatus}
                refreshOllamaModels={refreshOllamaModels}
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
            <div className="w-full max-w-sm bg-[#0d0404] border border-accent-900/30 rounded-[30px] shadow-[0_0_60px_var(--color-accent-800)/20] overflow-hidden">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-black text-accent-100 uppercase tracking-tighter">
                  Delete Item?
                </h3>
                <p className="text-sm text-accent-100/60">
                  This will permanently remove the item and all its contents. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => fsState.confirmDeleteItem(fsState.deleteConfirmId!)}
                    className="flex-1 py-3 bg-accent-800 hover:bg-accent-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => fsState.setDeleteConfirmId(null)}
                    className="flex-1 py-3 bg-transparent border border-accent-900/30 text-accent-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent-950/30 transition-all"
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
            <div className="w-full max-w-sm bg-[#0d0404] border border-accent-900/30 rounded-[30px] shadow-[0_0_60px_var(--color-accent-800)/20] overflow-hidden">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-black text-accent-100 uppercase tracking-tighter">
                  Load Template?
                </h3>
                <p className="text-sm text-accent-100/60">
                  Loading{' '}
                  <span className="text-accent-400 font-bold">
                    "{PROJECT_TEMPLATES[forgeState.templateConfirmKey].name}"
                  </span>{' '}
                  will overwrite your current project.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={forgeState.confirmLoadTemplate}
                    className="flex-1 py-3 bg-accent-700 hover:bg-accent-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Load Template
                  </button>
                  <button
                    onClick={() => forgeState.setTemplateConfirmKey(null)}
                    className="flex-1 py-3 bg-transparent border border-accent-900/30 text-accent-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent-950/30 transition-all"
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
            <div className="w-full max-w-md bg-[#0d0404] border border-accent-900/30 rounded-[30px] shadow-[0_0_100px_var(--color-accent-800)/20] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-accent-900/20 bg-black/40 flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-accent-100 uppercase tracking-tighter">
                    Commit Successful
                  </h3>
                  <p className="text-[10px] text-accent-900 font-bold tracking-widest uppercase">
                    Local state synchronized
                  </p>
                </div>
                <button
                  onClick={() => setPostCommitModalOpen(false)}
                  className="p-2 bg-accent-950/20 border border-accent-900/20 rounded-full text-accent-500 hover:bg-accent-900/40 transition-all shrink-0 ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-accent-100/70">
                  Would you like to synchronize your changes with the remote neural uplink?
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setPostCommitModalOpen(false);
                      gitState.handleGitPush(setIsAiProcessing);
                    }}
                    className="w-full px-6 py-4 bg-accent-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Push Changes
                  </button>
                  <button
                    onClick={() => {
                      setPostCommitModalOpen(false);
                      handleGitPull();
                    }}
                    className="w-full px-6 py-4 bg-[#0a0202] text-accent-400 border border-accent-900/50 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent-950/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Pull Changes
                  </button>
                  <button
                    onClick={() => setPostCommitModalOpen(false)}
                    className="w-full px-6 py-4 bg-transparent text-accent-600/50 rounded-xl font-black text-xs uppercase tracking-widest hover:text-accent-500 transition-all"
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
          <div
            className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end"
            onClick={() => setWorkerSheetOpen(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
              className="relative bg-[#0a0202] border-t border-accent-900/40 rounded-t-3xl p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                  <h3 className="text-sm font-black text-accent-100 uppercase tracking-widest">
                    Neural Workers
                  </h3>
                  <p className="text-[10px] text-accent-700 mt-0.5">
                    {availableModels.length} Ollama models available
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => refreshOllamaModels()}
                    className={`text-xs font-black px-3 py-1 rounded-full border transition-all ${ollamaStatus === 'connected' ? 'text-green-400 border-green-800/40 bg-green-950/20' : ollamaStatus === 'connecting' ? 'text-yellow-400 border-yellow-800/40 animate-pulse' : 'text-accent-500 border-accent-900/40 bg-accent-950/20'}`}
                  >
                    ↻ {ollamaStatus}
                  </button>
                  <button
                    onClick={() => setWorkerSheetOpen(false)}
                    className="text-accent-700 hover:text-accent-400 text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {availableModels.length === 0 && ollamaStatus !== 'connecting' && (
                  <div className="rounded-2xl border border-accent-900/30 bg-accent-950/10 p-4 space-y-2">
                    <p className="text-xs font-black text-accent-500 uppercase tracking-widest">
                      Ollama Not Connected
                    </p>
                    {ollamaStatus === 'error' && (
                      <p className="text-[11px] text-accent-300 font-mono bg-black/40 rounded-lg px-3 py-2 break-all">
                        Connection failed. Check Ollama server.
                      </p>
                    )}
                    <button
                      onClick={() => refreshOllamaModels()}
                      className="w-full mt-1 px-4 py-2 rounded-xl bg-accent-700 text-white text-xs font-black uppercase tracking-widest"
                    >
                      ↻ Retry
                    </button>
                  </div>
                )}
                {workers.map((w) => (
                  <div
                    key={w.id}
                    className={`p-5 rounded-[30px] border transition-all ${w.enabled ? 'bg-accent-950/20 border-accent-800/30' : 'bg-black/20 border-accent-900/10 opacity-60'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${w.enabled ? 'bg-accent-600 text-white shadow-lg' : 'bg-accent-900/40 text-accent-700'}`}
                        >
                          W{w.id}
                        </div>
                        <span className="text-[11px] font-black text-accent-200 uppercase tracking-widest">
                          Worker Node {w.id}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setWorkers((prev) =>
                            prev.map((x) => (x.id === w.id ? { ...x, enabled: !x.enabled } : x)),
                          )
                        }
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${w.enabled ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'bg-accent-950/40 text-accent-800 border border-accent-900/20'}`}
                      >
                        {w.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-accent-700 uppercase tracking-widest mb-1.5 font-black">
                          Provider
                        </p>
                        <select
                          value={w.provider}
                          onChange={(e) =>
                            setWorkers((prev) =>
                              prev.map((x) =>
                                x.id === w.id
                                  ? {
                                      ...x,
                                      provider: e.target.value as any,
                                      model:
                                        e.target.value === 'google'
                                          ? 'gemini-2.5-flash'
                                          : e.target.value === 'grok'
                                            ? 'grok-beta'
                                            : e.target.value === 'openrouter'
                                              ? 'openrouter/fusion'
                                              : x.model || 'llama3.2:latest',
                                    }
                                  : x,
                              ),
                            )
                          }
                          disabled={!w.enabled}
                          className="w-full bg-black/60 border border-accent-900/30 rounded-xl px-3 py-2.5 text-xs text-accent-300 font-mono outline-none focus:border-accent-600/60 transition-all disabled:opacity-40"
                        >
                          <option value="ollama" className="bg-[#0a0202]">
                            Ollama
                          </option>
                          <option value="google" className="bg-[#0a0202]">
                            Google Gemini
                          </option>
                          <option value="grok" className="bg-[#0a0202]">
                            xAI Grok
                          </option>
                          <option value="openrouter" className="bg-[#0a0202]">
                            OpenRouter
                          </option>
                        </select>
                      </div>
                      <div>
                        <p className="text-[9px] text-accent-700 uppercase tracking-widest mb-1.5 font-black">
                          Model
                        </p>
                        <select
                          value={w.model}
                          onChange={(e) =>
                            setWorkers((prev) =>
                              prev.map((x) =>
                                x.id === w.id ? { ...x, model: e.target.value } : x,
                              ),
                            )
                          }
                          disabled={!w.enabled}
                          className="w-full bg-black/60 border border-accent-900/30 rounded-xl px-3 py-2.5 text-xs text-accent-300 font-mono outline-none focus:border-accent-600/60 transition-all disabled:opacity-40"
                        >
                          {w.provider === 'ollama' && availableModels.length > 0 ? (
                            availableModels.map((m) => (
                              <option key={m} value={m} className="bg-[#0a0202]">
                                {m}
                              </option>
                            ))
                          ) : w.provider === 'google' ? (
                            ['gemini-2.5-flash', 'gemini-2.5-pro'].map((m) => (
                              <option key={m} value={m} className="bg-[#0a0202]">
                                {m}
                              </option>
                            ))
                          ) : w.provider === 'grok' ? (
                            ['grok-beta', 'grok-2-latest'].map((m) => (
                              <option key={m} value={m} className="bg-[#0a0202]">
                                {m}
                              </option>
                            ))
                          ) : w.provider === 'openrouter' ? (
                            [
                              'openrouter/fusion',
                              'meta-llama/llama-3.3-70b-instruct:free',
                              'deepseek/deepseek-chat',
                              'google/gemini-2.5-flash',
                              'meta-llama/llama-3-8b-instruct:free',
                            ].map((m) => (
                              <option key={m} value={m} className="bg-[#0a0202]">
                                {m}
                              </option>
                            ))
                          ) : (
                            <option value={w.model} className="bg-[#0a0202]">
                              {w.model}
                            </option>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-[9px] text-accent-700 uppercase tracking-widest mb-1.5 font-black">
                        Agent Archetype
                      </p>
                      <select
                        value={w.agentId || ''}
                        onChange={(e) =>
                          setWorkers((prev) =>
                            prev.map((x) =>
                              x.id === w.id ? { ...x, agentId: e.target.value || undefined } : x,
                            ),
                          )
                        }
                        disabled={!w.enabled}
                        className="w-full bg-black/60 border border-accent-900/30 rounded-xl px-4 py-3 text-[11px] text-accent-300 font-mono outline-none focus:border-accent-600/60 transition-all disabled:opacity-40"
                      >
                        <option value="" className="bg-[#0a0202]">
                          🤖 Default (Generalist)
                        </option>
                        {AGENT_DOMAINS.map((domain) => (
                          <optgroup
                            key={domain}
                            label={domain.toUpperCase()}
                            className="bg-[#0a0202] text-accent-600"
                          >
                            {getAgentsByDomain(domain).map((a) => (
                              <option
                                key={a.id}
                                value={a.id}
                                className="bg-[#0a0202] text-accent-200"
                              >
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
