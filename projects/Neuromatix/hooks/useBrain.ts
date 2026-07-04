import { useCallback } from 'react';

export function useBrain() {
  const prepareContext = useCallback((editorContent: string, activeFileId: string, projectFiles: any[]) => {
    const file = projectFiles.find((f) => f.id === activeFileId);
    return {
      source: 'local_brain_network',
      activeFile: file ? file.name : 'unknown',
      workspaceSize: projectFiles.length,
      timestamp: Date.now(),
    };
  }, []);

  const recordInteraction = useCallback((prompt: string, response: string) => {
    console.log('[BRAIN_LOG]', { prompt, responseLength: response.length });
  }, []);

  return {
    endocrine: { status: 'stable' },
    prepareContext,
    recordInteraction,
  };
}
