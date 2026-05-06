import React, { useState, useCallback, useEffect } from 'react';
import {
  Network, Database, HardDrive, FileCode, FolderOpen,
  Folder, File, ChevronRight, Download, Plus, Trash2,
  RefreshCw, ArrowLeft, AlertCircle,
} from 'lucide-react';

interface TermuxFile { name: string; size: string; type: string; category: 'model' | 'asset' | 'config'; }
interface FsEntry    { name: string; type: 'dir' | 'file'; path: string; }
interface NodeBridgePanelProps {
  termuxFiles: TermuxFile[];
  setTermuxFiles: React.Dispatch<React.SetStateAction<TermuxFile[]>>;
  setTermuxStatus: (s: 'disconnected' | 'connecting' | 'connected') => void;
  handleTermuxFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportFile?: (name: string, content: string, path: string) => void;
}

const TERMUX_HOME = '/data/data/com.termux/files/home';
const TEXT_EXTS   = new Set(['py','js','ts','tsx','jsx','rs','go','cpp','c','h','md','txt','json','yaml','yml','toml','sh','css','html','xml','csv','java','kt','swift','rb']);
const MODEL_EXTS  = new Set(['safetensors','ckpt','pt','bin','gguf']);
const ext = (n: string) => n.split('.').pop()?.toLowerCase() ?? '';

function useFsBrowser() {
  const [cwd,      setCwd]      = useState(TERMUX_HOME);
  const [entries,  setEntries]  = useState<FsEntry[]>([]);
  const [parent,   setParent]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [importing,setImporting]= useState<string | null>(null);

  const browse = useCallback(async (path: string) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`/api/fs/browse?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Browse failed');
      setCwd(data.path); setParent(data.parent); setEntries(data.entries);
    } catch (e: any) {
      setError(e.message ?? 'Cannot reach server');
    } finally { setLoading(false); }
  }, []);

  const readFile = useCallback(async (path: string): Promise<string | null> => {
    setImporting(path);
    try {
      const res  = await fetch(`/api/fs/read?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.content as string;
    } catch { return null; }
    finally { setImporting(null); }
  }, []);

  useEffect(() => { browse(TERMUX_HOME); }, [browse]);
  return { cwd, entries, parent, loading, error, importing, browse, readFile };
}

