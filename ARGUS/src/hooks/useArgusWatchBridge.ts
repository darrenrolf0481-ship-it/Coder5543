import { useEffect, useRef } from 'react';
import { useArgusStore } from '../store/useArgusStore';

/**
 * Bridge to the ARGUS Antigravity watcher daemon (watcher/argus_watcher.py).
 *
 * The watcher is the reasoning tier above the Stormologist: it polls SAGE
 * health (sensor tier, always on) and — when GEMINI_API_KEY is present —
 * investigates anomalies with an Antigravity agentic loop. It speaks the same
 * WebSocket envelope style as the Stormologist, so this hook mirrors
 * useStormologistBridge and routes everything into the store (threats,
 * approvals, chat, terminal).
 */

const DEFAULT_ENDPOINT = 'ws://localhost:8770';
const BACKOFF_MS = [2000, 4000, 8000, 16000, 30000];

interface WatchAlert {
  type: 'argus_watch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  anomaly: string;
  affected: string[];
  action: 'isolated' | 'severed' | 'quarantined' | 'flagged';
  recommendation: string;
  diagnosis?: string | null;
  timestamp: number;
}

interface WatchAudit {
  type: 'argus_audit';
  tool: string;
  decision: 'review' | 'allowed' | 'denied' | 'error';
  agent: string;
  detail: string;
}

interface WatchStatus {
  type: 'argus_status';
  content: string;
}

type WatchMessage = WatchAlert | WatchAudit | WatchStatus;

function severityToLevel(s: string) {
  if (s === 'critical') return 'critical' as const;
  if (s === 'high') return 'high' as const;
  if (s === 'medium') return 'medium' as const;
  return 'low' as const;
}

export function useArgusWatchBridge() {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const addThreat = useArgusStore((s) => s.addThreat);
  const addApproval = useArgusStore((s) => s.addApproval);
  const addMessage = useArgusStore((s) => s.addMessage);
  const addTerminalOutput = useArgusStore((s) => s.addTerminalOutput);
  const recordGateHit = useArgusStore((s) => s.recordGateHit);
  const endpoint = DEFAULT_ENDPOINT;

  useEffect(() => {
    mountedRef.current = true;

    const route = (msg: WatchMessage) => {
      if (msg.type === 'argus_status') {
        addTerminalOutput(`[ARGUS-WATCH] ${msg.content}`);
        return;
      }

      if (msg.type === 'argus_audit') {
        addTerminalOutput(
          `[AUDIT] ${msg.agent}::${msg.tool} → ${msg.decision.toUpperCase()} — ${msg.detail}`
        );
        if (msg.decision === 'denied') recordGateHit('injection');
        return;
      }

      // argus_watch alert
      const level = severityToLevel(msg.severity);

      addThreat({
        source: 'system',
        level,
        gate: msg.anomaly,
        confidence: 1.0,
        content: msg.diagnosis
          ? `${msg.recommendation}\n\nDIAGNOSIS: ${msg.diagnosis}`
          : msg.recommendation,
      });

      addTerminalOutput(
        `[WATCH] ${msg.anomaly.toUpperCase()} — ${msg.action.toUpperCase()} (${msg.affected.join(', ')})`
      );

      const needsApproval =
        msg.action === 'isolated' || msg.action === 'severed' || msg.action === 'quarantined';

      const diagnosisBlock = msg.diagnosis ? `\n\n🔍 DIAGNOSIS\n${msg.diagnosis}` : '';

      if (needsApproval) {
        addApproval({
          action: msg.recommendation,
          mcp: 'argus-watcher',
          details: `Anomaly: ${msg.anomaly} | Nodes: ${msg.affected.join(', ')}`,
          command: `WATCH_ACTION: ${msg.action} → ${msg.affected.join(', ')}`,
        });
        addMessage({
          role: 'argus',
          content: `👁️ ARGUS WATCH — ${msg.action.toUpperCase()}\n\nAnomaly: ${msg.anomaly}\nAffected: ${msg.affected.join(', ')}\n\n${msg.recommendation}${diagnosisBlock}\n\nAction requires approval. Check the approval queue.`,
        });
      } else {
        addMessage({
          role: 'argus',
          content: `👁️ ARGUS WATCH — FLAG\n\nAnomaly: ${msg.anomaly}\nAffected: ${msg.affected.join(', ')}\n\n${msg.recommendation}${diagnosisBlock}`,
        });
      }
    };

    const scheduleReconnect = () => {
      if (!mountedRef.current) return;
      const delay = BACKOFF_MS[Math.min(attemptRef.current, BACKOFF_MS.length - 1)];
      attemptRef.current++;
      timerRef.current = setTimeout(connect, delay);
    };

    const connect = () => {
      if (!mountedRef.current) return;

      let ws: WebSocket;
      try {
        ws = new WebSocket(endpoint);
      } catch {
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        attemptRef.current = 0;
        addTerminalOutput('[ARGUS-WATCH] Bridge connected. Oversight tier online.');
      };

      ws.onmessage = (event) => {
        try {
          route(JSON.parse(event.data as string) as WatchMessage);
        } catch {
          /* ignore malformed */
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps
}
