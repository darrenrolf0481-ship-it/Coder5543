import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from '../lib/useDebounce';

const DRAFT_KEY = 'crimson_draft';

interface InspectedElement {
  tagName: string;
  className: string;
  id: string;
  rect: { top: number; left: number; width: number; height: number } | null;
  styles: Record<string, string>;
}

interface RecoveryDraft {
  fileId: string;
  fileName: string;
  content: string;
  ts: number;
}

interface EditorContextType {
  editorLanguage: string;
  setEditorLanguage: React.Dispatch<React.SetStateAction<string>>;
  projectFiles: any[];
  setProjectFiles: React.Dispatch<React.SetStateAction<any[]>>;
  activeFileId: string;
  setActiveFileId: React.Dispatch<React.SetStateAction<string>>;
  editorContent: string;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
  debouncedEditorContent: string;
  editorOutput: string;
  setEditorOutput: React.Dispatch<React.SetStateAction<string>>;
  editorMode: 'code' | 'preview' | 'debug' | 'git' | 'settings';
  setEditorMode: React.Dispatch<React.SetStateAction<'code' | 'preview' | 'debug' | 'git' | 'settings'>>;
  isRunningCode: boolean;
  setIsRunningCode: React.Dispatch<React.SetStateAction<boolean>>;
  isLivePreviewEnabled: boolean;
  setIsLivePreviewEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isPairProgrammerActive: boolean;
  setIsPairProgrammerActive: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileFileTreeOpen: boolean;
  setIsMobileFileTreeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isScanningCode: boolean;
  setIsScanningCode: React.Dispatch<React.SetStateAction<boolean>>;
  scanResults: number[];
  setScanResults: React.Dispatch<React.SetStateAction<number[]>>;
  editorAssistantInput: string;
  setEditorAssistantInput: React.Dispatch<React.SetStateAction<string>>;
  editorAssistantMessages: { role: 'user' | 'ai'; text: string }[];
  setEditorAssistantMessages: React.Dispatch<React.SetStateAction<{ role: 'user' | 'ai'; text: string }[]>>;
  isEditorAssistantOpen: boolean;
  setIsEditorAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
  termInput: string;
  setTermInput: React.Dispatch<React.SetStateAction<string>>;
  cursorLine: number;
  setCursorLine: React.Dispatch<React.SetStateAction<number>>;
  contextMenu: { x: number; y: number; itemId: string | null } | null;
  setContextMenu: React.Dispatch<React.SetStateAction<{ x: number; y: number; itemId: string | null } | null>>;
  lastSavedTime: string | null;
  setLastSavedTime: React.Dispatch<React.SetStateAction<string | null>>;
  renamingId: string | null;
  setRenamingId: React.Dispatch<React.SetStateAction<string | null>>;
  newName: string;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  creatingInId: { parentId: string | null; type: 'file' | 'folder' } | null;
  setCreatingInId: React.Dispatch<React.SetStateAction<{ parentId: string | null; type: 'file' | 'folder' } | null>>;
  isInspectorActive: boolean;
  setIsInspectorActive: React.Dispatch<React.SetStateAction<boolean>>;
  inspectedElement: InspectedElement | null;
  setInspectedElement: React.Dispatch<React.SetStateAction<InspectedElement | null>>;
  monacoEditorRef: React.MutableRefObject<any>;
  decorationsRef: React.MutableRefObject<string[]>;
  previewContainerRef: React.RefObject<HTMLDivElement>;
  inspectedElementRef: React.MutableRefObject<HTMLElement | null>;
  saveFile: () => void;
  forceSave: () => void;
  handleEditorDidMount: (editor: any) => void;
  handleFileSwitch: (fileId: string) => void;
  // Crash recovery
  hasRecoveryDraft: boolean;
  recoveryDraft: RecoveryDraft | null;
  restoreDraft: () => void;
  dismissDraft: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

const initialProjectFiles = [
  { id: 'root', name: 'Project', type: 'folder', parentId: null, isOpen: true },
  { id: 'src', name: 'src', type: 'folder', parentId: 'root', isOpen: true },
  { id: 'brain.py', name: 'neural_brain.py', type: 'file', parentId: 'src', language: 'python', content: '# AI Brain Logic\nclass NeuralCore:\n    def __init__(self):\n        self.synapses = 10**12\n\n    def process(self, input_data):\n        return f"Neural processing: {input_data}"\n\ncore = NeuralCore()\nprint(core.process("Initial stimulus"))' },
  { id: 'ui.html', name: 'interface.html', type: 'file', parentId: 'src', language: 'html', content: '<div class="p-8 bg-red-900/20 rounded-3xl border border-red-500/30">\n  <h1 class="text-2xl font-black text-red-500 uppercase">Neural Interface</h1>\n  <p class="text-red-100/60 mt-4">Real-time UI component rendering via Crimson Engine.</p>\n  <button class="mt-8 px-6 py-3 bg-red-700 text-white rounded-xl uppercase font-black text-xs tracking-widest">Activate Core</button>\n</div>' },
  { id: 'logic.rs', name: 'core_logic.rs', type: 'file', parentId: 'src', language: 'rust', content: 'fn main() {\n    let neural_load = 0.85;\n    println!("System load: {}%", neural_load * 100.0);\n}' }
];

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [editorLanguage, setEditorLanguage] = useState('python');
  const [projectFiles, setProjectFiles] = useState<any[]>(initialProjectFiles);
  const [activeFileId, setActiveFileId] = useState('brain.py');
  const [editorContent, setEditorContent] = useState(
    initialProjectFiles.find(f => f.id === 'brain.py')?.content ?? ''
  );
  const debouncedEditorContent = useDebounce(editorContent, 150);
  const [editorOutput, setEditorOutput] = useState('');
  const [editorMode, setEditorMode] = useState<'code' | 'preview' | 'debug' | 'git' | 'settings'>('code');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isLivePreviewEnabled, setIsLivePreviewEnabled] = useState(true);
  const [isPairProgrammerActive, setIsPairProgrammerActive] = useState(false);
  const [isMobileFileTreeOpen, setIsMobileFileTreeOpen] = useState(false);
  const [isScanningCode, setIsScanningCode] = useState(false);
  const [scanResults, setScanResults] = useState<number[]>([]);
  const [editorAssistantInput, setEditorAssistantInput] = useState('');
  const [editorAssistantMessages, setEditorAssistantMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isEditorAssistantOpen, setIsEditorAssistantOpen] = useState(false);
  const [termInput, setTermInput] = useState('');
  const [cursorLine, setCursorLine] = useState(1);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string | null } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creatingInId, setCreatingInId] = useState<{ parentId: string | null; type: 'file' | 'folder' } | null>(null);
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [inspectedElement, setInspectedElement] = useState<InspectedElement | null>(null);

  // Crash recovery state
  const [hasRecoveryDraft, setHasRecoveryDraft] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<RecoveryDraft | null>(null);

  const monacoEditorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const inspectedElementRef = useRef<HTMLElement | null>(null);

  // --- CRASH RECOVERY ---

  // Check for unrecovered draft on mount (slight delay to let prefs load first)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft: RecoveryDraft = JSON.parse(raw);
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

  // Write draft every 500ms on content change
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const fileName = projectFiles.find(f => f.id === activeFileId)?.name ?? activeFileId;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          fileId: activeFileId,
          fileName,
          content: editorContent,
          ts: Date.now(),
        } satisfies RecoveryDraft));
      } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [activeFileId, editorContent, projectFiles]);

  // Clear draft on clean exit so it doesn't trigger false recovery on next boot
  useEffect(() => {
    const handleBeforeUnload = () => localStorage.removeItem(DRAFT_KEY);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const restoreDraft = useCallback(() => {
    if (!recoveryDraft) return;
    setActiveFileId(recoveryDraft.fileId);
    setEditorContent(recoveryDraft.content);
    setProjectFiles(prev => prev.map(f =>
      f.id === recoveryDraft.fileId ? { ...f, content: recoveryDraft.content } : f
    ));
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

  // --- SAVE LOGIC ---

  const saveFile = useCallback(() => {
    if (activeFileId) {
      setProjectFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: editorContent } : f));
      setLastSavedTime(new Date().toLocaleTimeString());
    }
  }, [activeFileId, editorContent]);

  // Immediately flush content to projectFiles AND refresh the draft slot
  const forceSave = useCallback(() => {
    if (!activeFileId) return;
    const now = new Date().toLocaleTimeString();
    setProjectFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: editorContent } : f));
    setLastSavedTime(now);
    try {
      const fileName = projectFiles.find(f => f.id === activeFileId)?.name ?? activeFileId;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        fileId: activeFileId,
        fileName,
        content: editorContent,
        ts: Date.now(),
      } satisfies RecoveryDraft));
    } catch {}
  }, [activeFileId, editorContent, projectFiles]);

  // Auto-save every 5s
  useEffect(() => {
    const interval = setInterval(saveFile, 5000);
    return () => clearInterval(interval);
  }, [saveFile]);

  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;
    editor.onDidBlurEditorText(() => saveFile());
  };

  const handleFileSwitch = useCallback((fileId: string) => {
    setProjectFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: editorContent } : f));
    const file = projectFiles.find(f => f.id === fileId);
    if (file && file.type === 'file') {
      setActiveFileId(fileId);
      setEditorContent(file.content || '');
      setEditorLanguage(file.language || 'text');
      setEditorMode(file.language === 'html' ? 'preview' : 'code');
    }
  }, [activeFileId, editorContent, projectFiles]);

  return (
    <EditorContext.Provider value={{
      editorLanguage, setEditorLanguage,
      projectFiles, setProjectFiles,
      activeFileId, setActiveFileId,
      editorContent, setEditorContent,
      debouncedEditorContent,
      editorOutput, setEditorOutput,
      editorMode, setEditorMode,
      isRunningCode, setIsRunningCode,
      isLivePreviewEnabled, setIsLivePreviewEnabled,
      isPairProgrammerActive, setIsPairProgrammerActive,
      isMobileFileTreeOpen, setIsMobileFileTreeOpen,
      isScanningCode, setIsScanningCode,
      scanResults, setScanResults,
      editorAssistantInput, setEditorAssistantInput,
      editorAssistantMessages, setEditorAssistantMessages,
      isEditorAssistantOpen, setIsEditorAssistantOpen,
      termInput, setTermInput,
      cursorLine, setCursorLine,
      contextMenu, setContextMenu,
      lastSavedTime, setLastSavedTime,
      renamingId, setRenamingId,
      newName, setNewName,
      creatingInId, setCreatingInId,
      isInspectorActive, setIsInspectorActive,
      inspectedElement, setInspectedElement,
      monacoEditorRef,
      decorationsRef,
      previewContainerRef,
      inspectedElementRef,
      saveFile,
      forceSave,
      handleEditorDidMount,
      handleFileSwitch,
      hasRecoveryDraft,
      recoveryDraft,
      restoreDraft,
      dismissDraft,
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within EditorProvider');
  return context;
};
