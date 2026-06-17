import { AgentDefinition } from '../../data/agentRegistry';
import { Personality } from '../../data/personalities';

export type SwarmMode = 'analysis' | 'development' | 'security';

export interface AssignedRepo {
  id: string;
  owner: string;
  repo: string;
  branch?: string;
  /** Full URL or shorthand; stored for display */
  url: string;
  /** Cached file tree from the last clone/read */
  files?: RepoFile[];
  truncated?: boolean;
  lastFetched?: number;
}

export interface RepoFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  language?: string;
  content?: string;
}

export interface SwarmAgent {
  id: string;
  name: string;
  emoji: string;
  expertise: string;
  /** Reference to agents.json */
  agentDefinitionId?: string;
  /** Reference to personalities.ts */
  personalityId?: number;
  systemPrompt: string;
  /** Free-form skill tags used for context routing */
  skills: string[];
  /** Subset of MCP tool names this agent may use */
  mcpTools: string[];
  /** Repo IDs assigned to this agent */
  assignedRepos: string[];
  /** Per-mode role directive appended to the prompt */
  roleInMode: Record<SwarmMode, string>;
  /** Trust / voting weight */
  trust: number;
  /** Whether this agent participates in the next run */
  active: boolean;
}

export type SwarmAgentStatus = 'idle' | 'reading_repos' | 'thinking' | 'done' | 'error';

export interface RuntimeSwarmAgent extends SwarmAgent {
  status: SwarmAgentStatus;
  response?: string;
  error?: string;
  keyClaims?: string[];
  confidence?: number;
}

export interface AgentRunResult {
  agentId: string;
  status: 'fulfilled' | 'rejected';
  response?: string;
  keyClaims?: string[];
  confidence?: number;
  error?: string;
  latencyMs: number;
}

export interface SwarmReport {
  mode: SwarmMode;
  mission: string;
  summary: string;
  agreements: string[];
  conflicts: string[];
  recommendations: string[];
  bestCourseOfAction: string;
  riskNotes: string[];
  agentResults: AgentRunResult[];
  boostResults?: BoostResult[];
  synthesizedAt: number;
}

export interface BoostResult {
  boostId: string;
  toolName: string;
  status: 'success' | 'error';
  output: string;
  error?: string;
  latencyMs: number;
}

export interface SwarmModeDefinition {
  id: SwarmMode;
  label: string;
  emoji: string;
  description: string;
  objective: string;
  defaultPrompt: string;
  /** How to instruct each agent */
  agentDirective: (agentName: string) => string;
  /** Synthesis system prompt */
  synthesisSystemPrompt: string;
}

export interface SwarmEngineContext {
  mode: SwarmMode;
  mission: string;
  agents: SwarmAgent[];
  activePersonality: Personality;
  /** Repositories available to the swarm */
  repos: AssignedRepo[];
  projectFiles: {
    id: string;
    name: string;
    type?: 'file' | 'folder';
    content?: string;
    language?: string;
  }[];
  activeFileId?: string;
  editorContent?: string;
  editorLanguage?: string;
  /** If true, run a critique+refinement round before synthesis (2× API cost, higher quality) */
  enableCritique?: boolean;
  /** Enabled MCP boost IDs */
  enabledBoosts?: string[];
}
