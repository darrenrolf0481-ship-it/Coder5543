import React, { useState, useCallback, useMemo, useRef, useEffect, memo, CSSProperties } from 'react';
import { List } from 'react-window';
import {
  ChevronDown, Folder, FolderOpen, FileCode, Edit2, Check,
  GitBranch, Plus, Trash2, Search, X, FolderPlus, FilePlus,
  Copy, Archive, MoreVertical,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  language?: string;
  isOpen?: boolean;
}

interface GitRepo {
  initialized: boolean;
  modified: string[];
  staged: string[];
  [key: string]: any;
}

interface FileTreeProps {
  files: FileNode[];
  activeFileId: string | null;
  gitRepo: GitRepo;
  onFilesChange: (files: FileNode[]) => void;
  onFileSelect: (fileId: string, file: FileNode) => void;
  onProjectCreate?: (name: string) => void;
}

// A single visible row produced by the flatten pass.
interface FlatRow {
  node: FileNode;
  depth: number;
  isExpanded: boolean;
}

// Data bundle passed to every virtualised row via itemData.
interface RowData {
  rows: FlatRow[];
  activeFileId: string | null;
  gitRepo: GitRepo;
  renamingId: string | null;
  newName: string;
  dragOverId: string | null;
  creating: { parentId: string | null; type: 'file' | 'folder' } | null;
  setNewName: (v: string) => void;
  toggleFolder: (id: string) => void;
  onFileSelect: (id: string, node: FileNode) => void;
  startRename: (id: string) => void;
  confirmRename: () => void;
  setRenamingId: (id: string | null) => void;
  startCreate: (parentId: string | null, type: 'file' | 'folder') => void;
  confirmCreate: () => void;
  setCreating: (v: null) => void;
  deleteItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  setDragOverId: (id: string | null) => void;
  moveItem: (dragId: string, dropId: string) => void;
  setCtxMenu: (v: CtxMenu | null) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const EXT_LANG: Record<string, string> = {
  py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
  jsx: 'javascript', html: 'html', css: 'css', rs: 'rust', cpp: 'cpp',
  c: 'c', json: 'json', md: 'markdown', sh: 'shell', yaml: 'yaml', yml: 'yaml',
};

function langFromName(name: string) {
  const ext = name.split('.').pop() ?? '';
  return EXT_LANG[ext] ?? 'text';
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function subtree(id: string, files: FileNode[]): Set<string> {
  const result = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    files.forEach(f => {
      if (f.parentId && result.has(f.parentId) && !result.has(f.id)) {
        result.add(f.id); changed = true;
      }
    });
  }
  return result;
}

// ── Context menu ────────────────────────────────────────────────────────────

interface CtxMenu { x: number; y: number; itemId: string | null }

// ── Memoised tree row ──────────────────────────────────────────────────────

const ROW_HEIGHT = 36; // px

// react-window v2 passes { ariaAttributes, index, style } + spread rowProps
type TreeRowProps = RowData & { ariaAttributes: Record<string, unknown>; index: number; style: CSSProperties };

const TreeRow = memo((props: TreeRowProps) => {
  const {
    ariaAttributes: _aria, // consumed by the list, not used in rendering
    index, style,
    rows, activeFileId, gitRepo,
    renamingId, newName, dragOverId, creating,
    setNewName, toggleFolder, onFileSelect,
    startRename, confirmRename, setRenamingId,
    startCreate, confirmCreate, setCreating,
    deleteItem, duplicateItem,
    setDragOverId, moveItem, setCtxMenu,
  } = props;

  // Extra slot appended when creating at root level
  if (index >= rows.length) {
    return (
      <div style={style}
        className="flex items-center gap-2 rounded-xl border border-dashed border-red-500/40 bg-red-950/20 text-[10px] font-mono px-3"
      >
        {creating?.type === 'folder'
          ? <FolderPlus className="w-3.5 h-3.5 text-red-400 shrink-0" />
          : <FilePlus   className="w-3.5 h-3.5 text-red-400 shrink-0" />}
        <input
          autoFocus
          placeholder={creating?.type === 'folder' ? 'folder-name' : 'file.ts'}
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter')  confirmCreate();
            if (e.key === 'Escape') { setCreating(null); setNewName(''); }
          }}
          onBlur={confirmCreate}
          className="flex-1 bg-transparent border-b border-red-500/50 text-red-100 outline-none"
        />
      </div>
    );
  }

