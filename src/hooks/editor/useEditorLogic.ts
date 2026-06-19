import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebounce } from '../../lib/useDebounce';
import { DRAFT_KEY, SESSION_ID } from '../../lib/constants';

export function useEditorLogic(
  projectFiles: any[],
  setProjectFiles: any,
  activeFileId: string,
  setActiveFileId: any,
  markFileDirty: any,
  editorLanguage: string,
  setEditorLanguage: any,
  // editorContent / editorMode are owned by useEditorFileSystem (single source of
  // truth) and passed in here so the editor UI behaviour hooks read/write the same
  // state the file tree and project-wide scans use. Previously this hook kept its
  // own duplicate editorContent state, which desynced from projectFiles — edits
  // never reached projectFiles (so project scans saw stale/empty content) and
  // handleFileSwitch saved a stale value on top of the active file.
  editorContent: string,
  setEditorContent: any,
  editorMode: 'code' | 'preview' | 'debug' | 'git' | 'settings',
  setEditorMode: any,
  setEditorOutput: any,
  gitRepo: any,
  setGitRepo: any,
) {
  const debouncedEditorContent = useDebounce(editorContent, 150);
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
  // Guards the external-sync effect below against reacting to our own debounced
  // write-back (which would clobber in-flight typing).
  const selfWriteRef = useRef(false);

  // Mirror editorContent into projectFiles (the single source of truth for
  // project-wide scans, the WebContainer VFS, swarm, git, etc.) on a 150ms debounce
  // — i.e. when typing pauses, not on every keystroke. This is what makes a loaded
  // repo "recognized as a project": buildProjectContext reads projectFiles, so it
  // now sees real content instead of a stale/empty snapshot. Debouncing avoids
  // re-mounting the WebContainer on every keystroke.
  useEffect(() => {
    if (!activeFileId) return;
    setProjectFiles((prev: any[]) => {
      const file = prev.find((f) => f.id === activeFileId);
      if (!file || file.content === debouncedEditorContent) return prev;
      selfWriteRef.current = true;
      return prev.map((f) =>
        f.id === activeFileId ? { ...f, content: debouncedEditorContent } : f,
      );
    });
  }, [debouncedEditorContent, activeFileId, setProjectFiles]);

  // Load EXTERNAL projectFiles changes (file switch, git pull, swarm apply,
  // refactor-apply that write directly to projectFiles) into the editor. The
  // selfWriteRef guard skips the change when it originated from our own debounced
  // write-back above, so this never clobbers in-flight typing. editorContent is
  // intentionally NOT a dependency so typing itself doesn't trigger a revert.
  useEffect(() => {
    if (selfWriteRef.current) {
      selfWriteRef.current = false;
      return;
    }
    const file = projectFiles.find((f) => f.id === activeFileId);
    if (file && file.content !== undefined && file.content !== editorContent) {
      setEditorContent(file.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFileId, projectFiles, setEditorContent]);

  // Auto-switch HTML files to preview mode and non-HTML files out of preview
  useEffect(() => {
    if (editorLanguage === 'html') {
      setEditorMode('preview');
    } else {
      setEditorMode((prev: any) => (prev === 'preview' ? 'code' : prev));
    }
  }, [editorLanguage, setEditorMode]);

  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;

    editor.onDidChangeCursorSelection((e: any) => {
      const line = e.selection?.startLineNumber ?? e.position?.lineNumber ?? 1;
      setCursorLine(line);
    });

    // NOTE: a previous onDidBlurEditorText handler here closed over `editorContent`
    // captured at mount time (Monaco's onMount fires once), so it held a stale
    // value — on blur it could overwrite the active file's content with an
    // empty/stale string. Live content sync now happens via the onChange wrapper
    // in App.tsx (writes to projectFiles + markFileDirty), so the blur handler is
    // no longer needed and has been removed to stop it destroying edits.
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
  }, [activeFileId, editorContent, projectFiles, markFileDirty, setProjectFiles]);

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
