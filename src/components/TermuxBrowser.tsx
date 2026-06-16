import React, { useState, useCallback, useEffect } from 'react';
import {
  ChevronDown, Folder, FileCode, Plus, Trash2, Search, X,
  FolderPlus, Download, Upload, HardDrive,
} from 'lucide-react';
import type { FileNode } from './FileTree';

// ── Types ──────────────────────────────────────────────────────────────────

interface FsEntry { name: string; type: 'dir' | 'file'; path: string }
interface FsData  { path: string; parent: string; entries: FsEntry[] }

// ── Termux filesystem browser ──────────────────────────────────────────────

export const TermuxBrowser: React.FC<{
  onImport: (nodes: FileNode[]) => void;
  onClose: () => void;
}> = ({ onImport, onClose }) => {
  const [data,    setData]    = useState<FsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const browse = useCallback(async (p?: string) => {
    setLoading(true); setErr('');
    try {
      const url = p ? `./api/fs/browse?path=${encodeURIComponent(p)}` : './api/fs/browse';
      const r = await fetch(url);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? r.statusText); }
      setData(await r.json());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { browse(); }, [browse]);

  const importFile = useCallback(async (entry: FsEntry) => {
    if (entry.type === 'dir') { browse(entry.path); return; }
    try {
      const r = await fetch(`./api/fs/read?path=${encodeURIComponent(entry.path)}`);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error ?? r.statusText); }
      const { content } = await r.json();
      const ext = entry.name.split('.').pop() ?? 'text';
      const EXT_MAP: Record<string, string> = {
        py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
        jsx: 'javascript', html: 'html', css: 'css', rs: 'rust', cpp: 'cpp',
        c: 'c', json: 'json', md: 'markdown', sh: 'shell', yaml: 'yaml', yml: 'yaml',
      };
      onImport([{
        id: `fs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: entry.name,
        type: 'file',
        parentId: null,
        language: EXT_MAP[ext] ?? ext,
        content,
      }]);
    } catch (e: any) {
      setErr(e.message);
    }
  }, [browse, onImport]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, isFolder: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !data) return;
    setLoading(true); setErr('');
    try {
      for (const file of Array.from(files) as File[]) {
        const relativePath = (file as any).webkitRelativePath || file.name;
        const destPath = `${data.path}/${relativePath}`;

        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const base64 = dataUrl.split(',')[1] || '';
            resolve(base64);
          };
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        });

        const res = await fetch('./api/fs/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: destPath, content, encoding: 'base64' }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Upload failed for ${file.name}`);
        }
      }
      browse(data.path);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [data, browse]);

  const handleCreateDir = useCallback(async () => {
    if (!data) return;
    const name = prompt('Enter new folder name:');
    if (!name || !name.trim()) return;
    setLoading(true); setErr('');
    try {
      const res = await fetch('./api/fs/create-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `${data.path}/${name.trim()}` }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create folder');
      }
      browse(data.path);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [data, browse]);

  const handleDeleteEntry = useCallback(async (entryPath: string) => {
    if (!data) return;
    const name = entryPath.split('/').pop() || '';
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setLoading(true); setErr('');
    try {
      const res = await fetch('./api/fs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: entryPath }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }
      browse(data.path);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [data, browse]);

  return (
    <div className="mt-3 rounded-xl border border-accent-800/40 bg-accent-950/30 text-[10px] font-mono overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-accent-900/30 bg-black/30">
        <div className="flex items-center gap-2 text-accent-400 font-black uppercase tracking-widest text-[9px] min-w-0">
          <HardDrive className="w-3 h-3 shrink-0" />
          <span className="truncate" title={data?.path}>{data?.path ?? '…'}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {data && (
            <>
              <button onClick={handleCreateDir} className="p-1 hover:bg-accent-500/10 rounded-md transition-colors text-accent-500" title="Create Folder">
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <label className="p-1 hover:bg-accent-500/10 rounded-md cursor-pointer transition-colors text-accent-500" title="Upload Files">
                <Upload className="w-3.5 h-3.5" />
                <input type="file" className="hidden" multiple onChange={(e) => handleUpload(e, false)} />
              </label>
              <label className="p-1 hover:bg-accent-500/10 rounded-md cursor-pointer transition-colors text-accent-500" title="Upload Folder">
                <Folder className="w-3.5 h-3.5" />
                <input type="file" className="hidden" {...{ webkitdirectory: "", directory: "" } as any} multiple onChange={(e) => handleUpload(e, true)} />
              </label>
            </>
          )}
          <button onClick={onClose} className="text-accent-900 hover:text-accent-400 transition-colors ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="px-3 py-4 text-accent-900 text-center">Loading…</div>
      )}
      {err && (
        <div className="px-3 py-2 text-accent-500">{err}</div>
      )}

      {!loading && data && (
        <div className="max-h-52 overflow-y-auto custom-scrollbar">
          {data.path !== data.parent && (
            <button
              onClick={() => browse(data.parent)}
              className="w-full flex items-center gap-2 px-3 py-2 text-accent-800 hover:bg-accent-900/20 hover:text-accent-400 transition-colors"
            >
              <ChevronDown className="w-3 h-3 rotate-90 shrink-0" />
              <span>.. (up)</span>
            </button>
          )}
          {data.entries.length === 0 && (
            <div className="px-3 py-3 text-accent-900">Empty directory</div>
          )}
          {data.entries.map(e => (
            <div key={e.path} className="w-full flex items-center hover:bg-accent-900/20 transition-colors group">
              <button
                onClick={() => importFile(e)}
                title={e.type === 'file' ? `Import ${e.name}` : `Open ${e.name}`}
                className="flex-1 flex items-center gap-2 px-3 py-1.5 text-left min-w-0"
              >
                {e.type === 'dir'
                  ? <Folder className="w-3.5 h-3.5 text-accent-700 shrink-0" />
                  : <FileCode className="w-3.5 h-3.5 text-accent-900 shrink-0" />}
                <span className="flex-1 truncate text-accent-300">{e.name}</span>
                {e.type === 'file' && (
                  <Download className="w-3 h-3 text-accent-900 group-hover:text-accent-400 shrink-0" />
                )}
              </button>
              <button
                onClick={() => handleDeleteEntry(e.path)}
                title={`Delete ${e.name}`}
                className="p-1.5 text-accent-950 hover:text-accent-500 opacity-0 group-hover:opacity-100 transition-all mr-1 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};