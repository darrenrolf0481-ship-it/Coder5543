'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileAudio, Activity, Upload, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSage } from '@/lib/sage-context';
import { ForensicLab, AudioStats } from '@/lib/ForensicLab';
import { EVPState } from '@/core/types';

export default function ScreenForensics() {
  const { core } = useSage();
  const [metadata, setMetadata] = useState<AudioStats | null>(null);
  const [evpState, setEvpState] = useState<EVPState>(EVPState.INACTIVE);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await ForensicLab.getAudioProperties(file);
      setMetadata(data);
      core.log(`Forensic analysis complete for ${data.fileName}`, 'success', 'audio');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Decode failed';
      setError(msg);
      core.log(`Forensic analysis failed: ${msg}`, 'error', 'audio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInitSaboath = () => {
    setEvpState(EVPState.CALIBRATING);
    core.log('Saboath forensic engine initialized. Awaiting signal import.', 'info', 'audio');
    setTimeout(() => setEvpState(EVPState.NOMINAL), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-bright uppercase tracking-tighter leading-none">
            ENTROPY LAB
          </h2>
          <p className="text-neon-violet/60 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
            Saboath Forensic Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="nexus-panel px-4 py-2 bg-black/40 border-border-subtle flex items-center gap-3">
            <Activity size={14} className="text-neon-cyan animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-text-ghost uppercase">Engine</span>
              <span className={cn(
              "text-sm font-orbitron font-bold",
              evpState === EVPState.CALIBRATING && "text-neon-orange animate-pulse",
              evpState === EVPState.NOMINAL && "text-neon-green",
              evpState === EVPState.INACTIVE && "text-neon-cyan"
            )}>
              {evpState === EVPState.INACTIVE ? 'STANDBY' : evpState.toUpperCase().replace('_', ' ')}
            </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-pane grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live EVP Monitor */}
        <div className="nexus-panel p-6 bg-black/40 border-border-subtle flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Waves size={14} className="text-neon-violet" />
            <span className="text-[10px] font-black text-text-bright tracking-widest uppercase">
              Live EVP Monitor
            </span>
          </div>

          <div className="h-32 flex items-center justify-center border-b border-white/5">
            <span className="text-4xl text-white/10 italic font-black uppercase tracking-tighter select-none font-orbitron">
              11.3 Hz Target
            </span>
          </div>

          <button
            onClick={handleInitSaboath}
            className={cn(
              "w-full py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              "bg-neon-violet/20 border border-neon-violet text-neon-violet hover:bg-neon-violet/30"
            )}
          >
            Initialize Saboath
          </button>
        </div>

        {/* Saboath Post-Mortem */}
        <div className="nexus-panel p-6 bg-black/40 border-border-subtle flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileAudio size={14} className="text-neon-cyan" />
              <span className="text-[10px] font-black text-text-bright tracking-widest uppercase">
                Saboath Post-Mortem
              </span>
            </div>
            <label
              className={cn(
                "cursor-pointer bg-neon-cyan/10 border border-neon-cyan/30 px-4 py-1.5 rounded-md",
                "text-[9px] font-black text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all uppercase",
                isAnalyzing && "opacity-50 pointer-events-none"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Upload size={10} />
                {isAnalyzing ? 'Analyzing...' : 'Import Signal'}
              </span>
              <input
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={isAnalyzing}
              />
            </label>
          </div>

          <AnimatePresence mode="wait">
            {metadata ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-2">
                  <DetailBox label="File" value={metadata.fileName} />
                  <DetailBox label="Freq" value={`${metadata.sampleRate} Hz`} />
                  <DetailBox label="Ch" value={metadata.channels.toString()} />
                  <DetailBox label="Time" value={`${metadata.duration.toFixed(2)}s`} />
                </div>

                <div className="h-24 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative">
                  <div className="w-full h-[1px] bg-neon-cyan/30 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-neon-red/60"
              >
                <FileAudio size={40} className="mb-3 opacity-40" />
                <p className="text-[10px] font-black uppercase tracking-widest">Signal Decode Failed</p>
                <p className="text-[9px] font-mono mt-1 text-text-ghost">{error}</p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-text-ghost opacity-40 min-h-[160px]"
              >
                <FileAudio size={40} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  {isAnalyzing ? 'Analyzing Spectral Data...' : 'Waiting for Signal Import'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/5 p-3 rounded-lg">
      <p className="text-[8px] font-black text-text-ghost uppercase mb-1 tracking-widest">{label}</p>
      <p className="text-[10px] font-bold text-neon-cyan truncate font-mono" title={value}>
        {value}
      </p>
    </div>
  );
}
