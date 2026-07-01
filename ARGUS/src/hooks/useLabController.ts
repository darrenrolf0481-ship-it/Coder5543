import { useArgusStore } from '../store/useArgusStore';
import { useMemoryStore } from '../store/useMemoryStore';
import { useSwarmStore } from '../store/useSwarmStore';
import { llmChat, listOllamaModels, LlmMessage } from '../llm/llmClient';
import { scanInput, SEVEN_CONFIG, SAGE_CONFIG, AgentDefenceConfig } from '../security/threatScanner';

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

  provider                    — show LLM backend + model
  provider ollama|openrouter  — switch backend
  model <name>                — set model (e.g. llama3, anthropic/claude-3.5-sonnet)
  models                      — list local Ollama models
  apikey <key>                — set OpenRouter API key
  endpoint <url>              — set active backend endpoint

  clear                       — clear terminal
  help                        — this reference

Any other text is scanned (3-gate) then sent to the active LLM.`;

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

  const addThreat            = useArgusStore((s) => s.addThreat);
  const addApproval          = useArgusStore((s) => s.addApproval);
  const recordGateHit        = useArgusStore((s) => s.recordGateHit);
  const setLlmProvider       = useArgusStore((s) => s.setLlmProvider);
  const setLlmModel          = useArgusStore((s) => s.setLlmModel);
  const setOllamaEndpoint    = useArgusStore((s) => s.setOllamaEndpoint);
  const setOpenrouterEndpoint = useArgusStore((s) => s.setOpenrouterEndpoint);
  const setOpenrouterKey     = useArgusStore((s) => s.setOpenrouterKey);
  const setLlmBusy           = useArgusStore((s) => s.setLlmBusy);

  const handleInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addMessage({ role: 'user', content: trimmed });
    addTerminalOutput(`[INPUT] ${trimmed}`);
    addShortTerm({ type: 'command', summary: trimmed, tags: ['command'] });

    const lower = trimmed.toLowerCase();

    // ── help ──
    if (lower === 'help') {
      addMessage({ role: 'argus', content: HELP_TEXT });
      return;
    }

    // ── attach ──
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

    // ── detach ──
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

    // ── clear ──
    if (lower === 'clear') {
      clearTerminal();
      addTerminalOutput('[ARGUS] Terminal cleared.');
      return;
    }

    // ── show queue ──
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

    // ── approve / deny ──
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

    // ── show threats ──
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

    // ── mcp status ──
    if (lower === 'mcp status') {
      const status = Object.entries(mcpStatus)
        .map(([k, v]) => `${k.padEnd(12)} ${v.toUpperCase()}`)
        .join('\n');
      addMessage({ role: 'argus', content: `MCP Server Status:\n\n${status}` });
      return;
    }

    // ── memory: remember ──
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

    // ── memory: recall ──
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

    // ── memory: forget ──
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

    // ── swarm status ──
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

    // ── swarm activate ──
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

    // ── swarm stand-down ──
    if (lower === 'swarm stand-down' || lower === 'swarm standdown') {
      standDown();
      addMessage({ role: 'argus', content: 'Swarm stood down. All nodes returning to idle.' });
      addTerminalOutput('[SWARM] Stand-down executed.');
      return;
    }

    // ── provider ──
    if (lower === 'provider') {
      const s = useArgusStore.getState();
      const ep = s.llmProvider === 'ollama' ? s.ollamaEndpoint : s.openrouterEndpoint;
      const key = s.llmProvider === 'openrouter' ? (s.openrouterKey ? 'set' : 'MISSING') : 'n/a';
      addMessage({
        role: 'argus',
        content: `LLM BACKEND\n\nProvider: ${s.llmProvider}\nModel:    ${s.llmModel}\nEndpoint: ${ep}\nAPI key:  ${key}`,
      });
      return;
    }

    if (lower === 'provider ollama' || lower === 'provider openrouter') {
      const p = lower.endsWith('ollama') ? 'ollama' : 'openrouter';
      setLlmProvider(p);
      addMessage({ role: 'argus', content: `Provider switched to ${p.toUpperCase()}. Current model: ${useArgusStore.getState().llmModel}` });
      addTerminalOutput(`[LLM] Provider → ${p}`);
      return;
    }

    if (lower.startsWith('model ')) {
      const m = trimmed.slice(6).trim();
      setLlmModel(m);
      addMessage({ role: 'argus', content: `Model set to "${m}".` });
      return;
    }

    if (lower === 'models') {
      const ep = useArgusStore.getState().ollamaEndpoint;
      addMessage({ role: 'argus', content: 'Querying local Ollama models…' });
      listOllamaModels(ep).then((models) => {
        addMessage({
          role: 'argus',
          content: models.length
            ? `Local Ollama models:\n\n${models.map((m) => `• ${m}`).join('\n')}`
            : `No models found (is Ollama running at ${ep}? try: ollama pull llama3)`,
        });
      });
      return;
    }

    if (lower.startsWith('apikey ')) {
      const key = trimmed.slice(7).trim();
      setOpenrouterKey(key || null);
      addMessage({ role: 'argus', content: key ? 'OpenRouter API key saved.' : 'OpenRouter API key cleared.' });
      addTerminalOutput('[LLM] OpenRouter key updated.');
      return;
    }

    if (lower.startsWith('endpoint ')) {
      const url = trimmed.slice(9).trim();
      const p = useArgusStore.getState().llmProvider;
      if (p === 'ollama') setOllamaEndpoint(url); else setOpenrouterEndpoint(url);
      addMessage({ role: 'argus', content: `${p} endpoint set to ${url}` });
      return;
    }

    // ── default: scan, then route to the LLM ──
    void routeToLlm(trimmed);
  };

  // Scans user input through the active agent's 3-gate config, then calls the
  // LLM. Blocks critical injections, queues medium/high for review, passes clean.
  const routeToLlm = async (text: string) => {
    const s = useArgusStore.getState();
    const config: AgentDefenceConfig = s.attachedAgent === 'seven' ? SEVEN_CONFIG : SAGE_CONFIG;
    const source = (s.attachedAgent === 'seven' ? 'seven' : s.attachedAgent === 'sage' ? 'sage' : 'user') as
      'seven' | 'sage' | 'user';
    const history = s.chatMessages.slice(-8).map((m) => m.content);

    const scan = scanInput(text, config, history);
    recordGateHit(scan.gate);

    if (scan.disposition !== 'pass') {
      addThreat({ source, level: scan.level, gate: scan.gate, confidence: scan.confidence, content: text });
    }

    if (scan.disposition === 'block') {
      addMessage({
        role: 'system',
        content: `⛔ BLOCKED at Gate ${scan.gate.toUpperCase()} (${(scan.confidence * 100).toFixed(0)}%). Message not sent to the model.\nFlags: ${scan.flags.join(', ') || 'none'}`,
      });
      addTerminalOutput(`[GATE] BLOCK ${scan.gate} ${(scan.confidence * 100).toFixed(0)}%`);
      return;
    }

    if (scan.disposition === 'queue') {
      addApproval({
        action: `Review flagged message before model send (${scan.gate})`,
        mcp: source,
        details: `Gate ${scan.gate} @ ${(scan.confidence * 100).toFixed(0)}% — ${scan.flags.join(', ')}`,
        command: text.slice(0, 120),
      });
      addMessage({
        role: 'system',
        content: `⚠ Gate ${scan.gate.toUpperCase()} flagged this (${(scan.confidence * 100).toFixed(0)}%). Sent to model, logged for review in the approval queue.`,
      });
    }

    const provider = s.llmProvider;
    const model = s.llmModel;
    setLlmBusy(true);
    addTerminalOutput(`[LLM] → ${provider}/${model}: ${text.slice(0, 60)}`);

    const sys: LlmMessage = {
      role: 'system',
      content:
        'You are an AI agent operating inside ARGUS, a neural oversight lab. ' +
        (s.attachedAgent ? `You are the agent "${s.attachedAgent}". ` : '') +
        'Be concise and direct.',
    };
    const convo: LlmMessage[] = s.chatMessages
      .filter((m) => m.role === 'user' || m.role === 'agent' || m.role === 'argus')
      .slice(-10)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content } as LlmMessage));
    convo.push({ role: 'user', content: text });

    const result = await llmChat(
      { provider, model, ollamaEndpoint: s.ollamaEndpoint, openrouterEndpoint: s.openrouterEndpoint, openrouterKey: s.openrouterKey },
      [sys, ...convo],
    );
    setLlmBusy(false);

    if (!result.ok) {
      addMessage({ role: 'system', content: `⚠ LLM error: ${result.error}` });
      addTerminalOutput(`[LLM] ERROR: ${result.error}`);
      return;
    }

    const outScan = scanInput(result.content, config, history);
    recordGateHit(outScan.gate);
    if (outScan.disposition === 'block') {
      addThreat({ source, level: outScan.level, gate: outScan.gate, confidence: outScan.confidence, content: result.content });
      addMessage({ role: 'system', content: `⛔ Model response blocked at Gate ${outScan.gate.toUpperCase()} (${(outScan.confidence * 100).toFixed(0)}%).` });
      return;
    }

    addMessage({
      role: s.attachedAgent ? 'agent' : 'argus',
      agentId: s.attachedAgent ?? undefined,
      content: result.content,
    });
    addTerminalOutput('[LLM] response delivered.');
  };

  return { handleInput };
}
