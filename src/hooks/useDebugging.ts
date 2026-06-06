import { useState, useCallback } from 'react';

export function useDebugging(editorLanguage: string, editorContent: string, generateAIResponse: any, setEditorOutput: any, setIsAiProcessing: any, breakpoints: number[]) {
  const [debugState, setDebugState] = useState<{
    isActive: boolean;
    currentLine: number;
    variables: Record<string, any>;
    callStack: string[];
  }>({
    isActive: false,
    currentLine: -1,
    variables: {},
    callStack: [],
  });

  const handleStartDebug = useCallback(async () => {
    if (editorLanguage === 'html') {
      setEditorOutput('[DEBUG] Debugging not supported for HTML/UI files.\n');
      return;
    }
    setDebugState({ isActive: true, currentLine: 1, variables: {}, callStack: ['main'] });
    setEditorOutput('[DEBUG] Debugging session started. Initializing neural hooks...\n');
  }, [editorLanguage, setEditorOutput]);

  const handleStopDebug = useCallback(() => {
    setDebugState({ isActive: false, currentLine: -1, variables: {}, callStack: [] });
    setEditorOutput((prev: string) => prev + '[DEBUG] Debugging session terminated.\n');
  }, [setEditorOutput]);

  const handleStep = useCallback(async () => {
    if (!debugState.isActive) return;

    setIsAiProcessing(true);
    try {
      const response = await generateAIResponse(
        `Simulate one step of debugging for this ${editorLanguage} code. 
        Current line: ${debugState.currentLine}. 
        Breakpoints: ${breakpoints.join(', ')}.
        Current variables: ${JSON.stringify(debugState.variables)}.
        Code:\n${editorContent}`,
        'You are the Crimson OS Debugger. Provide the state of variables and the next logical line to execute in JSON format. Schema: { "nextLine": number, "variables": object, "output": string, "callStack": string[] }',
        { modelType: 'fast', json: true }
      );

      const text = response || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      setDebugState((prev) => ({
        ...prev,
        currentLine: result.nextLine || prev.currentLine + 1,
        variables: { ...prev.variables, ...result.variables },
        callStack: result.callStack || prev.callStack,
      }));

      if (result.output) {
        setEditorOutput((prev: string) => prev + `[DEBUG] ${result.output}\n`);
      }

      if (breakpoints.includes(result.nextLine)) {
        setEditorOutput((prev: string) => prev + `[DEBUG] Breakpoint hit at line ${result.nextLine}\n`);
      }
    } catch (err) {
      setEditorOutput((prev: string) => prev + '[ERROR] Debugger synchronization failed.\n');
    } finally {
      setIsAiProcessing(false);
    }
  }, [debugState, editorLanguage, editorContent, generateAIResponse, setEditorOutput, setIsAiProcessing, breakpoints]);

  return {
    debugState,
    setDebugState,
    handleStartDebug,
    handleStopDebug,
    handleStep,
  };
}
