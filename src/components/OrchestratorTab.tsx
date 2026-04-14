import React, { useState } from 'react';
import { 
  Users, 
  Brain, 
  Network, 
  Activity,
  Cpu,
  MoreVertical,
  Zap
} from 'lucide-react';
import { Personality, SwarmAgent, SwarmLog } from '../types';

interface OrchestratorTabProps {
  personalities: Personality[];
  setPersonalities: (personalities: Personality[]) => void;
  setActiveTab: (tab: any) => void;
  swarmAnxiety: number;
  swarmAgents: SwarmAgent[];
  swarmLogs: SwarmLog[];
  triggerSwarmCycle: () => void;
  isAiProcessing: boolean;
}

const OrchestratorTab: React.FC<OrchestratorTabProps> = ({
  personalities,
  setPersonalities,
  setActiveTab,
  swarmAnxiety,
  swarmAgents,
  swarmLogs,
  triggerSwarmCycle,
  isAiProcessing
}) => {
  const [viewMode, setViewMode] = useState<'agents' | 'swarm'>('agents');
  const togglePersonality = (id: number | string) => {
    setPersonalities(personalities.map(p => ({
      ...p,
      active: p.id === id
    })));
    // Switch to chat tab automatically
    setTimeout(() => setActiveTab('chat'), 300);
  };

  return (
    <div className="h-full flex flex-col p-0 md:p-8 overflow-hidden bg-[#020204]">
      <div className="flex-1 bg-[#0d0404]/80 rounded-none md:rounded-[40px] border-x-0 md:border border-red-900/30 shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 md:p-10 border-b border-red-900/30 bg-[#0a0202]/80 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(153,27,27,0.1),transparent)] pointer-events-none" />
          <div className="flex items-center gap-4 md:gap-6 relative z-10">
            <div className="p-3 md:p-5 bg-red-900/20 rounded-[18px] md:rounded-[24px] border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              {viewMode === 'agents' ? <Users className="w-6 h-6 md:w-10 md:h-10 text-red-500" /> : <Network className="w-6 h-6 md:w-10 md:h-10 text-red-500" />}
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-red-100 uppercase tracking-tighter italic">{viewMode === 'agents' ? 'Agent Hub' : 'Neural Swarm'}</h2>
              <p className="text-[8px] md:text-[10px] text-red-900 font-black uppercase tracking-[0.4em]">{viewMode === 'agents' ? 'Neural Orchestrator' : 'Biomimetic Distributed Intelligence'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <button 
              onClick={() => setViewMode('agents')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'agents' ? 'bg-red-700 text-white' : 'text-red-900 hover:text-red-500'}`}
            >
              Agents
            </button>
            <button 
              onClick={() => setViewMode('swarm')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'swarm' ? 'bg-red-700 text-white' : 'text-red-900 hover:text-red-500'}`}
            >
              Swarm
            </button>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6 relative z-10">
            <div className="text-left md:text-right">
              <p className="text-[8px] md:text-[10px] text-red-900 font-black uppercase tracking-widest mb-0.5 md:mb-1">{viewMode === 'agents' ? 'Active Archetypes' : 'Swarm Anxiety'}</p>
              <p className={`text-lg md:text-xl font-black italic ${viewMode === 'swarm' && swarmAnxiety > 0.5 ? 'text-red-500' : 'text-red-100'}`}>
                {viewMode === 'agents' ? `${personalities.length} Nodes` : `${(swarmAnxiety * 100).toFixed(1)}%`}
              </p>
            </div>
            {viewMode === 'swarm' && (
              <button 
                onClick={triggerSwarmCycle}
                disabled={isAiProcessing}
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-700 border border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(185,28,28,0.4)] active:scale-95 transition-all"
              >
                 <Zap className={`w-5 h-5 md:w-6 md:h-6 text-white ${isAiProcessing ? 'animate-pulse' : ''}`} />
              </button>
            )}
            {viewMode === 'agents' && (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-950/20 border border-red-900/20 flex items-center justify-center">
                 <Network className="w-5 h-5 md:w-6 md:h-6 text-red-500 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {viewMode === 'agents' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
              {personalities.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => togglePersonality(p.id)}
                  className={`group relative bg-red-950/5 border p-8 rounded-[40px] transition-all cursor-pointer overflow-hidden ${p.active ? 'border-red-500/50 bg-red-900/10 shadow-[0_20px_50px_rgba(220,38,38,0.15)] scale-[1.02]' : 'border-red-900/20 hover:border-red-500/30 hover:bg-red-950/10'}`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(153,27,27,0.05),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className={`p-4 rounded-2xl transition-all ${p.active ? 'bg-red-700 text-white' : 'bg-red-900/10 text-red-900 group-hover:text-red-500'}`}>
                      <Brain className="w-7 h-7" />
                    </div>
                    {p.active ? (
                      <div className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                      </div>
                    ) : (
                      <MoreVertical className="w-5 h-5 text-red-950" />
                    )}
                  </div>
                  <div className="space-y-4 relative z-10">
                    <h4 className="text-xl font-black text-red-100 uppercase tracking-tighter italic">{p.name}</h4>
                    <p className="text-[11px] text-red-100/40 leading-relaxed line-clamp-3 font-medium">
                      {p.instruction}
                    </p>
                  </div>
                  <div className="mt-8 pt-8 border-t border-red-900/10 flex items-center justify-between relative z-10">
                     <div className="flex gap-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={`w-1 h-1 rounded-full ${p.active ? 'bg-red-500' : 'bg-red-950'}`} />
                        ))}
                     </div>
                     <span className="text-[9px] font-black text-red-950 uppercase tracking-[0.2em] group-hover:text-red-500 transition-colors">
                       {p.active ? 'Synchronized' : 'Standby'}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Swarm Visualization */}
                  <div className="lg:col-span-2 space-y-8">
                     <div className="bg-red-950/5 border border-red-900/20 rounded-[40px] p-10 relative overflow-hidden h-[500px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.1)_0%,transparent_70%)]" />
                        <div className="relative w-full h-full">
                           {swarmAgents.map((agent, i) => {
                             const angle = (i / swarmAgents.length) * Math.PI * 2;
                             const x = Math.cos(angle) * 160;
                             const y = Math.sin(angle) * 160;
                             return (
                               <div
                                 key={agent.id}
                                 style={{ 
                                   transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${agent.status === 'active' ? 1.1 : 1})`
                                 }}
                                 className="absolute left-1/2 top-1/2 flex flex-col items-center gap-3 transition-all duration-500"
                               >
                                  <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                    agent.status === 'active' 
                                      ? 'bg-red-600 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.6)]' 
                                      : 'bg-red-950/40 border-red-900/40'
                                  }`}>
                                     <Users className={`w-7 h-7 ${agent.status === 'active' ? 'text-white' : 'text-red-900'}`} />
                                  </div>
                                  <div className="text-center">
                                     <p className="text-[10px] font-black text-red-100 uppercase tracking-tighter">{agent.name}</p>
                                     <p className="text-[8px] font-black text-red-900 uppercase tracking-widest mt-1">{agent.expertise}</p>
                                  </div>
                               </div>
                             );
                           })}
                           {/* Center Core */}
                           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-900/20 rounded-full blur-3xl animate-pulse" />
                           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                              <Brain className="w-12 h-12 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        {swarmAgents.map(agent => (
                          <div key={agent.id} className="p-4 bg-red-950/5 border border-red-900/10 rounded-2xl space-y-2">
                             <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-red-900 uppercase tracking-widest">Trust</span>
                                <span className="text-[9px] font-mono text-red-500">{(agent.trust * 100).toFixed(0)}%</span>
                             </div>
                             <div className="w-full h-1 bg-red-950/40 rounded-full overflow-hidden">
                                <div className="h-full bg-red-600" style={{ width: `${agent.trust * 100}%` }} />
                             </div>
                             <p className="text-[9px] font-black text-red-100 uppercase truncate">{agent.name}</p>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Swarm Logs */}
                  <div className="bg-[#0a0202] border border-red-900/30 rounded-[40px] flex flex-col shadow-2xl overflow-hidden h-[650px]">
                     <div className="p-8 border-b border-red-900/20 bg-black/40 flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                           <Activity className="w-4 h-4" /> Consensus Stream
                        </h4>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                     </div>
                     <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar font-mono text-[11px]">
                        {swarmLogs.map(log => (
                          <div key={log.id} className={`p-4 rounded-2xl border ${
                            log.type === 'consensus' ? 'bg-green-500/5 border-green-500/20 text-green-500' :
                            log.type === 'pain' ? 'bg-red-500/5 border-red-500/20 text-red-500' :
                            'bg-red-950/10 border-red-900/10 text-red-900'
                          }`}>
                             <div className="flex justify-between mb-2 opacity-50">
                                <span>[{log.type.toUpperCase()}]</span>
                                <span>{log.time}</span>
                             </div>
                             <p className="leading-relaxed font-bold">{log.message}</p>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 border-t border-red-900/30 bg-[#0a0202]/80 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
           <div className="flex items-center justify-around md:justify-start gap-6 md:gap-10">
              <div className="flex items-center gap-2 md:gap-4">
                 <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                 <span className="text-[9px] md:text-[10px] font-black text-red-900 uppercase tracking-widest">98.4%</span>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                 <Cpu className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                 <span className="text-[9px] md:text-[10px] font-black text-red-900 uppercase tracking-widest">45 t/s</span>
              </div>
           </div>
           <button 
             onClick={() => {
               const btn = document.activeElement as HTMLButtonElement;
               const originalText = btn.innerText;
               btn.innerText = 'Synchronizing...';
               btn.disabled = true;
               setTimeout(() => {
                 btn.innerText = 'Sync Complete';
                 setTimeout(() => {
                   btn.innerText = originalText;
                   btn.disabled = false;
                 }, 2000);
               }, 1500);
             }}
             className="w-full md:w-auto px-10 py-3.5 bg-red-950/20 border border-red-900/30 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-red-500 hover:bg-red-700 hover:text-white transition-all disabled:opacity-50"
           >
             Sync Repository
           </button>
        </div>
      </div>
    </div>
  );
};

export default OrchestratorTab;
