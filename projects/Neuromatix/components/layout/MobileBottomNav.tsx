import React from 'react';
import { Bot, FileText, Terminal, FolderOpen, Radio } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'studio' | 'editor' | 'terminal' | 'projects' | 'bridge';
  setActiveTab: (tab: 'studio' | 'editor' | 'terminal' | 'projects' | 'bridge') => void;
}

export function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const items = [
    { id: 'studio', label: 'Studio', icon: Bot },
    { id: 'bridge', label: 'Bridge', icon: Radio },
    { id: 'editor', label: 'Editor', icon: FileText },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'projects', label: 'Workspace', icon: FolderOpen },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#050508]/90 border-t border-white/5 grid grid-cols-5 z-50 backdrop-blur-lg select-none">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {isActive && (
              <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
            )}
            <Icon className="w-5 h-5" />
            <span className="font-mono text-[9px] font-bold tracking-tight uppercase">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
