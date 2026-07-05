import { AgentId } from './useAgentBridge';
import { ThreatResult } from '../security/threatScanner';

// Non-reactive registry so useLabController (a separate hook instance) can
// reach the live send()/status of the Seven/Sage bridges mounted once at
// the app root by useAgentBridges. Mirrors the useArgusStore.getState()
// pattern already used elsewhere in this codebase for call-time reads.
type BridgeHandle = {
  status: 'offline' | 'connecting' | 'online';
  send: (content: string, onBlock?: (r: ThreatResult) => void) => void;
};

const registry: Partial<Record<AgentId, BridgeHandle>> = {};

export function registerBridge(agentId: AgentId, handle: BridgeHandle) {
  registry[agentId] = handle;
}

export function getBridge(agentId: AgentId): BridgeHandle | undefined {
  return registry[agentId];
}
