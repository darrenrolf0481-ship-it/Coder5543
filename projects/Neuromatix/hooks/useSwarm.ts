import { useCallback } from 'react';
import { useProjectStore } from '../store/useProjectStore';

interface SwarmConfig {
  generateAIResponse: (prompt: string, context?: any) => Promise<string>;
}

export function useSwarm({ generateAIResponse }: SwarmConfig) {
  const { 
    attachedAgent, 
    attachAgent, 
    detachAgent, 
    isAgentAttached,
    addTerminalOutput,
    editorContent,
    setEditorContent
  } = useProjectStore();

  const triggerSwarmCycle = useCallback(async (task: string) => {
    if (!attachedAgent) {
      addTerminalOutput('[SWARM] Deployment halted: No agent attached to Crimson Node.');
      return 'Please attach an agent first. Try: "attach sage" or "attach cyber" in the chat console.';
    }

    addTerminalOutput(`[SWARM] Cycle initiated. Attached agent: ${attachedAgent.name.toUpperCase()}`);
    addTerminalOutput(`[${attachedAgent.name.toUpperCase()}] Running swarm task: "${task}"`);

    try {
      const prompt = `You are running a direct file-level swarm update command: "${task}".
Based on your expert identity (${attachedAgent.name.toUpperCase()}), analyze and completely modify or rewrite the current file to satisfy this command.

You MUST follow this protocol strictly:
1. Return ONLY the complete, newly updated file code.
2. DO NOT wrap your answer in conversation, intros, or explanations.
3. If you use markdown code fences, ensure they are simple.

Here is the task: ${task}`;

      const aiResponse = await generateAIResponse(prompt);

      // Sanitize response to pull out the code block if the AI wrapped it in markdown code fences
      let updatedCode = aiResponse.trim();
      if (updatedCode.includes('```')) {
        const parts = updatedCode.split('```');
        const contentBlock = parts[1];
        if (contentBlock) {
          const lines = contentBlock.split('\n');
          if (lines[0].trim() && !lines[0].includes(' ') && lines[0].length < 15) {
            lines.shift();
          }
          updatedCode = lines.join('\n').trim();
        }
      }

      setEditorContent(updatedCode);
      addTerminalOutput(`[${attachedAgent.name.toUpperCase()}] Swarm updates successfully written back to workspace file.`);
      addTerminalOutput(`[SYSTEM] Live terminal updated with file modifications.`);

      return `Successfully completed swarm cycle. Check the Code Editor tab to inspect modifications.`;
    } catch (err: any) {
      addTerminalOutput(`[SWARM EXCEPTION] Core pipeline fault: ${err.message || err}`);
      return `Swarm cycle execution failed.`;
    }
  }, [attachedAgent, addTerminalOutput, generateAIResponse, setEditorContent]);

  return {
    attachedAgent,
    isAgentActive: isAgentAttached(),
    attachAgent,
    detachAgent,
    triggerSwarmCycle,
  };
}
