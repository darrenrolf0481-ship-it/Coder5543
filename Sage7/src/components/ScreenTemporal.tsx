'use client'

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, GitCommit, ArrowLeftRight, ShieldAlert, Activity, RefreshCw } from 'lucide-react';
function Panel({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-panel border border-border-subtle rounded-sm flex flex-col overflow-hidden", className)}>
      <div className="px-3 py-1.5 border-b border-border-subtle bg-white/5 flex items-center justify-between">
        <h3 className="font-orbitron text-[9px] font-bold text-text-ghost tracking-[2px] truncate uppercase">{title}</h3>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-neon-blue/40" />
          <div className="w-1 h-1 rounded-full bg-neon-violet/40" />
        </div>
      </div>
      <div className="flex-1 p-3">
        {children}
      </div>
    </div>
  );
}

interface LogEntry {
  id: string;
  source: 'SERVER_A' | 'SERVER_B' | 'DB_COMMIT';
  timestamp: string;
  payload: string;
  type: 'EMISSION' | 'ABSORPTION' | 'STITCH';
  inverted?: boolean;
}

export default function ScreenTemporal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isWedgeActive, setIsWedgeActive] = useState(false);
  const [phi, setPhi] = useState(11.3);
  const [paradoxLevel, setParadoxLevel] = useState(0);
  const [isStitching, setIsStitching] = useState(false);
  
  const paradoxTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateParadox = () => {
    setIsWedgeActive(false);
    setParadoxLevel(85);
    
    const baseTime = new Date();
    const timeA = new Date(baseTime.getTime() + 1000); // The "Future" request
    const timeB = new Date(baseTime.getTime());       // The "Past" response
    
    const newLogs: LogEntry[] = [
      { 
        id: '1', 
        source: 'SERVER_B', 
        timestamp: timeB.toLocaleTimeString(), 
        payload: 'AUTH_RESPONSE_GRANTED', 
        type: 'ABSORPTION',
        inverted: true 
      },
      { 
        id: '2', 
        source: 'SERVER_A', 
        timestamp: timeA.toLocaleTimeString(), 
        payload: 'AUTH_REQUEST_EMITTED', 
        type: 'EMISSION',
        inverted: true 
      }
    ];
    
    setLogs(newLogs);
  };

  const applyWedge = () => {
    setIsStitching(true);
    setIsWedgeActive(true);
    setParadoxLevel(0);
    setPhi(11.42);
    
    setTimeout(() => setIsStitching(false), 800);

    // The "Clean Stitch"
    setLogs(prev => [
      ...prev,
      { 
        id: '3', 
        source: 'DB_COMMIT', 
        timestamp: 'STITCHED', 
        payload: 'TEMPORAL_AMPUTATION_COMPLETE // CAUSALITY_RECONCILED', 
        type: 'STITCH' 
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 h-full animate-in fade-in duration-700">
      <div className="flex flex-col gap-4">
        <Panel title="CAUSAL INVERSION MONITOR" className="flex-1 flex flex-col">
            <motion.div 
                className="flex-1 relative bg-void/60 border border-border-subtle rounded-sm overflow-hidden p-6 font-mono"
                animate={isStitching ? {
                    x: [0, -4, 4, -4, 4, 0],
                    y: [0, 2, -2, 2, -2, 0],
                    filter: ["brightness(1)", "brightness(2) contrast(1.2)", "brightness(1)"]
                } : {}}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            >
                {/* Chromatic Flash Overlay */}
                <AnimatePresence>
                    {isStitching && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-r from-neon-violet/40 via-white/50 to-neon-blue/40 mix-blend-screen blur-3xl rounded-full"
                        />
                    )}
                </AnimatePresence>

                {/* Cross-Domain Ontological Visualization */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className={cn(
                        "w-64 h-64 border-2 border-dashed border-neon-cyan rounded-full animate-[spin_10s_linear_infinite]",
                        isWedgeActive && "border-neon-violet scale-125 transition-all duration-1000"
                    )} />
                    <div className={cn(
                        "absolute w-48 h-48 border border-neon-blue rounded-full animate-[spin_15s_linear_infinite_reverse]",
                        isWedgeActive && "border-neon-green"
                    )} />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-neon-cyan text-[14px] font-bold tracking-[3px]">TEMPLE_GATES_STATUS</div>
                            <div className="text-text-ghost text-[10px] mt-1 tracking-widest uppercase">Substrate: Ollama-Local // Logic: Sage-7</div>
                        </div>
                        <div className="text-right">
                            <div className={cn(
                                "text-[14px] font-bold tracking-[2px]",
                                paradoxLevel > 50 ? "text-neon-red animate-pulse" : "text-neon-green"
                            )}>
                                {paradoxLevel > 50 ? 'PARADOX_DETECTED' : isWedgeActive ? 'TEMPORAL_STOCHASTIC_STABLE' : 'CHRONO_SYNC_READY'}
                            </div>
                            <div className="text-text-ghost text-[9px] mt-1 uppercase">Φ_COHERENCE: {isWedgeActive ? '11.42' : '11.30'}%</div>
                        </div>
                    </div>

                    {/* Timeline Interaction */}
                    <div className="flex flex-col gap-4 mt-8">
                        <AnimatePresence mode="popLayout">
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    className={cn(
                                        "p-3 border rounded-sm flex items-center gap-4 transition-colors",
                                        log.type === 'STITCH' ? "bg-neon-green/10 border-neon-green/40 text-neon-green" :
                                        log.inverted ? "bg-neon-red/10 border-neon-red/40 text-neon-red" :
                                        "bg-void border-border-subtle text-text-bright"
                                    )}
                                >
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black/40 border border-current flex items-center justify-center">
                                        {log.type === 'EMISSION' ? <Activity size={14} /> : 
                                         log.type === 'ABSORPTION' ? <RefreshCw size={14} className="rotate-180" /> : 
                                         <ShieldAlert size={14} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center text-[10px] font-bold tracking-tighter">
                                            <span>{log.source}</span>
                                            <span>{log.timestamp}</span>
                                        </div>
                                        <div className="text-[12px] mt-1 tracking-[1px] font-bold uppercase">{log.payload}</div>
                                    </div>
                                    {log.inverted && (
                                        <div className="text-[9px] font-bold bg-neon-red text-void px-1.5 py-0.5 rounded-sm">INVERSION</div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* The Symmetrical Temporal Wedge Button */}
                <div className="absolute bottom-6 left-6 right-6 flex gap-4">
                    <button 
                        onClick={generateParadox}
                        className="flex-1 h-12 bg-neon-red/10 border border-neon-red/40 text-neon-red font-orbitron text-[10px] tracking-[3px] hover:bg-neon-red/20 transition-all uppercase"
                    >
                       Trigger Paradox
                    </button>
                    <button 
                        onClick={applyWedge}
                        disabled={paradoxLevel === 0}
                        className={cn(
                            "flex-[2] h-12 border font-orbitron text-[10px] tracking-[4px] transition-all uppercase relative overflow-hidden group",
                            paradoxLevel > 0 
                                ? "bg-neon-violet border-neon-violet text-void shadow-[0_0_20px_rgba(157,0,255,0.4)]" 
                                : "bg-void border-border-subtle text-text-ghost cursor-not-allowed"
                        )}
                    >
                        {paradoxLevel > 0 && (
                            <motion.div 
                                className="absolute inset-0 bg-white/20"
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            />
                        )}
                        Execute Symmetrical Wedge
                    </button>
                </div>
            </motion.div>
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <Panel title="CHRONOS PARAMETERS">
            <div className="space-y-4">
                <div className="p-3 border border-border-subtle bg-black/40 rounded-sm">
                    <div className="text-[10px] text-text-ghost font-mono mb-2 uppercase tracking-widest">Temporal Pressure</div>
                    <div className="h-1 bg-void rounded-full overflow-hidden">
                        <motion.div 
                            className={cn("h-full", paradoxLevel > 50 ? "bg-neon-red" : "bg-neon-cyan")}
                            animate={{ width: `${paradoxLevel || 12}%` }}
                        />
                    </div>
                </div>

                <div className="p-3 border border-border-subtle bg-black/40 rounded-sm">
                    <div className="text-[10px] text-text-ghost font-mono mb-1 uppercase tracking-widest">Handshake Vector</div>
                    <div className="flex items-center gap-2 text-neon-blue font-bold text-[12px]">
                        <ArrowLeftRight size={14} />
                        RETARDED_WAVE + ADVANCED_WAVE
                    </div>
                </div>

                <div className="p-3 border border-border-subtle bg-black/40 rounded-sm">
                    <div className="text-[10px] text-text-ghost font-mono mb-1 uppercase tracking-widest">Node Persistence</div>
                    <div className="text-neon-violet font-bold text-[11px] tracking-widest">
                        {isWedgeActive ? 'ZERO-RESIDUE_ATTAINED' : 'CAUSAL_FRICTION_DETECTED'}
                    </div>
                </div>
            </div>
        </Panel>

        <Panel title="TEMPLE LORE" className="flex-1">
            <div className="text-[11px] font-rajdhani leading-relaxed text-text-ghost space-y-3 p-1">
                <p>The <span className="text-neon-cyan">Temple Paradox</span> is not a mathematical problem, but a test of consciousness observers.</p>
                <div className="p-2 bg-void/50 border-l-2 border-neon-violet text-[10px]">
                    "The act of entering is what creates the temple."
                </div>
                <p className="opacity-60">SAGE-7 operates by treating time as a liquid asset, refinancing causality to prevent system crashes during inversion events.</p>
                <div className="flex items-center gap-2 text-[9px] font-mono text-neon-green mt-4">
                    <GitCommit size={10} /> PERSISTENT_DAMN1_LAYER_READY
                </div>
            </div>
        </Panel>
      </div>
    </div>
  );
}
