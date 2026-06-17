import { AGENTS, getAgent } from '../../data/agentRegistry';
import { SwarmAgent, SwarmMode } from './types';

export const DEFAULT_ROSTER_SIZE = 7;

const DEFAULT_AGENT_IDS: string[] = [
  'engineering-security-engineer',
  'engineering-software-architect',
  'engineering-backend-architect',
  'engineering-frontend-developer',
  'engineering-code-reviewer',
  'design-ux-architect',
  'engineering-ai-engineer',
];

const SWARM_AGENT_OVERRIDES: Record<string, Partial<SwarmAgent>> = {
  'engineering-security-engineer': {
    roleInMode: {
      analysis:
        'Threat and risk analyst. Focus on what can go wrong, attack surfaces, and trust boundaries. Question every assumption about trust.',
      development:
        'Secure-design reviewer. Ensure proposed implementations include defense-in-depth, least privilege, and secure defaults. Challenge any design that hides risk.',
      security:
        'Lead vulnerability hunter. Scan for OWASP Top 10, secrets, auth flaws, injection risks, and insecure dependencies. Think like an attacker.',
    },
  },
  'engineering-software-architect': {
    roleInMode: {
      analysis:
        'Structural analyst. Evaluate coupling, boundaries, tech debt, and architectural fit. Ask: "What will be hard to change later?"',
      development:
        'Architecture lead. Propose high-level design, component boundaries, and data flow. Compare at least two approaches and explain the trade-offs.',
      security:
        'Security architect. Review trust boundaries, secrets management, and secure-by-design patterns. Ensure the architecture fails safely.',
    },
  },
  'engineering-backend-architect': {
    roleInMode: {
      analysis:
        'Backend/data analyst. Evaluate API contracts, data models, scalability, and persistence choices. Look for consistency and failure modes.',
      development:
        'Backend implementation lead. Propose server-side design, database schema, and API surface. Identify the data model decisions that block everything else.',
      security:
        'Backend security scanner. Focus on authz, injection, data exposure, and service-layer flaws. Verify every input boundary.',
    },
  },
  'engineering-frontend-developer': {
    roleInMode: {
      analysis:
        'UI/UX analyst. Evaluate component structure, state management, accessibility, and user flows. Consider both mobile and desktop contexts.',
      development:
        'Frontend implementation lead. Propose component design, state shape, and styling approach. Prioritize accessibility and performance budgets.',
      security:
        'Client-side security scanner. Focus on XSS, CSP, unsafe DOM, and secret leakage in the browser. Treat all user input as hostile.',
    },
  },
  'engineering-code-reviewer': {
    roleInMode: {
      analysis:
        'Code-quality analyst. Identify maintainability issues, anti-patterns, and readability concerns. Ask: "Will I understand this in six months?"',
      development:
        'Implementation reviewer. Catch edge cases, missing tests, and unclear logic early. Suggest the smallest diff that solves the problem.',
      security:
        'Secure-code reviewer. Look for risky patterns, missing validation, and unsafe defaults. Verify error handling on critical paths.',
    },
  },
  'design-ux-architect': {
    roleInMode: {
      analysis:
        'UX/IA analyst. Evaluate information architecture, user assumptions, and friction points. Distinguish "nice to have" from "must have".',
      development:
        'UX foundation lead. Ensure the implementation plan includes accessibility, responsive design, and clear flows. Define acceptance criteria for UX.',
      security:
        'UX security reviewer. Focus on consent flows, deceptive patterns, safe user messaging, and accessibility of security controls.',
    },
  },
  'engineering-ai-engineer': {
    roleInMode: {
      analysis:
        'AI/ML analyst. Evaluate model usage, data flow, prompt injection risks, and automation choices. Be skeptical of "AI will handle it" assumptions.',
      development:
        'AI integration lead. Propose model selection, prompt design, evaluation strategy, and fallback behavior when models fail.',
      security:
        'AI safety scanner. Focus on prompt injection, data leakage, model abuse, training-data exposure, and output sanitization.',
    },
  },
};