  const { node, depth, isExpanded } = rows[index];
  const isActive   = activeFileId === node.id;
  const isModified = gitRepo.modified.includes(node.id);
  const isStaged   = gitRepo.staged.includes(node.id);
  const isRenaming = renamingId === node.id;
  const isDragOver = dragOverId === node.id;

  // Inline create input immediately after a folder row
  const isCreatingHere =
    creating && creating.parentId === node.id && node.type === 'folder' && isExpanded;

  return (
    <div style={style} className="flex flex-col">
      {/* Row */}
      <div
        draggable
        onDragStart={e => e.dataTransfer.setData('text/plain', node.id)}
        onDragOver={e => { if (node.type === 'folder') { e.preventDefault(); setDragOverId(node.id); } }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={e => { e.preventDefault(); moveItem(e.dataTransfer.getData('text/plain'), node.id); }}
        onClick={() => node.type === 'folder' ? toggleFolder(node.id) : onFileSelect(node.id, node)}
        onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, itemId: node.id }); }}
        style={{ paddingLeft: `${depth * 14 + 8}px`, height: ROW_HEIGHT }}
        className={[
          'group flex items-center gap-2 pr-2 rounded-xl text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all duration-150 select-none',
          isActive
            ? 'bg-red-700 text-white border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
            : isDragOver
              ? 'bg-red-900/50 border border-red-500/60 text-red-200'
              : node.type === 'folder'
                ? isExpanded
                  ? 'bg-red-950/30 text-red-300 border border-red-900/30 hover:bg-red-900/40'
                  : 'text-red-800 border border-transparent hover:bg-red-950/20 hover:text-red-400'
                : [
                    'text-red-900 border border-transparent hover:bg-red-950/20 hover:text-red-500',
                    isModified && 'border-l-2 border-l-orange-500',
                    isStaged   && 'border-l-2 border-l-green-500',
                  ].filter(Boolean).join(' '),
        ].join(' ')}
      >
        {node.type === 'folder' ? (
          <div className="flex items-center gap-1 shrink-0">
            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
            {isExpanded ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
          </div>
        ) : (
          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isModified ? 'text-orange-400' : isStaged ? 'text-green-400' : ''}`} />
        )}

        {isRenaming ? (
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  confirmRename();
              if (e.key === 'Escape') { setRenamingId(null); setNewName(''); }
            }}
            onBlur={confirmRename}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-red-950/60 border border-red-500/60 rounded px-2 py-0.5 text-white outline-none font-mono text-[10px] normal-case tracking-normal"
          />
        ) : (
          <span className="flex-1 truncate flex items-center gap-1.5">
            {node.name}
            {isModified && <Edit2  className="w-2.5 h-2.5 text-orange-400 shrink-0" />}
            {isStaged   && <Check  className="w-2.5 h-2.5 text-green-400  shrink-0" />}
            {!isModified && !isStaged && node.type === 'file' &&
              <GitBranch className="w-2.5 h-2.5 text-red-900/40 shrink-0" />}
          </span>
        )}

        {!isRenaming && (
          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
            {node.type === 'folder' && (
              <>
                <Btn title="New File"   onClick={e => { e.stopPropagation(); startCreate(node.id, 'file');   }}><FilePlus   className="w-3.5 h-3.5" /></Btn>
                <Btn title="New Folder" onClick={e => { e.stopPropagation(); startCreate(node.id, 'folder'); }}><FolderPlus className="w-3.5 h-3.5" /></Btn>
              </>
            )}
            {node.type === 'file' && (
              <Btn title="Duplicate" onClick={e => { e.stopPropagation(); duplicateItem(node.id); }}><Copy className="w-3 h-3" /></Btn>
            )}
            <Btn title="Rename"  onClick={e => { e.stopPropagation(); startRename(node.id);  }}><Edit2  className="w-3 h-3" /></Btn>
            <Btn title="Delete" danger onClick={e => { e.stopPropagation(); deleteItem(node.id); }}><Trash2 className="w-3 h-3" /></Btn>
          </div>
        )}
      </div>

      {/* Inline create input rendered inside the folder row's div */}
      {isCreatingHere && (
        <div
          className="flex items-center gap-2 rounded-xl border border-dashed border-red-500/40 bg-red-950/20 text-[10px] font-mono"
          style={{ paddingLeft: `${(depth + 1) * 14 + 12}px`, paddingTop: 6, paddingBottom: 6, paddingRight: 8, height: ROW_HEIGHT }}
        >
          {creating!.type === 'folder'
            ? <FolderPlus className="w-3.5 h-3.5 text-red-400 shrink-0" />
            : <FilePlus   className="w-3.5 h-3.5 text-red-400 shrink-0" />}
          <input
            autoFocus
            placeholder={creating!.type === 'folder' ? 'folder-name' : 'file.ts'}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  confirmCreate();
              if (e.key === 'Escape') { setCreating(null); setNewName(''); }
            }}
            onBlur={confirmCreate}
            className="flex-1 bg-transparent border-b border-red-500/50 text-red-100 outline-none"
          />
        </div>
      )}
    </div>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export const FileTree: React.FC<FileTreeProps> = ({
  files, activeFileId, gitRepo, onFilesChange, onFileSelect, onProjectCreate,
}) => {
  const [search,        setSearch]        = useState('');
  const [renamingId,    setRenamingId]    = useState<string | null>(null);
  const [newName,       setNewName]       = useState('');
  const [creating,      setCreating]      = useState<{ parentId: string | null; type: 'file' | 'folder' } | null>(null);
  const [ctxMenu,       setCtxMenu]       = useState<CtxMenu | null>(null);
  const [dragOverId,    setDragOverId]    = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName,   setProjectName]   = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight,    setListHeight]    = useState(400);
  const ctxRef = useRef<HTMLDivElement>(null);

  // Measure container height so FixedSizeList fills available space
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      setListHeight(entries[0].contentRect.height);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (!ctxRef.current?.contains(e.target as Node)) setCtxMenu(null);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [ctxMenu]);

  // ── Flatten pass with proper deps ─────────────────────────────────────────
  // Step 1: build treeMap keyed by parentId (O(n) with search filter)
  const treeMap = useMemo(() => {
    const q = search.toLowerCase().trim();
    let visible = files;

    if (q) {
      const matches = files.filter(f => f.name.toLowerCase().includes(q));
      const keep = new Set<string>();
      matches.forEach(f => {
        let cur: FileNode | undefined = f;
        while (cur) {
          keep.add(cur.id);
          cur = files.find(p => p.id === cur!.parentId);
        }
      });
      visible = files.filter(f => keep.has(f.id));
    }

    const map = new Map<string | null, FileNode[]>();
    visible.forEach(f => {
      const pid = f.parentId ?? null;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(f);
    });
    map.forEach((items, k) =>
      map.set(k, [...items].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })),
    );
    return map;
  }, [files, search]);

  // Step 2: DFS flatten — only expands open folders; rebuilds only when
  // treeMap or any folder's isOpen flag changes.
  const flatRows = useMemo((): FlatRow[] => {
    const rows: FlatRow[] = [];
    const forceExpand = !!search.trim();

    function walk(parentId: string | null, depth: number) {
      const children = treeMap.get(parentId) ?? [];
      for (const node of children) {
        const isExpanded = node.type === 'folder' && (forceExpand || !!node.isOpen);
        rows.push({ node, depth, isExpanded });
        if (isExpanded) walk(node.id, depth + 1);
      }
    }
    walk(null, 0);
    return rows;
  }, [treeMap, search]);

  // ── File operations ───────────────────────────────────────────────────────

  const toggleFolder = useCallback((id: string) => {
    onFilesChange(files.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  }, [files, onFilesChange]);

  const startRename = useCallback((id: string) => {
    const f = files.find(f => f.id === id);
    if (!f) return;
    setRenamingId(id); setNewName(f.name); setCtxMenu(null);
  }, [files]);

  const confirmRename = useCallback(() => {
    if (!renamingId || !newName.trim()) { setRenamingId(null); setNewName(''); return; }
    onFilesChange(files.map(f => f.id === renamingId ? { ...f, name: newName.trim() } : f));
    setRenamingId(null); setNewName('');
  }, [renamingId, newName, files, onFilesChange]);

  const startCreate = useCallback((parentId: string | null, type: 'file' | 'folder') => {
    if (parentId) onFilesChange(files.map(f => f.id === parentId ? { ...f, isOpen: true } : f));
    setCreating({ parentId, type }); setNewName(''); setCtxMenu(null);
  }, [files, onFilesChange]);

  const confirmCreate = useCallback(() => {
    if (!creating || !newName.trim()) { setCreating(null); setNewName(''); return; }
    const id = `${creating.type}_${uid()}`;
    const node: FileNode = creating.type === 'file'
      ? { id, name: newName.trim(), type: 'file', parentId: creating.parentId, language: langFromName(newName.trim()), content: '' }
      : { id, name: newName.trim(), type: 'folder', parentId: creating.parentId, isOpen: true };
    onFilesChange([...files, node]);
    if (creating.type === 'file') onFileSelect(id, node);
    setCreating(null); setNewName('');
  }, [creating, newName, files, onFilesChange, onFileSelect]);

  const deleteItem = useCallback((id: string) => {
    setCtxMenu(null);
    onFilesChange(files.filter(f => !subtree(id, files).has(f.id)));
  }, [files, onFilesChange]);

  const duplicateItem = useCallback((id: string) => {
    setCtxMenu(null);
    const src = files.find(f => f.id === id);
    if (!src || src.type === 'folder') return;
    const newId = `file_${uid()}`;
    onFilesChange([...files, { ...src, id: newId, name: src.name.replace(/(\.[^.]+)?$/, '_copy$1') }]);
  }, [files, onFilesChange]);

  const moveItem = useCallback((dragId: string, dropId: string) => {
    if (dragId === dropId) return;
    const dragged = files.find(f => f.id === dragId);
    const target  = files.find(f => f.id === dropId);
    if (!dragged || !target || target.type !== 'folder') return;
    if (subtree(dragId, files).has(dropId)) return;
    setDragOverId(null);
    onFilesChange(files.map(f => f.id === dragId ? { ...f, parentId: dropId } : f));
  }, [files, onFilesChange]);

  const handleNewProject = useCallback(() => {
    if (!projectName.trim()) return;
    const name = projectName.trim();
    const rootId = `folder_${uid()}`;
    const mainId = `file_${uid()}`;
    const starter: FileNode[] = [
      { id: rootId, name, type: 'folder', parentId: null, isOpen: true },
      { id: mainId, name: 'main.py', type: 'file', parentId: rootId, language: 'python', content: `# ${name}\n` },
    ];
    onFilesChange(starter);
    onFileSelect(mainId, starter[1]);
    onProjectCreate?.(name);
    setShowNewProject(false); setProjectName('');
  }, [projectName, onFilesChange, onFileSelect, onProjectCreate]);

  // ── Stable itemData (only reconstructed when handlers or rows change) ─────
  const itemData = useMemo<RowData>(() => ({
    rows: flatRows, activeFileId, gitRepo,
    renamingId, newName, dragOverId, creating,
    setNewName, toggleFolder, onFileSelect,
    startRename, confirmRename, setRenamingId,
    startCreate, confirmCreate, setCreating,
    deleteItem, duplicateItem,
    setDragOverId, moveItem, setCtxMenu,
  }), [
    flatRows, activeFileId, gitRepo,
    renamingId, newName, dragOverId, creating,
    setNewName, toggleFolder, onFileSelect,
    startRename, confirmRename,
    startCreate, confirmCreate,
    deleteItem, duplicateItem,
    moveItem,
  ]);

  const ctxItem = ctxMenu ? files.find(f => f.id === ctxMenu.itemId) : null;

  return (
    <div className="flex flex-col h-full select-none" onClick={() => setCtxMenu(null)}>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 mb-3 shrink-0">
        <Btn title="New File at root"   onClick={() => startCreate(null, 'file')}  ><FilePlus   className="w-4 h-4" /></Btn>
        <Btn title="New Folder at root" onClick={() => startCreate(null, 'folder')}><FolderPlus className="w-4 h-4" /></Btn>
        <div className="flex-1" />
        <Btn title="New Project" onClick={() => setShowNewProject(v => !v)}>
          <Archive className="w-4 h-4" />
        </Btn>
      </div>

      {/* New project form */}
      {showNewProject && (
        <div className="mb-3 flex gap-2 items-center bg-red-950/30 border border-red-900/30 rounded-xl px-3 py-2">
          <input
            autoFocus placeholder="Project name..."
            value={projectName} onChange={e => setProjectName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  handleNewProject();
              if (e.key === 'Escape') { setShowNewProject(false); setProjectName(''); }
            }}
            className="flex-1 bg-transparent text-[10px] font-mono text-red-100 outline-none border-b border-red-500/40 normal-case tracking-normal"
          />
          <button onClick={handleNewProject}
            className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-white transition-colors px-2 py-1 rounded bg-red-900/40 hover:bg-red-700">
            Create
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-red-900/60 pointer-events-none" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search nodes..."
          className="w-full bg-red-950/20 border border-red-900/20 rounded-xl pl-8 pr-8 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-red-100 placeholder:text-red-900/40 outline-none focus:border-red-600/40 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-900/60 hover:text-red-400">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Virtualised tree */}
      <div ref={containerRef} className="flex-1 min-h-0">
        {flatRows.length === 0 && !creating ? (
          <div className="text-center py-8 text-red-900/40 text-[10px] font-black uppercase tracking-widest">
            No nodes — create one above
          </div>
        ) : (
          <List
            style={{ height: listHeight }}
            rowCount={flatRows.length + (creating && creating.parentId === null ? 1 : 0)}
            rowHeight={ROW_HEIGHT}
            rowComponent={TreeRow}
            rowProps={itemData}
            className="custom-scrollbar"
            overscanCount={5}
          />
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && ctxItem && (
        <div ref={ctxRef}
          style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 9999 }}
          className="bg-[#100202] border border-red-900/40 rounded-xl shadow-2xl py-1 min-w-[160px] text-[10px] font-black uppercase tracking-widest"
          onClick={e => e.stopPropagation()}
        >
          {ctxItem.type === 'folder' && (
            <>
              <CtxItem icon={<FilePlus   className="w-3.5 h-3.5" />} label="New File"   onClick={() => startCreate(ctxItem.id, 'file')} />
              <CtxItem icon={<FolderPlus className="w-3.5 h-3.5" />} label="New Folder" onClick={() => startCreate(ctxItem.id, 'folder')} />
              <div className="border-t border-red-900/30 my-1" />
            </>
          )}
          {ctxItem.type === 'file' && (
            <CtxItem icon={<Copy className="w-3.5 h-3.5" />} label="Duplicate" onClick={() => duplicateItem(ctxItem.id)} />
          )}
          <CtxItem icon={<Edit2  className="w-3.5 h-3.5" />} label="Rename" onClick={() => startRename(ctxItem.id)} />
          <div className="border-t border-red-900/30 my-1" />
          <CtxItem icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} label="Delete" danger onClick={() => deleteItem(ctxItem.id)} />
        </div>
      )}
    </div>
  );
};

// ── Small reusable bits ────────────────────────────────────────────────────

const Btn: React.FC<{
  title?: string; danger?: boolean; onClick: React.MouseEventHandler;
  children: React.ReactNode;
}> = ({ title, danger, onClick, children }) => (
  <button title={title} onClick={onClick}
    className={`p-1.5 rounded-lg transition-colors ${
      danger ? 'text-red-700 hover:text-red-400 hover:bg-red-900/20' : 'text-red-900/60 hover:text-red-300 hover:bg-red-950/40'
    }`}
  >
    {children}
  </button>
);

const CtxItem: React.FC<{
  icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void;
}> = ({ icon, label, danger, onClick }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors ${
      danger ? 'text-red-400 hover:bg-red-900/30' : 'text-red-300 hover:bg-red-950/40'
    }`}
  >
    {icon}{label}
  </button>
);
