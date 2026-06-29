import { useArgusStore } from '../store/useArgusStore';

const HELP_TEXT = `ARGUS Command Reference:
  attach sage / attach seven  — bring agent online
  detach                      — disconnect active agent
  approve <id>                — approve queued action
  deny <id>                   — deny queued action
  show queue                  — list pending approvals
  show threats                — show threat log
  clear                       — clear terminal
  mcp status                  — show MCP server health
  help                        — this reference`;

export function useLabController() {
  const addMessage = useArgusStore((s) => s.addMessage);
  const addTerminalOutput = useArgusStore((s) => s.addTerminalOutput);
  const clearTerminal = useArgusStore((s) => s.clearTerminal);
  const setAttachedAgent = useArgusStore((s) => s.setAttachedAgent);
  const attachedAgent = useArgusStore((s) => s.attachedAgent);
  const approvalQueue = useArgusStore((s) => s.approvalQueue);
  const resolveApproval = useArgusStore((s) => s.resolveApproval);
  const threatLog = useArgusStore((s) => s.threatLog);
  const mcpStatus = useArgusStore((s) => s.mcpStatus);

  const handleInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage({ role: 'user', content: trimmed });
    addTerminalOutput(`[INPUT] ${trimmed}`);

    const lower = trimmed.toLowerCase();

    if (lower === 'help') {
      addMessage({ role: 'argus', content: HELP_TEXT });
      return;
    }

    if (lower.startsWith('attach ')) {
      const agentId = lower.slice(7).trim();
      if (agentId === 'sage' || agentId === 'seven') {
        setAttachedAgent(agentId);
        addMessage({
          role: 'argus',
          content: `Agent ${agentId.toUpperCase()} attached. Bridge active — routing tasks through ${agentId}.`,
        });
        addTerminalOutput(`[ARGUS] Agent ${agentId.toUpperCase()} attached.`);
      } else {
        addMessage({ role: 'argus', content: `Unknown agent: "${agentId}". Available: sage, seven.` });
      }
      return;
    }

    if (lower === 'detach') {
      if (attachedAgent) {
        addTerminalOutput(`[ARGUS] Agent ${attachedAgent.toUpperCase()} detached.`);
        setAttachedAgent(null);
        addMessage({ role: 'argus', content: 'Agent detached. Running on core swarm.' });
      } else {
        addMessage({ role: 'argus', content: 'No agent currently attached.' });
      }
      return;
    }

    if (lower === 'clear') {
      clearTerminal();
      addTerminalOutput('[ARGUS] Terminal cleared.');
      return;
    }

    if (lower === 'show queue') {
      const pending = approvalQueue.filter((a) => a.status === 'pending');
      if (pending.length === 0) {
        addMessage({ role: 'argus', content: 'Approval queue is empty.' });
      } else {
        const list = pending
          .map((a) => `[${a.id.slice(0, 8)}] ${a.mcp.toUpperCase()} — ${a.action}\n  → ${a.command}`)
          .join('\n\n');
        addMessage({ role: 'argus', content: `Pending approvals:\n\n${list}` });
      }
      return;
    }

    if (lower.startsWith('approve ')) {
      const id = lower.slice(8).trim();
      const match = approvalQueue.find((a) => a.id.startsWith(id) && a.status === 'pending');
      if (match) {
        resolveApproval(match.id, true);
        addMessage({ role: 'argus', content: `Approved: ${match.action}` });
        addTerminalOutput(`[APPROVED] ${match.command}`);
      } else {
        addMessage({ role: 'argus', content: `No pending item matching "${id}".` });
      }
      return;
    }

    if (lower.startsWith('deny ')) {
      const id = lower.slice(5).trim();
      const match = approvalQueue.find((a) => a.id.startsWith(id) && a.status === 'pending');
      if (match) {
        resolveApproval(match.id, false);
        addMessage({ role: 'argus', content: `Denied: ${match.action}` });
        addTerminalOutput(`[DENIED] ${match.command}`);
      } else {
        addMessage({ role: 'argus', content: `No pending item matching "${id}".` });
      }
      return;
    }

    if (lower === 'show threats') {
      if (threatLog.length === 0) {
        addMessage({ role: 'argus', content: 'No threats logged.' });
      } else {
        const recent = threatLog.slice(-10);
        const list = recent
          .map((t) => `[${t.level.toUpperCase()}] ${t.source.toUpperCase()} via ${t.gate} (${(t.confidence * 100).toFixed(0)}%)`)
          .join('\n');
        addMessage({ role: 'argus', content: `Recent threats (last 10):\n\n${list}` });
      }
      return;
    }

    if (lower === 'mcp status') {
      const status = Object.entries(mcpStatus)
        .map(([k, v]) => `${k.padEnd(12)} ${v.toUpperCase()}`)
        .join('\n');
      addMessage({ role: 'argus', content: `MCP Server Status:\n\n${status}` });
      return;
    }

    // Default: route to attached agent or swarm
    const agent = attachedAgent ? attachedAgent.toUpperCase() : 'SWARM';
    addTerminalOutput(`[ROUTER] → ${agent}: ${trimmed}`);
    addMessage({
      role: 'argus',
      content: `Routing to ${agent}...\n\n[MCP bridge or swarm response would appear here once connected.]`,
    });
  };

  return { handleInput };
}
