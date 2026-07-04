import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { Cpu, Wifi, Activity, Link as LinkIcon, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
import SkillsLibraryDropdown from './SkillsLibraryDropdown';

interface MainHeaderProps {
  activeTab: 'studio' | 'editor' | 'terminal' | 'projects' | 'bridge';
  activePersonality?: any;
}

export function MainHeader({ activeTab, activePersonality }: MainHeaderProps) {
  const { attachedAgent, currentMode, setMode } = useProjectStore();

  const getTabLabel = () => {
    switch (activeTab) {
      case 'studio':
        return 'NEURAL COMMAND INTERFACE';
      case 'editor':
        return 'CRIMSON DEVELOPMENT ZONE';
      case 'terminal':
        return 'SWARM ACTIVITY TERMINAL';
      case 'projects':
        return 'VIRTUAL WORKSPACE EXPLORER';
      case 'bridge':
        return 'MAMA / SEVEN BRIDGE';
      default:
        return 'CRIMSON CONTROL';
    }
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#050508]/60 px-3 sm:px-6 flex items-center justify-between backdrop-blur-md select-none shrink-0 relative z-20">
      {/* Tab Context Name */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
        <h2 className="font-mono text-[10px] sm:text-xs font-black tracking-wider sm:tracking-widest text-slate-200 uppercase truncate max-w-[80px] xs:max-w-[150px] sm:max-w-none">
          {getTabLabel()}
        </h2>
      </div>

      {/* Diagnostics / Agent status */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* MODE CONTROLLER */}
        <div className="flex items-center bg-black/45 border border-white/8 rounded-xl p-0.5 select-none shrink-0">
          <button
            onClick={() => setMode('development')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider uppercase transition-all duration-300 rounded-lg ${
              currentMode === 'development'
                ? 'bg-blue-500/15 border border-blue-500/35 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                : 'text-slate-500 hover:text-slate-400 border border-transparent'
            }`}
            title="Development Mode (Fast, visual prototyping, loose validation)"
          >
            <Zap className={`w-3 h-3 ${currentMode === 'development' ? 'text-blue-400 animate-pulse' : ''}`} />
            <span className="hidden xs:inline">DEV</span>
          </button>
          <button
            onClick={() => setMode('analysis')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider uppercase transition-all duration-300 rounded-lg ${
              currentMode === 'analysis'
                ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'text-slate-500 hover:text-slate-400 border border-transparent'
            }`}
            title="Analysis Mode (Strict static typing, security audit)"
          >
            <ShieldCheck className={`w-3 h-3 ${currentMode === 'analysis' ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span className="hidden xs:inline">AUDIT</span>
          </button>
        </div>

        {/* SKILLS MATRIX PULL-DOWN */}
        <SkillsLibraryDropdown />

        {/* Active agent status */}
        {attachedAgent ? (
          <div className="hidden sm:flex items-center gap-2 bg-emerald-950/20 border border-emerald-900/35 rounded-xl px-3 py-1 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            <LinkIcon className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-mono text-[9px] font-bold text-emerald-400 tracking-wider">
              {attachedAgent.name.toUpperCase()} ACTIVE
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 bg-black/35 border border-white/5 rounded-xl px-3 py-1">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[9px] font-bold text-slate-400 tracking-wider">
              NO AGENT ATTACHED
            </span>
          </div>
        )}

        <div className="hidden xs:flex items-center gap-3.5 text-slate-500 text-xs border-l border-white/10 pl-4 font-mono">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden xs:inline text-[10px]">PING: 14ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span className="hidden xs:inline text-[10px]">CPU: 1.2%</span>
          </div>
        </div>
      </div>
    </header>
  );
}
