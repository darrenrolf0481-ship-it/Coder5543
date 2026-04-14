import React from 'react';
import { 
  HardDrive, 
  Upload, 
  Database, 
  Trash2, 
  FileText, 
  FileCode,
  Search
} from 'lucide-react';
import { StorageFile } from '../types';

interface StorageTabProps {
  storageFiles: StorageFile[];
  handleStorageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setStorageFiles: (files: StorageFile[]) => void;
}

const StorageTab: React.FC<StorageTabProps> = ({
  storageFiles,
  handleStorageUpload,
  setStorageFiles
}) => {
  return (
    <div className="h-full flex flex-col p-4 md:p-8 overflow-hidden">
      <div className="flex-1 bg-[#0d0404]/80 rounded-[30px] md:rounded-[40px] border border-red-900/30 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-red-900/30 bg-[#0a0202]/80 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-red-900/20 rounded-2xl border border-red-500/30">
              <HardDrive className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-red-100 uppercase tracking-tighter italic">Data Core</h2>
              <p className="text-[10px] text-red-900 font-black uppercase tracking-widest">Offline Neural Knowledge Base</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-900" />
              <input 
                placeholder="Search vectors..." 
                className="bg-red-950/10 border border-red-900/20 rounded-xl pl-12 pr-6 py-3 text-[11px] text-red-100 outline-none focus:border-red-500/50 w-64"
              />
            </div>
            <label className="px-8 py-3 bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 cursor-pointer hover:bg-red-600 transition-all shadow-lg">
              <Upload className="w-4 h-4" /> Ingest Data
              <input type="file" className="hidden" multiple onChange={handleStorageUpload} />
            </label>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {storageFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {storageFiles.map((f) => (
                <div key={f.id} className="group bg-red-950/5 border border-red-900/20 p-6 rounded-[30px] hover:border-red-500/30 transition-all relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(153,27,27,0.05),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between relative z-10">
                    <div className="p-4 bg-red-900/10 rounded-2xl mb-4">
                      {f.type === 'pdf' ? <FileText className="w-6 h-6 text-red-500" /> : <FileCode className="w-6 h-6 text-red-800" />}
                    </div>
                    <button 
                      onClick={() => setStorageFiles(storageFiles.filter(file => file.id !== f.id))}
                      className="p-2 text-red-900 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-black text-red-100 text-sm truncate uppercase tracking-tight">{f.name}</h4>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[9px] text-red-900 font-black uppercase tracking-widest">{f.type} Vector</span>
                      <span className="text-[9px] text-red-100/40 font-mono">{f.size}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-red-900/10 flex items-center justify-between text-[8px] font-black text-red-950 uppercase tracking-[0.2em]">
                      <span>Indexed: {f.date}</span>
                      <span className="text-emerald-900">Synchronized</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20 py-20">
              <Database className="w-24 h-24" />
              <div className="text-center space-y-2">
                <p className="text-[12px] font-black uppercase tracking-[0.5em]">Data Core Empty</p>
                <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Neural Ingestion</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-[#0a0202]/80 border-t border-red-900/30 flex justify-between items-center px-10 shrink-0">
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">Core Status: Optimized</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">Memory Occupancy: {(storageFiles.length * 4.2).toFixed(1)}%</span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-red-950 uppercase">{storageFiles.length} Nodes Active</span>
        </div>
      </div>
    </div>
  );
};

export default StorageTab;
