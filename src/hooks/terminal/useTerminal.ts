import { useState, useCallback, useRef } from 'react';

export function useTerminal(initialCwd: string, initialRealCwd: string) {
  const [termInput, setTermInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'CRIMSON OS v4.1.0_KORE_BOOT',
    'Kernel: Android-SD Neural Link Established',
    'Voltage stable. Hyper-threaded nodes online.',
  ]);
  const [currentDir, setCurrentDir] = useState(initialCwd);
  const [realCwd, setRealCwd] = useState(initialRealCwd);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [multiLineBuffer, setMultiLineBuffer] = useState('');
  const [termSuggestion, setTermSuggestion] = useState('');
  const [termSuggestions, setTermSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');

  const appendOutput = useCallback((lines: string | string[]) => {
    setTerminalOutput(prev => [...prev, ...(Array.isArray(lines) ? lines : [lines])]);
  }, []);

  return {
    termInput, setTermInput,
    terminalOutput, setTerminalOutput,
    currentDir, setCurrentDir,
    realCwd, setRealCwd,
    cmdHistory, setCmdHistory,
    historyIndex, setHistoryIndex,
    isMultiLine, setIsMultiLine,
    multiLineBuffer, setMultiLineBuffer,
    termSuggestion, setTermSuggestion,
    termSuggestions, setTermSuggestions,
    selectedSuggestionIndex, setSelectedSuggestionIndex,
    stripAnsi,
    appendOutput
  };
}
