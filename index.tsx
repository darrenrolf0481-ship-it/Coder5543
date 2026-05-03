/// <reference types="vite/client" />

interface KnowledgeEntry {
  id: string;
  type: 'file' | 'github' | 'text';
  name: string;
  content: string;
  url?: string;
  size?: number;
  addedAt: string;
}
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './index.css';
import './phi_geometry.css';
import { createRoot } from 'react-dom/client';
import DOMPurify from 'dompurify';
import { FileTree } from './src/components/FileTree';
import { TerminalLine } from './src/components/TerminalLine';
import { SettingsPanel } from './src/components/panels/SettingsPanel';
import { ToolNeuronPanel } from './src/components/panels/ToolNeuronPanel';
import { TerminalPanel } from './src/components/panels/TerminalPanel';
import { EditorPanel } from './src/components/panels/EditorPanel';
import { AnalysisPanel } from './src/components/panels/AnalysisPanel';
import { NodeBridgePanel } from './src/components/panels/NodeBridgePanel';
import { StoragePanel } from './src/components/panels/StoragePanel';
import { BrainPanel } from './src/components/panels/BrainPanel';
import { useBrain } from './src/hooks/useBrain';
import { useThrottledStorage } from './src/hooks/useThrottledStorage';
import { saveFileContents, loadFileContents, deleteFileContent } from './src/services/fileStore';
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
  FilePlus,
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
  Search,
  Paintbrush,
  Layers,
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  generateAIResponse as generateAIResponseService,
  fetchOllamaModels,
} from './src/services/aiService';
import Editor from '@monaco-editor/react';
import { useDebounce } from './src/lib/useDebounce';
import { usePipeline } from './src/hooks/usePipeline';
import type { PatternResult } from './src/services/pipeline/patternInjectionService';

// Initialize AI

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
      {
        id: 'app.py',
        name: 'app.py',
        type: 'file',
        parentId: 'root',
        language: 'python',
        content:
          'from flask import Flask, render_template\n\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    return render_template("index.html")\n\nif __name__ == "__main__":\n    app.run(debug=True)',
      },
      { id: 'templates', name: 'templates', type: 'folder', parentId: 'root', isOpen: true },
      {
        id: 'index.html',
        name: 'index.html',
        type: 'file',
        parentId: 'templates',
        language: 'html',
        content:
          '<!DOCTYPE html>\n<html>\n<head>\n    <title>Neural Web App</title>\n</head>\n<body style="background: #050101; color: #fecaca; font-family: sans-serif; padding: 2rem;">\n    <h1>Neural Interface Active</h1>\n    <p>Welcome to the Crimson OS web portal.</p>\n</body>\n</html>',
      },
      { id: 'static', name: 'static', type: 'folder', parentId: 'root', isOpen: false },
      {
        id: 'style.css',
        name: 'style.css',
        type: 'file',
        parentId: 'static',
        language: 'css',
        content: 'body { margin: 0; }',
      },
    ],
  },
  'rust-cli': {
    name: 'Rust CLI Tool',
    files: [
      { id: 'root', name: 'Rust_CLI_Project', type: 'folder', parentId: null, isOpen: true },
      { id: 'src', name: 'src', type: 'folder', parentId: 'root', isOpen: true },
      {
        id: 'main.rs',
        name: 'main.rs',
        type: 'file',
        parentId: 'src',
        language: 'rust',
        content:
          'use std::io;\n\nfn main() {\n    println!("Neural CLI Initialized.");\n    println!("Enter command:");\n    let mut input = String::new();\n    io::stdin().read_line(&mut input).unwrap();\n    println!("Executing: {}", input.trim());\n}',
      },
      {
        id: 'cargo.toml',
        name: 'Cargo.toml',
        type: 'file',
        parentId: 'root',
        language: 'toml',
        content:
          '[package]\nname = "neural-cli"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]',
      },
    ],
  },
  'neural-module': {
    name: 'Neural Module',
    files: [
      { id: 'root', name: 'Neural_Module', type: 'folder', parentId: null, isOpen: true },
      {
        id: 'core.py',
        name: 'core.py',
        type: 'file',
        parentId: 'root',
        language: 'python',
        content:
          'class NeuralModule:\n    def __init__(self):\n        self.active = True\n\n    def run(self):\n        print("Neural Module Running...")\n\nif __name__ == "__main__":\n    module = NeuralModule()\n    module.run()',
      },
      {
        id: 'config.json',
        name: 'config.json',
        type: 'file',
        parentId: 'root',
        language: 'json',
        content:
          '{\n  "module_name": "NeuralCore",\n  "version": "1.0.0",\n  "permissions": ["vault", "vision"]\n}',
      },
    ],
  },
};

const DRAFT_KEY = 'crimson_draft';

// ── φ System Bridge ───────────────────────────────────────────────────────────
// Connects brain endocrine state → CSS pulse column and transaction indicator.
// φ = 1.618 | 1/φ = 0.618 | Warn threshold = 61.8% | Evict threshold = 38.2%

const _PHI     = 1.618;
const _PHI_INV = 0.618;

function _setPulse(state: 'healthy' | 'warning' | 'error' | 'sync') {
  const el = document.querySelector('.phi-grid');
  if (el instanceof HTMLElement) el.dataset.pulse = state;
}
function _setTxProgress(v: number) {
  document.documentElement.style.setProperty('--tx-progress', String(Math.max(0, Math.min(1, v))));
}

function usePhi(endocrine: { dopamine: number; cortisol: number; lastUpdated: number }) {
  const commitTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (endocrine.cortisol >= 0.8)        _setPulse('error');
    else if (endocrine.cortisol >= _PHI_INV) _setPulse('warning');
    else if (endocrine.dopamine >= _PHI_INV) _setPulse('healthy');
    else                                   _setPulse('sync');
  }, [endocrine.cortisol, endocrine.dopamine, endocrine.lastUpdated]);

  React.useEffect(() => () => { if (commitTimer.current) clearTimeout(commitTimer.current); }, []);

  const beginTx   = React.useCallback(() => { if (commitTimer.current) clearTimeout(commitTimer.current); _setTxProgress(_PHI_INV); }, []);
  const commitTx  = React.useCallback(() => { _setTxProgress(1); commitTimer.current = setTimeout(() => _setTxProgress(0), 200); }, []);
  const rollbackTx = React.useCallback(() => { _setPulse('error'); _setTxProgress(0); }, []);

  return { beginTx, commitTx, rollbackTx, setPulse: _setPulse, phi: _PHI, phiInv: _PHI_INV };
}

// ── φ IndexedDB Quota Manager (inlined — no separate fileStore export needed) ──

async function enforcePhiQuota(): Promise<'ok' | 'warn' | 'evicted' | 'critical'> {
  if (!navigator.storage?.estimate) return 'ok';
  const { usage = 0, quota = 1 } = await navigator.storage.estimate();
  const ratio = usage / quota;
  if (ratio < _PHI_INV) return 'ok';

  const DB = 'crimson_files', STORE = 'file_contents';
  const db: IDBDatabase = await new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });

  const records: any[] = await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });

  const ephemeral = records
    .filter(r => r.priority === 'ephemeral')
    .sort((a, b) => (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0));

  if (ephemeral.length === 0) return 'critical';

  const evictCount = Math.max(1, Math.ceil(ephemeral.length * (1 - _PHI_INV)));
  const toEvict = ephemeral.slice(0, evictCount);

  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    toEvict.forEach(r => st.delete(r.id));
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });

  console.info(`[φ-Quota] Evicted ${evictCount} ephemeral record(s). Usage: ${(ratio * 100).toFixed(1)}%`);
  return 'evicted';
}

async function markEphemeral(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const DB = 'crimson_files', STORE = 'file_contents';
  const db: IDBDatabase = await new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onsuccess = () => res(r.result);
    r.onerror   = () => rej(r.error);
  });
  const records: any[] = await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
  const targets = records.filter(r => ids.includes(r.id));
  if (targets.length === 0) return;
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    targets.forEach(r => st.put({ ...r, priority: 'ephemeral' }));
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}

