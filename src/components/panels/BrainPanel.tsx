import React from 'react';
import { Brain, Zap, AlertTriangle, Activity, Moon, RefreshCw } from 'lucide-react';
import { useBrain } from '../../hooks/useBrain';

export const BrainPanel: React.FC = () => {
  const { endocrine, sleep, refreshState, isBrainActive, setIsBrainActive } = useBrain();

  const getDopamineColor = (val: number) => {
    if (val > 0.7) return 'text-yellow-400';
    if (val > 0.4) return 'text-yellow-200';
    return 'text-yellow-100/40';
  };

  const getCortisolColor = (val: number) => {
    if (val > 0.7) return 'text-red-500';
    if (val > 0.4) return 'text-red-300';
    return 'text-red-100/40';
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isBrainActive ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
            <Brain size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-white/90">Neural Core</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">Biological Logic Simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsBrainActive(!isBrainActive)}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
              isBrainActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-white/30 border border-white/10'
            }`}
          >
            {isBrainActive ? 'Active' : 'Offline'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Endocrine System */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-purple-400" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Endocrine System</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-white/40">Dopamine</span>
                <Zap size={12} className={getDopamineColor(endocrine.dopamine)} />
              </div>
              <div className="text-2xl font-black text-white mb-2">{(endocrine.dopamine * 100).toFixed(0)}%</div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-500" 
                  style={{ width: `${endocrine.dopamine * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-white/30 mt-2 italic">Drives learning & exploration</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-white/40">Cortisol</span>
                <AlertTriangle size={12} className={getCortisolColor(endocrine.cortisol)} />
              </div>
              <div className="text-2xl font-black text-white mb-2">{(endocrine.cortisol * 100).toFixed(0)}%</div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-500" 
                  style={{ width: `${endocrine.cortisol * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-white/30 mt-2 italic">Drives caution & avoidance</p>
            </div>
          </div>
        </section>

        {/* Cognitive Modifiers */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-blue-400" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Cognitive Modifiers</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-white/40 mb-1">
                <span>Learning Rate</span>
                <span>{(0.4 + endocrine.dopamine * 0.4 - endocrine.cortisol * 0.2).toFixed(2)}x</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400 transition-all" 
                  style={{ width: `${Math.max(10, (0.4 + endocrine.dopamine * 0.4 - endocrine.cortisol * 0.2) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-white/40 mb-1">
                <span>Risk Tolerance</span>
                <span>{(0.5 + endocrine.dopamine * 0.3 - endocrine.cortisol * 0.5).toFixed(2)}x</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-400 transition-all" 
                  style={{ width: `${Math.max(10, (0.5 + endocrine.dopamine * 0.3 - endocrine.cortisol * 0.5) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Neural Maintenance */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Moon size={14} className="text-indigo-400" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Neural Maintenance</h3>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={sleep}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 py-3 rounded-xl transition-all"
            >
              <Moon size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Sleep Cycle</span>
            </button>
            <button 
              onClick={refreshState}
              className="px-4 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-xl transition-all"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </section>
      </div>

      <div className="p-4 bg-white/5 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-bold uppercase text-white/30 tracking-widest">Synaptic Link Synchronized</span>
        </div>
      </div>
    </div>
  );
};
