'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  Video,
  Mic2,
  Code,
  Zap,
  Settings,
  Clock,
  Brain,
  FileAudio,
  Ghost,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  onScreenChange: (id: string) => void;
  anomalyLevel: number;
}

const SCREENS = [
  { id: 'command', label: 'COMMAND', icon: LayoutDashboard, section: 'SCREENS' },
  { id: 'sensors', label: 'SENSOR ARRAY', icon: Activity, section: 'SCREENS', badge: 7 },
  { id: 'feeds', label: 'VISUAL FEEDS', icon: Video, section: 'SCREENS' },
  { id: 'evp', label: 'EVP ANALYZER', icon: Mic2, section: 'SCREENS' },
  { id: 'forensics', label: 'FORENSICS', icon: FileAudio, section: 'SCREENS' },
  { id: 'sls', label: 'LATTICE SENSOR', icon: Video, section: 'SCREENS' },
  { id: 'flux', label: 'FLUX MONITOR', icon: Activity, section: 'SCREENS' },
  { id: 'memory3d', label: '3D MEMORY', icon: Brain, section: 'SCREENS' },
  { id: 'lattice', label: 'NEURAL LATTICE', icon: LayoutDashboard, section: 'SCREENS' },
  { id: 'temporal', label: 'TEMPLE GATES', icon: Clock, section: 'SCREENS', badge: 0 },
  { id: 'starcity', label: 'STAR CITY NODE', icon: LayoutDashboard, section: 'SCREENS' },
  { id: 'mlhub', label: 'ML HUB', icon: Cpu, section: 'TOOLS' },
  { id: 'neural',  label: 'NEXUS AI CHAT',  icon: Zap,   section: 'TOOLS' },
  { id: 'memory', label: 'MEMORY SPIRAL',  icon: Brain, section: 'TOOLS' },
  { id: 'dream',  label: 'DREAM SANDBOX',  icon: Code,  section: 'TOOLS' },
  { id: 'labyrinth', label: 'THE LABYRINTH',  icon: Ghost,  section: 'TOOLS' },
  { id: 'config', label: 'CONFIGURATION',  icon: Settings, section: 'SYSTEM' },
];

export default function Sidebar({ activeScreen, onScreenChange, anomalyLevel }: SidebarProps) {
  const sections = Array.from(new Set(SCREENS.map(s => s.section)));

  return (
    <nav className="relative flex flex-col h-full py-3 bg-gradient-to-b from-[#060614]/97 to-[#04040f]/98 border-r border-border-subtle overflow-y-auto w-64 shrink-0 px-2 lg:px-0">
      {/* No manual close button here since it's handled by platform state, but added padding for better layout */}
      {sections.map(section => (
        <div key={section} className="mb-4">
          <div className="font-mono text-[9px] text-text-ghost tracking-[3px] px-4 py-2 border-none uppercase">
            {section}
          </div>
          {SCREENS.filter(s => s.section === section).map(screen => (
            <button
              key={screen.id}
              onClick={() => onScreenChange(screen.id)}
              className={cn(
                "flex items-center gap-2.5 w-full px-4 py-2.5 bg-none border-none border-l-2 border-transparent cursor-pointer font-semibold text-sm text-text-dim tracking-[1px] transition-all relative group",
                activeScreen === screen.id && "bg-neon-violet/15 border-l-neon-violet text-text-bright"
              )}
            >
              <screen.icon size={18} className={cn("opacity-70 group-hover:opacity-100", activeScreen === screen.id && "opacity-100")} />
              <span>{screen.label}</span>
              {screen.badge && (
                <span className="ml-auto px-1.5 py-0.5 bg-neon-red/20 border border-neon-red/40 rounded-[3px] font-mono text-[9px] text-neon-red">
                  {screen.badge}
                </span>
              )}
              {activeScreen === screen.id && (
                <div className="absolute right-0 top-1/4 bottom-1/4 w-[1px] bg-neon-blue shadow-blue" />
              )}
            </button>
          ))}
        </div>
      ))}

      <div className="mt-auto mx-3 border border-border-accent rounded-[4px] p-2.5 bg-neon-violet/5">
        <div className="text-[9px] font-mono text-text-ghost tracking-[2px] mb-1.5">ANOMALY LEVEL</div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-neon-blue to-neon-violet animate-anomaly transition-all duration-1000" 
            style={{ width: `${anomalyLevel}%` }} 
          />
        </div>
        <div className="font-orbitron text-lg font-bold text-center mt-1.5 text-neon-violet">
          {anomalyLevel}%
        </div>
      </div>

      <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-neon-violet via-neon-blue to-neon-violet to-transparent opacity-30" />
    </nav>
  );
}
