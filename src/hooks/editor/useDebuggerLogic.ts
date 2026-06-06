import { useState } from 'react';

export interface DebugState {
  isActive: boolean;
  currentLine: number;
  variables: Record<string, any>;
  callStack: string[];
}

export function useDebuggerLogic() {
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [debugState, setDebugState] = useState<DebugState>({
    isActive: false,
    currentLine: -1,
    variables: {},
    callStack: [],
  });
  const [debugRefactorResult, setDebugRefactorResult] = useState<{
    refactoredCode: string;
    explanation: string;
  } | null>(null);

  return {
    breakpoints,
    setBreakpoints,
    debugState,
    setDebugState,
    debugRefactorResult,
    setDebugRefactorResult,
  };
}
