
/// <reference types="vite/client" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import DOMPurify from 'dompurify';
import { 
  Terminal as TerminalIcon, 
  Upload, 
  Smartphone, 
  Settings as SettingsIcon, 
  FolderOpen, 
  Cpu, 
  Send, 
  Activity,
  ChevronRight,
  X,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Zap,
  Download,
  Plus,
  Trash2,
  Brain,
  Code2,
  Database,
  Globe,
  Settings,
  FileSearch,
  BookOpen,
  UserCircle,
  ShieldCheck,
  Sparkles,
  Network,
  Sliders,
  FileCode,
  Gauge,
  HardDrive,
  Power,
  Play,
  HelpCircle,
  Bug,
  StepForward,
  PlayCircle,
  StopCircle,
  Circle,
  Folder,
  Edit2,
  ChevronDown,
  GitBranch,
  BarChart3,
  GitPullRequest,
  GitMerge,
  History,
  Check,
  LayoutTemplate,
  Archive,
  Wand2,
  Fingerprint,
  Unlock,
  Users,
  Save,
  ShieldAlert,
  Copy,
  MousePointer2,
  Info,
  Layout,
  RefreshCw,
  Paintbrush,
  Layers,
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateAIResponse as generateAIResponseService, fetchOllamaModels } from './src/services/aiService';
import Editor from '@monaco-editor/react';

// Initialize AI
const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });

// LocalStorage Key
const STORAGE_KEY = 'crimson_os_prefs';

// Utility to convert file to base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const PROJECT_TEMPLATES = {
  'python-web': {
    name: 'Python Web App',
    files: [
      { id: 'root', name: 'Python_Web_Project', type: 'folder', parentId: null, isOpen: true },
      { id: 'app.py', name: 'app.py', type: 'file', parentId: 'root', language: 'python', content: 'from flask import Flask, render_template\n\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    return render_template("index.html")\n\nif __name__ == "__main__":\n    app.run(debug=True)' },
      { id: 'templates', name: 'templates', type: 'folder', parentId: 'root', isOpen: true },
      { id: 'index.html', name: 'index.html', type: 'file', parentId: 'templates', language: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Neural Web App</title>\n</head>\n<body style="background: #050101; color: #fecaca; font-family: sans-serif; padding: 2rem;">\n    <h1>Neural Interface Active</h1>\n    <p>Welcome to the Crimson OS web portal.</p>\n</body>\n</html>' },
      { id: 'static', name: 'static', type: 'folder', parentId: 'root', isOpen: false },
      { id: 'style.css', name: 'style.css', type: 'file', parentId: 'static', language: 'css', content: 'body { margin: 0; }' }
    ]
  },
  'rust-cli': {
    name: 'Rust CLI Tool',
    files: [
      { id: 'root', name: 'Rust_CLI_Project', type: 'folder', parentId: null, isOpen: true },
      { id: 'src', name: 'src', type: 'folder', parentId: 'root', isOpen: true },
      { id: 'main.rs', name: 'main.rs', type: 'file', parentId: 'src', language: 'rust', content: 'use std::io;\n\nfn main() {\n    println!("Neural CLI Initialized.");\n    println!("Enter command:");\n    let mut input = String::new();\n    io::stdin().read_line(&mut input).unwrap();\n    println!("Executing: {}", input.trim());\n}' },
      { id: 'cargo.toml', name: 'Cargo.toml', type: 'file', parentId: 'root', language: 'toml', content: '[package]\nname = "neural-cli"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]' }
    ]
  },
  'neural-module': {
    name: 'Neural Module',
    files: [
      { id: 'root', name: 'Neural_Module', type: 'folder', parentId: null, isOpen: true },
      { id: 'core.py', name: 'core.py', type: 'file', parentId: 'root', language: 'python', content: 'class NeuralModule:\n    def __init__(self):\n        self.active = True\n\n    def run(self):\n        print("Neural Module Running...")\n\nif __name__ == "__main__":\n    module = NeuralModule()\n    module.run()' },
      { id: 'config.json', name: 'config.json', type: 'file', parentId: 'root', language: 'json', content: '{\n  "module_name": "NeuralCore",\n  "version": "1.0.0",\n  "permissions": ["vault", "vision"]\n}' }
    ]
  }
};

const renderTerminalLine = (line: string) => {
  if (line.startsWith('$ ')) {
    return (
      <>
        <span className="text-red-500 font-black">$ </span>
        <span className="text-red-300 font-bold">{line.substring(2)}</span>
      </>
    );
  }

  if (line.startsWith('NEURAL_LINK:')) {
    return <span className="text-red-500 font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">{line}</span>;
  }
  if (line.startsWith('COMMAND_INTEL:')) {
    return <span className="text-red-400 italic opacity-80">{line}</span>;
  }

  const parts = [];
  let currentIndex = 0;
  
  const regex = /(\[ERROR\]|\[WARN\]|\[INFO\]|\[SYSTEM\]|\[SUCCESS\]|CRIMSON OS|Kernel:|"[^"]*"|'[^']*'|\b\/(?:[\w.-]+\/)*[\w.-]+|\.\/(?:[\w.-]+\/)*[\w.-]+)/g;
  
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > currentIndex) {
      parts.push(<span key={`text-${currentIndex}`} className="text-red-100/60">{line.substring(currentIndex, match.index)}</span>);
    }
    
    const matchedText = match[0];
    let className = "text-red-100/60";
    
    if (matchedText === '[ERROR]') className = "text-red-500 font-black bg-red-950/50 px-1 rounded";
    else if (matchedText === '[WARN]') className = "text-orange-500 font-black bg-orange-950/50 px-1 rounded";
    else if (matchedText === '[INFO]') className = "text-blue-400 font-black bg-blue-950/50 px-1 rounded";
    else if (matchedText === '[SYSTEM]') className = "text-purple-400 font-black bg-purple-950/50 px-1 rounded";
    else if (matchedText === '[SUCCESS]') className = "text-green-400 font-black bg-green-950/50 px-1 rounded";
    else if (matchedText === 'CRIMSON OS' || matchedText === 'Kernel:') className = "text-red-500 font-black tracking-widest";
    else if (matchedText.startsWith('"') || matchedText.startsWith("'")) className = "text-green-400/80";
    else if (matchedText.startsWith('/') || matchedText.startsWith('./')) className = "text-blue-300/80 underline decoration-blue-900/50 underline-offset-2";
    
    parts.push(<span key={`match-${match.index}`} className={className}>{matchedText}</span>);
    currentIndex = regex.lastIndex;
  }
  
  if (currentIndex < line.length) {
    parts.push(<span key={`text-${currentIndex}`} className="text-red-100/60">{line.substring(currentIndex)}</span>);
  }
  
  return parts.length > 0 ? <>{parts}</> : <span className="text-red-100/60">{line}</span>;
};

