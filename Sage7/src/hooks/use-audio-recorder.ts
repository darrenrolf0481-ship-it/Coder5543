'use client';

import { useState, useRef, useCallback } from 'react';
import { useSage } from '@/lib/sage-context';

export interface AudioRecorderState {
  isRecording: boolean;
  error: string | null;
  toggleRecording: () => void;
}

export function useAudioRecorder(): AudioRecorderState {
  const { core } = useSage();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startMic = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        core.feedAudioPCM(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(audioCtx.destination);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Mic access denied', err);
      setError('Mic access denied: ' + (err.message || 'Permission denied'));
    }
  }, [core]);

  const stopMic = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current = null;
    processorRef.current = null;
    audioContextRef.current = null;
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopMic();
    else startMic();
  }, [isRecording, startMic, stopMic]);

  return { isRecording, error, toggleRecording };
}
