import React from 'react';
import { HardDrive, Upload, Database, FileText, FileCode, Trash2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface StorageFile {
  id: number;
  name: string;
  size: string;
  type: string;
  date: string;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface StoragePanelProps {
  storageFiles: StorageFile[];
  setStorageFiles: React.Dispatch<React.SetStateAction<StorageFile[]>>;
  handleStorageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export const StoragePanel: React.FC<StoragePanelProps> = ({
  storageFiles,
  setStorageFiles,
  handleStorageUpload,
}) => {
  return (
    <div className="h-full p-4 md:p-10 flex flex-col gap-6 md:gap-10 animate-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar">
      <div className="flex-1 bg-[#0d0404] rounded-[30px] md:rounded-[50px] border border-red-900/30 p-6 md:p-12 flex flex-col space-y-6 md:space-y-10 shadow-2xl relative overflow-hidden shrink-0">
        <div className="absolute -top-24 -right-24 w-64 h-64 md:w-96 md:h-96 bg-red-600/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-red-900/20 pb-6 md:pb-8 relative z-10 gap-4">
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-black text-red-100 flex items-center gap-3 md:gap-5 uppercase tracking-tighter">
              <HardDrive className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
              Neural Data Core
            </h3>
            <p className="text-[10px] md:text-sm text-red-900 font-bold tracking-widest uppercase">Hardware-backed document storage & database cluster</p>
          </div>
          <label className="px-6 md:px-8 py-3 md:py-4 bg-red-700 text-white rounded-xl md:rounded-2xl cursor-pointer hover:bg-red-600 transition-all flex items-center gap-3 md:gap-4 text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(185,28,28,0.3)] active:scale-95 w-full md:w-auto justify-center">
            <Upload className="w-4 h-4 md:w-5 md:h-5" />
            <span>Inject Document</span>
            <input type="file" className="hidden" multiple onChange={handleStorageUpload} accept=".pdf,.doc,.docx,.txt,.mht,.json,.csv" />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {storageFiles.length === 0 ? (
            <div className="col-span-full h-full flex flex-col items-center justify-center text-red-950 italic gap-8 opacity-20">
              <Database className="w-32 h-32" />
              <p className="uppercase font-black tracking-[0.5em] text-lg">Data Core Empty</p>
            </div>
          ) : (
            storageFiles.map((f, i) => (
              <div
                key={f.id}
                className="flex flex-col p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] group hover:bg-red-900/10 hover:border-red-600/40 transition-all relative overflow-hidden shadow-inner animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="p-4 bg-red-900/20 rounded-2xl shadow-xl text-red-500 group-hover:scale-110 transition-transform">
                    {f.type === 'pdf' ? <FileText className="w-6 h-6" /> : <FileCode className="w-6 h-6" />}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-red-800 font-black">{f.size}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-red-950 font-black mt-1">{f.date}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0 mb-8 relative z-10">
                  <p className="text-[17px] font-black text-red-100 truncate uppercase tracking-tight leading-tight">{f.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-red-900 font-black mt-3">Type: {f.type}</p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <button className="flex-1 py-4 bg-red-900/20 hover:bg-red-700 text-[11px] font-black uppercase text-red-700 hover:text-white rounded-2xl transition-all tracking-[0.2em]">Access</button>
                  <button onClick={() => setStorageFiles(prev => prev.filter(file => file.id !== f.id))} className="p-4 text-red-900 hover:text-red-500 transition-all bg-red-950/20 rounded-2xl"><Trash2 className="w-5 h-5" /></button>
                </div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-600/[0.02] blur-[40px] rounded-full pointer-events-none" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
