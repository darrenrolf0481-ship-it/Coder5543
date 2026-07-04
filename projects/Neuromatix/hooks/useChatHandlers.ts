import { useCallback } from 'react';
import { useProjectStore } from '../store/useProjectStore';

export function useChatHandlers({ generateAIResponse, swarm }: any) {
  const { 
    attachAgent, 
    detachAgent, 
    attachedAgent, 
    addTerminalOutput,
    addAgentMemory,
    getAgentMemory,
    clearAgentMemory,
    addLongTermMemory,
    getLongTermMemory,
    clearLongTermMemory,
  } = useProjectStore();

  const handleStudioSubmit = useCallback(async (
    input: string, 
    setChatMessages: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    if (!input.trim()) return;

    // Add user message to local state
    setChatMessages((prev) => [...prev, { role: 'user', text: input, timestamp: Date.now() }]);

    const lowerInput = input.toLowerCase().trim();

    // Memory command triggers
    if (lowerInput.startsWith('remember ')) {
      const note = input.substring(9).trim();
      if (attachedAgent) {
        const agentIdStr = attachedAgent.id.toString();
        addAgentMemory(agentIdStr, note, 'note');
        const feedback = `[MEMORY] ${attachedAgent.name} remembered: "${note}"`;
        addTerminalOutput(feedback);
        setChatMessages((prev) => [
          ...prev, 
          { role: 'ai', text: feedback, timestamp: Date.now() }
        ]);
      } else {
        const feedback = `[MEMORY] No active agent attached to store memory. Please run: "attach sage-7" or "attach adhd".`;
        setChatMessages((prev) => [
          ...prev, 
          { role: 'ai', text: feedback, timestamp: Date.now() }
        ]);
      }
      return;
    }

    if (lowerInput === 'show memory') {
      const agentIdStr = attachedAgent ? attachedAgent.id.toString() : '';
      const mems = getAgentMemory(agentIdStr);
      const text = mems.length 
        ? mems.map(m => `[${m.type.toUpperCase()}] ${m.content}`).join('\n') 
        : 'No memory entries.';
      addTerminalOutput(text);
      setChatMessages((prev) => [
        ...prev, 
        { role: 'ai', text, timestamp: Date.now() }
      ]);
      return;
    }

    if (lowerInput === 'forget all') {
      const agentIdStr = attachedAgent ? attachedAgent.id.toString() : '';
      clearAgentMemory(agentIdStr);
      const feedback = '[MEMORY] Agent memory cleared.';
      addTerminalOutput(feedback);
      setChatMessages((prev) => [
        ...prev, 
        { role: 'ai', text: feedback, timestamp: Date.now() }
      ]);
      return;
    }

    if (lowerInput.startsWith('long remember ')) {
      const note = input.substring(13).trim();
      addLongTermMemory(note, 'long-term');
      const feedback = `[LONG-TERM] Stored: "${note}"`;
      addTerminalOutput(feedback);
      setChatMessages((prev) => [
        ...prev, 
        { role: 'ai', text: feedback, timestamp: Date.now() }
      ]);
      return;
    }

    if (lowerInput === 'show long-term') {
      const mems = getLongTermMemory();
      const text = mems.length 
        ? mems.map(m => `[LONG-TERM ${m.type.toUpperCase()}] ${m.content}`).join('\n') 
        : 'No long-term memories.';
      addTerminalOutput(text);
      setChatMessages((prev) => [
        ...prev, 
        { role: 'ai', text, timestamp: Date.now() }
      ]);
      return;
    }

    if (lowerInput === 'forget long-term') {
      clearLongTermMemory();
      const feedback = '[LONG-TERM] All long-term memory cleared.';
      addTerminalOutput(feedback);
      setChatMessages((prev) => [
        ...prev, 
        { role: 'ai', text: feedback, timestamp: Date.now() }
      ]);
      return;
    }

    // 1. Process Special commands
    if (lowerInput.startsWith('attach ')) {
      const agentName = lowerInput.replace('attach ', '').trim();
      
      let targetName = '';
      if (agentName === 'sage' || agentName === 'sage-7') {
        targetName = 'Sage-7';
      } else if (agentName === 'cyber' || agentName === 'adhd') {
        targetName = 'ADHD';
      }

      if (targetName) {
        attachAgent({ id: Date.now(), name: targetName });
        const liveLabel = targetName === 'ADHD' ? 'SAGE-MAMA (:3000)' : 'SAGE-7 (:8001)';
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: `Bridge open: **${targetName}** connected — routing to live instance at ${liveLabel}. Messages go directly to her, no persona overlay.`,
            timestamp: Date.now()
          }
        ]);
      } else {
        const capitalized = agentName.charAt(0).toUpperCase() + agentName.slice(1);
        setChatMessages((prev) => [
          ...prev, 
          { 
            role: 'ai', 
            text: `Neural Error: Unknown agent identifier "${capitalized}". Available agents are: **Sage-7** and **ADHD**.`, 
            timestamp: Date.now() 
          }
        ]);
      }
      return;
    }

    if (lowerInput === 'detach' || lowerInput === 'detach agent') {
      if (attachedAgent) {
        const oldName = attachedAgent.name;
        detachAgent();
        setChatMessages((prev) => [
          ...prev, 
          { 
            role: 'ai', 
            text: `System Alert: Detached agent **${oldName}** cleanly. Neural Studio returned to main orchestrator mode.`, 
            timestamp: Date.now() 
          }
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev, 
          { 
            role: 'ai', 
            text: `System Notification: No active agent is currently attached.`, 
            timestamp: Date.now() 
          }
        ]);
      }
      return;
    }

    if (lowerInput.startsWith('run ')) {
      if (!attachedAgent) {
        setChatMessages((prev) => [
          ...prev, 
          { 
            role: 'ai', 
            text: `Pipeline Halt: You must attach an agent before executing a swarm task. Try: **"attach sage-7"** or **"attach adhd"**.`, 
            timestamp: Date.now() 
          }
        ]);
        return;
      }
      const task = input.substring(4).trim();
      setChatMessages((prev) => [
        ...prev, 
        { 
          role: 'ai', 
          text: `Executing autonomous swarm task with **${attachedAgent.name}**: "${task}"...`, 
          timestamp: Date.now() 
        }
      ]);
      const swarmResult = await swarm.triggerSwarmCycle(task);
      setChatMessages((prev) => [
        ...prev, 
        { 
          role: 'ai', 
          text: swarmResult, 
          timestamp: Date.now() 
        }
      ]);
      return;
    }

    // 2. Process General conversational request
    try {
      let response: string;

      if (attachedAgent?.name === 'ADHD') {
        const res = await fetch('/api/mama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input }),
        });
        const data = await res.json();
        response = data.reply || data.error || '(no response from MAMA)';
      } else if (attachedAgent?.name === 'Sage-7') {
        const res = await fetch('/api/seven', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input }),
        });
        const data = await res.json();
        response = data.reply || data.error || '(no response from Seven)';
      } else {
        response = await generateAIResponse(input);
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: response,
          timestamp: Date.now()
        }
      ]);

      if (response.includes('```')) {
        addTerminalOutput('[SYSTEM] Code output pattern detected in response. Ready to sync.');
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Fault detected in synaptic neural link: ${err.message}`,
          timestamp: Date.now()
        }
      ]);
    }
  }, [
    attachAgent, 
    detachAgent, 
    attachedAgent, 
    addTerminalOutput, 
    swarm, 
    generateAIResponse,
    addAgentMemory,
    getAgentMemory,
    clearAgentMemory,
    addLongTermMemory,
    getLongTermMemory,
    clearLongTermMemory
  ]);

  return { handleStudioSubmit };
}
