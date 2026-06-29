export type McpId =
  | 'filesystem'
  | 'terminal'
  | 'git'
  | 'database'
  | 'browser'
  | 'docs'
  | 'testrunner';

export type SafetyLevel = 'green' | 'yellow' | 'red';

export interface McpDefinition {
  id: McpId;
  label: string;
  icon: string;
  description: string;
  safety: SafetyLevel;
  safetyNote: string;
}

export const MCP_REGISTRY: McpDefinition[] = [
  {
    id: 'filesystem',
    label: 'File System',
    icon: '📁',
    description: 'Read/write project files',
    safety: 'yellow',
    safetyNote: 'Confirm destructive ops',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: '💻',
    description: 'Execute shell commands',
    safety: 'red',
    safetyNote: 'Sandboxed + restricted',
  },
  {
    id: 'git',
    label: 'Git',
    icon: '🌿',
    description: 'Version control operations',
    safety: 'red',
    safetyNote: 'Approval for push/deploy',
  },
  {
    id: 'database',
    label: 'Database',
    icon: '🗄️',
    description: 'Schema & data queries',
    safety: 'yellow',
    safetyNote: 'Dev/test only',
  },
  {
    id: 'browser',
    label: 'Browser',
    icon: '🌐',
    description: 'E2E UI testing',
    safety: 'yellow',
    safetyNote: 'Read-only default',
  },
  {
    id: 'docs',
    label: 'Docs',
    icon: '📚',
    description: 'Search docs & references',
    safety: 'green',
    safetyNote: 'Read-only, no risk',
  },
  {
    id: 'testrunner',
    label: 'Tests',
    icon: '🧪',
    description: 'Run & analyze test suites',
    safety: 'yellow',
    safetyNote: 'Sandboxed only',
  },
];
