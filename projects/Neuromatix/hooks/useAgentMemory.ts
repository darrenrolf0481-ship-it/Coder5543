import { useProjectStore } from '../store/useProjectStore';

export function useAgentMemory(agentId: string | null) {
  const addMemory = useProjectStore((s) => s.addAgentMemory);
  const getMemory = useProjectStore((s) => s.getAgentMemory);
  const clearMemory = useProjectStore((s) => s.clearAgentMemory);

  if (!agentId) return { memories: [], addMemory: () => {}, clearMemory: () => {} };

  return {
    memories: getMemory(agentId),
    addMemory: (content: string, type?: 'observation' | 'note' | 'decision' | 'preference') =>
      addMemory(agentId, content, type),
    clearMemory: () => clearMemory(agentId),
  };
}