export const NodeBridgePanel: React.FC<NodeBridgePanelProps> = ({
  termuxFiles, setTermuxFiles, handleTermuxFileUpload, onImportFile,
}) => {
  const fs   = useFsBrowser();
  const [view, setView] = useState<'browser' | 'stash'>('browser');

  return (
    <div className="h-full p-4 md:p-8 flex flex-col gap-4 overflow-hidden animate-in zoom-in-95 duration-500">

      {/* Tab bar */}
      <div className="flex gap-2 shrink-0">
        {(['browser','stash'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-red-700 text-white shadow-lg' : 'bg-red-950/20 text-red-700 hover:bg-red-900/20'}`}
          >
            {v === 'browser' ? <><FolderOpen className="w-3 h-3 inline mr-1.5"/>File Browser</> : <><Database className="w-3 h-3 inline mr-1.5"/>Model Stash {termuxFiles.length > 0 && `(${termuxFiles.length})`}</>}
          </button>
        ))}
      </div>

      {view === 'browser' ? (
        <div className="flex-1 bg-[#0d0404] rounded-[24px] border border-red-900/30 flex flex-col overflow-hidden min-h-0 shadow-2xl">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-red-900/20 bg-black/30 shrink-0">
            <button onClick={() => fs.browse(fs.parent)} disabled={fs.loading || fs.cwd === TERMUX_HOME} className="p-1.5 text-red-700 hover:text-red-400 disabled:opacity-30 transition-all"><ArrowLeft className="w-4 h-4"/></button>
            <button onClick={() => fs.browse(fs.cwd)} disabled={fs.loading} className="p-1.5 text-red-700 hover:text-red-400 disabled:opacity-30 transition-all"><RefreshCw className={`w-4 h-4 ${fs.loading ? 'animate-spin' : ''}`}/></button>
            <span className="flex-1 text-[10px] font-mono text-red-800 truncate px-1">{fs.cwd}</span>
            <button onClick={() => fs.browse(TERMUX_HOME)} className="text-[9px] font-black uppercase tracking-widest text-red-900 hover:text-red-500 transition-all px-2">~</button>
          </div>

          {fs.error && (
            <div className="mx-4 mt-3 p-3 bg-red-900/20 border border-red-700/30 rounded-xl flex items-center gap-2 text-[11px] text-red-400 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              {fs.error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
            {fs.loading && !fs.entries.length ? (
              <p className="text-center text-red-900 text-[11px] font-mono py-12 animate-pulse">Scanning...</p>
            ) : fs.entries.length === 0 && !fs.error ? (
              <p className="text-center text-red-950 text-[11px] font-mono py-12">Empty directory</p>
            ) : fs.entries.map(entry => {
              const canImport = entry.type === 'file' && TEXT_EXTS.has(ext(entry.name));
              const isImporting = fs.importing === entry.path;
              return (
                <div key={entry.path}
                  onClick={() => entry.type === 'dir' && fs.browse(entry.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl group transition-all ${entry.type === 'dir' ? 'cursor-pointer hover:bg-red-950/30' : canImport ? 'hover:bg-red-900/10' : 'opacity-35'}`}
                >
                  {entry.type === 'dir'
                    ? <Folder className="w-4 h-4 text-red-600 shrink-0"/>
                    : MODEL_EXTS.has(ext(entry.name))
                      ? <HardDrive className="w-4 h-4 text-red-800 shrink-0"/>
                      : <File className="w-4 h-4 text-red-700 shrink-0"/>}

                  <span className="flex-1 text-[12px] font-mono text-red-100 truncate">{entry.name}</span>
                  <span className="text-[9px] text-red-900 font-mono uppercase mr-1">{ext(entry.name)}</span>

                  {entry.type === 'dir'
                    ? <ChevronRight className="w-3.5 h-3.5 text-red-900 group-hover:text-red-400 transition-all shrink-0"/>
                    : canImport && (
                      <button
                        onClick={e => { e.stopPropagation(); fs.readFile(entry.path).then(c => c !== null && onImportFile?.(entry.name, c, entry.path)); }}
                        disabled={isImporting}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-red-700 hover:bg-red-600 rounded-lg text-[9px] font-black uppercase text-white transition-all active:scale-95 disabled:opacity-50 shrink-0"
                      >
                        {isImporting ? <RefreshCw className="w-2.5 h-2.5 animate-spin"/> : <Download className="w-2.5 h-2.5"/>}
                        Import
                      </button>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-[#0d0404] rounded-[24px] border border-red-900/30 flex flex-col overflow-hidden min-h-0 shadow-2xl">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-red-900/20 bg-black/30 shrink-0">
            <div className="flex items-center gap-2"><Network className="w-4 h-4 text-red-600"/><span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Model Stash</span></div>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-red-800/10 border border-red-700/30 rounded-xl cursor-pointer hover:bg-red-800/20 text-red-500 text-[9px] font-black uppercase tracking-widest transition-all">
              <Plus className="w-3 h-3"/> Upload <input type="file" className="hidden" multiple onChange={handleTermuxFileUpload}/>
            </label>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {termuxFiles.length === 0
              ? <div className="col-span-2 flex flex-col items-center justify-center h-28 text-red-950 opacity-30 gap-2"><Database className="w-10 h-10"/><p className="text-[9px] font-black uppercase tracking-widest">Stash Empty</p></div>
              : termuxFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 bg-red-950/5 border border-red-900/20 rounded-2xl group hover:border-red-600/40 transition-all">
                  <div className="p-2 bg-red-900/20 rounded-xl">{f.category === 'model' ? <HardDrive className="w-4 h-4 text-red-500"/> : <FileCode className="w-4 h-4 text-red-800"/>}</div>
                  <div className="flex-1 min-w-0"><p className="text-[11px] font-black text-red-100 truncate">{f.name}</p><p className="text-[9px] text-red-800 font-bold">{f.size}</p></div>
                  <button onClick={() => setTermuxFiles(prev => prev.filter((_,idx) => idx !== i))} className="p-1.5 text-red-900 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