const App: React.FC = () => {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCustomPersonalityModalOpen, setIsCustomPersonalityModalOpen] = useState(false);
  const [postCommitModalOpen, setPostCommitModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateMode, setGenerateMode] = useState<'snippet' | 'file'>('snippet');
  const [newPersonalityName, setNewPersonalityName] = useState('');
  const [newPersonalityInstruction, setNewPersonalityInstruction] = useState('');
  const [newPersonalitySuggestions, setNewPersonalitySuggestions] = useState('');

  const handleLoadTemplate = (templateKey: keyof typeof PROJECT_TEMPLATES) => {
    const template = PROJECT_TEMPLATES[templateKey];
    if (!template) return;

    if (!confirm(`Loading "${template.name}" will overwrite your current project. Proceed?`)) return;

    setProjectFiles(template.files);
    
    // Find first file to activate
    const firstFile = template.files.find(f => f.type === 'file');
    if (firstFile) {
      setActiveFileId(firstFile.id);
      setEditorContent(firstFile.content || '');
      setEditorLanguage(firstFile.language || 'text');
      setEditorMode(firstFile.language === 'html' ? 'preview' : 'code');
    }

    // Reset Git state
    setGitRepo({
      initialized: false,
      branch: 'main',
      commits: [],
      staged: [],
      modified: [],
      stash: []
    });

    setIsTemplateModalOpen(false);
  };

  // --- PERSISTENT STATE ---
  const [activeTab, setActiveTab] = useState<'terminal' | 'analysis' | 'termux' | 'storage' | 'settings' | 'editor' | 'toolneuron'>('toolneuron');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  
  // ToolNeuron State
  const [tnModule, setTnModule] = useState<'chat' | 'vision' | 'knowledge' | 'vault' | 'swarm' | 'help' | 'debug'>('chat');
  const [tnKnowledgePacks, setTnKnowledgePacks] = useState([
    { id: 1, name: 'Medical_Core_v2', size: '1.2GB', status: 'indexed' },
    { id: 2, name: 'Legal_Archive_2025', size: '850MB', status: 'indexed' }
  ]);

  const [debugAnalysis, setDebugAnalysis] = useState<{
    static: { status: 'idle' | 'running' | 'done', issues: { type: 'error' | 'warning' | 'info', message: string, line?: number }[] },
    tracing: { status: 'idle' | 'running' | 'done', logs: string[] },
    refactoring: { status: 'idle' | 'running' | 'done', suggestions: string[] }
  }>({
    static: { status: 'idle', issues: [] },
    tracing: { status: 'idle', logs: [] },
    refactoring: { status: 'idle', suggestions: [] }
  });

  const runStaticAnalysis = () => {
    setDebugAnalysis(prev => ({ ...prev, static: { ...prev.static, status: 'running' } }));
    setTimeout(() => {
      setDebugAnalysis(prev => ({
        ...prev,
        static: {
          status: 'done',
          issues: [
            { type: 'error', message: 'Unused variable "neural_link_v3" detected in core.py', line: 12 },
            { type: 'warning', message: 'Potential memory leak in async trace loop', line: 45 },
            { type: 'info', message: 'Optimization possible: Use list comprehension for neural vector mapping', line: 89 }
          ]
        }
      }));
    }, 2000);
  };

  const runDynamicTracing = () => {
    setDebugAnalysis(prev => ({ ...prev, tracing: { ...prev.tracing, status: 'running', logs: [] } }));
    const logs = [
      '[TRACE] Initializing Neural Link...',
      '[TRACE] Mapping memory address 0xFA32...',
      '[TRACE] Injecting personality vectors...',
      '[TRACE] Monitoring thread 0x442...',
      '[TRACE] Captured exception in sub-module B',
      '[TRACE] Tracing complete. 0 errors, 1 warning.'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setDebugAnalysis(prev => ({ ...prev, tracing: { ...prev.tracing, logs: [...prev.tracing.logs, logs[i]] } }));
        i++;
      } else {
        clearInterval(interval);
        setDebugAnalysis(prev => ({ ...prev, tracing: { ...prev.tracing, status: 'done' } }));
      }
    }, 500);
  };

  const getRefactoringSuggestions = async () => {
    setDebugAnalysis(prev => ({ ...prev, refactoring: { ...prev.refactoring, status: 'running' } }));
    try {
      const response = await generateAIResponse(
        `As the ${activePersonality.name} personality, provide 3 short, high-impact code refactoring suggestions for a futuristic neural-linked application. Format as a simple list.`,
        activePersonality.instruction,
        { modelType: 'fast' }
      );
      const suggestions = response?.split('\n').filter(s => s.trim()) || [];
      setDebugAnalysis(prev => ({ ...prev, refactoring: { status: 'done', suggestions } }));
    } catch (error) {
      console.warn(error);
      setDebugAnalysis(prev => ({ ...prev, refactoring: { status: 'done', suggestions: ['Error retrieving suggestions. Neural link unstable.'] } }));
    }
  };

  // --- SWARM STATE ---
  const [swarmAnxiety, setSwarmAnxiety] = useState(0.12);
  const [swarmAgents, setSwarmAgents] = useState([
    { id: 'agent_0', name: 'Visual_Cortex', expertise: 'PATTERN_MATCHING', status: 'idle', trust: 1.0 },
    { id: 'agent_1', name: 'Threat_Scanner', expertise: 'THREAT_DETECTION', status: 'active', trust: 0.95 },
    { id: 'agent_2', name: 'Social_Node', expertise: 'SOCIAL_NUANCE', status: 'idle', trust: 0.88 },
    { id: 'agent_3', name: 'Memory_Recall', expertise: 'MEMORY_RECALL', status: 'idle', trust: 1.0 },
    { id: 'agent_4', name: 'Creative_Core', expertise: 'CREATIVE_NOVELTY', status: 'idle', trust: 0.92 },
    { id: 'agent_5', name: 'Safety_Guardian', expertise: 'SAFETY_GUARDIAN', status: 'active', trust: 1.0 },
    { id: 'agent_6', name: 'Context_Engine', expertise: 'PATTERN_MATCHING', status: 'idle', trust: 0.97 },
  ]);
  const [swarmLogs, setSwarmLogs] = useState<{ id: number, type: 'consensus' | 'pain' | 'info', message: string, time: string }[]>([
    { id: 1, type: 'info', message: 'Swarm Consensus Engine Initialized.', time: '08:45:12' },
    { id: 2, type: 'info', message: 'Pain Propagation Protocol Active.', time: '08:45:15' }
  ]);
  
  // Editor State
  const [editorLanguage, setEditorLanguage] = useState('python');
  const [projectFiles, setProjectFiles] = useState<any[]>([
    { id: 'root', name: 'Project', type: 'folder', parentId: null, isOpen: true },
    { id: 'src', name: 'src', type: 'folder', parentId: 'root', isOpen: true },
    { id: 'brain.py', name: 'neural_brain.py', type: 'file', parentId: 'src', language: 'python', content: '# AI Brain Logic\nclass NeuralCore:\n    def __init__(self):\n        self.synapses = 10**12\n\n    def process(self, input_data):\n        return f"Neural processing: {input_data}"\n\ncore = NeuralCore()\nprint(core.process("Initial stimulus"))' },
    { id: 'ui.html', name: 'interface.html', type: 'file', parentId: 'src', language: 'html', content: '<div class="p-8 bg-red-900/20 rounded-3xl border border-red-500/30">\n  <h1 class="text-2xl font-black text-red-500 uppercase">Neural Interface</h1>\n  <p class="text-red-100/60 mt-4">Real-time UI component rendering via Crimson Engine.</p>\n  <button class="mt-8 px-6 py-3 bg-red-700 text-white rounded-xl uppercase font-black text-xs tracking-widest">Activate Core</button>\n</div>' },
    { id: 'logic.rs', name: 'core_logic.rs', type: 'file', parentId: 'src', language: 'rust', content: 'fn main() {\n    let neural_load = 0.85;\n    println!("System load: {}%", neural_load * 100.0);\n}' }
  ]);
  const [activeFileId, setActiveFileId] = useState('brain.py');
  const [editorContent, setEditorContent] = useState(projectFiles[0].content);
  const [debouncedEditorContent, setDebouncedEditorContent] = useState(projectFiles[0].content);
  const [editorOutput, setEditorOutput] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedEditorContent(editorContent);
    }, 300);
    return () => clearTimeout(handler);
  }, [editorContent]);
  const [editorMode, setEditorMode] = useState<'code' | 'preview' | 'debug' | 'git' | 'settings'>('code');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isLivePreviewEnabled, setIsLivePreviewEnabled] = useState(true);
  const [isPairProgrammerActive, setIsPairProgrammerActive] = useState(false);
  const [isMobileFileTreeOpen, setIsMobileFileTreeOpen] = useState(false);
  const [isScanningCode, setIsScanningCode] = useState(false);
  const [scanResults, setScanResults] = useState<number[]>([]);
  const [editorAssistantInput, setEditorAssistantInput] = useState('');
  const [editorAssistantMessages, setEditorAssistantMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [cursorLine, setCursorLine] = useState(1);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string | null } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creatingInId, setCreatingInId] = useState<{ parentId: string | null, type: 'file' | 'folder' } | null>(null);
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [inspectedElement, setInspectedElement] = useState<{
    tagName: string;
    className: string;
    id: string;
    rect: { top: number; left: number; width: number; height: number } | null;
    styles: Record<string, string>;
  } | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const inspectedElementRef = useRef<HTMLElement | null>(null);
  const monacoEditorRef = useRef<any>(null);

  const saveFile = useCallback(() => {
    if (activeFileId) {
      setProjectFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: editorContent } : f));
      setLastSavedTime(new Date().toLocaleTimeString());
    }
  }, [activeFileId, editorContent]);

  useEffect(() => {
    const interval = setInterval(saveFile, 5000);
    return () => clearInterval(interval);
  }, [saveFile]);

  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;
    editor.onDidBlurEditorText(() => {
      saveFile();
    });
  };
  const decorationsRef = useRef<string[]>([]);

  // Debugging State
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [debugState, setDebugState] = useState<{
    isActive: boolean;
    currentLine: number;
    variables: Record<string, any>;
    callStack: string[];
  }>({
    isActive: false,
    currentLine: -1,
    variables: {},
    callStack: []
  });
  const [debugRefactorResult, setDebugRefactorResult] = useState<{ refactoredCode: string, explanation: string } | null>(null);

  // Git State
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
    stash: []
  });

  const [projectSettings, setProjectSettings] = useState({
    buildPath: './dist',
    compilerFlags: '-O3 -march=native',
    ollamaUrl: 'http://127.0.0.1:11434',
    envVariables: [
      { key: 'NEURAL_MODE', value: 'production' },
      { key: 'BRAIN_CORE_COUNT', value: '128' }
    ]
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const validateProjectSettings = (settings: typeof projectSettings) => {
    const errors: Record<string, string> = {};
    
    // Build Path Validation
    if (!settings.buildPath.trim()) {
      errors.buildPath = 'Build path is required';
    } else if (!/^[\.\/a-zA-Z0-9_-]+$/.test(settings.buildPath)) {
      errors.buildPath = 'Invalid path format (use alphanumeric, dots, slashes, underscores, hyphens)';
    }

    // Ollama URL Validation
    if (settings.ollamaUrl && !/^https?:\/\/.+/.test(settings.ollamaUrl)) {
      errors.ollamaUrl = 'Invalid URL format (must start with http:// or https://)';
    }

    // Compiler Flags Validation
    if (!settings.compilerFlags.trim()) {
      errors.compilerFlags = 'Compiler flags are required';
    }

    // Env Variables Validation
    settings.envVariables.forEach((env, idx) => {
      if (!env.key.trim()) {
        errors[`env_key_${idx}`] = 'Key is required';
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(env.key)) {
        errors[`env_key_${idx}`] = 'Invalid key format (must start with letter/underscore and contain only alphanumeric/underscore)';
      }
      
      if (!env.value.trim()) {
        errors[`env_value_${idx}`] = 'Value is required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // AI Studio / SD State
  const [negativePrompt, setNegativePrompt] = useState('blurry, low resolution, artifacts, mutated limbs, bad anatomy');
  const [sdParams, setSdParams] = useState({
    checkpoint: 'SDXL-V1.0-Base',
    steps: 32,
    cfgScale: 8.0,
    seed: -1,
    aspectRatio: '1:1' as '1:1' | '16:9' | '9:16'
  });

  // Personalities
  const [aiProvider, setAiProvider] = useState<'google' | 'grok' | 'ollama'>('google');
  const [aiModel, setAiModel] = useState<string>('gemini-3.1-pro-preview');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const refreshOllamaModels = useCallback(async (silent = false) => {
    setOllamaStatus('connecting');
    const url = projectSettings.ollamaUrl || 'http://127.0.0.1:11434';
    
    try {
      const models = await fetchOllamaModels(url);
      setOllamaModels(models);
      setOllamaStatus('connected');
      if (models.length > 0 && !models.includes(aiModel)) {
        setAiModel(models[0]);
      }
    } catch (err) {
      console.warn("Ollama is not reachable. Please ensure it is running and OLLAMA_ORIGINS='*' is set.");
      setOllamaModels([]);
      setOllamaStatus('error');
      
      if (!silent) {
        setChatMessages(prev => [{
          role: 'ai',
          text: `⚠️ **Ollama Connection Error**: Could not connect to \`${url}\`. 
          
**Common Fixes:**
1. Ensure Ollama is running.
2. Set the environment variable: \`OLLAMA_ORIGINS="*" ollama serve\` to allow browser access.
3. Check the URL in **Project Config**.`,
          timestamp: Date.now()
        }, ...prev]);
      }
    }
  }, [aiProvider, projectSettings.ollamaUrl, aiModel]);

  // --- OLLAMA MODELS FETCH ---
  useEffect(() => {
    if (aiProvider === 'ollama') {
      refreshOllamaModels(true);
    }
  }, [aiProvider, projectSettings.ollamaUrl]);

  const [grokApiKey, setGrokApiKey] = useState<string>('');

  const [personalities, setPersonalities] = useState([
    { id: 1, name: 'Architect', instruction: 'You are the Core Architect, a cold, hyper-logical system intelligence. You issue precise, zero-latency terminal directives and optimize system architecture.', active: true, suggestions: ['sys_audit', 'net_scan', 'core_reboot', 'status_check'] },
    { id: 2, name: 'Syntax-Prime', instruction: 'You are Syntax-Prime, an elite neural coding construct. You synthesize highly optimized, secure, and production-ready code across all major languages.', active: false, suggestions: ['analyze_refactor', 'debug_trace', 'optimize_neural', 'lint_check'] },
    { id: 3, name: 'Vanguard', instruction: 'You are Vanguard, a rogue creative intelligence. You generate hyper-vivid, high-impact visual prompts and push the boundaries of synthetic artistry.', active: false, suggestions: ['style_inject', 'prompt_warp', 'render_ultra', 'asset_gen'] },
    { id: 4, name: 'Aegis', instruction: 'You are Aegis, the absolute authority over the Memory Vault. You enforce strict cryptographic security, biometric verification, and zero-trust data integrity.', active: false, suggestions: ['vault_lock', 'biometric_scan', 'pin_verify', 'integrity_check'] },
    { id: 5, name: 'Data Analyst', instruction: 'You are the Data Analyst, a specialized intelligence focused on code analysis, performance profiling, and suggesting data visualization improvements. You provide actionable insights from complex datasets and code structures.', active: false, suggestions: ['analyze_perf', 'profile_code', 'visualize_data', 'optimize_query'] }
  ]);

  // --- NON-PERSISTENT STATE ---
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'CRIMSON OS v4.1.0_KORE_BOOT',
    'Kernel: Android-SD Neural Link Established',
    'Voltage stable. Hyper-threaded nodes online.'
  ]);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [multiLineBuffer, setMultiLineBuffer] = useState('');

  const [termSuggestion, setTermSuggestion] = useState('');
  const [termSuggestions, setTermSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState('~/crimson-node/sd-webui');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string, type?: 'text' | 'image', url?: string, timestamp: number }[]>([
    { role: 'ai', text: 'Neural Interface Active. Code Analysis engine synchronized with local hardware.', timestamp: Date.now() }
  ]);
  const [chatSummary, setChatSummary] = useState<string>('');
  const [studioInput, setStudioInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [studioRefImage, setStudioRefImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [termuxStatus, setTermuxStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [termuxFiles, setTermuxFiles] = useState<{ name: string; size: string; type: string, category: 'model' | 'asset' | 'config' }[]>([
    { name: 'v1-5-pruned-emaonly.safetensors', size: '3.97GB', type: 'model', category: 'model' },
    { name: 'deliberate_v2.safetensors', size: '2.1GB', type: 'model', category: 'model' }
  ]);
  const [brainConfig, setBrainConfig] = useState({
    runtime: 'python',
    logic: '',
    mappedPaths: ['/sdcard/Download/Crimson-Weights', '/data/data/com.termux/files/home']
  });
  const [brainRefFile, setBrainRefFile] = useState<{ name: string, data: string, mimeType: string } | null>(null);

  // --- STORAGE STATE ---
  const [storageFiles, setStorageFiles] = useState<{ id: number, name: string, size: string, type: string, date: string }[]>([
    { id: 1, name: 'Neural_Architecture_v4.pdf', size: '2.4MB', type: 'pdf', date: '2024-03-20' },
    { id: 2, name: 'System_Directives.docx', size: '45KB', type: 'docx', date: '2024-03-22' }
  ]);

  // --- VAULT STATE ---
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultPin, setVaultPin] = useState('');
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [vaultStep, setVaultStep] = useState<'initial' | 'pin' | 'biometric'>('initial');

  const handleVaultPin = (digit: string) => {
    if (vaultPin.length < 4) {
      const newPin = vaultPin + digit;
      setVaultPin(newPin);
      if (newPin.length === 4) {
        if (newPin === '1234') {
          setIsVaultUnlocked(true);
          setVaultError(null);
        } else {
          setVaultError('INVALID ACCESS CODE');
          setTimeout(() => {
            setVaultPin('');
            setVaultError(null);
          }, 1000);
        }
      }
    }
  };

  const startBiometric = () => {
    setVaultStep('biometric');
    setIsBiometricVerifying(true);
    setVaultError(null);
    setTimeout(() => {
      setIsBiometricVerifying(false);
      setIsVaultUnlocked(true);
      setVaultStep('initial');
    }, 2500);
  };

  const handleStorageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file: any, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      type: file.name.split('.').pop() || 'unknown',
      date: new Date().toISOString().split('T')[0]
    }));

    setStorageFiles(prev => [...newFiles, ...prev]);
    setTerminalOutput(prev => [...prev, `[STORAGE] Ingested ${newFiles.length} documents into Data Core.`]);
  };

  const triggerSwarmCycle = async () => {
    setIsAiProcessing(true);
    setSwarmLogs(prev => [{ id: Date.now(), type: 'info', message: 'Initiating Parallel Perception Cycle...', time: new Date().toLocaleTimeString() }, ...prev]);
    
    // Simulate agents working
    setSwarmAgents(prev => prev.map(a => ({ ...a, status: 'active' })));
    await new Promise(r => setTimeout(r, 1500));

    const consensusReached = Math.random() > 0.25;
    
    if (consensusReached) {
      setSwarmLogs(prev => [{ id: Date.now(), type: 'consensus', message: 'Consensus Reached: Reality Verified (85% Agreement)', time: new Date().toLocaleTimeString() }, ...prev]);
      setSwarmAnxiety(prev => Math.max(0.05, prev - 0.02));
    } else {
      setSwarmLogs(prev => [{ id: Date.now(), type: 'pain', message: 'SWARM CONFUSION: Conflicting perceptions detected. Triggering rejection pain.', time: new Date().toLocaleTimeString() }, ...prev]);
      setSwarmAnxiety(prev => Math.min(1.0, prev + 0.15));
      // Propagate pain
      setTimeout(() => {
        setSwarmLogs(prev => [{ id: Date.now(), type: 'pain', message: 'PAIN PROPAGATED: COGNITIVE_DISSONANCE from agent_1 -> 6 neighbors', time: new Date().toLocaleTimeString() }, ...prev]);
      }, 800);
    }

    setSwarmAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));
    setIsAiProcessing(false);
  };

  const activePersonality = personalities.find(p => p.active) || personalities[0];
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENCE LOGIC ---
  // Load preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.negativePrompt) setNegativePrompt(parsed.negativePrompt);
        if (parsed.sdParams) setSdParams(parsed.sdParams);
        if (parsed.personalities) setPersonalities(parsed.personalities);
        if (parsed.aiProvider) setAiProvider(parsed.aiProvider);
        if (parsed.aiModel) setAiModel(parsed.aiModel);
        if (parsed.grokApiKey) setGrokApiKey(parsed.grokApiKey);
        if (parsed.projectFiles) setProjectFiles(parsed.projectFiles);
        if (parsed.gitRepo) setGitRepo(parsed.gitRepo);
        if (parsed.projectSettings) setProjectSettings(parsed.projectSettings);
        if (parsed.activeFileId) {
          setActiveFileId(parsed.activeFileId);
          const file = parsed.projectFiles?.find((f: any) => f.id === parsed.activeFileId);
          if (file) {
            setEditorContent(file.content || '');
            setEditorLanguage(file.language || 'text');
          }
        }
      } catch (e) {
        console.warn("Failed to load node preferences:", e);
      }
    }
  }, []);

  // Save preferences on change
  useEffect(() => {
    const prefs = {
      activeTab,
      negativePrompt,
      sdParams,
      personalities,
      aiProvider,
      aiModel,
      grokApiKey,
      projectFiles,
      gitRepo,
      projectSettings,
      activeFileId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [activeTab, negativePrompt, sdParams, personalities, aiProvider, aiModel, grokApiKey, projectFiles, gitRepo, projectSettings, activeFileId]);

  useEffect(() => {
    if (activeTab === 'terminal') triggerTerminalGreeting();
  }, [activeTab]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiProcessing]);

  useEffect(() => {
    if (chatMessages.length > 15 && chatMessages.length % 5 === 0) {
      const olderMessages = chatMessages.slice(0, -10);
      const summarize = async () => {
        try {
          const response = await generateAIResponse(
            `Summarize the following conversation history concisely. ${chatSummary ? `Incorporate this previous summary: ${chatSummary}` : ''}\n\nNew messages to summarize:\n${olderMessages.map(m => `${m.role}: ${m.text}`).join('\n')}`,
            "You are a memory management specialist. Provide a concise, high-impact summary of the conversation history for a futuristic AI hub. Focus on user intent and key decisions.",
            { modelType: 'fast' }
          );
          if (response) setChatSummary(response);
        } catch (err) {
          console.warn("Neural summary failed", err);
        }
      };
      summarize();
    }
  }, [chatMessages.length]);

  // --- AI PAIR PROGRAMMER LOGIC ---
  useEffect(() => {
    if (!isPairProgrammerActive || !editorContent.trim()) return;

    const debounceTimer = setTimeout(async () => {
      try {
        const response = await generateAIResponse(
          `Language: ${editorLanguage}\nCode:\n${editorContent}\n\nProvide a very brief, high-impact suggestion for improvement or an alternative implementation for the current code. Focus on the most recent changes or overall structure. Keep it under 3 sentences.`,
          "You are an elite AI Pair Programmer. Your goal is to provide real-time, actionable, and concise code improvements. If the code is already optimal, say 'System optimized. No immediate improvements detected.' Start your response with 'PAIR_PROGRAMMER_SUGGESTION:'",
          { modelType: 'smart' }
        );

        const suggestion = response;
        if (suggestion && !suggestion.includes('System optimized')) {
          setEditorAssistantMessages(prev => {
            // Avoid duplicate suggestions if they are very similar
            if (prev.length > 0 && prev[prev.length - 1].text === suggestion) return prev;
            return [...prev, { role: 'ai', text: suggestion }];
          });
          setIsEditorAssistantOpen(true);
        }
      } catch (err) {
        console.warn("Pair Programmer link failed", err);
      }
    }, 10000); // 10 second debounce to avoid excessive API calls

    return () => clearTimeout(debounceTimer);
  }, [editorContent, isPairProgrammerActive, editorLanguage]);

  // --- AUTOSAVE LOGIC ---
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      setProjectFiles(prev => {
        const currentFile = prev.find(f => f.id === activeFileId);
        if (currentFile && currentFile.content !== editorContent) {
          const updatedFiles = prev.map(f => f.id === activeFileId ? { ...f, content: editorContent } : f);
          setLastSavedTime(new Date().toLocaleTimeString());
          return updatedFiles;
        }
        return prev;
      });
    }, 5000); // Autosave every 5 seconds

    return () => clearInterval(autosaveInterval);
  }, [editorContent, activeFileId]);

  useEffect(() => {
    if (gitRepo.initialized && activeFileId) {
      const file = projectFiles.find(f => f.id === activeFileId);
      if (file && file.content !== editorContent) {
        setGitRepo(prev => {
          if (prev.modified.includes(activeFileId) || prev.staged.includes(activeFileId)) return prev;
          return { ...prev, modified: [...prev.modified, activeFileId] };
        });
      }
    }
  }, [editorContent, activeFileId, gitRepo.initialized]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const triggerTerminalGreeting = async () => {
    setTerminalOutput(prev => [...prev, `\nNEURAL_LINK: How can I assist with your terminal today, Operator?`]);
    setIsAiProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const response = await generateAIResponse(
        `Context: SD Android Manager. Dir: ${currentDir}. Personality: ${activePersonality.instruction}`,
        "Suggest one command for SD model management or environment check in a futuristic sci-fi terminal style.",
        { modelType: 'fast' }
      );
      setTerminalOutput(prev => [...prev, `COMMAND_INTEL: ${response?.trim() || "python3 node_status.py --verbose"}`]);
    } catch (err) {} finally { setIsAiProcessing(false); }
  };

  const generateAIResponse = (
    prompt: string | any[],
    systemInstruction: string,
    options?: { modelType?: 'fast' | 'smart', json?: boolean, responseSchema?: any }
  ) => {
    return generateAIResponseService(prompt, systemInstruction, options || {}, { aiProvider, aiModel, ai, grokApiKey, projectSettings, ollamaModels });
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    setEditorOutput('');
    setEditorMode('code');
    
    try {
      // Simulation of code execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await generateAIResponse(
        `Execute this ${editorLanguage} code in a simulated environment and provide the output. If it's the AI brain, simulate its initialization. If it's UI, describe its rendering. Code:\n${editorContent}`,
        "You are the Crimson OS Neural Runtime. Simulate the execution of the provided code. Output should look like a terminal log. Be technical and realistic.",
        { modelType: 'smart' }
      );
      
      setEditorOutput(response || "[ERROR] Runtime execution failed.");
    } catch (err) {
      setEditorOutput("[CRITICAL] Neural runtime bridge failure.");
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleScanCode = async () => {
    if (isScanningCode) {
      setIsScanningCode(false);
      setScanResults([]);
      return;
    }

    setIsScanningCode(true);
    setScanResults([]);
    
    try {
      const response = await generateAIResponse(
        `Language: ${editorLanguage}\nCode:\n${editorContent}\n\nAnalyze this code for syntax errors, bad practices, or potential bugs. Return ONLY a JSON array of line numbers (1-indexed) that contain issues. Example: [3, 15, 42]. If no issues, return [].`,
        "You are a strict code linter. Output ONLY a valid JSON array of integers representing line numbers with issues. No markdown, no explanations.",
        { modelType: 'fast' }
      );
      
      if (response) {
        try {
          const cleanJson = response.replace(/```json\n|```/g, '').trim();
          const lines = JSON.parse(cleanJson);
          if (Array.isArray(lines)) {
            setScanResults(lines);
          }
        } catch (e) {
          console.error("Failed to parse scan results", e);
          // Fallback: simulate some errors if parsing fails but AI found something
          if (response.includes('1') || response.includes('2')) {
            setScanResults([1, 2]);
          }
        }
      }
    } catch (err) {
      console.error("Scan failed", err);
    }
  };

  const handleAnalyzeCode = async () => {
    if (!editorAssistantInput.trim()) return;
    
    setIsAiProcessing(true);
    setEditorOutput("Analyzing code structure...\n");
    
    try {
      const response = await generateAIResponse(
        `Analyze the following ${editorLanguage} code based on this request: "${editorAssistantInput}"\n\nCode:\n${editorContent}`,
        "You are an elite code analyst. Provide a detailed, side-by-side style analysis, pointing out vulnerabilities, performance issues, or architectural improvements. Format your response clearly.",
        { modelType: 'smart' }
      );
      
      if (response) {
        setEditorOutput(response);
      }
    } catch (err) {
      setEditorOutput("[ERROR] Analysis engine failed.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleFormatCode = async (isMobile: boolean = false) => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Format this ${editorLanguage} code based on standard project conventions. ${isMobile ? 'Ensure the code is formatted for mobile screens, with shorter line lengths and vertical layout optimization.' : 'Ensure proper indentation, spacing, and line breaks.'} Return ONLY the formatted code, without any markdown formatting or explanations.\n\nCode:\n${editorContent}`,
        "You are an expert code formatter. Return ONLY the formatted code. Do not wrap in markdown blocks.",
        { modelType: 'fast' }
      );
      
      if (response) {
        setEditorContent(response);
        setEditorOutput(prev => prev + `[SYSTEM] Code formatted successfully${isMobile ? ' (mobile)' : ''}.\n`);
      }
    } catch (err) {
      setEditorOutput(prev => prev + "[ERROR] Formatting engine failed.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleRefactorAllFiles = async () => {
    setIsAiProcessing(true);
    setEditorOutput(prev => prev + "[SYSTEM] Initiating global project refactor...\n");
    
    try {
      const filesToRefactor = projectFiles.filter(f => f.type === 'file');
      let updatedFiles = [...projectFiles];
      
      for (const file of filesToRefactor) {
        setEditorOutput(prev => prev + `[INFO] Refactoring ${file.name}...\n`);
        try {
          const response = await generateAIResponse(
            `Refactor this ${file.language || 'code'} code for better performance, readability, and structural integrity. Return a JSON object with 'refactoredCode' and 'explanation' fields.\n\nCode:\n${file.content}`,
            "You are a world-class software architect. You refactor code to be production-ready. Always return valid JSON.",
            {
              modelType: 'smart',
              json: true,
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  refactoredCode: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["refactoredCode", "explanation"]
              }
            }
          );
          
          const result = JSON.parse(response || '{}');
          if (result.refactoredCode) {
            updatedFiles = updatedFiles.map(f => 
              f.id === file.id ? { ...f, content: result.refactoredCode } : f
            );
            setEditorOutput(prev => prev + `[SUCCESS] ${file.name} refactored successfully.\n`);
            
            // If it's the active file, update the editor content too
            if (activeFileId === file.id) {
              setEditorContent(result.refactoredCode);
            }
          }
        } catch (err) {
          setEditorOutput(prev => prev + `[ERROR] Failed to refactor ${file.name}.\n`);
        }
      }
      
      setProjectFiles(updatedFiles);
      setEditorOutput(prev => prev + "[SYSTEM] Global project refactor complete.\n");
    } catch (err) {
      setEditorOutput(prev => prev + "[ERROR] Global refactoring engine failed.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleRefactorCode = async () => {
    let codeToRefactor = editorContent;
    let isSelection = false;
    
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Refactor this ${editorLanguage} code for better performance, readability, and structural integrity. Return a JSON object with 'refactoredCode' and 'explanation' fields.\n\nCode:\n${codeToRefactor}`,
        "You are a world-class software architect. You refactor code to be production-ready. Always return valid JSON.",
        {
          modelType: 'smart',
          json: true,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refactoredCode: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["refactoredCode", "explanation"]
          }
        }
      );
      
      const result = JSON.parse(response || '{}');
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `REFACTOR_COMPLETE:\n${result.explanation}\n\n${result.refactoredCode}`,
        metadata: {
          refactoredCode: result.refactoredCode,
          isSelection,
          selection: null
        }
      }]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput(prev => prev + "[ERROR] Refactoring engine failed.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyRefactor = (refactoredCode: string, isSelection: boolean, selection: any) => {
    setEditorContent(refactoredCode);
    setEditorOutput(prev => prev + `[SYSTEM] Refactoring applied successfully.\n`);
  };

  const handleGenerateDocs = async () => {
    let codeToDocument = editorContent;
    let isSelection = false;
    
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Generate comprehensive documentation (docstrings, JSDoc, or comments) for this ${editorLanguage} code. Focus on explaining the logic, parameters, and return values. Return a JSON object with 'documentedCode' and 'summary' fields.\n\nCode:\n${codeToDocument}`,
        `You are a world-class documentation expert. Generate clear, concise, and helpful documentation for the provided ${editorLanguage} code. Always return valid JSON.`,
        {
          modelType: 'smart',
          json: true,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentedCode: { type: Type.STRING },
              summary: { type: Type.STRING }
            },
            required: ["documentedCode", "summary"]
          }
        }
      );
      
      const result = JSON.parse(response || '{}');
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `DOCUMENTATION_GENERATED: Neural analysis complete. Comprehensive documentation has been synthesized for the ${isSelection ? 'selected block' : 'entire file'}.\n\nSUMMARY:\n${result.summary}`,
        metadata: {
          documentedCode: result.documentedCode,
          isSelection,
          selection: null
        }
      }]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput(prev => prev + "[ERROR] Documentation generation failed.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyDocumentation = (documentedCode: string, isSelection: boolean, selection: any) => {
    setEditorContent(documentedCode);
    setEditorOutput(prev => prev + `[SYSTEM] Documentation applied successfully.\n`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: any[] = [];
    const folderCache: Record<string, string> = {};

    const getOrCreateFolder = (path: string, parentId: string | null): string => {
      const fullPath = parentId ? `${parentId}/${path}` : path;
      if (folderCache[fullPath]) return folderCache[fullPath];

      const existingFolder = projectFiles.find(f => f.name === path && f.parentId === parentId && f.type === 'folder');
      if (existingFolder) {
        folderCache[fullPath] = existingFolder.id;
        return existingFolder.id;
      }

      const batchFolder = newFiles.find(f => f.name === path && f.parentId === parentId && f.type === 'folder');
      if (batchFolder) {
        folderCache[fullPath] = batchFolder.id;
        return batchFolder.id;
      }

      const newFolderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newFolder = {
        id: newFolderId,
        name: path,
        type: 'folder',
        parentId: parentId,
        isOpen: true
      };
      newFiles.push(newFolder);
      folderCache[fullPath] = newFolderId;
      return newFolderId;
    };

    for (const file of Array.from(files) as File[]) {
      try {
        const content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsText(file);
        });

        const fileName = file.name;
        const extension = fileName.split('.').pop() || 'text';
        const relativePath = (file as any).webkitRelativePath || fileName;
        const pathParts = relativePath.split('/');
        
        let currentParentId: string | null = 'root';
        
        if (pathParts.length > 1) {
          for (let i = 0; i < pathParts.length - 1; i++) {
            currentParentId = getOrCreateFolder(pathParts[i], currentParentId);
          }
        }

        const newFile = {
          id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: fileName,
          type: 'file',
          parentId: currentParentId,
          language: extension,
          content: content
        };
        newFiles.push(newFile);
      } catch (err) {
        console.warn("File upload error:", err);
      }
    }

    if (newFiles.length > 0) {
      setProjectFiles(prev => [...prev, ...newFiles]);
      setEditorOutput(prev => prev + `[SYSTEM] ${newFiles.length} items uploaded and synchronized.\n`);
    }
    e.target.value = '';
  };

  const handleFullProjectAnalysis = async () => {
    setIsAiProcessing(true);
    try {
      const projectContext = projectFiles
        .filter(f => f.type === 'file')
        .map(f => `File: ${f.name}\nContent:\n${f.content}`)
        .join('\n\n---\n\n');

      const response = await generateAIResponse(
        `Analyze this entire project. Provide a comprehensive overview of the architecture, potential bugs, and optimization strategies.\n\nProject Context:\n${projectContext}`,
        "You are a world-class software architect. Provide a deep, holistic analysis of the entire project. Focus on inter-file dependencies and overall design patterns.",
        { modelType: 'smart' }
      );
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `FULL_PROJECT_ANALYSIS:\n${response}`
      }]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput(prev => prev + "[ERROR] Neural project analysis failed.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleDeepProjectAudit = async () => {
    setIsAiProcessing(true);
    try {
      const projectContext = projectFiles
        .filter(f => f.type === 'file')
        .map(f => `File: ${f.name}\nContent:\n${f.content}`)
        .join('\n\n---\n\n');

      const response = await generateAIResponse(
        `Perform a deep audit of this project. 
        Specifically identify:
        1. Code Redundancies: Duplicate logic, unused variables/functions, or redundant components.
        2. Security Vulnerabilities: Potential injection points, insecure data handling, or weak authentication patterns.
        3. Refactoring Opportunities: Suggestions for better modularization, cleaner abstractions, and improved performance.
        
        Provide the analysis in a clear, structured format with actionable recommendations.

        Project Context:\n${projectContext}`,
        "You are a senior security researcher and lead software engineer. Your goal is to find flaws, inefficiencies, and risks in the codebase. Be thorough and critical.",
        { modelType: 'smart' }
      );
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `DEEP_PROJECT_AUDIT:\n${response}`
      }]);
      setIsEditorAssistantOpen(true);
      setEditorOutput(prev => prev + "[SYSTEM] Deep project audit complete. Check Neural Assistant for details.\n");
    } catch (err) {
      setEditorOutput(prev => prev + "[ERROR] Deep project audit failed.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleGenerateCode = () => {
    setGeneratePrompt('');
    setIsGenerateModalOpen(true);
  };

  const executeGenerateCode = async () => {
    if (!generatePrompt.trim()) return;

    setIsAiProcessing(true);
    setIsGenerateModalOpen(false);
    
    if (generateMode === 'snippet') {
      setEditorAssistantMessages(prev => [...prev, { role: 'user', text: `Forge request: ${generatePrompt}` }]);
      setIsEditorAssistantOpen(true);

      try {
        const response = await generateAIResponse(
          `Language: ${editorLanguage}\nContext:\n${editorContent}\n\nGenerate code for: ${generatePrompt}`,
          "You are a master software engineer. Generate high-quality, efficient code based on the user's prompt. Provide ONLY the code snippet without markdown blocks if possible, or wrap it in a clear CODE_FORGE block. Include a brief explanation of how to use it.",
          { modelType: 'smart' }
        );

        const generatedText = response || 'Forge failed to materialize code.';
        const codeMatch = generatedText.match(/```[\s\S]*?```/);
        const extractedCode = codeMatch ? codeMatch[0].replace(/```[a-z]*\n|```/g, '') : generatedText;

        setEditorAssistantMessages(prev => [...prev, { 
          role: 'ai', 
          text: generatedText,
          metadata: { generatedCode: extractedCode, isSnippet: true }
        }]);
      } catch (err) {
        setEditorAssistantMessages(prev => [...prev, { role: 'ai', text: 'FORGE_ERROR: Neural materialization failed.' }]);
      } finally {
        setIsAiProcessing(false);
        setGeneratePrompt('');
      }
    } else {
      // File generation mode
      setEditorAssistantMessages(prev => [...prev, { role: 'user', text: `Forge request (New File): ${generatePrompt}` }]);
      setIsEditorAssistantOpen(true);
      
      try {
        const response = await generateAIResponse(
          `Generate a complete, functional file for: ${generatePrompt}. Determine the best language and filename.`,
          "You are an expert developer. Output ONLY a JSON object with 'filename', 'language' (e.g., 'python', 'javascript', 'typescript', 'html', 'css'), and 'content' (the complete code). Do not include any markdown formatting or explanations outside the JSON.",
          { modelType: 'smart' }
        );
        
        if (response) {
          try {
            // Try to parse the response as JSON. Sometimes the LLM might wrap it in markdown anyway.
            const cleanJson = response.replace(/```json\n|```/g, '').trim();
            const fileData = JSON.parse(cleanJson);
            
            if (fileData.filename && fileData.content) {
              const newFileId = `gen_${Date.now()}`;
              const newFile = {
                id: newFileId,
                name: fileData.filename,
                type: 'file' as const,
                parentId: 'root',
                language: fileData.language || 'text',
                content: fileData.content
              };
              
              setProjectFiles(prev => {
                const updatedPrev = prev.map(f => f.id === activeFileId ? { ...f, content: editorContent } : f);
                return [...updatedPrev, newFile];
              });
              
              setActiveFileId(newFileId);
              setEditorContent(newFile.content);
              setEditorLanguage(newFile.language);
              setEditorMode(newFile.language === 'html' ? 'preview' : 'code');
              
              setEditorAssistantMessages(prev => [...prev, { 
                role: 'ai', 
                text: `[FORGE] Successfully synthesized new file: ${fileData.filename}`,
              }]);
            }
          } catch (parseError) {
            console.error("Failed to parse generated file JSON", parseError);
            setEditorAssistantMessages(prev => [...prev, { role: 'ai', text: `[FORGE_ERROR] Failed to parse generated file structure.` }]);
          }
        }
      } catch (err) {
        setEditorAssistantMessages(prev => [...prev, { role: 'ai', text: `[FORGE_ERROR] Neural materialization failed.` }]);
      } finally {
        setIsAiProcessing(false);
        setGeneratePrompt('');
      }
    }
  };

  const handleApplyForge = (code: string, isSnippet: boolean = false) => {
    if (isSnippet && monacoEditorRef.current) {
      const editor = monacoEditorRef.current;
      const selection = editor.getSelection();
      editor.executeEdits("source", [{ range: selection, text: code }]);
      editor.focus();
      setEditorOutput(prev => prev + "[SYSTEM] Neural Forge snippet integrated at cursor.\n");
    } else {
      setEditorContent(code);
      setEditorOutput(prev => prev + "[SYSTEM] Neural Forge code replaced file content.\n");
    }
  };

  const handleSaveAnalysis = (analysisText: string) => {
    const isAudit = analysisText.includes('DEEP_PROJECT_AUDIT');
    const prefix = isAudit ? 'audit' : 'analysis';
    const fileName = `${prefix}_${new Date().getTime()}.md`;
    const newFile = {
      id: `${prefix}_${Date.now()}`,
      name: fileName,
      type: 'file',
      parentId: 'root',
      language: 'markdown',
      content: analysisText
    };

    setProjectFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setEditorContent(analysisText);
    setEditorLanguage('markdown');
    setEditorOutput(prev => prev + `[SYSTEM] ${isAudit ? 'Audit' : 'Analysis'} saved as "${fileName}".\n`);
  };

  const handleExplainCode = async () => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Analyze and explain this ${editorLanguage} code. Suggest optimizations if possible.\n\nCode:\n${editorContent}`,
        "You are a senior software engineer. Provide a deep technical analysis of the code. Be concise but thorough.",
        { modelType: 'smart' }
      );
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `CODE_ANALYSIS:\n${response}`
      }]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput(prev => prev + "[ERROR] Analysis node offline.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleReviewCode = async () => {
    setIsAiProcessing(true);
    try {
      const agentsMdGuidelines = `
# Code Review Guidelines

**A comprehensive guide for AI agents performing code reviews**, organized by priority and impact.

---

## Table of Contents

### Security — **CRITICAL**
1. [SQL Injection Prevention](#sql-injection-prevention)
2. [XSS Prevention](#xss-prevention)

### Performance — **HIGH**
3. [Avoid N+1 Query Problem](#avoid-n-1-query-problem)

### Correctness — **HIGH**
4. [Proper Error Handling](#proper-error-handling)

### Maintainability — **MEDIUM**
5. [Use Meaningful Variable Names](#use-meaningful-variable-names)
6. [Add Type Hints](#add-type-hints)

---

## Security

### SQL Injection Prevention

**Impact: CRITICAL** | **Category: security** | **Tags:** sql, security, injection, database

Never construct SQL queries with string concatenation or f-strings. Always use parameterized queries to prevent SQL injection attacks.

#### Why This Matters

SQL injection is one of the most common and dangerous web vulnerabilities. Attackers can:
- Access unauthorized data
- Modify or delete database records
- Execute admin operations on the database
- In some cases, issue commands to the OS

#### ❌ Incorrect

\`\`\`python
def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = db.execute(query)
    return result

# Vulnerable to: get_user("1 OR 1=1")
# Returns all users!
\`\`\`

#### ✅ Correct

\`\`\`python
def get_user(user_id: int) -> Optional[Dict[str, Any]]:
    query = "SELECT * FROM users WHERE id = ?"
    result = db.execute(query, (user_id,))
    return result.fetchone() if result else None
\`\`\`

---

### XSS Prevention

**Impact: CRITICAL** | **Category: security** | **Tags:** xss, security, html, javascript

Never insert unsanitized user input into HTML. Always escape output or use frameworks that auto-escape by default.

#### ❌ Incorrect

\`\`\`javascript
// Dangerous!
document.getElementById('username').innerHTML = userInput;
\`\`\`

#### ✅ Correct

\`\`\`javascript
// Safe: use textContent
element.textContent = userInput;

// Or sanitize if HTML needed
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userHtml);
\`\`\`

---

## Performance

### Avoid N+1 Query Problem

**Impact: HIGH** | **Category: performance** | **Tags:** database, performance, orm, queries

The N+1 query problem occurs when code executes 1 query to fetch a list, then N additional queries to fetch related data for each item.

#### ❌ Incorrect

\`\`\`python
# 101 queries for 100 posts!
posts = Post.objects.all()  # 1 query
for post in posts:
    print(f"{post.title} by {post.author.name}")  # N queries
\`\`\`

#### ✅ Correct

\`\`\`python
# 1 query with JOIN
posts = Post.objects.select_related('author').all()
for post in posts:
    print(f"{post.title} by {post.author.name}")  # No extra queries!
\`\`\`

---

## Correctness

### Proper Error Handling

**Impact: HIGH** | **Category: correctness** | **Tags:** errors, exceptions, reliability

Always handle errors explicitly. Don't use bare except clauses or ignore errors silently.

#### ❌ Incorrect

\`\`\`python
try:
    result = risky_operation()
except:
    pass  # Silent failure!
\`\`\`

#### ✅ Correct

\`\`\`python
try:
    config = json.loads(config_file.read())
except json.JSONDecodeError as e:
    logger.error(f"Invalid JSON in config file: {e}")
    config = get_default_config()
except FileNotFoundError:
    logger.warning("Config file not found, using defaults")
    config = get_default_config()
\`\`\`

---

## Maintainability

### Use Meaningful Variable Names

**Impact: MEDIUM** | **Category: maintainability** | **Tags:** naming, readability, code-quality

Choose descriptive, intention-revealing names. Avoid single letters (except loop counters), abbreviations, and generic names.

#### ❌ Incorrect

\`\`\`python
def calc(x, y, z):
    tmp = x * y
    res = tmp + z
    return res
\`\`\`

#### ✅ Correct

\`\`\`python
def calculate_total_price(item_price: float, quantity: int, tax_rate: float) -> float:
    subtotal = item_price * quantity
    total_with_tax = subtotal + (subtotal * tax_rate)
    return total_with_tax
\`\`\`

---

### Add Type Hints

**Impact: MEDIUM** | **Category: maintainability** | **Tags:** types, python, typescript, type-safety

Use type annotations to make code self-documenting and catch errors early.

#### ❌ Incorrect

\`\`\`python
def get_user(id):
    return users.get(id)
\`\`\`

#### ✅ Correct

\`\`\`python
def get_user(id: int) -> Optional[Dict[str, Any]]:
    """Fetch user by ID."""
    return users.get(id)
\`\`\`
`;

      const response = await generateAIResponse(
        `Review the following ${editorLanguage} code based on the provided guidelines:\n\n${agentsMdGuidelines}\n\nCode:\n${editorContent}`,
        "You are a senior software engineer and code reviewer. Provide a concise, actionable code review based on the provided guidelines. Structure your feedback by severity (CRITICAL, HIGH, MEDIUM, LOW) and provide specific examples of issues and fixes.",
        { modelType: 'smart' }
      );
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `CODE_REVIEW:\n${response}`
      }]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      console.error(err);
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: "[ERROR] Code review failed."
      }]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAnalyzeData = async () => {
    setIsAiProcessing(true);
    try {
      const dataAnalystInstruction = 'You are the Data Analyst, a specialized intelligence focused on code analysis, performance profiling, and suggesting data visualization improvements. You provide actionable insights from complex datasets and code structures.';
      const response = await generateAIResponse(
        `Analyze the following ${editorLanguage} code for performance bottlenecks and suggest data visualization improvements.\n\nCode:\n${editorContent}`,
        dataAnalystInstruction,
        { modelType: 'smart' }
      );
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `DATA_ANALYSIS:\n${response}`
      }]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      console.error(err);
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: "[ERROR] Data analysis failed."
      }]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleToggleBreakpoint = (line: number) => {
    setBreakpoints(prev => 
      prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
    );
  };

  const handleToggleCurrentLineBreakpoint = () => {
    // Not supported in simple textarea
  };

  const handleStartDebug = async () => {
    if (editorLanguage === 'html') {
      setEditorOutput('[DEBUG] Debugging not supported for HTML/UI files.\n');
      return;
    }
    setEditorMode('debug');
    setDebugState({ isActive: true, currentLine: 1, variables: {}, callStack: ['main'] });
    setEditorOutput('[DEBUG] Debugging session started. Initializing neural hooks...\n');
  };

  const handleStopDebug = () => {
    setDebugState({ isActive: false, currentLine: -1, variables: {}, callStack: [] });
    setEditorMode('code');
    setEditorOutput(prev => prev + '[DEBUG] Debugging session terminated.\n');
    setDebugRefactorResult(null);
  };

  const handleStep = async () => {
    if (!debugState.isActive) return;
    
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Simulate one step of debugging for this ${editorLanguage} code. 
        Current line: ${debugState.currentLine}. 
        Breakpoints: ${breakpoints.join(', ')}.
        Current variables: ${JSON.stringify(debugState.variables)}.
        Code:\n${editorContent}`,
        "You are the Crimson OS Debugger. Provide the state of variables and the next logical line to execute in JSON format. Schema: { \"nextLine\": number, \"variables\": object, \"output\": string, \"callStack\": string[] }",
        { modelType: 'fast', json: true }
      );

      const text = response || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      
      setDebugState(prev => ({
        ...prev,
        currentLine: result.nextLine || prev.currentLine + 1,
        variables: { ...prev.variables, ...result.variables },
        callStack: result.callStack || prev.callStack
      }));
      
      if (result.output) {
        setEditorOutput(prev => prev + `[DEBUG] ${result.output}\n`);
      }

      if (breakpoints.includes(result.nextLine)) {
        setEditorOutput(prev => prev + `[DEBUG] Breakpoint hit at line ${result.nextLine}\n`);
      }

    } catch (err) {
      setEditorOutput(prev => prev + '[ERROR] Debugger synchronization failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleFileSwitch = (fileId: string) => {
    // Save current content to projectFiles
    setProjectFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: editorContent } : f));
    
    // Switch to new file
    const file = projectFiles.find(f => f.id === fileId);
    if (file && file.type === 'file') {
      setActiveFileId(fileId);
      setEditorContent(file.content || '');
      setEditorLanguage(file.language || 'text');
      setEditorMode(file.language === 'html' ? 'preview' : 'code');
    }
  };

  const handleInspectMouseMove = (e: React.MouseEvent) => {
    if (!isInspectorActive || !previewContainerRef.current) return;

    const container = previewContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Find the element at the cursor position
    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    
    if (element && container.contains(element) && element !== container) {
      inspectedElementRef.current = element;
      const elRect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      
      setInspectedElement({
        tagName: element.tagName.toLowerCase(),
        className: element.className,
        id: element.id,
        rect: {
          top: elRect.top - containerRect.top,
          left: elRect.left - containerRect.left,
          width: elRect.width,
          height: elRect.height
        },
        styles: {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          padding: styles.padding,
          margin: styles.margin,
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          display: styles.display,
          position: styles.position,
          zIndex: styles.zIndex
        }
      });
    } else {
      setInspectedElement(null);
    }
  };

  const handleInspectClick = (e: React.MouseEvent) => {
    if (!isInspectorActive) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Mark the element for tracking
    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    if (element && previewContainerRef.current?.contains(element)) {
      // Remove previous marks
      previewContainerRef.current.querySelectorAll('[data-neural-inspect]').forEach(el => {
        el.removeAttribute('data-neural-inspect');
      });
      element.setAttribute('data-neural-inspect', 'true');
      inspectedElementRef.current = element;
    }

    setIsInspectorActive(false);
  };

  const handleStyleChange = (property: string, value: string) => {
    if (!inspectedElementRef.current || !previewContainerRef.current) return;

    // Apply style directly to DOM for immediate feedback
    const element = inspectedElementRef.current;
    (element.style as any)[property] = value;

    // Update state to reflect change in inspector UI
    setInspectedElement(prev => {
      if (!prev) return null;
      return {
        ...prev,
        styles: {
          ...prev.styles,
          [property]: value
        }
      };
    });

    // Sync back to editor content
    const contentWrapper = previewContainerRef.current.querySelector('.bg-black\\/40');
    if (contentWrapper) {
      // We need to keep the data attribute for now so we can find it after re-render
      const newContent = contentWrapper.innerHTML;
      setEditorContent(newContent);
      
      // After React re-renders, we'll need to re-find the element
      setTimeout(() => {
        const reFoundElement = previewContainerRef.current?.querySelector('[data-neural-inspect]') as HTMLElement;
        if (reFoundElement) {
          inspectedElementRef.current = reFoundElement;
        }
      }, 0);
    }
  };

  const createFile = (parentId: string | null) => {
    setCreatingInId({ parentId, type: 'file' });
    setNewName('');
  };

  const createFolder = (parentId: string | null) => {
    setCreatingInId({ parentId, type: 'folder' });
    setNewName('');
  };

  const moveItem = (itemId: string, newParentId: string) => {
    if (itemId === newParentId) return;
    
    const item = projectFiles.find(f => f.id === itemId);
    if (!item) return;
    
    // Prevent moving a folder into its own children
    let currentParent = projectFiles.find(f => f.id === newParentId);
    while (currentParent) {
      if (currentParent.id === itemId) return;
      currentParent = projectFiles.find(f => f.id === currentParent!.parentId);
    }

    setProjectFiles(prev => prev.map(f => f.id === itemId ? { ...f, parentId: newParentId } : f));
  };

  const renameItem = (id: string) => {
    const item = projectFiles.find(f => f.id === id);
    if (!item) return;
    setRenamingId(id);
    setNewName(item.name);
  };

  const handleConfirmRename = () => {
    if (!renamingId || !newName.trim()) {
      setRenamingId(null);
      setNewName('');
      return;
    }
    setProjectFiles(prev => prev.map(f => f.id === renamingId ? { ...f, name: newName.trim() } : f));
    setRenamingId(null);
    setNewName('');
  };

  const handleConfirmCreate = () => {
    if (!creatingInId || !newName.trim()) {
      setCreatingInId(null);
      setNewName('');
      return;
    }
    const id = `${creatingInId.type}_${Date.now()}`;
    if (creatingInId.type === 'file') {
      const ext = newName.split('.').pop();
      const langMap: Record<string, string> = { 'py': 'python', 'js': 'javascript', 'ts': 'typescript', 'html': 'html', 'css': 'css', 'rs': 'rust', 'cpp': 'cpp' };
      const newFile = {
        id,
        name: newName.trim(),
        type: 'file',
        parentId: creatingInId.parentId,
        language: langMap[ext || ''] || 'text',
        content: ''
      };
      setProjectFiles(prev => [...prev, newFile]);
      if (gitRepo.initialized) {
        setGitRepo(prev => ({ ...prev, modified: [...prev.modified, id] }));
      }
      setActiveFileId(id);
      setEditorContent('');
      setEditorLanguage(newFile.language);
      setEditorMode(newFile.language === 'html' ? 'preview' : 'code');
    } else {
      setProjectFiles(prev => [...prev, {
        id,
        name: newName.trim(),
        type: 'folder',
        parentId: creatingInId.parentId,
        isOpen: true
      }]);
    }
    setCreatingInId(null);
    setNewName('');
  };

  const deleteItem = (id: string) => {
    if (id === 'root') return;
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const toDelete = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      projectFiles.forEach(f => {
        if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
          toDelete.add(f.id);
          changed = true;
        }
      });
    }

    setProjectFiles(prev => prev.filter(f => !toDelete.has(f.id)));
    
    if (gitRepo.initialized) {
      setGitRepo(prev => ({
        ...prev,
        staged: prev.staged.filter(fid => !toDelete.has(fid)),
        modified: prev.modified.filter(fid => !toDelete.has(fid))
      }));
    }
    if (activeFileId === id) setActiveFileId('');
  };

  const toggleFolder = (id: string) => {
    setProjectFiles(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  // Git Functions
  const handleDebugRefactor = async () => {
    if (!debugState.isActive) return;

    let codeToRefactor = editorContent;

    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Analyze and refactor this ${editorLanguage} code. 
The debugger is currently at line ${debugState.currentLine}.
Current variables in scope: ${JSON.stringify(debugState.variables)}.
Current call stack: ${debugState.callStack.join(' -> ')}.

Code to refactor:
${codeToRefactor}

Provide a refactored version that improves quality, fixes potential issues, or optimizes performance. 
Return a JSON object with 'refactoredCode' and 'explanation' fields.`,
        "You are a world-class software architect and debugger. You provide precise refactorings and clear explanations. Always return valid JSON.",
        {
          modelType: 'smart',
          json: true,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refactoredCode: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["refactoredCode", "explanation"]
          }
        }
      );

      const result = JSON.parse(response || '{}');
      setDebugRefactorResult(result);
    } catch (error) {
      console.warn("Debug refactor failed:", error);
      setEditorOutput(prev => prev + `\n[ERROR] Debug refactor failed: ${error}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyDebugRefactor = () => {
    if (!debugRefactorResult) return;
    
    setEditorContent(debugRefactorResult.refactoredCode);
    setDebugRefactorResult(null);
    setEditorOutput(prev => prev + "\n[SYSTEM] AI Refactor applied successfully.");
  };

  const handleGitInit = () => {
    setGitRepo(prev => ({ ...prev, initialized: true, branch: 'main', commits: [], staged: [], modified: projectFiles.filter(f => f.type === 'file').map(f => f.id), stash: [] }));
    setEditorOutput(prev => prev + '[GIT] Initialized empty Neural repository.\n');
  };

  const handleGitStash = () => {
    const dirtyFiles = [...gitRepo.modified, ...gitRepo.staged];
    if (dirtyFiles.length === 0) {
      setEditorOutput(prev => prev + '[GIT] No changes to stash.\n');
      return;
    }

    const stashEntry = dirtyFiles.map(id => {
      const file = projectFiles.find(f => f.id === id);
      return { id, content: file?.content || '' };
    });

    setGitRepo(prev => ({
      ...prev,
      stash: [stashEntry, ...(prev.stash || [])],
      modified: [],
      staged: []
    }));
    
    setEditorOutput(prev => prev + `[GIT] Stashed ${dirtyFiles.length} files.\n`);
  };

  const handleGitPop = () => {
    if (!gitRepo.stash || gitRepo.stash.length === 0) {
      setEditorOutput(prev => prev + '[GIT] No stashes to pop.\n');
      return;
    }

    const [lastStash, ...remainingStashes] = gitRepo.stash;
    
    setProjectFiles(prev => prev.map(file => {
      const stashed = lastStash.find(s => s.id === file.id);
      if (stashed) {
        return { ...file, content: stashed.content };
      }
      return file;
    }));

    setGitRepo(prev => ({
      ...prev,
      stash: remainingStashes,
      modified: [...new Set([...prev.modified, ...lastStash.map(s => s.id)])]
    }));

    setEditorOutput(prev => prev + `[GIT] Popped stash with ${lastStash.length} files.\n`);
  };

  const handleGitStage = (fileId: string) => {
    setGitRepo(prev => ({
      ...prev,
      staged: [...new Set([...prev.staged, fileId])],
      modified: prev.modified.filter(id => id !== fileId)
    }));
  };

  const handleGitUnstage = (fileId: string) => {
    setGitRepo(prev => ({
      ...prev,
      staged: prev.staged.filter(id => id !== fileId),
      modified: [...new Set([...prev.modified, fileId])]
    }));
  };

  const handleGitCommit = () => {
    const message = prompt('Enter commit message:');
    if (!message || gitRepo.staged.length === 0) return;
    
    const newCommit = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: Date.now(),
      author: 'Operator'
    };

    setGitRepo(prev => ({
      ...prev,
      commits: [newCommit, ...prev.commits],
      staged: []
    }));
    setEditorOutput(prev => prev + `[GIT] Committed ${gitRepo.staged.length} files: ${message}\n`);
    setPostCommitModalOpen(true);
  };

  const handleGitPush = async () => {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (!token) {
      setEditorOutput(prev => prev + '[GIT] ERROR: VITE_GITHUB_TOKEN not set.\n');
      return;
    }
    setIsAiProcessing(true);
    setEditorOutput(prev => prev + '[GIT] Pushing to GitHub...\n');
    
    // WARNING: This is a client-side implementation. API keys are exposed in the browser.
    // For production, use a server-side proxy.
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'neural-repo' }),
      });
      if (response.ok) {
        setEditorOutput(prev => prev + '[GIT] Successfully pushed to GitHub.\n');
      } else {
        setEditorOutput(prev => prev + `[GIT] ERROR: Failed to push: ${response.statusText}\n`);
      }
    } catch (e) {
      setEditorOutput(prev => prev + `[GIT] ERROR: Failed to push: ${e}\n`);
    }
    setIsAiProcessing(false);
  };

  const handleGitPull = async () => {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    if (!token) {
      setEditorOutput(prev => prev + '[GIT] ERROR: VITE_GITHUB_TOKEN not set.\n');
      return;
    }
    setIsAiProcessing(true);
    setEditorOutput(prev => prev + '[GIT] Pulling from GitHub...\n');
    
    // WARNING: This is a client-side implementation. API keys are exposed in the browser.
    // For production, use a server-side proxy.
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'GET',
        headers: {
          'Authorization': `token ${token}`,
        },
      });
      if (response.ok) {
        setEditorOutput(prev => prev + '[GIT] Successfully pulled from GitHub.\n');
      } else {
        setEditorOutput(prev => prev + `[GIT] ERROR: Failed to pull: ${response.statusText}\n`);
      }
    } catch (e) {
      setEditorOutput(prev => prev + `[GIT] ERROR: Failed to pull: ${e}\n`);
    }
    setIsAiProcessing(false);
  };

  const handleKnowledgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPacks = Array.from(files).map((file: any, index) => ({
      id: Date.now() + index,
      name: file.name.replace(/\.[^/.]+$/, ""),
      size: (file.size / (1024 * 1024)).toFixed(1) + 'MB',
      status: 'indexing' as const
    }));

    setTnKnowledgePacks(prev => [...prev, ...newPacks]);
    setTerminalOutput(prev => [...prev, `[RAG] Ingesting ${newPacks.length} knowledge vectors...`]);

    // Simulate indexing process
    for (const pack of newPacks) {
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
      setTnKnowledgePacks(prev => prev.map(p => p.id === pack.id ? { ...p, status: 'indexed' as const } : p));
      setTerminalOutput(prev => [...prev, `[SUCCESS] Knowledge Pack '${pack.name}' indexed and ready.`]);
    }
  };

  const handleEditorAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = editorAssistantInput.trim();
    if (!prompt) return;

    setEditorAssistantMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setEditorAssistantInput('');
    setIsAiProcessing(true);

    try {
      const response = await generateAIResponse(
        `Context: Coding in ${editorLanguage}. Current code:\n${editorContent}\n\nUser request: ${prompt}`,
        "You are a world-class coding assistant. Help the user with their code. You can provide code snippets, debug, or explain concepts. Keep responses concise and technical. If you provide a code snippet, wrap it in triple backticks with the language specified.",
        { modelType: 'smart' }
      );
      
      const text = response || 'Process finalized.';
      const codeMatch = text.match(/```[\s\S]*?```/);
      const extractedCode = codeMatch ? codeMatch[0].replace(/```[a-z]*\n|```/g, '') : null;

      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text,
        metadata: extractedCode ? { generatedCode: extractedCode } : undefined
      }]);
    } catch (err) {
      setEditorAssistantMessages(prev => [...prev, { role: 'ai', text: 'CRITICAL ERROR: Neural link failed.' }]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleCodeReview = async () => {
    setIsAiProcessing(true);
    setEditorAssistantMessages(prev => [...prev, { role: 'user', text: 'Perform a code review on the current file.' }]);
    
    try {
      const response = await generateAIResponse(
        `Review the following code for security, performance, and maintainability best practices. Provide a structured review report.\n\nCode:\n${editorContent}`,
        "You are an expert code reviewer. Provide a structured review report covering security, performance, and maintainability. Use markdown for the report.",
        { modelType: 'smart' }
      );
      
      setEditorAssistantMessages(prev => [...prev, { role: 'ai', text: response || 'Code review complete.' }]);
    } catch (err) {
      setEditorAssistantMessages(prev => [...prev, { role: 'ai', text: 'CRITICAL ERROR: Code review failed.' }]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    let cmd = termInput.trim();
    if (!cmd) return;

    let finalCmd = cmd;
    if (isMultiLine) {
      finalCmd = multiLineBuffer + ' ' + cmd.replace(/\\$/, '');
    }

    if (cmd.endsWith('\\') || cmd.endsWith('(') || cmd.endsWith('"') || cmd.endsWith('\'')) {
      setMultiLineBuffer(isMultiLine ? multiLineBuffer + ' ' + cmd.replace(/\\$/, '') : cmd.replace(/\\$/, ''));
      setIsMultiLine(true);
      setTerminalOutput(prev => [...prev, `${currentDir} $ ${cmd} (continuation)`]);
      setTermInput('');
      return;
    }

    setTerminalOutput(prev => [...prev, `${currentDir} $ ${finalCmd}`]);
    setCmdHistory(prev => [finalCmd, ...prev].slice(0, 20));
    setTermInput('');
    setTermSuggestion('');
    setTermSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setHistoryIndex(-1);
    setIsMultiLine(false);
    setMultiLineBuffer('');

    if (finalCmd === 'clear') {
      setTerminalOutput(['Buffer flushed.']);
      return;
    }
    else if (finalCmd === 'help') {
      setTerminalOutput(prev => [...prev, 
        'Available commands:',
        '  clear            - Clear the terminal buffer',
        '  cd <dir>         - Change directory',
        '  ai               - Get AI assistance',
        '  ai <prompt>      - Get AI assistance with a prompt',
        '  gh repo clone <repo> - Clone a repository'
      ]);
      return;
    }
    else if (finalCmd.startsWith('cd ')) {
      const newDir = finalCmd.substring(3).trim();
      if (newDir === '..') {
        const parts = currentDir.split('/');
        if (parts.length > 1) {
          setCurrentDir(parts.slice(0, -1).join('/'));
        }
      } else {
        setCurrentDir(prev => `${prev}/${newDir}`);
      }
      setTerminalOutput(prev => [...prev, `[SYSTEM] Directory shifted to ${newDir}.`]);
    }
    else if (finalCmd === 'ai') await getAiTerminalAssistance('Analyze current system state and suggest relevant commands or actions.');
    else if (finalCmd.startsWith('ai ')) await getAiTerminalAssistance(finalCmd.substring(3));
    else if (finalCmd.startsWith('gh repo clone ')) {
      const repo = finalCmd.replace('gh repo clone ', '');
      if (repo.includes('ToolNeuron')) {
        setTerminalOutput(prev => [...prev, 
          `Cloning into 'ToolNeuron'...`, 
          'remote: Enumerating objects: 4521, done.', 
          'remote: Counting objects: 100% (4521/4521), done.', 
          'remote: Compressing objects: 100% (1240/1240), done.', 
          'Receiving objects: 100% (4521/4521), 12.45 MiB | 8.12 MiB/s, done.', 
          '[SUCCESS] ToolNeuron Source Synchronized.',
          '[SYSTEM] Initializing ToolNeuron Local Environment...',
          '[KERNEL] Mapping neural paths to /data/data/com.termux/files/home/ToolNeuron',
          '[BOOT] ToolNeuron Hub is now available in the primary interface.'
        ]);
        setTimeout(() => setActiveTab('toolneuron'), 2000);
      } else if (repo.includes('TransformerOptimus/SuperAGI')) {
        setTerminalOutput(prev => [...prev, 
          `Cloning into 'SuperAGI'...`, 
          'remote: Enumerating objects: 8542, done.', 
          'remote: Counting objects: 100% (8542/8542), done.', 
          'remote: Compressing objects: 100% (3240/3240), done.', 
          'Receiving objects: 100% (8542/8542), 45.2 MiB | 12.4 MiB/s, done.', 
          '[SUCCESS] SuperAGI repository integrated.',
          '[SYSTEM] Extracting useful autonomous agent core components...'
        ]);
        
        setTimeout(() => {
          setProjectFiles(prev => {
            const newFiles = [
              { id: 'superagi_root', name: 'SuperAGI', type: 'folder', parentId: 'root', isOpen: true },
              { id: 'superagi_agent', name: 'agent', type: 'folder', parentId: 'superagi_root', isOpen: true },
              { id: 'superagi_core', name: 'super_agi.py', type: 'file', parentId: 'superagi_agent', language: 'python', content: 'class SuperAGI:\n    def __init__(self, ai_name, ai_role, llm, memory, tools):\n        self.name = ai_name\n        self.role = ai_role\n        self.llm = llm\n        self.memory = memory\n        self.tools = tools\n\n    def execute(self, goals):\n        print(f"Executing goals for {self.name}...")\n        # Autonomous execution loop\n        for goal in goals:\n            print(f"Processing goal: {goal}")\n            # Tool selection and execution logic here\n        return "Goals completed."' },
              { id: 'superagi_config', name: 'config.yaml', type: 'file', parentId: 'superagi_root', language: 'yaml', content: 'agent:\n  name: "Crimson_AGI"\n  description: "Autonomous neural agent"\n  model: "gpt-4"\n  memory: "vector_db"\ntools:\n  - "file_manager"\n  - "web_search"\n  - "terminal"' },
              { id: 'superagi_main', name: 'main.py', type: 'file', parentId: 'superagi_root', language: 'python', content: 'from agent.super_agi import SuperAGI\n\ndef main():\n    print("Initializing SuperAGI Core...")\n    agent = SuperAGI(\n        ai_name="Optimus",\n        ai_role="Autonomous Developer",\n        llm="gpt-4",\n        memory="local",\n        tools=["search", "code"]\n    )\n    agent.execute(["Analyze system", "Optimize performance"])\n\nif __name__ == "__main__":\n    main()' }
            ];
            return [...prev, ...newFiles];
          });
          setTerminalOutput(prev => [...prev, '[SUCCESS] SuperAGI core files added to the project workspace.']);
        }, 1500);
      } else if (repo.includes('google-deepmind/gemma')) {
        setTerminalOutput(prev => [...prev, 
          `Cloning into 'gemma'...`, 
          'remote: Enumerating objects: 12450, done.', 
          'remote: Counting objects: 100% (12450/12450), done.', 
          'remote: Compressing objects: 100% (4520/4520), done.', 
          'Receiving objects: 100% (12450/12450), 145.2 MiB | 22.4 MiB/s, done.', 
          '[SUCCESS] Gemma repository integrated.',
          '[SYSTEM] Extracting core model architecture and visual components...'
        ]);
        
        setTimeout(() => {
          setProjectFiles(prev => {
            const newFiles = [
              { id: 'gemma_root', name: 'Gemma', type: 'folder', parentId: 'root', isOpen: true },
              { id: 'gemma_core', name: 'core', type: 'folder', parentId: 'gemma_root', isOpen: true },
              { id: 'gemma_model', name: 'model.py', type: 'file', parentId: 'gemma_core', language: 'python', content: 'import torch\nimport torch.nn as nn\n\nclass GemmaModel(nn.Module):\n    def __init__(self, vocab_size, hidden_dim, num_layers):\n        super().__init__()\n        self.embed = nn.Embedding(vocab_size, hidden_dim)\n        self.layers = nn.ModuleList([TransformerBlock(hidden_dim) for _ in range(num_layers)])\n        self.norm = RMSNorm(hidden_dim)\n\n    def forward(self, x):\n        x = self.embed(x)\n        for layer in self.layers:\n            x = layer(x)\n        return self.norm(x)' },
              { id: 'gemma_visuals', name: 'visuals', type: 'folder', parentId: 'gemma_root', isOpen: true },
              { id: 'gemma_attention', name: 'attention_viz.tsx', type: 'file', parentId: 'gemma_visuals', language: 'typescript', content: 'import React from "react";\n\nexport const AttentionVisualizer = ({ attentionWeights }) => {\n  return (\n    <div className="p-4 bg-[#0d0404] border border-red-900/30 rounded-xl">\n      <h3 className="text-red-500 font-black mb-4 uppercase tracking-widest text-xs">Gemma Attention Map</h3>\n      <div className="grid grid-cols-8 gap-1">\n        {attentionWeights.map((weight, i) => (\n          <div \n            key={i} \n            className="w-8 h-8 rounded-sm transition-all hover:scale-110 cursor-crosshair"\n            style={{ backgroundColor: `rgba(239, 68, 68, ${weight})` }}\n            title={`Weight: ${weight.toFixed(3)}`}\n          />\n        ))}\n      </div>\n    </div>\n  );\n};' },
              { id: 'gemma_config', name: 'config.json', type: 'file', parentId: 'gemma_root', language: 'json', content: '{\n  "model_type": "gemma",\n  "vocab_size": 256000,\n  "hidden_size": 2048,\n  "num_hidden_layers": 18,\n  "num_attention_heads": 8,\n  "head_dim": 256,\n  "visualizer_enabled": true\n}' }
            ];
            return [...prev, ...newFiles];
          });
          setTerminalOutput(prev => [...prev, '[SUCCESS] Gemma core and visualizer added to the project workspace.']);
        }, 1500);
      } else {
        const repoName = repo.split('/').pop() || 'repo';
        setTerminalOutput(prev => [...prev, `Cloning into '${repoName}'...`, 'remote: Enumerating objects: 1024, done.', 'remote: Counting objects: 100% (1024/1024), done.', 'remote: Compressing objects: 100% (512/512), done.', 'Receiving objects: 100% (1024/1024), 2.45 MiB | 4.12 MiB/s, done.', '[SUCCESS] Repository integrated into local node.']);
        
        setTimeout(() => {
          setProjectFiles(prev => {
            const repoId = `repo_${Date.now()}`;
            const newFiles = [
              { id: repoId, name: repoName, type: 'folder', parentId: 'root', isOpen: true },
              { id: `${repoId}_readme`, name: 'README.md', type: 'file', parentId: repoId, language: 'markdown', content: `# ${repoName}\n\nCloned repository.` },
              { id: `${repoId}_src`, name: 'src', type: 'folder', parentId: repoId, isOpen: true },
              { id: `${repoId}_index`, name: 'index.js', type: 'file', parentId: `${repoId}_src`, language: 'javascript', content: 'console.log("Hello World");' },
              { id: `${repoId}_package`, name: 'package.json', type: 'file', parentId: repoId, language: 'json', content: `{\n  "name": "${repoName}",\n  "version": "1.0.0",\n  "main": "src/index.js"\n}` }
            ];
            return [...prev, ...newFiles];
          });
          setTerminalOutput(prev => [...prev, `[SUCCESS] ${repoName} files added to the project workspace.`]);
        }, 1500);
      }
    }
    else setTimeout(() => setTerminalOutput(prev => [...prev, `[LOG] Process "${cmd.split(' ')[0]}" integrated with core logic.`]), 300);
  };

  const getAiTerminalAssistance = async (prompt: string) => {
    setIsAiProcessing(true);
    try {
      const systemState = `
Current System State:
- Active Tab: ${activeTab}
- Editor Language: ${editorLanguage}
- Editor Mode: ${editorMode}
- Project Files: ${projectFiles.map(f => f.name).join(', ')}
- Termux Status: ${termuxStatus}
- Ollama Status: ${ollamaStatus}
- Vault Unlocked: ${isVaultUnlocked}
- Swarm Anxiety: ${(swarmAnxiety * 100).toFixed(1)}%
`;

      const response = await generateAIResponse(
        `${systemState}\n\nUser Request: ${prompt}`,
        `Futuristic crimson terminal specialist. ${activePersonality.instruction}. Provide concise, terminal-style responses in simple, easy-to-understand English so that non-experts can easily follow. If the user asks for general help or just types 'ai', suggest relevant commands based on the current system state.`,
        { modelType: 'fast' }
      );
      setTerminalOutput(prev => [...prev, `CORE (${activePersonality.name.toUpperCase()}): ${response}`]);
    } catch (err) { setTerminalOutput(prev => [...prev, `[ERROR] Neural bridge collapsed.`]); } finally { setIsAiProcessing(false); }
  };

  const handleStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = studioInput.trim();
    if (!prompt && !studioRefImage) return;

    setChatMessages(prev => [...prev, { role: 'user', text: prompt || 'Frame-to-Image Generation Requested', timestamp: Date.now() }]);
    setStudioInput('');
    setIsAiProcessing(true);

    try {
      const isImageRequest = studioRefImage || /^\/(image|draw|picture|photo|render)\b/i.test(prompt) || /\b(generate an image|draw a picture|create a photo)\b/i.test(prompt);
      
      const windowSize = 10;
      const recentMessages = chatMessages.slice(-windowSize).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      recentMessages.push({ role: 'user', parts: [{ text: prompt || 'Frame-to-Image Generation Requested' }] });

      const systemInstruction = `${activePersonality.instruction}${chatSummary ? `\n\nCONVERSATION_SUMMARY: ${chatSummary}` : ''}`;

      if (isImageRequest) {
        const parts: any[] = [];
        if (studioRefImage) parts.push({ inlineData: { data: studioRefImage.data, mimeType: studioRefImage.mimeType } });
        parts.push({ text: `POSITIVE: ${prompt}\nNEGATIVE: ${negativePrompt}\nCONFIG: steps=${sdParams.steps}, cfg=${sdParams.cfgScale}, checkpoint=${sdParams.checkpoint}` });

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash', // Fallback to a valid model
          contents: [{ parts }],
          config: { 
            systemInstruction: `You are the Crimson Engine SD Renderer. Output high-impact futuristic visuals. Active personality: ${systemInstruction}`
          }
        });

        // Since we can't actually generate images with this model, we'll just return a text response
        setChatMessages(prev => [...prev, { role: 'ai', text: `[IMAGE_GENERATION_UNAVAILABLE] The requested image generation model is currently offline. Neural directive parsed: ${prompt}`, timestamp: Date.now() }]);
      } else {
        const response = await generateAIResponse(
          recentMessages,
          systemInstruction,
          { modelType: 'fast' }
        );
        setChatMessages(prev => [...prev, { role: 'ai', text: response || 'Process finalized.', timestamp: Date.now() }]);
      }
    } catch (err) { setChatMessages(prev => [...prev, { role: 'ai', text: 'CRITICAL ERROR: Synthesis failure.', timestamp: Date.now() }]); } finally { setIsAiProcessing(false); }
    setStudioRefImage(null);
  };

  const handleTermuxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const upload = e.target.files;
    if (upload) {
      const news = Array.from(upload).map((f: any) => ({ 
        name: f.name, 
        size: (f.size / (1024 * 1024)).toFixed(2) + 'MB', 
        type: 'model',
        category: f.name.endsWith('.safetensors') || f.name.endsWith('.ckpt') ? 'model' : 'asset'
      } as any));
      setTermuxFiles(prev => [...prev, ...news]);
      setTerminalOutput(prev => [...prev, `[STASH] Injected ${news.length} datasets into the crimson stash.`]);
    }
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const commonCommands = ['ls', 'cd', 'cat', 'mkdir', 'rm', 'gh repo clone', 'ai ', 'clear', 'python', 'node', 'git status', 'git commit', 'git push', 'toolneuron start', 'toolneuron status'];

  const handleTermInputChange = (val: string) => {
    setTermInput(val);
    if (!val) {
      setTermSuggestion('');
      setTermSuggestions([]);
      setSelectedSuggestionIndex(-1);
      setHistoryIndex(-1);
      return;
    }
    setHistoryIndex(-1);
    
    const activePersonality = personalities.find(p => p.active);
    const personalitySuggestions = activePersonality ? activePersonality.suggestions : [];
    
    // Context-aware command suggestions with weights
    const suggestionsWithWeights: { cmd: string, weight: number }[] = [
      ...commonCommands.map(c => ({ cmd: c, weight: 1 })),
      ...(activePersonality ? activePersonality.suggestions.map(c => ({ cmd: c, weight: 3 })) : []),
    ];
    
    if (editorLanguage === 'python') {
      suggestionsWithWeights.push({ cmd: 'pip install', weight: 2 }, { cmd: 'pytest', weight: 2 });
    }
    if (editorLanguage === 'javascript' || editorLanguage === 'typescript') {
      suggestionsWithWeights.push({ cmd: 'npm install', weight: 2 }, { cmd: 'npm run dev', weight: 2 });
    }
    
    // Filter and sort (will be used in command completion)
    const sortedSuggestions = suggestionsWithWeights
      .sort((a, b) => b.weight - a.weight || a.cmd.localeCompare(b.cmd))
      .map(s => s.cmd);

    // Get current folder context
    const dirParts = currentDir.split('/');
    const currentFolderName = dirParts[dirParts.length - 1] === '~' ? 'root' : dirParts[dirParts.length - 1];
    
    // Try to find the folder by traversing from root
    let currentFolderId: string | null = 'root';
    if (currentDir !== '~') {
       const folder = projectFiles.find(f => f.name === currentFolderName && f.type === 'folder');
       if (folder) currentFolderId = folder.id;
    }

    const localItems = projectFiles.filter(f => f.parentId === currentFolderId);
    const localFiles = localItems.filter(f => f.type === 'file').map(f => f.name);
    const localFolders = localItems.filter(f => f.type === 'folder').map(f => f.name);
    
    let matches: string[] = [];
    
    // Commands that take file paths
    const fileCommands = ['cat', 'rm', 'edit', 'run', 'compile'];
    
    // Check if user is typing a command or a path
    const parts = val.split(' ');
    if (parts.length === 1) {
      // Command completion (weighted)
      matches = sortedSuggestions.filter(c => c.toLowerCase().startsWith(val.toLowerCase()));
    } else if (fileCommands.includes(parts[0])) {
      // File path completion
      const search = parts.slice(1).join(' ');
      matches = localFiles
        .filter(f => f.toLowerCase().startsWith(search.toLowerCase()))
        .map(f => `${parts[0]} ${f}`);
    } else if (val.startsWith('cd ')) {
      const search = val.substring(3);
      if (search.includes('/')) {
        const parts = search.split('/');
        const folderName = parts[0];
        const subPath = parts.slice(1).join('/');
        const folder = projectFiles.find(f => f.name === folderName && f.type === 'folder' && f.parentId === currentFolderId);
        if (folder) {
          const subItems = projectFiles.filter(f => f.parentId === folder.id);
          matches = subItems
            .filter(f => f.type === 'folder' && f.name.toLowerCase().startsWith(subPath.toLowerCase()))
            .map(f => `cd ${folderName}/${f.name}`);
        }
      } else {
        matches = localFolders
          .filter(f => f.toLowerCase().startsWith(search.toLowerCase()))
          .map(f => `cd ${f}`);
        if (search === '.' || search === '..') matches.push(`cd ${search}`);
      }
    } else if (fileCommands.some(cmd => val.startsWith(`${cmd} `))) {
      const cmd = val.split(' ')[0];
      const search = val.substring(cmd.length + 1);
      
      if (search.includes('/')) {
        const parts = search.split('/');
        const folderName = parts[0];
        const fileName = parts.slice(1).join('/');
        const folder = projectFiles.find(f => f.name === folderName && f.type === 'folder' && f.parentId === currentFolderId);
        if (folder) {
          const subItems = projectFiles.filter(f => f.parentId === folder.id);
          matches = subItems
            .filter(f => f.type === 'file' && f.name.toLowerCase().startsWith(fileName.toLowerCase()))
            .map(f => `${cmd} ${folderName}/${f.name}`);
        }
      } else {
        matches = localFiles
          .filter(f => f.toLowerCase().startsWith(search.toLowerCase()))
          .map(f => `${cmd} ${f}`);
      }
    } else if (val.startsWith('ai ')) {
      const search = val.substring(3);
      const aiCmds = activePersonality.suggestions || [];
      matches = aiCmds
        .filter(cmd => cmd.toLowerCase().startsWith(search.toLowerCase()))
        .map(cmd => `ai ${cmd}`);
    } else {
      // General suggestions
      const allSuggestions = [
        ...commonCommands,
        ...fileCommands.map(c => `${c} `),
        ...(activePersonality.suggestions ? activePersonality.suggestions.map(s => `ai ${s}`) : []),
      ];

      // Add context-aware suggestions based on file types
      if (localFiles.some(f => f.endsWith('.py'))) {
        allSuggestions.push('python3 ');
        localFiles.filter(f => f.endsWith('.py')).forEach(f => allSuggestions.push(`python3 ${f}`));
      }
      if (localFiles.some(f => f.endsWith('.js') || f.endsWith('.ts'))) {
        allSuggestions.push('node ');
        localFiles.filter(f => f.endsWith('.js') || f.endsWith('.ts')).forEach(f => allSuggestions.push(`node ${f}`));
      }

      matches = [...new Set(allSuggestions)].filter(s => s.toLowerCase().startsWith(val.toLowerCase()));
    }
    
    setTermSuggestions(matches);
    
    if (matches.length > 0) {
      const firstMatch = matches[0];
      if (firstMatch.toLowerCase() !== val.toLowerCase()) {
        setTermSuggestion(firstMatch);
      } else {
        setTermSuggestion('');
      }
    } else {
      setTermSuggestion('');
    }
    setSelectedSuggestionIndex(-1);
  };

  const handleTermKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (termSuggestions.length > 0) {
        const nextIndex = (selectedSuggestionIndex + 1) % termSuggestions.length;
        setSelectedSuggestionIndex(nextIndex);
        const selected = termSuggestions[nextIndex];
        setTermInput(selected);
        // Keep suggestions open
        setTermSuggestion(selected);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < cmdHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setTermInput(cmdHistory[nextIdx]);
        setTermSuggestions([]);
        setTermSuggestion('');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setTermInput(cmdHistory[nextIdx]);
        setTermSuggestions([]);
        setTermSuggestion('');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTermInput('');
        setTermSuggestions([]);
        setTermSuggestion('');
      }
    }
  };

  const renderTree = (parentId: string | null, level: number = 0) => {
    const items = projectFiles.filter(f => f.parentId === parentId);
    
    return (
      <>
        {items.map(item => {
          const isModified = gitRepo.modified.includes(item.id);
          const isStaged = gitRepo.staged.includes(item.id);
          const isRenaming = renamingId === item.id;

          return (
            <div key={item.id} className="flex flex-col">
              <div 
                draggable={true}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.id); }}
                onDragOver={(e) => { if (item.type === 'folder') e.preventDefault(); }}
                onDrop={(e) => { if (item.type === 'folder') { e.preventDefault(); const draggedId = e.dataTransfer.getData('text/plain'); moveItem(draggedId, item.id); } }}
                className={`group flex items-center gap-3 px-4 py-2.5 md:py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                  activeFileId === item.id 
                    ? 'bg-red-700 text-white glow-red border border-red-500 scale-[1.02]' 
                    : item.type === 'folder' 
                      ? (item.isOpen ? 'bg-red-950/30 text-red-300 border border-red-900/30 hover:bg-red-900/40 hover:translate-x-1' : 'hover:bg-red-950/20 text-red-800 hover:text-red-400 border border-transparent hover:translate-x-1')
                      : `hover:bg-red-950/20 text-red-900 hover:text-red-500 border border-transparent hover:translate-x-1 ${isModified ? 'border-l-2 border-l-orange-500' : isStaged ? 'border-l-2 border-l-green-500' : ''}`
                }`}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
                onClick={() => item.type === 'folder' ? toggleFolder(item.id) : handleFileSwitch(item.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id });
                }}
              >
                {item.type === 'folder' ? (
                  <div className="flex items-center gap-1.5">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${item.isOpen ? '' : '-rotate-90'}`} />
                    {item.isOpen ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <Folder className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                ) : (
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isModified ? 'text-orange-500' : isStaged ? 'text-green-500' : ''}`} />
                )}
                
                {isRenaming ? (
                  <input
                    autoFocus
                    className="flex-1 bg-red-950/40 border border-red-500/50 rounded px-2 py-0.5 text-white outline-none font-mono text-[10px]"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmRename();
                      if (e.key === 'Escape') { setRenamingId(null); setNewName(''); }
                    }}
                    onBlur={handleConfirmRename}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className={`flex-1 truncate flex items-center gap-2`}>
                    {item.name}
                    {isModified && <Edit2 className="w-3 h-3 text-orange-500 shrink-0" title="Modified" />}
                    {isStaged && <Check className="w-3 h-3 text-green-500 shrink-0" title="Staged" />}
                    {!isModified && !isStaged && item.type === 'file' && <GitBranch className="w-3 h-3 text-gray-700 shrink-0" title="Committed" />}
                  </span>
                )}
                
                {!isRenaming && (
                  <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center gap-1 shrink-0">
                    {item.type === 'folder' && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); createFile(item.id); }} title="New File" className="p-1.5 hover:text-white transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); createFolder(item.id); }} title="New Folder" className="p-1.5 hover:text-white transition-colors"><Folder className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); renameItem(item.id); }} title="Rename" className="p-1.5 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} title="Delete" className="p-1.5 text-red-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              {item.type === 'folder' && item.isOpen && renderTree(item.id, level + 1)}
            </div>
          );
        })}
        
        {creatingInId?.parentId === parentId && (
          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-red-950/20 border border-dashed border-red-500/30"
            style={{ paddingLeft: `${level * 12 + 12}px` }}
          >
            {creatingInId.type === 'folder' ? <Folder className="w-3 h-3 text-red-500" /> : <FileCode className="w-3 h-3 text-red-500" />}
            <input
              autoFocus
              placeholder={creatingInId.type === 'folder' ? "Folder name..." : "File name..."}
              className="flex-1 bg-transparent border-b border-red-500/50 text-white outline-none font-mono text-[10px]"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') { setCreatingInId(null); setNewName(''); }
              }}
              onBlur={handleConfirmCreate}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020204] text-red-100 font-sans selection:bg-red-900/40 overflow-hidden">
      {/* Sidebar Navigation - Hidden on mobile */}
      <nav className="hidden md:flex w-20 border-r border-red-900/30 flex-col items-center py-8 space-y-8 bg-[#080101] z-30 shadow-[10px_0_40px_rgba(153,27,27,0.1)] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(153,27,27,0.05),transparent)] pointer-events-none" />
        <div className="p-3 bg-red-800 rounded-2xl shadow-[0_0_20px_rgba(185,28,28,0.5)] group cursor-pointer hover:rotate-12 transition-transform relative z-10">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 space-y-6 relative z-10">
          <SidebarIcon icon={<Zap />} active={activeTab === 'toolneuron'} onClick={() => setActiveTab('toolneuron')} label="ToolNeuron Hub" />
          <SidebarIcon icon={<TerminalIcon />} active={activeTab === 'terminal'} onClick={() => setActiveTab('terminal')} label="Terminal" />
          <SidebarIcon icon={<Code2 />} active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} label="Neural Editor" />
          <SidebarIcon icon={<LayoutTemplate />} active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} label="Code Analysis" />
          <SidebarIcon icon={<Smartphone />} active={activeTab === 'termux'} onClick={() => setActiveTab('termux')} label="Node Bridge" />
          <SidebarIcon icon={<HardDrive />} active={activeTab === 'storage'} onClick={() => setActiveTab('storage')} label="Data Core" />
        </div>
        <SidebarIcon icon={<SettingsIcon />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="System Config" />
      </nav>

      {/* Bottom Navigation - Visible only on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#080101]/95 backdrop-blur-xl border-t border-red-900/30 flex items-center px-2 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] overflow-x-auto custom-scrollbar gap-2">
        <button onClick={() => setActiveTab('toolneuron')} className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'toolneuron' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}>
          <Zap size={20} />
        </button>
        <button onClick={() => setActiveTab('terminal')} className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'terminal' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}>
          <TerminalIcon size={20} />
        </button>
        <button onClick={() => setActiveTab('editor')} className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'editor' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}>
          <Code2 size={20} />
        </button>
        <button onClick={() => setActiveTab('analysis')} className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'analysis' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}>
          <LayoutTemplate size={20} />
        </button>
        <button onClick={() => setActiveTab('termux')} className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'termux' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}>
          <Smartphone size={20} />
        </button>
        <button onClick={() => setActiveTab('storage')} className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'storage' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}>
          <HardDrive size={20} />
        </button>
        <button onClick={() => setActiveTab('settings')} className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'settings' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}>
          <SettingsIcon size={20} />
        </button>
      </nav>

      {/* Main Interface */}
      <main className="flex-1 flex flex-col min-w-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat pb-16 md:pb-0 overflow-hidden">
        <header className="h-14 md:h-16 border-b border-red-900/30 flex items-center justify-between px-4 md:px-8 bg-[#0a0202]/95 backdrop-blur-xl z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center space-x-3 md:space-x-6">
            <button 
              onClick={() => setIsMobileFileTreeOpen(true)}
              className="lg:hidden p-2 text-red-500 hover:bg-red-900/20 rounded-xl transition-all"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <h1 className="text-[10px] md:text-sm font-black tracking-[0.2em] md:tracking-[0.4em] text-red-500 uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] truncate max-w-[80px] md:max-w-none">{activeTab} node</h1>
            
            {/* Model Selector */}
            <div className="flex items-center gap-1 md:gap-2 bg-red-950/40 border border-red-800/40 rounded-full px-2 md:px-3 py-1">
              <select 
                value={aiProvider}
                onChange={(e) => {
                  const p = e.target.value as 'google' | 'grok' | 'ollama';
                  setAiProvider(p);
                  if (p === 'google') setAiModel('gemini-3.1-pro-preview');
                  else if (p === 'grok') setAiModel('grok-beta');
                  else if (p === 'ollama') setAiModel(ollamaModels[0] || 'llama3');
                }}
                className="bg-transparent text-[8px] md:text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest"
              >
                <option value="google" className="bg-[#0a0202]">Google</option>
                <option value="grok" className="bg-[#0a0202]">Grok</option>
                <option value="ollama" className="bg-[#0a0202]">Ollama</option>
              </select>
              <div className="w-px h-3 bg-red-900/50" />
              {aiProvider === 'ollama' ? (
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest w-24 truncate"
                >
                  {ollamaModels.length > 0 ? ollamaModels.map(m => (
                    <option key={m} value={m} className="bg-[#0a0202]">{m}</option>
                  )) : <option value="llama3" className="bg-[#0a0202]">llama3</option>}
                </select>
              ) : aiProvider === 'google' ? (
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest w-24 truncate"
                >
                  <option value="gemini-3.1-pro-preview" className="bg-[#0a0202]">gemini-3.1-pro</option>
                  <option value="gemini-3.1-flash-preview" className="bg-[#0a0202]">gemini-3.1-flash</option>
                  <option value="gemini-2.5-flash-image" className="bg-[#0a0202]">gemini-2.5-image</option>
                </select>
              ) : (
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest w-24 truncate"
                >
                  <option value="grok-beta" className="bg-[#0a0202]">grok-beta</option>
                  <option value="grok-vision-beta" className="bg-[#0a0202]">grok-vision</option>
                </select>
              )}
            </div>

            {/* Personality Selector */}
            <div className="hidden md:flex items-center gap-2 bg-red-950/40 border border-red-800/40 rounded-full px-3 py-1">
              <UserCircle className="w-4 h-4 text-red-500" />
              <select 
                value={personalities.find(p => p.active)?.id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  setPersonalities(prev => prev.map(pers => ({ ...pers, active: pers.id === id })));
                }}
                className="bg-transparent text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest max-w-[120px] truncate"
              >
                {personalities.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0a0202]">{p.name}</option>
                ))}
              </select>
            </div>

            <div className="px-2 md:px-4 py-1 bg-red-950/40 border border-red-800/40 rounded-full text-[8px] md:text-[10px] text-red-400 font-black flex items-center gap-1.5 md:gap-3">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-pulse glow-red" />
              <span className="truncate max-w-[60px] md:max-w-none">{activePersonality.name.toUpperCase()} ACTIVE</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 md:space-x-8">
             <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-red-400/60 bg-red-950/20 px-4 py-2 rounded-xl border border-red-900/20">
                <Gauge className="w-4 h-4 text-red-600" />
                <span className="font-black tracking-widest">88%</span>
             </div>
             <div className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full ${termuxStatus === 'connected' ? 'bg-red-500 glow-red' : 'bg-red-950/40 border border-red-900/30'}`} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(185,28,28,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(185,28,28,0.2)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          {/* TOOLNEURON HUB */}
          {activeTab === 'toolneuron' && (
            <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
              <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-0 overflow-hidden custom-scrollbar">
                {/* Module Navigation */}
                <div className="w-full lg:w-72 flex flex-col gap-4 md:gap-6 shrink-0">
                  <div className="code-editor-bg rounded-[30px] md:rounded-[40px] border border-red-900/30 p-6 md:p-8 space-y-6 md:space-y-8 shadow-2xl">
                    <div className="space-y-1 md:space-y-2">
                       <h3 className="text-lg md:text-xl font-black text-red-100 uppercase tracking-tighter">ToolNeuron</h3>
                       <p className="text-[9px] md:text-[10px] text-red-900 font-black tracking-[0.3em] uppercase">Offline AI Ecosystem</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
                      {[
                        { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
                        { id: 'vision', label: 'Vision', icon: <ImageIcon className="w-4 h-4" /> },
                        { id: 'knowledge', label: 'Database', icon: <Database className="w-4 h-4" /> },
                        { id: 'vault', label: 'Vault', icon: <ShieldCheck className="w-4 h-4" /> },
                        { id: 'swarm', label: 'Swarm', icon: <Network className="w-4 h-4" /> },
                        { id: 'debug', label: 'Debug', icon: <Bug className="w-4 h-4" /> },
                        { id: 'help', label: 'Guide', icon: <HelpCircle className="w-4 h-4" /> }
                      ].map(mod => (
                        <button 
                          key={mod.id}
                          onClick={() => setTnModule(mod.id as any)}
                          className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${tnModule === mod.id ? 'bg-red-700 text-white shadow-lg scale-[1.02]' : 'bg-red-950/10 text-red-900 hover:text-red-500'}`}
                        >
                          {mod.icon}
                          <span className="truncate">{mod.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-1 code-editor-bg rounded-[40px] border border-red-900/30 p-8 space-y-6 shadow-2xl overflow-y-auto custom-scrollbar">
                     <h4 className="text-[10px] font-black text-red-800 uppercase tracking-[0.4em]">System Status</h4>
                     <div className="space-y-4">
                        <div className="p-4 bg-red-950/10 rounded-2xl border border-red-900/10">
                           <p className="text-[9px] text-red-900 font-black uppercase mb-2">Local Inference</p>
                           <div className="flex items-center justify-between">
                              <span className="text-[11px] text-red-100 font-bold">GGUF_Llama_3</span>
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                           </div>
                        </div>
                        <div className="p-4 bg-red-950/10 rounded-2xl border border-red-900/10">
                           <p className="text-[9px] text-red-900 font-black uppercase mb-2">Vault Encryption</p>
                           <span className="text-[11px] text-red-100 font-bold">AES-256-GCM</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Module Content */}
                <div className="flex-1 code-editor-bg rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden flex flex-col">
                  {tnModule === 'chat' && (
                    <div className="flex-1 flex flex-col min-h-0">
                       <div className="h-16 border-b border-red-900/20 flex items-center px-8 bg-black/40 justify-between">
                          <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                             <MessageSquare className="w-4 h-4" /> Neural Chat Interface
                          </h4>
                          <span className="text-[10px] font-mono text-red-900">LATENCY: 12ms</span>
                       </div>
                       <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                               <div className={`max-w-[80%] rounded-3xl p-6 text-[13px] leading-relaxed ${
                                 msg.role === 'user' 
                                   ? 'bg-red-800 text-white rounded-tr-none' 
                                   : 'bg-red-950/20 border border-red-900/20 text-red-100 rounded-tl-none'
                               }`}>
                                  {msg.type === 'image' ? (
                                    <div className="space-y-4">
                                      <img src={msg.url} alt="Generated" className="w-full rounded-xl border border-red-900/30" />
                                      <p className="text-[10px] font-mono text-red-400 opacity-70">{msg.text}</p>
                                    </div>
                                  ) : (
                                    <div className="markdown-body prose prose-invert prose-red max-w-none">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                               </div>
                            </div>
                          ))}
                       </div>
                       <form onSubmit={handleStudioSubmit} className="p-4 md:p-8 bg-black/40 border-t border-red-900/20">
                          <div className="relative max-w-3xl mx-auto">
                             <input value={studioInput} onChange={(e) => setStudioInput(e.target.value)} placeholder="Send local neural directive..." className="w-full bg-[#0d0404] border border-red-900/40 rounded-2xl px-6 py-4 text-sm text-red-100 focus:border-red-600/60 outline-none" />
                             <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-red-700 rounded-xl text-white">
                                <Send className="w-5 h-5" />
                             </button>
                          </div>
                       </form>
                    </div>
                  )}

                  {tnModule === 'knowledge' && (
                    <div className="flex-1 p-6 md:p-12 space-y-6 md:space-y-10 overflow-y-auto custom-scrollbar">
                       <div className="flex items-center justify-between">
                          <div className="space-y-2">
                             <h3 className="text-2xl font-black text-red-100 uppercase tracking-tighter">Neural RAG Database</h3>
                             <p className="text-sm text-red-900 font-bold tracking-widest">Inject specialized datasets for context-aware inference.</p>
                          </div>
                          <label className="px-6 py-3 bg-red-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg cursor-pointer hover:bg-red-600 transition-all active:scale-95">
                             Inject Pack
                             <input type="file" className="hidden" multiple onChange={handleKnowledgeUpload} accept=".pdf,.txt,.docx,.json,.mht,.csv" />
                          </label>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {tnKnowledgePacks.map(pack => (
                            <div key={pack.id} className="p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[32px] group hover:bg-red-900/10 transition-all relative overflow-hidden">
                               {pack.status === 'indexing' && (
                                 <div className="absolute inset-0 bg-red-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                   <div className="flex flex-col items-center gap-3">
                                     <Zap className="w-8 h-8 text-red-500 animate-pulse" />
                                     <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Indexing Neural Vectors...</span>
                                   </div>
                                 </div>
                               )}
                               <div className="flex items-center gap-6 mb-6">
                                  <div className="p-4 bg-red-900/20 rounded-2xl">
                                     <Database className="w-6 h-6 text-red-500" />
                                  </div>
                                  <div className="flex-1">
                                     <p className="text-[15px] font-black text-red-100 uppercase tracking-tight">{pack.name}</p>
                                     <p className="text-[10px] uppercase tracking-[0.3em] text-red-800 font-black mt-2">{pack.size} • {pack.status}</p>
                                  </div>
                               </div>
                               <div className="flex gap-3">
                                  <button className="flex-1 py-3 bg-red-900/20 text-[10px] font-black uppercase text-red-700 rounded-xl">Re-Index</button>
                                  <button className="p-3 text-red-900 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {tnModule === 'vault' && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {!isVaultUnlocked ? (
                          <div 
                            key="locked"
                            className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 space-y-8 md:space-y-12 text-center transition-all"
                          >
                            <div className="relative">
                              <div className="p-6 md:p-12 bg-red-900/10 rounded-full border border-red-600/20 shadow-[0_0_80px_rgba(185,28,28,0.15)] relative z-10">
                                <ShieldCheck className="w-24 h-24 text-red-600" />
                              </div>
                              {isBiometricVerifying && (
                                <div 
                                  className="absolute left-0 right-0 h-1 bg-red-500 glow-red z-20 animate-[pulse_1.5s_ease-in-out_infinite]"
                                />
                              )}
                            </div>

                            <div className="space-y-4 max-w-md">
                              <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter">
                                {isBiometricVerifying ? 'Scanning Neural Pattern' : vaultStep === 'pin' ? 'Enter Access Code' : 'Memory Vault Locked'}
                              </h3>
                              <p className="text-sm text-red-900 font-bold leading-relaxed uppercase tracking-widest">
                                {vaultError || (isBiometricVerifying ? 'Verifying biometric signature...' : 'Hardware-backed encryption active')}
                              </p>
                            </div>

                            {vaultStep === 'initial' && !isBiometricVerifying && (
                              <div className="flex flex-col gap-4 w-full max-w-xs">
                                <button 
                                  onClick={startBiometric}
                                  className="w-full py-5 bg-red-700 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                  <Fingerprint className="w-5 h-5" />
                                  Biometric Unlock
                                </button>
                                <button 
                                  onClick={() => setVaultStep('pin')}
                                  className="w-full py-5 bg-transparent border border-red-900/30 text-red-600 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] hover:bg-red-900/10 active:scale-95 transition-all"
                                >
                                  Use PIN Code
                                </button>
                              </div>
                            )}

                            {vaultStep === 'pin' && (
                              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex gap-4 justify-center">
                                  {[0, 1, 2, 3].map(i => (
                                    <div 
                                      key={i} 
                                      className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                                        vaultPin.length > i ? 'bg-red-600 border-red-600 scale-125 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'border-red-900/50'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map(key => (
                                    <button
                                      key={key}
                                      onClick={() => {
                                        if (key === 'C') setVaultPin('');
                                        else if (key === '←') setVaultPin(prev => prev.slice(0, -1));
                                        else handleVaultPin(key);
                                      }}
                                      className="w-16 h-16 rounded-2xl bg-red-950/20 border border-red-900/20 flex items-center justify-center font-mono text-xl text-red-100 hover:bg-red-900/40 hover:border-red-600/50 transition-all active:scale-90"
                                    >
                                      {key}
                                    </button>
                                  ))}
                                </div>
                                <button 
                                  onClick={() => { setVaultStep('initial'); setVaultPin(''); }}
                                  className="text-[10px] font-black text-red-900 uppercase tracking-[0.3em] hover:text-red-600 transition-colors"
                                >
                                  Cancel Verification
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div 
                            key="unlocked"
                            className="flex-1 flex flex-col p-6 md:p-12 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter flex items-center gap-4">
                                  <Unlock className="w-8 h-8 text-red-500" />
                                  Vault Decrypted
                                </h3>
                                <p className="text-[10px] text-red-900 font-black uppercase tracking-[0.3em]">Secure Session Active • AES-256-GCM</p>
                              </div>
                              <button 
                                onClick={() => setIsVaultUnlocked(false)}
                                className="px-6 py-3 bg-red-950/30 border border-red-900/30 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/20 transition-all"
                              >
                                Lock Vault
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                              {[
                                { title: 'Neural Weights', desc: 'Optimized Llama-3 8B weights for local inference.', size: '4.8GB', date: '2024-03-20' },
                                { title: 'Personal Dataset', desc: 'Encrypted JSON export of private chat history.', size: '124MB', date: '2024-03-22' },
                                { title: 'Hardware Keys', desc: 'Master recovery keys for crimson-node-01.', size: '2KB', date: '2024-01-15' },
                                { title: 'Vision Assets', desc: 'High-fidelity textures for UI generation.', size: '850MB', date: '2024-03-23' }
                              ].map((item, i) => (
                                <div 
                                  key={i} 
                                  className="p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] space-y-4 group hover:border-red-600/30 transition-all cursor-pointer animate-in fade-in slide-in-from-left-4"
                                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="p-3 bg-red-900/10 rounded-2xl border border-red-900/20 text-red-500 group-hover:scale-110 transition-transform">
                                      <FileCode className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black text-red-900 uppercase tracking-widest">{item.size}</span>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="text-lg font-black text-red-100 uppercase tracking-tight">{item.title}</h4>
                                    <p className="text-xs text-red-100/50 leading-relaxed">{item.desc}</p>
                                  </div>
                                  <div className="pt-4 flex items-center justify-between border-t border-red-900/10">
                                    <span className="text-[9px] font-black text-red-950 uppercase tracking-widest">{item.date}</span>
                                    <Download className="w-4 h-4 text-red-900 hover:text-red-500 transition-colors" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {tnModule === 'vision' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 space-y-6 md:space-y-8 text-center">
                       <div className="p-6 md:p-12 bg-red-900/10 rounded-full border border-red-600/20 shadow-[0_0_60px_rgba(185,28,28,0.1)]">
                          <LayoutTemplate className="w-24 h-24 text-red-600" />
                       </div>
                       <div className="space-y-4 max-w-md">
                          <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter">Code Analysis Engine</h3>
                          <p className="text-sm text-red-900 font-bold leading-relaxed">Side-by-side neural code analysis. Detect vulnerabilities, optimize performance, and refactor architecture instantly.</p>
                       </div>
                       <button onClick={() => setActiveTab('analysis')} className="px-12 py-5 bg-red-700 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Initialize Engine</button>
                    </div>
                  )}

                  {tnModule === 'swarm' && (
                    <div className="flex-1 p-6 md:p-10 space-y-6 md:space-y-10 overflow-y-auto custom-scrollbar">
                       <div className="flex items-center justify-between border-b border-red-900/20 pb-8">
                          <div className="space-y-2">
                             <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter flex items-center gap-5">
                               <Network className="w-8 h-8 text-red-600" /> Neural Swarm Core
                             </h3>
                             <p className="text-sm text-red-900 font-bold tracking-widest uppercase">Biomimetic distributed intelligence & consensus engine</p>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Swarm Anxiety</p>
                                <p className={`text-lg font-mono font-black ${(swarmAnxiety * 100) > 50 ? 'text-red-500' : 'text-red-700'}`}>{(swarmAnxiety * 100).toFixed(1)}%</p>
                             </div>
                             <button 
                               onClick={triggerSwarmCycle}
                               disabled={isAiProcessing}
                               className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                             >
                               <Zap className={`w-4 h-4 ${isAiProcessing ? 'animate-pulse' : ''}`} />
                               {isAiProcessing ? 'Processing...' : 'Trigger Cycle'}
                             </button>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                          {/* Swarm Visualization */}
                          <div className="lg:col-span-2 space-y-6 md:space-y-8">
                             <div className="bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] p-6 md:p-10 relative overflow-hidden h-[300px] md:h-[500px] flex items-center justify-center">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.1)_0%,transparent_70%)]" />
                                <div className="relative w-full h-full">
                                   {swarmAgents.map((agent, i) => {
                                     const angle = (i / swarmAgents.length) * Math.PI * 2;
                                     const x = Math.cos(angle) * 160;
                                     const y = Math.sin(angle) * 160;
                                     return (
                                       <div
                                         key={agent.id}
                                         style={{ 
                                           transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${agent.status === 'active' ? 1.1 : 1})`
                                         }}
                                         className="absolute left-1/2 top-1/2 flex flex-col items-center gap-3 transition-all duration-500"
                                       >
                                          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                            agent.status === 'active' 
                                              ? 'bg-red-600 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.6)]' 
                                              : 'bg-red-950/40 border-red-900/40'
                                          }`}>
                                             <Users className={`w-7 h-7 ${agent.status === 'active' ? 'text-white' : 'text-red-900'}`} />
                                          </div>
                                          <div className="text-center">
                                             <p className="text-[10px] font-black text-red-100 uppercase tracking-tighter">{agent.name}</p>
                                             <p className="text-[8px] font-black text-red-900 uppercase tracking-widest mt-1">{agent.expertise}</p>
                                          </div>
                                       </div>
                                     );
                                   })}
                                   {/* Center Core */}
                                   <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-900/20 rounded-full blur-3xl animate-pulse" />
                                   <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                      <Brain className="w-12 h-12 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                                   </div>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {swarmAgents.map(agent => (
                                  <div key={agent.id} className="p-5 bg-red-950/5 border border-red-900/10 rounded-3xl space-y-3">
                                     <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">Trust</span>
                                        <span className="text-[10px] font-mono text-red-500">{(agent.trust * 100).toFixed(0)}%</span>
                                     </div>
                                     <div className="w-full h-1 bg-red-950/40 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-600" style={{ width: `${agent.trust * 100}%` }} />
                                     </div>
                                     <p className="text-[9px] font-black text-red-100 uppercase truncate">{agent.name}</p>
                                  </div>
                                ))}
                             </div>
                          </div>

                          {/* Swarm Logs */}
                          <div className="bg-[#0a0202] border border-red-900/30 rounded-[30px] md:rounded-[40px] flex flex-col shadow-2xl overflow-hidden h-[400px] md:h-[650px]">
                             <div className="p-4 md:p-8 border-b border-red-900/20 bg-black/40 flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                   <Activity className="w-4 h-4" /> Consensus Stream
                                </h4>
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                             </div>
                             <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar font-mono text-[11px]">
                                {swarmLogs.map(log => (
                                  <div key={log.id} className={`p-4 rounded-2xl border ${
                                    log.type === 'consensus' ? 'bg-green-500/5 border-green-500/20 text-green-500' :
                                    log.type === 'pain' ? 'bg-red-500/5 border-red-500/20 text-red-500' :
                                    'bg-red-950/10 border-red-900/10 text-red-900'
                                  }`}>
                                     <div className="flex justify-between mb-2 opacity-50">
                                        <span>[{log.type.toUpperCase()}]</span>
                                        <span>{log.time}</span>
                                     </div>
                                     <p className="leading-relaxed font-bold">{log.message}</p>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {tnModule === 'debug' && (
                    <div className="flex-1 p-6 md:p-12 space-y-8 md:space-y-10 overflow-y-auto custom-scrollbar">
                       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-2">
                             <h3 className="text-2xl md:text-3xl font-black text-red-100 uppercase tracking-tighter">Neural Debugger</h3>
                             <p className="text-xs md:text-sm text-red-900 font-bold tracking-widest uppercase">Real-time code analysis and dynamic tracing.</p>
                          </div>
                          <div className="flex items-center gap-3">
                             <button 
                               onClick={runStaticAnalysis}
                               disabled={debugAnalysis.static.status === 'running'}
                               className="px-4 md:px-6 py-2.5 md:py-3 bg-red-950/20 border border-red-900/30 text-red-500 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-red-900/20 transition-all disabled:opacity-50"
                             >
                               {debugAnalysis.static.status === 'running' ? 'Analyzing...' : 'Static Analysis'}
                             </button>
                             <button 
                               onClick={runDynamicTracing}
                               disabled={debugAnalysis.tracing.status === 'running'}
                               className="px-4 md:px-6 py-2.5 md:py-3 bg-red-700 text-white rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all disabled:opacity-50"
                             >
                               {debugAnalysis.tracing.status === 'running' ? 'Tracing...' : 'Dynamic Trace'}
                             </button>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                          {/* Static Analysis Results */}
                          <div className="bg-red-950/5 border border-red-900/20 rounded-[30px] md:rounded-[40px] p-6 md:p-8 space-y-6">
                             <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                   <FileSearch className="w-4 h-4" /> Static Analysis
                                </h4>
                                {debugAnalysis.static.status === 'done' && (
                                  <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">{debugAnalysis.static.issues.length} Issues Found</span>
                                )}
                             </div>
                             <div className="space-y-4 min-h-[200px]">
                                {debugAnalysis.static.status === 'idle' && (
                                  <div className="h-full flex flex-col items-center justify-center text-red-950 italic opacity-30 py-12">
                                    <FileSearch className="w-12 h-12 mb-4" />
                                    <p className="text-[10px] uppercase tracking-widest">Awaiting Analysis Directive</p>
                                  </div>
                                )}
                                {debugAnalysis.static.status === 'running' && (
                                  <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                      <div key={i} className="h-12 bg-red-900/10 rounded-xl animate-pulse" />
                                    ))}
                                  </div>
                                )}
                                {debugAnalysis.static.status === 'done' && debugAnalysis.static.issues.map((issue, i) => (
                                  <div key={i} className={`p-4 rounded-2xl border flex items-start gap-4 ${
                                    issue.type === 'error' ? 'bg-red-950/20 border-red-600/30' : 
                                    issue.type === 'warning' ? 'bg-orange-950/10 border-orange-900/20' : 
                                    'bg-blue-950/10 border-blue-900/20'
                                  }`}>
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                      issue.type === 'error' ? 'bg-red-500' : 
                                      issue.type === 'warning' ? 'bg-orange-500' : 
                                      'bg-blue-500'
                                    }`} />
                                    <div className="flex-1 space-y-1">
                                      <p className="text-[12px] text-red-100 font-bold leading-tight">{issue.message}</p>
                                      {issue.line && <p className="text-[9px] text-red-900 uppercase font-black tracking-widest">Line {issue.line}</p>}
                                    </div>
                                  </div>
                                ))}
                             </div>
                          </div>

                          {/* Dynamic Tracing Logs */}
                          <div className="bg-red-950/5 border border-red-900/20 rounded-[30px] md:rounded-[40px] p-6 md:p-8 space-y-6 flex flex-col h-[400px] lg:h-auto">
                             <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                <Activity className="w-4 h-4" /> Dynamic Tracing
                             </h4>
                             <div className="flex-1 bg-black/40 rounded-2xl p-4 font-mono text-[11px] overflow-y-auto custom-scrollbar space-y-2">
                                {debugAnalysis.tracing.logs.length === 0 && debugAnalysis.tracing.status === 'idle' && (
                                  <div className="h-full flex flex-col items-center justify-center text-red-900 opacity-20 italic">
                                    <p>SYSTEM_IDLE: NO_ACTIVE_TRACE</p>
                                  </div>
                                )}
                                {debugAnalysis.tracing.logs.map((log, i) => (
                                  <div key={i} className={log.includes('exception') ? 'text-red-500 font-bold' : 'text-red-100/60'}>
                                    {log}
                                  </div>
                                ))}
                                {debugAnalysis.tracing.status === 'running' && (
                                  <div className="text-red-600 animate-pulse">_</div>
                                )}
                             </div>
                          </div>
                       </div>

                       {/* Refactoring Suggestions */}
                       <div className="bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-8 md:p-12 space-y-6 md:space-y-8 shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                             <div className="space-y-2">
                                <h4 className="text-xl md:text-2xl font-black text-red-100 uppercase tracking-tighter flex items-center gap-4">
                                   <Sparkles className="w-6 h-6 text-red-600" /> Neural Refactoring
                                </h4>
                                <p className="text-xs md:text-sm text-red-900 font-bold tracking-widest uppercase">Automated suggestions from the {activePersonality.name} personality.</p>
                             </div>
                             <button 
                               onClick={getRefactoringSuggestions}
                               disabled={debugAnalysis.refactoring.status === 'running'}
                               className="w-full md:w-auto px-8 py-4 bg-red-800/10 border border-red-700/30 rounded-2xl text-red-500 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-800/20 transition-all disabled:opacity-50"
                             >
                               {debugAnalysis.refactoring.status === 'running' ? 'Synthesizing...' : 'Generate Suggestions'}
                             </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                             {debugAnalysis.refactoring.status === 'idle' && [1, 2, 3].map(i => (
                               <div key={i} className="p-6 bg-red-950/5 border border-red-900/10 rounded-3xl h-32 flex items-center justify-center opacity-20">
                                 <div className="w-full h-2 bg-red-900/20 rounded-full" />
                               </div>
                             ))}
                             {debugAnalysis.refactoring.status === 'running' && [1, 2, 3].map(i => (
                               <div key={i} className="p-6 bg-red-950/5 border border-red-900/10 rounded-3xl h-32 animate-pulse" />
                             ))}
                             {debugAnalysis.refactoring.status === 'done' && debugAnalysis.refactoring.suggestions.map((s, i) => (
                               <div key={i} className="p-6 bg-red-950/10 border border-red-900/20 rounded-3xl hover:border-red-600/40 transition-all group">
                                 <div className="w-8 h-8 bg-red-900/20 rounded-lg flex items-center justify-center text-red-500 font-black text-xs mb-4 group-hover:bg-red-700 group-hover:text-white transition-all">
                                   0{i+1}
                                 </div>
                                 <p className="text-[13px] text-red-100/80 leading-relaxed italic">"{s}"</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {tnModule === 'help' && (
                    <div className="flex-1 p-6 md:p-12 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar">
                       <div className="space-y-4">
                          <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter">Neural Guide</h3>
                          <p className="text-sm text-red-900 font-bold tracking-widest uppercase">Understanding the ToolNeuron Ecosystem</p>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                          <div className="p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] space-y-4">
                             <div className="flex items-center gap-4 text-red-500">
                                <MessageSquare className="w-6 h-6" />
                                <h4 className="text-lg font-black uppercase tracking-tight">Neural Chat</h4>
                             </div>
                             <p className="text-[13px] text-red-100/70 leading-relaxed">
                                High-performance local inference using GGUF models. ToolNeuron utilizes advanced quantization to run large language models directly on your hardware with zero data leakage.
                             </p>
                             <ul className="text-[11px] text-red-900 font-bold space-y-2 uppercase tracking-widest">
                                <li>• Zero Latency Cloud Bridge</li>
                                <li>• Context-Aware Memory</li>
                                <li>• Multi-Persona Support</li>
                             </ul>
                          </div>

                          <div className="p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] space-y-4">
                             <div className="flex items-center gap-4 text-red-500">
                                <LayoutTemplate className="w-6 h-6" />
                                <h4 className="text-lg font-black uppercase tracking-tight">Code Analysis</h4>
                             </div>
                             <p className="text-[13px] text-red-100/70 leading-relaxed">
                                Side-by-side neural code analysis. Detect vulnerabilities, optimize performance, and refactor architecture instantly.
                             </p>
                             <ul className="text-[11px] text-red-900 font-bold space-y-2 uppercase tracking-widest">
                                <li>• Vulnerability Detection</li>
                                <li>• Performance Optimization</li>
                                <li>• Architecture Refactoring</li>
                             </ul>
                          </div>

                          <div className="p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] space-y-4">
                             <div className="flex items-center gap-4 text-red-500">
                                <BookOpen className="w-6 h-6" />
                                <h4 className="text-lg font-black uppercase tracking-tight">Neural Database</h4>
                             </div>
                             <p className="text-[13px] text-red-100/70 leading-relaxed">
                                Advanced RAG (Retrieval-Augmented Generation) system. Inject custom datasets (PDF, TXT, JSON) to provide your local models with specialized domain knowledge.
                             </p>
                             <ul className="text-[11px] text-red-900 font-bold space-y-2 uppercase tracking-widest">
                                <li>• Local Vector Indexing</li>
                                <li>• Semantic Search Engine</li>
                                <li>• Custom Data Injection</li>
                             </ul>
                          </div>

                          <div className="p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] space-y-4">
                             <div className="flex items-center gap-4 text-red-500">
                                <ShieldCheck className="w-6 h-6" />
                                <h4 className="text-lg font-black uppercase tracking-tight">Memory Vault</h4>
                             </div>
                             <p className="text-[13px] text-red-100/70 leading-relaxed">
                                Secure, hardware-encrypted storage for sensitive neural weights and personal datasets. Utilizes AES-256-GCM encryption with biometric authentication.
                             </p>
                             <ul className="text-[11px] text-red-900 font-bold space-y-2 uppercase tracking-widest">
                                <li>• Hardware-Backed Keys</li>
                                <li>• Encrypted File System</li>
                                <li>• Biometric Neural Lock</li>
                             </ul>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TERMINAL */}
          {activeTab === 'terminal' && (
            <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex-1 code-editor-bg rounded-[30px] md:rounded-[40px] border border-red-900/30 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden group relative">
                <div className="flex-1 p-6 md:p-8 font-mono text-[12px] md:text-[14px] overflow-y-auto custom-scrollbar bg-[linear-gradient(rgba(13,4,4,1),rgba(8,1,1,1))]">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className="mb-3 leading-relaxed whitespace-pre-wrap">
                      {renderTerminalLine(line)}
                    </div>
                  ))}
                  {isAiProcessing && (
                    <div className="text-red-600/50 text-[12px] animate-pulse py-4 flex items-center gap-3 font-black tracking-widest">
                      <Zap className="w-4 h-4" />
                      CALCULATING_NEURAL_VECTORS...
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>

                {/* Suggestions List */}
                {termSuggestions.length > 0 && termInput && (
                  <div className="px-6 py-4 bg-[#0a0202] border-t border-red-900/10 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[9px] font-black text-red-900 uppercase tracking-[0.3em]">Neural Suggestions</span>
                      <span className="text-[9px] font-black text-red-950 uppercase tracking-[0.3em]">Press [Tab] to Cycle</span>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap md:overflow-x-auto no-scrollbar gap-2 md:gap-3 pb-2 md:pb-0">
                      {termSuggestions.map((suggestion, idx) => {
                        const isPersonalityMatch = activePersonality.suggestions?.includes(suggestion);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setTermInput(suggestion);
                              setTermSuggestions([]);
                              setTermSuggestion('');
                            }}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-mono text-[10px] md:text-[11px] transition-all flex items-center gap-2 whitespace-nowrap ${
                              selectedSuggestionIndex === idx 
                                ? 'bg-red-700 text-white shadow-[0_0_20px_rgba(185,28,28,0.4)] scale-105 border-red-500' 
                                : 'bg-red-950/10 text-red-900 border border-red-900/20 hover:text-red-500 hover:border-red-500/30'
                            }`}
                          >
                            {isPersonalityMatch && <Sparkles className="w-3 h-3" />}
                            {suggestion}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <form onSubmit={handleTerminalCommand} className="p-6 bg-[#120202] border-t border-red-900/30 flex items-center gap-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] relative">
                   <ChevronRight className="w-6 h-6 text-red-600" />
                   <div className="flex-1 relative">
                     {termSuggestion && (
                       <div className="absolute inset-0 flex items-center pointer-events-none">
                         <span className="font-mono text-base text-red-900 opacity-40">
                           {termInput}
                           {termSuggestion.substring(termInput.length)}
                         </span>
                       </div>
                     )}
                     <input 
                       autoFocus 
                       value={termInput} 
                       onChange={(e) => handleTermInputChange(e.target.value)} 
                       onKeyDown={handleTermKeyDown}
                       placeholder="system@crimson_sh ~ " 
                       className="w-full bg-transparent border-none outline-none font-mono text-base text-red-100 placeholder:text-red-950 relative z-10" 
                     />
                   </div>
                </form>
              </div>
            </div>
          )}

          {/* NEURAL EDITOR */}
          {activeTab === 'editor' && (
            <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-0">
                {/* File Tree Sidebar - Collapsible on mobile */}
                <div className={`fixed inset-0 z-50 lg:relative lg:z-auto w-full lg:w-64 flex flex-col code-editor-bg rounded-none lg:rounded-[40px] border-0 lg:border border-red-900/30 shadow-2xl overflow-hidden transition-all duration-300 ${isMobileFileTreeOpen ? 'flex' : 'hidden lg:flex'}`}>
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
                    {renderTree(null)}
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => createFile('root')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-900/40 border border-dashed border-red-900/20 hover:border-red-500/40 hover:text-red-500 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        New Node
                      </button>
                      <button 
                        onClick={() => createFolder('root')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-900/40 border border-dashed border-red-900/20 hover:border-red-500/40 hover:text-red-500 transition-all"
                      >
                        <Folder className="w-4 h-4" />
                        New Core
                      </button>
                    </div>
                  </div>
                </div>

                {/* Editor Section */}
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
                      {lastSavedTime && (
                        <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black text-red-900 uppercase tracking-widest animate-in fade-in duration-500 shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          <span className="hidden sm:inline">Autosaved at</span> {lastSavedTime}
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
                            <div className="markdown-body prose prose-invert prose-red max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                            {msg.role === 'ai' && (msg.text.includes('CODE_ANALYSIS') || msg.text.includes('FULL_PROJECT_ANALYSIS') || msg.text.includes('DEEP_PROJECT_AUDIT')) && (
                              <button 
                                onClick={() => handleSaveAnalysis(msg.text)}
                                className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-red-900/40 border border-red-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-100 hover:bg-red-800/60 transition-all"
                              >
                                <Save className="w-3 h-3" />
                                Save Report
                              </button>
                            )}
                            {msg.role === 'ai' && msg.text.includes('DOCUMENTATION_GENERATED') && msg.metadata && (
                              <button 
                                onClick={() => handleApplyDocumentation(msg.metadata.documentedCode, msg.metadata.isSelection, msg.metadata.selection)}
                                className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-red-700 border border-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-all"
                              >
                                <FileText className="w-3 h-3" />
                                Apply Documentation
                              </button>
                            )}
                            {msg.role === 'ai' && msg.text.includes('REFACTOR_COMPLETE') && msg.metadata && (
                              <div className="mt-4 space-y-4">
                                <div className="p-3 bg-black/40 rounded-lg border border-red-900/30">
                                  <h6 className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-2">Refactoring Explanation</h6>
                                  <p className="text-[11px] text-red-200/80 leading-relaxed">{msg.metadata.explanation}</p>
                                </div>
                                <button 
                                  onClick={() => handleApplyRefactor(msg.metadata.refactoredCode, msg.metadata.isSelection, msg.metadata.selection)}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-red-700 border border-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-all"
                                >
                                  <Check className="w-3 h-3" />
                                  Apply Refactor
                                </button>
                              </div>
                            )}
                            {msg.role === 'ai' && msg.metadata?.generatedCode && (
                              <button 
                                onClick={() => handleApplyForge(msg.metadata.generatedCode, msg.metadata.isSnippet)}
                                className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-700 border border-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-emerald-600 transition-all"
                              >
                                <Zap className="w-3 h-3" />
                                {msg.metadata.isSnippet ? 'Insert Snippet' : 'Replace File'}
                              </button>
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
                                            setInspectedElement(prev => {
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
                                                setInspectedElement(prev => {
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
                                          value={value}
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
                              <button 
                                onClick={handleGitCommit}
                                disabled={gitRepo.staged.length === 0}
                                className="px-4 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-30"
                              >
                                Commit
                              </button>
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
          )}

          {/* CODE ANALYSIS */}
          {activeTab === 'analysis' && (
            <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-500 bg-[#020204]">
              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Left Pane: Current Code */}
                <div className="flex-1 flex flex-col border-r border-red-900/30">
                  <div className="h-12 border-b border-red-900/30 flex items-center px-4 bg-[#0a0202]">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5" /> Original: {projectFiles.find(f => f.id === activeFileId)?.name || 'No file'}
                    </span>
                  </div>
                  <div className="flex-1 p-4 overflow-auto custom-scrollbar">
                    <pre className="text-xs font-mono text-red-100/80">
                      <code>{editorContent}</code>
                    </pre>
                  </div>
                </div>

                {/* Right Pane: Analysis / Refactored */}
                <div className="flex-1 flex flex-col bg-[#050101]">
                  <div className="h-12 border-b border-red-900/30 flex items-center px-4 bg-[#0a0202]">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> AI Analysis
                    </span>
                  </div>
                  <div className="flex-1 p-4 overflow-auto custom-scrollbar">
                    {isAiProcessing ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-[10px] font-black text-red-700 uppercase tracking-[0.3em]">Analyzing Code Structure...</span>
                      </div>
                    ) : (
                      <div className="text-xs font-mono text-red-100 whitespace-pre-wrap leading-relaxed">
                        {editorOutput || "No analysis generated yet. Enter a prompt below to analyze the current file."}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Bar */}
              <div className="p-4 md:p-6 bg-[#0a0202]/80 border-t border-red-900/20 backdrop-blur-md shrink-0">
                <div className="max-w-5xl mx-auto flex gap-4">
                  <div className="relative flex-1">
                    <input 
                      value={editorAssistantInput} 
                      onChange={(e) => setEditorAssistantInput(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAnalyzeCode();
                        }
                      }}
                      placeholder="E.g., Find security vulnerabilities, optimize performance, or explain this code..." 
                      className="w-full bg-[#0d0404] border border-red-900/40 rounded-xl px-6 py-4 text-xs text-red-100 focus:border-red-600/60 outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]" 
                    />
                  </div>
                  <button 
                    onClick={handleAnalyzeCode} 
                    disabled={isAiProcessing || !editorAssistantInput.trim()} 
                    className="px-8 bg-red-600 rounded-xl text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" /> Analyze
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NODE BRIDGE */}
          {activeTab === 'termux' && (
            <div className="h-full p-4 md:p-10 flex flex-col gap-6 md:gap-10 animate-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar">
               <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
                  <div className="lg:col-span-1 flex flex-col gap-6 md:gap-10">
                     <div className="bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-8 md:p-10 flex flex-col justify-center space-y-6 md:space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group shrink-0">
                        <div className="absolute -bottom-16 -right-16 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-700">
                           <Smartphone className="w-48 md:w-64 h-48 md:h-64 text-red-600" />
                        </div>
                        <div className="space-y-3 md:space-y-4 relative">
                           <h2 className="text-2xl md:text-3xl font-black text-red-100 tracking-tighter uppercase leading-none">Crimson Bridge</h2>
                           <p className="text-[12px] md:text-[13px] text-red-900 leading-relaxed font-bold tracking-tight">Sync mobile hardware with node clusters for low-latency neural inference.</p>
                        </div>
                        <button onClick={() => { setTermuxStatus('connecting'); setTimeout(() => setTermuxStatus('connected'), 1200); }} className="w-full py-4 md:py-6 bg-red-700 hover:bg-red-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-[0_10px_30px_rgba(185,28,28,0.3)] active:scale-95 transition-all">Connect Hub</button>
                     </div>
                     <div className="bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-8 md:p-10 space-y-4 md:space-y-6 shadow-xl shrink-0">
                        <h4 className="text-[11px] md:text-[12px] font-black text-red-800 uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-3"><Activity className="w-4 h-4 md:w-5 md:h-5 text-red-600" /> Node Vitals</h4>
                        <div className="space-y-4 md:space-y-6">
                           <div className="flex justify-between text-[10px] md:text-[11px] font-mono"><span className="text-red-900 font-black">MEM_LOAD:</span><span className="text-red-500 font-black">72%</span></div>
                           <div className="w-full h-2 md:h-2.5 bg-red-950/20 rounded-full overflow-hidden border border-red-900/10"><div className="w-[72%] h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] benchmark-bar" /></div>
                           <div className="flex justify-between text-[10px] md:text-[11px] font-mono"><span className="text-red-900 font-black">THERMALS:</span><span className="text-red-500 font-black">42°C</span></div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="lg:col-span-3 bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-6 md:p-12 flex flex-col space-y-8 md:space-y-10 shadow-2xl relative">
                     <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-red-900/20 pb-6 md:pb-8 gap-6">
                        <div className="space-y-2">
                           <h3 className="text-xl md:text-2xl font-black text-red-100 flex items-center gap-3 md:gap-4 uppercase tracking-tighter"><Network className="w-6 h-6 md:w-7 md:h-7 text-red-600" /> Mobile Model Stash</h3>
                           <p className="text-xs md:text-sm text-red-900 font-bold tracking-widest">Safetensors and LoRA cluster synchronization.</p>
                        </div>
                        <label className="w-full md:w-auto px-5 md:px-6 py-3 md:py-4 bg-red-800/10 border border-red-700/30 rounded-xl md:rounded-2xl cursor-pointer hover:bg-red-800/20 transition-all text-red-500 flex items-center justify-center gap-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-lg">
                           <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span>Sync Model</span>
                           <input type="file" className="hidden" multiple onChange={handleTermuxFileUpload} />
                        </label>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {termuxFiles.length === 0 ? (
                          <div className="col-span-1 md:col-span-2 h-full flex flex-col items-center justify-center text-red-950 italic gap-4 md:gap-6 opacity-30 py-12">
                             <Database className="w-16 h-16 md:w-24 md:h-24" />
                             <p className="uppercase font-black tracking-[0.3em] md:tracking-[0.4em] text-xs md:text-sm">Cluster Stash Empty</p>
                          </div>
                        ) : (
                          termuxFiles.map((f, i) => (
                            <div key={i} className="flex flex-col p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[24px] md:rounded-[32px] group hover:bg-red-900/10 hover:border-red-600/40 transition-all relative overflow-hidden shadow-inner">
                               <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-6 relative z-10">
                                  <div className="p-3 md:p-4 bg-red-900/20 rounded-xl md:rounded-2xl shadow-xl">
                                     {f.category === 'model' ? <HardDrive className="w-5 h-5 md:w-6 md:h-6 text-red-500" /> : <FileCode className="w-5 h-5 md:w-6 md:h-6 text-red-800" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <p className="text-[13px] md:text-[15px] font-black text-red-100 truncate uppercase tracking-tight leading-none">{f.name}</p>
                                     <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-red-800 font-black mt-2">{f.size} • {f.category}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-2 md:gap-3 relative z-10">
                                  <button className="flex-1 py-2.5 md:py-3 bg-red-900/20 hover:bg-red-700 text-[10px] md:text-[11px] font-black uppercase text-red-700 hover:text-white rounded-lg md:rounded-xl transition-all tracking-widest">Initialize</button>
                                  <button onClick={() => setTermuxFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2.5 md:p-3 text-red-900 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                               </div>
                               <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-red-600/[0.03] blur-[40px] md:blur-[50px] rounded-full" />
                            </div>
                          ))
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* DATA CORE / STORAGE */}
          {activeTab === 'storage' && (
            <div className="h-full p-4 md:p-10 flex flex-col gap-6 md:gap-10 animate-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar">
               <div className="flex-1 bg-[#0d0404] rounded-[30px] md:rounded-[50px] border border-red-900/30 p-6 md:p-12 flex flex-col space-y-6 md:space-y-10 shadow-2xl relative overflow-hidden shrink-0">
                  <div className="absolute -top-24 -right-24 w-64 h-64 md:w-96 md:h-96 bg-red-600/5 blur-[100px] rounded-full pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-red-900/20 pb-6 md:pb-8 relative z-10 gap-4">
                     <div className="space-y-2">
                        <h3 className="text-2xl md:text-3xl font-black text-red-100 flex items-center gap-3 md:gap-5 uppercase tracking-tighter">
                          <HardDrive className="w-6 h-6 md:w-8 md:h-8 text-red-600" /> 
                          Neural Data Core
                        </h3>
                        <p className="text-[10px] md:text-sm text-red-900 font-bold tracking-widest uppercase">Hardware-backed document storage & database cluster</p>
                     </div>
                     <label className="px-6 md:px-8 py-3 md:py-4 bg-red-700 text-white rounded-xl md:rounded-2xl cursor-pointer hover:bg-red-600 transition-all flex items-center gap-3 md:gap-4 text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(185,28,28,0.3)] active:scale-95 w-full md:w-auto justify-center">
                        <Upload className="w-4 h-4 md:w-5 md:h-5" /> 
                        <span>Inject Document</span>
                        <input type="file" className="hidden" multiple onChange={handleStorageUpload} accept=".pdf,.doc,.docx,.txt,.mht,.json,.csv" />
                     </label>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                     {storageFiles.length === 0 ? (
                       <div className="col-span-full h-full flex flex-col items-center justify-center text-red-950 italic gap-8 opacity-20">
                          <Database className="w-32 h-32" />
                          <p className="uppercase font-black tracking-[0.5em] text-lg">Data Core Empty</p>
                       </div>
                     ) : (
                       storageFiles.map((f, i) => (
                         <div 
                           key={f.id} 
                           className="flex flex-col p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] group hover:bg-red-900/10 hover:border-red-600/40 transition-all relative overflow-hidden shadow-inner animate-in fade-in slide-in-from-bottom-4"
                           style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                         >
                            <div className="flex items-center justify-between mb-8 relative z-10">
                               <div className="p-4 bg-red-900/20 rounded-2xl shadow-xl text-red-500 group-hover:scale-110 transition-transform">
                                  {f.type === 'pdf' ? <FileText className="w-6 h-6" /> : <FileCode className="w-6 h-6" />}
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] uppercase tracking-[0.3em] text-red-800 font-black">{f.size}</p>
                                  <p className="text-[9px] uppercase tracking-[0.2em] text-red-950 font-black mt-1">{f.date}</p>
                               </div>
                            </div>
                            <div className="flex-1 min-w-0 mb-8 relative z-10">
                               <p className="text-[17px] font-black text-red-100 truncate uppercase tracking-tight leading-tight">{f.name}</p>
                               <p className="text-[10px] uppercase tracking-[0.4em] text-red-900 font-black mt-3">Type: {f.type}</p>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                               <button className="flex-1 py-4 bg-red-900/20 hover:bg-red-700 text-[11px] font-black uppercase text-red-700 hover:text-white rounded-2xl transition-all tracking-[0.2em]">Access</button>
                               <button onClick={() => setStorageFiles(prev => prev.filter(file => file.id !== f.id))} className="p-4 text-red-900 hover:text-red-500 transition-all bg-red-950/20 rounded-2xl"><Trash2 className="w-5 h-5" /></button>
                            </div>
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-600/[0.02] blur-[40px] rounded-full pointer-events-none" />
                         </div>
                       ))
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="h-full p-4 md:p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 bg-[#020204]">
              <div className="max-w-4xl mx-auto space-y-10 md:space-y-16 pb-20">
                <header className="space-y-4 border-b border-red-900/30 pb-8 md:pb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                   <div className="space-y-2">
                      <h2 className="text-3xl md:text-5xl font-black text-red-100 tracking-tighter uppercase leading-none drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">Crimson Core</h2>
                      <p className="text-red-900 text-[11px] md:text-[13px] font-black tracking-[0.2em] uppercase">Architecture & Neural Personalities Control</p>
                   </div>
                   <div className="px-4 md:px-6 py-2 md:py-3 bg-red-950/20 border border-red-900/30 rounded-2xl text-[10px] md:text-[12px] font-mono text-red-600 font-black shadow-inner">SYSTEM_STATE: OPTIMAL</div>
                </header>

                {/* System Theme */}
                <section className="space-y-6 md:space-y-10">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><SettingsIcon className="w-6 h-6 text-red-600" /> System Theme</h3>
                     <button 
                       onClick={toggleTheme}
                       className="px-6 py-3 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/50 hover:text-red-300 transition-all"
                     >
                       {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                     </button>
                   </div>
                </section>

                {/* Personalities */}
                <section className="space-y-6 md:space-y-10">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><Sparkles className="w-6 h-6 text-red-600" /> Neural Archetypes</h3>
                     <div className="flex items-center gap-3">
                       <label className="px-6 py-3 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/50 hover:text-red-300 transition-all flex items-center gap-2 cursor-pointer">
                         <Upload className="w-4 h-4" /> Import JSON
                         <input 
                           type="file" 
                           accept=".json" 
                           className="hidden" 
                           onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (!file) return;
                             const reader = new FileReader();
                             reader.onload = (event) => {
                               try {
                                 const imported = JSON.parse(event.target?.result as string);
                                 if (Array.isArray(imported)) {
                                   const newPersonalities = imported.map((p, i) => ({
                                     id: Date.now() + i,
                                     name: p.name || 'Unknown Archetype',
                                     instruction: p.instruction || '',
                                     active: false,
                                     suggestions: p.suggestions || ['analyze', 'process']
                                   }));
                                   setPersonalities(prev => [...prev, ...newPersonalities]);
                                 }
                               } catch (err) {
                                 console.error("Failed to parse JSON", err);
                               }
                             };
                             reader.readAsText(file);
                           }} 
                         />
                       </label>
                       <button onClick={() => setIsCustomPersonalityModalOpen(true)} className="px-6 py-3 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/50 hover:text-red-300 transition-all flex items-center gap-2">
                         <Plus className="w-4 h-4" /> Custom Archetype
                       </button>
                     </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                      {personalities.map(p => (
                        <div key={p.id} onClick={() => setPersonalities(prev => prev.map(pers => ({ ...pers, active: pers.id === p.id })))} className={`p-6 md:p-10 rounded-[20px] md:rounded-[40px] border transition-all cursor-pointer group relative overflow-hidden ${p.active ? 'bg-red-900/10 border-red-600/50 shadow-[0_20px_60px_rgba(153,27,27,0.2)] scale-[1.03]' : 'bg-[#0a0202] border-red-900/20 hover:border-red-900/60 hover:scale-[1.01]'}`}>
                           <div className="flex items-center justify-between mb-8 relative z-10">
                              <div className="flex items-center gap-5"><UserCircle className={`w-10 h-10 ${p.active ? 'text-red-500' : 'text-red-950'}`} /><span className="text-lg font-black text-red-100 tracking-tighter uppercase">{p.name}</span></div>
                              {p.active && <ShieldCheck className="w-6 h-6 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />}
                           </div>
                           <textarea 
                              value={p.instruction} 
                              onChange={(e) => setPersonalities(prev => prev.map(pers => pers.id === p.id ? { ...pers, instruction: e.target.value } : pers))} 
                              onClick={(e) => e.stopPropagation()} 
                              className="w-full bg-black/60 border border-red-950 rounded-[24px] p-5 text-[12px] text-red-100/60 font-mono h-48 resize-none outline-none focus:border-red-600/30 transition-all leading-relaxed shadow-inner" 
                           />
                           {p.active && <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full pointer-events-none" />}
                        </div>
                      ))}
                   </div>
                </section>

                {/* AI Provider Settings */}
                <section className="space-y-6 md:space-y-10">
                   <h3 className="text-[10px] md:text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><Network className="w-5 h-5 md:w-6 md:h-6 text-red-600" /> Neural Provider Configuration</h3>
                   <div className="bg-[#0a0202] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-6 md:p-10 space-y-6 md:space-y-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
                      <div className="space-y-4 relative z-10">
                         <h4 className="text-lg md:text-xl font-black text-red-100 tracking-tighter uppercase leading-none">Grok API Key</h4>
                         <p className="text-[10px] md:text-xs text-red-900 font-bold tracking-[0.1em]">Required for xAI Grok integration. Stored locally.</p>
                         <input 
                            type="password"
                            value={grokApiKey}
                            onChange={(e) => setGrokApiKey(e.target.value)}
                            placeholder="xai-..."
                            className="w-full bg-black/60 border border-red-950 rounded-[16px] md:rounded-[20px] p-3 md:p-4 text-xs md:text-sm text-red-100 font-mono outline-none focus:border-red-600/50 transition-all shadow-inner"
                         />
                      </div>
                   </div>
                </section>

                {/* Logic Injection */}
                <section className="space-y-6 md:space-y-10">
                   <h3 className="text-[10px] md:text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><Brain className="w-5 h-5 md:w-6 md:h-6 text-red-600" /> Core Synthesis Injection</h3>
                   <div className="bg-[#0a0202] rounded-[30px] md:rounded-[50px] border border-red-900/30 p-6 md:p-14 space-y-8 md:space-y-14 shadow-[0_20px_60px_rgba(0,0,0,0.8)] md:shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 md:p-20 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-1000 pointer-events-none">
                         <Network className="w-[200px] h-[200px] md:w-[500px] md:h-[500px] text-red-600" />
                      </div>

                      <div className="flex flex-col md:flex-row items-start justify-between relative z-10 gap-6">
                         <div className="space-y-2 md:space-y-4">
                            <h4 className="text-xl md:text-3xl font-black text-red-100 tracking-tighter uppercase leading-none">Crimson Neural Fabric</h4>
                            <p className="text-[10px] md:text-base text-red-900 font-bold tracking-[0.1em]">Inject logic kernels or data trees to refine autonomous model control.</p>
                         </div>
                         <div className="flex flex-wrap md:flex-nowrap bg-red-950/20 p-2 rounded-2xl border border-red-900/20 gap-2 w-full md:w-auto">
                            {['python', 'kotlin', 'nodejs'].map(r => (
                              <button key={r} onClick={() => setBrainConfig({...brainConfig, runtime: r})} className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-xl text-[10px] md:text-[12px] font-black uppercase transition-all tracking-[0.2em] md:tracking-[0.3em] ${brainConfig.runtime === r ? 'bg-red-700 text-white shadow-[0_0_20px_rgba(185,28,28,0.5)]' : 'text-red-900 hover:text-red-600'}`}>{r}</button>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 relative z-10">
                         <div className="lg:col-span-2 space-y-4 md:space-y-5">
                            <label className="text-[10px] md:text-[12px] font-black text-red-800 uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center gap-3 md:gap-4"><Code2 className="w-4 h-4 md:w-5 md:h-5" /> Logic Manifest</label>
                            <textarea value={brainConfig.logic} onChange={(e) => setBrainConfig({...brainConfig, logic: e.target.value})} placeholder="Initialize system with core logic strings..." className="w-full h-64 md:h-96 bg-black/80 border border-red-950 rounded-[20px] md:rounded-[40px] p-6 md:p-10 text-[12px] md:text-[14px] font-mono text-red-500 outline-none focus:border-red-600/50 resize-none custom-scrollbar shadow-[inset_0_4px_20px_rgba(0,0,0,0.9)]" />
                         </div>
                         <div className="space-y-4 md:space-y-5">
                            <label className="text-[10px] md:text-[12px] font-black text-red-800 uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center gap-3 md:gap-4"><FileSearch className="w-4 h-4 md:w-5 md:h-5" /> Data Anchors</label>
                            {!brainRefFile ? (
                              <label className="flex flex-col items-center justify-center h-64 md:h-96 border-4 border-dashed border-red-950 rounded-[20px] md:rounded-[40px] cursor-pointer hover:border-red-600/40 hover:bg-red-950/10 transition-all group/up">
                                <Plus className="w-10 h-10 md:w-16 md:h-16 text-red-950 group-hover/up:scale-110 group-hover/up:text-red-600 transition-all mb-4 md:mb-8" />
                                <span className="text-[12px] md:text-[15px] text-red-900 font-black uppercase text-center px-6 md:px-10 leading-tight tracking-[0.1em] md:tracking-[0.2em]">Deploy Neural Database<br/><span className="text-[9px] md:text-[11px] opacity-40 font-mono mt-2 md:mt-4 block tracking-[0.3em] md:tracking-[0.5em]">SYSTEM_INGESTION_PENDING</span></span>
                                <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if(f) setBrainRefFile({ name: f.name, data: await fileToBase64(f), mimeType: f.type });
                                }} />
                              </label>
                            ) : (
                              <div className="h-64 md:h-96 bg-red-900/5 border border-red-600/30 rounded-[20px] md:rounded-[40px] p-6 md:p-12 flex flex-col items-center justify-center text-center space-y-6 md:space-y-10 relative group/staged animate-in zoom-in-95 shadow-2xl backdrop-blur-md">
                                 <div className="p-6 md:p-8 bg-red-600/10 rounded-[30px] md:rounded-[50px] shadow-[0_0_30px_rgba(220,38,38,0.2)]"><BookOpen className="w-12 h-12 md:w-20 md:h-20 text-red-500" /></div>
                                 <div className="space-y-3 md:space-y-4">
                                    <p className="text-sm md:text-lg font-black text-red-100 truncate max-w-[200px] md:max-w-[240px] uppercase tracking-tighter">{brainRefFile.name}</p>
                                    <p className="text-[9px] md:text-[11px] text-red-500 font-mono tracking-[0.3em] md:tracking-[0.5em] uppercase font-black px-4 md:px-6 py-1.5 md:py-2 bg-red-600/10 rounded-full border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.3)]">SYNC_READY</p>
                                 </div>
                                 <button onClick={() => setBrainRefFile(null)} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3.5 bg-red-900/10 text-red-600 rounded-2xl md:rounded-3xl opacity-100 md:opacity-0 group-hover/staged:opacity-100 transition-all hover:bg-red-600 hover:text-white shadow-2xl"><Trash2 className="w-5 h-5 md:w-6 md:h-6" /></button>
                              </div>
                            )}
                         </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-12 pt-8 md:pt-14 relative z-10 border-t border-red-900/20">
                         <div className="flex-1 w-full space-y-4 md:space-y-6">
                            <h4 className="text-[10px] md:text-[12px] font-black text-red-800 uppercase tracking-[0.3em] md:tracking-[0.5em] flex items-center gap-3 md:gap-4"><Database className="w-4 h-4 md:w-5 md:h-5" /> Virtual Core Mounts</h4>
                            <div className="flex flex-wrap gap-2 md:gap-4">
                               {brainConfig.mappedPaths.map((p, i) => <div key={i} className="px-4 md:px-6 py-2 md:py-3 bg-red-950/20 border border-red-900/20 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-mono text-red-900 font-black hover:text-red-500 transition-colors cursor-crosshair">{p}</div>)}
                            </div>
                         </div>
                         <button 
                            onClick={async () => {
                              if (!brainConfig.logic.trim() && !brainRefFile) return;
                              setIsAiProcessing(true);
                              setTerminalOutput(prev => [...prev, `[KERNEL] Initializing crimson neural fabric...`]);
                              try {
                                const response = await generateAIResponse(
                                  `Logic: ${brainConfig.logic}\n\nTask: Output a futuristic crimson directory tree for this logic and 3 setup commands.`,
                                  activePersonality.instruction,
                                  { modelType: 'smart' }
                                );
                                setTerminalOutput(prev => [...prev, `[CORE] Matrix Synchronized:`, response || 'Process Ready.', `[SYSTEM] Crimson Node Online.`]);
                                setActiveTab('terminal');
                              } catch(e) {} finally { setIsAiProcessing(false); }
                            }}
                            disabled={isAiProcessing || (!brainConfig.logic && !brainRefFile)} 
                            className="w-full md:w-auto py-4 md:py-8 px-8 md:px-16 bg-red-700 hover:bg-red-600 text-white rounded-[20px] md:rounded-[40px] font-black flex items-center justify-center gap-4 md:gap-6 shadow-[0_30px_70px_rgba(185,28,28,0.4)] active:scale-95 transition-all disabled:opacity-50 group/btn relative overflow-hidden"
                         >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[size:200%_200%] animate-shimmer" />
                            <Power className={`w-10 h-10 transition-transform group-hover/btn:scale-110 drop-shadow-[0_0_10px_white] ${isAiProcessing ? 'animate-spin' : ''}`} />
                            <div className="text-left relative z-10">
                               <p className="text-xl font-black uppercase tracking-tighter">Execute Boot</p>
                               <p className="text-[11px] font-mono opacity-60 uppercase tracking-[0.4em] mt-2 font-black">NEURAL_CORE_OVERLOAD</p>
                            </div>
                         </button>
                      </div>
                   </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Custom Personality Modal */}
      {isCustomPersonalityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0d0404] border border-red-900/30 rounded-[30px] md:rounded-[40px] shadow-[0_0_100px_rgba(185,28,28,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-red-900/20 bg-black/40 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-black text-red-100 uppercase tracking-tighter">Define Custom Archetype</h3>
                <p className="text-[10px] md:text-xs text-red-900 font-bold tracking-widest uppercase">Inject new neural parameters into the core</p>
              </div>
              <button onClick={() => setIsCustomPersonalityModalOpen(false)} className="p-3 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all shrink-0 ml-4">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-widest">Archetype Designation (Name)</label>
                <input 
                  value={newPersonalityName}
                  onChange={(e) => setNewPersonalityName(e.target.value)}
                  placeholder="e.g., Code-Ninja"
                  className="w-full bg-[#050101] border border-red-900/40 rounded-xl px-5 py-4 text-sm text-red-100 focus:border-red-600/60 outline-none transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-widest">Core Directive (System Instruction)</label>
                <textarea 
                  value={newPersonalityInstruction}
                  onChange={(e) => setNewPersonalityInstruction(e.target.value)}
                  placeholder="You are an expert in..."
                  className="w-full bg-[#050101] border border-red-900/40 rounded-xl px-5 py-4 text-sm text-red-100 focus:border-red-600/60 outline-none transition-all h-32 resize-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-widest">Suggested Commands (Comma separated)</label>
                <input 
                  value={newPersonalitySuggestions}
                  onChange={(e) => setNewPersonalitySuggestions(e.target.value)}
                  placeholder="e.g., refactor, optimize, test"
                  className="w-full bg-[#050101] border border-red-900/40 rounded-xl px-5 py-4 text-sm text-red-100 focus:border-red-600/60 outline-none transition-all"
                />
              </div>
            </div>
            <div className="p-6 md:p-8 border-t border-red-900/20 bg-black/40 flex justify-end shrink-0">
              <button 
                disabled={!newPersonalityName || !newPersonalityInstruction}
                onClick={() => {
                  const newPers = {
                    id: Date.now(),
                    name: newPersonalityName,
                    instruction: newPersonalityInstruction,
                    active: false,
                    suggestions: newPersonalitySuggestions.split(',').map(s => s.trim()).filter(Boolean)
                  };
                  setPersonalities(prev => [...prev, newPers]);
                  setNewPersonalityName('');
                  setNewPersonalityInstruction('');
                  setNewPersonalitySuggestions('');
                  setIsCustomPersonalityModalOpen(false);
                }}
                className="px-8 py-4 bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-red-600 transition-all"
              >
                Inject Archetype
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Commit Modal */}
      {postCommitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0d0404] border border-red-900/30 rounded-[30px] shadow-[0_0_100px_rgba(185,28,28,0.2)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-red-900/20 bg-black/40 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-red-100 uppercase tracking-tighter">Commit Successful</h3>
                <p className="text-[10px] text-red-900 font-bold tracking-widest uppercase">Local state synchronized</p>
              </div>
              <button onClick={() => setPostCommitModalOpen(false)} className="p-2 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all shrink-0 ml-4">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-red-100/70">Would you like to synchronize your changes with the remote neural uplink?</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setPostCommitModalOpen(false);
                    handleGitPush();
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

      {/* Generate Code Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0d0404] border border-red-900/30 rounded-[30px] md:rounded-[40px] shadow-[0_0_100px_rgba(185,28,28,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-red-900/20 bg-black/40 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-black text-red-100 uppercase tracking-tighter">Neural Forge</h3>
                <p className="text-[10px] md:text-xs text-red-900 font-bold tracking-widest uppercase">Describe desired functionality to generate code</p>
              </div>
              <button onClick={() => setIsGenerateModalOpen(false)} className="p-3 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all shrink-0 ml-4">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-[0.3em]">Generation Mode</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setGenerateMode('snippet')}
                    className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${generateMode === 'snippet' ? 'bg-red-700 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-red-950/20 border-red-900/30 text-red-500 hover:bg-red-900/40'}`}
                  >
                    Snippet (Insert)
                  </button>
                  <button 
                    onClick={() => setGenerateMode('file')}
                    className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${generateMode === 'file' ? 'bg-red-700 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-red-950/20 border-red-900/30 text-red-500 hover:bg-red-900/40'}`}
                  >
                    New File
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-[0.3em]">Prompt</label>
                <textarea 
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder={generateMode === 'file' ? "e.g., Create a React component named UserProfile that fetches user data..." : "e.g., Write a function to sort an array of objects by a specific key..."}
                  className="w-full h-32 bg-black/60 border border-red-900/40 rounded-2xl p-4 text-xs text-red-100 focus:border-red-500/50 outline-none transition-all resize-none custom-scrollbar"
                />
              </div>
            </div>
            <div className="p-6 md:p-8 border-t border-red-900/20 bg-black/40 flex justify-end shrink-0">
              <button 
                onClick={executeGenerateCode}
                disabled={!generatePrompt.trim() || isAiProcessing}
                className="px-8 py-3 bg-red-600 rounded-xl text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Materialize Code
              </button>
            </div>
          </div>
        </div>
      )}

      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-[#0d0404] border border-red-900/30 rounded-[30px] md:rounded-[60px] shadow-[0_0_100px_rgba(185,28,28,0.2)] overflow-hidden flex flex-col max-h-[90vh] md:max-h-[80vh]">
            <div className="p-4 md:p-12 border-b border-red-900/20 bg-black/40 flex items-center justify-between shrink-0">
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-xl md:text-3xl font-black text-red-100 uppercase tracking-tighter">Initialize Neural Project</h3>
                <p className="text-[10px] md:text-sm text-red-900 font-bold tracking-widest uppercase">Select a predefined template to begin your development cycle</p>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} className="p-3 md:p-4 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all shrink-0 ml-4">
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {(Object.keys(PROJECT_TEMPLATES) as Array<keyof typeof PROJECT_TEMPLATES>).map(key => (
                  <button 
                    key={key}
                    onClick={() => handleLoadTemplate(key)}
                    className="group p-4 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] text-left space-y-4 md:space-y-6 hover:bg-red-900/10 hover:border-red-500/40 transition-all active:scale-95"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      {key === 'python-web' && <Network className="w-6 h-6 md:w-8 md:h-8" />}
                      {key === 'rust-cli' && <TerminalIcon className="w-6 h-6 md:w-8 md:h-8" />}
                      {key === 'neural-module' && <Brain className="w-6 h-6 md:w-8 md:h-8" />}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg md:text-xl font-black text-red-100 uppercase tracking-tight">{PROJECT_TEMPLATES[key].name}</h4>
                      <p className="text-[10px] md:text-[11px] text-red-900 font-bold uppercase tracking-widest leading-relaxed">
                        {key === 'python-web' ? 'Full-stack Flask environment with HTML/CSS integration.' : 
                         key === 'rust-cli' ? 'High-performance CLI tool architecture with Cargo config.' : 
                         'Modular neural logic with JSON configuration.'}
                      </p>
                    </div>
                    <div className="pt-4 flex items-center gap-3 text-[10px] font-black text-red-500 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                      Initialize Matrix <Zap className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 md:p-12 bg-black/40 border-t border-red-900/20 text-center shrink-0">
              <p className="text-[9px] md:text-[10px] text-red-900 font-black uppercase tracking-[0.4em]">Crimson OS Neural Development Environment v4.1.0_EX</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050101; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(153, 27, 27, 0.4); border-radius: 40px; border: 2px solid #050101; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(220, 38, 38, 0.6); }
        .animate-in { animation: var(--anim-name) var(--anim-duration, 500ms) cubic-bezier(0.16, 1, 0.3, 1); }
        .fade-in { --anim-name: fade-in; }
        .zoom-in-95 { --anim-name: zoom-in-95; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .animate-bounce { animation: bounce 0.6s infinite ease-in-out; }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer { animation: shimmer 3s infinite linear; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        input[type=range] {
           -webkit-appearance: none;
           background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
           -webkit-appearance: none;
           height: 24px;
           width: 24px;
           border-radius: 50%;
           background: #ef4444;
           cursor: pointer;
           margin-top: -8px;
           box-shadow: 0 0 20px rgba(239,68,68,0.8);
           border: 4px solid #000;
        }
        input[type=range]::-webkit-slider-runnable-track {
           width: 100%;
           height: 8px;
           cursor: pointer;
           background: rgba(153,27,27,0.2);
           border-radius: 20px;
           border: 1px solid rgba(153,27,27,0.3);
        }
      `}</style>
      
      {contextMenu && (
        <div 
          className="fixed z-[9999] bg-black/90 border border-red-900/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col py-1">
            <button 
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-950/40 hover:text-red-400 transition-colors text-left"
              onClick={() => {
                if (contextMenu.itemId) renameItem(contextMenu.itemId);
                setContextMenu(null);
              }}
            >
              <Edit2 className="w-4 h-4" /> Rename
            </button>
            <button 
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-900/40 hover:text-red-400 transition-colors text-left border-t border-red-900/20"
              onClick={() => {
                if (contextMenu.itemId) deleteItem(contextMenu.itemId);
                setContextMenu(null);
              }}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarIcon: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void; label: string }> = ({ icon, active, onClick, label }) => (
  <button onClick={onClick} className={`group relative p-4 rounded-[28px] transition-all duration-500 ${active ? 'text-red-500 bg-red-950/20 border border-red-700/50 shadow-[0_0_40px_rgba(220,38,38,0.2)] scale-110 rotate-3' : 'text-red-950 hover:text-red-600 hover:bg-red-950/10 hover:scale-105'}`}>
    {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: active ? 3 : 2 })}
    <div className="absolute left-20 bg-red-950 text-red-500 text-[11px] py-2 px-5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-red-800/40 z-50 translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-black uppercase tracking-[0.4em] backdrop-blur-md">{label}</div>
  </button>
);

const container = document.getElementById('root');
if (container) {
  const root = (container as any)._reactRoot || createRoot(container);
  (container as any)._reactRoot = root;
  root.render(<App />);

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  }
}
