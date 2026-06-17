import { useState, useCallback, useRef, useEffect } from 'react';

const HISTORY_KEY = 'crimson-terminal-history';
const MAX_HISTORY = 100;

const stripAnsi = (s: string) =>
  s
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\][^\x07]*\x07/g, '');

const loadHistory = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
};

const saveHistory = (history: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage can throw in private mode; ignore.
  }
};

export function useTerminal(initialCwd: string, initialRealCwd: string) {
  const [termInput, setTermInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'CRIMSON OS v4.1.0_KORE_BOOT',
    'Kernel: Android-SD Neural Link Established',
    'Voltage stable. Hyper-threaded nodes online.',
  ]);
  const [currentDir, setCurrentDir] = useState(initialCwd);
  const [realCwd, setRealCwd] = useState(initialRealCwd);
  const [cmdHistory, setCmdHistory] = useState<string[]>(loadHistory);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [multiLineBuffer, setMultiLineBuffer] = useState('');
  const [termSuggestion, setTermSuggestion] = useState('');
  const [termSuggestions, setTermSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Persist command history across reloads.
  useEffect(() => {
    saveHistory(cmdHistory);
  }, [cmdHistory]);

  const appendOutput = useCallback((lines: string | string[]) => {
    setTerminalOutput((prev) => [...prev, ...(Array.isArray(lines) ? lines : [lines])]);
  }, []);

  const clearOutput = useCallback(() => {
    setTerminalOutput(['Buffer flushed.']);
  }, []);

  const pushHistory = useCallback((cmd: string) => {
    setCmdHistory((prev) => {
      const next = [cmd, ...prev.filter((c) => c !== cmd)].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
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
    appendOutput,
    clearOutput,
    pushHistory,
  };
}
