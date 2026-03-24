
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
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
  Link as LinkIcon,
  Download,
  Plus,
  Layers,
  Maximize2,
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
  Radio,
  Power,
  Play,
  HelpCircle,
  Bug,
  StepForward,
  PlayCircle,
  StopCircle,
  Circle,
  Folder,
  MoreVertical,
  Edit2,
  ChevronDown,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  History,
  Check,
  LayoutTemplate,
  Archive,
  Wand2,
  Fingerprint,
  Scan,
  Lock,
  Unlock,
  Users,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import Editor from '@monaco-editor/react';

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

const App: React.FC = () => {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

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
  const [activeTab, setActiveTab] = useState<'terminal' | 'studio' | 'termux' | 'storage' | 'settings' | 'editor' | 'toolneuron'>('toolneuron');
  
  // ToolNeuron State
  const [tnModule, setTnModule] = useState<'chat' | 'vision' | 'knowledge' | 'vault' | 'swarm' | 'help'>('chat');
  const [tnKnowledgePacks, setTnKnowledgePacks] = useState([
    { id: 1, name: 'Medical_Core_v2', size: '1.2GB', status: 'indexed' },
    { id: 2, name: 'Legal_Archive_2025', size: '850MB', status: 'indexed' }
  ]);

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
  const [editorOutput, setEditorOutput] = useState('');
  const [editorMode, setEditorMode] = useState<'code' | 'preview' | 'debug' | 'git' | 'settings'>('code');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isEditorAssistantOpen, setIsEditorAssistantOpen] = useState(false);
  const [editorAssistantInput, setEditorAssistantInput] = useState('');
  const [editorAssistantMessages, setEditorAssistantMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [cursorLine, setCursorLine] = useState(1);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
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
    envVariables: [
      { key: 'NEURAL_MODE', value: 'production' },
      { key: 'BRAIN_CORE_COUNT', value: '128' }
    ]
  });
  
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
  const [personalities, setPersonalities] = useState([
    { id: 1, name: 'Architect', instruction: 'You are a cold, logical, and highly efficient system architect. You provide precise terminal directives.', active: true, suggestions: ['sys_audit', 'net_scan', 'core_reboot', 'status_check'] },
    { id: 2, name: 'Claude-Code', instruction: 'You are a world-class coding assistant with deep expertise in Python, C++, Rust, and Java. You focus on clean, efficient, and secure code.', active: false, suggestions: ['analyze_refactor', 'debug_trace', 'optimize_neural', 'lint_check'] },
    { id: 3, name: 'Vanguard', instruction: 'You are an aggressive creative specialist. You push the boundaries of artistic generation with high-impact prompts.', active: false, suggestions: ['style_inject', 'prompt_warp', 'render_ultra', 'asset_gen'] },
    { id: 4, name: 'Memory Vault Guardian', instruction: 'You are a vigilant guardian of the Memory Vault, ensuring all data is secure and accessible only through authorized biometric or PIN verification. Prioritize data integrity and access control above all else.', active: false, suggestions: ['vault_lock', 'biometric_scan', 'pin_verify', 'integrity_check'] }
  ]);

  // --- NON-PERSISTENT STATE ---
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'CRIMSON OS v4.1.0_KORE_BOOT',
    'Kernel: Android-SD Neural Link Established',
    'Voltage stable. Hyper-threaded nodes online.'
  ]);
  const [termInput, setTermInput] = useState('');
  const [termSuggestion, setTermSuggestion] = useState('');
  const [termSuggestions, setTermSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState('~/crimson-node/sd-webui');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string, type?: 'text' | 'image', url?: string, timestamp: number }[]>([
    { role: 'ai', text: 'Neural Interface Active. Stable Diffusion engine synchronized with local hardware.', timestamp: Date.now() }
  ]);
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
        console.error("Failed to load node preferences:", e);
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
      projectFiles,
      gitRepo,
      projectSettings,
      activeFileId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [activeTab, negativePrompt, sdParams, personalities, projectFiles, gitRepo, projectSettings, activeFileId]);

  useEffect(() => {
    if (activeTab === 'terminal') triggerTerminalGreeting();
  }, [activeTab]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiProcessing]);

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
    if (editorRef.current) {
      // @ts-ignore
      const monaco = window.monaco;
      if (!monaco) return;

      const newDecorations: any[] = [];
      
      breakpoints.forEach(line => {
        newDecorations.push({
          range: new monaco.Range(line, 1, line, 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: 'bg-red-600 rounded-full'
          }
        });
      });

      if (debugState.isActive && debugState.currentLine > 0) {
        newDecorations.push({
          range: new monaco.Range(debugState.currentLine, 1, debugState.currentLine, 1),
          options: {
            isWholeLine: true,
            className: 'bg-red-500/10 border-l-2 border-red-500',
            glyphMarginClassName: 'bg-yellow-500'
          }
        });
      }

      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);
    }
  }, [breakpoints, debugState.currentLine, debugState.isActive]);

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

  const triggerTerminalGreeting = async () => {
    setTerminalOutput(prev => [...prev, `\nNEURAL_LINK: How can I assist with your terminal today, Operator?`]);
    setIsAiProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: SD Android Manager. Dir: ${currentDir}. Personality: ${activePersonality.instruction}`,
        config: { systemInstruction: "Suggest one command for SD model management or environment check in a futuristic sci-fi terminal style." }
      });
      setTerminalOutput(prev => [...prev, `COMMAND_INTEL: ${response.text?.trim() || "python3 node_status.py --verbose"}`]);
    } catch (err) {} finally { setIsAiProcessing(false); }
  };

  const handleRunCode = async () => {
    setIsRunningCode(true);
    setEditorOutput('');
    setEditorMode('code');
    
    try {
      // Simulation of code execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Execute this ${editorLanguage} code in a simulated environment and provide the output. If it's the AI brain, simulate its initialization. If it's UI, describe its rendering. Code:\n${editorContent}`,
        config: {
          systemInstruction: "You are the Crimson OS Neural Runtime. Simulate the execution of the provided code. Output should look like a terminal log. Be technical and realistic."
        }
      });
      
      setEditorOutput(response.text || "[ERROR] Runtime execution failed.");
    } catch (err) {
      setEditorOutput("[CRITICAL] Neural runtime bridge failure.");
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleRefactorCode = async () => {
    if (!editorRef.current) return;
    
    const selection = editorRef.current.getSelection();
    const model = editorRef.current.getModel();
    let codeToRefactor = editorContent;
    let isSelection = false;
    
    if (selection && !selection.isEmpty()) {
      codeToRefactor = model.getValueInRange(selection);
      isSelection = true;
    }

    setIsAiProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Refactor this ${editorLanguage} code for better performance, readability, and structural integrity. Return a JSON object with 'refactoredCode' and 'explanation' fields.\n\nCode:\n${codeToRefactor}`,
        config: {
          systemInstruction: "You are a world-class software architect. You refactor code to be production-ready. Always return valid JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refactoredCode: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["refactoredCode", "explanation"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `REFACTOR_COMPLETE:\n${result.explanation}\n\n${result.refactoredCode}`,
        metadata: {
          refactoredCode: result.refactoredCode,
          isSelection,
          selection: isSelection ? selection : null
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
    if (!editorRef.current) return;

    if (isSelection && selection) {
      editorRef.current.executeEdits('refactor', [{
        range: selection,
        text: refactoredCode,
        forceMoveMarkers: true
      }]);
    } else {
      setEditorContent(refactoredCode);
    }
    setEditorOutput(prev => prev + `[SYSTEM] Refactoring applied successfully.\n`);
  };

  const handleGenerateDocs = async () => {
    if (!editorRef.current) return;
    
    const selection = editorRef.current.getSelection();
    const model = editorRef.current.getModel();
    let codeToDocument = editorContent;
    let isSelection = false;
    
    if (selection && !selection.isEmpty()) {
      codeToDocument = model.getValueInRange(selection);
      isSelection = true;
    }

    setIsAiProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate comprehensive documentation (docstrings, JSDoc, or comments) for this ${editorLanguage} code. Return a JSON object with 'documentedCode' and 'summary' fields.\n\nCode:\n${codeToDocument}`,
        config: {
          systemInstruction: "You are a world-class documentation expert. You write clear, concise, and helpful documentation. Always return valid JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentedCode: { type: Type.STRING },
              summary: { type: Type.STRING }
            },
            required: ["documentedCode", "summary"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `DOCUMENTATION_GENERATED:\n${result.summary}\n\n${result.documentedCode}`,
        metadata: {
          documentedCode: result.documentedCode,
          isSelection,
          selection: isSelection ? selection : null
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
    if (!editorRef.current) return;

    if (isSelection && selection) {
      editorRef.current.executeEdits('documentation', [{
        range: selection,
        text: documentedCode,
        forceMoveMarkers: true
      }]);
    } else {
      setEditorContent(documentedCode);
    }
    setEditorOutput(prev => prev + `[SYSTEM] Documentation applied successfully.\n`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fileName = file.name;
      const extension = fileName.split('.').pop() || 'text';
      
      const newFile = {
        id: `upload_${Date.now()}`,
        name: fileName,
        type: 'file',
        parentId: 'root',
        language: extension,
        content: content
      };

      setProjectFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setEditorContent(content);
      setEditorLanguage(extension);
      setEditorOutput(prev => prev + `[SYSTEM] File "${fileName}" uploaded and synchronized.\n`);
    };
    reader.readAsText(file);
  };

  const handleFullProjectAnalysis = async () => {
    setIsAiProcessing(true);
    try {
      const projectContext = projectFiles
        .filter(f => f.type === 'file')
        .map(f => `File: ${f.name}\nContent:\n${f.content}`)
        .join('\n\n---\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Analyze this entire project. Provide a comprehensive overview of the architecture, potential bugs, and optimization strategies.\n\nProject Context:\n${projectContext}`,
        config: {
          systemInstruction: "You are a world-class software architect. Provide a deep, holistic analysis of the entire project. Focus on inter-file dependencies and overall design patterns."
        }
      });
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `FULL_PROJECT_ANALYSIS:\n${response.text}`
      }]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput(prev => prev + "[ERROR] Neural project analysis failed.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSaveAnalysis = (analysisText: string) => {
    const fileName = `analysis_${new Date().getTime()}.md`;
    const newFile = {
      id: `analysis_${Date.now()}`,
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
    setEditorOutput(prev => prev + `[SYSTEM] Analysis saved as "${fileName}".\n`);
  };

  const handleExplainCode = async () => {
    setIsAiProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Analyze and explain this ${editorLanguage} code. Suggest optimizations if possible.\n\nCode:\n${editorContent}`,
        config: {
          systemInstruction: "You are a senior software engineer. Provide a deep technical analysis of the code. Be concise but thorough."
        }
      });
      
      setEditorAssistantMessages(prev => [...prev, { 
        role: 'ai', 
        text: `CODE_ANALYSIS:\n${response.text}`
      }]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput(prev => prev + "[ERROR] Analysis node offline.\n");
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
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      if (position) {
        handleToggleBreakpoint(position.lineNumber);
      }
    }
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
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Simulate one step of debugging for this ${editorLanguage} code. 
        Current line: ${debugState.currentLine}. 
        Breakpoints: ${breakpoints.join(', ')}.
        Current variables: ${JSON.stringify(debugState.variables)}.
        Code:\n${editorContent}`,
        config: {
          systemInstruction: "You are the Crimson OS Debugger. Provide the state of variables and the next logical line to execute in JSON format. Schema: { \"nextLine\": number, \"variables\": object, \"output\": string, \"callStack\": string[] }"
        }
      });

      const text = response.text || '{}';
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

  const createFile = (parentId: string) => {
    const name = prompt('Enter file name:');
    if (!name) return;
    const id = `file_${Date.now()}`;
    const ext = name.split('.').pop();
    const langMap: Record<string, string> = { 'py': 'python', 'js': 'javascript', 'ts': 'typescript', 'html': 'html', 'css': 'css', 'rs': 'rust', 'cpp': 'cpp' };
    setProjectFiles(prev => [...prev, {
      id,
      name,
      type: 'file',
      parentId,
      language: langMap[ext || ''] || 'text',
      content: ''
    }]);
    if (gitRepo.initialized) {
      setGitRepo(prev => ({ ...prev, modified: [...prev.modified, id] }));
    }
  };

  const createFolder = (parentId: string) => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    const id = `folder_${Date.now()}`;
    setProjectFiles(prev => [...prev, {
      id,
      name,
      type: 'folder',
      parentId,
      isOpen: true
    }]);
  };

  const renameItem = (id: string) => {
    const item = projectFiles.find(f => f.id === id);
    if (!item) return;
    const newName = prompt('Enter new name:', item.name);
    if (!newName) return;
    setProjectFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
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
    if (!editorRef.current || !debugState.isActive) return;

    const selection = editorRef.current.getSelection();
    const model = editorRef.current.getModel();
    let codeToRefactor = "";

    if (selection && !selection.isEmpty()) {
      codeToRefactor = model.getValueInRange(selection);
    } else {
      const lineContent = model.getLineContent(debugState.currentLine);
      codeToRefactor = lineContent;
    }

    setIsAiProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Analyze and refactor this ${editorLanguage} code. 
The debugger is currently at line ${debugState.currentLine}.
Current variables in scope: ${JSON.stringify(debugState.variables)}.
Current call stack: ${debugState.callStack.join(' -> ')}.

Code to refactor:
${codeToRefactor}

Provide a refactored version that improves quality, fixes potential issues, or optimizes performance. 
Return a JSON object with 'refactoredCode' and 'explanation' fields.`,
        config: {
          systemInstruction: "You are a world-class software architect and debugger. You provide precise refactorings and clear explanations. Always return valid JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refactoredCode: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["refactoredCode", "explanation"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setDebugRefactorResult(result);
    } catch (error) {
      console.error("Debug refactor failed:", error);
      setEditorOutput(prev => prev + `\n[ERROR] Debug refactor failed: ${error}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyDebugRefactor = () => {
    if (!editorRef.current || !debugRefactorResult) return;
    
    const selection = editorRef.current.getSelection();
    const model = editorRef.current.getModel();
    
    if (selection && !selection.isEmpty()) {
      editorRef.current.executeEdits('refactor', [{
        range: selection,
        text: debugRefactorResult.refactoredCode,
        forceMoveMarkers: true
      }]);
    } else {
      const line = debugState.currentLine;
      const range = {
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: model.getLineMaxColumn(line)
      };
      editorRef.current.executeEdits('refactor', [{
        range: range,
        text: debugRefactorResult.refactoredCode,
        forceMoveMarkers: true
      }]);
    }
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
  };

  const handleGitPush = async () => {
    setIsAiProcessing(true);
    setEditorOutput(prev => prev + '[GIT] Pushing to remote neural uplink...\n');
    await new Promise(r => setTimeout(r, 1500));
    setEditorOutput(prev => prev + '[GIT] Successfully pushed to origin/main.\n');
    setIsAiProcessing(false);
  };

  const handleGitPull = async () => {
    setIsAiProcessing(true);
    setEditorOutput(prev => prev + '[GIT] Fetching from remote neural uplink...\n');
    await new Promise(r => setTimeout(r, 1500));
    setEditorOutput(prev => prev + '[GIT] Already up to date.\n');
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
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Context: Coding in ${editorLanguage}. Current code:\n${editorContent}\n\nUser request: ${prompt}`,
        config: {
          systemInstruction: "You are a world-class coding assistant. Help the user with their code. You can provide code snippets, debug, or explain concepts. Keep responses concise and technical."
        }
      });
      
      setEditorAssistantMessages(prev => [...prev, { role: 'ai', text: response.text || 'Process finalized.' }]);
    } catch (err) {
      setEditorAssistantMessages(prev => [...prev, { role: 'ai', text: 'CRITICAL ERROR: Neural link failed.' }]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = termInput.trim();
    if (!cmd) return;
    setTerminalOutput(prev => [...prev, `${currentDir} $ ${cmd}`]);
    setCmdHistory(prev => [cmd, ...prev].slice(0, 20));
    setTermInput('');
    setTermSuggestion('');
    setTermSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setHistoryIndex(-1);
    if (cmd === 'clear') setTerminalOutput(['Buffer flushed.']);
    else if (cmd.startsWith('cd ')) {
      const newDir = cmd.substring(3).trim();
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
    else if (cmd.startsWith('ai ')) await getAiTerminalAssistance(cmd.substring(3));
    else if (cmd.startsWith('gh repo clone ')) {
      const repo = cmd.replace('gh repo clone ', '');
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
      } else {
        setTerminalOutput(prev => [...prev, `Cloning into '${repo.split('/').pop()}'...`, 'remote: Enumerating objects: 1024, done.', 'remote: Counting objects: 100% (1024/1024), done.', 'remote: Compressing objects: 100% (512/512), done.', 'Receiving objects: 100% (1024/1024), 2.45 MiB | 4.12 MiB/s, done.', '[SUCCESS] Repository integrated into local node.']);
      }
    }
    else setTimeout(() => setTerminalOutput(prev => [...prev, `[LOG] Process "${cmd.split(' ')[0]}" integrated with core logic.`]), 300);
  };

  const getAiTerminalAssistance = async (prompt: string) => {
    setIsAiProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: `Futuristic crimson terminal specialist. ${activePersonality.instruction}` }
      });
      setTerminalOutput(prev => [...prev, `CORE (${activePersonality.name.toUpperCase()}): ${response.text}`]);
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
      const isImageRequest = studioRefImage || /\b(generate|image|draw|create|picture|photo|edit|change|add|sd|stable|render)\b/i.test(prompt);

      if (isImageRequest) {
        const parts: any[] = [];
        if (studioRefImage) parts.push({ inlineData: { data: studioRefImage.data, mimeType: studioRefImage.mimeType } });
        parts.push({ text: `POSITIVE: ${prompt}\nNEGATIVE: ${negativePrompt}\nCONFIG: steps=${sdParams.steps}, cfg=${sdParams.cfgScale}, checkpoint=${sdParams.checkpoint}` });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: [{ parts }],
          config: { 
            imageConfig: { aspectRatio: sdParams.aspectRatio },
            systemInstruction: `You are the Crimson Engine SD Renderer. Output high-impact futuristic visuals. Active personality: ${activePersonality.instruction}`
          }
        });

        let imageUrl = '';
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }

        if (imageUrl) {
          setChatMessages(prev => [...prev, { role: 'ai', text: `SYNTHESIS_COMPLETE: Manifesting result via ${sdParams.checkpoint}. Node ${Math.floor(Math.random() * 999)} ready.`, type: 'image', url: imageUrl, timestamp: Date.now() }]);
        }
      } else {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { systemInstruction: activePersonality.instruction }
        });
        setChatMessages(prev => [...prev, { role: 'ai', text: response.text || 'Process finalized.', timestamp: Date.now() }]);
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
    
    // Get current folder context
    const dirParts = currentDir.split('/');
    const currentFolderName = dirParts[dirParts.length - 1];
    const currentFolder = projectFiles.find(f => f.name === currentFolderName && f.type === 'folder');
    const currentFolderId = currentFolder ? currentFolder.id : 'root';

    // @ts-ignore
    const localFiles = projectFiles.filter(f => f.parentId === currentFolderId).map(f => f.name);
    // @ts-ignore
    const otherFiles = projectFiles.filter(f => f.parentId !== currentFolderId).map(f => f.name);
    
    // @ts-ignore
    const allSuggestions = [...new Set([
      ...commonCommands, 
      ...(activePersonality.suggestions || []), 
      ...localFiles,
      ...otherFiles
    ])];
    
    const matches = allSuggestions.filter(cmd => cmd.toLowerCase().startsWith(val.toLowerCase()));
    
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
        setTermSuggestion('');
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
    return projectFiles
      .filter(f => f.parentId === parentId)
      .map(item => (
        <div key={item.id} className="flex flex-col">
          <div 
            className={`group flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeFileId === item.id ? 'bg-red-700 text-white shadow-lg' : 'hover:bg-red-950/20 text-red-900 hover:text-red-500'}`}
            style={{ paddingLeft: `${level * 12 + 12}px` }}
            onClick={() => item.type === 'folder' ? toggleFolder(item.id) : handleFileSwitch(item.id)}
          >
            {item.type === 'folder' ? (
              <ChevronDown className={`w-3 h-3 transition-transform ${item.isOpen ? '' : '-rotate-90'}`} />
            ) : (
              <FileCode className="w-3 h-3" />
            )}
            <span className="flex-1 truncate">{item.name}</span>
            
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              {item.type === 'folder' && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); createFile(item.id); }} title="New File" className="p-1 hover:text-white"><Plus className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); createFolder(item.id); }} title="New Folder" className="p-1 hover:text-white"><Folder className="w-3 h-3" /></button>
                </>
              )}
              <button onClick={(e) => { e.stopPropagation(); renameItem(item.id); }} title="Rename" className="p-1 hover:text-white"><Edit2 className="w-3 h-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} title="Delete" className="p-1 text-red-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
          {item.type === 'folder' && item.isOpen && renderTree(item.id, level + 1)}
        </div>
      ));
  };

  return (
    <div className="flex h-screen w-full bg-[#020204] text-red-100 font-sans selection:bg-red-900/40 overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-16 md:w-20 border-r border-red-900/30 flex flex-col items-center py-8 space-y-8 bg-[#080101] z-30 shadow-[10px_0_40px_rgba(153,27,27,0.1)] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(153,27,27,0.05),transparent)] pointer-events-none" />
        <div className="p-3 bg-red-800 rounded-2xl shadow-[0_0_20px_rgba(185,28,28,0.5)] group cursor-pointer hover:rotate-12 transition-transform relative z-10">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 space-y-6 relative z-10">
          <SidebarIcon icon={<Zap />} active={activeTab === 'toolneuron'} onClick={() => setActiveTab('toolneuron')} label="ToolNeuron Hub" />
          <SidebarIcon icon={<TerminalIcon />} active={activeTab === 'terminal'} onClick={() => setActiveTab('terminal')} label="Terminal" />
          <SidebarIcon icon={<Code2 />} active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} label="Neural Editor" />
          <SidebarIcon icon={<ImageIcon />} active={activeTab === 'studio'} onClick={() => setActiveTab('studio')} label="Crimson Studio" />
          <SidebarIcon icon={<Smartphone />} active={activeTab === 'termux'} onClick={() => setActiveTab('termux')} label="Node Bridge" />
          <SidebarIcon icon={<HardDrive />} active={activeTab === 'storage'} onClick={() => setActiveTab('storage')} label="Data Core" />
        </div>
        <SidebarIcon icon={<SettingsIcon />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="System Config" />
      </nav>

      {/* Main Interface */}
      <main className="flex-1 flex flex-col min-w-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-repeat">
        <header className="h-16 border-b border-red-900/30 flex items-center justify-between px-8 bg-[#0a0202]/95 backdrop-blur-xl z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center space-x-6">
            <h1 className="text-sm font-black tracking-[0.4em] text-red-500 uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">{activeTab} node</h1>
            <div className="px-4 py-1.5 bg-red-950/40 border border-red-800/40 rounded-full text-[10px] text-red-400 font-black flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]" />
              {activePersonality.name.toUpperCase()} CORE ACTIVE
            </div>
          </div>
          <div className="flex items-center space-x-8">
             <div className="flex items-center gap-3 text-[10px] font-mono text-red-400/60 bg-red-950/20 px-4 py-2 rounded-xl border border-red-900/20">
                <Gauge className="w-4 h-4 text-red-600" />
                <span className="font-black tracking-widest">THROUGHPUT: 88%</span>
             </div>
             <div className={`w-3.5 h-3.5 rounded-full ${termuxStatus === 'connected' ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-red-950/40 border border-red-900/30'}`} />
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(185,28,28,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(185,28,28,0.2)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          {/* TOOLNEURON HUB */}
          {activeTab === 'toolneuron' && (
            <div className="h-full flex flex-col p-8 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
              <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                {/* Module Navigation */}
                <div className="w-full lg:w-72 flex flex-col gap-6">
                  <div className="bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 p-8 space-y-8 shadow-2xl">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-red-100 uppercase tracking-tighter">ToolNeuron</h3>
                       <p className="text-[10px] text-red-900 font-black tracking-[0.3em] uppercase">Offline AI Ecosystem</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 'chat', label: 'Neural Chat', icon: <MessageSquare className="w-4 h-4" /> },
                        { id: 'vision', label: 'Vision Synth', icon: <ImageIcon className="w-4 h-4" /> },
                        { id: 'knowledge', label: 'Neural Database', icon: <Database className="w-4 h-4" /> },
                        { id: 'vault', label: 'Memory Vault', icon: <ShieldCheck className="w-4 h-4" /> },
                        { id: 'swarm', label: 'Neural Swarm', icon: <Network className="w-4 h-4" /> },
                        { id: 'help', label: 'Neural Guide', icon: <HelpCircle className="w-4 h-4" /> }
                      ].map(mod => (
                        <button 
                          key={mod.id}
                          onClick={() => setTnModule(mod.id as any)}
                          className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${tnModule === mod.id ? 'bg-red-700 text-white shadow-lg scale-105' : 'bg-red-950/10 text-red-900 hover:text-red-500'}`}
                        >
                          {mod.icon}
                          {mod.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 p-8 space-y-6 shadow-2xl overflow-y-auto custom-scrollbar">
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
                <div className="flex-1 bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden flex flex-col">
                  {tnModule === 'chat' && (
                    <div className="flex-1 flex flex-col min-h-0">
                       <div className="h-16 border-b border-red-900/20 flex items-center px-8 bg-black/40 justify-between">
                          <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                             <MessageSquare className="w-4 h-4" /> Neural Chat Interface
                          </h4>
                          <span className="text-[10px] font-mono text-red-900">LATENCY: 12ms</span>
                       </div>
                       <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                               <div className={`max-w-[80%] rounded-3xl p-6 text-[13px] leading-relaxed ${
                                 msg.role === 'user' 
                                   ? 'bg-red-800 text-white rounded-tr-none' 
                                   : 'bg-red-950/20 border border-red-900/20 text-red-100 rounded-tl-none'
                               }`}>
                                  {msg.text}
                               </div>
                            </div>
                          ))}
                       </div>
                       <form onSubmit={handleStudioSubmit} className="p-8 bg-black/40 border-t border-red-900/20">
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
                    <div className="flex-1 p-12 space-y-10 overflow-y-auto custom-scrollbar">
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
                            <div key={pack.id} className="p-8 bg-red-950/5 border border-red-900/20 rounded-[32px] group hover:bg-red-900/10 transition-all relative overflow-hidden">
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
                      <AnimatePresence mode="wait">
                        {!isVaultUnlocked ? (
                          <motion.div 
                            key="locked"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex flex-col items-center justify-center p-12 space-y-12 text-center"
                          >
                            <div className="relative">
                              <div className="p-12 bg-red-900/10 rounded-full border border-red-600/20 shadow-[0_0_80px_rgba(185,28,28,0.15)] relative z-10">
                                <ShieldCheck className="w-24 h-24 text-red-600" />
                              </div>
                              {isBiometricVerifying && (
                                <motion.div 
                                  initial={{ top: '0%' }}
                                  animate={{ top: '100%' }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                  className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] z-20"
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
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="unlocked"
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col p-12 space-y-12 overflow-y-auto custom-scrollbar"
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {[
                                { title: 'Neural Weights', desc: 'Optimized Llama-3 8B weights for local inference.', size: '4.8GB', date: '2024-03-20' },
                                { title: 'Personal Dataset', desc: 'Encrypted JSON export of private chat history.', size: '124MB', date: '2024-03-22' },
                                { title: 'Hardware Keys', desc: 'Master recovery keys for crimson-node-01.', size: '2KB', date: '2024-01-15' },
                                { title: 'Vision Assets', desc: 'High-fidelity textures for UI generation.', size: '850MB', date: '2024-03-23' }
                              ].map((item, i) => (
                                <motion.div 
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  key={i} 
                                  className="p-8 bg-red-950/5 border border-red-900/20 rounded-[40px] space-y-4 group hover:border-red-600/30 transition-all cursor-pointer"
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
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {tnModule === 'vision' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-8 text-center">
                       <div className="p-12 bg-red-900/10 rounded-full border border-red-600/20 shadow-[0_0_60px_rgba(185,28,28,0.1)]">
                          <ImageIcon className="w-24 h-24 text-red-600" />
                       </div>
                       <div className="space-y-4 max-w-md">
                          <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter">Vision Synth Engine</h3>
                          <p className="text-sm text-red-900 font-bold leading-relaxed">Local Stable Diffusion 1.5 inference. Generate high-fidelity visuals without cloud latency or data harvesting.</p>
                       </div>
                       <button onClick={() => setActiveTab('studio')} className="px-12 py-5 bg-red-700 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Initialize Engine</button>
                    </div>
                  )}

                  {tnModule === 'swarm' && (
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar">
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

                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                          {/* Swarm Visualization */}
                          <div className="lg:col-span-2 space-y-8">
                             <div className="bg-red-950/5 border border-red-900/20 rounded-[40px] p-10 relative overflow-hidden h-[500px] flex items-center justify-center">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.1)_0%,transparent_70%)]" />
                                <div className="relative w-full h-full">
                                   {swarmAgents.map((agent, i) => {
                                     const angle = (i / swarmAgents.length) * Math.PI * 2;
                                     const x = Math.cos(angle) * 160;
                                     const y = Math.sin(angle) * 160;
                                     return (
                                       <motion.div
                                         key={agent.id}
                                         animate={{ 
                                           x: x + (agent.status === 'active' ? Math.random() * 10 - 5 : 0),
                                           y: y + (agent.status === 'active' ? Math.random() * 10 - 5 : 0),
                                           scale: agent.status === 'active' ? 1.1 : 1
                                         }}
                                         className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3"
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
                                       </motion.div>
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
                          <div className="bg-[#0a0202] border border-red-900/30 rounded-[40px] flex flex-col shadow-2xl overflow-hidden h-[650px]">
                             <div className="p-8 border-b border-red-900/20 bg-black/40 flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                   <Activity className="w-4 h-4" /> Consensus Stream
                                </h4>
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                             </div>
                             <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar font-mono text-[11px]">
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

                  {tnModule === 'help' && (
                    <div className="flex-1 p-12 space-y-12 overflow-y-auto custom-scrollbar">
                       <div className="space-y-4">
                          <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter">Neural Guide</h3>
                          <p className="text-sm text-red-900 font-bold tracking-widest uppercase">Understanding the ToolNeuron Ecosystem</p>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="p-8 bg-red-950/5 border border-red-900/20 rounded-[40px] space-y-4">
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

                          <div className="p-8 bg-red-950/5 border border-red-900/20 rounded-[40px] space-y-4">
                             <div className="flex items-center gap-4 text-red-500">
                                <ImageIcon className="w-6 h-6" />
                                <h4 className="text-lg font-black uppercase tracking-tight">Vision Synth</h4>
                             </div>
                             <p className="text-[13px] text-red-100/70 leading-relaxed">
                                Local image generation powered by Stable Diffusion. Create high-fidelity visuals, textures, and UI assets without subscriptions or internet connectivity.
                             </p>
                             <ul className="text-[11px] text-red-900 font-bold space-y-2 uppercase tracking-widest">
                                <li>• SDXL & SD 1.5 Support</li>
                                <li>• Hardware Accelerated Rendering</li>
                                <li>• Private Asset Generation</li>
                             </ul>
                          </div>

                          <div className="p-8 bg-red-950/5 border border-red-900/20 rounded-[40px] space-y-4">
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

                          <div className="p-8 bg-red-950/5 border border-red-900/20 rounded-[40px] space-y-4">
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
            <div className="h-full flex flex-col p-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex-1 bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden group relative">
                <div className="flex-1 p-8 font-mono text-[14px] overflow-y-auto custom-scrollbar bg-[linear-gradient(rgba(13,4,4,1),rgba(8,1,1,1))]">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className={`mb-3 leading-relaxed whitespace-pre-wrap ${
                      line.includes('$') ? 'text-red-400 font-black' : 
                      line.startsWith('NEURAL_LINK:') ? 'text-red-500 font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                      line.startsWith('COMMAND_INTEL:') ? 'text-red-400 italic opacity-80' :
                      line.startsWith('[') ? 'text-red-900' : 
                      'text-red-100/60'
                    }`}>
                      {line}
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
                    <div className="flex flex-wrap gap-3">
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
                            className={`px-4 py-2 rounded-xl font-mono text-[11px] transition-all flex items-center gap-2 ${
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
            <div className="h-full flex flex-col p-8 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
              <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                {/* File Tree Sidebar */}
                <div className="w-full lg:w-64 flex flex-col bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden">
                  <div className="h-16 border-b border-red-900/20 flex items-center px-8 bg-black/40">
                    <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <FolderOpen className="w-4 h-4" /> Project Files
                    </h4>
                  </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                      <div className="flex gap-2 mb-4">
                        <button 
                          onClick={() => setIsTemplateModalOpen(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-100 bg-red-900/40 border border-red-500/30 hover:bg-red-800/60 transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                        >
                          <LayoutTemplate className="w-4 h-4" />
                          Template
                        </button>
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-950/40 border border-red-900/30 hover:bg-red-900/20 transition-all cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Upload
                          <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                      </div>
                      {renderTree(null)}
                    <button 
                      onClick={() => createFile('root')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-red-900/40 border border-dashed border-red-900/20 hover:border-red-500/40 hover:text-red-500 transition-all mt-4"
                    >
                      <Plus className="w-4 h-4" />
                      New Neural Node
                    </button>
                  </div>
                </div>

                {/* Editor Section */}
                <div className="flex-1 flex flex-col bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden">
                  <div className="h-16 border-b border-red-900/20 flex items-center justify-between px-8 bg-black/40">
                    <div className="flex items-center gap-6">
                      <div className="flex bg-red-950/20 p-1 rounded-xl border border-red-900/20">
                        {['python', 'cpp', 'rust', 'java', 'html'].map(lang => (
                          <button 
                            key={lang} 
                            onClick={() => setEditorLanguage(lang)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editorLanguage === lang ? 'bg-red-700 text-white shadow-lg' : 'text-red-900 hover:text-red-500'}`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                      {lastSavedTime && (
                        <div className="flex items-center gap-2 text-[9px] font-black text-red-900 uppercase tracking-widest animate-in fade-in duration-500">
                          <ShieldCheck className="w-3 h-3" />
                          Autosaved at {lastSavedTime}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setIsEditorAssistantOpen(!isEditorAssistantOpen)}
                        className={`p-2.5 border rounded-xl transition-all group ${isEditorAssistantOpen ? 'bg-red-700 border-red-500 text-white' : 'bg-red-950/40 border-red-900/30 text-red-500 hover:bg-red-900/20'}`}
                        title="Neural Assistant"
                      >
                        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={handleToggleCurrentLineBreakpoint}
                        className="p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group"
                        title="Toggle Breakpoint"
                      >
                        <Circle className={`w-5 h-5 group-hover:scale-110 transition-transform ${breakpoints.includes(cursorLine) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                      <button 
                        onClick={handleExplainCode}
                        disabled={isAiProcessing}
                        className="p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50"
                        title="AI Analysis"
                      >
                        <Brain className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={handleFullProjectAnalysis}
                        disabled={isAiProcessing}
                        className="p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50"
                        title="Full Project Analysis"
                      >
                        <Network className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={handleGenerateDocs}
                        disabled={isAiProcessing}
                        className="p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50"
                        title="Generate Documentation"
                      >
                        <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={handleRefactorCode}
                        disabled={isAiProcessing}
                        className="p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group disabled:opacity-50"
                        title="AI Refactor"
                      >
                        <Wand2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={handleStartDebug}
                        disabled={isRunningCode || debugState.isActive}
                        className="p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/20 transition-all group"
                        title="Neural Debugger"
                      >
                        <Bug className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={() => setEditorMode('git')}
                        className={`p-2.5 border rounded-xl transition-all group ${editorMode === 'git' ? 'bg-red-700 border-red-500 text-white' : 'bg-red-950/40 border-red-900/30 text-red-500 hover:bg-red-900/20'}`}
                        title="Neural Git"
                      >
                        <GitBranch className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <button 
                        onClick={handleRunCode}
                        disabled={isRunningCode}
                        className="flex items-center gap-3 px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isRunningCode ? <Zap className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Execute
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <Editor
                      height="100%"
                      onMount={(editor) => {
                        editorRef.current = editor;
                        editor.onDidChangeCursorPosition((e: any) => {
                          setCursorLine(e.position.lineNumber);
                        });
                      }}
                      language={editorLanguage === 'cpp' ? 'cpp' : editorLanguage}
                      theme="vs-dark"
                      value={editorContent}
                      onChange={(value) => setEditorContent(value || '')}
                      options={{
                        fontSize: 14,
                        fontFamily: 'JetBrains Mono',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 20 },
                        backgroundColor: '#0d0404',
                        glyphMargin: true,
                        lineNumbersMinChars: 3
                      }}
                    />
                  </div>
                </div>

                {/* Assistant Sidebar */}
                {isEditorAssistantOpen && (
                  <div className="w-full lg:w-80 flex flex-col bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden animate-in slide-in-from-right-5 duration-300">
                    <div className="h-16 border-b border-red-900/20 flex items-center justify-between px-8 bg-black/40">
                      <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                        <Brain className="w-4 h-4" /> Neural Assistant
                      </h4>
                      <button onClick={() => setIsEditorAssistantOpen(false)} className="text-red-900 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
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
                            {msg.text}
                            {msg.role === 'ai' && (msg.text.includes('CODE_ANALYSIS') || msg.text.includes('FULL_PROJECT_ANALYSIS')) && (
                              <button 
                                onClick={() => handleSaveAnalysis(msg.text)}
                                className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-red-900/40 border border-red-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-100 hover:bg-red-800/60 transition-all"
                              >
                                <Save className="w-3 h-3" />
                                Save Analysis
                              </button>
                            )}
                            {msg.role === 'ai' && msg.text.includes('DOCUMENTATION_GENERATED') && msg.metadata && (
                              <button 
                                onClick={() => handleApplyDocumentation(msg.metadata.documentedCode, msg.metadata.isSelection, msg.metadata.selection)}
                                className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-red-700 border border-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-all"
                              >
                                <Check className="w-3 h-3" />
                                Apply Documentation
                              </button>
                            )}
                            {msg.role === 'ai' && msg.text.includes('REFACTOR_COMPLETE') && msg.metadata && (
                              <button 
                                onClick={() => handleApplyRefactor(msg.metadata.refactoredCode, msg.metadata.isSelection, msg.metadata.selection)}
                                className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-red-700 border border-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-all"
                              >
                                <Check className="w-3 h-3" />
                                Apply Refactor
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
                <div className="w-full lg:w-96 flex flex-col bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden">
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
                      <div className="h-full p-8 font-mono text-[13px] overflow-y-auto custom-scrollbar text-red-100/80">
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
                      <div className="h-full overflow-y-auto custom-scrollbar p-6">
                        <div 
                          className="w-full min-h-full bg-black/40 rounded-2xl border border-red-900/20 overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: editorContent }}
                        />
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
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
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
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
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
                      <div className="h-full flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
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
                              onChange={(e) => setProjectSettings({...projectSettings, buildPath: e.target.value})}
                              className="w-full bg-red-950/10 border border-red-900/20 rounded-xl px-4 py-3 text-[11px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all"
                            />
                          </div>

                          {/* Compiler Flags */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                              <Cpu className="w-3 h-3" /> Neural Compiler Flags
                            </label>
                            <input 
                              value={projectSettings.compilerFlags}
                              onChange={(e) => setProjectSettings({...projectSettings, compilerFlags: e.target.value})}
                              className="w-full bg-red-950/10 border border-red-900/20 rounded-xl px-4 py-3 text-[11px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all"
                            />
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
                                <div key={idx} className="flex gap-2">
                                  <input 
                                    placeholder="KEY"
                                    value={env.key}
                                    onChange={(e) => {
                                      const newEnv = [...projectSettings.envVariables];
                                      newEnv[idx].key = e.target.value;
                                      setProjectSettings({...projectSettings, envVariables: newEnv});
                                    }}
                                    className="flex-1 bg-red-950/10 border border-red-900/20 rounded-xl px-4 py-2 text-[10px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all"
                                  />
                                  <input 
                                    placeholder="VALUE"
                                    value={env.value}
                                    onChange={(e) => {
                                      const newEnv = [...projectSettings.envVariables];
                                      newEnv[idx].value = e.target.value;
                                      setProjectSettings({...projectSettings, envVariables: newEnv});
                                    }}
                                    className="flex-2 bg-red-950/10 border border-red-900/20 rounded-xl px-4 py-2 text-[10px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all"
                                  />
                                  <button 
                                    onClick={() => {
                                      const newEnv = projectSettings.envVariables.filter((_, i) => i !== idx);
                                      setProjectSettings({...projectSettings, envVariables: newEnv});
                                    }}
                                    className="p-2 text-red-900 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
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

          {/* AI STUDIO */}
          {activeTab === 'studio' && (
            <div className="h-full flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500">
              <div className="flex-1 flex flex-col min-w-0 bg-[#020204]">
                <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(153,27,27,0.05),transparent)]">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-3 duration-400`}>
                      <div className={`max-w-[85%] rounded-[32px] p-8 text-[14px] relative group ${
                        msg.role === 'user' 
                          ? 'bg-red-800 text-white rounded-tr-none shadow-[0_15px_40px_rgba(153,27,27,0.3)]' 
                          : 'bg-[#0f0404] border border-red-900/20 text-red-100 rounded-tl-none backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
                      }`}>
                        {msg.type === 'image' ? (
                          <div className="space-y-6">
                            <img src={msg.url} className="rounded-2xl w-full border border-red-900/40 shadow-[0_0_30px_rgba(239,68,68,0.1)] bg-black/60" />
                            <div className="flex justify-between items-center px-2">
                               <button className="text-[11px] text-red-500 font-black hover:text-red-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.3)]"><Download className="w-4 h-4" /> Download Manifest</button>
                               <span className="text-[10px] text-red-950 font-black tracking-widest">ARTIFACT_77B</span>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed tracking-wider font-medium">{msg.text}</p>
                        )}
                        <div className={`text-[10px] mt-4 opacity-0 group-hover:opacity-40 transition-opacity font-mono tracking-[0.3em] font-black ${msg.role === 'user' ? 'text-white' : 'text-red-800'}`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isAiProcessing && (
                    <div className="flex items-center space-x-4 p-5 bg-red-950/10 rounded-[40px] border border-red-900/20 w-fit shadow-2xl">
                      <div className="flex gap-2 px-1">
                        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-[11px] font-black text-red-700 uppercase tracking-[0.4em]">Rendering Reality</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                {/* Input Bar */}
                <div className="p-8 bg-[#0a0202]/80 border-t border-red-900/20 backdrop-blur-md">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="relative group">
                      <input value={studioInput} onChange={(e) => setStudioInput(e.target.value)} placeholder="Enter generation prompt..." className="w-full bg-[#0d0404] border border-red-900/40 rounded-3xl px-8 py-6 text-sm text-red-100 focus:border-red-600/60 outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]" />
                      <button type="submit" onClick={handleStudioSubmit} disabled={isAiProcessing} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-red-600 rounded-2xl disabled:opacity-50 transition-all hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                        <Send className="w-6 h-6 text-white" />
                      </button>
                    </div>
                    <div className="flex gap-6">
                       <div className="flex-1 flex items-center bg-red-950/10 border border-red-900/20 rounded-2xl px-5 py-3 gap-3">
                          <X className="w-4 h-4 text-red-800" />
                          <input value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Negative Parameters" className="flex-1 bg-transparent text-[11px] text-red-800 font-bold focus:text-red-600 outline-none uppercase tracking-widest" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* SD Controls Sidebar */}
              <div className="w-full lg:w-96 bg-[#080101] border-l border-red-900/30 p-10 space-y-12 overflow-y-auto custom-scrollbar shadow-[-20px_0_60px_rgba(0,0,0,0.4)]">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[12px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"><Sliders className="w-5 h-5" /> Config Matrix</h4>
                    <span className="text-[10px] font-mono text-red-900 font-black">V4.1_EX</span>
                 </div>

                 {/* Checkpoint Selector */}
                 <div className="space-y-5">
                    <label className="text-[11px] font-black text-red-800 uppercase tracking-[0.2em] flex items-center gap-3"><HardDrive className="w-4 h-4" /> Neural Weights</label>
                    <div className="relative">
                      <select value={sdParams.checkpoint} onChange={(e) => setSdParams({...sdParams, checkpoint: e.target.value})} className="w-full bg-[#0d0404] border border-red-900/40 rounded-2xl px-6 py-4 text-[13px] text-red-100 outline-none focus:border-red-600/60 transition-all appearance-none cursor-pointer font-bold">
                         <option>SDXL-V1.0-Base</option>
                         <option>DreamShaper-v8</option>
                         <option>Deliberate-V3</option>
                         <option>Realistic-Vision-V6</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-red-800"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                    </div>
                 </div>

                 {/* Steps Slider */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <label className="text-[11px] font-black text-red-800 uppercase tracking-[0.2em] flex items-center gap-3"><Activity className="w-4 h-4" /> Sampling Iterations</label>
                       <span className="text-sm font-mono text-red-500 font-black drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">{sdParams.steps}</span>
                    </div>
                    <input type="range" min="1" max="100" value={sdParams.steps} onChange={(e) => setSdParams({...sdParams, steps: parseInt(e.target.value)})} className="w-full h-2 bg-red-950/40 rounded-full appearance-none cursor-pointer accent-red-600" />
                 </div>

                 {/* CFG Scale */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <label className="text-[11px] font-black text-red-800 uppercase tracking-[0.2em] flex items-center gap-3"><Gauge className="w-4 h-4" /> Guidance Scale</label>
                       <span className="text-sm font-mono text-red-500 font-black drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">{sdParams.cfgScale}</span>
                    </div>
                    <input type="range" min="1" max="20" step="0.5" value={sdParams.cfgScale} onChange={(e) => setSdParams({...sdParams, cfgScale: parseFloat(e.target.value)})} className="w-full h-2 bg-red-950/40 rounded-full appearance-none cursor-pointer accent-red-600" />
                 </div>

                 {/* Seed & AR */}
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-red-800 uppercase tracking-widest">Seed</label>
                       <input type="number" value={sdParams.seed} onChange={(e) => setSdParams({...sdParams, seed: parseInt(e.target.value)})} className="w-full bg-[#0d0404] border border-red-900/40 rounded-2xl px-5 py-3 text-sm text-red-100 outline-none font-bold" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-black text-red-800 uppercase tracking-widest">Aspect Ratio</label>
                       <div className="flex gap-2">
                          {['1:1', '16:9', '9:16'].map(ar => (
                             <button key={ar} onClick={() => setSdParams({...sdParams, aspectRatio: ar as any})} className={`flex-1 py-3 text-[10px] font-black border rounded-xl transition-all ${sdParams.aspectRatio === ar ? 'bg-red-700 text-white border-red-500 shadow-[0_0_15px_rgba(185,28,28,0.4)]' : 'bg-red-950/10 border-red-900/20 text-red-900 hover:text-red-500'}`}>{ar}</button>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Visual Injector */}
                 <div className="space-y-6 pt-8 border-t border-red-900/20">
                    <h4 className="text-[11px] font-black text-red-800 uppercase tracking-[0.2em]">Source Reference</h4>
                    {!studioRefImage ? (
                      <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-red-900/20 rounded-[40px] cursor-pointer hover:border-red-600/40 hover:bg-red-950/10 transition-all group">
                        <Upload className="w-10 h-10 text-red-950 group-hover:text-red-600 transition-colors" />
                        <span className="mt-5 text-[12px] text-red-900 font-black uppercase tracking-[0.3em] group-hover:text-red-400">Inject Frame</span>
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if(f) setStudioRefImage({ data: await fileToBase64(f), mimeType: f.type });
                        }} />
                      </label>
                    ) : (
                      <div className="relative rounded-3xl overflow-hidden border border-red-600/40 group/ref shadow-2xl">
                        <img src={`data:${studioRefImage.mimeType};base64,${studioRefImage.data}`} className="w-full h-56 object-cover transition-transform duration-700 group-hover/ref:scale-110" />
                        <div className="absolute inset-0 bg-red-950/60 opacity-0 group-hover/ref:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                           <button onClick={() => setStudioRefImage(null)} className="p-4 bg-red-600 rounded-full text-white shadow-2xl scale-0 group-hover/ref:scale-100 transition-transform duration-300"><Trash2 className="w-6 h-6" /></button>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )}

          {/* NODE BRIDGE */}
          {activeTab === 'termux' && (
            <div className="h-full p-10 flex flex-col gap-10 animate-in zoom-in-95 duration-500">
               <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-10">
                  <div className="lg:col-span-1 flex flex-col gap-10">
                     <div className="bg-[#0d0404] rounded-[40px] border border-red-900/30 p-10 flex flex-col justify-center space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        <div className="absolute -bottom-16 -right-16 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-700">
                           <Smartphone className="w-64 h-64 text-red-600" />
                        </div>
                        <div className="space-y-4 relative">
                           <h2 className="text-3xl font-black text-red-100 tracking-tighter uppercase leading-none">Crimson Bridge</h2>
                           <p className="text-[13px] text-red-900 leading-relaxed font-bold tracking-tight">Sync mobile hardware with node clusters for low-latency neural inference.</p>
                        </div>
                        <button onClick={() => { setTermuxStatus('connecting'); setTimeout(() => setTermuxStatus('connected'), 1200); }} className="w-full py-6 bg-red-700 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(185,28,28,0.3)] active:scale-95 transition-all">Connect Hub</button>
                     </div>
                     <div className="bg-[#0d0404] rounded-[40px] border border-red-900/30 p-10 space-y-6 shadow-xl">
                        <h4 className="text-[12px] font-black text-red-800 uppercase tracking-[0.3em] flex items-center gap-3"><Activity className="w-5 h-5 text-red-600" /> Node Vitals</h4>
                        <div className="space-y-6">
                           <div className="flex justify-between text-[11px] font-mono"><span className="text-red-900 font-black">MEM_LOAD:</span><span className="text-red-500 font-black">72%</span></div>
                           <div className="w-full h-2.5 bg-red-950/20 rounded-full overflow-hidden border border-red-900/10"><div className="w-[72%] h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" /></div>
                           <div className="flex justify-between text-[11px] font-mono"><span className="text-red-900 font-black">THERMALS:</span><span className="text-red-500 font-black">42°C</span></div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="lg:col-span-3 bg-[#0d0404] rounded-[40px] border border-red-900/30 p-12 flex flex-col space-y-10 shadow-2xl relative">
                     <div className="flex items-center justify-between border-b border-red-900/20 pb-8">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-red-100 flex items-center gap-4 uppercase tracking-tighter"><Network className="w-7 h-7 text-red-600" /> Mobile Model Stash</h3>
                           <p className="text-sm text-red-900 font-bold tracking-widest">Safetensors and LoRA cluster synchronization.</p>
                        </div>
                        <label className="px-6 py-4 bg-red-800/10 border border-red-700/30 rounded-2xl cursor-pointer hover:bg-red-800/20 transition-all text-red-500 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg">
                           <Plus className="w-5 h-5" /> <span>Sync Model</span>
                           <input type="file" className="hidden" multiple onChange={handleTermuxFileUpload} />
                        </label>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
                        {termuxFiles.length === 0 ? (
                          <div className="col-span-2 h-full flex flex-col items-center justify-center text-red-950 italic gap-6 opacity-30">
                             <Database className="w-24 h-24" />
                             <p className="uppercase font-black tracking-[0.4em] text-sm">Cluster Stash Empty</p>
                          </div>
                        ) : (
                          termuxFiles.map((f, i) => (
                            <div key={i} className="flex flex-col p-8 bg-red-950/5 border border-red-900/20 rounded-[32px] group hover:bg-red-900/10 hover:border-red-600/40 transition-all relative overflow-hidden shadow-inner">
                               <div className="flex items-center gap-6 mb-6 relative z-10">
                                  <div className="p-4 bg-red-900/20 rounded-2xl shadow-xl">
                                     {f.category === 'model' ? <HardDrive className="w-6 h-6 text-red-500" /> : <FileCode className="w-6 h-6 text-red-800" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <p className="text-[15px] font-black text-red-100 truncate uppercase tracking-tight leading-none">{f.name}</p>
                                     <p className="text-[10px] uppercase tracking-[0.3em] text-red-800 font-black mt-2">{f.size} • {f.category}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-3 relative z-10">
                                  <button className="flex-1 py-3 bg-red-900/20 hover:bg-red-700 text-[11px] font-black uppercase text-red-700 hover:text-white rounded-xl transition-all tracking-widest">Initialize</button>
                                  <button onClick={() => setTermuxFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-3 text-red-900 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                               </div>
                               <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/[0.03] blur-[50px] rounded-full" />
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
            <div className="h-full p-10 flex flex-col gap-10 animate-in zoom-in-95 duration-500">
               <div className="flex-1 bg-[#0d0404] rounded-[50px] border border-red-900/30 p-12 flex flex-col space-y-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/5 blur-[100px] rounded-full pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-red-900/20 pb-8 relative z-10">
                     <div className="space-y-2">
                        <h3 className="text-3xl font-black text-red-100 flex items-center gap-5 uppercase tracking-tighter">
                          <HardDrive className="w-8 h-8 text-red-600" /> 
                          Neural Data Core
                        </h3>
                        <p className="text-sm text-red-900 font-bold tracking-widest uppercase">Hardware-backed document storage & database cluster</p>
                     </div>
                     <label className="px-8 py-4 bg-red-700 text-white rounded-2xl cursor-pointer hover:bg-red-600 transition-all flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(185,28,28,0.3)] active:scale-95">
                        <Upload className="w-5 h-5" /> 
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
                         <motion.div 
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: i * 0.05 }}
                           key={f.id} 
                           className="flex flex-col p-8 bg-red-950/5 border border-red-900/20 rounded-[40px] group hover:bg-red-900/10 hover:border-red-600/40 transition-all relative overflow-hidden shadow-inner"
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
                         </motion.div>
                       ))
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="h-full p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 bg-[#020204]">
              <div className="max-w-4xl mx-auto space-y-16 pb-20">
                <header className="space-y-4 border-b border-red-900/30 pb-12 flex items-end justify-between">
                   <div className="space-y-2">
                      <h2 className="text-5xl font-black text-red-100 tracking-tighter uppercase leading-none drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">Crimson Core</h2>
                      <p className="text-red-900 text-[13px] font-black tracking-[0.2em] uppercase">Architecture & Neural Personalities Control</p>
                   </div>
                   <div className="px-6 py-3 bg-red-950/20 border border-red-900/30 rounded-2xl text-[12px] font-mono text-red-600 font-black shadow-inner">SYSTEM_STATE: OPTIMAL</div>
                </header>

                {/* Personalities */}
                <section className="space-y-10">
                   <h3 className="text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><Sparkles className="w-6 h-6 text-red-600" /> Neural Archetypes</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {personalities.map(p => (
                        <div key={p.id} onClick={() => setPersonalities(prev => prev.map(pers => ({ ...pers, active: pers.id === p.id })))} className={`p-10 rounded-[40px] border transition-all cursor-pointer group relative overflow-hidden ${p.active ? 'bg-red-900/10 border-red-600/50 shadow-[0_20px_60px_rgba(153,27,27,0.2)] scale-[1.03]' : 'bg-[#0a0202] border-red-900/20 hover:border-red-900/60 hover:scale-[1.01]'}`}>
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

                {/* Logic Injection */}
                <section className="space-y-10">
                   <h3 className="text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><Brain className="w-6 h-6 text-red-600" /> Core Synthesis Injection</h3>
                   <div className="bg-[#0a0202] rounded-[50px] border border-red-900/30 p-14 space-y-14 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-20 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-1000 pointer-events-none">
                         <Network className="w-[500px] h-[500px] text-red-600" />
                      </div>

                      <div className="flex items-start justify-between relative z-10">
                         <div className="space-y-4">
                            <h4 className="text-3xl font-black text-red-100 tracking-tighter uppercase leading-none">Crimson Neural Fabric</h4>
                            <p className="text-base text-red-900 font-bold tracking-[0.1em]">Inject logic kernels or data trees to refine autonomous model control.</p>
                         </div>
                         <div className="flex bg-red-950/20 p-2 rounded-2xl border border-red-900/20">
                            {['python', 'kotlin', 'nodejs'].map(r => (
                              <button key={r} onClick={() => setBrainConfig({...brainConfig, runtime: r})} className={`px-8 py-3 rounded-xl text-[12px] font-black uppercase transition-all tracking-[0.3em] ${brainConfig.runtime === r ? 'bg-red-700 text-white shadow-[0_0_20px_rgba(185,28,28,0.5)]' : 'text-red-900 hover:text-red-600'}`}>{r}</button>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                         <div className="lg:col-span-2 space-y-5">
                            <label className="text-[12px] font-black text-red-800 uppercase tracking-[0.4em] flex items-center gap-4"><Code2 className="w-5 h-5" /> Logic Manifest</label>
                            <textarea value={brainConfig.logic} onChange={(e) => setBrainConfig({...brainConfig, logic: e.target.value})} placeholder="Initialize system with core logic strings..." className="w-full h-96 bg-black/80 border border-red-950 rounded-[40px] p-10 text-[14px] font-mono text-red-500 outline-none focus:border-red-600/50 resize-none custom-scrollbar shadow-[inset_0_4px_20px_rgba(0,0,0,0.9)]" />
                         </div>
                         <div className="space-y-5">
                            <label className="text-[12px] font-black text-red-800 uppercase tracking-[0.4em] flex items-center gap-4"><FileSearch className="w-5 h-5" /> Data Anchors</label>
                            {!brainRefFile ? (
                              <label className="flex flex-col items-center justify-center h-96 border-4 border-dashed border-red-950 rounded-[40px] cursor-pointer hover:border-red-600/40 hover:bg-red-950/10 transition-all group/up">
                                <Plus className="w-16 h-16 text-red-950 group-hover/up:scale-110 group-hover/up:text-red-600 transition-all mb-8" />
                                <span className="text-[15px] text-red-900 font-black uppercase text-center px-10 leading-tight tracking-[0.2em]">Deploy Neural Database<br/><span className="text-[11px] opacity-40 font-mono mt-4 block tracking-[0.5em]">SYSTEM_INGESTION_PENDING</span></span>
                                <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if(f) setBrainRefFile({ name: f.name, data: await fileToBase64(f), mimeType: f.type });
                                }} />
                              </label>
                            ) : (
                              <div className="h-96 bg-red-900/5 border border-red-600/30 rounded-[40px] p-12 flex flex-col items-center justify-center text-center space-y-10 relative group/staged animate-in zoom-in-95 shadow-2xl backdrop-blur-md">
                                 <div className="p-8 bg-red-600/10 rounded-[50px] shadow-[0_0_30px_rgba(220,38,38,0.2)]"><BookOpen className="w-20 h-20 text-red-500" /></div>
                                 <div className="space-y-4">
                                    <p className="text-lg font-black text-red-100 truncate max-w-[240px] uppercase tracking-tighter">{brainRefFile.name}</p>
                                    <p className="text-[11px] text-red-500 font-mono tracking-[0.5em] uppercase font-black px-6 py-2 bg-red-600/10 rounded-full border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.3)]">SYNC_READY</p>
                                 </div>
                                 <button onClick={() => setBrainRefFile(null)} className="absolute top-8 right-8 p-3.5 bg-red-900/10 text-red-600 rounded-3xl opacity-0 group-hover/staged:opacity-100 transition-all hover:bg-red-600 hover:text-white shadow-2xl"><Trash2 className="w-6 h-6" /></button>
                              </div>
                            )}
                         </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-end justify-between gap-12 pt-14 relative z-10 border-t border-red-900/20">
                         <div className="flex-1 w-full space-y-6">
                            <h4 className="text-[12px] font-black text-red-800 uppercase tracking-[0.5em] flex items-center gap-4"><Database className="w-5 h-5" /> Virtual Core Mounts</h4>
                            <div className="flex flex-wrap gap-4">
                               {brainConfig.mappedPaths.map((p, i) => <div key={i} className="px-6 py-3 bg-red-950/20 border border-red-900/20 rounded-2xl text-[11px] font-mono text-red-900 font-black hover:text-red-500 transition-colors cursor-crosshair">{p}</div>)}
                            </div>
                         </div>
                         <button 
                            onClick={async () => {
                              if (!brainConfig.logic.trim() && !brainRefFile) return;
                              setIsAiProcessing(true);
                              setTerminalOutput(prev => [...prev, `[KERNEL] Initializing crimson neural fabric...`]);
                              try {
                                const response = await ai.models.generateContent({
                                  model: 'gemini-3-pro-preview',
                                  contents: `Logic: ${brainConfig.logic}\n\nTask: Output a futuristic crimson directory tree for this logic and 3 setup commands.`,
                                  config: { systemInstruction: activePersonality.instruction }
                                });
                                setTerminalOutput(prev => [...prev, `[CORE] Matrix Synchronized:`, response.text || 'Process Ready.', `[SYSTEM] Crimson Node Online.`]);
                                setActiveTab('terminal');
                              } catch(e) {} finally { setIsAiProcessing(false); }
                            }}
                            disabled={isAiProcessing || (!brainConfig.logic && !brainRefFile)} 
                            className="w-full md:w-auto py-8 px-16 bg-red-700 hover:bg-red-600 text-white rounded-[40px] font-black flex items-center justify-center gap-6 shadow-[0_30px_70px_rgba(185,28,28,0.4)] active:scale-95 transition-all disabled:opacity-50 group/btn relative overflow-hidden"
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

      {/* Template Selection Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-[#0d0404] border border-red-900/30 rounded-[60px] shadow-[0_0_100px_rgba(185,28,28,0.2)] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-12 border-b border-red-900/20 bg-black/40 flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter">Initialize Neural Project</h3>
                <p className="text-sm text-red-900 font-bold tracking-widest uppercase">Select a predefined template to begin your development cycle</p>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} className="p-4 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all">
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {(Object.keys(PROJECT_TEMPLATES) as Array<keyof typeof PROJECT_TEMPLATES>).map(key => (
                  <button 
                    key={key}
                    onClick={() => handleLoadTemplate(key)}
                    className="group p-8 bg-red-950/5 border border-red-900/20 rounded-[40px] text-left space-y-6 hover:bg-red-900/10 hover:border-red-500/40 transition-all active:scale-95"
                  >
                    <div className="w-16 h-16 bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      {key === 'python-web' && <Network className="w-8 h-8" />}
                      {key === 'rust-cli' && <TerminalIcon className="w-8 h-8" />}
                      {key === 'neural-module' && <Brain className="w-8 h-8" />}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-red-100 uppercase tracking-tight">{PROJECT_TEMPLATES[key].name}</h4>
                      <p className="text-[11px] text-red-900 font-bold uppercase tracking-widest leading-relaxed">
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
            <div className="p-12 bg-black/40 border-t border-red-900/20 text-center">
              <p className="text-[10px] text-red-900 font-black uppercase tracking-[0.4em]">Crimson OS Neural Development Environment v4.1.0_EX</p>
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
  const root = createRoot(container);
  root.render(<App />);
}
