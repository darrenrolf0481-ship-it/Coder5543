import React from 'react';
import { Cpu, Terminal, FileText, FolderOpen, Bot, Radio } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface SidebarProps {
  activeTab: 'studio' | 'editor' | 'terminal' | 'projects' | 'bridge';
  setActiveTab: (tab: 'studio' | 'editor' | 'terminal' | 'projects' | 'bridge') => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { currentMode } = useProjectStore();
  const isDev = currentMode === 'development';

  const navItems = [
    { id: 'studio', label: 'NEURAL STUDIO', icon: Bot },
    { id: 'bridge', label: 'BRIDGE', icon: Radio },
    { id: 'editor', label: 'CODE EDITOR', icon: FileText },
    { id: 'terminal', label: 'LIVE TERMINAL', icon: Terminal },
    { id: 'projects', label: 'WORKSPACE', icon: FolderOpen },
  ] as const;

  return (
    <aside className={`hidden md:flex flex-col w-64 bg-[#050508]/60 border-r p-4 h-full shrink-0 select-none backdrop-blur-md transition-colors duration-300 ${
      isDev ? 'border-white/5' : 'border-emerald-500/10'
    }`}>
      {/* Brand Logo - Immersive UI Style */}
      <div className={`flex items-center gap-3 px-2 py-4 mb-6 border-b transition-colors duration-300 ${
        isDev ? 'border-white/5' : 'border-emerald-500/15'
      }`}>
        <div className={`w-8 h-8 rounded-sm rotate-45 flex items-center justify-center shrink-0 transition-all duration-300 bg-gradient-to-tr ${
          isDev 
            ? 'from-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.3)]' 
            : 'from-emerald-500 to-teal-600 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
        }`}>
          <div className="w-2.5 h-2.5 bg-white rounded-full -rotate-45" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-[0.15em] text-white uppercase leading-none">AETHER</h1>
          <span className={`font-mono text-[9px] tracking-widest font-bold uppercase block mt-1 transition-colors duration-300 ${
            isDev ? 'text-slate-400' : 'text-emerald-400'
          }`}>
            {isDev ? 'NEURAL ENGINE' : 'AUDIT SENTINEL'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 text-left relative overflow-hidden group ${
                isActive
                  ? isDev
                    ? 'bg-indigo-950/20 text-indigo-300 border border-indigo-500/20 shadow-lg shadow-indigo-950/20'
                    : 'bg-emerald-950/20 text-emerald-300 border border-emerald-500/20 shadow-lg shadow-emerald-950/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {isActive && (
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
                  isDev ? 'from-blue-400 to-indigo-600' : 'from-emerald-400 to-teal-600'
                }`} />
              )}
              <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                isActive 
                  ? isDev ? 'text-blue-400' : 'text-emerald-400' 
                  : 'text-slate-500'
              }`} />
              <span className="font-mono text-xs font-semibold tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Meta */}
      <div className={`p-3 bg-black/35 border rounded-xl transition-all duration-300 ${
        isDev ? 'border-white/10' : 'border-emerald-500/20'
      }`}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isDev 
              ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' 
              : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
          }`} />
          <span className="font-mono text-[9px] text-slate-300 font-bold tracking-wider">
            {isDev ? 'SWARM PIPELINE LIVE' : 'DIAGNOSTIC PIPELINE ACTIVE'}
          </span>
        </div>
        <p className="font-mono text-[9px] text-slate-500">
          {isDev ? 'Secure Sandboxed Engine • v1.0' : 'Static Verification Sandbox • v1.0'}
        </p>
      </div>
    </aside>
  );
}
