import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Bridge to the full-power Lab Brain daemon (lab-brain/lab_brain.py).
 *
 * The Lab Brain is the top-tier Antigravity agent that oversees ARGUS (which
 * oversees the SAGEs). It streams its live reasoning — status, tool calls, and
 * final replies — over a raw WebSocket. This hook routes all of that into the
 * Coder5543 chat stream (`setChatMessages`, shape `{ role, text, timestamp }`)
 * and exposes `sendTask` so the operator can task the Brain from the chat box.
 *
 * Mirrors the ARGUS bridges (useArgusWatchBridge / useStormologistBridge):
 * connect-with-backoff, guard against mixed-content throws, quiet reconnect.
 */

const DEFAULT_ENDPOINT = 'ws://localhost:8785';
const BACKOFF_MS = [2000, 4000, 8000, 16000, 30000];

interface LabStatus {
  type: 'lab_status';
  content: string;
}
interface LabStream {
  type: 'lab_stream';
  content: string;
}
interface LabReply {
  type: 'lab_reply';
  content: string;
}
interface LabTool {
  type: 'lab_tool';
  name: string;
  phase: 'start' | 'done' | 'error';
  detail: string;
}
type LabMessage = LabStatus | LabStream | LabReply | LabTool;

interface ChatMessageLike {
  role: 'user' | 'ai' | 'system';
  text: string;
  timestamp?: number;
  metadata?: any;
}

export type LabBrainStatus = 'offline' | 'connecting' | 'online';

export function useLabBrainBridge(
  setChatMessages: React.Dispatch<React.SetStateAction<any[]>>,
  endpoint: string = DEFAULT_ENDPOINT,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<LabBrainStatus>('offline');

  const push = useCallback(
    (msg: ChatMessageLike) => {
      setChatMessages((prev) => [...prev, { timestamp: Date.now(), ...msg }]);
    },
    [setChatMessages],
  );

  useEffect(() => {
    mountedRef.current = true;

    const route = (msg: LabMessage) => {
      switch (msg.type) {
        case 'lab_status':
          push({ role: 'system', text: `🧠 **Lab Brain** — ${msg.content}` });
          break;
        case 'lab_tool':
          // Tool activity is noisy; fold it into a compact system line.
          push({
            role: 'system',
            text: `🔧 ${msg.name} · ${msg.phase}${msg.detail ? ` — ${msg.detail}` : ''}`,
            metadata: { kind: 'lab_tool' },
          });
          break;
        case 'lab_stream':
          push({ role: 'ai', text: msg.content, metadata: { kind: 'lab_stream' } });
          break;
        case 'lab_reply':
          push({ role: 'ai', text: msg.content, metadata: { kind: 'lab_reply', source: 'lab_brain' } });
          break;
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
      setStatus('connecting');

      let ws: WebSocket;
      try {
        // ws:// from an https:// page throws SecurityError (mixed content).
        // Guard so the app can never crash on mount — just retry quietly.
        ws = new WebSocket(endpoint);
      } catch {
        setStatus('offline');
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        setStatus('online');
        attemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          route(JSON.parse(event.data as string) as LabMessage);
        } catch {
          /* ignore malformed */
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus('offline');
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
  }, [endpoint, push]);

  /** Send an operator prompt to the Lab Brain. Returns false if not connected. */
  const sendTask = useCallback((prompt: string): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify({ type: 'task', prompt }));
    return true;
  }, []);

  return { status, sendTask };
}
