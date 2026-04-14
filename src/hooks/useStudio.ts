import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, Personality } from '../types';

export const useStudio = (
  activePersonality: Personality,
  generateAIResponse: (prompt: string | any[], instruction: string, options?: any) => Promise<string | undefined>
) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: 'Neural Interface Active. Stable Diffusion engine synchronized with local hardware.', timestamp: Date.now() }
  ]);
  const [studioInput, setStudioInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [studioRefImage, setStudioRefImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [negativePrompt, setNegativePrompt] = useState('blurry, low resolution, artifacts, mutated limbs, bad anatomy');
  const [sdParams, setSdParams] = useState({
    checkpoint: 'SDXL-V1.0-Base',
    steps: 32,
    cfgScale: 8.0,
    seed: -1,
    aspectRatio: '1:1' as '1:1' | '16:9' | '9:16'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleStudioSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = studioInput.trim();
    if (!prompt && !studioRefImage) return;

    const userMsg: ChatMessage = { role: 'user', text: prompt || 'Frame-to-Image Generation Requested', timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setStudioInput('');
    setIsAiProcessing(true);

    try {
      const isImageRequest = studioRefImage || /\b(generate|image|draw|create|picture|photo|edit|change|add|sd|stable|render)\b/i.test(prompt);
      
      if (isImageRequest) {
        // Simulate image generation
        await new Promise(r => setTimeout(r, 3000));
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: 'Visual Synthesis Complete. Artifact rendered at 2048x2048.',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
          timestamp: Date.now()
        }]);
      } else {
        const response = await generateAIResponse(
          prompt,
          `You are the ${activePersonality.name} AI. ${activePersonality.instruction}`,
          { modelType: 'smart' }
        );
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: response || 'Neural link timeout.',
          timestamp: Date.now()
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'CRITICAL: Visual cortex synchronization failure.', timestamp: Date.now() }]);
    } finally {
      setIsAiProcessing(false);
    }
  }, [studioInput, studioRefImage, activePersonality, generateAIResponse]);

  return {
    chatMessages,
    setChatMessages,
    studioInput,
    setStudioInput,
    isAiProcessing,
    studioRefImage,
    setStudioRefImage,
    negativePrompt,
    setNegativePrompt,
    sdParams,
    setSdParams,
    chatEndRef,
    handleStudioSubmit
  };
};
