import { useState, useCallback, useRef } from 'react';
import { saveFileContents, deleteFileContent } from '../../services/fileStore';

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  language?: string;
  content?: string;
  isOpen?: boolean;
}

export function useEditorFileSystem(
  phi: any,
  gitRepo: any,
  setGitRepo: any,
  setEditorOutput: any,
  setTerminalOutput: any,
  setTermuxFiles: any,
  setStorageFiles: any,
) {
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([
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
        '<div class="p-8 bg-accent-950/20 rounded-3xl border border-accent-500/30">\n  <h1 class="text-2xl font-black text-accent-500 uppercase">Neural Interface</h1>\n  <p class="text-accent-100/60 mt-4">Real-time UI component rendering via Crimson Engine.</p>\n  <button class="mt-8 px-6 py-3 bg-accent-700 text-white rounded-xl uppercase font-black text-xs tracking-widest">Activate Core</button>\n</div>',
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
    projectFiles.find((f) => f.id === 'brain.py')?.content ?? '',
  );
  const [editorLanguage, setEditorLanguage] = useState('python');
  const [editorMode, setEditorMode] = useState<'code' | 'preview' | 'debug' | 'git' | 'settings'>(
    'code',
  );

  const [creatingInId, setCreatingInId] = useState<{
    parentId: string | null;
    type: 'file' | 'folder';
  } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const dirtyIdsRef = useRef<Set<string>>(new Set());
  const idleHandleRef = useRef<number | null>(null);

  const scheduleDirtyFlush = useCallback(
    (files: ProjectFile[]) => {
      if (idleHandleRef.current !== null) return;
      const flush = () => {
        idleHandleRef.current = null;
        const ids = Array.from(dirtyIdsRef.current);
        if (ids.length === 0) return;

        dirtyIdsRef.current.clear();

        const toWrite = files
          .filter((f) => f.type === 'file' && ids.includes(f.id))
          .map((f) => ({ id: f.id, content: f.content ?? '' }));

        if (toWrite.length === 0) return;
        phi.beginTx();
        saveFileContents(toWrite)
          .then(() => phi.commitTx())
          .catch((err) => {
            phi.rollbackTx();
            console.warn('[IdleFlush]', err);
          });
      };

      if (typeof requestIdleCallback !== 'undefined') {
        idleHandleRef.current = requestIdleCallback(flush, { timeout: 2000 });
      } else {
        idleHandleRef.current = setTimeout(flush, 2000) as unknown as number;
      }
    },
    [phi],
  );

  const markFileDirty = useCallback(
    (id: string) => {
      dirtyIdsRef.current.add(id);
      scheduleDirtyFlush(projectFiles);
    },
    [projectFiles, scheduleDirtyFlush],
  );

  const handleFileSwitch = useCallback(
    (fileId: string) => {
      setProjectFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, content: editorContent } : f)),
      );

      const file = projectFiles.find((f) => f.id === fileId);
      if (file && file.type === 'file') {
        setActiveFileId(fileId);
        setEditorContent(file.content || '');
        setEditorLanguage(file.language || 'text');
        setEditorMode(file.language === 'html' ? 'preview' : 'code');
      }
    },
    [activeFileId, editorContent, projectFiles],
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: any[] = [];
    const folderCache: Record<string, string> = {};

    const getOrCreateFolder = (path: string, parentId: string | null): string => {
      const fullPath = parentId ? `${parentId}/${path}` : path;
      if (folderCache[fullPath]) return folderCache[fullPath];

      const existingFolder = projectFiles.find(
        (f) => f.name === path && f.parentId === parentId && f.type === 'folder',
      );
      if (existingFolder) {
        folderCache[fullPath] = existingFolder.id;
        return existingFolder.id;
      }

      const batchFolder = newFiles.find(
        (f) => f.name === path && f.parentId === parentId && f.type === 'folder',
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
          reader.onload = (event) => resolve((event.target?.result as string) ?? '');
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsText(file);
        });

        const rawExt = file.name.split('.').pop() || 'text';
        const extLangMap: Record<string, string> = {
          py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
          jsx: 'javascript', html: 'html', css: 'css', rs: 'rust', go: 'go',
          java: 'java', cpp: 'cpp', cs: 'csharp', php: 'php', rb: 'ruby',
          json: 'json', md: 'markdown', yaml: 'yaml', yml: 'yaml', sh: 'shell',
          txt: 'text',
        };
        const extension = extLangMap[rawExt] || rawExt;
        const relativePath = (file as any).webkitRelativePath || file.name;
        const pathParts = relativePath.split('/');

        let currentParentId: string | null = null;
        if (pathParts.length > 1) {
          for (let i = 0; i < pathParts.length - 1; i++) {
            currentParentId = getOrCreateFolder(pathParts[i], currentParentId);
          }
        }

        const newFile = {
          id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: 'file' as const,
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
      setEditorOutput((prev: string) => prev + `[SYSTEM] Uploaded ${newFiles.length} files.\n`);

      const LANG_MAP: Record<string, string> = {
        py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
        jsx: 'javascript', html: 'html', css: 'css', rs: 'rust', go: 'go',
        java: 'java', cpp: 'cpp', cs: 'csharp', php: 'php', rb: 'ruby',
        json: 'json', md: 'markdown', yaml: 'yaml', yml: 'yaml', sh: 'shell',
        txt: 'text',
      };
      const MAIN_ENTRY_PRIORITY = [
        'main.py', 'app.py', 'index.js', 'app.js', 'main.js',
        'index.ts', 'app.ts', 'main.ts', 'App.tsx', 'index.tsx',
        'main.tsx', 'index.html', 'main.rs', 'main.go', 'main.java',
        'Program.cs', 'main.cpp', 'index.php',
      ];
      const uploadedFiles = newFiles.filter((f) => f.type === 'file');
      const mainFile =
        MAIN_ENTRY_PRIORITY.map((name) => uploadedFiles.find((f) => f.name === name)).find(
          Boolean,
        ) || uploadedFiles[0];

      if (mainFile) {
        const ext = mainFile.name.split('.').pop() || '';
        const lang = LANG_MAP[ext] || ext || 'text';
        setActiveFileId(mainFile.id);
        setEditorContent(mainFile.content || '');
        setEditorLanguage(lang);
        setEditorMode(lang === 'html' ? 'preview' : 'code');
      }
    }
  };

  const handleStorageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
      type: file.name.split('.').pop() || 'unknown',
      date: new Date().toISOString().split('T')[0],
    }));
    setStorageFiles((prev: any[]) => [...prev, ...newFiles]);
  };

  const handleTermuxFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const news = Array.from(files).map(
        (f) =>
          ({
            name: f.name,
            size: (f.size / (1024 * 1024)).toFixed(1) + 'MB',
            type: f.name.split('.').pop() ?? 'unknown',
            category:
              f.name.endsWith('.safetensors') || f.name.endsWith('.ckpt') ? 'model' : 'asset',
          }) as any,
      );
      setTermuxFiles((prev: any[]) => [...prev, ...news]);
      setTerminalOutput((prev: any[]) => [
        ...prev,
        `[STASH] Injected ${news.length} datasets into the crimson stash.`,
      ]);
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
      prev.map((f) => (f.id === renamingId ? { ...f, name: newName.trim() } : f)),
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
        type: 'file' as const,
        parentId: creatingInId.parentId,
        language: langMap[ext || ''] || 'text',
        content: '',
      };
      setProjectFiles((prev) => [...prev, newFile]);
      if (gitRepo.initialized) {
        setGitRepo((prev: any) => ({ ...prev, modified: [...prev.modified, id] }));
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
    toDelete.forEach((fid) => deleteFileContent(fid).catch(console.warn));

    if (gitRepo.initialized) {
      setGitRepo((prev: any) => ({
        ...prev,
        staged: prev.staged.filter((fid: string) => !toDelete.has(fid)),
        modified: prev.modified.filter((fid: string) => !toDelete.has(fid)),
      }));
    }
    if (activeFileId === id) setActiveFileId('');
  };

  const toggleFolder = (id: string) => {
    setProjectFiles((prev) => prev.map((f) => (f.id === id ? { ...f, isOpen: !f.isOpen } : f)));
  };

  return {
    projectFiles,
    setProjectFiles,
    activeFileId,
    setActiveFileId,
    editorContent,
    setEditorContent,
    editorLanguage,
    setEditorLanguage,
    editorMode,
    setEditorMode,
    creatingInId,
    setCreatingInId,
    renamingId,
    setRenamingId,
    newName,
    setNewName,
    deleteConfirmId,
    setDeleteConfirmId,
    markFileDirty,
    handleFileSwitch,
    handleFileUpload,
    handleStorageUpload,
    handleTermuxFileUpload,
    createFile,
    createFolder,
    renameItem,
    handleConfirmRename,
    handleConfirmCreate,
    deleteItem,
    confirmDeleteItem,
    toggleFolder,
  };
}