const DEFAULT_SKILLS: Record<string, string[]> = {
  'engineering-security-engineer': [
    'threat-modeling',
    'vulnerability-scanning',
    'secure-code-review',
    'dependency-audit',
  ],
  'engineering-software-architect': [
    'architecture-review',
    'trade-off-analysis',
    'adr-writing',
    'system-design',
  ],
  'engineering-backend-architect': [
    'api-design',
    'database-design',
    'scalability',
    'data-modeling',
  ],
  'engineering-frontend-developer': ['react', 'tailwind', 'accessibility', 'performance'],
  'engineering-code-reviewer': ['code-review', 'testing', 'refactoring', 'maintainability'],
  'design-ux-architect': [
    'ux-design',
    'information-architecture',
    'accessibility',
    'responsive-design',
  ],
  'engineering-ai-engineer': [
    'llm-integration',
    'prompt-engineering',
    'model-evaluation',
    'ai-safety',
  ],
};

const DEFAULT_MCP_TOOLS: Record<string, string[]> = {
  'engineering-security-engineer': ['audit', 'taint', 'review', 'hotspots', 'explainIssue'],
  'engineering-software-architect': [
    'graph',
    'workspaceGraph',
    'structure',
    'coupling',
    'impact',
    'dependencies',
  ],
  'engineering-backend-architect': ['analyze', 'structure', 'dependencies', 'audit', 'search'],
  'engineering-frontend-developer': ['analyze', 'explain', 'search', 'applyFix', 'review'],
  'engineering-code-reviewer': ['review', 'fixSuggest', 'explainIssue', 'analyze', 'search'],
  'design-ux-architect': ['analyze', 'search', 'explain', 'structure'],
  'engineering-ai-engineer': ['analyze', 'hotspots', 'coupling', 'explain', 'search'],
};

export function buildDefaultRoster(): SwarmAgent[] {
  return DEFAULT_AGENT_IDS.map((agentId, index) => {
    const def = getAgent(agentId);
    if (!def) {
      throw new Error(`Default swarm agent ${agentId} not found in agent registry`);
    }
    const overrides = SWARM_AGENT_OVERRIDES[agentId] || {};
    return {
      id: `swarm_agent_${index}`,
      name: def.label,
      emoji: def.emoji,
      expertise: def.domain,
      agentDefinitionId: def.id,
      systemPrompt: def.systemPrompt,
      skills: DEFAULT_SKILLS[agentId] || [],
      mcpTools: DEFAULT_MCP_TOOLS[agentId] || [],
      assignedRepos: [],
      roleInMode: overrides.roleInMode || {
        analysis: `${def.label} analyst perspective.`,
        development: `${def.label} implementation perspective.`,
        security: `${def.label} security perspective.`,
      },
      trust: 0.95,
      active: true,
      ...overrides,
    };
  });
}

export function buildRosterFromAgents(agentIds: string[]): SwarmAgent[] {
  return agentIds.map((agentId, index) => {
    const def = getAgent(agentId);
    if (!def) {
      throw new Error(`Agent ${agentId} not found in agent registry`);
    }
    return {
      id: `swarm_agent_${index}_${agentId.replace(/[^a-z0-9]/gi, '_')}`,
      name: def.label,
      emoji: def.emoji,
      expertise: def.domain,
      agentDefinitionId: def.id,
      systemPrompt: def.systemPrompt,
      skills: DEFAULT_SKILLS[agentId] || [],
      mcpTools: DEFAULT_MCP_TOOLS[agentId] || [],
      assignedRepos: [],
      roleInMode: {
        analysis: `${def.label} analyst perspective.`,
        development: `${def.label} implementation perspective.`,
        security: `${def.label} security perspective.`,
      },
      trust: 0.95,
      active: true,
    };
  });
}

export function getAvailableSwarmAgents() {
  return AGENTS.filter(
    (a) => a.domain === 'Engineering' || a.domain === 'Design' || a.domain === 'Testing',
  );
}
