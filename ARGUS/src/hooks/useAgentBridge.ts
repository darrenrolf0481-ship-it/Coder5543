import { useRef, useState, useEffect, useCallback } from 'react';
import { scanInput, SAGE_CONFIG, SEVEN_CONFIG, ThreatResult } from '../security/threatScanner';
import { useArgusStore } from '../store/useArgusStore';

export type AgentId = 'sage' | 'seven';

export type BridgeMessage = {
  id: string;
  from: AgentId | 'lab';
  to: AgentId | 'lab';
  content: string;
  timestamp: number;
  threat: ThreatResult;
};

const CONFIGS = { sage: SAGE_CONFIG, seven: SEVEN_CONFIG };
const GUARD_LABEL = { sage: 'STANDARD GUARD', seven: 'HIGH GUARD' };

export function useAgentBridge(agentId: AgentId, wsUrl: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'offline' | 'connecting' | 'online'>('offline');
  const messageLog = useRef<BridgeMessage[]>([]);

  const addTerminalOutput    = useArgusStore((s) => s.addTerminalOutput);
  const addThreat            = useArgusStore((s) => s.addThreat);
  const addApproval          = useArgusStore((s) => s.addApproval);
  const recordGateHit        = useArgusStore((s) => s.recordGateHit);
  const setSageBridgeStatus  = useArgusStore((s) => s.setSageBridgeStatus);
  const setSevenBridgeStatus = useArgusStore((s) => s.setSevenBridgeStatus);

  const setStatus_both = useCallback((next: 'offline' | 'connecting' | 'online') => {
    setStatus(next);
    if (agentId === 'sage')  setSageBridgeStatus(next);
    if (agentId === 'seven') setSevenBridgeStatus(next);
  }, [agentId, setSageBridgeStatus, setSevenBridgeStatus]);

  const label  = agentId.toUpperCase();
  const config = CONFIGS[agentId];

  const getHistory = () =>
    messageLog.current.slice(-8).map((m) => m.content);

  const processIncoming = useCallback((raw: string): BridgeMessage | null => {
    let content = raw;
    try {
      const parsed = JSON.parse(raw);
      content = parsed.content ?? parsed.message ?? raw;
    } catch { /* not JSON, use raw */ }

    const threat = scanInput(content, config, getHistory());
    recordGateHit(threat.gate);

    const msg: BridgeMessage = {
      id: crypto.randomUUID(),
      from: agentId,
      to: 'lab',
      content,
      timestamp: Date.now(),
      threat,
    };
    messageLog.current = [...messageLog.current, msg];

    // ── Tiered routing (ADHD v2 diagram) ──────────────────────────────────────
    if (threat.disposition === 'block') {
      // Critical: hard drop — never reaches Ruflo/swarm
      addThreat({ source: agentId, level: threat.level, gate: threat.gate, confidence: threat.confidence, content: content.slice(0, 120) });
      addTerminalOutput(
        `[DEFENCE:${label}] 🚫 BLOCKED (CRITICAL) via ${threat.gate} ` +
        `(${(threat.confidence * 100).toFixed(0)}%) — ${threat.flags.join(', ')}`
      );
      return null;
    }

    if (threat.disposition === 'queue') {
      // Medium/High: log threat, surface in approval queue for human review, still deliver
      addThreat({ source: agentId, level: threat.level, gate: threat.gate, confidence: threat.confidence, content: content.slice(0, 120) });
      addApproval({
        action: `${label} message flagged — ${threat.flags.join(', ')}`,
        mcp: agentId,
        details: `${threat.level.toUpperCase()} via ${threat.gate} · ${(threat.confidence * 100).toFixed(0)}% confidence`,
        command: content.slice(0, 120),
      });
      addTerminalOutput(
        `[DEFENCE:${label}] ⚠ QUEUED (${threat.level.toUpperCase()}) via ${threat.gate} — forwarded with review flag`
      );
      // falls through: message is still delivered so Ruflo path is not broken
    }

    return msg;
  }, [agentId, label, config, addThreat, addApproval, addTerminalOutput, recordGateHit]);

  const send = useCallback((content: string, onBlock?: (r: ThreatResult) => void) => {
    const threat = scanInput(content, config, getHistory());
    recordGateHit(threat.gate);

    if (threat.disposition === 'block') {
      addTerminalOutput(`[DEFENCE:${label}] 🚫 Outgoing BLOCKED (CRITICAL) — ${threat.gate}`);
      onBlock?.(threat);
      return;
    }

    if (threat.disposition === 'queue') {
      addThreat({ source: 'user', level: threat.level, gate: threat.gate, confidence: threat.confidence, content: content.slice(0, 120) });
      addTerminalOutput(`[DEFENCE:${label}] ⚠ Outgoing QUEUED (${threat.level}) — ${threat.gate}, sending with review flag`);
      // still sends — medium/high outgoing reaches the agent but is logged
    }

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ to: agentId, content, timestamp: Date.now() }));
      addTerminalOutput(`[BRIDGE:${label}] → ${content.slice(0, 60)}${content.length > 60 ? '...' : ''}`);
    } else {
      addTerminalOutput(`[BRIDGE:${label}] Not connected — message dropped.`);
    }
  }, [agentId, label, config, addThreat, addTerminalOutput, recordGateHit]);

  useEffect(() => {
    if (!wsUrl) {
      setStatus_both('offline');
      return;
    }

    setStatus_both('connecting');
    addTerminalOutput(`[BRIDGE:${label}] Connecting to ${wsUrl}...`);

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setStatus_both('online');
      addTerminalOutput(`[BRIDGE:${label}] ● Online — defence active (${GUARD_LABEL[agentId]})`);
    };

    ws.current.onclose = () => {
      setStatus_both('offline');
      addTerminalOutput(`[BRIDGE:${label}] ○ Disconnected.`);
    };

    ws.current.onerror = () => {
      setStatus_both('offline');
      addTerminalOutput(`[BRIDGE:${label}] ✕ Connection error.`);
    };

    ws.current.onmessage = (event) => {
      const msg = processIncoming(event.data);
      if (msg) {
        addTerminalOutput(`[BRIDGE:${label}] ← ${msg.content.slice(0, 80)}${msg.content.length > 80 ? '...' : ''}`);
      }
    };

    return () => { ws.current?.close(); };
  }, [wsUrl, agentId, label, setStatus_both, processIncoming, addTerminalOutput]);

  return { status, send };
}
