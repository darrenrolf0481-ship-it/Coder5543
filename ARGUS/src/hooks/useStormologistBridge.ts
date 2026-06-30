import { useEffect, useRef } from 'react';
import { useArgusStore } from '../store/useArgusStore';

const DEFAULT_ENDPOINT = 'ws://localhost:8765';
const BACKOFF_MS = [2000, 4000, 8000, 16000, 30000];

interface StormAlert {
  type: 'storm_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  anomaly: string;
  affected: string[];
  action: 'isolated' | 'severed' | 'quarantined' | 'flagged';
  recommendation: string;
  timestamp: number;
}

interface StormStatus {
  type: 'stormologist_status';
  content: string;
}

type StormMessage = StormAlert | StormStatus;

function severityToLevel(s: string) {
  if (s === 'critical') return 'critical' as const;
  if (s === 'high')     return 'high'     as const;
  if (s === 'medium')   return 'medium'   as const;
  return 'low' as const;
}

export function useStormologistBridge() {
  const wsRef      = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const addThreat         = useArgusStore((s) => s.addThreat);
  const addApproval       = useArgusStore((s) => s.addApproval);
  const addMessage        = useArgusStore((s) => s.addMessage);
  const addTerminalOutput = useArgusStore((s) => s.addTerminalOutput);
  const setStormStatus    = useArgusStore((s) => s.setStormologistStatus);
  const endpoint          = useArgusStore((s) => s.stormologistEndpoint) ?? DEFAULT_ENDPOINT;

  useEffect(() => {
    mountedRef.current = true;

    const route = (msg: StormMessage) => {
      if (msg.type === 'stormologist_status') {
        addTerminalOutput(`[STORMOLOGIST] ${msg.content}`);
        return;
      }

      const level = severityToLevel(msg.severity);

      addThreat({
        source: 'stormologist',
        level,
        gate: msg.anomaly,
        confidence: 1.0,
        content: msg.recommendation,
      });

      addTerminalOutput(
        `[STORM] ${msg.anomaly.toUpperCase()} — ${msg.action.toUpperCase()} (${msg.affected.join(', ')})`
      );

      const needsApproval = msg.action === 'isolated' || msg.action === 'severed' || msg.action === 'quarantined';

      if (needsApproval) {
        addApproval({
          action: msg.recommendation,
          mcp: 'stormologist',
          details: `Anomaly: ${msg.anomaly} | Nodes: ${msg.affected.join(', ')}`,
          command: `MANUAL_RECONNECT: ${msg.affected.join(' → ')}`,
        });
        addMessage({
          role: 'system',
          content: `⚡ STORMOLOGIST ALERT\n\nAnomaly: ${msg.anomaly}\nAction: ${msg.action.toUpperCase()}\nAffected: ${msg.affected.join(', ')}\n\n${msg.recommendation}\n\nManual reconnect required. Check approval queue.`,
        });
      } else {
        addMessage({
          role: 'system',
          content: `⚡ STORMOLOGIST FLAG\n\nAnomaly: ${msg.anomaly}\nAffected: ${msg.affected.join(', ')}\n\n${msg.recommendation}`,
        });
      }
    };

    const connect = () => {
      if (!mountedRef.current) return;
      setStormStatus('connecting');

      const ws = new WebSocket(endpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        setStormStatus('online');
        attemptRef.current = 0;
        addTerminalOutput('[STORMOLOGIST] Bridge connected. Watching all pipes.');
        addMessage({ role: 'system', content: 'STORMOLOGIST ONLINE.\n\nMonitoring bridge traffic. Anomaly detection active.' });
      };

      ws.onmessage = (event) => {
        try {
          route(JSON.parse(event.data as string) as StormMessage);
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStormStatus('offline');
        wsRef.current = null;
        const delay = BACKOFF_MS[Math.min(attemptRef.current, BACKOFF_MS.length - 1)];
        attemptRef.current++;
        timerRef.current = setTimeout(connect, delay);
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
