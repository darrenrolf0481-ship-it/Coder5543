import { useCallback } from 'react';
import { useProjectStore } from '../store/useProjectStore';

export function useAiOrchestrator(
  personalities: any[]
) {
  const { 
    editorContent, 
    activeFileId, 
    projectFiles, 
    addTerminalOutput, 
    attachedAgent, 
    currentMode,
    llmProvider,
    openrouterKey,
    ollamaEndpoint,
    ragKnowledge,
    agentMemories,
    longTermMemories
  } = useProjectStore();

  const generateAIResponse = useCallback(async (prompt: string, context?: any) => {
    const activeFile = projectFiles.find((f) => f.id === activeFileId);
    const fileName = activeFile ? activeFile.name : 'untitled';
    const language = activeFile ? activeFile.language : 'typescript';

    const currentAgent = attachedAgent || (personalities && personalities[0]);
    const agentName = currentAgent ? currentAgent.name.toUpperCase() : 'ORCHESTRATOR';

    addTerminalOutput(`[${agentName}] Loading neural context vectors for: "${fileName}"...`);
    addTerminalOutput(`[${agentName}] Mode context active: ${currentMode.toUpperCase()}`);
    addTerminalOutput(`[${agentName}] Provider: ${llmProvider.toUpperCase()}`);
    addTerminalOutput(`[${agentName}] Invoking deep reasoning neural pathway...`);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          currentFile: editorContent || '',
          fileName,
          language,
          allFiles: projectFiles,
          attachedAgent: currentAgent,
          mode: currentMode,
          llmProvider,
          openrouterKey,
          ollamaEndpoint,
          ragKnowledge,
          agentMemories,
          longTermMemories,
          ...context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach neural servers.');
      }

      const data = await response.json();
      addTerminalOutput(`[${agentName}] Thought-sync sequence completed successfully.`);
      return data.text || 'Command processed.';
    } catch (error: any) {
      console.error(error);
      addTerminalOutput(`[SYSTEM ERROR] Neural link broken: ${error.message || error}`);
      return `[ERROR] Unable to synchronize with Crimson Core. Please check system parameters.`;
    }
  }, [
    personalities, 
    editorContent, 
    activeFileId, 
    projectFiles, 
    addTerminalOutput, 
    attachedAgent, 
    currentMode, 
    llmProvider, 
    openrouterKey, 
    ollamaEndpoint, 
    ragKnowledge,
    agentMemories,
    longTermMemories
  ]);

  return { generateAIResponse };
}
