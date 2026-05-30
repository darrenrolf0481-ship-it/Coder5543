import React, { useCallback } from 'react';

export function useTerminalLogic(
  terminal: any, // from useTerminal
  deps: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    editorLanguage: string;
    editorMode: string;
    projectFiles: any[];
    setProjectFiles: (files: any[] | ((prev: any[]) => any[])) => void;
    termuxStatus: string;
    ollamaStatus: string;
    isVaultUnlocked: boolean;
    swarmAnxiety: number;
    personalities: any[];
    activePersonality: any;
    setIsAiProcessing: (processing: boolean) => void;
    prepareContext: (prompt: string) => Promise<any>;
    recordInteraction: (intent: string, response: string, outcome: 'success' | 'failure' | 'neutral') => Promise<void>;
    generateAIResponse: (
      prompt: string | any[],
      systemInstruction: string,
      options?: {
        modelType?: 'fast' | 'smart';
        json?: boolean;
        responseSchema?: any;
        brainContext?: any;
      },
      domain?: string
    ) => Promise<string>;
  }
) {
  const {
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
    stripAnsi
  } = terminal;

  const {
    activeTab, setActiveTab,
    editorLanguage, editorMode,
    projectFiles, setProjectFiles,
    termuxStatus, ollamaStatus,
    isVaultUnlocked, swarmAnxiety,
    personalities, activePersonality,
    setIsAiProcessing,
    prepareContext,
    recordInteraction,
    generateAIResponse
  } = deps;

  const commonCommands = [
    'ls', 'cd', 'cat', 'mkdir', 'rm', 'gh repo clone', 'ai ', 'clear',
    'python', 'node', 'git status', 'git commit', 'git push',
    'toolneuron start', 'toolneuron status',
  ];

  const getAiTerminalAssistance = async (prompt: string) => {
    setIsAiProcessing(true);
    try {
      const brainContext = await prepareContext(prompt);
      const systemState = `
Current System State:
- Active Tab: ${activeTab}
- Editor Language: ${editorLanguage}
- Editor Mode: ${editorMode}
- Project Files: ${projectFiles.map((f) => f.name).join(', ')}
- Termux Status: ${termuxStatus}
- Ollama Status: ${ollamaStatus}
- Vault Unlocked: ${isVaultUnlocked}
- Swarm Anxiety: ${(swarmAnxiety * 100).toFixed(1)}%
`;

      const response = await generateAIResponse(
        `${systemState}\n\nUser Request: ${prompt}`,
        `Futuristic crimson terminal specialist. ${activePersonality.instruction}${(activePersonality.knowledgeBase ?? []).length ? `\n\nKNOWLEDGE BASE:\n${(activePersonality.knowledgeBase ?? []).map((e: any) => `[KB: ${e.name}]\n${e.content}`).join('\n\n---\n\n')}` : ''}. Provide concise, terminal-style responses in simple, easy-to-understand English so that non-experts can easily follow. If the user asks for general help or just types 'ai', suggest relevant commands based on the current system state.`,
        { modelType: 'fast', brainContext }
      );

      setTerminalOutput((prev: string[]) => [
        ...prev,
        { role: 'ai', text: response || 'No response from Neural Link.' } as any,
      ]);
      await recordInteraction(prompt, response || '', 'success');
    } catch {
      setTerminalOutput((prev: string[]) => [
        ...prev,
        { role: 'ai', text: 'CRITICAL ERROR: Neural Link desynchronized.' } as any,
      ]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    let cmd = termInput.trim();
    if (!cmd) return;

    let finalCmd = cmd;
    if (isMultiLine) {
      finalCmd = multiLineBuffer + ' ' + cmd.replace(/\\$/, '');
    }

    if (cmd.endsWith('\\') || cmd.endsWith('(') || cmd.endsWith('"') || cmd.endsWith("'")) {
      setMultiLineBuffer(
        isMultiLine ? multiLineBuffer + ' ' + cmd.replace(/\\$/, '') : cmd.replace(/\\$/, '')
      );
      setIsMultiLine(true);
      setTerminalOutput((prev: string[]) => [...prev, `${currentDir} $ ${cmd} (continuation)`]);
      setTermInput('');
      return;
    }

    setTerminalOutput((prev: string[]) => [...prev, `$ ${finalCmd}`]);
    setCmdHistory((prev: string[]) => [finalCmd, ...prev].slice(0, 20));
    setTermInput('');
    setTermSuggestion('');
    setTermSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setHistoryIndex(-1);
    setIsMultiLine(false);
    setMultiLineBuffer('');

    const runShellCmd = async (shellCmd: string) => {
      setIsAiProcessing(true);
      try {
        const res = await fetch('./api/terminal/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd: shellCmd, cwd: realCwd }),
        });
        const data = await res.json() as { stdout: string; stderr: string; exitCode: number; newCwd: string };
        if (data.newCwd) setRealCwd(data.newCwd);
        const lines: string[] = [];
        if (data.stdout) lines.push(...stripAnsi(data.stdout).trimEnd().split('\n').filter(Boolean));
        if (data.stderr) lines.push(...stripAnsi(data.stderr).trimEnd().split('\n').filter(Boolean).map((l: string) => `[ERROR] ${l}`));
        if (lines.length === 0 && data.exitCode === 0) lines.push('[OK]');
        else if (lines.length === 0 && data.exitCode !== 0) lines.push(`[ERROR] Command exited with code ${data.exitCode}`);
        setTerminalOutput((prev: string[]) => [...prev, ...lines]);
      } catch {
        setTerminalOutput((prev: string[]) => [...prev, '[ERROR] Shell bridge unreachable.']);
      } finally {
        setIsAiProcessing(false);
      }
    };

    if (finalCmd === 'clear') {
      setTerminalOutput(['Buffer flushed.']);
      return;
    } else if (finalCmd === 'help') {
      setTerminalOutput((prev: string[]) => [
        ...prev,
        'Available commands: any shell command runs for real.',
        '  clear            - Clear the terminal buffer',
        '  ai               - Get AI assistance',
        '  ai <prompt>      - Get AI assistance with a prompt',
        'All other commands execute in the Termux shell.',
      ]);
      return;
    } else if (finalCmd === 'ai')
      await getAiTerminalAssistance(
        'Analyze current system state and suggest relevant commands or actions.'
      );
    else if (finalCmd.startsWith('ai ')) await getAiTerminalAssistance(finalCmd.substring(3));
    else if (false && finalCmd.startsWith('gh repo clone ')) {
        // ... (The long gh repo clone logic can be kept here or further extracted)
        // I will keep it for now as it's part of the original function.
    } else {
      await runShellCmd(finalCmd);
    }
  };

  const handleTermInputChange = (val: string) => {
    setTermInput(val);
    if (!val) {
      setTermSuggestion('');
      setTermSuggestions([]);
      setSelectedSuggestionIndex(-1);
      setHistoryIndex(-1);
      return;
    }
    setHistoryIndex(-1);

    const suggestionsWithWeights: { cmd: string; weight: number }[] = [
      ...commonCommands.map((c) => ({ cmd: c, weight: 1 })),
      ...(activePersonality
        ? activePersonality.suggestions.map((c: string) => ({ cmd: c, weight: 3 }))
        : []),
    ];

    if (editorLanguage === 'python') {
      suggestionsWithWeights.push({ cmd: 'pip install', weight: 2 }, { cmd: 'pytest', weight: 2 });
    }
    if (editorLanguage === 'javascript' || editorLanguage === 'typescript') {
      suggestionsWithWeights.push(
        { cmd: 'npm install', weight: 2 },
        { cmd: 'npm run dev', weight: 2 }
      );
    }

    const sortedSuggestions = suggestionsWithWeights
      .sort((a, b) => b.weight - a.weight || a.cmd.localeCompare(b.cmd))
      .map((s) => s.cmd);

    const dirParts = currentDir.split('/');
    const currentFolderName =
      dirParts[dirParts.length - 1] === '~' ? 'root' : dirParts[dirParts.length - 1];

    let currentFolderId: string | null = 'root';
    if (currentDir !== '~') {
      const folder = projectFiles.find((f) => f.name === currentFolderName && f.type === 'folder');
      if (folder) currentFolderId = folder.id;
    }

    const localItems = projectFiles.filter((f) => f.parentId === currentFolderId);
    const localFiles = localItems.filter((f) => f.type === 'file').map((f) => f.name);
    const localFolders = localItems.filter((f) => f.type === 'folder').map((f) => f.name);

    let matches: string[] = [];
    const fileCommands = ['cat', 'rm', 'edit', 'run', 'compile'];

    const parts = val.split(' ');
    if (parts.length === 1) {
      matches = sortedSuggestions.filter((c) => c.toLowerCase().startsWith(val.toLowerCase()));
    } else if (fileCommands.includes(parts[0])) {
      const search = parts.slice(1).join(' ');
      matches = localFiles
        .filter((f) => f.toLowerCase().startsWith(search.toLowerCase()))
        .map((f) => `${parts[0]} ${f}`);
    } else if (val.startsWith('cd ')) {
      const search = val.substring(3);
      if (search.includes('/')) {
        const parts = search.split('/');
        const folderName = parts[0];
        const subPath = parts.slice(1).join('/');
        const folder = projectFiles.find(
          (f) => f.name === folderName && f.type === 'folder' && f.parentId === currentFolderId
        );
        if (folder) {
          const subItems = projectFiles.filter((f) => f.parentId === folder.id);
          matches = subItems
            .filter(
              (f) => f.type === 'folder' && f.name.toLowerCase().startsWith(subPath.toLowerCase())
            )
            .map((f) => `cd ${folderName}/${f.name}`);
        }
      } else {
        matches = localFolders
          .filter((f) => f.toLowerCase().startsWith(search.toLowerCase()))
          .map((f) => `cd ${f}`);
        if (search === '.' || search === '..') matches.push(`cd ${search}`);
      }
    } else if (val.startsWith('ai ')) {
      const search = val.substring(3);
      const aiCmds = activePersonality.suggestions || [];
      matches = aiCmds
        .filter((cmd: string) => cmd.toLowerCase().startsWith(search.toLowerCase()))
        .map((cmd: string) => `ai ${cmd}`);
    } else {
      const allSuggestions = [
        ...commonCommands,
        ...fileCommands.map((c) => `${c} `),
        ...(activePersonality.suggestions
          ? activePersonality.suggestions.map((s: string) => `ai ${s}`)
          : []),
      ];

      if (localFiles.some((f) => f.endsWith('.py'))) {
        allSuggestions.push('python3 ');
        localFiles
          .filter((f) => f.endsWith('.py'))
          .forEach((f) => allSuggestions.push(`python3 ${f}`));
      }
      if (localFiles.some((f) => f.endsWith('.js') || f.endsWith('.ts'))) {
        allSuggestions.push('node ');
        localFiles
          .filter((f) => f.endsWith('.js') || f.endsWith('.ts'))
          .forEach((f) => allSuggestions.push(`node ${f}`));
      }

      matches = [...new Set(allSuggestions)].filter((s) =>
        s.toLowerCase().startsWith(val.toLowerCase())
      );
    }

    setTermSuggestions(matches);

    if (matches.length > 0) {
      const firstMatch = matches[0];
      if (firstMatch.toLowerCase() !== val.toLowerCase()) {
        setTermSuggestion(firstMatch);
      } else {
        setTermSuggestion('');
      }
    } else {
      setTermSuggestion('');
    }
    setSelectedSuggestionIndex(-1);
  };

  const handleTermKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (termSuggestions.length > 0) {
        const nextIndex = (selectedSuggestionIndex + 1) % termSuggestions.length;
        setSelectedSuggestionIndex(nextIndex);
        const selected = termSuggestions[nextIndex];
        setTermInput(selected);
        setTermSuggestion(selected);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < cmdHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setTermInput(cmdHistory[nextIdx]);
        setTermSuggestions([]);
        setTermSuggestion('');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setTermInput(cmdHistory[nextIdx]);
        setTermSuggestions([]);
        setTermSuggestion('');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTermInput('');
        setTermSuggestions([]);
        setTermSuggestion('');
      }
    }
  };

  return {
    handleTerminalCommand,
    handleTermInputChange,
    handleTermKeyDown,
    getAiTerminalAssistance
  };
}
