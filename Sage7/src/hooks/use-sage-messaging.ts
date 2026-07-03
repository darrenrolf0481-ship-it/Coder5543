'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSage } from '@/lib/sage-context';
import { Message } from '@/core/types';
import { speakText, stopSpeaking } from '@/lib/elevenlabs';

export function useSageMessaging() {
  const { core } = useSage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem('sage_voice') !== 'false'; } catch { return true; }
  });
  const voiceEnabledRef = useRef(voiceEnabled);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    try { localStorage.setItem('sage_voice', String(voiceEnabled)); } catch {}
  }, [voiceEnabled]);

  useEffect(() => {
    setMessages(core.getMessages());

    const onNewMsg = (msg: Message) => {
      setMessages(prev => [...prev.slice(-49), msg]);
      if (msg.role === 'assistant' && voiceEnabledRef.current) {
        speakText(msg.content);
      }
    };

    const onCleared = () => setMessages([]);

    // Also speak 'speak' events emitted by the dream cycle
    const onSpeak = (text: string) => {
      if (voiceEnabledRef.current) speakText(text);
    };

    core.on('new-message', onNewMsg);
    core.on('chat_cleared', onCleared);
    (core as any).on('speak', onSpeak);

    return () => {
      core.off('new-message', onNewMsg);
      core.off('chat_cleared', onCleared);
      (core as any).off('speak', onSpeak);
    };
  }, [core]);

  const sendMessage = useCallback((text: string, images?: string[]) => {
    return core.sendMessage(text, images);
  }, [core]);

  const toggleListening = useCallback(() => {
    const nextState = !core.isListening();
    core.setListening(nextState);
    setListening(nextState);
  }, [core]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      if (prev) stopSpeaking();
      return !prev;
    });
  }, []);

  return { messages, sendMessage, listening, toggleListening, voiceEnabled, toggleVoice };
}
