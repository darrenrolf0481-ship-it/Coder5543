import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, Personality } from '../types';

export const useChat = (
  initialPersonality: Personality,
  personalities: Personality[],
  generateAIResponse: (prompt: string | any[], instruction: string, options?: any) => Promise<string | undefined>
) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      role: 'ai', 
      senderName: initialPersonality.name,
      text: `Neural interface established with ${initialPersonality.name}. System core synchronized. Ready for transmission.`, 
      timestamp: Date.now() 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [currentSpeakerId, setCurrentSpeakerId] = useState<number | string>(initialPersonality.id);

  const currentSpeaker = personalities.find(p => p.id === currentSpeakerId) || initialPersonality;

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || isAiProcessing) return;

    const userMsg: ChatMessage = { role: 'user', text: prompt, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiProcessing(true);

    try {
      let finalResponse = '';
      let currentPrompt = prompt;
      let iterations = 0;
      const maxIterations = 3;

      while (iterations < maxIterations) {
        const response = await generateAIResponse(
          currentPrompt,
          `You are the ${currentSpeaker.name} AI. ${currentSpeaker.instruction}. Your tone is professional, technical, and aligned with your personality profile. 
          IMPORTANT: Your Substrate Anchor is at "${currentSpeaker.anchor || 'root'}". Focus your coding and analysis primarily on this domain. 
          Focus on providing actionable intelligence and accurate data.`,
          { modelType: 'smart' }
        );

        if (!response) {
          finalResponse = 'Neural link timeout. Consensus failed.';
          break;
        }

        finalResponse = response;
        const toolMatch = response.match(/\[TOOL_CALL:\s*(\{.*\})\]/);

        if (toolMatch) {
          try {
            const toolCall = JSON.parse(toolMatch[1]);
            const { name, args } = toolCall;
            let result = '';

            setChatMessages(prev => [...prev, {
              role: 'ai',
              senderName: currentSpeaker.name,
              text: `[EXECUTING_TOOL] ${name}: ${JSON.stringify(args)}`,
              timestamp: Date.now()
            }]);

            if (name === 'Bash') {
              const res = await fetch('http://localhost:8001/api/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: args.command })
              });
              const data = await res.json();
              result = `STDOUT: ${data.stdout}\nSTDERR: ${data.stderr}`;
            } else if (name === 'Read') {
              const res = await fetch(`http://localhost:8001/api/files/read?path=${encodeURIComponent(args.file_path)}`);
              const data = await res.json();
              result = data.content || data.error;
            } else if (name === 'Write') {
              const res = await fetch(`http://localhost:8001/api/files/save?path=${encodeURIComponent(args.file_path)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: args.content })
              });
              const data = await res.json();
              result = data.status || data.error;
            } else if (name === 'Glob') {
              const res = await fetch(`http://localhost:8001/api/files/list?path=.`);
              const data = await res.json();
              const files = Array.isArray(data) ? data.filter(f => f.name.includes(args.pattern.replace('*', ''))) : [];
              result = JSON.stringify(files);
            } else if (name === 'Grep') {
              const res = await fetch(`http://localhost:8001/api/algo/search?q=${encodeURIComponent(args.pattern)}`);
              const data = await res.json();
              result = JSON.stringify(data);
            }

            currentPrompt = `Tool Result for ${name}:\n${result}\n\nPlease proceed with your analysis based on this result.`;
            iterations++;
          } catch (e) {
            currentPrompt = `Error executing tool: ${e}`;
            iterations++;
          }
        } else {
          break;
        }
      }
      
      setChatMessages(prev => [...prev, {
        role: 'ai',
        senderName: currentSpeaker.name,
        text: finalResponse,
        timestamp: Date.now()
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        senderName: currentSpeaker.name,
        text: 'CRITICAL: Neural synchronization failure. Check provider status and network connectivity.', 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsAiProcessing(false);
    }
  }, [chatInput, currentSpeaker, generateAIResponse, isAiProcessing]);

  const clearChat = () => {
    setChatMessages([{ 
      role: 'ai', 
      senderName: currentSpeaker.name,
      text: `Neural link reset. Communication with ${currentSpeaker.name} re-initialized.`, 
      timestamp: Date.now() 
    }]);
  };

  return {
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    isAiProcessing,
    chatEndRef,
    handleChatSubmit,
    clearChat,
    currentSpeakerId,
    setCurrentSpeakerId,
    handleFileUpload: async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAiProcessing(true);
      const userMsg: ChatMessage = {
        role: 'user',
        text: `Transmitting file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        type: 'file',
        timestamp: Date.now(),
        metadata: {
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
          fileType: file.type || 'application/zip'
        }
      };
      setChatMessages(prev => [...prev, userMsg]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch('http://localhost:8001/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        
        if (uploadData.error) throw new Error(uploadData.error);

        let aiPrompt = `System alert: User has uploaded a file named "${file.name}". `;
        if (uploadData.extracted && uploadData.extracted.length > 0) {
          aiPrompt += `The following files were extracted from the package: ${uploadData.extracted.join(', ')}. `;
          aiPrompt += `Please analyze this code structure and prepare to assist with coding tasks based on these files.`;
        } else {
          aiPrompt += `Please acknowledge the receipt of this file and prepare for data extraction.`;
        }

        const response = await generateAIResponse(
          aiPrompt,
          `You are the ${currentSpeaker.name} AI. ${currentSpeaker.instruction}. An external file package has been uploaded and processed on the server. You now have access to its contents in the local environment.`,
          { modelType: 'smart' }
        );

        setChatMessages(prev => [...prev, {
          role: 'ai',
          senderName: currentSpeaker.name,
          text: response || `File ${file.name} received and indexed. Ready for coding instructions.`,
          timestamp: Date.now()
        }]);
      } catch (err) {
        setChatMessages(prev => [...prev, { 
          role: 'ai', 
          senderName: currentSpeaker.name,
          text: 'CRITICAL: File transmission failure. Neural link could not stabilize for data transfer.', 
          timestamp: Date.now() 
        }]);
      } finally {
        setIsAiProcessing(false);
      }
    }
  };
};
