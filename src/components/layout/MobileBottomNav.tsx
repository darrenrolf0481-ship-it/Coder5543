import React from 'react';
import {
  Zap,
  Terminal as TerminalIcon,
  Code2,
  LayoutTemplate,
  Brain,
  Smartphone,
  HardDrive,
  Settings as SettingsIcon
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#080101]/95 backdrop-blur-xl border-t border-red-900/30 flex items-center justify-around px-1 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {([
        ['toolneuron', <Zap size={18} />],
        ['terminal',   <TerminalIcon size={18} />],
        ['editor',     <Code2 size={18} />],
        ['analysis',   <LayoutTemplate size={18} />],
        ['brain',      <Brain size={18} />],
        ['termux',     <Smartphone size={18} />],
        ['storage',    <HardDrive size={18} />],
        ['settings',   <SettingsIcon size={18} />],
      ] as [string, React.ReactNode][]).map(([tab, icon]) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab as any)}
          aria-label={`Switch to ${tab}`}
          className={`flex-1 flex items-center justify-center py-2 rounded-xl transition-all ${activeTab === tab ? 'text-red-500 bg-red-950/30' : 'text-red-900 active:text-red-600'}`}
        >
          {icon}
        </button>
      ))}
    </nav>
  );
};
