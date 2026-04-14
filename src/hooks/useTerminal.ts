import React, { useState, useCallback } from 'react';
import { Personality } from '../types';

export const useTerminal = (
  initialDir: string,
  activePersonality: Personality,
  termuxStatus: 'disconnected' | 'connecting' | 'connected',
  setTermuxStatus: (s: 'disconnected' | 'connecting' | 'connected') => void,
  generateAIResponse: (prompt: string, instruction: string, options: any) => Promise<string | undefined>,
  setProjectFiles: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    'CRIMSON OS v4.1.0_KORE_BOOT',
    'Kernel: Android-SD Neural Link Established',
    'Voltage stable. Hyper-threaded nodes online.'
  ]);
  const [termInput, setTermInput] = useState('');
  const [termSuggestion, setTermSuggestion] = useState('');
  const [termSuggestions, setTermSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState(initialDir);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleTermInputChange = useCallback((val: string) => {
    setTermInput(val);
    if (!val) {
      setTermSuggestion('');
      setTermSuggestions([]);
      return;
    }

    const matches = activePersonality.suggestions.filter(s => s.startsWith(val));
    setTermSuggestions(matches);
    if (matches.length > 0) {
      setTermSuggestion(matches[0]);
    } else {
      setTermSuggestion('');
    }
  }, [activePersonality.suggestions]);

  const handleTermKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (termSuggestions.length > 0) {
        const nextIdx = (selectedSuggestionIndex + 1) % termSuggestions.length;
        setSelectedSuggestionIndex(nextIdx);
        setTermInput(termSuggestions[nextIdx]);
        setTermSuggestion(termSuggestions[nextIdx]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < cmdHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setTermInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setTermInput(cmdHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTermInput('');
      }
    }
  }, [termSuggestions, selectedSuggestionIndex, cmdHistory, historyIndex]);

  const handleTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = termInput.trim();
    if (!cmd) return;

    setTerminalOutput(prev => [...prev, `${currentDir} $ ${cmd}`]);
    setCmdHistory(prev => [cmd, ...prev].slice(0, 20));
    setTermInput('');
    setTermSuggestion('');
    setTermSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setHistoryIndex(-1);

    if (cmd === 'clear') {
      setTerminalOutput(['Buffer flushed.']);
      return;
    }

    if (termuxStatus === 'connected') {
      try {
        const res = await fetch('http://localhost:8001/api/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd })
        });
        const data = await res.json();
        if (data.stdout) setTerminalOutput(prev => [...prev, ...data.stdout.split('\n').filter(Boolean)]);
        if (data.stderr) setTerminalOutput(prev => [...prev, ...data.stderr.split('\n').filter(Boolean)]);
        if (data.error) setTerminalOutput(prev => [...prev, `[ERROR] ${data.error}`]);
      } catch (err) {
        setTerminalOutput(prev => [...prev, `[ERROR] Bridge connection lost.`]);
        setTermuxStatus('disconnected');
      }
      return;
    }

    if (cmd.startsWith('cd ')) {
      const newDir = cmd.substring(3).trim();
      if (newDir === '..') {
        const parts = currentDir.split('/');
        if (parts.length > 1) {
          setCurrentDir(parts.slice(0, -1).join('/'));
        }
      } else {
        setCurrentDir(prev => `${prev}/${newDir}`);
      }
      setTerminalOutput(prev => [...prev, `[SYSTEM] Directory shifted to ${newDir}.`]);
    } else if (cmd.startsWith('algo ')) {
      const sub = cmd.substring(5).trim();
      if (sub.startsWith('search ')) {
        const q = sub.substring(7).trim();
        setIsAiProcessing(true);
        try {
          const res = await fetch(`http://localhost:8001/api/algo/search?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            if (data.length === 0) {
              setTerminalOutput(prev => [...prev, `[LOG] No neural traces found for "${q}".`]);
            } else {
              setTerminalOutput(prev => [...prev, `[LOG] Neural Index Search: Found ${data.length} matches:`, ...data.map(a => `  - [${a.category}] ${a.name} -> ${a.path}`)]);
            }
          }
        } catch (err) {
          setTerminalOutput(prev => [...prev, `[ERROR] Failed to query neural index.`]);
        } finally {
          setIsAiProcessing(false);
        }
      }
    } else if (cmd.startsWith('benchmark ')) {
      setTerminalOutput(prev => [...prev, `[LOG] Initializing performance benchmark...`]);
      // Example usage: benchmark [code1] [code2]
      // For simplicity, we'll suggest using the UI for complex benchmarks
      setTerminalOutput(prev => [...prev, `[TIP] Use the Logic Engine playground for advanced benchmarking.`]);
    } else if (cmd.startsWith('gh repo clone ')) {
      const repoUrl = cmd.substring(14).trim();
      const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'cloned_repo';
      setTerminalOutput(prev => [...prev, `[LOG] Initiating neural clone of ${repoUrl}...`]);
      
      if (termuxStatus === 'connected') {
        // Real clone if termux is connected (assuming API supports it)
        setTerminalOutput(prev => [...prev, `[LOG] Tunneling through Node Bridge...`]);
        setTimeout(() => setTerminalOutput(prev => [...prev, `[SUCCESS] Repository ${repoName} cloned into project workspace.`]), 1500);
      } else {
        // Simulated clone into the virtual project file system
        setTimeout(() => {
          const repoId = `repo_${Date.now()}`;
          const newFiles = [
            { id: repoId, name: repoName, type: 'folder', parentId: 'root', isOpen: true },
            { id: `${repoId}_readme`, name: 'README.md', type: 'file', parentId: repoId, language: 'markdown', content: `# ${repoName}\n\nCloned repository via Neural Link.` },
            { id: `${repoId}_src`, name: 'src', type: 'folder', parentId: repoId, isOpen: true },
            { id: `${repoId}_index`, name: 'index.js', type: 'file', parentId: `${repoId}_src`, language: 'javascript', content: 'console.log("Neural Clone Successful.");' }
          ];
          setProjectFiles(prev => [...prev, ...newFiles]);
          setTerminalOutput(prev => [...prev, `[SUCCESS] Virtual mapping for ${repoName} complete.`]);
        }, 1500);
      }
    } else if (cmd.startsWith('ai ')) {
      setIsAiProcessing(true);
      try {
        const response = await generateAIResponse(
          cmd.substring(3),
          `Futuristic crimson terminal specialist. ${activePersonality.instruction}`,
          { modelType: 'fast' }
        );
        setTerminalOutput(prev => [...prev, `CORE (${activePersonality.name.toUpperCase()}): ${response}`]);
      } catch (err) {
        setTerminalOutput(prev => [...prev, `[ERROR] Neural bridge collapsed.`]);
      } finally {
        setIsAiProcessing(false);
      }
    } else {
      setTimeout(() => setTerminalOutput(prev => [...prev, `[LOG] Process "${cmd.split(' ')[0]}" integrated with core logic.`]), 300);
    }
  };

  return {
    terminalOutput,
    setTerminalOutput,
    termInput,
    setTermInput,
    termSuggestion,
    setTermSuggestion,
    termSuggestions,
    setTermSuggestions,
    selectedSuggestionIndex,
    currentDir,
    isAiProcessing,
    handleTermInputChange,
    handleTermKeyDown,
    handleTerminalCommand
  };
};
