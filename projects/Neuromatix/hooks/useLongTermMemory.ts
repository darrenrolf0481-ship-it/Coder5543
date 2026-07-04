import { useProjectStore } from '../store/useProjectStore';

type MemoryType = 'observation' | 'note' | 'decision' | 'preference' | 'long-term';

export function useLongTermMemory() {
  const addMemory = useProjectStore((s) => s.addLongTermMemory);
  const getMemory = useProjectStore((s) => s.getLongTermMemory);
  const clearMemory = useProjectStore((s) => s.clearLongTermMemory);
  const removeMemory = useProjectStore((s) => s.removeLongTermMemory);

  return {
    memories: getMemory(),
    addMemory: (content: string, type?: MemoryType) => addMemory(content, type),
    clearMemory: () => clearMemory(),
    removeMemory: (entryId: string) => removeMemory(entryId),
  };
}
