'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Core Custom Hooks
import { usePersonalities } from '../hooks/usePersonalities';
import { useBrain } from '../hooks/useBrain';
import { useAiOrchestrator } from '../hooks/useAiOrchestrator';
import { useSwarm } from '../hooks/useSwarm';
import { useChatHandlers } from '../hooks/useChatHandlers';

// Custom Zustand-style store
import { useProjectStore } from '../store/useProjectStore';

// Layout components
import { Sidebar } from '../components/layout/Sidebar';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { MainHeader } from '../components/layout/MainHeader';

// Panel views
import { StudioPanel } from '../components/panels/StudioPanel';
import { EditorPanel } from '../components/panels/EditorPanel';
import { TerminalPanel } from '../components/panels/TerminalPanel';
import { ProjectPanel } from '../components/panels/ProjectPanel';
import { BridgePanel } from '../components/panels/BridgePanel';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'editor' | 'terminal' | 'projects' | 'bridge'>('studio');

  // Core systems hooks
  const { personalities, activePersonality } = usePersonalities();
  const { prepareContext } = useBrain();
  
  const { generateAIResponse } = useAiOrchestrator(personalities);
  const swarm = useSwarm({ generateAIResponse });
  const chatHandlers = useChatHandlers({ generateAIResponse, swarm });

  // Selectors from our reactive workspace store
  const projectFiles = useProjectStore((s) => s.projectFiles);
  const activeFileId = useProjectStore((s) => s.activeFileId);
  const editorContent = useProjectStore((s) => s.editorContent);
  const editorLanguage = useProjectStore((s) => s.editorLanguage);
  const terminalOutput = useProjectStore((s) => s.terminalOutput);
  const attachedAgent = useProjectStore((s) => s.attachedAgent);
  const currentMode = useProjectStore((s) => s.currentMode);

  const isDev = currentMode === 'development';

  const setEditorContent = useProjectStore((s) => s.setEditorContent);
  const setActiveFileId = useProjectStore((s) => s.setActiveFileId);
  const setProjectFiles = useProjectStore((s) => s.setProjectFiles);
  const addTerminalOutput = useProjectStore((s) => s.addTerminalOutput);

  // Local chat message logs in the Neural Studio console
  const [chatMessages, setChatMessages] = useState(() => [
    {
      role: 'ai' as const,
      text: 'Neural Command Network ONLINE.\n\nType "attach sage" or "attach cyber" to deploy a developer agent to watch your file editor. Type commands like "run optimize code" or "run secure errors" to initiate swarm updates.',
      timestamp: Date.now(),
    },
  ]);

  // Sync active file changes to the console log for immersive feedback
  useEffect(() => {
    if (activeFileId && attachedAgent) {
      const activeFile = projectFiles.find((f) => f.id === activeFileId);
      if (activeFile) {
        addTerminalOutput(`[CONTEXT] Active file updated: "${activeFile.name}". Agent ${attachedAgent.name.toUpperCase()} has visual link.`);
      }
    }
  }, [activeFileId, attachedAgent, addTerminalOutput, projectFiles]);

  // Sync memory systems with localStorage
  useEffect(() => {
    const lt = localStorage.getItem('longTermMemories');
    if (lt) {
      try {
        useProjectStore.setState({ longTermMemories: JSON.parse(lt) });
      } catch (e) {
        console.error('Failed to parse longTermMemories', e);
      }
    }
    const ag = localStorage.getItem('agentMemories');
    if (ag) {
      try {
        useProjectStore.setState({ agentMemories: JSON.parse(ag) });
      } catch (e) {
        console.error('Failed to parse agentMemories', e);
      }
    }
  }, []);

  useEffect(() => {
    const unsub = useProjectStore.subscribe(() => {
      const s = useProjectStore.getState();
      localStorage.setItem('longTermMemories', JSON.stringify(s.longTermMemories));
    });
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    const unsub = useProjectStore.subscribe(() => {
      const s = useProjectStore.getState();
      localStorage.setItem('agentMemories', JSON.stringify(s.agentMemories));
    });
    return () => {
      unsub();
    };
  }, []);

  const handleStudioSubmit = async (input: string) => {
    await chatHandlers.handleStudioSubmit(input, setChatMessages);
  };

  const handleApplyCode = (code: string) => {
    setEditorContent(code);
    setActiveTab('editor');
    addTerminalOutput('[SYSTEM] Applying AI patch to editor window.');
  };

  return (
    <div id="neural-studio-workspace" className="flex h-screen w-screen bg-[#050508] text-zinc-100 overflow-hidden font-sans select-none pb-16 md:pb-0 relative">
      {/* Atmospheric Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {isDev ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/15 blur-[120px] transition-all duration-500" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[100px] transition-all duration-500" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[40%] rounded-full bg-purple-900/5 blur-[150px] transition-all duration-500" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-950/15 blur-[120px] transition-all duration-500" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-950/10 blur-[100px] transition-all duration-500" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[40%] rounded-full bg-zinc-900/5 blur-[150px] transition-all duration-500" />
          </>
        )}
      </div>

      {/* Decorative HUD Elements */}
      <div className={`absolute top-0 left-0 w-16 h-16 border-t border-l mt-4 ml-4 pointer-events-none hidden lg:block transition-colors duration-300 ${
        isDev ? 'border-white/5' : 'border-emerald-500/10'
      }`} />
      <div className={`absolute bottom-0 right-0 w-16 h-16 border-b border-r mt-4 mr-4 pointer-events-none hidden lg:block transition-colors duration-300 ${
        isDev ? 'border-white/5' : 'border-emerald-500/10'
      }`} />

      {/* Sidebar - Desktop Layout */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel Content Window */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full relative z-10">
        {/* Main Header Row */}
        <MainHeader activeTab={activeTab} activePersonality={activePersonality} />

        {/* Content Section with Slide Transitions & Dynamic Layout Density */}
        <main className={`flex-1 overflow-hidden relative flex flex-col min-h-0 transition-all duration-300 ${
          isDev ? 'p-3 sm:p-5' : 'p-2 sm:p-3'
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex-1 min-h-0 w-full"
            >
              {activeTab === 'studio' && (
                <StudioPanel
                  chatMessages={chatMessages}
                  onSubmit={handleStudioSubmit}
                  swarm={swarm}
                  onApplyCode={handleApplyCode}
                />
              )}

              {activeTab === 'editor' && (
                <EditorPanel
                  projectFiles={projectFiles}
                  activeFileId={activeFileId}
                  editorContent={editorContent}
                  setEditorContent={setEditorContent}
                  setActiveFileId={setActiveFileId}
                  setProjectFiles={setProjectFiles}
                />
              )}

              {activeTab === 'terminal' && (
                <TerminalPanel
                  terminalOutput={terminalOutput}
                  addTerminalOutput={addTerminalOutput}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectPanel />
              )}

              {activeTab === 'bridge' && (
                <BridgePanel />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* MobileBottomNav - Touch Devices Navigation layout */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
