import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDebounce } from '../../lib/useDebounce';
import { DRAFT_KEY, SESSION_ID } from '../../lib/constants'; // I'll need to create this

export function useEditorLogic(
  projectFiles: any[],
  setProjectFiles: any,
  activeFileId: string,
  setActiveFileId: any,
  markFileDirty: any,
  editorLanguage: string,
  setEditorLanguage: any,
  setEditorOutput: any,
  gitRepo: any,
  setGitRepo: any,
) {
  const [editorContent, setEditorContent] = useState(
    projectFiles.find((f) => f.id === activeFileId)?.content ?? '',
  );
  const debouncedEditorContent = useDebounce(editorContent, 150);
  const [editorMode, setEditorMode] = useState<'code' | 'preview' | 'debug' | 'git' | 'settings'>(
    'code',
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
  const [cursorLine, setCursorLine] = useState(1);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string | null;
  } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

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

  // Sync editorContent when projectFiles changes (e.g. from FileTree)
  useEffect(() => {
    const file = projectFiles.find((f) => f.id === activeFileId);
    if (file && file.content !== undefined && file.content !== editorContent) {
      setEditorContent(file.content);
    }
  }, [activeFileId, projectFiles]);

  // Auto-switch HTML files to preview mode and non-HTML files out of preview
  useEffect(() => {
    if (editorLanguage === 'html') {
      setEditorMode('preview');
    } else {
      setEditorMode((prev) => (prev === 'preview' ? 'code' : prev));
    }
  }, [editorLanguage]);

  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;

    editor.onDidChangeCursorSelection((e: any) => {
      const line = e.selection?.startLineNumber ?? e.position?.lineNumber ?? 1;
      setCursorLine(line);
    });

    editor.onDidBlurEditorText(() => {
      setProjectFiles((prev: any[]) => {
        const current = prev.find((f) => f.id === activeFileId);
        if (current && current.content !== editorContent) {
          setLastSavedTime(new Date().toLocaleTimeString());
          return prev.map((f) => (f.id === activeFileId ? { ...f, content: editorContent } : f));
        }
        return prev;
      });
    });
  };

  const forceSave = useCallback(() => {
    if (!activeFileId) return;
    setProjectFiles((prev: any[]) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: editorContent } : f)),
    );
    markFileDirty(activeFileId);
    setLastSavedTime(new Date().toLocaleTimeString());
    try {
      const fileName = projectFiles.find((f: any) => f.id === activeFileId)?.name ?? activeFileId;
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          fileId: activeFileId,
          fileName,
          content: editorContent,
          ts: Date.now(),
          sessionId: SESSION_ID,
        }),
      );
    } catch {}
  }, [activeFileId, editorContent, projectFiles, markFileDirty]);

  const saveToFile = useCallback(async () => {
    if (!activeFileId) return;
    const fileName = projectFiles.find((f: any) => f.id === activeFileId)?.name ?? 'file.txt';
    const content = editorContent;

    if ('showSaveFilePicker' in window) {
      try {
        const ext = fileName.includes('.') ? fileName.split('.').pop()! : 'txt';
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'File', accept: { 'text/plain': [`.${ext}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        setLastSavedTime(new Date().toLocaleTimeString());
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setLastSavedTime(new Date().toLocaleTimeString());
  }, [activeFileId, editorContent, projectFiles]);

  return {
    editorContent,
    setEditorContent,
    debouncedEditorContent,
    editorMode,
    setEditorMode,
    isRunningCode,
    setIsRunningCode,
    isLivePreviewEnabled,
    setIsLivePreviewEnabled,
    isPairProgrammerActive,
    setIsPairProgrammerActive,
    isMobileFileTreeOpen,
    setIsMobileFileTreeOpen,
    isScanningCode,
    setIsScanningCode,
    scanResults,
    setScanResults,
    editorAssistantInput,
    setEditorAssistantInput,
    editorAssistantMessages,
    setEditorAssistantMessages,
    isEditorAssistantOpen,
    setIsEditorAssistantOpen,
    cursorLine,
    setCursorLine,
    contextMenu,
    setContextMenu,
    lastSavedTime,
    setLastSavedTime,
    isInspectorActive,
    setIsInspectorActive,
    inspectedElement,
    setInspectedElement,
    previewContainerRef,
    inspectedElementRef,
    monacoEditorRef,
    handleEditorDidMount,
    forceSave,
    saveToFile,
  };
}