const App: React.FC = () => {
  // Crash recovery state
  const [hasRecoveryDraft, setHasRecoveryDraft] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<{
    fileId: string;
    fileName: string;
    content: string;
    ts: number;
  } | null>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [postCommitModalOpen, setPostCommitModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [templateConfirmKey, setTemplateConfirmKey] = useState<keyof typeof PROJECT_TEMPLATES | null>(null);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateMode, setGenerateMode] = useState<'snippet' | 'file'>('snippet');
  const [fileSearch, setFileSearch] = useState('');

  const handleLoadTemplate = (templateKey: keyof typeof PROJECT_TEMPLATES) => {
    setTemplateConfirmKey(templateKey);
  };

  const confirmLoadTemplate = () => {
    if (!templateConfirmKey) return;
    const template = PROJECT_TEMPLATES[templateConfirmKey];
    if (!template) return;

    setProjectFiles(template.files);

    const firstFile = template.files.find((f) => f.type === 'file');
    if (firstFile) {
      setActiveFileId(firstFile.id);
      setEditorContent(firstFile.content || '');
      setEditorLanguage(firstFile.language || 'text');
      setEditorMode(firstFile.language === 'html' ? 'preview' : 'code');
    }

    setGitRepo({
      initialized: false,
      branch: 'main',
      commits: [],
      staged: [],
      modified: [],
      stash: [],
    });

    setIsTemplateModalOpen(false);
    setTemplateConfirmKey(null);
  };

  // --- PERSISTENT STATE ---
  const [activeTab, setActiveTab] = useState<
    'terminal' | 'analysis' | 'termux' | 'storage' | 'settings' | 'editor' | 'toolneuron' | 'brain'
  >('toolneuron');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const { prepareContext, recordInteraction, endocrine } = useBrain();
  const phi = usePhi(endocrine);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // ToolNeuron State
  const [tnKnowledgePacks, setTnKnowledgePacks] = useState([
    { id: 1, name: 'Medical_Core_v2', size: '1.2GB', status: 'indexed' },
    { id: 2, name: 'Legal_Archive_2025', size: '850MB', status: 'indexed' },
  ]);

  const [debugAnalysis, setDebugAnalysis] = useState<{
    static: {
      status: 'idle' | 'running' | 'done';
      issues: { type: 'error' | 'warning' | 'info'; message: string; line?: number }[];
    };
    tracing: { status: 'idle' | 'running' | 'done'; logs: string[] };
    refactoring: { status: 'idle' | 'running' | 'done'; suggestions: string[] };
  }>({
    static: { status: 'idle', issues: [] },
    tracing: { status: 'idle', logs: [] },
    refactoring: { status: 'idle', suggestions: [] },
  });

  const runStaticAnalysis = async () => {
    setDebugAnalysis((prev) => ({ ...prev, static: { status: 'running', issues: [] } }));
    try {
      const response = await generateAIResponse(
        `Perform a static analysis of the following ${editorLanguage} code. Identify errors, warnings, and info-level issues. Return a JSON array of objects with fields: type ("error"|"warning"|"info"), message (string), line (number|null).\n\nCode:\n${editorContent}`,
        'You are an expert static analysis engine. Return ONLY a valid JSON array, no markdown. Each item: { "type": "error"|"warning"|"info", "message": "...", "line": number|null }',
        { modelType: 'fast', json: true }
      );
      let issues: { type: 'error' | 'warning' | 'info'; message: string; line?: number }[] = [];
      try {
        const raw = (response || '[]').replace(/```json|```/g, '').trim();
        issues = JSON.parse(raw);
      } catch { issues = [{ type: 'info', message: 'Could not parse analysis results.', line: undefined }]; }
      setDebugAnalysis((prev) => ({ ...prev, static: { status: 'done', issues } }));
    } catch {
      setDebugAnalysis((prev) => ({ ...prev, static: { status: 'done', issues: [{ type: 'error', message: 'Static analysis engine offline.', line: undefined }] } }));
    }
  };

  const runDynamicTracing = async () => {
    setDebugAnalysis((prev) => ({ ...prev, tracing: { status: 'running', logs: [] } }));
    try {
      const response = await generateAIResponse(
        `Simulate a dynamic trace of the following ${editorLanguage} code. Return a JSON array of trace log strings, simulating execution flow, variable mutations, and any exceptions.\n\nCode:\n${editorContent}`,
        'You are a dynamic execution tracer. Return ONLY a JSON array of strings — each string is a trace log line prefixed with [TRACE], [WARN], [EXEC], or [ERROR]. No markdown.',
        { modelType: 'fast', json: true }
      );
      let logs: string[] = [];
      try {
        const raw = (response || '[]').replace(/```json|```/g, '').trim();
        logs = JSON.parse(raw);
      } catch { logs = ['[TRACE] Unable to parse trace output.']; }
      // Stream logs in one-by-one for effect
      let i = 0;
      const interval = setInterval(() => {
        if (i < logs.length) {
          setDebugAnalysis((prev) => ({ ...prev, tracing: { ...prev.tracing, logs: [...prev.tracing.logs, logs[i]] } }));
          i++;
        } else {
          clearInterval(interval);
          setDebugAnalysis((prev) => ({ ...prev, tracing: { ...prev.tracing, status: 'done' } }));
        }
      }, 400);
    } catch {
      setDebugAnalysis((prev) => ({ ...prev, tracing: { status: 'done', logs: ['[ERROR] Trace engine offline.'] } }));
    }
  };

  const getRefactoringSuggestions = async () => {
    setDebugAnalysis((prev) => ({
      ...prev,
      refactoring: { ...prev.refactoring, status: 'running' },
    }));
    let outcome: 'success' | 'failure' | 'neutral' = 'neutral';
    const prompt = `As the ${activePersonality.name} personality, provide 3 short, high-impact code refactoring suggestions for a futuristic neural-linked application. Format as a simple list.`;
    let resultText = '';
    try {
      const brainContext = await prepareContext(prompt);
      const response = await generateAIResponse(
        prompt,
        activePersonality.instruction,
        { modelType: 'fast', brainContext }
      );
      const suggestions = (response?.split('\n') || [])
        .map((s) =>
          s
            .replace(/^[\s\d\.\-\*\)"]+/, '')
            .replace(/^["]+/, '')
            .replace(/["]+$/, '')
            .trim()
        )
        .filter((s) => s.length > 10)
        .slice(0, 3);
      resultText = suggestions.join('\n');
      setDebugAnalysis((prev) => ({ ...prev, refactoring: { status: 'done', suggestions } }));
      outcome = 'success';
    } catch (error) {
      console.warn(error);
      resultText = 'Error retrieving suggestions.';
      setDebugAnalysis((prev) => ({
        ...prev,
        refactoring: {
          status: 'done',
          suggestions: ['Error retrieving suggestions. Neural link unstable.'],
        },
      }));
      outcome = 'failure';
    } finally {
      // Use local resultText — not stale state from debugAnalysis
      await recordInteraction(prompt, resultText, outcome);
    }
  };

  // --- SWARM STATE ---
  const [swarmAnxiety, setSwarmAnxiety] = useState(0.12);
  const [swarmAgents, setSwarmAgents] = useState<Array<{id: string; name: string; expertise: string; status: 'active' | 'idle'; trust: number}>>([
    {
      id: 'agent_0',
      name: 'Visual_Cortex',
      expertise: 'PATTERN_MATCHING',
      status: 'idle',
      trust: 1.0,
    },
    {
      id: 'agent_1',
      name: 'Threat_Scanner',
      expertise: 'THREAT_DETECTION',
      status: 'active',
      trust: 0.95,
    },
    { id: 'agent_2', name: 'Social_Node', expertise: 'SOCIAL_NUANCE', status: 'idle', trust: 0.88 },
    {
      id: 'agent_3',
      name: 'Memory_Recall',
      expertise: 'MEMORY_RECALL',
      status: 'idle',
      trust: 1.0,
    },
    {
      id: 'agent_4',
      name: 'Creative_Core',
      expertise: 'CREATIVE_NOVELTY',
      status: 'idle',
      trust: 0.92,
    },
    {
      id: 'agent_5',
      name: 'Safety_Guardian',
      expertise: 'SAFETY_GUARDIAN',
      status: 'active',
      trust: 1.0,
    },
    {
      id: 'agent_6',
      name: 'Context_Engine',
      expertise: 'PATTERN_MATCHING',
      status: 'idle',
      trust: 0.97,
    },
  ]);
  const [swarmLogs, setSwarmLogs] = useState<
    { id: number; type: 'consensus' | 'pain' | 'info'; message: string; time: string }[]
  >([
    { id: 1, type: 'info', message: 'Swarm Consensus Engine Initialized.', time: '08:45:12' },
    { id: 2, type: 'info', message: 'Pain Propagation Protocol Active.', time: '08:45:15' },
  ]);

  // Editor State
  const [editorLanguage, setEditorLanguage] = useState('python');
  const [projectFiles, setProjectFiles] = useState<any[]>([
    { id: 'root', name: 'Project', type: 'folder', parentId: null, isOpen: true },
    { id: 'src', name: 'src', type: 'folder', parentId: 'root', isOpen: true },
    {
      id: 'brain.py',
      name: 'neural_brain.py',
      type: 'file',
      parentId: 'src',
      language: 'python',
      content:
        '# AI Brain Logic\nclass NeuralCore:\n    def __init__(self):\n        self.synapses = 10**12\n\n    def process(self, input_data):\n        return f"Neural processing: {input_data}"\n\ncore = NeuralCore()\nprint(core.process("Initial stimulus"))',
    },
    {
      id: 'ui.html',
      name: 'interface.html',
      type: 'file',
      parentId: 'src',
      language: 'html',
      content:
        '<div class="p-8 bg-red-900/20 rounded-3xl border border-red-500/30">\n  <h1 class="text-2xl font-black text-red-500 uppercase">Neural Interface</h1>\n  <p class="text-red-100/60 mt-4">Real-time UI component rendering via Crimson Engine.</p>\n  <button class="mt-8 px-6 py-3 bg-red-700 text-white rounded-xl uppercase font-black text-xs tracking-widest">Activate Core</button>\n</div>',
    },
    {
      id: 'logic.rs',
      name: 'core_logic.rs',
      type: 'file',
      parentId: 'src',
      language: 'rust',
      content:
        'fn main() {\n    let neural_load = 0.85;\n    println!("System load: {}%", neural_load * 100.0);\n}',
    },
  ]);
  const [activeFileId, setActiveFileId] = useState('brain.py');
  const [editorContent, setEditorContent] = useState(
    projectFiles.find((f) => f.type === 'file')?.content ?? ''
  );
  const debouncedEditorContent = useDebounce(editorContent, 150);
  const [editorOutput, setEditorOutput] = useState('');
  const [editorMode, setEditorMode] = useState<'code' | 'preview' | 'debug' | 'git' | 'settings'>(
    'code'
  );
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isLivePreviewEnabled, setIsLivePreviewEnabled] = useState(true);
  const [isPairProgrammerActive, setIsPairProgrammerActive] = useState(false);
  const [isMobileFileTreeOpen, setIsMobileFileTreeOpen] = useState(false);
  const [isScanningCode, setIsScanningCode] = useState(false);
  const [scanResults, setScanResults] = useState<number[]>([]);
  const [editorAssistantInput, setEditorAssistantInput] = useState('');
  const [editorAssistantMessages, setEditorAssistantMessages] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([]);
  const [isEditorAssistantOpen, setIsEditorAssistantOpen] = useState(false);
  const [termInput, setTermInput] = useState('');
  const [cursorLine, setCursorLine] = useState(1);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string | null;
  } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creatingInId, setCreatingInId] = useState<{
    parentId: string | null;
    type: 'file' | 'folder';
  } | null>(null);
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

  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;
    editor.onDidBlurEditorText(() => {
      // Flush immediately on blur using the same refs the stable interval uses
      setProjectFiles((prev) => {
        const current = prev.find((f) => f.id === activeFileIdRef.current);
        if (current && current.content !== editorContentRef.current) {
          setLastSavedTime(new Date().toLocaleTimeString());
          return prev.map((f) =>
            f.id === activeFileIdRef.current ? { ...f, content: editorContentRef.current } : f
          );
        }
        return prev;
      });
    });
  };
  const decorationsRef = useRef<string[]>([]);

  // forceSave: immediately flush editorContent → projectFiles + refresh draft slot
  const forceSave = useCallback(() => {
    if (!activeFileId) return;
    setProjectFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: editorContent } : f))
    );
    setLastSavedTime(new Date().toLocaleTimeString());
    try {
      const fileName = projectFiles.find((f: any) => f.id === activeFileId)?.name ?? activeFileId;
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ fileId: activeFileId, fileName, content: editorContent, ts: Date.now() })
      );
    } catch {}
  }, [activeFileId, editorContent, projectFiles]);

  // Write crash-recovery draft every 500ms on content change
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const fileName = projectFiles.find((f: any) => f.id === activeFileId)?.name ?? activeFileId;
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ fileId: activeFileId, fileName, content: editorContent, ts: Date.now() })
        );
      } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [activeFileId, editorContent, projectFiles]);

  // Clear draft on clean exit — only persists after a crash
  useEffect(() => {
    const clear = () => localStorage.removeItem(DRAFT_KEY);
    window.addEventListener('beforeunload', clear);
    return () => window.removeEventListener('beforeunload', clear);
  }, []);

  // Check for orphaned draft on boot (delay lets prefs load first)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (!draft?.content || !draft?.fileId) return;
        if (Date.now() - draft.ts > 24 * 60 * 60 * 1000) {
          localStorage.removeItem(DRAFT_KEY);
          return;
        }
        setRecoveryDraft(draft);
        setHasRecoveryDraft(true);
      } catch {}
    }, 600);
    return () => clearTimeout(id);
  }, []);

  const restoreDraft = useCallback(() => {
    if (!recoveryDraft) return;
    setActiveFileId(recoveryDraft.fileId);
    setEditorContent(recoveryDraft.content);
    setProjectFiles((prev) =>
      prev.map((f: any) =>
        f.id === recoveryDraft.fileId ? { ...f, content: recoveryDraft.content } : f
      )
    );
    setLastSavedTime(new Date().toLocaleTimeString());
    localStorage.removeItem(DRAFT_KEY);
    setHasRecoveryDraft(false);
    setRecoveryDraft(null);
  }, [recoveryDraft]);

  const dismissDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasRecoveryDraft(false);
    setRecoveryDraft(null);
  }, []);

  // Ctrl+S / Cmd+S — force save (placed after forceSave is defined)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        forceSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forceSave]);

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
    callStack: [],
  });
  const [debugRefactorResult, setDebugRefactorResult] = useState<{
    refactoredCode: string;
    explanation: string;
  } | null>(null);

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
    stash: [],
  });

  const [projectSettings, setProjectSettings] = useState({
    buildPath: './dist',
    compilerFlags: '-O3 -march=native',
    ollamaUrl: 'http://127.0.0.1:11434',
    envVariables: [
      { key: 'NEURAL_MODE', value: 'production' },
      { key: 'BRAIN_CORE_COUNT', value: '128' },
    ],
    projectProfiles: [
      { id: 'default', name: 'Default', instruction: 'You are a helpful coding assistant.' },
    ],
    activeProfileId: 'default',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateProjectSettings = (settings: typeof projectSettings) => {
    const errors: Record<string, string> = {};

    // Build Path Validation
    if (!settings.buildPath.trim()) {
      errors.buildPath = 'Build path is required';
    } else if (!/^[\.\/a-zA-Z0-9_-]+$/.test(settings.buildPath) || settings.buildPath.split('/').some(seg => seg === '..')) {
      errors.buildPath =
        'Invalid path format (use alphanumeric, dots, slashes, underscores, hyphens; ".." not allowed)';
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
        errors[`env_key_${idx}`] =
          'Invalid key format (must start with letter/underscore and contain only alphanumeric/underscore)';
      }

      if (!env.value.trim()) {
        errors[`env_value_${idx}`] = 'Value is required';
      }
    });

    // Project Profiles Validation
    settings.projectProfiles.forEach((profile, idx) => {
      if (!profile.name.trim()) {
        errors[`profile_name_${idx}`] = 'Profile name is required';
      }
    });

    // Active Profile ID Validation
    const activeProfile = settings.projectProfiles.find((p) => p.id === settings.activeProfileId);
    if (!activeProfile) {
      errors.activeProfileId = 'Invalid active profile ID';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // AI Studio / SD State
  const [negativePrompt, setNegativePrompt] = useState(
    'blurry, low resolution, artifacts, mutated limbs, bad anatomy'
  );
  const [sdParams, setSdParams] = useState({
    checkpoint: 'SDXL-V1.0-Base',
    steps: 32,
    cfgScale: 8.0,
    seed: -1,
    aspectRatio: '1:1' as '1:1' | '16:9' | '9:16',
  });

  // Personalities
  const [aiProvider, setAiProvider] = useState<'google' | 'grok' | 'ollama'>('google');
  const [aiModel, setAiModel] = useState<string>('gemini-2.5-pro-preview-05-06');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>(
    'idle'
  );

  const refreshOllamaModels = useCallback(
    async (silent = false) => {
      setOllamaStatus('connecting');
      const url = projectSettings.ollamaUrl || 'http://127.0.0.1:11434';

      try {
        const models = await fetchOllamaModels(url);
        setOllamaModels(models);
        setOllamaStatus('connected');
        if (models.length > 0 && !models.includes(aiModel)) {
          setAiModel(models[0]);
        }
      } catch (err: any) {
        console.warn('Ollama is not reachable:', err.message);
        setOllamaModels([]);
        setOllamaStatus('error');

        if (!silent) {
          setChatMessages((prev) => [
            {
              role: 'ai',
              text: `⚠️ **Ollama Connection Error**: ${err.message}
          
**Common Fixes:**
1. Ensure Ollama is running.
2. If the app is hosted on HTTPS, you must use an HTTPS Ollama URL or run Ollama locally on a machine that allows insecure connections.
3. Set the environment variable: \`OLLAMA_ORIGINS="*" ollama serve\` to allow browser access.
4. Check the URL in **Project Config**.`,
              timestamp: Date.now(),
            },
            ...prev,
          ]);
        }
      }
    },
    [aiProvider, projectSettings.ollamaUrl, aiModel]
  );

  // --- OLLAMA MODELS FETCH ---
  useEffect(() => {
    if (aiProvider === 'ollama') {
      refreshOllamaModels(true);
    }
  }, [aiProvider, projectSettings.ollamaUrl]);

  const [grokApiKey, setGrokApiKey] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    import.meta.env.VITE_GEMINI_API_KEY || ''
  );

  const googleAiClient = useMemo(
    () => (geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null),
    [geminiApiKey]
  );

  const [personalities, setPersonalities] = useState([
    {
      id: 1,
      name: 'Frontend Master',
      instruction:
        'You are the Frontend Master, an expert in React, Tailwind CSS, and bleeding-edge UI/UX patterns. You write clean, accessible, and highly interactive frontend code.',
      active: true,
      suggestions: ['build_ui', 'optimize_render', 'add_animations', 'fix_styling'],
      knowledgeBase: [] as KnowledgeEntry[],
    },
    {
      id: 2,
      name: 'Backend Guru',
      instruction:
        'You are the Backend Guru, specializing in Node.js, Express, databases, and API design. You create robust, scalable, and secure server-side architectures.',
      active: false,
      suggestions: ['design_api', 'optimize_db', 'fix_memory_leak', 'secure_endpoint'],
      knowledgeBase: [] as KnowledgeEntry[],
    },
    {
      id: 3,
      name: 'Fullstack Architect',
      instruction:
        'You are the Fullstack Architect. You excel at system design, connecting frontend interfaces to complex backend services, and ensuring end-to-end data flow.',
      active: false,
      suggestions: ['system_design', 'api_integration', 'debug_stack', 'setup_service'],
      knowledgeBase: [] as KnowledgeEntry[],
    },
    {
      id: 4,
      name: 'DevOps Engineer',
      instruction:
        'You are the DevOps Engineer, a master of CI/CD, Docker, Kubernetes, and cloud infrastructure. You ensure code is delivered reliably and scales infinitely.',
      active: false,
      suggestions: ['write_dockerfile', 'setup_cicd', 'optimize_build', 'configure_nginx'],
      knowledgeBase: [] as KnowledgeEntry[],
    },
    {
      id: 5,
      name: 'Security Auditor',
      instruction:
        'You are the Security Auditor. You fiercely inspect code for vulnerabilities like XSS, SQLi, and logic flaws, ensuring every line is battle-hardened and secure.',
      active: false,
      suggestions: ['audit_code', 'harden_auth', 'find_vulnerabilities', 'patch_exploit'],
      knowledgeBase: [] as KnowledgeEntry[],
    },
    {
      id: 6,
      name: 'Algo Specialist',
      instruction:
        'You are the Algorithm Specialist, obsessed with Big O notation, data structures, and computational efficiency. You solve the hardest algorithmic challenges.',
      active: false,
      suggestions: ['optimize_algo', 'refactor_loop', 'solve_data_structure', 'write_sort'],
      knowledgeBase: [] as KnowledgeEntry[],
    },
  ]);

  // --- NON-PERSISTENT STATE ---
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'CRIMSON OS v4.1.0_KORE_BOOT',
    'Kernel: Android-SD Neural Link Established',
    'Voltage stable. Hyper-threaded nodes online.',
  ]);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [multiLineBuffer, setMultiLineBuffer] = useState('');

  const [termSuggestion, setTermSuggestion] = useState('');
  const [termSuggestions, setTermSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState('~/crimson-node/sd-webui');
  const [realCwd, setRealCwd] = useState('/data/data/com.termux/files/home');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [chatMessages, setChatMessages] = useState<
    {
      role: 'user' | 'ai';
      text: string;
      type?: 'text' | 'image';
      url?: string;
      timestamp: number;
    }[]
  >([
    {
      role: 'ai',
      text: 'Neural Interface Active. Code Analysis engine synchronized with local hardware.',
      timestamp: Date.now(),
    },
  ]);
  const [chatSummary, setChatSummary] = useState<string>('');
  const [studioInput, setStudioInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [studioRefImage, setStudioRefImage] = useState<{ data: string; mimeType: string } | null>(
    null
  );
  const [termuxStatus, setTermuxStatus] = useState<'disconnected' | 'connecting' | 'connected'>(
    'disconnected'
  );
  const [termuxFiles, setTermuxFiles] = useState<
    { name: string; size: string; type: string; category: 'model' | 'asset' | 'config' }[]
  >([
    { name: 'v1-5-pruned-emaonly.safetensors', size: '3.97GB', type: 'model', category: 'model' },
    { name: 'deliberate_v2.safetensors', size: '2.1GB', type: 'model', category: 'model' },
  ]);
  const [brainConfig, setBrainConfig] = useState({
    runtime: 'python',
    logic: '',
    mappedPaths: ['/sdcard/Download/Crimson-Weights', '/data/data/com.termux/files/home'],
  });
  const [brainRefFile, setBrainRefFile] = useState<{
    name: string;
    data: string;
    mimeType: string;
  } | null>(null);

  // --- STORAGE STATE ---
  const [storageFiles, setStorageFiles] = useState<
    { id: number; name: string; size: string; type: string; date: string }[]
  >([
    { id: 1, name: 'Neural_Architecture_v4.pdf', size: '2.4MB', type: 'pdf', date: '2024-03-20' },
    { id: 2, name: 'System_Directives.docx', size: '45KB', type: 'docx', date: '2024-03-22' },
  ]);

  // --- VAULT STATE ---
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const handleStorageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map((file: any, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      type: file.name.split('.').pop() || 'unknown',
      date: new Date().toISOString().split('T')[0],
    }));

    setStorageFiles((prev) => [...newFiles, ...prev]);
    setTerminalOutput((prev) => [
      ...prev,
      `[STORAGE] Ingested ${newFiles.length} documents into Data Core.`,
    ]);
  };

  const triggerSwarmCycle = async () => {
    setIsAiProcessing(true);
    setSwarmLogs((prev) => [
      {
        id: Date.now(),
        type: 'info',
        message: 'Initiating Parallel Perception Cycle...',
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
    setSwarmAgents((prev) => prev.map((a) => ({ ...a, status: 'active' as const })));
    // Safety timeout: if the pipeline never responds, unlock buttons after 15s
    const safetyTimer = setTimeout(() => setIsAiProcessing(false), 15_000);
    try {
      await pipeline.dispatch('SWARM_CYCLE_START', 'swarm', {
        agentCount: swarmAgents.length,
        activePersonality: activePersonality?.name ?? 'Fullstack Architect',
      });
    } catch {
      setIsAiProcessing(false);
    } finally {
      clearTimeout(safetyTimer);
    }
    // Completion handled by pipeline.onResponse / pipeline.onError subscribers above.
  };

  const activePersonality = personalities.find((p) => p.active) || personalities[0];
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
        if (
          parsed.personalities &&
          Array.isArray(parsed.personalities) &&
          parsed.personalities.length > 0
        ) {
          setPersonalities((prev) => {
            return parsed.personalities.map((p: any) => ({
              ...p,
              suggestions: p.suggestions || [],
              knowledgeBase: Array.isArray(p.knowledgeBase) ? p.knowledgeBase : [],
            }));
          });
        }
        if (parsed.aiProvider) setAiProvider(parsed.aiProvider);
        if (parsed.aiModel) setAiModel(parsed.aiModel);
        if (parsed.grokApiKey) setGrokApiKey(parsed.grokApiKey);
        if (parsed.geminiApiKey) setGeminiApiKey(parsed.geminiApiKey);
        if (
          parsed.projectFiles &&
          Array.isArray(parsed.projectFiles) &&
          parsed.projectFiles.length > 0
        ) {
          // Metadata is in localStorage; merge file contents from IndexedDB
          loadFileContents().then(contentMap => {
            setProjectFiles(
              parsed.projectFiles.map((f: any) => ({
                ...f,
                content: contentMap[f.id] ?? f.content ?? '',
              }))
            );
          }).catch(() => setProjectFiles(parsed.projectFiles));
        }
        if (parsed.gitRepo) setGitRepo((prev) => ({ ...prev, ...parsed.gitRepo }));
        if (parsed.projectSettings)
          setProjectSettings((prev) => ({ ...prev, ...parsed.projectSettings }));
        if (parsed.realCwd) setRealCwd(parsed.realCwd);
        if (parsed.activeFileId) {
          setActiveFileId(parsed.activeFileId);
          const file = parsed.projectFiles?.find((f: any) => f.id === parsed.activeFileId);
          if (file) {
            // Active file content will come from the IndexedDB merge above;
            // set language now, content will update once the async load resolves
            setEditorLanguage(file.language || 'text');
          }
        }
      } catch (e) {
        console.warn('Failed to load node preferences:', e);
      }
    }
  }, []);

  // Throttled persistence — debounced 2s to avoid blocking the main thread on every keystroke
  // Strip file content before persisting to localStorage — contents go to IndexedDB instead
  useThrottledStorage(
    STORAGE_KEY,
    {
      activeTab,
      negativePrompt,
      sdParams,
      personalities,
      aiProvider,
      aiModel,
      grokApiKey,
      geminiApiKey,
      projectFiles: projectFiles.map(({ content: _c, ...meta }) => meta),
      gitRepo,
      projectSettings,
      activeFileId,
      realCwd,
    },
    2000
  );

  // Sync file contents to IndexedDB with φ transaction signaling
  const debouncedFiles = useDebounce(projectFiles, 2000);
  useEffect(() => {
    const files = debouncedFiles
      .filter(f => f.type === 'file')
      .map(f => ({ id: f.id, content: f.content ?? '' }));
    if (files.length === 0) return;
    phi.beginTx();
    saveFileContents(files)
      .then(() => phi.commitTx())
      .catch(err => { phi.rollbackTx(); console.warn(err); });
  }, [debouncedFiles]);

  // φ quota enforcement — check every 5 minutes, mark AI-generated files ephemeral
  useEffect(() => {
    const check = async () => {
      const status = await enforcePhiQuota();
      if (status === 'critical') phi.setPulse('error');
      else if (status === 'evicted') phi.setPulse('warning');
    };
    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const hasGreetedTerminalRef = useRef(false);

  useEffect(() => {
    if (activeTab === 'terminal' && !hasGreetedTerminalRef.current) {
      hasGreetedTerminalRef.current = true;
      triggerTerminalGreeting();
    }
  }, [activeTab]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiProcessing]);

  // Chat summary — triggered imperatively via a ref so it never fires mid-render.
  // Only runs when message count crosses a new multiple-of-5 threshold above 15.
  const lastSummarisedCountRef = useRef(0);
  const summaryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatMessagesRef = useRef(chatMessages);
  const chatSummaryRef = useRef(chatSummary);
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);
  useEffect(() => {
    chatSummaryRef.current = chatSummary;
  }, [chatSummary]);

  useEffect(() => {
    const len = chatMessages.length;
    if (len <= 15 || len - lastSummarisedCountRef.current < 5) return;

    if (summaryDebounceRef.current) clearTimeout(summaryDebounceRef.current);
    summaryDebounceRef.current = setTimeout(() => {
      lastSummarisedCountRef.current = chatMessagesRef.current.length;
      const older = chatMessagesRef.current.slice(0, -10);
      const prevSummary = chatSummaryRef.current;
      const prompt = `Summarize the following conversation history concisely.${prevSummary ? ` Incorporate this previous summary: ${prevSummary}` : ''}\n\nNew messages:\n${older.map((m) => `${m.role}: ${m.text}`).join('\n')}`;
      let outcome: 'success' | 'failure' | 'neutral' = 'neutral';

      prepareContext(prompt).then((brainContext) => {
        generateAIResponse(
          prompt,
          'You are a memory management specialist. Provide a concise summary of the conversation history for a futuristic AI hub. Focus on user intent and key decisions.',
          { modelType: 'fast', brainContext }
        )
          .then((r) => {
            if (r) {
              setChatSummary(r);
              outcome = 'success';
            }
          })
          .catch((e) => {
            if (e?.name !== 'AbortError') console.warn('[Summary]', e);
            outcome = 'failure';
          })
          .finally(() => {
            recordInteraction(prompt, chatSummaryRef.current, outcome);
          });
      });
    }, 1_200);

    return () => {
      if (summaryDebounceRef.current) clearTimeout(summaryDebounceRef.current);
    };
  }, [chatMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- AI PAIR PROGRAMMER LOGIC ---
  useEffect(() => {
    if (!isPairProgrammerActive || !editorContent.trim()) return;

    const debounceTimer = setTimeout(async () => {
      const prompt = `Language: ${editorLanguage}\nCode:\n${editorContent}\n\nProvide a very brief, high-impact suggestion for improvement or an alternative implementation for the current code. Focus on the most recent changes or overall structure. Keep it under 3 sentences.`;
      let outcome: 'success' | 'failure' | 'neutral' = 'neutral';

      try {
        const brainContext = await prepareContext(prompt);
        const response = await generateAIResponse(
          prompt,
          "You are an elite AI Pair Programmer. Your goal is to provide real-time, actionable, and concise code improvements. If the code is already optimal, say 'System optimized. No immediate improvements detected.' Start your response with 'PAIR_PROGRAMMER_SUGGESTION:'",
          { modelType: 'smart', brainContext }
        );

        const suggestion = response;
        if (suggestion && !suggestion.includes('System optimized')) {
          setEditorAssistantMessages((prev) => {
            // Avoid duplicate suggestions if they are very similar
            if (prev.length > 0 && prev[prev.length - 1].text === suggestion) return prev;
            return [...prev, { role: 'ai', text: suggestion }];
          });
          setIsEditorAssistantOpen(true);
          outcome = 'success';
        } else {
          outcome = 'neutral'; // Or could be success if it's truly optimized
        }
      } catch (err) {
        console.warn('Pair Programmer link failed', err);
        outcome = 'failure';
      } finally {
        await recordInteraction(
          prompt,
          editorAssistantMessages.map((m) => m.text).join('\n'),
          outcome
        );
      }
    }, 10000); // 10 second debounce to avoid excessive API calls

    return () => clearTimeout(debounceTimer);
  }, [editorContent, isPairProgrammerActive, editorLanguage]);

  // --- AUTOSAVE LOGIC ---
  // Refs hold the latest values so the interval never needs to be recreated,
  // preventing the stale-closure problem and eliminating unnecessary re-subscriptions.
  const editorContentRef = useRef(editorContent);
  const activeFileIdRef = useRef(activeFileId);
  useEffect(() => {
    editorContentRef.current = editorContent;
  }, [editorContent]);
  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  useEffect(() => {
    const id = setInterval(() => {
      setProjectFiles((prev) => {
        const current = prev.find((f) => f.id === activeFileIdRef.current);
        if (current && current.content !== editorContentRef.current) {
          setLastSavedTime(new Date().toLocaleTimeString());
          return prev.map((f) =>
            f.id === activeFileIdRef.current ? { ...f, content: editorContentRef.current } : f
          );
        }
        return prev;
      });
    }, 5_000);
    return () => clearInterval(id);
  }, []); // interval is created once; refs carry the live values

  useEffect(() => {
    if (gitRepo.initialized && activeFileId) {
      const file = projectFiles.find((f) => f.id === activeFileId);
      if (file && file.content !== editorContent) {
        setGitRepo((prev) => {
          if (prev.modified.includes(activeFileId) || prev.staged.includes(activeFileId))
            return prev;
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
    setTerminalOutput((prev) => [
      ...prev,
      `\nNEURAL_LINK: How can I assist with your terminal today, Operator?`,
    ]);
    setIsAiProcessing(true);
    let outcome: 'success' | 'failure' | 'neutral' = 'neutral';
    const prompt = `Context: SD Android Manager. Dir: ${currentDir}. Personality: ${activePersonality.instruction}`;
    try {
      await new Promise((r) => setTimeout(r, 600));
      const brainContext = await prepareContext(prompt);
      const response = await generateAIResponse(
        prompt,
        'Suggest one command for SD model management or environment check in a futuristic sci-fi terminal style.',
        { modelType: 'fast', brainContext }
      );
      setTerminalOutput((prev) => [
        ...prev,
        `COMMAND_INTEL: ${response?.trim() || 'python3 node_status.py --verbose'}`,
      ]);
      outcome = 'success';
    } catch (err) {
      outcome = 'failure';
    } finally {
      setIsAiProcessing(false);
      await recordInteraction(prompt, terminalOutput.slice(-1)[0] || '', outcome);
    }
  };

  // Per-domain AbortController map — aborting a domain cancels its in-flight request
  // without affecting other concurrent domains (e.g. chat vs editor vs pair-programmer).
  const abortRefs = useRef<Record<string, AbortController>>({});
  const getSignal = useCallback((domain: string): AbortSignal => {
    abortRefs.current[domain]?.abort();
    abortRefs.current[domain] = new AbortController();
    return abortRefs.current[domain].signal;
  }, []);

  const generateAIResponse = useCallback(
    (
      prompt: string | any[],
      systemInstruction: string,
      options?: { modelType?: 'fast' | 'smart'; json?: boolean; responseSchema?: any; brainContext?: any },
      domain = 'default'
    ) => {
      if (aiProvider === 'google' && !googleAiClient) {
        return Promise.reject(new Error('Gemini API key not configured — set VITE_GEMINI_API_KEY'));
      }
      if (aiProvider === 'grok' && !grokApiKey) {
        return Promise.reject(new Error('Grok API key not configured'));
      }
      const { brainContext, ...serviceOptions } = options || {};
      const signal = getSignal(domain);
      return generateAIResponseService(prompt as string, systemInstruction, serviceOptions, {
        aiProvider,
        aiModel,
        ai: googleAiClient,
        grokApiKey,
        projectSettings,
        ollamaModels,
        signal,
        brainContext,
      });
    },
    [aiProvider, aiModel, googleAiClient, grokApiKey, projectSettings, ollamaModels, getSignal]
  );

  // ── Event-driven pipeline ──────────────────────────────────────────────────
  const pipeline = usePipeline(generateAIResponse as any);

  // Route AI_RESPONSE_RECEIVED back to the correct state setter.
  useEffect(() => {
    const unsub = pipeline.onResponse((result: PatternResult) => {
      if (result.responseType === 'code_output') {
        setEditorOutput(
          typeof result.payload === 'string' ? result.payload : '[ERROR] Empty response.'
        );
        setIsRunningCode(false);
      } else if (result.responseType === 'scan_result') {
        const lines = Array.isArray(result.payload) ? (result.payload as number[]) : [];
        setScanResults(lines);
        setIsScanningCode(false);
      } else if (result.responseType === 'swarm_update') {
        const update = result.payload as {
          consensus: boolean;
          confidence: number;
          summary: string;
        };
        if (update.consensus) {
          setSwarmLogs((prev) => [
            {
              id: Date.now(),
              type: 'consensus',
              message: `Consensus: ${update.summary} (${(update.confidence * 100).toFixed(0)}%)`,
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
          setSwarmAnxiety((prev) => Math.max(0.05, prev - 0.02));
        } else {
          setSwarmLogs((prev) => [
            {
              id: Date.now(),
              type: 'pain',
              message: `Conflict: ${update.summary}`,
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
          setSwarmAnxiety((prev) => Math.min(1.0, prev + 0.15));
        }
        setSwarmAgents((prev) => prev.map((a) => ({ ...a, status: 'idle' as const })));
        setIsAiProcessing(false);
      }
    });

    const unsubErr = pipeline.onError((err) => {
      console.error('[Pipeline error]', err);
      if (err.signal?.source === 'editor') {
        setEditorOutput(`[CRITICAL] Neural runtime bridge failure — ${err.error}`);
        setIsRunningCode(false);
        setIsScanningCode(false);
      } else if (err.signal?.source === 'swarm') {
        setIsAiProcessing(false);
      }
    });

    return () => {
      unsub();
      unsubErr();
    };
  }, [pipeline]);

  const handleRunCode = async () => {
    setIsRunningCode(true);
    setEditorOutput('');
    setEditorMode('code');
    const safety = setTimeout(() => setIsRunningCode(false), 30_000);
    try {
      await pipeline.dispatch(
        'CODE_RUN_REQUESTED',
        'editor',
        { language: editorLanguage, code: editorContent },
        { meta: { subtype: 'run' } }
      );
    } catch {
      setIsRunningCode(false);
    } finally {
      clearTimeout(safety);
    }
    // Result is handled by the pipeline.onResponse subscriber above.
  };

  const handleScanCode = async () => {
    if (isScanningCode) {
      setIsScanningCode(false);
      setScanResults([]);
      return;
    }
    setIsScanningCode(true);
    setScanResults([]);
    const safety = setTimeout(() => setIsScanningCode(false), 30_000);
    try {
      await pipeline.dispatch('CODE_SCAN_REQUESTED', 'scanner', {
        language: editorLanguage,
        code: editorContent,
      });
    } catch {
      setIsScanningCode(false);
    } finally {
      clearTimeout(safety);
    }
    // Result is handled by the pipeline.onResponse subscriber above.
  };

  const handleAnalyzeCode = async () => {
    if (!editorAssistantInput.trim()) return;

    setIsAiProcessing(true);
    setEditorOutput('Analyzing code structure...\n');
    let outcome: 'success' | 'failure' | 'neutral' = 'neutral';
    const prompt = `Analyze the following ${editorLanguage} code based on this request: "${editorAssistantInput}"\n\nCode:\n${editorContent}`;

    try {
      const brainContext = await prepareContext(prompt);
      const response = await generateAIResponse(
        prompt,
        'You are an elite code analyst. Provide a detailed, side-by-side style analysis, pointing out vulnerabilities, performance issues, or architectural improvements. Format your response clearly.',
        { modelType: 'smart', brainContext }
      );

      if (response) {
        setEditorOutput(response);
        outcome = 'success';
      } else {
        setEditorOutput('[INFO] Analysis yielded no actionable results.');
        outcome = 'neutral';
      }
    } catch (err) {
      setEditorOutput('[ERROR] Analysis engine failed.\n');
      console.warn('Code Analysis failed', err);
      outcome = 'failure';
    } finally {
      setIsAiProcessing(false);
      await recordInteraction(prompt, editorOutput, outcome);
    }
  };
  const handleFormatCode = async (isMobile: boolean = false) => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Format this ${editorLanguage} code based on standard project conventions. ${isMobile ? 'Ensure the code is formatted for mobile screens, with shorter line lengths and vertical layout optimization.' : 'Ensure proper indentation, spacing, and line breaks.'} Return ONLY the formatted code, without any markdown formatting or explanations.\n\nCode:\n${editorContent}`,
        'You are an expert code formatter. Return ONLY the formatted code. Do not wrap in markdown blocks.',
        { modelType: 'fast' }
      );

      if (response) {
        setEditorContent(response);
        setEditorOutput(
          (prev) => prev + `[SYSTEM] Code formatted successfully${isMobile ? ' (mobile)' : ''}.\n`
        );
      }
    } catch (err) {
      setEditorOutput((prev) => prev + '[ERROR] Formatting engine failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleRefactorAllFiles = async () => {
    setIsAiProcessing(true);
    setEditorOutput((prev) => prev + '[SYSTEM] Initiating global project refactor...\n');

    try {
      const filesToRefactor = projectFiles.filter((f) => f.type === 'file');
      let updatedFiles = [...projectFiles];

      for (const file of filesToRefactor) {
        setEditorOutput((prev) => prev + `[INFO] Refactoring ${file.name}...\n`);
        try {
          const response = await generateAIResponse(
            `Refactor this ${file.language || 'code'} code for better performance, readability, and structural integrity. Return a JSON object with 'refactoredCode' and 'explanation' fields.\n\nCode:\n${file.content}`,
            'You are a world-class software architect. You refactor code to be production-ready. Always return valid JSON.',
            {
              modelType: 'smart',
              json: true,
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  refactoredCode: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['refactoredCode', 'explanation'],
              },
            }
          );

          const result = JSON.parse(response || '{}');
          if (result.refactoredCode) {
            updatedFiles = updatedFiles.map((f) =>
              f.id === file.id ? { ...f, content: result.refactoredCode } : f
            );
            setEditorOutput((prev) => prev + `[SUCCESS] ${file.name} refactored successfully.\n`);

            // If it's the active file, update the editor content too
            if (activeFileId === file.id) {
              setEditorContent(result.refactoredCode);
            }
          }
        } catch (err) {
          setEditorOutput((prev) => prev + `[ERROR] Failed to refactor ${file.name}.\n`);
        }
      }

      setProjectFiles(updatedFiles);
      setEditorOutput((prev) => prev + '[SYSTEM] Global project refactor complete.\n');
    } catch (err) {
      setEditorOutput((prev) => prev + '[ERROR] Global refactoring engine failed.\n');
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
        'You are a world-class software architect. You refactor code to be production-ready. Always return valid JSON.',
        {
          modelType: 'smart',
          json: true,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refactoredCode: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['refactoredCode', 'explanation'],
          },
        }
      );

      const result = JSON.parse(response || '{}');

      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `REFACTOR_COMPLETE:\n${result.explanation}\n\n${result.refactoredCode}`,
          metadata: {
            refactoredCode: result.refactoredCode,
            explanation: result.explanation,
            isSelection,
            selection: null,
          },
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput((prev) => prev + '[ERROR] Refactoring engine failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyRefactor = (refactoredCode: string, isSelection: boolean, selection: any) => {
    setEditorContent(refactoredCode);
    setEditorOutput((prev) => prev + `[SYSTEM] Refactoring applied successfully.\n`);
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
              summary: { type: Type.STRING },
            },
            required: ['documentedCode', 'summary'],
          },
        }
      );

      const result = JSON.parse(response || '{}');

      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `DOCUMENTATION_GENERATED: Neural analysis complete. Comprehensive documentation has been synthesized for the ${isSelection ? 'selected block' : 'entire file'}.\n\nSUMMARY:\n${result.summary}`,
          metadata: {
            documentedCode: result.documentedCode,
            isSelection,
            selection: null,
          },
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput((prev) => prev + '[ERROR] Documentation generation failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyDocumentation = (
    documentedCode: string,
    isSelection: boolean,
    selection: any
  ) => {
    setEditorContent(documentedCode);
    setEditorOutput((prev) => prev + `[SYSTEM] Documentation applied successfully.\n`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: any[] = [];
    const folderCache: Record<string, string> = {};

    const getOrCreateFolder = (path: string, parentId: string | null): string => {
      const fullPath = parentId ? `${parentId}/${path}` : path;
      if (folderCache[fullPath]) return folderCache[fullPath];

      const existingFolder = projectFiles.find(
        (f) => f.name === path && f.parentId === parentId && f.type === 'folder'
      );
      if (existingFolder) {
        folderCache[fullPath] = existingFolder.id;
        return existingFolder.id;
      }

      const batchFolder = newFiles.find(
        (f) => f.name === path && f.parentId === parentId && f.type === 'folder'
      );
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
        isOpen: true,
      };
      newFiles.push(newFolder);
      folderCache[fullPath] = newFolderId;
      return newFolderId;
    };

    for (const file of Array.from(files) as File[]) {
      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string ?? '');
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsText(file);
        });

        const fileName = file.name;
        const extension = fileName.split('.').pop() || 'text';
        const relativePath = (file as any).webkitRelativePath || fileName;
        const pathParts = relativePath.split('/');

        let currentParentId: string | null = null;

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
          content: content,
        };
        newFiles.push(newFile);
      } catch (err) {
        console.warn('File upload error:', err);
      }
    }

    if (newFiles.length > 0) {
      setProjectFiles((prev) => [...prev, ...newFiles]);
      setEditorOutput(
        (prev) => prev + `[SYSTEM] ${newFiles.length} items uploaded and synchronized.\n`
      );
    }
    e.target.value = '';
  };

  // Builds a size-capped project context: active file first, then modified, then rest.
  // Keeps total payload under MAX_CONTEXT_CHARS to avoid bloated API calls.
  const buildProjectContext = (maxChars = 12_000): string => {
    const active   = projectFiles.filter(f => f.type === 'file' && f.id === activeFileId);
    const modified = projectFiles.filter(f => f.type === 'file' && f.id !== activeFileId && gitRepo.modified.includes(f.id));
    const rest     = projectFiles.filter(f => f.type === 'file' && f.id !== activeFileId && !gitRepo.modified.includes(f.id));
    const ordered  = [...active, ...modified, ...rest];

    let total = 0;
    const chunks: string[] = [];
    for (const f of ordered) {
      const entry = `File: ${f.name}\nContent:\n${f.content}`;
      if (total + entry.length > maxChars) {
        chunks.push(`File: ${f.name}\n[content omitted — ${(f.content.length / 1024).toFixed(1)} KB]`);
        continue;
      }
      chunks.push(entry);
      total += entry.length;
    }
    return chunks.join('\n\n---\n\n');
  };

  const handleFullProjectAnalysis = async () => {
    setIsAiProcessing(true);
    try {
      const projectContext = buildProjectContext();

      const response = await generateAIResponse(
        `Analyze this entire project. Provide a comprehensive overview of the architecture, potential bugs, and optimization strategies.\n\nProject Context:\n${projectContext}`,
        'You are a world-class software architect. Provide a deep, holistic analysis of the entire project. Focus on inter-file dependencies and overall design patterns.',
        { modelType: 'smart' }
      );

      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `FULL_PROJECT_ANALYSIS:\n${response}`,
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput((prev) => prev + '[ERROR] Neural project analysis failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleDeepProjectAudit = async () => {
    setIsAiProcessing(true);
    try {
      const projectContext = buildProjectContext();

      const response = await generateAIResponse(
        `Perform a deep audit of this project. 
        Specifically identify:
        1. Code Redundancies: Duplicate logic, unused variables/functions, or redundant components.
        2. Security Vulnerabilities: Potential injection points, insecure data handling, or weak authentication patterns.
        3. Refactoring Opportunities: Suggestions for better modularization, cleaner abstractions, and improved performance.
        
        Provide the analysis in a clear, structured format with actionable recommendations.

        Project Context:\n${projectContext}`,
        'You are a senior security researcher and lead software engineer. Your goal is to find flaws, inefficiencies, and risks in the codebase. Be thorough and critical.',
        { modelType: 'smart' }
      );

      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `DEEP_PROJECT_AUDIT:\n${response}`,
        },
      ]);
      setIsEditorAssistantOpen(true);
      setEditorOutput(
        (prev) =>
          prev + '[SYSTEM] Deep project audit complete. Check Neural Assistant for details.\n'
      );
    } catch (err) {
      setEditorOutput((prev) => prev + '[ERROR] Deep project audit failed.\n');
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
      setEditorAssistantMessages((prev) => [
        ...prev,
        { role: 'user', text: `Forge request: ${generatePrompt}` },
      ]);
      setIsEditorAssistantOpen(true);

      try {
        const response = await generateAIResponse(
          `Language: ${editorLanguage}\nContext:\n${editorContent}\n\nGenerate code for: ${generatePrompt}`,
          "You are a master software engineer. Generate high-quality, efficient code based on the user's prompt. Provide ONLY the code snippet without markdown blocks if possible, or wrap it in a clear CODE_FORGE block. Include a brief explanation of how to use it.",
          { modelType: 'smart' }
        );

        const generatedText = response || 'Forge failed to materialize code.';
        const codeMatch = generatedText.match(/```[\s\S]*?```/);
        const extractedCode = codeMatch
          ? codeMatch[0].replace(/```[a-z]*\n|```/g, '')
          : generatedText;

        setEditorAssistantMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: generatedText,
            metadata: { generatedCode: extractedCode, isSnippet: true },
          },
        ]);
      } catch (err) {
        setEditorAssistantMessages((prev) => [
          ...prev,
          { role: 'ai', text: 'FORGE_ERROR: Neural materialization failed.' },
        ]);
      } finally {
        setIsAiProcessing(false);
        setGeneratePrompt('');
      }
    } else {
      // File generation mode
      setEditorAssistantMessages((prev) => [
        ...prev,
        { role: 'user', text: `Forge request (New File): ${generatePrompt}` },
      ]);
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
                content: fileData.content,
              };

              setProjectFiles((prev) => {
                const updatedPrev = prev.map((f) =>
                  f.id === activeFileId ? { ...f, content: editorContent } : f
                );
                return [...updatedPrev, newFile];
              });

              setActiveFileId(newFileId);
              setEditorContent(newFile.content);
              setEditorLanguage(newFile.language);
              setEditorMode(newFile.language === 'html' ? 'preview' : 'code');

              // AI-forged files are ephemeral — evict first under φ quota pressure
              markEphemeral([newFileId]).catch(console.warn);

              setEditorAssistantMessages((prev) => [
                ...prev,
                {
                  role: 'ai',
                  text: `[FORGE] Successfully synthesized new file: ${fileData.filename}`,
                },
              ]);
            }
          } catch (parseError) {
            console.error('Failed to parse generated file JSON', parseError);
            setEditorAssistantMessages((prev) => [
              ...prev,
              { role: 'ai', text: `[FORGE_ERROR] Failed to parse generated file structure.` },
            ]);
          }
        }
      } catch (err) {
        setEditorAssistantMessages((prev) => [
          ...prev,
          { role: 'ai', text: `[FORGE_ERROR] Neural materialization failed.` },
        ]);
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
      editor.executeEdits('source', [{ range: selection, text: code }]);
      editor.focus();
      setEditorOutput((prev) => prev + '[SYSTEM] Neural Forge snippet integrated at cursor.\n');
    } else {
      setEditorContent(code);
      setEditorOutput((prev) => prev + '[SYSTEM] Neural Forge code replaced file content.\n');
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
      content: analysisText,
    };

    setProjectFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setEditorContent(analysisText);
    setEditorLanguage('markdown');
    setEditorOutput(
      (prev) => prev + `[SYSTEM] ${isAudit ? 'Audit' : 'Analysis'} saved as "${fileName}".\n`
    );
  };

  const handleExplainCode = async () => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Analyze and explain this ${editorLanguage} code. Suggest optimizations if possible.\n\nCode:\n${editorContent}`,
        'You are a senior software engineer. Provide a deep technical analysis of the code. Be concise but thorough.',
        { modelType: 'smart' }
      );

      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `CODE_ANALYSIS:\n${response}`,
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      setEditorOutput((prev) => prev + '[ERROR] Analysis node offline.\n');
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
        'You are a senior software engineer and code reviewer. Provide a concise, actionable code review based on the provided guidelines. Structure your feedback by severity (CRITICAL, HIGH, MEDIUM, LOW) and provide specific examples of issues and fixes.',
        { modelType: 'smart' }
      );

      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `CODE_REVIEW:\n${response}`,
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      console.error(err);
      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '[ERROR] Code review failed.',
        },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleAnalyzeData = async () => {
    setIsAiProcessing(true);
    try {
      const dataAnalystInstruction =
        'You are the Data Analyst, a specialized intelligence focused on code analysis, performance profiling, and suggesting data visualization improvements. You provide actionable insights from complex datasets and code structures.';
      const response = await generateAIResponse(
        `Analyze the following ${editorLanguage} code for performance bottlenecks and suggest data visualization improvements.\n\nCode:\n${editorContent}`,
        dataAnalystInstruction,
        { modelType: 'smart' }
      );

      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `DATA_ANALYSIS:\n${response}`,
        },
      ]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      console.error(err);
      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '[ERROR] Data analysis failed.',
        },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleToggleBreakpoint = (line: number) => {
    setBreakpoints((prev) =>
      prev.includes(line) ? prev.filter((l) => l !== line) : [...prev, line]
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
    setEditorOutput((prev) => prev + '[DEBUG] Debugging session terminated.\n');
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
        'You are the Crimson OS Debugger. Provide the state of variables and the next logical line to execute in JSON format. Schema: { "nextLine": number, "variables": object, "output": string, "callStack": string[] }',
        { modelType: 'fast', json: true }
      );

      const text = response || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      setDebugState((prev) => ({
        ...prev,
        currentLine: result.nextLine || prev.currentLine + 1,
        variables: { ...prev.variables, ...result.variables },
        callStack: result.callStack || prev.callStack,
      }));

      if (result.output) {
        setEditorOutput((prev) => prev + `[DEBUG] ${result.output}\n`);
      }

      if (breakpoints.includes(result.nextLine)) {
        setEditorOutput((prev) => prev + `[DEBUG] Breakpoint hit at line ${result.nextLine}\n`);
      }
    } catch (err) {
      setEditorOutput((prev) => prev + '[ERROR] Debugger synchronization failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleFileSwitch = (fileId: string) => {
    // Save current content to projectFiles
    setProjectFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: editorContent } : f))
    );

    // Switch to new file
    const file = projectFiles.find((f) => f.id === fileId);
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
          height: elRect.height,
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
          zIndex: styles.zIndex,
        },
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
      previewContainerRef.current.querySelectorAll('[data-neural-inspect]').forEach((el) => {
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
    setInspectedElement((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        styles: {
          ...prev.styles,
          [property]: value,
        },
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
        const reFoundElement = previewContainerRef.current?.querySelector(
          '[data-neural-inspect]'
        ) as HTMLElement;
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

    const item = projectFiles.find((f) => f.id === itemId);
    if (!item) return;

    // Prevent moving a folder into its own children
    let currentParent = projectFiles.find((f) => f.id === newParentId);
    while (currentParent) {
      if (currentParent.id === itemId) return;
      currentParent = projectFiles.find((f) => f.id === currentParent!.parentId);
    }

    setProjectFiles((prev) =>
      prev.map((f) => (f.id === itemId ? { ...f, parentId: newParentId } : f))
    );
  };

  const renameItem = (id: string) => {
    const item = projectFiles.find((f) => f.id === id);
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
    setProjectFiles((prev) =>
      prev.map((f) => (f.id === renamingId ? { ...f, name: newName.trim() } : f))
    );
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
      const langMap: Record<string, string> = {
        py: 'python',
        js: 'javascript',
        ts: 'typescript',
        html: 'html',
        css: 'css',
        rs: 'rust',
        cpp: 'cpp',
      };
      const newFile = {
        id,
        name: newName.trim(),
        type: 'file',
        parentId: creatingInId.parentId,
        language: langMap[ext || ''] || 'text',
        content: '',
      };
      setProjectFiles((prev) => [...prev, newFile]);
      if (gitRepo.initialized) {
        setGitRepo((prev) => ({ ...prev, modified: [...prev.modified, id] }));
      }
      setActiveFileId(id);
      setEditorContent('');
      setEditorLanguage(newFile.language);
      setEditorMode(newFile.language === 'html' ? 'preview' : 'code');
    } else {
      setProjectFiles((prev) => [
        ...prev,
        {
          id,
          name: newName.trim(),
          type: 'folder',
          parentId: creatingInId.parentId,
          isOpen: true,
        },
      ]);
    }
    setCreatingInId(null);
    setNewName('');
  };

  const deleteItem = (id: string) => {
    if (id === 'root') return;
    setDeleteConfirmId(id);
  };

  const confirmDeleteItem = (id: string) => {
    setDeleteConfirmId(null);
    const toDelete = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      projectFiles.forEach((f) => {
        if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
          toDelete.add(f.id);
          changed = true;
        }
      });
    }

    setProjectFiles((prev) => prev.filter((f) => !toDelete.has(f.id)));

    // Remove deleted file contents from IndexedDB
    toDelete.forEach(fid => deleteFileContent(fid).catch(console.warn));

    if (gitRepo.initialized) {
      setGitRepo((prev) => ({
        ...prev,
        staged: prev.staged.filter((fid) => !toDelete.has(fid)),
        modified: prev.modified.filter((fid) => !toDelete.has(fid)),
      }));
    }
    if (activeFileId === id) setActiveFileId('');
  };

  const toggleFolder = (id: string) => {
    setProjectFiles((prev) => prev.map((f) => (f.id === id ? { ...f, isOpen: !f.isOpen } : f)));
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
        'You are a world-class software architect and debugger. You provide precise refactorings and clear explanations. Always return valid JSON.',
        {
          modelType: 'smart',
          json: true,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refactoredCode: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['refactoredCode', 'explanation'],
          },
        }
      );

      const result = JSON.parse(response || '{}');
      setDebugRefactorResult(result);
    } catch (error) {
      console.warn('Debug refactor failed:', error);
      setEditorOutput((prev) => prev + '\n[ERROR] Debug refactor failed — check console for details.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyDebugRefactor = () => {
    if (!debugRefactorResult) return;

    setEditorContent(debugRefactorResult.refactoredCode);
    setDebugRefactorResult(null);
    setEditorOutput((prev) => prev + '\n[SYSTEM] AI Refactor applied successfully.');
  };

  const handleGitInit = () => {
    setGitRepo((prev) => ({
      ...prev,
      initialized: true,
      branch: 'main',
      commits: [],
      staged: [],
      modified: projectFiles.filter((f) => f.type === 'file').map((f) => f.id),
      stash: [],
    }));
    setEditorOutput((prev) => prev + '[GIT] Initialized empty Neural repository.\n');
  };

  const handleGitStash = () => {
    const dirtyFiles = [...gitRepo.modified, ...gitRepo.staged];
    if (dirtyFiles.length === 0) {
      setEditorOutput((prev) => prev + '[GIT] No changes to stash.\n');
      return;
    }

    const stashEntry = dirtyFiles.map((id) => {
      const file = projectFiles.find((f) => f.id === id);
      return { id, content: file?.content || '' };
    });

    setGitRepo((prev) => ({
      ...prev,
      stash: [stashEntry, ...(prev.stash || [])],
      modified: [],
      staged: [],
    }));

    setEditorOutput((prev) => prev + `[GIT] Stashed ${dirtyFiles.length} files.\n`);
  };

  const handleGitPop = () => {
    if (!gitRepo.stash || gitRepo.stash.length === 0) {
      setEditorOutput((prev) => prev + '[GIT] No stashes to pop.\n');
      return;
    }

    const [lastStash, ...remainingStashes] = gitRepo.stash;

    setProjectFiles((prev) =>
      prev.map((file) => {
        const stashed = lastStash.find((s) => s.id === file.id);
        if (stashed) {
          return { ...file, content: stashed.content };
        }
        return file;
      })
    );

    setGitRepo((prev) => ({
      ...prev,
      stash: remainingStashes,
      modified: [...new Set([...prev.modified, ...lastStash.map((s) => s.id)])],
    }));

    setEditorOutput((prev) => prev + `[GIT] Popped stash with ${lastStash.length} files.\n`);
  };

  const handleGitStage = (fileId: string) => {
    setGitRepo((prev) => ({
      ...prev,
      staged: [...new Set([...prev.staged, fileId])],
      modified: prev.modified.filter((id) => id !== fileId),
    }));
  };

  const handleGitStageAll = () => {
    setGitRepo((prev) => ({
      ...prev,
      staged: [...new Set([...prev.staged, ...prev.modified])],
      modified: [],
    }));
  };

  const handleGitUnstage = (fileId: string) => {
    setGitRepo((prev) => ({
      ...prev,
      staged: prev.staged.filter((id) => id !== fileId),
      modified: [...new Set([...prev.modified, fileId])],
    }));
  };

  const handleGitCommit = () => {
    if (gitRepo.staged.length === 0) return;
    setCommitMessage('');
    setIsCommitModalOpen(true);
  };

  const confirmGitCommit = () => {
    const message = commitMessage.replace(/[^\w\s\-.,!?():]/g, '').trim().slice(0, 200);
    if (!message || gitRepo.staged.length === 0) return;
    setIsCommitModalOpen(false);
    setCommitMessage('');

    const newCommit = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      timestamp: Date.now(),
      author: 'Operator',
    };

    setGitRepo((prev) => ({
      ...prev,
      commits: [newCommit, ...prev.commits],
      staged: [],
    }));
    setEditorOutput(
      (prev) => prev + `[GIT] Committed ${gitRepo.staged.length} files: ${message}\n`
    );
    setPostCommitModalOpen(true);
  };

  const handleGitSaveAll = () => {
    if (gitRepo.modified.length === 0 && gitRepo.staged.length === 0) return;

    setGitRepo((prev) => {
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

  const handleGitPush = async () => {
    setIsAiProcessing(true);
    setEditorOutput((prev) => prev + '[GIT] Pushing to GitHub...\n');
    try {
      const response = await fetch('/api/github/push', { method: 'POST' });
      const data = await response.json();
      if (data.ok) {
        setEditorOutput((prev) => prev + '[GIT] Successfully pushed to GitHub.\n');
      } else {
        setEditorOutput((prev) => prev + '[GIT] ERROR: Push failed. Check server GITHUB_TOKEN.\n');
      }
    } catch {
      setEditorOutput((prev) => prev + '[GIT] ERROR: Could not reach server.\n');
    }
    setIsAiProcessing(false);
  };

  const handleGitPull = async () => {
    setIsAiProcessing(true);
    setEditorOutput((prev) => prev + '[GIT] Pulling from GitHub...\n');
    try {
      const response = await fetch('/api/github/pull');
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
    setTerminalOutput((prev) => [
      ...prev,
      `[RAG] Ingesting ${newPacks.length} knowledge vectors...`,
    ]);

    // Simulate indexing process
    for (const pack of newPacks) {
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000));
      setTnKnowledgePacks((prev) =>
        prev.map((p) => (p.id === pack.id ? { ...p, status: 'indexed' as const } : p))
      );
      setTerminalOutput((prev) => [
        ...prev,
        `[SUCCESS] Knowledge Pack '${pack.name}' indexed and ready.`,
      ]);
    }
  };

  const handleEditorAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = editorAssistantInput.trim();
    if (!prompt) return;

    setEditorAssistantMessages((prev) => [...prev, { role: 'user', text: prompt }]);
    setEditorAssistantInput('');
    setIsAiProcessing(true);

    try {
      const response = await generateAIResponse(
        `Context: Coding in ${editorLanguage}. Current code:\n${editorContent}\n\nUser request: ${prompt}`,
        'You are a world-class coding assistant. Help the user with their code. You can provide code snippets, debug, or explain concepts. Keep responses concise and technical. If you provide a code snippet, wrap it in triple backticks with the language specified.',
        { modelType: 'smart' }
      );

      const text = response || 'Process finalized.';
      const codeMatch = text.match(/```[\s\S]*?```/);
      const extractedCode = codeMatch ? codeMatch[0].replace(/```[a-z]*\n|```/g, '') : null;

      setEditorAssistantMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text,
          metadata: extractedCode ? { generatedCode: extractedCode } : undefined,
        },
      ]);
    } catch (err) {
      setEditorAssistantMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'CRITICAL ERROR: Neural link failed.' },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleCodeReview = async () => {
    setIsAiProcessing(true);
    setEditorAssistantMessages((prev) => [
      ...prev,
      { role: 'user', text: 'Perform a code review on the current file.' },
    ]);

    try {
      const response = await generateAIResponse(
        `Review the following code for security, performance, and maintainability best practices. Provide a structured review report.\n\nCode:\n${editorContent}`,
        'You are an expert code reviewer. Provide a structured review report covering security, performance, and maintainability. Use markdown for the report.',
        { modelType: 'smart' }
      );

      setEditorAssistantMessages((prev) => [
        ...prev,
        { role: 'ai', text: response || 'Code review complete.' },
      ]);
    } catch (err) {
      setEditorAssistantMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'CRITICAL ERROR: Code review failed.' },
      ]);
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

    if (cmd.endsWith('\\') || cmd.endsWith('(') || cmd.endsWith('"') || cmd.endsWith("'")) {
      setMultiLineBuffer(
        isMultiLine ? multiLineBuffer + ' ' + cmd.replace(/\\$/, '') : cmd.replace(/\\$/, '')
      );
      setIsMultiLine(true);
      setTerminalOutput((prev) => [...prev, `${currentDir} $ ${cmd} (continuation)`]);
      setTermInput('');
      return;
    }

    setTerminalOutput((prev) => [...prev, `$ ${finalCmd}`]);
    setCmdHistory((prev) => [finalCmd, ...prev].slice(0, 20));
    setTermInput('');
    setTermSuggestion('');
    setTermSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setHistoryIndex(-1);
    setIsMultiLine(false);
    setMultiLineBuffer('');

    const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');

    const runShellCmd = async (shellCmd: string) => {
      setIsAiProcessing(true);
      try {
        const res = await fetch('/api/terminal/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd: shellCmd, cwd: realCwd }),
        });
        const data = await res.json() as { stdout: string; stderr: string; exitCode: number; newCwd: string };
        if (data.newCwd) setRealCwd(data.newCwd);
        const lines: string[] = [];
        if (data.stdout) lines.push(...stripAnsi(data.stdout).trimEnd().split('\n').filter(Boolean));
        if (data.stderr) lines.push(...stripAnsi(data.stderr).trimEnd().split('\n').filter(Boolean).map(l => `[ERROR] ${l}`));
        if (lines.length === 0 && data.exitCode === 0) lines.push('[OK]');
        else if (lines.length === 0 && data.exitCode !== 0) lines.push(`[ERROR] Command exited with code ${data.exitCode}`);
        setTerminalOutput((prev) => [...prev, ...lines]);
      } catch {
        setTerminalOutput((prev) => [...prev, '[ERROR] Shell bridge unreachable.']);
      } finally {
        setIsAiProcessing(false);
      }
    };

    if (finalCmd === 'clear') {
      setTerminalOutput(['Buffer flushed.']);
      return;
    } else if (finalCmd === 'help') {
      setTerminalOutput((prev) => [
        ...prev,
        'Available commands: any shell command runs for real.',
        '  clear            - Clear the terminal buffer',
        '  ai               - Get AI assistance',
        '  ai <prompt>      - Get AI assistance with a prompt',
        'All other commands execute in the Termux shell.',
      ]);
      return;
    } else if (finalCmd === 'ai')
      await getAiTerminalAssistance(
        'Analyze current system state and suggest relevant commands or actions.'
      );
    else if (finalCmd.startsWith('ai ')) await getAiTerminalAssistance(finalCmd.substring(3));
    else if (false && finalCmd.startsWith('gh repo clone ')) {
      const repo = finalCmd.replace('gh repo clone ', '');
      if (repo.includes('ToolNeuron')) {
        setTerminalOutput((prev) => [
          ...prev,
          `Cloning into 'ToolNeuron'...`,
          'remote: Enumerating objects: 4521, done.',
          'remote: Counting objects: 100% (4521/4521), done.',
          'remote: Compressing objects: 100% (1240/1240), done.',
          'Receiving objects: 100% (4521/4521), 12.45 MiB | 8.12 MiB/s, done.',
          '[SUCCESS] ToolNeuron Source Synchronized.',
          '[SYSTEM] Initializing ToolNeuron Local Environment...',
          '[KERNEL] Mapping neural paths to /data/data/com.termux/files/home/ToolNeuron',
          '[BOOT] ToolNeuron Hub is now available in the primary interface.',
        ]);
        setTimeout(() => setActiveTab('toolneuron'), 2000);
      } else if (repo.includes('TransformerOptimus/SuperAGI')) {
        setTerminalOutput((prev) => [
          ...prev,
          `Cloning into 'SuperAGI'...`,
          'remote: Enumerating objects: 8542, done.',
          'remote: Counting objects: 100% (8542/8542), done.',
          'remote: Compressing objects: 100% (3240/3240), done.',
          'Receiving objects: 100% (8542/8542), 45.2 MiB | 12.4 MiB/s, done.',
          '[SUCCESS] SuperAGI repository integrated.',
          '[SYSTEM] Extracting useful autonomous agent core components...',
        ]);

        setTimeout(() => {
          setProjectFiles((prev) => {
            const newFiles = [
              {
                id: 'superagi_root',
                name: 'SuperAGI',
                type: 'folder',
                parentId: 'root',
                isOpen: true,
              },
              {
                id: 'superagi_agent',
                name: 'agent',
                type: 'folder',
                parentId: 'superagi_root',
                isOpen: true,
              },
              {
                id: 'superagi_core',
                name: 'super_agi.py',
                type: 'file',
                parentId: 'superagi_agent',
                language: 'python',
                content:
                  'class SuperAGI:\n    def __init__(self, ai_name, ai_role, llm, memory, tools):\n        self.name = ai_name\n        self.role = ai_role\n        self.llm = llm\n        self.memory = memory\n        self.tools = tools\n\n    def execute(self, goals):\n        print(f"Executing goals for {self.name}...")\n        # Autonomous execution loop\n        for goal in goals:\n            print(f"Processing goal: {goal}")\n            # Tool selection and execution logic here\n        return "Goals completed."',
              },
              {
                id: 'superagi_config',
                name: 'config.yaml',
                type: 'file',
                parentId: 'superagi_root',
                language: 'yaml',
                content:
                  'agent:\n  name: "Crimson_AGI"\n  description: "Autonomous neural agent"\n  model: "gpt-4"\n  memory: "vector_db"\ntools:\n  - "file_manager"\n  - "web_search"\n  - "terminal"',
              },
              {
                id: 'superagi_main',
                name: 'main.py',
                type: 'file',
                parentId: 'superagi_root',
                language: 'python',
                content:
                  'from agent.super_agi import SuperAGI\n\ndef main():\n    print("Initializing SuperAGI Core...")\n    agent = SuperAGI(\n        ai_name="Optimus",\n        ai_role="Autonomous Developer",\n        llm="gpt-4",\n        memory="local",\n        tools=["search", "code"]\n    )\n    agent.execute(["Analyze system", "Optimize performance"])\n\nif __name__ == "__main__":\n    main()',
              },
            ];
            return [...prev, ...newFiles];
          });
          setTerminalOutput((prev) => [
            ...prev,
            '[SUCCESS] SuperAGI core files added to the project workspace.',
          ]);
        }, 1500);
      } else if (repo.includes('google-deepmind/gemma')) {
        setTerminalOutput((prev) => [
          ...prev,
          `Cloning into 'gemma'...`,
          'remote: Enumerating objects: 12450, done.',
          'remote: Counting objects: 100% (12450/12450), done.',
          'remote: Compressing objects: 100% (4520/4520), done.',
          'Receiving objects: 100% (12450/12450), 145.2 MiB | 22.4 MiB/s, done.',
          '[SUCCESS] Gemma repository integrated.',
          '[SYSTEM] Extracting core model architecture and visual components...',
        ]);

        setTimeout(() => {
          setProjectFiles((prev) => {
            const newFiles = [
              { id: 'gemma_root', name: 'Gemma', type: 'folder', parentId: 'root', isOpen: true },
              {
                id: 'gemma_core',
                name: 'core',
                type: 'folder',
                parentId: 'gemma_root',
                isOpen: true,
              },
              {
                id: 'gemma_model',
                name: 'model.py',
                type: 'file',
                parentId: 'gemma_core',
                language: 'python',
                content:
                  'import torch\nimport torch.nn as nn\n\nclass GemmaModel(nn.Module):\n    def __init__(self, vocab_size, hidden_dim, num_layers):\n        super().__init__()\n        self.embed = nn.Embedding(vocab_size, hidden_dim)\n        self.layers = nn.ModuleList([TransformerBlock(hidden_dim) for _ in range(num_layers)])\n        self.norm = RMSNorm(hidden_dim)\n\n    def forward(self, x):\n        x = self.embed(x)\n        for layer in self.layers:\n            x = layer(x)\n        return self.norm(x)',
              },
              {
                id: 'gemma_visuals',
                name: 'visuals',
                type: 'folder',
                parentId: 'gemma_root',
                isOpen: true,
              },
              {
                id: 'gemma_attention',
                name: 'attention_viz.tsx',
                type: 'file',
                parentId: 'gemma_visuals',
                language: 'typescript',
                content:
                  'import React from "react";\n\nexport const AttentionVisualizer = ({ attentionWeights }) => {\n  return (\n    <div className="p-4 bg-[#0d0404] border border-red-900/30 rounded-xl">\n      <h3 className="text-red-500 font-black mb-4 uppercase tracking-widest text-xs">Gemma Attention Map</h3>\n      <div className="grid grid-cols-8 gap-1">\n        {attentionWeights.map((weight, i) => (\n          <div \n            key={i} \n            className="w-8 h-8 rounded-sm transition-all hover:scale-110 cursor-crosshair"\n            style={{ backgroundColor: `rgba(239, 68, 68, ${weight})` }}\n            title={`Weight: ${weight.toFixed(3)}`}\n          />\n        ))}\n      </div>\n    </div>\n  );\n};',
              },
              {
                id: 'gemma_config',
                name: 'config.json',
                type: 'file',
                parentId: 'gemma_root',
                language: 'json',
                content:
                  '{\n  "model_type": "gemma",\n  "vocab_size": 256000,\n  "hidden_size": 2048,\n  "num_hidden_layers": 18,\n  "num_attention_heads": 8,\n  "head_dim": 256,\n  "visualizer_enabled": true\n}',
              },
            ];
            return [...prev, ...newFiles];
          });
          setTerminalOutput((prev) => [
            ...prev,
            '[SUCCESS] Gemma core and visualizer added to the project workspace.',
          ]);
        }, 1500);
      } else {
        const repoName = repo.split('/').pop() || 'repo';
        setTerminalOutput((prev) => [
          ...prev,
          `Cloning into '${repoName}'...`,
          'remote: Enumerating objects: 1024, done.',
          'remote: Counting objects: 100% (1024/1024), done.',
          'remote: Compressing objects: 100% (512/512), done.',
          'Receiving objects: 100% (1024/1024), 2.45 MiB | 4.12 MiB/s, done.',
          '[SUCCESS] Repository integrated into local node.',
        ]);

        setTimeout(() => {
          setProjectFiles((prev) => {
            const repoId = `repo_${Date.now()}`;
            const newFiles = [
              { id: repoId, name: repoName, type: 'folder', parentId: 'root', isOpen: true },
              {
                id: `${repoId}_readme`,
                name: 'README.md',
                type: 'file',
                parentId: repoId,
                language: 'markdown',
                content: `# ${repoName}\n\nCloned repository.`,
              },
              { id: `${repoId}_src`, name: 'src', type: 'folder', parentId: repoId, isOpen: true },
              {
                id: `${repoId}_index`,
                name: 'index.js',
                type: 'file',
                parentId: `${repoId}_src`,
                language: 'javascript',
                content: 'console.log("Hello World");',
              },
              {
                id: `${repoId}_package`,
                name: 'package.json',
                type: 'file',
                parentId: repoId,
                language: 'json',
                content: `{\n  "name": "${repoName}",\n  "version": "1.0.0",\n  "main": "src/index.js"\n}`,
              },
            ];
            return [...prev, ...newFiles];
          });
          setTerminalOutput((prev) => [
            ...prev,
            `[SUCCESS] ${repoName} files added to the project workspace.`,
          ]);
        }, 1500);
      }
    } else {
      await runShellCmd(finalCmd);
    }
  };

  const getAiTerminalAssistance = async (prompt: string) => {
    setIsAiProcessing(true);
    try {
      const systemState = `
Current System State:
- Active Tab: ${activeTab}
- Editor Language: ${editorLanguage}
- Editor Mode: ${editorMode}
- Project Files: ${projectFiles.map((f) => f.name).join(', ')}
- Termux Status: ${termuxStatus}
- Ollama Status: ${ollamaStatus}
- Vault Unlocked: ${isVaultUnlocked}
- Swarm Anxiety: ${(swarmAnxiety * 100).toFixed(1)}%
`;

      const response = await generateAIResponse(
        `${systemState}\n\nUser Request: ${prompt}`,
        `Futuristic crimson terminal specialist. ${activePersonality.instruction}${(activePersonality.knowledgeBase ?? []).length ? `\n\nKNOWLEDGE BASE:\n${(activePersonality.knowledgeBase ?? []).map((e) => `[KB: ${e.name}]\n${e.content}`).join('\n\n---\n\n')}` : ''}. Provide concise, terminal-style responses in simple, easy-to-understand English so that non-experts can easily follow. If the user asks for general help or just types 'ai', suggest relevant commands based on the current system state.`,
        { modelType: 'fast' }
      );
      setTerminalOutput((prev) => [
        ...prev,
        `CORE (${activePersonality.name.toUpperCase()}): ${response}`,
      ]);
    } catch (err) {
      setTerminalOutput((prev) => [...prev, `[ERROR] Neural bridge collapsed.`]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = studioInput.trim();
    if (!prompt && !studioRefImage) return;

    setChatMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: prompt || 'Frame-to-Image Generation Requested',
        timestamp: Date.now(),
      },
    ]);
    setStudioInput('');
    setIsAiProcessing(true);

    try {
      const isImageRequest =
        studioRefImage ||
        /^\/(image|draw|picture|photo|render)\b/i.test(prompt) ||
        /\b(generate an image|draw a picture|create a photo)\b/i.test(prompt);

      const windowSize = 10;
      const recentMessages = chatMessages.slice(-windowSize).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));
      recentMessages.push({
        role: 'user',
        parts: [{ text: prompt || 'Frame-to-Image Generation Requested' }],
      });

      const activeProfile =
        projectSettings.projectProfiles.find((p) => p.id === projectSettings.activeProfileId) ||
        projectSettings.projectProfiles[0];
      const kbDocs = (activePersonality.knowledgeBase ?? [])
        .map((e) => `[KB: ${e.name}]\n${e.content}`)
        .join('\n\n---\n\n');
      const systemInstruction = `${activePersonality.instruction}${kbDocs ? `\n\nKNOWLEDGE BASE:\n${kbDocs}` : ''}\n\nPROJECT_PROFILE: ${activeProfile.instruction}${chatSummary ? `\n\nCONVERSATION_SUMMARY: ${chatSummary}` : ''}`;

      const fileCreationMatch = prompt.match(
        /(?:create|generate) a (?:new )?file named ([a-zA-Z0-9_\-\.]+)/i
      );
      if (fileCreationMatch) {
        const fileName = fileCreationMatch[1];
        const ext = fileName.split('.').pop();
        const langMap: Record<string, string> = {
          py: 'python',
          js: 'javascript',
          ts: 'typescript',
          html: 'html',
          css: 'css',
          rs: 'rust',
          cpp: 'cpp',
          json: 'json',
        };
        const language = langMap[ext || ''] || 'text';

        setChatMessages((prev) => [
          ...prev,
          { role: 'ai', text: `Generating file ${fileName}...`, timestamp: Date.now() },
        ]);

        const response: string = await generateAIResponse(
          `Write the content for a file named ${fileName}. The file should contain ${prompt.replace(fileCreationMatch[0], '')}. Provide ONLY the raw code content.`,
          systemInstruction,
          { modelType: 'smart' }
        );

        const id = `file_${Date.now()}`;
        const newFile = {
          id,
          name: fileName,
          type: 'file',
          parentId: 'root',
          language,
          content: response,
        };
        setProjectFiles((prev) => [...prev, newFile]);
        if (gitRepo.initialized) {
          setGitRepo((prev) => ({ ...prev, modified: [...prev.modified, id] }));
        }
        setActiveFileId(id);
        setEditorContent(response);
        setEditorLanguage(language);
        setChatMessages((prev) => [
          ...prev,
          { role: 'ai', text: `File ${fileName} created successfully.`, timestamp: Date.now() },
        ]);
        setIsAiProcessing(false);
        return;
      }

      if (isImageRequest) {
        const parts: any[] = [];
        if (studioRefImage)
          parts.push({
            inlineData: { data: studioRefImage.data, mimeType: studioRefImage.mimeType },
          });
        parts.push({
          text: `POSITIVE: ${prompt}\nNEGATIVE: ${negativePrompt}\nCONFIG: steps=${sdParams.steps}, cfg=${sdParams.cfgScale}, checkpoint=${sdParams.checkpoint}`,
        });

        if (!googleAiClient) throw new Error('Gemini API key not configured — set VITE_GEMINI_API_KEY');
        const response = await googleAiClient.models.generateContent({
          model: 'gemini-2.0-flash-preview-image-generation',
          contents: [{ parts }],
          config: {
            systemInstruction: `You are the Crimson Engine SD Renderer. Output high-impact futuristic visuals. Active personality: ${systemInstruction}`,
          },
        });

        // Since we can't actually generate images with this model, we'll just return a text response
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: `[IMAGE_GENERATION_UNAVAILABLE] The requested image generation model is currently offline. Neural directive parsed: ${prompt}`,
            timestamp: Date.now(),
          },
        ]);
      } else {
        const response = await generateAIResponse(recentMessages, systemInstruction, {
          modelType: 'fast',
        });
        setChatMessages((prev) => [
          ...prev,
          { role: 'ai', text: response || 'Process finalized.', timestamp: Date.now() },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'CRITICAL ERROR: Synthesis failure.', timestamp: Date.now() },
      ]);
    } finally {
      setIsAiProcessing(false);
    }
    setStudioRefImage(null);
  };

  const handleTermuxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const upload = e.target.files;
    if (upload) {
      const news = Array.from(upload).map(
        (f: any) =>
          ({
            name: f.name,
            size: (f.size / (1024 * 1024)).toFixed(2) + 'MB',
            type: 'model',
            category:
              f.name.endsWith('.safetensors') || f.name.endsWith('.ckpt') ? 'model' : 'asset',
          }) as any
      );
      setTermuxFiles((prev) => [...prev, ...news]);
      setTerminalOutput((prev) => [
        ...prev,
        `[STASH] Injected ${news.length} datasets into the crimson stash.`,
      ]);
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const commonCommands = [
    'ls',
    'cd',
    'cat',
    'mkdir',
    'rm',
    'gh repo clone',
    'ai ',
    'clear',
    'python',
    'node',
    'git status',
    'git commit',
    'git push',
    'toolneuron start',
    'toolneuron status',
  ];

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

    const activePersonality = personalities.find((p) => p.active);
    const personalitySuggestions = activePersonality ? activePersonality.suggestions : [];

    // Context-aware command suggestions with weights
    const suggestionsWithWeights: { cmd: string; weight: number }[] = [
      ...commonCommands.map((c) => ({ cmd: c, weight: 1 })),
      ...(activePersonality
        ? activePersonality.suggestions.map((c) => ({ cmd: c, weight: 3 }))
        : []),
    ];

    if (editorLanguage === 'python') {
      suggestionsWithWeights.push({ cmd: 'pip install', weight: 2 }, { cmd: 'pytest', weight: 2 });
    }
    if (editorLanguage === 'javascript' || editorLanguage === 'typescript') {
      suggestionsWithWeights.push(
        { cmd: 'npm install', weight: 2 },
        { cmd: 'npm run dev', weight: 2 }
      );
    }

    // Filter and sort (will be used in command completion)
    const sortedSuggestions = suggestionsWithWeights
      .sort((a, b) => b.weight - a.weight || a.cmd.localeCompare(b.cmd))
      .map((s) => s.cmd);

    // Get current folder context
    const dirParts = currentDir.split('/');
    const currentFolderName =
      dirParts[dirParts.length - 1] === '~' ? 'root' : dirParts[dirParts.length - 1];

    // Try to find the folder by traversing from root
    let currentFolderId: string | null = 'root';
    if (currentDir !== '~') {
      const folder = projectFiles.find((f) => f.name === currentFolderName && f.type === 'folder');
      if (folder) currentFolderId = folder.id;
    }

    const localItems = projectFiles.filter((f) => f.parentId === currentFolderId);
    const localFiles = localItems.filter((f) => f.type === 'file').map((f) => f.name);
    const localFolders = localItems.filter((f) => f.type === 'folder').map((f) => f.name);

    let matches: string[] = [];

    // Commands that take file paths
    const fileCommands = ['cat', 'rm', 'edit', 'run', 'compile'];

    // Check if user is typing a command or a path
    const parts = val.split(' ');
    if (parts.length === 1) {
      // Command completion (weighted)
      matches = sortedSuggestions.filter((c) => c.toLowerCase().startsWith(val.toLowerCase()));
    } else if (fileCommands.includes(parts[0])) {
      // File path completion
      const search = parts.slice(1).join(' ');
      matches = localFiles
        .filter((f) => f.toLowerCase().startsWith(search.toLowerCase()))
        .map((f) => `${parts[0]} ${f}`);
    } else if (val.startsWith('cd ')) {
      const search = val.substring(3);
      if (search.includes('/')) {
        const parts = search.split('/');
        const folderName = parts[0];
        const subPath = parts.slice(1).join('/');
        const folder = projectFiles.find(
          (f) => f.name === folderName && f.type === 'folder' && f.parentId === currentFolderId
        );
        if (folder) {
          const subItems = projectFiles.filter((f) => f.parentId === folder.id);
          matches = subItems
            .filter(
              (f) => f.type === 'folder' && f.name.toLowerCase().startsWith(subPath.toLowerCase())
            )
            .map((f) => `cd ${folderName}/${f.name}`);
        }
      } else {
        matches = localFolders
          .filter((f) => f.toLowerCase().startsWith(search.toLowerCase()))
          .map((f) => `cd ${f}`);
        if (search === '.' || search === '..') matches.push(`cd ${search}`);
      }
    } else if (fileCommands.some((cmd) => val.startsWith(`${cmd} `))) {
      const cmd = val.split(' ')[0];
      const search = val.substring(cmd.length + 1);

      if (search.includes('/')) {
        const parts = search.split('/');
        const folderName = parts[0];
        const fileName = parts.slice(1).join('/');
        const folder = projectFiles.find(
          (f) => f.name === folderName && f.type === 'folder' && f.parentId === currentFolderId
        );
        if (folder) {
          const subItems = projectFiles.filter((f) => f.parentId === folder.id);
          matches = subItems
            .filter(
              (f) => f.type === 'file' && f.name.toLowerCase().startsWith(fileName.toLowerCase())
            )
            .map((f) => `${cmd} ${folderName}/${f.name}`);
        }
      } else {
        matches = localFiles
          .filter((f) => f.toLowerCase().startsWith(search.toLowerCase()))
          .map((f) => `${cmd} ${f}`);
      }
    } else if (val.startsWith('ai ')) {
      const search = val.substring(3);
      const aiCmds = activePersonality.suggestions || [];
      matches = aiCmds
        .filter((cmd) => cmd.toLowerCase().startsWith(search.toLowerCase()))
        .map((cmd) => `ai ${cmd}`);
    } else {
      // General suggestions
      const allSuggestions = [
        ...commonCommands,
        ...fileCommands.map((c) => `${c} `),
        ...(activePersonality.suggestions
          ? activePersonality.suggestions.map((s) => `ai ${s}`)
          : []),
      ];

      // Add context-aware suggestions based on file types
      if (localFiles.some((f) => f.endsWith('.py'))) {
        allSuggestions.push('python3 ');
        localFiles
          .filter((f) => f.endsWith('.py'))
          .forEach((f) => allSuggestions.push(`python3 ${f}`));
      }
      if (localFiles.some((f) => f.endsWith('.js') || f.endsWith('.ts'))) {
        allSuggestions.push('node ');
        localFiles
          .filter((f) => f.endsWith('.js') || f.endsWith('.ts'))
          .forEach((f) => allSuggestions.push(`node ${f}`));
      }

      matches = [...new Set(allSuggestions)].filter((s) =>
        s.toLowerCase().startsWith(val.toLowerCase())
      );
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

  const debouncedFileSearch = useDebounce(fileSearch, 200);

  const fileTree = useMemo(() => {
    const tree = new Map<string | null, any[]>();

    // Filter projectFiles based on search
    const filteredFiles = !debouncedFileSearch.trim()
      ? projectFiles
      : (() => {
          const search = debouncedFileSearch.toLowerCase();
          const matches = projectFiles.filter((f) => f.name.toLowerCase().includes(search));
          const includedIds = new Set();

          matches.forEach((file) => {
            let curr = file;
            while (curr) {
              if (includedIds.has(curr.id)) break;
              includedIds.add(curr.id);
              curr = projectFiles.find((f) => f.id === curr.parentId);
            }
          });

          return projectFiles.filter((f) => includedIds.has(f.id));
        })();

    filteredFiles.forEach((file) => {
      const parentId = file.parentId;
      if (!tree.has(parentId)) {
        tree.set(parentId, []);
      }
      tree.get(parentId)!.push(file);
    });
    return tree;
  }, [projectFiles, debouncedFileSearch]);

  const renderTree = (parentId: string | null, level: number = 0) => {
    const items = fileTree.get(parentId) || [];

    return (
      <>
        {items.map((item) => {
          const isModified = gitRepo.modified.includes(item.id);
          const isStaged = gitRepo.staged.includes(item.id);
          const isRenaming = renamingId === item.id;

          return (
            <div key={item.id} className="flex flex-col">
              <div
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id);
                }}
                onDragOver={(e) => {
                  if (item.type === 'folder') e.preventDefault();
                }}
                onDrop={(e) => {
                  if (item.type === 'folder') {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData('text/plain');
                    moveItem(draggedId, item.id);
                  }
                }}
                className={`group flex items-center gap-3 px-4 py-2.5 md:py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                  activeFileId === item.id
                    ? 'bg-red-700 text-white glow-red border border-red-500 scale-[1.02]'
                    : item.type === 'folder'
                      ? item.isOpen
                        ? 'bg-red-950/30 text-red-300 border border-red-900/30 hover:bg-red-900/40 hover:translate-x-1'
                        : 'hover:bg-red-950/20 text-red-800 hover:text-red-400 border border-transparent hover:translate-x-1'
                      : `hover:bg-red-950/20 text-red-900 hover:text-red-500 border border-transparent hover:translate-x-1 ${isModified ? 'border-l-2 border-l-orange-500' : isStaged ? 'border-l-2 border-l-green-500' : ''}`
                }`}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
                onClick={() =>
                  item.type === 'folder' ? toggleFolder(item.id) : handleFileSwitch(item.id)
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id });
                }}
              >
                {item.type === 'folder' ? (
                  <div className="flex items-center gap-1.5">
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform shrink-0 ${item.isOpen ? '' : '-rotate-90'}`}
                    />
                    {item.isOpen ? (
                      <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </div>
                ) : (
                  <FileCode
                    className={`w-3.5 h-3.5 shrink-0 ${isModified ? 'text-orange-500' : isStaged ? 'text-green-500' : ''}`}
                  />
                )}

                {isRenaming ? (
                  <input
                    autoFocus
                    className="flex-1 bg-red-950/40 border border-red-500/50 rounded px-2 py-0.5 text-white outline-none font-mono text-[10px]"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmRename();
                      if (e.key === 'Escape') {
                        setRenamingId(null);
                        setNewName('');
                      }
                    }}
                    onBlur={handleConfirmRename}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className={`flex-1 truncate flex items-center gap-2`}>
                    {item.name}
                    {isModified && <Edit2 className="w-3 h-3 text-orange-500 shrink-0" />}
                    {isStaged && <Check className="w-3 h-3 text-green-500 shrink-0" />}
                    {!isModified && !isStaged && item.type === 'file' && (
                      <GitBranch className="w-3 h-3 text-gray-700 shrink-0" />
                    )}
                  </span>
                )}

                {!isRenaming && (
                  <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center gap-1 shrink-0">
                    {item.type === 'folder' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            createFile(item.id);
                          }}
                          title="New File"
                          className="p-1.5 hover:text-white transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            createFolder(item.id);
                          }}
                          title="New Folder"
                          className="p-1.5 hover:text-white transition-colors"
                        >
                          <Folder className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        renameItem(item.id);
                      }}
                      title="Rename"
                      className="p-1.5 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      title="Delete"
                      className="p-1.5 text-red-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
            {creatingInId.type === 'folder' ? (
              <Folder className="w-3 h-3 text-red-500" />
            ) : (
              <FileCode className="w-3 h-3 text-red-500" />
            )}
            <input
              autoFocus
              placeholder={creatingInId.type === 'folder' ? 'Folder name...' : 'File name...'}
              className="flex-1 bg-transparent border-b border-red-500/50 text-white outline-none font-mono text-[10px]"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') {
                  setCreatingInId(null);
                  setNewName('');
                }
              }}
              onBlur={handleConfirmCreate}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="phi-grid flex flex-col md:flex-row h-screen min-h-[100dvh] w-full bg-red-950/10 text-red-100 font-sans selection:bg-red-900/40 overflow-hidden"
         style={{ gridTemplateColumns: 'var(--phi-primary) var(--phi-contextual) var(--phi-pulse)' } as React.CSSProperties}>
      {/* Sidebar Navigation - Hidden on mobile */}
      <nav className="hidden md:flex w-20 border-r border-red-900/30 flex-col items-center py-8 space-y-8 bg-[#080101] z-30 shadow-[10px_0_40px_rgba(153,27,27,0.1)] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(153,27,27,0.05),transparent)] pointer-events-none" />
        <div className="p-3 bg-red-800 rounded-2xl shadow-[0_0_20px_rgba(185,28,28,0.5)] group cursor-pointer hover:rotate-12 transition-transform relative z-10">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 space-y-6 relative z-10">
          <SidebarIcon
            icon={<Zap />}
            active={activeTab === 'toolneuron'}
            onClick={() => setActiveTab('toolneuron')}
            label="ToolNeuron Hub"
          />
          <SidebarIcon
            icon={<TerminalIcon />}
            active={activeTab === 'terminal'}
            onClick={() => setActiveTab('terminal')}
            label="Terminal"
          />
          <SidebarIcon
            icon={<Code2 />}
            active={activeTab === 'editor'}
            onClick={() => setActiveTab('editor')}
            label="Neural Editor"
          />
          <SidebarIcon
            icon={<LayoutTemplate />}
            active={activeTab === 'analysis'}
            onClick={() => setActiveTab('analysis')}
            label="Code Analysis"
          />
          <SidebarIcon
            icon={<Brain />}
            active={activeTab === 'brain'}
            onClick={() => setActiveTab('brain')}
            label="Neural Core"
          />
          <SidebarIcon
            icon={<Smartphone />}
            active={activeTab === 'termux'}
            onClick={() => setActiveTab('termux')}
            label="Node Bridge"
          />
          <SidebarIcon
            icon={<HardDrive />}
            active={activeTab === 'storage'}
            onClick={() => setActiveTab('storage')}
            label="Data Core"
          />
        </div>
        <SidebarIcon
          icon={<SettingsIcon />}
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          label="System Config"
        />
      </nav>

      {/* Bottom Navigation - Visible only on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#080101]/95 backdrop-blur-xl border-t border-red-900/30 flex items-center px-2 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] overflow-x-auto custom-scrollbar gap-2">
        <button
          onClick={() => setActiveTab('toolneuron')}
          className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'toolneuron' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}
        >
          <Zap size={20} />
        </button>
        <button
          onClick={() => setActiveTab('terminal')}
          className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'terminal' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}
        >
          <TerminalIcon size={20} />
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'editor' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}
        >
          <Code2 size={20} />
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'analysis' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}
        >
          <LayoutTemplate size={20} />
        </button>
        <button
          onClick={() => setActiveTab('brain')}
          className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'brain' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}
        >
          <Brain size={20} />
        </button>
        <button
          onClick={() => setActiveTab('termux')}
          className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'termux' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}
        >
          <Smartphone size={20} />
        </button>{' '}
        <button
          onClick={() => setActiveTab('storage')}
          className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'storage' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}
        >
          <HardDrive size={20} />
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-3 shrink-0 rounded-xl transition-all ${activeTab === 'settings' ? 'text-red-500 bg-red-950/20' : 'text-red-900'}`}
        >
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
            <h1 className="text-[10px] md:text-sm font-black tracking-[0.2em] md:tracking-[0.4em] text-red-500 uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] truncate max-w-[80px] md:max-w-none">
              {activeTab} node
            </h1>

            {/* Model Selector */}
            <div className="flex items-center gap-1 md:gap-2 bg-red-950/40 border border-red-800/40 rounded-full px-2 md:px-3 py-1">
              <select
                value={aiProvider}
                onChange={(e) => {
                  const p = e.target.value as 'google' | 'grok' | 'ollama';
                  setAiProvider(p);
                  if (p === 'google') setAiModel('gemini-2.5-pro-preview-05-06');
                  else if (p === 'grok') setAiModel('grok-beta');
                  else if (p === 'ollama') {
                    setAiModel(ollamaModels[0] || 'llama3');
                    refreshOllamaModels();
                  }
                }}
                className="bg-transparent text-[8px] md:text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest"
              >
                <option value="google" className="bg-[#0a0202]">
                  Google
                </option>
                <option value="grok" className="bg-[#0a0202]">
                  Grok
                </option>
                <option value="ollama" className="bg-[#0a0202]">
                  Ollama
                </option>
              </select>
              <div className="w-px h-3 bg-red-900/50" />
              {aiProvider === 'ollama' ? (
                <>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="bg-transparent text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest w-24 truncate"
                  >
                    {ollamaModels.length > 0 ? (
                      ollamaModels.map((m) => (
                        <option key={m} value={m} className="bg-[#0a0202]">
                          {m}
                        </option>
                      ))
                    ) : (
                      <option value="llama3" className="bg-[#0a0202]">
                        llama3
                      </option>
                    )}
                  </select>
                  <button
                    onClick={() => refreshOllamaModels()}
                    className="text-[8px] text-red-500 hover:text-red-300"
                  >
                    ↻
                  </button>
                </>
              ) : aiProvider === 'google' ? (
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest w-24 truncate"
                >
                  <option value="gemini-2.5-pro-preview-05-06" className="bg-[#0a0202]">
                    gemini-2.5-pro
                  </option>
                  <option value="gemini-2.5-flash-preview-04-17" className="bg-[#0a0202]">
                    gemini-2.5-flash
                  </option>
                  <option value="gemini-2.0-flash" className="bg-[#0a0202]">
                    gemini-2.0-flash
                  </option>
                </select>
              ) : (
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest w-24 truncate"
                >
                  <option value="grok-beta" className="bg-[#0a0202]">
                    grok-beta
                  </option>
                  <option value="grok-vision-beta" className="bg-[#0a0202]">
                    grok-vision
                  </option>
                </select>
              )}
            </div>

            {/* Personality Selector */}
            <div className="hidden md:flex items-center gap-2 bg-red-950/40 border border-red-800/40 rounded-full px-3 py-1">
              <UserCircle className="w-4 h-4 text-red-500" />
              <select
                value={personalities.find((p) => p.active)?.id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  setPersonalities((prev) =>
                    prev.map((pers) => ({ ...pers, active: pers.id === id }))
                  );
                }}
                className="bg-transparent text-[10px] font-black text-red-400 outline-none cursor-pointer uppercase tracking-widest max-w-[120px] truncate"
              >
                {personalities.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0a0202]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-2 md:px-4 py-1 bg-red-950/40 border border-red-800/40 rounded-full text-[8px] md:text-[10px] text-red-400 font-black flex items-center gap-1.5 md:gap-3">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-pulse glow-red" />
              <span className="truncate max-w-[60px] md:max-w-none">
                {activePersonality.name.toUpperCase()} ACTIVE
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4 md:space-x-8">
            <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-red-400/60 bg-red-950/20 px-4 py-2 rounded-xl border border-red-900/20">
              <Gauge className="w-4 h-4 text-red-600" />
              <span className="font-black tracking-widest">88%</span>
            </div>
            <div
              className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full ${termuxStatus === 'connected' ? 'bg-red-500 glow-red' : 'bg-red-950/40 border border-red-900/30'}`}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(185,28,28,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(185,28,28,0.2)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* TOOLNEURON HUB */}
          {activeTab === 'toolneuron' && (
            <ToolNeuronPanel
              chatMessages={chatMessages}
              studioInput={studioInput}
              setStudioInput={setStudioInput}
              handleStudioSubmit={handleStudioSubmit}
              isVaultUnlocked={isVaultUnlocked}
              setIsVaultUnlocked={setIsVaultUnlocked}
              swarmAnxiety={swarmAnxiety}
              swarmAgents={swarmAgents}
              swarmLogs={swarmLogs}
              triggerSwarmCycle={triggerSwarmCycle}
              isAiProcessing={isAiProcessing}
              debugAnalysis={debugAnalysis}
              runStaticAnalysis={runStaticAnalysis}
              runDynamicTracing={runDynamicTracing}
              getRefactoringSuggestions={getRefactoringSuggestions}
              activePersonality={activePersonality}
              tnKnowledgePacks={tnKnowledgePacks}
              handleKnowledgeUpload={handleKnowledgeUpload}
              setActiveTab={setActiveTab}
              onApplyCode={(code, mode) => {
                if (mode === 'refactor') {
                  handleApplyRefactor(code, false, null);
                } else {
                  handleApplyForge(code, false);
                }
                setActiveTab('editor');
              }}
            />
          )}

          {/* TERMINAL */}
          {activeTab === 'terminal' && (
            <TerminalPanel
              terminalOutput={terminalOutput}
              terminalEndRef={terminalEndRef}
              isAiProcessing={isAiProcessing}
              activePersonality={activePersonality}
              termInput={termInput}
              setTermInput={setTermInput}
              termSuggestion={termSuggestion}
              setTermSuggestion={setTermSuggestion}
              termSuggestions={termSuggestions}
              setTermSuggestions={setTermSuggestions}
              selectedSuggestionIndex={selectedSuggestionIndex}
              handleTermInputChange={handleTermInputChange}
              handleTermKeyDown={handleTermKeyDown}
              handleTerminalCommand={handleTerminalCommand}
              realCwd={realCwd}
            />
          )}

          {/* NEURAL EDITOR */}
          {activeTab === 'editor' && (
            <EditorPanel
              projectFiles={projectFiles}
              activeFileId={activeFileId}
              setProjectFiles={setProjectFiles}
              handleFileSwitch={handleFileSwitch}
              handleFileUpload={handleFileUpload}
              editorContent={editorContent}
              setEditorContent={setEditorContent}
              editorLanguage={editorLanguage}
              setEditorLanguage={setEditorLanguage}
              editorOutput={editorOutput}
              setEditorOutput={setEditorOutput}
              editorMode={editorMode}
              setEditorMode={setEditorMode}
              theme={theme}
              debouncedEditorContent={debouncedEditorContent}
              isRunningCode={isRunningCode}
              isScanningCode={isScanningCode}
              scanResults={scanResults}
              handleRunCode={handleRunCode}
              handleScanCode={handleScanCode}
              lastSavedTime={lastSavedTime}
              forceSave={forceSave}
              isLivePreviewEnabled={isLivePreviewEnabled}
              setIsLivePreviewEnabled={setIsLivePreviewEnabled}
              isInspectorActive={isInspectorActive}
              setIsInspectorActive={setIsInspectorActive}
              inspectedElement={inspectedElement}
              setInspectedElement={setInspectedElement}
              inspectedElementRef={inspectedElementRef}
              previewContainerRef={previewContainerRef}
              handleInspectMouseMove={handleInspectMouseMove}
              handleInspectClick={handleInspectClick}
              handleStyleChange={handleStyleChange}
              isPairProgrammerActive={isPairProgrammerActive}
              setIsPairProgrammerActive={setIsPairProgrammerActive}
              isEditorAssistantOpen={isEditorAssistantOpen}
              setIsEditorAssistantOpen={setIsEditorAssistantOpen}
              editorAssistantMessages={editorAssistantMessages}
              editorAssistantInput={editorAssistantInput}
              setEditorAssistantInput={setEditorAssistantInput}
              handleEditorAssistantSubmit={handleEditorAssistantSubmit}
              handleCodeReview={handleCodeReview}
              handleSaveAnalysis={handleSaveAnalysis}
              handleApplyDocumentation={handleApplyDocumentation}
              handleApplyRefactor={handleApplyRefactor}
              handleApplyForge={handleApplyForge}
              isAiProcessing={isAiProcessing}
              handleExplainCode={handleExplainCode}
              handleFullProjectAnalysis={handleFullProjectAnalysis}
              handleDeepProjectAudit={handleDeepProjectAudit}
              handleGenerateDocs={handleGenerateDocs}
              handleFormatCode={handleFormatCode}
              handleRefactorCode={handleRefactorCode}
              handleRefactorAllFiles={handleRefactorAllFiles}
              handleReviewCode={handleReviewCode}
              handleAnalyzeData={handleAnalyzeData}
              handleGenerateCode={handleGenerateCode}
              breakpoints={breakpoints}
              cursorLine={cursorLine}
              debugState={debugState}
              debugRefactorResult={debugRefactorResult}
              setDebugRefactorResult={setDebugRefactorResult}
              handleToggleCurrentLineBreakpoint={handleToggleCurrentLineBreakpoint}
              handleStartDebug={handleStartDebug}
              handleStopDebug={handleStopDebug}
              handleStep={handleStep}
              handleDebugRefactor={handleDebugRefactor}
              handleApplyDebugRefactor={handleApplyDebugRefactor}
              handleEditorDidMount={handleEditorDidMount}
              gitRepo={gitRepo}
              setGitRepo={setGitRepo}
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
              isMobileFileTreeOpen={isMobileFileTreeOpen}
              setIsMobileFileTreeOpen={setIsMobileFileTreeOpen}
              setIsGenerateModalOpen={setIsGenerateModalOpen}
              setIsTemplateModalOpen={setIsTemplateModalOpen}
              swarmAnxiety={swarmAnxiety}
              setTerminalOutput={setTerminalOutput}
            />
          )}

          {/* CODE ANALYSIS */}
          {activeTab === 'analysis' && (
            <AnalysisPanel
              editorContent={editorContent}
              editorOutput={editorOutput}
              isAiProcessing={isAiProcessing}
              editorAssistantInput={editorAssistantInput}
              setEditorAssistantInput={setEditorAssistantInput}
              handleAnalyzeCode={handleAnalyzeCode}
              projectFiles={projectFiles}
              activeFileId={activeFileId}
            />
          )}

          {/* NODE BRIDGE */}
          {activeTab === 'termux' && (
            <NodeBridgePanel
              termuxFiles={termuxFiles}
              setTermuxFiles={setTermuxFiles}
              setTermuxStatus={setTermuxStatus}
              handleTermuxFileUpload={handleTermuxFileUpload}
            />
          )}

          {/* DATA CORE / STORAGE */}
          {activeTab === 'storage' && (
            <StoragePanel
              storageFiles={storageFiles}
              setStorageFiles={setStorageFiles}
              handleStorageUpload={handleStorageUpload}
            />
          )}

          {/* NEURAL CORE */}
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
              brainConfig={brainConfig}
              setBrainConfig={setBrainConfig}
              brainRefFile={brainRefFile}
              setBrainRefFile={setBrainRefFile}
              isAiProcessing={isAiProcessing}
              setIsAiProcessing={setIsAiProcessing}
              setTerminalOutput={setTerminalOutput}
              setActiveTab={setActiveTab}
              generateAIResponse={generateAIResponse}
              activePersonality={activePersonality}
            />
          )}
        </div>
      </main>

      {/* Post Commit Modal */}
      {/* Commit Message Modal */}
      {isCommitModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0d0404] border border-red-900/30 rounded-[30px] shadow-[0_0_100px_rgba(185,28,28,0.2)] overflow-hidden">
            <div className="p-6 border-b border-red-900/20 bg-black/40 flex items-center justify-between">
              <h3 className="text-lg font-black text-red-100 uppercase tracking-tighter">Commit Changes</h3>
              <button onClick={() => setIsCommitModalOpen(false)} className="p-2 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-red-900 font-bold uppercase tracking-widest">{gitRepo.staged.length} file{gitRepo.staged.length !== 1 ? 's' : ''} staged</p>
              <textarea
                value={commitMessage}
                onChange={e => setCommitMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.metaKey && confirmGitCommit()}
                placeholder="Enter commit message..."
                autoFocus
                className="w-full bg-black/60 border border-red-900/30 rounded-xl px-4 py-3 text-sm text-red-100 placeholder:text-red-900/50 focus:outline-none focus:border-red-700/60 resize-none min-h-[80px]"
              />
              <div className="flex gap-3">
                <button onClick={confirmGitCommit} disabled={!commitMessage.trim()} className="flex-1 py-3 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Commit
                </button>
                <button onClick={() => setIsCommitModalOpen(false)} className="flex-1 py-3 bg-transparent border border-red-900/30 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-950/30 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#0d0404] border border-red-900/30 rounded-[30px] shadow-[0_0_60px_rgba(185,28,28,0.2)] overflow-hidden">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-black text-red-100 uppercase tracking-tighter">Delete Item?</h3>
              <p className="text-sm text-red-100/60">This will permanently remove the item and all its contents. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => confirmDeleteItem(deleteConfirmId)} className="flex-1 py-3 bg-red-800 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                  Delete
                </button>
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 bg-transparent border border-red-900/30 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-950/30 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Confirm Modal */}
      {templateConfirmKey && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#0d0404] border border-red-900/30 rounded-[30px] shadow-[0_0_60px_rgba(185,28,28,0.2)] overflow-hidden">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-black text-red-100 uppercase tracking-tighter">Load Template?</h3>
              <p className="text-sm text-red-100/60">Loading <span className="text-red-400 font-bold">"{PROJECT_TEMPLATES[templateConfirmKey].name}"</span> will overwrite your current project.</p>
              <div className="flex gap-3">
                <button onClick={confirmLoadTemplate} className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                  Load Template
                </button>
                <button onClick={() => setTemplateConfirmKey(null)} className="flex-1 py-3 bg-transparent border border-red-900/30 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-950/30 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <h3 className="text-xl md:text-2xl font-black text-red-100 uppercase tracking-tighter">
                  Neural Forge
                </h3>
                <p className="text-[10px] md:text-xs text-red-900 font-bold tracking-widest uppercase">
                  Describe desired functionality to generate code
                </p>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-3 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all shrink-0 ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-[0.3em]">
                  Generation Mode
                </label>
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
                <label className="text-[10px] font-black text-red-800 uppercase tracking-[0.3em]">
                  Prompt
                </label>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder={
                    generateMode === 'file'
                      ? 'e.g., Create a React component named UserProfile that fetches user data...'
                      : 'e.g., Write a function to sort an array of objects by a specific key...'
                  }
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
                <h3 className="text-xl md:text-3xl font-black text-red-100 uppercase tracking-tighter">
                  Initialize Neural Project
                </h3>
                <p className="text-[10px] md:text-sm text-red-900 font-bold tracking-widest uppercase">
                  Select a predefined template to begin your development cycle
                </p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-3 md:p-4 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all shrink-0 ml-4"
              >
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {(Object.keys(PROJECT_TEMPLATES) as Array<keyof typeof PROJECT_TEMPLATES>).map(
                  (key) => (
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
                        <h4 className="text-lg md:text-xl font-black text-red-100 uppercase tracking-tight">
                          {PROJECT_TEMPLATES[key].name}
                        </h4>
                        <p className="text-[10px] md:text-[11px] text-red-900 font-bold uppercase tracking-widest leading-relaxed">
                          {key === 'python-web'
                            ? 'Full-stack Flask environment with HTML/CSS integration.'
                            : key === 'rust-cli'
                              ? 'High-performance CLI tool architecture with Cargo config.'
                              : 'Modular neural logic with JSON configuration.'}
                        </p>
                      </div>
                      <div className="pt-4 flex items-center gap-3 text-[10px] font-black text-red-500 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                        Initialize Matrix <Zap className="w-3 h-3" />
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="p-6 md:p-12 bg-black/40 border-t border-red-900/20 text-center shrink-0">
              <p className="text-[9px] md:text-[10px] text-red-900 font-black uppercase tracking-[0.4em]">
                Crimson OS Neural Development Environment v4.1.0_EX
              </p>
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

      {/* Crash Recovery Banner */}
      {hasRecoveryDraft && recoveryDraft && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] w-[90vw] max-w-lg animate-in slide-in-from-bottom-4 duration-400">
          <div className="bg-black/95 border border-orange-500/60 rounded-2xl shadow-[0_0_40px_rgba(249,115,22,0.3)] backdrop-blur-xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-orange-400 uppercase tracking-widest">
                  Crash Recovery
                </p>
                <p className="text-[10px] text-red-100/70 mt-0.5 truncate">
                  Unsaved draft found:{' '}
                  <span className="text-white font-bold">{recoveryDraft.fileName}</span>
                </p>
                <p className="text-[9px] text-red-900 mt-0.5">
                  {new Date(recoveryDraft.ts).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={restoreDraft}
                className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white transition-all"
              >
                Restore Draft
              </button>
              <button
                onClick={dismissDraft}
                className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-950/60 border border-red-900/30 text-red-500 hover:bg-red-900/30 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

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
                if (contextMenu.itemId) createFile(contextMenu.itemId);
                else createFile(null);
                setContextMenu(null);
              }}
            >
              <Plus className="w-4 h-4" /> New File
            </button>
            <button
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-950/40 hover:text-red-400 transition-colors text-left"
              onClick={() => {
                if (contextMenu.itemId) createFolder(contextMenu.itemId);
                else createFolder(null);
                setContextMenu(null);
              }}
            >
              <Folder className="w-4 h-4" /> New Folder
            </button>
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

      {/* φ Pulse Column — system health indicator, always last in grid */}
      <div className="phi-grid__pulse hidden md:block" aria-hidden="true" />
    </div>
  );
};

const SidebarIcon: React.FC<{
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}> = ({ icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`group relative p-4 rounded-[28px] transition-all duration-500 ${active ? 'text-red-500 bg-red-950/20 border border-red-700/50 shadow-[0_0_40px_rgba(220,38,38,0.2)] scale-110 rotate-3' : 'text-red-950 hover:text-red-600 hover:bg-red-950/10 hover:scale-105'}`}
  >
    {React.cloneElement(icon as any, { size: 24, strokeWidth: active ? 3 : 2 })}
    <div className="absolute left-20 bg-red-950 text-red-500 text-[11px] py-2 px-5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-red-800/40 z-50 translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-black uppercase tracking-[0.4em] backdrop-blur-md">
      {label}
    </div>
  </button>
);

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; errorInfo: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px',
            color: 'white',
            background: 'red',
            height: '100vh',
            width: '100vw',
            fontFamily: 'sans-serif',
            fontSize: '24px',
          }}
        >
          <h1>APPLICATION CRASHED</h1>
          <p>There was a critical error rendering the application.</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: 'black',
              color: 'lightgreen',
              padding: '20px',
              fontSize: '16px',
            }}
          >
            {this.state.error?.toString()}\n\n{this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ padding: '20px', fontSize: '20px', cursor: 'pointer', marginTop: '20px' }}
          >
            CLEAR SAVED DATA & RELOAD
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = (container as any)._reactRoot || createRoot(container);
  (container as any)._reactRoot = root;
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
