import { useCallback, useState } from 'react';
import { AGENTS_MD_GUIDELINES } from '../data/reviewGuidelines';
import { useAgentStore } from '../store/useAgentStore';
import { ProjectSettings } from './useProjectSettings';

export interface ChatMessage {
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp?: number;
  metadata?: any;
}

export interface LabControllerDeps {
  // Chat state
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatInput: string;
  setChatInput: (v: string) => void;

  // Editor / project
  editorContent: string;
  editorLanguage: string;
  activeFileId: string;
  activeFileName: string;
  projectFiles: any[];
  setProjectFiles: (v: any[] | ((prev: any[]) => any[])) => void;
  setEditorContent: (v: string) => void;
  setEditorLanguage: (v: string) => void;
  setEditorMode: (v: string) => void;
  markFileDirty: (id: string) => void;
  setActiveFileId: (id: string) => void;
  setActiveTab: (tab: string) => void;

  // AI / processing
  generateAIResponse: (prompt: string, system?: string, options?: any) => Promise<string>;
  setIsAiProcessing: (v: boolean) => void;
  activePersonality: any;
  projectSettings: ProjectSettings;
  prepareContext: (prompt: string, personalityId: number) => Promise<any>;

  // Existing handlers (thin wrappers may call these)
  handleStudioSubmit?: (e?: React.FormEvent) => Promise<void>;
  runStaticAnalysis: (file?: any) => Promise<any>;
  runDynamicTracing: () => Promise<any>;
  handleAnalyzeCode: () => Promise<void>;
  handleFullProjectAnalysis: () => Promise<void>;
  handleDeepProjectAudit: () => Promise<void>;
  handleScanCode: () => Promise<void>;
  handleFormatCode: () => Promise<void>;
  handleRefactorCode: () => Promise<void>;
  handleRefactorAllFiles: () => Promise<void>;
  handleExplainCode: () => Promise<void>;
  handleReviewCode: () => Promise<void>;
  handleGenerateDocs: () => Promise<void>;
  handleRunCode: () => Promise<void>;
  handleApplyDocumentation: (code: string, isSelection: boolean, selection: any) => void;

  // Git
  gitRepo: any;
  handleGitInit: () => void;
  handleGitStage: (fileId: string) => void;
  handleGitStageAll: () => void;
  handleGitUnstage: (fileId: string) => void;
  handleGitCommit?: (message: string) => void;
  handleGitPush?: () => void;
  handleGitPull?: () => void;
  handleGitSaveAll?: () => void;

  // Swarm / Agent / Ruflo
  swarm: {
    missionInput: string;
    setMissionInput: (v: string) => void;
    isRunning: boolean;
    triggerSwarmCycle: (missionOverride?: string) => Promise<void>;
  };
  attachAgent: (name: string) => void;
  detachAgent: () => void;
  attachedAgent: any;

  ruflo: {
    status: any;
    callTool: (tool: string, args?: Record<string, unknown>) => Promise<any>;
    searchMemory: (query: string, k?: number) => Promise<any>;
    storeMemory: (content: string, tags?: string[]) => Promise<any>;
    listAgents: () => Promise<any>;
    checkSwarmHealth: () => Promise<any>;
  };

  // Output sink
  setEditorOutput: (v: string | ((prev: string) => string)) => void;
}

const COMMAND_HINTS = [
  { cmd: '/help', desc: 'List available lab commands' },
  { cmd: '/review', desc: 'Review the active file' },
  { cmd: '/explain', desc: 'Explain the active file' },
  { cmd: '/analyze', desc: 'Run static analysis on the active file' },
  { cmd: '/audit', desc: 'Run a deep project audit' },
  { cmd: '/trace', desc: 'Run dynamic tracing on the active file' },
  { cmd: '/docs', desc: 'Generate documentation for the active file' },
  { cmd: '/format', desc: 'Format the active file' },
  { cmd: '/refactor', desc: 'Refactor the active file' },
  { cmd: '/refactor-all', desc: 'Refactor every file in the project' },
  { cmd: '/run', desc: 'Run / execute the active file' },
  { cmd: '/file <name>', desc: 'Create a new file from a chat description' },
  { cmd: '/git <init|stage|stage-all|unstage|commit|push|pull|status|save>', desc: 'Git operations' },
  { cmd: '/attach <agent>', desc: 'Attach an agent to the chat' },
  { cmd: '/detach', desc: 'Detach the current agent' },
  { cmd: '/swarm <mission>', desc: 'Trigger a swarm cycle' },
  { cmd: '/ruflo <tool> [args]', desc: 'Call a Ruflo MCP tool' },
  { cmd: '/memory store <content>', desc: 'Store a memory in Ruflo' },
  { cmd: '/memory search <query>', desc: 'Search Ruflo memory' },
  { cmd: '/agents', desc: 'List Ruflo agents' },
  { cmd: '/health', desc: 'Check Ruflo swarm health' },
];

