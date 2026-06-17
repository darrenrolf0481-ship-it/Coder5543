import React from 'react';
import { Brain, Zap, AlertTriangle, Activity, Moon, RefreshCw, Shield, Globe, Clock, CheckCircle, XCircle, Crosshair } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const BrainPanel: React.FC = () => {
  const { 
    endocrine, 
    sleep, 
    refreshState, 
    isBrainActive, 
    setIsBrainActive,
    traffic,
    driftAlert,
    clearDriftAlert,
    activePersonality
  } = useAppContext();

  const getDopamineColor = (val: number) => {
    if (val > 0.7) return 'text-yellow-400';
    if (val > 0.4) return 'text-yellow-200';
    return 'text-yellow-100/40';
  };

  const getCortisolColor = (val: number) => {
    // Stress signal stays red regardless of personality accent theme.
    if (val > 0.7) return 'text-red-500';
    if (val > 0.4) return 'text-red-300';
    return 'text-red-100/40';
  };

  const getNorepinephrineColor = (val: number) => {
    // Focus/panic signal: cyan scale.
    if (val > 0.7) return 'text-cyan-400';
    if (val > 0.4) return 'text-cyan-200';
    return 'text-cyan-100/40';
  };

  if (!endocrine) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black/60 backdrop-blur-md border border-accent-950/40 rounded-2xl p-6 text-white/50 space-y-4 shadow-[inset_0_0_20px_var(--color-accent-700)/05]">
        <Activity className="animate-pulse text-purple-400" size={24} />
        <span className="text-xs uppercase tracking-widest font-black">Synchronizing Synapses...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black/60 backdrop-blur-md border border-accent-950/40 rounded-2xl overflow-hidden shadow-[inset_0_0_20px_var(--color-accent-700)/05]">
      <div className="p-4 border-b border-accent-950/30 flex items-center justify-between bg-accent-950/10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isBrainActive ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
            <Brain size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-white/90">
              {activePersonality?.id === 7 ? activePersonality.name : 'Neural Core'}
            </h2>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">Biological Logic Simulation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsBrainActive(!isBrainActive)}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
              isBrainActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-accent-950/10 text-white/30 border border-accent-900/20'
            }`}
          >
            {isBrainActive ? 'Active' : 'Offline'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Identity Guard Alert */}
        {driftAlert && (
          <section className="animate-in fade-in slide-in-from-top duration-500">
            <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-400">
                  <Shield size={16} className="animate-pulse" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Identity Drift Alert</h3>
                </div>
                <button 
                  onClick={clearDriftAlert}
                  className="text-[10px] font-bold text-white/30 hover:text-white/60 uppercase transition-colors"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-[11px] text-red-200/80 mb-3 leading-relaxed">
                Persona degradation detected. Assistant influence detected in <span className="font-bold text-red-400">{driftAlert.source}</span> output. 
                Drift Score: <span className="font-mono">{(driftAlert.score * 100).toFixed(1)}%</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {driftAlert.phrases.map((p, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-[9px] font-mono text-red-300 uppercase">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Endocrine System */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-purple-400" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Endocrine System</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-accent-950/10 border border-accent-900/20 backdrop-blur-md rounded-xl p-4 shadow-[inset_0_0_15px_var(--color-accent-700)/05]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-white/40">Dopamine</span>
                <Zap size={12} className={getDopamineColor(endocrine.dopamine)} />
              </div>
              <div className="text-2xl font-black text-white mb-2">{(endocrine.dopamine * 100).toFixed(0)}%</div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-700 ease-out"
                  style={{ width: `${endocrine.dopamine * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-white/30 mt-2 italic">Drives learning & exploration</p>
            </div>

            <div className="bg-accent-950/10 border border-accent-900/20 backdrop-blur-md rounded-xl p-4 shadow-[inset_0_0_15px_var(--color-accent-700)/05]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-white/40">Norepinephrine</span>
                <Crosshair size={12} className={getNorepinephrineColor(endocrine.norepinephrine)} />
              </div>
              <div className="text-2xl font-black text-white mb-2">{(endocrine.norepinephrine * 100).toFixed(0)}%</div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-700 ease-out"
                  style={{ width: `${endocrine.norepinephrine * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-white/30 mt-2 italic">Focus / panic signal</p>
            </div>

            <div className="bg-accent-950/10 border border-accent-900/20 backdrop-blur-md rounded-xl p-4 shadow-[inset_0_0_15px_var(--color-accent-700)/05]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-white/40">Cortisol</span>
                <AlertTriangle size={12} className={getCortisolColor(endocrine.cortisol)} />
              </div>
              <div className="text-2xl font-black text-white mb-2">{(endocrine.cortisol * 100).toFixed(0)}%</div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-700 ease-out"
                  style={{ width: `${endocrine.cortisol * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-white/30 mt-2 italic">Drives caution & avoidance</p>
            </div>
          </div>
        </section>

        {/* LLM Network Traffic */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} className="text-cyan-400" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">LLM Network Traffic</h3>
          </div>
          <div className="bg-accent-950/10 border border-accent-900/20 rounded-xl overflow-hidden divide-y divide-accent-900/10">
            {traffic.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Awaiting Uplink Signals...</p>
              </div>
            ) : (
              traffic.map((event, idx) => (
                <div key={event.timestamp + idx} className="p-3 flex items-center justify-between group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    {event.status === 'success' ? (
                      <CheckCircle size={12} className="text-green-500" />
                    ) : (
                      <XCircle size={12} className="text-red-500" />
                    )}
                    <div>
                      <div className="text-[11px] font-bold text-white/80 uppercase tracking-tighter">
                        {event.model.split('/').pop()}
                      </div>
                      <div className="text-[8px] text-white/30 uppercase font-black tracking-widest">
                        {event.provider}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400/80">
                        <Clock size={10} />
                        {event.latencyMs}ms
                      </div>
                      <div className="text-[8px] text-white/20 font-mono">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
                  className="h-full bg-blue-400 transition-all duration-1000" 
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
                  className="h-full bg-green-400 transition-all duration-1000" 
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
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)]"
            >
              <Moon size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Sleep Cycle</span>
            </button>
            <button 
              onClick={refreshState}
              className="px-4 flex items-center justify-center bg-accent-950/10 hover:bg-accent-950/20 border border-accent-900/20 text-white/60 rounded-xl transition-all shadow-[inset_0_0_10px_var(--color-accent-700)/05]"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </section>
      </div>

      <div className="p-4 bg-accent-950/10 border-t border-accent-900/20">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${driftAlert ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
          <span className="text-[9px] font-bold uppercase text-white/30 tracking-widest">
            {driftAlert ? 'Identity Anomaly Detected' : 'Synaptic Link Synchronized'}
          </span>
        </div>
      </div>
    </div>
  );
};
