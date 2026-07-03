'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  Video,
  Mic2,
  Zap,
  Settings,
  Clock,
  Brain
} from 'lucide-react';

interface FooterProps {
  activeScreen: string;
  onScreenChange: (id: string) => void;
}

const SCREENS = [
  { id: 'command',  label: 'CMD',     icon: LayoutDashboard },
  { id: 'sensors',  label: 'SENS',    icon: Activity },
  { id: 'feeds',    label: 'FEEDS',   icon: Video },
  { id: 'sls',      label: 'LAT',     icon: Video },
  { id: 'evp',      label: 'EVP',     icon: Mic2 },
  { id: 'temporal', label: 'TIME',    icon: Clock },
  { id: 'starcity', label: 'CITY',    icon: LayoutDashboard },
  { id: 'neural',   label: 'CHAT',    icon: Zap },
  { id: 'memory',   label: 'MEM',     icon: Brain },
  { id: 'config',   label: 'CFG',     icon: Settings },
];

export default function Footer({ activeScreen, onScreenChange }: FooterProps) {
  return (
    <footer className="relative flex items-center h-16 bg-[#060614] border-t border-white/12 z-20 px-2">
      {/* top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-violet/50 via-neon-blue/40 to-transparent pointer-events-none" />

      <div className="flex items-center w-full gap-1">
        {SCREENS.map(screen => (
          <button
            key={screen.id}
            onClick={() => onScreenChange(screen.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1.5 border rounded-[4px] cursor-pointer font-bold text-[9px] tracking-[1px] transition-all",
              "border-white/12 text-white/55 hover:border-neon-violet/50 hover:text-white/85 hover:bg-neon-violet/8",
              activeScreen === screen.id && "border-neon-blue/70 text-neon-blue bg-neon-blue/10 shadow-[0_0_8px_rgba(0,212,255,0.18)]"
            )}
          >
            <screen.icon size={14} />
            <span className="truncate w-full text-center leading-none">{screen.label}</span>
          </button>
        ))}
      </div>
    </footer>
  );
}
