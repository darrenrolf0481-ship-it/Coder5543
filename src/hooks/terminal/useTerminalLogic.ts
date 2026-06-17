/**
 * @hook useTerminalLogic
 *
 * Core terminal command processing hook for ToolNeuron Hub.
 * Handles command dispatch, AI assistance, MCP subcommands,
 * natural-language translation, autocomplete suggestions,
 * multi-line input, and keyboard navigation.
 */

import React, { useCallback, useState } from 'react';
import { interpretNaturalLanguage } from '../../services/terminal/NaturalLanguageInterpreter.js';
import { splitCommand, isIncompleteCommand } from '../../services/terminal/commandUtils.js';

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
    isAiProcessing: boolean;
    prepareContext: (prompt: string, personalityId?: number) => Promise<any>;
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
    execTerminal: (cmd: string, cwd?: string, onOutput?: (data: any) => void) => void;
    killTerminal: () => void;
    terminalSource: 'node_bridge' | 'local_core';
    execLocalCore: (cmd: string, args: string[], onStdout?: (data: string) => void) => Promise<number>;
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
    stripAnsi, pushHistory, clearOutput,
  } = terminal;

  const {
    activeTab, setActiveTab,
    editorLanguage, editorMode,
    projectFiles, setProjectFiles,
    termuxStatus, ollamaStatus,
    isVaultUnlocked, swarmAnxiety,
    personalities, activePersonality,
    setIsAiProcessing,
    isAiProcessing,
    prepareContext,
    recordInteraction,
    generateAIResponse,
    execTerminal,
    killTerminal,
    terminalSource,
    execLocalCore,
  } = deps;

  const [nlPending, setNlPending] = useState<{ command: string; explanation: string; safe: boolean; mode: 'do' | 'ask' } | null>(null);

  const commonCommands = [
    'ls', 'cd', 'cat', 'mkdir', 'rm', 'gh repo clone', 'ai ', 'clear',
    'python', 'node', 'git status', 'git commit', 'git push',
    'toolneuron start', 'toolneuron status',
    'mcp list', 'mcp call ', 'mcp info ', 'mcp enable ', 'mcp disable ',
    'do ', 'ask ',
  ];

  const promptPrefix = `${realCwd ?? '~'} $ `;

  const appendLines = (lines: string | string[]) => {
    setTerminalOutput((prev: string[]) => [...prev, ...(Array.isArray(lines) ? lines : [lines])]);
  };

  const getAiTerminalAssistance = async (prompt: string) => {
    setIsAiProcessing(true);
    try {
      const brainContext = await prepareContext(prompt, activePersonality.id);
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

      appendLines(`NEURAL_LINK: ${response || 'No response from Neural Link.'}`);
      await recordInteraction(prompt, response || '', 'success');
    } catch {
      appendLines('NEURAL_LINK: CRITICAL ERROR: Neural Link desynchronized.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const fetchNearbyFiles = async (): Promise<string[]> => {
    try {
      const res = await fetch(`./api/fs/browse?path=${encodeURIComponent(realCwd)}`);
      const data = await res.json();
      if (Array.isArray(data.entries)) {
        return data.entries.map((e: any) => e.name);
      }
    } catch {
      // Fall back to project files.
    }
    return projectFiles.map((f) => f.name);
  };

  const handleNaturalLanguage = async (raw: string, mode: 'do' | 'ask') => {
    const request = raw.trim();
    if (!request) {
      appendLines('[SYSTEM] Please include a request after the prefix.');
      return;
    }

    setIsAiProcessing(true);
    try {
      const nearbyFiles = await fetchNearbyFiles();
      const result = await interpretNaturalLanguage(request, {
        cwd: realCwd,
        history: cmdHistory.slice(0, 20),
        nearbyFiles,
        activePersonality,
        generateAIResponse,
        prepareContext,
      });

      appendLines([
        `COMMAND_INTEL: ${result.command}`,
        `NEURAL_LINK: ${result.explanation}`,
      ]);

      if (!result.safe) {
        appendLines('[WARN] This command looks dangerous. Confirm by typing `yes`. Type `n` to cancel.');
      }

      if (mode === 'do') {
        if (result.safe) {
          appendLines('[SYSTEM] Type y/yes/Enter to run, or n/no to cancel.');
        } else {
          appendLines('[SYSTEM] This command requires explicit confirmation. Type `yes` to run, or `n` to cancel.');
        }
        setNlPending({ command: result.command, explanation: result.explanation, safe: result.safe, mode });
      }

      await recordInteraction(request, result.command, 'success');
    } catch (err: any) {
      appendLines(`[ERROR] Translation failed: ${err.message || String(err)}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const runShellCmd = async (shellCmd: string) => {
    setIsAiProcessing(true);

    if (terminalSource === 'local_core') {
      const { cmd, args } = splitCommand(shellCmd.trim());
      if (!cmd) {
        appendLines('[ERROR] Local Core: empty command');
        setIsAiProcessing(false);
        return;
      }

      try {
        await execLocalCore(cmd, args, (data) => {
          appendLines(stripAnsi(data).split('\n').filter(Boolean));
        });
      } catch (err: any) {
        appendLines(`[ERROR] Local Core: ${err.message}`);
      } finally {
        setIsAiProcessing(false);
      }
      return;
    }

    // Handle 'cd' locally for state tracking (still needs backend pwd check)
    if (/^cd(\s|$)/.test(shellCmd.trim())) {
      try {
        const res = await fetch('./api/terminal/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd: shellCmd, cwd: realCwd }),
        });
        const data = await res.json();
        if (data.newCwd) setRealCwd(data.newCwd);
        if (data.stderr) appendLines(`[ERROR] ${stripAnsi(data.stderr)}`);
      } catch {
        appendLines('[ERROR] Shell bridge unreachable.');
      } finally {
        setIsAiProcessing(false);
      }
      return;
    }

    // Use WebSocket for streaming execution
    execTerminal(shellCmd, realCwd, (data) => {
      if (data.type === 'stdout' && data.text) {
        appendLines(stripAnsi(data.text).split('\n').filter(Boolean));
      } else if (data.type === 'stderr' && data.text) {
        appendLines(`[ERROR] ${stripAnsi(data.text)}`);
      } else if (data.type === 'close') {
        setIsAiProcessing(false);
        if (data.newCwd && data.newCwd !== realCwd) {
          setRealCwd(data.newCwd);
        }
        if (data.exitCode !== 0 && data.exitCode !== null) {
          appendLines(`[SYSTEM] Process exited with code ${data.exitCode}`);
        }
      }
    });
  };

  const handleTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    let cmd = termInput.trim();
    if (!cmd) return;

    // Natural-language confirmation flow takes precedence.
    if (nlPending) {
      const lower = cmd.toLowerCase();
      if (lower === 'n' || lower === 'no') {
        appendLines('[SYSTEM] Cancelled.');
        setNlPending(null);
        setTermInput('');
        return;
      }
      const allowed = nlPending.safe
        ? lower === 'y' || lower === 'yes' || lower === ''
        : lower === 'yes';
      if (allowed) {
        appendLines(`$ ${nlPending.command}`);
        pushHistory(`do ${nlPending.command}`);
        setNlPending(null);
        setTermInput('');
        setTermSuggestion('');
        setTermSuggestions([]);
        setSelectedSuggestionIndex(-1);
        await runShellCmd(nlPending.command);
        return;
      }
      appendLines(`[SYSTEM] ${nlPending.safe ? 'Type y/yes/Enter to run, or n/no to cancel.' : 'Dangerous command: type exactly `yes` to run, or n/no to cancel.'}`);
      setTermInput('');
      return;
    }

    const fullLine = isMultiLine ? `${multiLineBuffer}\n${cmd}` : cmd;

    if (!isMultiLine && isIncompleteCommand(fullLine)) {
      setIsMultiLine(true);
      setMultiLineBuffer(fullLine);
      appendLines(`${promptPrefix}${cmd} (...)`);
      setTermInput('');
      return;
    }

    if (isMultiLine && isIncompleteCommand(fullLine)) {
      setMultiLineBuffer(fullLine);
      appendLines(`${promptPrefix}${cmd} (...)`);
      setTermInput('');
      return;
    }

    const finalCmd = isMultiLine ? fullLine : cmd;

    appendLines(`${promptPrefix}${finalCmd}`);
    pushHistory(finalCmd);
    setTermInput('');
    setTermSuggestion('');
    setTermSuggestions([]);
    setSelectedSuggestionIndex(-1);
    setHistoryIndex(-1);
    setIsMultiLine(false);
    setMultiLineBuffer('');

    if (finalCmd === 'clear') {
      clearOutput();
      return;
    }

    if (finalCmd === 'help') {
      appendLines([
        'Available commands: any shell command runs for real.',
        '  clear            - Clear the terminal buffer',
        '  ai               - Get AI assistance',
        '  ai <prompt>      - Get AI assistance with a prompt',
        '  do <request>      - Translate English to a shell command and confirm before running',
        '  ask <request>     - Translate English to a shell command and explain it',
        '  mcp              - Open the MCP Interactive Hub helper',
        '  mcp list         - List all registered MCP tools and their status',
        '  mcp info <tool>  - Show detailed input schema for a tool',
        '  mcp call <tool>  - Call an MCP tool directly with JSON args',
        '  mcp enable/disable <tool> - Enable or disable an MCP tool',
        'All other commands execute in the workspace shell.',
      ]);
      return;
    }

    if (finalCmd.startsWith('do ') || finalCmd === 'do') {
      if (finalCmd === 'do') {
        appendLines('[SYSTEM] Usage: do <what you want to do in plain English>');
        return;
      }
      await handleNaturalLanguage(finalCmd.substring(3), 'do');
      return;
    }

    if (finalCmd.startsWith('ask ') || finalCmd === 'ask') {
      if (finalCmd === 'ask') {
        appendLines('[SYSTEM] Usage: ask <what you want to know in plain English>');
        return;
      }
      await handleNaturalLanguage(finalCmd.substring(4), 'ask');
      return;
    }

    if (finalCmd === 'ai') {
      await getAiTerminalAssistance('Analyze current system state and suggest relevant commands or actions.');
      return;
    }

    if (finalCmd.startsWith('ai ')) {
      await getAiTerminalAssistance(finalCmd.substring(3));
      return;
    }

    if (finalCmd.startsWith('mcp ') || finalCmd === 'mcp') {
      await handleMcpCommand(finalCmd);
      return;
    }

    await runShellCmd(finalCmd);
  };

  async function handleMcpCommand(finalCmd: string) {
    const args = finalCmd.trim().split(' ').filter(Boolean);
    const action = args[1];

    if (!action || action === 'help') {
      appendLines([
        '====================================================',
        '  🐦 SAGE MICROPORT (MCP) INTERACTIVE HUB 🐦',
        '====================================================',
        'Usage:',
        '  mcp list                       - List all registered MCP tools and their status',
        '  mcp info <tool>                - Show detailed input schema for a tool',
        '  mcp call <tool> [json_args]    - Call an MCP tool with JSON arguments',
        '  mcp enable <tool>              - Enable an MCP tool',
        '  mcp disable <tool>             - Disable an MCP tool',
        '====================================================',
      ]);
      return;
    }

    if (action === 'list') {
      setIsAiProcessing(true);
      try {
        const res = await fetch('./api/mcp/list');
        const data = await res.json();
        if (data.success && Array.isArray(data.tools)) {
          const lines = [
            'Registered MCP Tools:',
            '----------------------------------------------------',
          ];
          data.tools.forEach((t: any) => {
            const status = t.enabled ? '[ENABLED] ' : '[DISABLED]';
            lines.push(`${status} ${t.name.padEnd(25)} - ${t.description}`);
          });
          lines.push('----------------------------------------------------');
          appendLines(lines);
        } else {
          appendLines(`[ERROR] Failed to fetch tools: ${data.error || 'Unknown error'}`);
        }
      } catch {
        appendLines('[ERROR] MCP service unreachable.');
      } finally {
        setIsAiProcessing(false);
      }
      return;
    }

    if (action === 'info') {
      const toolName = args[2];
      if (!toolName) {
        appendLines('[ERROR] Usage: mcp info <tool_name>');
        return;
      }
      setIsAiProcessing(true);
      try {
        const res = await fetch('./api/mcp/list');
        const data = await res.json();
        if (data.success && Array.isArray(data.tools)) {
          const tool = data.tools.find((t: any) => t.name === toolName);
          if (tool) {
            appendLines([
              `Tool: ${tool.name}`,
              `Status: ${tool.enabled ? 'ENABLED' : 'DISABLED'}`,
              `Description: ${tool.description}`,
              'Input Schema:',
              JSON.stringify(tool.inputSchema, null, 2),
            ]);
          } else {
            appendLines(`[ERROR] Tool '${toolName}' not found.`);
          }
        } else {
          appendLines(`[ERROR] Failed to fetch tools: ${data.error || 'Unknown error'}`);
        }
      } catch {
        appendLines('[ERROR] MCP service unreachable.');
      } finally {
        setIsAiProcessing(false);
      }
      return;
    }

    if (action === 'enable' || action === 'disable') {
      const toolName = args[2];
      if (!toolName) {
        appendLines(`[ERROR] Usage: mcp ${action} <tool_name>`);
        return;
      }
      setIsAiProcessing(true);
      try {
        const res = await fetch('./api/mcp/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(window as any).__SESSION_TOKEN__ || ''}`,
          },
          body: JSON.stringify({ name: toolName, enabled: action === 'enable' }),
        });
        const data = await res.json();
        if (data.success) {
          appendLines(`[OK] Tool '${toolName}' successfully ${action}d.`);
        } else {
          appendLines(`[ERROR] Failed to toggle tool: ${data.error || 'Unknown error'}`);
        }
      } catch {
        appendLines('[ERROR] MCP service unreachable.');
      } finally {
        setIsAiProcessing(false);
      }
      return;
    }

    if (action === 'call') {
      const toolName = args[2];
      if (!toolName) {
        appendLines('[ERROR] Usage: mcp call <tool_name> [json_arguments]');
        return;
      }
      const jsonStr = args.slice(3).join(' ').trim();
      let callArgs = {};
      if (jsonStr) {
        try {
          callArgs = JSON.parse(jsonStr);
        } catch {
          appendLines('[ERROR] Invalid JSON arguments provided.');
          return;
        }
      }

      setIsAiProcessing(true);
      try {
        const res = await fetch('./api/mcp/call', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(window as any).__SESSION_TOKEN__ || ''}`,
          },
          body: JSON.stringify({ name: toolName, arguments: callArgs }),
        });
        const data = await res.json();
        if (data.success) {
          appendLines([
            `[OK] Response from ${toolName}:`,
            JSON.stringify(data.result, null, 2),
          ]);
        } else {
          appendLines(`[ERROR] Tool call failed: ${data.error || 'Unknown error'}`);
        }
      } catch {
        appendLines('[ERROR] MCP service unreachable.');
      } finally {
        setIsAiProcessing(false);
      }
      return;
    }

    appendLines(`[ERROR] Unknown mcp action: ${action}`);
  }

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
        const subParts = search.split('/');
        const folderName = subParts[0];
        const subPath = subParts.slice(1).join('/');
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
    } else if (val.startsWith('do ') || val.startsWith('ask ')) {
      const prefix = val.startsWith('do ') ? 'do ' : 'ask ';
      const search = val.substring(prefix.length);
      const aiCmds = activePersonality.suggestions || [];
      matches = aiCmds
        .filter((cmd: string) => cmd.toLowerCase().startsWith(search.toLowerCase()))
        .map((cmd: string) => `${prefix}${cmd}`);
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
    } else if (e.key === 'c' && e.ctrlKey) {
      if (isAiProcessing) {
        e.preventDefault();
        killTerminal();
        appendLines('[SYSTEM] Sent interrupt signal.');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearOutput();
    } else if (e.key === 'Escape' && nlPending) {
      setNlPending(null);
      appendLines('[SYSTEM] Cancelled.');
      setTermInput('');
    }
  };

  return {
    handleTerminalCommand,
    handleTermInputChange,
    handleTermKeyDown,
    getAiTerminalAssistance,
  };
}
