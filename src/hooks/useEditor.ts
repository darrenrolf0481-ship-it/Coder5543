import { useState, useRef, useCallback, useEffect } from 'react';
import { ProjectFile, Personality } from '../types';

export const useEditor = (
  initialFiles: ProjectFile[],
  activePersonality: Personality,
  generateAIResponse: (prompt: string, instruction: string, options?: any) => Promise<string | undefined>
) => {
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('python');
  const [editorMode, setEditorMode] = useState<'code' | 'preview' | 'debug' | 'git' | 'settings'>('code');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isEditorAssistantOpen, setIsEditorAssistantOpen] = useState(false);
  const [isPairProgrammerActive, setIsPairProgrammerActive] = useState(false);
  const [editorAssistantInput, setEditorAssistantInput] = useState('');
  const [editorAssistantMessages, setEditorAssistantMessages] = useState<{role: 'user' | 'ai', text: string, metadata?: any}[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isMobileFileTreeOpen, setIsMobileFileTreeOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const fetchFiles = useCallback(async (path: string = ".") => {
    try {
      const res = await fetch(`http://localhost:8001/api/files/list?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // If path is root, replace all. If nested, we'd need more complex logic.
          // For now, let's just fetch the root and show it.
          setProjectFiles(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const loadFile = useCallback(async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8001/api/files/read?path=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.content !== undefined) {
          setEditorContent(data.content);
          setEditorLanguage(id.split('.').pop() || 'text');
          setActiveFileId(id);
        }
      }
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeFileId) return;
    try {
      const res = await fetch(`http://localhost:8001/api/files/save?path=${encodeURIComponent(activeFileId)}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ code: editorContent })
      });
      if (res.ok) {
        setLastSavedTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [activeFileId, editorContent]);

  const handleRunCode = useCallback(async () => {
    if (!activeFileId) return;
    setIsRunningCode(true);
    setTerminalOutput(prev => [...prev, `[NEURAL_EXEC] Initiating: ${activeFileId}`]);
    try {
      const res = await fetch('http://localhost:8001/api/terminal', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ command: `python3 ${activeFileId}` })
      });
      const data = await res.json();
      if (data.stdout) setTerminalOutput(prev => [...prev, ...data.stdout.split('\n')]);
      if (data.stderr) setTerminalOutput(prev => [...prev, ...data.stderr.split('\n').map((l: string) => `[ERR] ${l}`)]);
      if (data.exit_code !== undefined) setTerminalOutput(prev => [...prev, `[EXIT] Protocol terminated with code ${data.exit_code}`]);
    } catch (err) {
      setTerminalOutput(prev => [...prev, `[CRITICAL_FAILURE] Node synchronization lost.`]);
    }
    setIsRunningCode(false);
  }, [activeFileId]);

  const handleExplainCode = useCallback(async () => {
    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Explain this ${editorLanguage} code:\n${editorContent}`,
        `You are a senior developer. ${activePersonality.instruction}`,
        { modelType: 'fast' }
      );
      setEditorAssistantMessages(prev => [...prev, { role: 'ai', text: response || 'No explanation available.' }]);
      setIsEditorAssistantOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiProcessing(false);
    }
  }, [editorContent, editorLanguage, activePersonality, generateAIResponse]);

  return {
    projectFiles,
    setProjectFiles,
    activeFileId,
    setActiveFileId: loadFile, // Override to use loadFile
    editorContent,
    setEditorContent,
    editorLanguage,
    setEditorLanguage,
    editorMode,
    setEditorMode,
    isRunningCode,
    isEditorAssistantOpen,
    setIsEditorAssistantOpen,
    isPairProgrammerActive,
    setIsPairProgrammerActive,
    editorAssistantInput,
    setEditorAssistantInput,
    editorAssistantMessages,
    setEditorAssistantMessages,
    lastSavedTime,
    isMobileFileTreeOpen,
    setIsMobileFileTreeOpen,
    isAiProcessing,
    terminalOutput,
    setTerminalOutput,
    handleRunCode,
    handleExplainCode,
    handleSave,
    refreshFiles: fetchFiles
  };
};
