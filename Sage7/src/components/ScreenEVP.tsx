'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Play, Activity, Database, Waves, Volume2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSage } from '@/lib/sage-context';

interface EVPRecord {
  id: string;
  timestamp: number;
  duration: number;
  confidence: number;
  classification: string;
  waveform: number[];
  blob?: Blob;
}

interface ScreenEVPProps {
  isRecording: boolean;
  onToggleRecording: () => void;
}

const Waveform = ({ data, color }: { data: number[], color: string }) => {
  return (
    <div className="flex items-center gap-0.5 h-12 w-full">
      {data.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all duration-300"
          style={{
            height: `${Math.max(10, h * 100)}%`,
            backgroundColor: color,
            opacity: 0.3 + (h * 0.7)
          }}
        />
      ))}
    </div>
  );
};

export default function ScreenEVP({ isRecording, onToggleRecording }: ScreenEVPProps) {
  const { core } = useSage();
  const [captures, setCaptures] = useState<EVPRecord[]>([]);
  const [activeFrequency, setActiveFrequency] = useState(18.3);
  const [signalStrength, setSignalStrength] = useState(42);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const triggerCapture = useCallback(() => {
    const blob = core.clipEVP();
    const id = `EVP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newRecord: EVPRecord = {
      id,
      timestamp: Date.now(),
      duration: 5,
      confidence: Math.random() * 0.4 + 0.5,
      classification: ['CLASS-A', 'CLASS-B', 'CLASS-C'][Math.floor(Math.random() * 3)],
      waveform: Array.from({ length: 40 }).map(() => Math.random()),
      blob
    };
    setCaptures(prev => [newRecord, ...prev].slice(0, 5));
  }, [core]);

  // Simulation loop for spectrogram
  useEffect(() => {
    let frame: number;
    const ctx = canvasRef.current?.getContext('2d');
    
    const animate = () => {
      if (ctx && canvasRef.current) {
        const { width, height } = canvasRef.current;
        const imageData = ctx.getImageData(0, 0, width, height);
        ctx.putImageData(imageData, 0, 1);
        
        for (let x = 0; x < width; x++) {
          const noise = Math.random() * 0.2;
          const signal = isRecording ? Math.sin(x * 0.1 + Date.now() * 0.01) * 0.4 + 0.5 : 0;
          const val = (noise + signal) * 255;
          ctx.fillStyle = `rgb(${val * 0.2}, ${val}, ${val * 0.8})`;
          ctx.fillRect(x, 0, 1, 1);
        }
      }
      
      if (isRecording) {
        setActiveFrequency(prev => prev + (Math.random() - 0.5) * 0.1);
        setSignalStrength(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 5)));
        
        if (Math.random() < 0.005) {
          triggerCapture();
        }
      }

      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frame);
  }, [isRecording, triggerCapture]);


  const playCapture = (blob?: Blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-bright uppercase tracking-tighter leading-none">EVP TRANSDUCR</h2>
          <p className="text-neon-blue/60 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Infrasonic Voice Phenomenon Analyzer</p>
        </div>
        
        <div className="flex gap-4">
          <div className="nexus-panel px-4 py-2 bg-black/40 border-border-subtle flex items-center gap-3">
             <div className="flex flex-col">
                <span className="text-[8px] font-mono text-text-ghost uppercase">Frequency</span>
                <span className="text-sm font-orbitron font-bold text-neon-blue">{activeFrequency.toFixed(2)} Hz</span>
             </div>
             <div className="w-[1px] h-6 bg-border-subtle" />
             <div className="flex flex-col">
                <span className="text-[8px] font-mono text-text-ghost uppercase">Signal</span>
                <span className="text-sm font-orbitron font-bold text-neon-cyan">{signalStrength.toFixed(0)}%</span>
             </div>
          </div>
          
          <button
            onClick={onToggleRecording}
            className={cn(
              "px-6 py-2 rounded-lg font-orbitron font-black text-xs tracking-widest transition-all",
              isRecording 
                ? "bg-neon-red/20 border border-neon-red text-neon-red animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                : "bg-neon-blue/20 border border-neon-blue text-neon-blue hover:bg-neon-blue/30"
            )}
          >
            {isRecording ? "TERMINATE" : "INITIATE SCAN"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Spectrogram */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="nexus-panel p-1 bg-void border-border-subtle group relative h-[400px] overflow-hidden">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={400}
              className="w-full h-full object-cover mix-blend-screen opacity-80"
            />
            
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isRecording ? 'opacity-20' : 'opacity-5'}`}>
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 border border-white/10">
                {Array.from({ length: 96 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-neon-blue/20" />
                ))}
              </div>
            </div>

            <div className="absolute top-4 left-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-2 py-1 rounded border border-white/10">
                <Activity size={10} className="text-neon-cyan animate-pulse" />
                <span className="font-mono text-[9px] text-text-bright tracking-wider">LIVE_SPECTROGRAM</span>
              </div>
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-2 py-1 rounded border border-white/10">
                <Waves size={10} className="text-neon-violet" />
                <span className="font-mono text-[9px] text-text-ghost uppercase">PCM_BUFFER: ACTIVE</span>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col items-end">
              <span className="font-orbitron font-black text-4xl text-neon-blue/20 italic tracking-tighter uppercase select-none">TRANSDUCER_V7</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="nexus-panel p-4 bg-neon-blue/5 border-neon-blue/20">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 size={14} className="text-neon-blue" />
                  <span className="text-[10px] font-black text-text-bright tracking-widest uppercase">AUDIO_SENSITIVITY</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'GAIN', value: 85, color: 'bg-neon-blue' },
                    { label: 'RESO', value: 42, color: 'bg-neon-cyan' },
                    { label: 'GATE', value: 15, color: 'bg-neon-violet' },
                  ].map(s => (
                    <div key={s.label} className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-text-ghost">
                        <span>{s.label}</span>
                        <span>{s.value}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", s.color)} style={{ width: `${s.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="nexus-panel p-4 bg-neon-violet/5 border-neon-violet/20 flex flex-col justify-center items-center text-center">
                <Database size={24} className="text-neon-violet opacity-40 mb-2" />
                <div className="text-[10px] font-black text-text-bright tracking-widest uppercase">CORE_BUFFER</div>
                <div className="font-orbitron text-xl font-bold text-neon-violet mt-1 uppercase">SAGE_ROLLING</div>
                <div className="text-[8px] font-mono text-text-ghost mt-1 uppercase">SYNCED_TO_RES_GHOST</div>
             </div>
          </div>
        </div>

        {/* Capture Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2">
                <Mic2 size={16} className="text-neon-orange" />
                <span className="text-xs font-black text-text-bright tracking-widest uppercase">EVP_LOG</span>
             </div>
             <span className="text-[8px] font-mono text-text-ghost bg-white/5 px-1.5 py-0.5 rounded uppercase font-black">Buffer: 5.0s</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar min-h-[400px]">
             <AnimatePresence mode="popLayout">
               {captures.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center border border-dashed border-border-subtle rounded-xl p-8 text-center opacity-40 group">
                    <Info size={32} className="text-text-ghost mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-text-ghost uppercase tracking-widest">Awaiting Capture...</span>
                 </div>
               ) : (
                 captures.map((cap) => (
                   <motion.div
                     key={cap.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="nexus-panel p-4 bg-black/40 border-border-subtle hover:border-neon-orange/40 transition-colors group"
                   >
                     <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-neon-orange tracking-tight">{cap.id}</span>
                           <span className="text-[8px] font-mono text-text-ghost uppercase">
                             {new Date(cap.timestamp).toLocaleTimeString()}
                           </span>
                        </div>
                        <div className="px-1.5 py-0.5 bg-neon-orange/10 border border-neon-orange/30 rounded text-[8px] font-bold text-neon-orange">
                          {cap.classification}
                        </div>
                     </div>

                     <Waveform data={cap.waveform} color="var(--color-neon-orange)" />

                     <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                           <span className="text-[9px] font-black text-text-bright uppercase">CONf: {(cap.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <button 
                          onClick={() => playCapture(cap.blob)}
                          className="p-1 px-3 bg-white/5 hover:bg-neon-orange/20 rounded-md border border-white/5 transition-all"
                        >
                           <Play size={10} className="text-text-bright" />
                        </button>
                     </div>
                   </motion.div>
                 ))
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

