import React from 'react';
import {
  Zap,
  Terminal as TerminalIcon,
  Code2,
  FolderGit,
  LayoutTemplate,
  Brain,
  Smartphone,
  HardDrive,
  Layers,
  Settings as SettingsIcon,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const SidebarIcon: React.FC<{
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}> = ({ icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    className={`group relative p-4 rounded-[28px] transition-all duration-500 ${active ? 'text-accent-500 bg-accent-950/20 border border-accent-700/50 shadow-[0_0_40px_var(--color-accent-600)/20] scale-110 rotate-3' : 'text-accent-950 hover:text-accent-600 hover:bg-accent-950/10 hover:scale-105'}`}
  >
    {React.cloneElement(
      icon as React.ReactElement,
      { size: 24, strokeWidth: active ? 2.5 : 1.5 } as any,
    )}
    <div className="absolute left-full ml-4 px-3 py-2 bg-accent-950/90 text-accent-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-accent-800/40 z-50 translate-x-[-20px] group-hover:translate-x-0 whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-black uppercase tracking-[0.4em] backdrop-blur-md">
      {label}
    </div>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="hidden md:flex w-20 border-r border-accent-900/30 flex-col items-center py-8 space-y-8 bg-[#080101] z-30 shadow-[10px_0_40px_var(--color-accent-800)/10] relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--color-accent-800)/5,transparent)] pointer-events-none" />
      <div className="p-3 bg-accent-800 rounded-2xl shadow-[0_0_20px_var(--color-accent-700)/50] group cursor-pointer hover:rotate-12 transition-transform relative z-10">
        <Cpu className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 space-y-6 relative z-10">
        <SidebarIcon
          icon={<Zap />}
          active={activeTab === 'toolneuron'}
          onClick={() => setActiveTab('toolneuron')}
          label="ToolNeuron Hub"
        />
        <SidebarIcon
          icon={<TerminalIcon />}
          active={activeTab === 'terminal'}
          onClick={() => setActiveTab('terminal')}
          label="Terminal"
        />
        <SidebarIcon
          icon={<Code2 />}
          active={activeTab === 'editor'}
          onClick={() => setActiveTab('editor')}
          label="Neural Editor"
        />
        <SidebarIcon
          icon={<FolderGit />}
          active={activeTab === 'projects'}
          onClick={() => setActiveTab('projects')}
          label="Projects Panel"
        />
        <SidebarIcon
          icon={<LayoutTemplate />}
          active={activeTab === 'analysis'}
          onClick={() => setActiveTab('analysis')}
          label="Code Analysis"
        />
        <SidebarIcon
          icon={<Brain />}
          active={activeTab === 'brain'}
          onClick={() => setActiveTab('brain')}
          label="Neural Core"
        />
        <SidebarIcon
          icon={<Smartphone />}
          active={activeTab === 'termux'}
          onClick={() => setActiveTab('termux')}
          label="Node Bridge"
        />
        <SidebarIcon
          icon={<HardDrive />}
          active={activeTab === 'storage'}
          onClick={() => setActiveTab('storage')}
          label="Data Core"
        />
        <SidebarIcon
          icon={<Layers />}
          active={activeTab === 'results'}
          onClick={() => setActiveTab('results')}
          label="Results Hub"
        />
      </div>
      <SidebarIcon
        icon={<SettingsIcon />}
        active={activeTab === 'settings'}
        onClick={() => setActiveTab('settings')}
        label="System Config"
      />
    </nav>
  );
};