export function useLabController(deps: LabControllerDeps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const pushSystem = useCallback(
    (text: string) => {
      deps.setChatMessages((prev) => [
        ...prev,
        { role: 'system', text, timestamp: Date.now() },
      ]);
    },
    [deps.setChatMessages],
  );

  const pushUser = useCallback(
    (text: string) => {
      deps.setChatMessages((prev) => [
        ...prev,
        { role: 'user', text, timestamp: Date.now() },
      ]);
    },
    [deps.setChatMessages],
  );

  const pushAi = useCallback(
    (text: string, metadata?: any) => {
      deps.setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text, timestamp: Date.now(), metadata },
      ]);
    },
    [deps.setChatMessages],
  );

  const wrapAction = useCallback(
    async (label: string, fn: () => Promise<string | void>) => {
      setIsProcessing(true);
      deps.setIsAiProcessing(true);
      pushSystem(`${label}…`);
      try {
        const result = await fn();
        if (result) pushAi(result);
      } catch (err: any) {
        pushAi(`[ERROR] ${label} failed: ${err?.message || String(err)}`);
      } finally {
        setIsProcessing(false);
        deps.setIsAiProcessing(false);
      }
    },
    [deps, pushAi, pushSystem],
  );

  const buildSystemInstruction = useCallback(() => {
    const activeProfile =
      deps.projectSettings.projectProfiles.find(
        (p: any) => p.id === deps.projectSettings.activeProfileId,
      ) || deps.projectSettings.projectProfiles[0];
    const recentHistory = deps.chatMessages
      .slice(-6)
      .map((m: any) => {
        const prefix = m.role === 'user' ? 'USER' : m.role === 'ai' ? 'ASSISTANT' : 'SYSTEM';
        const text = m.text.length > 800 ? m.text.slice(0, 800) + '...[truncated]' : m.text;
        return `${prefix}: ${text}`;
      })
      .join('\n\n');
    const kbDocs = (deps.activePersonality.knowledgeBase ?? [])
      .map((e: any) => `[KB: ${e.name}]\n${e.content}`)
      .join('\n\n---\n\n');
    return `${deps.activePersonality.instruction}${kbDocs ? `\n\nKNOWLEDGE BASE:\n${kbDocs}` : ''}\n\nPROJECT_PROFILE: ${activeProfile?.instruction || ''}${recentHistory ? `\n\nCONVERSATION_HISTORY:\n${recentHistory}` : ''}`;
  }, [deps]);

  const normalChat = useCallback(
    async (prompt: string) => {
      setIsProcessing(true);
      deps.setIsAiProcessing(true);
      pushUser(prompt);
      deps.setChatInput('');
      try {
        const brainContext = await deps.prepareContext(prompt, deps.activePersonality.id);
        const activeFileName =
          deps.projectFiles.find((f: any) => f.id === deps.activeFileId)?.name || null;
        const shouldIncludeEditor = !!(activeFileName && deps.editorContent) || !!deps.attachedAgent;
        const editorCtx =
          shouldIncludeEditor && deps.editorContent
            ? `\n\nEDITOR_CONTEXT:${deps.attachedAgent ? ` [${deps.attachedAgent.name ?? deps.attachedAgent} is watching this file]` : ''}\nActive File: ${activeFileName || 'untitled'} (${deps.editorLanguage})\n\`\`\`${deps.editorLanguage}\n${deps.editorContent.length > 4000 ? deps.editorContent.slice(0, 4000) + '\n...[file truncated]' : deps.editorContent}\n\`\`\``
            : '';
        const systemInstruction = `${buildSystemInstruction()}${brainContext ? `\n\nBRAIN_CONTEXT: ${JSON.stringify(brainContext).slice(0, 1200)}` : ''}${editorCtx}`;
        const response = await deps.generateAIResponse(prompt, systemInstruction, {
          modelType: 'smart',
        });
        pushAi(response || 'No response.');
      } catch (err: any) {
        pushAi(`[ERROR] ${err.message || String(err)}`);
      } finally {
        setIsProcessing(false);
        deps.setIsAiProcessing(false);
      }
    },
    [deps, pushUser, pushAi, buildSystemInstruction],
  );

  const handleCreateFile = useCallback(
    async (raw: string) => {
      const match = raw.match(
        /(?:create|generate|file)\s+(?:a\s+new\s+)?(?:file\s+(?:named\s+)?)?([a-zA-Z0-9_\-\.]+)(?:\s+(?:that|with|containing|for|to)\s+(.+))?/i,
      );
      if (!match) {
        pushAi('Usage: `/file <filename> <description>` or say "create file named X that does Y".');
        return;
      }
      const fileName = match[1];
      const description = (match[2] || raw.replace(match[0], '')).trim() || 'Create this file.';
      const ext = fileName.split('.').pop();
      const langMap: Record<string, string> = {
        py: 'python',
        js: 'javascript',
        ts: 'typescript',
        html: 'html',
        css: 'css',
        rs: 'rust',
        cpp: 'cpp',
        json: 'json',
        md: 'markdown',
      };
      const language = langMap[ext || ''] || 'text';

      await wrapAction(`Generating ${fileName}`, async () => {
        const response = await deps.generateAIResponse(
          `Write the content for a file named ${fileName}. It should: ${description}. Provide ONLY the raw code content.`,
          buildSystemInstruction(),
          { modelType: 'smart' },
        );
        const id = `file_${Date.now()}`;
        const newFile = {
          id,
          name: fileName,
          type: 'file',
          parentId: 'root',
          language,
          content: response,
        };
        deps.setProjectFiles((prev: any[]) => [...prev, newFile]);
        deps.setActiveFileId(id);
        deps.setEditorContent(response);
        deps.setEditorLanguage(language);
        deps.setEditorMode(language === 'html' ? 'preview' : 'code');
        deps.setActiveTab('editor');
        return `Created and opened \`${fileName}\`.`;
      });
    },
    [deps, pushAi, wrapAction, buildSystemInstruction],
  );

  const handleGitCommand = useCallback(
    async (parts: string[]) => {
      const sub = parts[0]?.toLowerCase();
      switch (sub) {
        case 'init':
          deps.handleGitInit();
          pushAi('Git repository initialized.');
          break;
        case 'stage': {
          const fileName = parts.slice(1).join(' ');
          const file = deps.projectFiles.find((f: any) => f.name === fileName || f.id === fileName);
          if (file) {
            deps.handleGitStage(file.id);
            pushAi(`Staged \`${file.name}\`.`);
          } else {
            pushAi(`Could not find file \`${fileName}\` to stage.`);
          }
          break;
        }
        case 'stage-all':
          deps.handleGitStageAll();
          pushAi('Staged all modified files.');
          break;
        case 'unstage': {
          const fileName = parts.slice(1).join(' ');
          const file = deps.projectFiles.find((f: any) => f.name === fileName || f.id === fileName);
          if (file) {
            deps.handleGitUnstage(file.id);
            pushAi(`Unstaged \`${file.name}\`.`);
          } else {
            pushAi(`Could not find file \`${fileName}\` to unstage.`);
          }
          break;
        }
        case 'commit': {
          const message = parts.slice(1).join(' ') || 'Lab commit';
          deps.handleGitCommit?.(message);
          pushAi(`Committed with message: \`${message}\``);
          break;
        }
        case 'push':
          deps.handleGitPush?.();
          pushAi('Push initiated.');
          break;
        case 'pull':
          deps.handleGitPull?.();
          pushAi('Pull initiated.');
          break;
        case 'save':
        case 'save-all':
          deps.handleGitSaveAll?.();
          pushAi('Saved all files and created WIP commit.');
          break;
        case 'status': {
          const repo = deps.gitRepo || {};
          const lines = [
            `Branch: ${repo.branch || 'main'}`,
            `Modified: ${(repo.modified || []).length}`,
            `Staged: ${(repo.staged || []).length}`,
            `Commits: ${(repo.commits || []).length}`,
            `Stash: ${(repo.stash || []).length}`,
          ];
          pushAi(`**Git status**\n\n${lines.join('\n')}`);
          break;
        }
        default:
          pushAi(`Unknown git subcommand \`${sub}\`. Try: init, stage, stage-all, unstage, commit, push, pull, status, save.`);
      }
    },
    [deps, pushAi],
  );

  const handleRufloCommand = useCallback(
    async (parts: string[], original: string) => {
      if (!deps.projectSettings.labToggles.rufloEnabled) {
        pushAi('Ruflo is disabled. Enable it in Settings → Lab Toggles.');
        return;
      }
      const tool = parts[0];
      if (!tool) {
        pushAi('Usage: `/ruflo <tool> [JSON args]`');
        return;
      }
      const argsText = parts.slice(1).join(' ');
      let args = {};
      if (argsText) {
        try {
          args = JSON.parse(argsText);
        } catch {
          // Treat remaining text as a single "content" or "query" arg
          args = { content: argsText };
        }
      }
      await wrapAction(`Ruflo: ${tool}`, async () => {
        const result = await deps.ruflo.callTool(tool, args);
        return `\`\`\`json\n${JSON.stringify(result, null, 2).slice(0, 2000)}\n\`\`\``;
      });
    },
    [deps, pushAi, wrapAction],
  );

  const handleMemoryCommand = useCallback(
    async (parts: string[]) => {
      if (!deps.projectSettings.labToggles.rufloEnabled) {
        pushAi('Ruflo memory is disabled. Enable Ruflo in Settings → Lab Toggles.');
        return;
      }
      const sub = parts[0]?.toLowerCase();
      const rest = parts.slice(1).join(' ');
      if (sub === 'store' || sub === 'save') {
        await wrapAction('Storing memory', async () => {
          await deps.ruflo.storeMemory(rest, ['lab-chat']);
          return 'Memory stored.';
        });
      } else if (sub === 'search' || sub === 'find') {
        await wrapAction('Searching memory', async () => {
          const result = await deps.ruflo.searchMemory(rest, 5);
          return `\`\`\`json\n${JSON.stringify(result, null, 2).slice(0, 2000)}\n\`\`\``;
        });
      } else {
        pushAi('Memory usage: `/memory store <content>` or `/memory search <query>`.');
      }
    },
    [deps, pushAi, wrapAction],
  );

  const handleAgentCommand = useCallback(
    async (parts: string[]) => {
      if (!deps.projectSettings.labToggles.rufloEnabled) {
        pushAi('Ruflo agents are disabled. Enable Ruflo in Settings → Lab Toggles.');
        return;
      }
      const sub = parts[0]?.toLowerCase();
      if (sub === 'list' || sub === undefined) {
        await wrapAction('Listing Ruflo agents', async () => {
          const result = await deps.ruflo.listAgents();
          return `\`\`\`json\n${JSON.stringify(result, null, 2).slice(0, 2000)}\n\`\`\``;
        });
      } else if (sub === 'attach' && parts[1]) {
        deps.attachAgent(parts[1]);
        pushAi(`Agent \`${parts[1]}\` attached.`);
      } else if (sub === 'detach') {
        deps.detachAgent();
        pushAi('Agent detached.');
      } else {
        pushAi('Agent usage: `/agent list`, `/agent attach <name>`, `/agent detach`.');
      }
    },
    [deps, pushAi, wrapAction],
  );

  const handleAttachCommand = useCallback(
    (name: string) => {
      if (!name) {
        pushAi('Usage: `/attach <agent-name>`.');
        return;
      }
      deps.attachAgent(name);
      pushAi(`**${name} attached.** The agent is now watching the editor and will include your current file in every response. Type \`/detach\` to release it.`);
    },
    [deps, pushAi],
  );

  const handleDetachCommand = useCallback(() => {
    const name = deps.attachedAgent || 'Agent';
    deps.detachAgent();
    pushAi(`**${name} detached.** Back to standard mode.`);
  }, [deps, pushAi]);

  const handleSwarmCommand = useCallback(
    async (rest: string) => {
      if (!deps.projectSettings.labToggles.swarmEnabled) {
        pushAi('Swarm mode is disabled. Enable it in Settings → Lab Toggles.');
        return;
      }
      const mission = rest.trim();
      if (!mission) {
        pushAi('Usage: `/swarm <mission description>`.');
        return;
      }
      deps.swarm.setMissionInput(mission);
      setIsProcessing(true);
      deps.setIsAiProcessing(true);
      pushSystem(`Launching swarm: ${mission}`);
      try {
        await deps.swarm.triggerSwarmCycle(mission);
      } catch (err: any) {
        pushAi(`[ERROR] Swarm failed: ${err?.message || String(err)}`);
      } finally {
        setIsProcessing(false);
        deps.setIsAiProcessing(false);
      }
    },
    [deps],
  );

  const doNormalChatWithMemory = useCallback(
    async (prompt: string) => {
      await normalChat(prompt);
      if (deps.projectSettings.labToggles.rufloEnabled && deps.projectSettings.labToggles.rufloAutoMemory) {
        try {
          await deps.ruflo.storeMemory(`Chat: ${prompt}`, ['lab-auto']);
        } catch {
          /* silent */
        }
      }
    },
    [deps, normalChat],
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const prompt = deps.chatInput.trim();
      if (!prompt) return;

      // Simple natural-language command aliases (no slash)
      const lower = prompt.toLowerCase();
      if (lower.startsWith('attach ')) {
        const name = prompt.slice(7).trim();
        handleAttachCommand(name);
        deps.setChatInput('');
        return;
      }
      if (lower === 'detach' || lower === 'detach agent') {
        handleDetachCommand();
        deps.setChatInput('');
        return;
      }

      // Slash command router
      if (prompt.startsWith('/')) {
        deps.setChatInput('');
        pushUser(prompt);
        const withoutSlash = prompt.slice(1).trim();
        const parts = withoutSlash.split(/\s+/);
        const command = parts[0].toLowerCase();
        const rest = parts.slice(1).join(' ');

        switch (command) {
          case 'help':
          case 'commands':
            pushAi(
              '**Lab Command Surface**\n\n' +
                COMMAND_HINTS.map((h) => `- \`${h.cmd}\` — ${h.desc}`).join('\n'),
            );
            break;
          case 'review':
            await wrapAction('Reviewing code', async () => {
              await deps.handleReviewCode();
              return 'Code review complete — check the chat results above.';
            });
            break;
          case 'explain':
            await wrapAction('Explaining code', async () => {
              await deps.handleExplainCode();
              return 'Explanation complete — check the chat results above.';
            });
            break;
          case 'analyze':
          case 'scan':
            await wrapAction('Running static analysis', async () => {
              await deps.handleAnalyzeCode();
              return 'Static analysis complete — check the chat results above.';
            });
            break;
          case 'audit':
            await wrapAction('Running deep project audit', async () => {
              await deps.handleDeepProjectAudit();
              return 'Deep audit complete — check the chat results above.';
            });
            break;
          case 'trace':
            await wrapAction('Running dynamic trace', async () => {
              await deps.runDynamicTracing();
              return 'Dynamic trace complete — check the chat results above.';
            });
            break;
          case 'docs':
          case 'document':
            await wrapAction('Generating documentation', async () => {
              await deps.handleGenerateDocs();
              return 'Documentation generated — check the chat results above.';
            });
            break;
          case 'format':
            await wrapAction('Formatting code', async () => {
              await deps.handleFormatCode();
              return 'Code formatted.';
            });
            break;
          case 'refactor':
            await wrapAction('Refactoring current file', async () => {
              await deps.handleRefactorCode();
              return 'Refactor complete — check the assistant panel or chat results.';
            });
            break;
          case 'refactor-all':
            await wrapAction('Refactoring all project files', async () => {
              await deps.handleRefactorAllFiles();
              return 'Project-wide refactor complete.';
            });
            break;
          case 'run':
            await wrapAction('Running code', async () => {
              await deps.handleRunCode();
              return 'Code execution complete — check the editor output panel.';
            });
            break;
          case 'file':
          case 'create':
          case 'new':
            await handleCreateFile(rest);
            break;
          case 'git':
            await handleGitCommand(parts.slice(1));
            break;
          case 'attach':
            handleAttachCommand(rest);
            break;
          case 'detach':
            handleDetachCommand();
            break;
          case 'swarm':
            await handleSwarmCommand(rest);
            break;
          case 'ruflo':
            await handleRufloCommand(parts.slice(1), prompt);
            break;
          case 'memory':
            await handleMemoryCommand(parts.slice(1));
            break;
          case 'agent':
          case 'agents':
            await handleAgentCommand(parts.slice(1));
            break;
          case 'health':
            await wrapAction('Checking swarm health', async () => {
              const result = await deps.ruflo.checkSwarmHealth();
              return `\`\`\`json\n${JSON.stringify(result, null, 2).slice(0, 2000)}\n\`\`\``;
            });
            break;
          default:
            pushAi(`Unknown command \`/${command}\`. Type \`/help\` for the command list.`);
        }
        return;
      }

      // Fall back to normal AI chat
      deps.setChatInput('');
      await doNormalChatWithMemory(prompt);
    },
    [
      deps,
      pushUser,
      pushAi,
      wrapAction,
      handleCreateFile,
      handleGitCommand,
      handleAttachCommand,
      handleDetachCommand,
      handleSwarmCommand,
      handleRufloCommand,
      handleMemoryCommand,
      handleAgentCommand,
      doNormalChatWithMemory,
    ],
  );

  // Expose helpers so editor/inspector buttons can be routed through chat too.
  const triggerCommand = useCallback(
    async (commandText: string) => {
      deps.setChatInput(commandText);
      return handleSubmit();
    },
    [deps, handleSubmit],
  );

  return {
    handleSubmit,
    triggerCommand,
    isProcessing,
    commandHints: COMMAND_HINTS,
  };
}

export { COMMAND_HINTS };
