import React from 'react';
import { Zap, Terminal as TerminalIcon, Code2, Wrench } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs: [string, React.ReactNode, string][] = [
    ['toolneuron', <Zap size={20} />, 'Chat'],
    ['editor', <Code2 size={20} />, 'Editor'],
    ['terminal', <TerminalIcon size={20} />, 'Terminal'],
    ['tools', <Wrench size={20} />, 'Tools'],
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#080101]/95 backdrop-blur-xl border-t border-accent-900/30 flex items-center justify-around px-2 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {tabs.map(([tab, icon, label]) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab as any)}
          aria-label={label}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all ${
            activeTab === tab
              ? 'text-accent-500'
              : 'text-accent-900 active:text-accent-600'
          }`}
        >
          {icon}
          <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === tab ? 'text-accent-500' : 'text-accent-950'}`}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
};
