import React from 'react';
import { 
  Smartphone, 
  Activity, 
  Network, 
  Plus, 
  Database, 
  HardDrive, 
  Trash2, 
  FileCode,
  Zap,
  Gauge
} from 'lucide-react';

interface TermuxTabProps {
  termuxStatus: 'disconnected' | 'connecting' | 'connected';
  vitals: any;
  sensorData: any;
  termuxFiles: any[];
  handleTermuxFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setTermuxFiles: (files: any) => void;
}

const TermuxTab: React.FC<TermuxTabProps> = ({
  termuxStatus,
  vitals,
  sensorData,
  termuxFiles,
  handleTermuxFileUpload,
  setTermuxFiles
}) => {
  return (
    <div className="h-full flex flex-col p-4 md:p-8 gap-4 md:gap-8 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Connection Status */}
        <div className="bg-[#0d0404]/80 rounded-[30px] border border-red-900/30 p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${termuxStatus === 'connected' ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'bg-red-950'}`} />
          <div className="relative">
            <div className={`absolute inset-0 blur-[40px] opacity-20 ${termuxStatus === 'connected' ? 'bg-red-500 animate-pulse' : 'bg-red-950'}`} />
            <Smartphone className={`w-24 h-24 relative z-10 ${termuxStatus === 'connected' ? 'text-red-500' : 'text-red-950'}`} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-red-100 uppercase tracking-tighter italic">Termux Bridge</h3>
            <p className="text-[10px] text-red-900 font-black uppercase tracking-[0.4em]">
              {termuxStatus === 'connected' ? 'Neural Link Optimized' : 'Waiting for Uplink...'}
            </p>
          </div>
          <button className="px-8 py-3 bg-red-950/20 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-red-100 hover:bg-red-700 hover:border-red-500 transition-all">
            {termuxStatus === 'connected' ? 'Synchronized' : 'Initialize Bridge'}
          </button>
        </div>

        {/* Vitals */}
        <div className="bg-[#0d0404]/80 rounded-[30px] border border-red-900/30 p-8 space-y-8 shadow-2xl">
          <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-3">
            <Activity className="w-4 h-4" /> Node Vitals
          </h4>
          <div className="grid grid-cols-2 gap-6">
            <VitalCard label="MEM_LOAD" value={`${vitals.mem_load}%`} icon={<Database className="w-4 h-4" />} />
            <VitalCard label="THERMALS" value={`${vitals.thermals}°C`} icon={<Zap className="w-4 h-4" />} />
            <VitalCard label="ENERGY" value={`${vitals.battery}%`} icon={<Gauge className="w-4 h-4" />} />
            <VitalCard label="NUCLEOID" value={vitals.nucleoid ? 'ACTIVE' : 'IDLE'} icon={<Network className="w-4 h-4" />} />
          </div>
        </div>
      </div>

      {/* Model Stash */}
      <div className="bg-[#0d0404]/80 rounded-[30px] md:rounded-[40px] border border-red-900/30 p-8 md:p-10 shadow-2xl flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <h3 className="text-xl font-black text-red-100 flex items-center gap-4 uppercase tracking-tighter italic">
            <Network className="w-7 h-7 text-red-600" /> Mobile Model Stash
          </h3>
          <label className="px-6 py-3 bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 cursor-pointer hover:bg-red-600 transition-all shadow-lg">
            <Plus className="w-4 h-4" /> Sync Model
            <input type="file" className="hidden" onChange={handleTermuxFileUpload} />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {termuxFiles.length > 0 ? termuxFiles.map((f, i) => (
            <div key={i} className="group bg-red-950/5 border border-red-900/20 p-6 rounded-[30px] hover:border-red-500/30 transition-all relative">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-red-900/10 rounded-2xl">
                  {f.category === 'model' ? <HardDrive className="w-6 h-6 text-red-500" /> : <FileCode className="w-6 h-6 text-red-800" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-red-100 text-sm truncate uppercase tracking-tight">{f.name}</h4>
                  <p className="text-[10px] text-red-900 font-mono mt-1">{f.size}</p>
                </div>
                <button 
                  onClick={() => setTermuxFiles(termuxFiles.filter((_, idx) => idx !== i))}
                  className="p-2 text-red-900 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 border-2 border-dashed border-red-900/10 rounded-[40px] flex flex-col items-center justify-center gap-4 opacity-20">
              <Database className="w-16 h-16" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Stash Vacuum: No models detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VitalCard: React.FC<{ label: string, value: string, icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-5 bg-red-950/10 border border-red-900/10 rounded-2xl space-y-3">
    <div className="flex items-center gap-3 text-red-900">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-xl font-black text-red-100 italic">{value}</div>
  </div>
);

export default TermuxTab;
