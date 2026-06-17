import { useCallback } from 'react';
import { Type } from '../../services/googleGenAiStub';
import { extractJson } from '../../utils/helpers';

export function useDebuggerHandlers(
  editorContent: string,
  editorLanguage: string,
  setEditorContent: any,
  setEditorOutput: any,
  setIsAiProcessing: any,
  setEditorAssistantMessages: any,
  setIsEditorAssistantOpen: any,
  debugState: any,
  setDebugState: any,
  setDebugRefactorResult: any,
  debugRefactorResult: any,
  breakpoints: number[],
  setBreakpoints: any,
  isRunningCode: boolean,
  cursorLine: number,
  activePersonality: any,
  generateAIResponse: any,
  prepareContext: any,
) {
  const handleToggleCurrentLineBreakpoint = useCallback(() => {
    setBreakpoints((prev: number[]) =>
      prev.includes(cursorLine) ? prev.filter((l) => l !== cursorLine) : [...prev, cursorLine],
    );
  }, [setBreakpoints, cursorLine]);

  const handleStartDebug = async () => {
    if (isRunningCode) return;
    setIsAiProcessing(true);
    setEditorOutput((prev: string) => prev + '\n[DEBUG] Initializing neural debugging session...');

    try {
      const prompt = `Initialize a debugging session for this ${editorLanguage} code. 
        Analyze the logic and provide:
        1. An initial execution state (current line, variables, call stack).
        2. A set of predicted hotspots where logic might fail.
        
        Code:
        ${editorContent}
        
        Return a JSON object with fields: 'currentLine' (number), 'variables' (object), 'callStack' (array of strings), and 'hotspots' (array of objects with 'line' and 'reason').`;

      const brainContext = await prepareContext(prompt, activePersonality.id);

      const response = await generateAIResponse(
        prompt,
        'You are a world-class debugger and code analyst. Always return valid JSON.',
        {
          modelType: 'smart',
          json: true,
          brainContext,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              currentLine: { type: Type.NUMBER },
              variables: { type: Type.OBJECT },
              callStack: { type: Type.ARRAY, items: { type: Type.STRING } },
              hotspots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    line: { type: Type.NUMBER },
                    reason: { type: Type.STRING },
                  },
                  required: ['line', 'reason'],
                },
              },
            },
            required: ['currentLine', 'variables', 'callStack', 'hotspots'],
          },
        },
      );

      const result = extractJson(response || '{}', {});
      setDebugState({
        isActive: true,
        currentLine: result.currentLine || 1,
        variables: result.variables || {},
        callStack: result.callStack || ['main'],
      });
      setEditorOutput((prev: string) => prev + '\n[DEBUG] Session online. Analysis complete.');
    } catch (error) {
      console.warn('Debug initialization failed:', error);
      setEditorOutput((prev: string) => prev + '\n[ERROR] Neural debugging failed to initialize.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleStopDebug = () => {
    setDebugState({
      isActive: false,
      currentLine: -1,
      variables: {},
      callStack: [],
    });
    setEditorOutput((prev: string) => prev + '\n[DEBUG] Session terminated.');
  };

  const handleStep = async () => {
    if (!debugState.isActive) return;

    setIsAiProcessing(true);
    try {
      const prompt = `Simulate the next step of execution for this ${editorLanguage} code. 
        Current State:
        Line: ${debugState.currentLine}
        Variables: ${JSON.stringify(debugState.variables)}
        Call Stack: ${debugState.callStack.join(' -> ')}
        
        Code:
        ${editorContent}
        
        Return the new state (currentLine, variables, callStack) after one step.`;

      const brainContext = await prepareContext(prompt, activePersonality.id);

      const response = await generateAIResponse(
        prompt,
        'You are a precise code execution simulator. Always return valid JSON.',
        {
          modelType: 'smart',
          json: true,
          brainContext,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              currentLine: { type: Type.NUMBER },
              variables: { type: Type.OBJECT },
              callStack: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['currentLine', 'variables', 'callStack'],
          },
        },
      );

      const result = extractJson(response || '{}', {});
      setDebugState({
        ...debugState,
        currentLine: result.currentLine,
        variables: result.variables,
        callStack: result.callStack,
      });
    } catch (error) {
      console.warn('Step failed:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleDebugRefactor = async () => {
    if (!debugState.isActive) return;

    setIsAiProcessing(true);
    try {
      const prompt = `Analyze and refactor this ${editorLanguage} code. 
The debugger is currently at line ${debugState.currentLine}.
Current variables in scope: ${JSON.stringify(debugState.variables)}.
Current call stack: ${debugState.callStack.join(' -> ')}.

Code to refactor:
${editorContent}

Provide a refactored version that improves quality, fixes potential issues, or optimizes performance. 
Return a JSON object with 'refactoredCode' and 'explanation' fields.`;

      const brainContext = await prepareContext(prompt, activePersonality.id);

      const response = await generateAIResponse(
        prompt,
        'You are a world-class software architect and debugger. You provide precise refactorings and clear explanations. Always return valid JSON.',
        {
          modelType: 'smart',
          json: true,
          brainContext,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refactoredCode: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['refactoredCode', 'explanation'],
          },
        },
      );

      const result = extractJson(response || '{}', {});
      setDebugRefactorResult(result);
    } catch (error) {
      console.warn('Debug refactor failed:', error);
      setEditorOutput(
        (prev: string) => prev + '\n[ERROR] Debug refactor failed — check console for details.',
      );
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleApplyDebugRefactor = () => {
    if (!debugRefactorResult) return;
    setEditorContent(debugRefactorResult.refactoredCode);
    setDebugRefactorResult(null);
    setEditorOutput((prev: string) => prev + '\n[SYSTEM] AI Refactor applied successfully.');
  };

  return {
    handleToggleCurrentLineBreakpoint,
    handleStartDebug,
    handleStopDebug,
    handleStep,
    handleDebugRefactor,
    handleApplyDebugRefactor,
  };
}
