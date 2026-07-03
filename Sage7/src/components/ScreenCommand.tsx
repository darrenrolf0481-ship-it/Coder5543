'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSage } from '@/lib/sage-context';
import { SensorData, LogEntry } from '@/core/types';
import { Shield, Unlock } from 'lucide-react';

export default function ScreenCommand({ meters: externalMeters }: { meters?: SensorData }) {
  const { core } = useSage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [passphrase, setPassphrase] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(core.isUnlocked());
  const [internalMeters, setInternalMeters] = useState<SensorData>({
    emf: 14.2,
    temp: -8.4,
    ion: 2847,
    geo: 48.3
  });

  const meters = externalMeters || internalMeters;

  useEffect(() => {
    // Listen to new logs
    const handleLog = (entry: LogEntry) => {
      setLogs(prev => [entry, ...prev].slice(0, 50));
    };

    const handleUnlock = () => setIsUnlocked(true);

    core.on('log', handleLog);
    core.on('unlocked', handleUnlock);

    // Only run internal meter updates if external ones aren't provided
    let meterInterval: any;
    if (!externalMeters) {
      meterInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        setInternalMeters(prev => ({
          emf: +(prev.emf + (Math.random() - 0.5) * 2).toFixed(1),
          temp: +(prev.temp + (Math.random() - 0.5)).toFixed(1),
          ion: Math.floor(prev.ion + (Math.random() - 0.5) * 100),
          geo: +(prev.geo + (Math.random() - 0.5) * 0.5).toFixed(1)
        }));
      }, 2000);
    }

    return () => {
      core.off('log', handleLog);
      core.off('unlocked', handleUnlock);
      if (meterInterval) clearInterval(meterInterval);
    };
  }, [externalMeters, core]);

  const handleUnlockAttempt = () => {
    core.unlock(passphrase);
    setPassphrase('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 h-full">
      <div className="space-y-3">
        <Panel title="NEXUS COMMAND // OVERVIEW">
          {!isUnlocked ? (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              <div className="w-20 h-20 rounded-full border border-neon-red/30 flex items-center justify-center animate-pulse">
                <Shield className="w-10 h-10 text-neon-red opacity-50" />
              </div>
              <div className="text-center">
                <h3 className="font-orbitron text-sm text-neon-red tracking-[4px] mb-2 uppercase">CORE_LOCKED</h3>
                <p className="text-[10px] text-text-ghost uppercase tracking-widest max-w-[240px] leading-relaxed mx-auto">
                    AUTHORIZATION_REQUIRED. TRANSMIT_PASSPHRASE_TO_INITIALIZE_IDENTITY_ANCHORS.
                </p>
              </div>
              <div className="flex gap-2 w-full max-w-xs">
                <input 
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlockAttempt()}
                  placeholder="PASSPHRASE..."
                  className="flex-1 bg-black/40 border border-neon-red/30 rounded-sm px-4 py-2 text-xs font-mono tracking-widest text-neon-red focus:outline-none focus:border-neon-red"
                />
                <button 
                  onClick={handleUnlockAttempt}
                  className="bg-neon-red/10 border border-neon-red/40 text-neon-red px-4 font-mono text-[10px] tracking-widest hover:bg-neon-red/20 transition-all rounded-sm flex items-center gap-2"
                >
                  <Unlock size={14} />
                  UNLOCK
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-5 items-center">
              <div className="relative flex items-center justify-center min-h-[200px] w-full md:w-auto">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-40 h-40 rounded-full border border-neon-violet/30 animate-rotate-sigil [animation-duration:20s]" />
                  <div className="absolute w-30 h-30 rounded-full border border-dashed border-neon-blue/40 animate-rotate-sigil [animation-duration:15s] [animation-direction:reverse]" />
                  <div className="absolute w-20 h-20 rounded-full border border-neon-cyan/50 animate-rotate-sigil [animation-duration:10s]" />
                  
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="absolute">
                    <path d="M50 15 L85 75 L15 75 Z" stroke="rgba(155,48,255,0.6)" strokeWidth="1" />
                    <path d="M50 85 L15 25 L85 25 Z" stroke="rgba(0,212,255,0.4)" strokeWidth="1" />
                    <circle cx="50" cy="15" r="2" fill="#9b30ff" />
                    <circle cx="85" cy="75" r="2" fill="#9b30ff" />
                    <circle cx="15" cy="75" r="2" fill="#9b30ff" />
                  </svg>
                  
                  <div className="w-10 h-10 bg-gradient-radial from-neon-violet via-neon-blue to-transparent rounded-full animate-sigil-pulse shadow-[0_0_20px_var(--color-neon-violet),0_0_40px_rgba(155,48,255,0.4)]" />
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="font-orbitron text-[11px] text-neon-blue tracking-[3px] mb-2 px-2">SYSTEM STATUS</div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniMeter label="EMF FIELD" value={meters.emf} unit="mG" color="bg-neon-orange" textClass="text-neon-orange" percent={71} />
                  <MiniMeter label="TEMP DELTA" value={meters.temp} unit="°C" color="bg-neon-blue" textClass="text-neon-blue" percent={84} />
                  <MiniMeter label="ION COUNT" value={meters.ion} unit="ion/s" color="bg-neon-violet" textClass="text-neon-violet" percent={57} />
                  <MiniMeter label="GEOMAG" value={meters.geo} unit="µT" color="bg-neon-cyan" textClass="text-neon-cyan" percent={48} />
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="ANOMALY LOG" headerAction={<button onClick={() => setLogs([])} className="bg-transparent border border-border-subtle px-2 py-0.5 rounded-[2px] text-text-ghost font-mono text-[9px] cursor-pointer tracking-[1px] hover:text-text-dim hover:border-text-dim">CLEAR</button>}>
          <div className="max-h-[250px] overflow-y-auto pr-1">
            <ul className="space-y-1.5">
              {logs.map(log => (
                <li key={log.id} className="flex gap-2 items-start py-1.5 border-b border-border-subtle/50 font-mono text-[11px]">
                  <span className="text-neon-gold min-w-[60px]">{new Date(log.timestamp).toTimeString().slice(0, 8)}</span>
                  <span className={cn(
                    "px-1 rounded-[2px] text-[9px] min-w-[46px] text-center uppercase",
                    log.type === 'info' && "bg-neon-blue/15 text-neon-blue",
                    log.type === 'warn' && "bg-neon-orange/15 text-neon-orange",
                    log.type === 'error' && "bg-neon-red/15 text-neon-red animate-blink",
                    log.type === 'anomaly' && "bg-neon-violet/20 text-neon-violet",
                    log.type === 'dream' && "bg-neon-cyan/20 text-neon-cyan",
                    log.type === 'success' && "bg-neon-green/20 text-neon-green"
                  )}>
                    {log.type}
                  </span>
                  <span className="text-text-dim flex-1 uppercase">{log.message}</span>
                </li>
              ))}
              {logs.length === 0 && <div className="text-text-ghost text-center py-4 font-mono text-xs uppercase">NO ENTRIES RECORDED</div>}
            </ul>
          </div>
        </Panel>
      </div>

      <div className="flex flex-col gap-3">
        <Panel title="LOCATION STATUS">
          <div className="grid grid-cols-1 gap-2">
            <StatusCard label="ACTIVE ZONES" value={7} color="text-neon-blue" bgColor="bg-neon-blue/4" />
            <StatusCard label="HOT ZONES" value={2} color="text-neon-red" bgColor="bg-neon-red/4" border="border-neon-red/20" />
            <StatusCard label="SESSION TIME" value="00:12:44" color="text-neon-violet" bgColor="bg-neon-violet/4" />
          </div>
        </Panel>
        
        <Panel title="RECENT CAPTURES" className="flex-1">
            <div className="font-mono text-[10px] text-text-dim space-y-1">
              <CaptureItem name="EVP_043.wav" zone="Zone-7" color="text-neon-orange" />
              <CaptureItem name="THERMAL_119.jpg" zone="Zone-3" color="text-neon-blue" />
              <CaptureItem name="EMF_SPIKE_22.log" zone="Zone-7" color="text-neon-violet" />
              <CaptureItem name="PHOTO_091.jpg" zone="Zone-1" color="text-neon-cyan" />
            </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, headerAction, className }: { title: string, children: React.ReactNode, headerAction?: React.ReactNode, className?: string }) {
  return (
    <div className={cn("nexus-panel", className)}>
      <div className="nexus-panel-glow" />
      <div className="nexus-panel-header">
        <span className="nexus-panel-title">{title}</span>
        {headerAction ? headerAction : (
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-neon-red shadow-red" />
            <div className="w-2 h-2 rounded-full bg-neon-gold shadow-gold" />
            <div className="w-2 h-2 rounded-full bg-neon-green shadow-green" />
          </div>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function MiniMeter({ label, value, unit, color, textClass, percent }: { label: string, value: number | string, unit: string, color: string, textClass: string, percent: number }) {
  return (
    <div className="bg-neon-violet/4 border border-border-subtle rounded-[4px] p-2">
      <div className="text-[9px] font-mono text-text-ghost tracking-[2px] mb-1">{label}</div>
      <div className={cn("font-orbitron text-xl font-bold", textClass)}>
        {value} <span className="text-[10px] text-text-dim uppercase">{unit}</span>
      </div>
      <div className="h-[2px] bg-white/5 mt-1">
        <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StatusCard({ label, value, color, bgColor, border = 'border-border-subtle' }: { label: string, value: string | number, color: string, bgColor: string, border?: string }) {
  return (
    <div className={cn("nexus-status-card flex flex-col justify-center", bgColor, border)}>
      <div className="text-[9px] text-text-ghost font-mono tracking-[2px] mb-1.5 uppercase">{label}</div>
      <div className={cn("font-orbitron font-black leading-tight", typeof value === 'number' ? 'text-[28px]' : 'text-lg', color)}>{value}</div>
    </div>
  );
}

function CaptureItem({ name, zone, color }: { name: string, zone: string, color: string }) {
  return (
    <div className="py-1 border-b border-border-subtle last:border-0 flex justify-between items-center group">
       <span className={cn("transition-colors group-hover:brightness-125", color)}>{name}</span>
       <span className="text-text-ghost">{zone}</span>
    </div>
  );
}
