import agentsData from './agents.json';

export interface AgentDefinition {
  id: string;
  label: string;
  domain: string;
  emoji: string;
  shortDescription: string;
  systemPrompt: string;
}

export const AGENTS: AgentDefinition[] = agentsData as AgentDefinition[];

export const AGENT_DOMAINS = [...new Set(AGENTS.map(a => a.domain))].sort();

export function getAgent(id: string): AgentDefinition | undefined {
  return AGENTS.find(a => a.id === id);
}

export function getAgentsByDomain(domain: string): AgentDefinition[] {
  return AGENTS.filter(a => a.domain === domain);
}
