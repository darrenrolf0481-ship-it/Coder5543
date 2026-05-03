import React from 'react';
import {
  Smartphone, Activity, Network, Database, HardDrive, FileCode, Plus, Trash2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface TermuxFile {
  name: string;
  size: string;
  type: string;
  category: 'model' | 'asset' | 'config';
}

// ── Props ──────────────────────────────────────────────────────────────────

interface NodeBridgePanelProps {
  termuxFiles: TermuxFile[];
  setTermuxFiles: React.Dispatch<React.SetStateAction<TermuxFile[]>>;
  setTermuxStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  handleTermuxFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export const NodeBridgePanel: React.FC<NodeBridgePanelProps> = ({
  termuxFiles,
  setTermuxFiles,
  setTermuxStatus,
  handleTermuxFileUpload,
}) => {
  return (
    <div className="h-full p-4 md:p-10 flex flex-col gap-6 md:gap-10 animate-in zoom-in-95 duration-500 overflow-y-auto custom-scrollbar">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
        <div className="lg:col-span-1 flex flex-col gap-6 md:gap-10">
          <div className="bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-8 md:p-10 flex flex-col justify-center space-y-6 md:space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group shrink-0">
            <div className="absolute -bottom-16 -right-16 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-700">
              <Smartphone className="w-48 md:w-64 h-48 md:h-64 text-red-600" />
            </div>
            <div className="space-y-3 md:space-y-4 relative">
              <h2 className="text-2xl md:text-3xl font-black text-red-100 tracking-tighter uppercase leading-none">Crimson Bridge</h2>
              <p className="text-[12px] md:text-[13px] text-red-900 leading-relaxed font-bold tracking-tight">Sync mobile hardware with node clusters for low-latency neural inference.</p>
            </div>
            <button
              onClick={() => { setTermuxStatus('connecting'); setTimeout(() => setTermuxStatus('connected'), 1200); }}
              className="w-full py-4 md:py-6 bg-red-700 hover:bg-red-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-[0_10px_30px_rgba(185,28,28,0.3)] active:scale-95 transition-all"
            >
              Connect Hub
            </button>
          </div>
          <div className="bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-8 md:p-10 space-y-4 md:space-y-6 shadow-xl shrink-0">
            <h4 className="text-[11px] md:text-[12px] font-black text-red-800 uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-3"><Activity className="w-4 h-4 md:w-5 md:h-5 text-red-600" /> Node Vitals</h4>
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between text-[10px] md:text-[11px] font-mono"><span className="text-red-900 font-black">MEM_LOAD:</span><span className="text-red-500 font-black">72%</span></div>
              <div className="w-full h-2 md:h-2.5 bg-red-950/20 rounded-full overflow-hidden border border-red-900/10"><div className="w-[72%] h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] benchmark-bar" /></div>
              <div className="flex justify-between text-[10px] md:text-[11px] font-mono"><span className="text-red-900 font-black">THERMALS:</span><span className="text-red-500 font-black">42°C</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-6 md:p-12 flex flex-col space-y-8 md:space-y-10 shadow-2xl relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-red-900/20 pb-6 md:pb-8 gap-6">
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-black text-red-100 flex items-center gap-3 md:gap-4 uppercase tracking-tighter"><Network className="w-6 h-6 md:w-7 md:h-7 text-red-600" /> Mobile Model Stash</h3>
              <p className="text-xs md:text-sm text-red-900 font-bold tracking-widest">Safetensors and LoRA cluster synchronization.</p>
            </div>
            <label className="w-full md:w-auto px-5 md:px-6 py-3 md:py-4 bg-red-800/10 border border-red-700/30 rounded-xl md:rounded-2xl cursor-pointer hover:bg-red-800/20 transition-all text-red-500 flex items-center justify-center gap-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-lg">
              <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span>Sync Model</span>
              <input type="file" className="hidden" multiple onChange={handleTermuxFileUpload} />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {termuxFiles.length === 0 ? (
              <div className="col-span-1 md:col-span-2 h-full flex flex-col items-center justify-center text-red-950 italic gap-4 md:gap-6 opacity-30 py-12">
                <Database className="w-16 h-16 md:w-24 md:h-24" />
                <p className="uppercase font-black tracking-[0.3em] md:tracking-[0.4em] text-xs md:text-sm">Cluster Stash Empty</p>
              </div>
            ) : (
              termuxFiles.map((f, i) => (
                <div key={i} className="flex flex-col p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[24px] md:rounded-[32px] group hover:bg-red-900/10 hover:border-red-600/40 transition-all relative overflow-hidden shadow-inner">
                  <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-6 relative z-10">
                    <div className="p-3 md:p-4 bg-red-900/20 rounded-xl md:rounded-2xl shadow-xl">
                      {f.category === 'model' ? <HardDrive className="w-5 h-5 md:w-6 md:h-6 text-red-500" /> : <FileCode className="w-5 h-5 md:w-6 md:h-6 text-red-800" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] md:text-[15px] font-black text-red-100 truncate uppercase tracking-tight leading-none">{f.name}</p>
                      <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-red-800 font-black mt-2">{f.size} • {f.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 relative z-10">
                    <button className="flex-1 py-2.5 md:py-3 bg-red-900/20 hover:bg-red-700 text-[10px] md:text-[11px] font-black uppercase text-red-700 hover:text-white rounded-lg md:rounded-xl transition-all tracking-widest">Initialize</button>
                    <button onClick={() => setTermuxFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2.5 md:p-3 text-red-900 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                  </div>
                  <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-red-600/[0.03] blur-[40px] md:blur-[50px] rounded-full" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
