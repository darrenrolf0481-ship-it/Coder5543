import React, { useState } from 'react';
import { Search, Activity, AlertTriangle } from 'lucide-react';
import { useDebuggerStore } from '../../store/slices/debuggerStore';

export const DebuggerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'static' | 'dynamic'>('static');
  const { analysisResults, traceLogs } = useDebuggerStore();
  
  return (
    <div className="flex flex-col h-full bg-black/40 border-l border-red-900/30">
      <div className="h-16 flex items-center border-b border-red-900/30 px-4 gap-4">
        <button 
          onClick={() => setActiveTab('static')}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${activeTab === 'static' ? 'text-red-500' : 'text-red-900'}`}
        >
          <Search size={14} /> Static Analysis
        </button>
        <button 
          onClick={() => setActiveTab('dynamic')}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${activeTab === 'dynamic' ? 'text-red-500' : 'text-red-900'}`}
        >
          <Activity size={14} /> Dynamic Trace
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] text-red-100/70">
        {activeTab === 'static' ? (
          <div className="space-y-4">
            {analysisResults.map(diag => (
              <div key={diag.id} className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg flex gap-2">
                <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                <div>
                  <h4 className="text-red-500 font-black mb-1">{diag.message}</h4>
                  <p className="opacity-60">Line: {diag.line}</p>
                </div>
              </div>
            ))}
            {analysisResults.length === 0 && <p className="opacity-40 italic">Analysis engine stable.</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {traceLogs.map((log, i) => (
              <div key={i} className="text-blue-400 opacity-80">{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
