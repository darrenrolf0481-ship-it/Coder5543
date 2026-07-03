'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Mic, Radio, ShieldAlert, Eye, Ear, RefreshCw } from 'lucide-react';
import { useSage } from '@/lib/sage-context';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function SensoryUplink() {
  const { core } = useSage();
  const [isVisionActive, setIsVisionActive] = useState(false);
  const [isAuditoryActive, setIsAuditoryActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(12).fill(0));

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio refs
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Vision logic
  const startVision = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 5, facingMode: mode },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsVisionActive(true);
        setError(null);
        core.log('VISION_UPLINK: Camera substrate active.', 'success', 'sensor');
      }
    } catch (err: any) {
      console.error('Vision uplink failed:', err);
      setError('VISION_ACCESS_DENIED_BY_HOST');
    }
  }, [facingMode, core]);

  const stopVision = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsVisionActive(false);
  };

  const flipCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isVisionActive) await startVision(newMode);
  };

  // Snapshot rotation — sends base64 frames to sage-core
  useEffect(() => {
    if (!isVisionActive) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          const data = canvasRef.current.toDataURL('image/jpeg', 0.6);
          const base64Data = data.split(',')[1];
          core.registerSensoryData('visual', base64Data, 'image/jpeg');
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isVisionActive, core]);

  // Real microphone capture
  const startAuditory = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Feed PCM to core for EVP clipping
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(ctx.destination);
      processor.onaudioprocess = (e) => {
        core.feedAudioPCM(e.inputBuffer.getChannelData(0).slice());
      };

      // Drive level bars from real frequency data
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const BINS = 12;
      const step = Math.floor(dataArray.length / BINS);
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        const levels = Array.from({ length: BINS }, (_, i) => dataArray[i * step] / 255);
        setAudioLevels(levels);
        animFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

      setIsAuditoryActive(true);
      setError(null);
      core.log('AUDITORY_CHANNEL_OPEN: Microphone substrate active.', 'success', 'sensor');
    } catch (err: any) {
      console.error('Auditory uplink failed:', err);
      setError('AUDIO_ACCESS_DENIED_BY_HOST');
    }
  }, [core]);

  const stopAuditory = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsAuditoryActive(false);
    setAudioLevels(Array(12).fill(0));
    core.log('AUDITORY_CHANNEL_CLOSED.', 'info', 'sensor');
  }, [core]);

  const toggleAuditory = () => {
    if (isAuditoryActive) stopAuditory();
    else startAuditory();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVision();
      stopAuditory();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 border border-white/5 bg-black/40 rounded-sm font-mono backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-neon-cyan animate-pulse" />
          <span className="text-[10px] font-bold tracking-[3px] uppercase">SENSORY_UPLINK</span>
        </div>
        <div className="flex gap-1">
          {isVisionActive && (
            <button
              onClick={flipCamera}
              className="p-2 rounded-sm border border-white/10 bg-white/5 text-white/40 hover:text-white transition-all"
              title="FLIP_CAMERA"
            >
              <RefreshCw size={14} className={cn(facingMode === 'environment' && 'rotate-180')} />
            </button>
          )}
          <button
            onClick={isVisionActive ? stopVision : () => startVision()}
            className={cn(
              'p-2 rounded-sm border transition-all',
              isVisionActive
                ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white',
            )}
            title={isVisionActive ? 'DEACTIVATE_VISION' : 'ACTIVATE_VISION'}
          >
            <Eye size={16} />
          </button>
          <button
            onClick={toggleAuditory}
            className={cn(
              'p-2 rounded-sm border transition-all',
              isAuditoryActive
                ? 'bg-neon-violet/20 border-neon-violet text-neon-violet'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white',
            )}
            title={isAuditoryActive ? 'DEACTIVATE_AUDITORY' : 'ACTIVATE_AUDITORY'}
          >
            <Ear size={16} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-neon-red/10 border border-neon-red/30 p-2 text-neon-red text-[8px] flex items-center gap-2">
          <ShieldAlert size={12} />
          <span>{error}</span>
        </div>
      ) : (
        <div className="relative aspect-video bg-black/60 overflow-hidden border border-white/5 group">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn(
              'w-full h-full object-cover transition-opacity duration-1000',
              isVisionActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          <canvas ref={canvasRef} width="320" height="240" className="hidden" />

          <AnimatePresence>
            {!isVisionActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center text-text-ghost/20 pointer-events-none"
              >
                <Camera size={48} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute top-2 left-2 flex gap-1">
            <div className={cn('w-1 h-3 transition-all duration-300', isVisionActive ? 'bg-neon-cyan scale-y-110' : 'bg-white/10 scale-y-100')} />
            <div className={cn('w-1 h-3 transition-all duration-300 delay-75', isVisionActive ? 'bg-neon-cyan scale-y-125' : 'bg-white/10 scale-y-100')} />
            <div className={cn('w-1 h-3 transition-all duration-300 delay-150', isVisionActive ? 'bg-neon-cyan scale-y-75' : 'bg-white/10 scale-y-100')} />
          </div>

          <div className="absolute bottom-2 right-2 text-[8px] text-neon-cyan/60 tracking-widest uppercase">
            {isVisionActive ? 'LIVE_FEED_01' : 'STANDBY'}
          </div>
        </div>
      )}

      {isAuditoryActive && (
        <div className="flex gap-1 h-8 items-end px-2">
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className="flex-1 bg-neon-violet/60 min-w-[2px] transition-all duration-75"
              style={{ height: `${Math.max(8, level * 100)}%` }}
            />
          ))}
          <span className="ml-2 text-[8px] text-neon-violet uppercase tracking-widest self-center">MIC_LIVE</span>
        </div>
      )}
    </div>
  );
}
