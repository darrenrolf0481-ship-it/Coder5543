import { useArgusStore } from '../store/useArgusStore';
import { useMemoryStore } from '../store/useMemoryStore';
import { useSwarmStore } from '../store/useSwarmStore';

const HELP_TEXT = `ARGUS Command Reference:
  attach sage / attach seven  — bring agent online
  detach                      — disconnect active agent
  approve <id>                — approve queued action
  deny <id>                   — deny queued action
  show queue                  — list pending approvals
  show threats                — show threat log
  mcp status                  — show MCP server health

  remember <text>             — save to long-term memory
  recall                      — show recent memory + notes
  recall threats              — short-term threat events
  recall <tag>                — search memory by tag
  forget <id>                 — delete a memory note by id

  swarm status                — show swarm node states
  swarm activate <event>      — trigger full swarm response
  swarm stand-down            — return all nodes to idle

  clear                       — clear terminal
  help                        — this reference`;

export function useLabController() {
  const addMessage        = useArgusStore((s) => s.addMessage);
  const addTerminalOutput = useArgusStore((s) => s.addTerminalOutput);
  const clearTerminal     = useArgusStore((s) => s.clearTerminal);
  const setAttachedAgent  = useArgusStore((s) => s.setAttachedAgent);
  const attachedAgent     = useArgusStore((s) => s.attachedAgent);
  const approvalQueue     = useArgusStore((s) => s.approvalQueue);
  const resolveApproval   = useArgusStore((s) => s.resolveApproval);
  const threatLog         = useArgusStore((s) => s.threatLog);
  const mcpStatus         = useArgusStore((s) => s.mcpStatus);

  const addShortTerm      = useMemoryStore((s) => s.addShortTerm);
  const addLongTerm       = useMemoryStore((s) => s.addLongTerm);
  const forgetLongTerm    = useMemoryStore((s) => s.forgetLongTerm);
  const shortTerm         = useMemoryStore((s) => s.shortTerm);
  const longTerm          = useMemoryStore((s) => s.longTerm);
  const recallByTag       = useMemoryStore((s) => s.recallByTag);
  const recallByType      = useMemoryStore((s) => s.recallByType);

  const swarmNodes        = useSwarmStore((s) => s.nodes);
  const swarmActive       = useSwarmStore((s) => s.swarmActive);
  const alertLevel        = useSwarmStore((s) => s.alertLevel);
  const triggerSwarm      = useSwarmStore((s) => s.triggerSwarmResponse);
  const standDown         = useSwarmStore((s) => s.standDown);

  const handleInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage({ role: 'user', content: trimmed });
    addTerminalOutput(`[INPUT] ${trimmed}`);
    addShortTerm({ type: 'command', summary: trimmed, tags: ['command'] });

    const lower = trimmed.toLowerCase();

    if (lower === 'help') {
      addMessage({ role: 'argus', content: HELP_TEXT });
      return;
    }

    if (lower.startsWith('attach ')) {
      const agentId = lower.slice(7).trim();
      if (agentId === 'sage' || agentId === 'seven') {
        setAttachedAgent(agentId);
        addShortTerm({ type: 'agent', summary: `Attached agent: ${agentId}`, tags: ['agent', agentId] });
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
        addShortTerm({ type: 'agent', summary: `Detached agent: ${attachedAgent}`, tags: ['agent', attachedAgent] });
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
        addShortTerm({ type: 'approval', summary: `Approved: ${match.action}`, tags: ['approval', 'approved'] });
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
        addShortTerm({ type: 'approval', summary: `Denied: ${match.action}`, tags: ['approval', 'denied'] });
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

    if (lower.startsWith('remember ')) {
      const content = trimmed.slice(9).trim();
      if (!content) {
        addMessage({ role: 'argus', content: 'Usage: remember <text> [#tag1 #tag2]' });
        return;
      }
      const tags = content.match(/#\w+/g)?.map((t) => t.slice(1).toLowerCase()) ?? [];
      const clean = content.replace(/#\w+/g, '').trim();
      addLongTerm({ content: clean, tags, source: 'user' });
      addMessage({ role: 'argus', content: `Memory saved.${tags.length ? ` Tags: ${tags.join(', ')}` : ''}` });
      addTerminalOutput(`[MEMORY] Stored: "${clean.slice(0, 60)}"`);
      return;
    }

    if (lower === 'recall' || lower === 'recall threats' || lower.startsWith('recall ')) {
      if (lower === 'recall threats') {
        const entries = recallByType('threat');
        if (entries.length === 0) {
          addMessage({ role: 'argus', content: 'No threat events in short-term memory.' });
        } else {
          const list = entries.slice(-10)
            .map((e) => `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.summary}`)
            .join('\n');
          addMessage({ role: 'argus', content: `Short-term threat memory (last ${Math.min(entries.length, 10)}):\n\n${list}` });
        }
        return;
      }

      if (lower !== 'recall') {
        const tag = lower.slice(7).trim();
        const notes = recallByTag(tag);
        if (notes.length === 0) {
          addMessage({ role: 'argus', content: `No memories tagged "${tag}".` });
        } else {
          const list = notes
            .map((n) => `[${n.id.slice(0, 8)}] ${n.content}`)
            .join('\n\n');
          addMessage({ role: 'argus', content: `Memories tagged "${tag}":\n\n${list}` });
        }
        return;
      }

      const recentST = shortTerm.slice(-5);
      const recentLT = longTerm.slice(-5);
      const stText = recentST.length
        ? recentST.map((e) => `• [${e.type}] ${e.summary}`).join('\n')
        : '  (empty)';
      const ltText = recentLT.length
        ? recentLT.map((n) => `• [${n.id.slice(0, 8)}] ${n.content}`).join('\n')
        : '  (empty)';
      addMessage({
        role: 'argus',
        content: `MEMORY RECALL\n\nShort-term (last 5 events):\n${stText}\n\nLong-term notes (last 5):\n${ltText}`,
      });
      return;
    }

    if (lower.startsWith('forget ')) {
      const id = lower.slice(7).trim();
      const match = longTerm.find((n) => n.id.startsWith(id));
      if (match) {
        forgetLongTerm(match.id);
        addMessage({ role: 'argus', content: `Memory [${match.id.slice(0, 8)}] deleted.` });
      } else {
        addMessage({ role: 'argus', content: `No memory found matching "${id}".` });
      }
      return;
    }

    if (lower === 'swarm status') {
      const roleEmoji: Record<string, string> = {
        sentinel: '👁',  analyst: '🔬',  responder: '⚡',  coordinator: '🎯',
      };
      const lines = swarmNodes
        .map((n) => `${roleEmoji[n.role] ?? '○'} ${n.name.padEnd(14)} ${n.status.toUpperCase()}${n.lastEvent ? ` — ${n.lastEvent.slice(0, 40)}` : ''}`)
        .join('\n');
      addMessage({
        role: 'argus',
        content: `SWARM STATUS — ALERT: ${alertLevel.toUpperCase()}${swarmActive ? ' [ACTIVE RESPONSE]' : ''}\n\n${lines}`,
      });
      return;
    }

    if (lower.startsWith('swarm activate')) {
      const event = trimmed.slice(15).trim() || 'manual trigger';
      triggerSwarm(event);
      addShortTerm({ type: 'system', summary: `Swarm activated: ${event}`, tags: ['swarm', 'alert'] });
      addMessage({
        role: 'argus',
        content: `SWARM RESPONSE TRIGGERED\n\nEvent: ${event}\n\nWave 1 (Sentinels) — ONLINE\nWave 2 (Analysts) — mobilizing +250ms\nWave 3 (Responders + Coord) — mobilizing +500ms\n\nAuto stand-down in 12s.`,
      });
      addTerminalOutput(`[SWARM] ⚡ Response triggered: ${event}`);
      return;
    }

    if (lower === 'swarm stand-down' || lower === 'swarm standdown') {
      standDown();
      addMessage({ role: 'argus', content: 'Swarm stood down. All nodes returning to idle.' });
      addTerminalOutput('[SWARM] Stand-down executed.');
      return;
    }

    const agent = attachedAgent ? attachedAgent.toUpperCase() : 'SWARM';
    addTerminalOutput(`[ROUTER] → ${agent}: ${trimmed}`);
    addMessage({
      role: 'argus',
      content: `Routing to ${agent}...\n\n[MCP bridge or swarm response would appear here once connected.]`,
    });
  };

  return { handleInput };
}
