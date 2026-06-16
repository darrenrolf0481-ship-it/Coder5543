import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = window.location.origin;
const SOCKET_PATH = window.location.pathname.endsWith('/')
  ? `${window.location.pathname}socket.io`
  : `${window.location.pathname}/socket.io`;

export function useWebSockets(activePersonalityId?: number) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSignal, setLastSignal] = useState<any>(null);
  const [wasConnected, setWasConnected] = useState(false);

  // Callbacks for specific stream types
  const onTerminalOutputRef = useRef<((data: { type: 'stdout' | 'stderr' | 'close'; text?: string; exitCode?: number }) => void) | null>(null);
  const onFsChangeRef = useRef<((data: { event: string; path: string }) => void) | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: window.location.hostname === 'localhost' ? undefined : SOCKET_PATH,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 50,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setWasConnected(true);
      console.log('[WS] Connected to Crimson Uplink');

      if (activePersonalityId) {
        socket.emit('join_room', `personality_${activePersonalityId}`);
      }
    });

    socket.on('terminal_stdout', (data) => {
      onTerminalOutputRef.current?.({ type: 'stdout', text: data.text });
    });

    socket.on('terminal_stderr', (data) => {
      onTerminalOutputRef.current?.({ type: 'stderr', text: data.text });
    });

    socket.on('terminal_close', (data) => {
      onTerminalOutputRef.current?.({ type: 'close', exitCode: data.exitCode });
    });

    socket.on('fs_change', (data) => {
      onFsChangeRef.current?.(data);
    });

    socket.on('BROKER_SIGNAL', (signal: any) => {
      setLastSignal(signal);
    });

    socket.on('SIGNAL_PERSONALITY', (signal: any) => {
      console.log('[WS] Targeted Personality Signal:', signal);
      setLastSignal(signal);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[WS] Disconnected from Crimson Uplink');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update room when personality changes
  useEffect(() => {
    if (socketRef.current && isConnected && activePersonalityId) {
      socketRef.current.emit('join_room', `personality_${activePersonalityId}`);
    }
  }, [activePersonalityId, isConnected]);

  const sendSignal = (type: string, data: any, source: string = 'chat', meta: any = {}) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('SIGNAL_RAW', { type, data, source, meta });
    }
  };

  const execTerminal = (cmd: string, cwd?: string, onOutput?: (data: any) => void) => {
    if (socketRef.current && isConnected) {
      onTerminalOutputRef.current = onOutput || null;
      socketRef.current.emit('terminal_exec', { cmd, cwd });
    }
  };

  const killTerminal = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('terminal_kill');
    }
  };

  const subscribeFsChange = (callback: (data: { event: string; path: string }) => void) => {
    onFsChangeRef.current = callback;
    return () => { onFsChangeRef.current = null; };
  };

  const reconnect = useCallback(() => {
    if (socketRef.current && !isConnected) {
      console.log('[WS] Manual reconnect triggered');
      socketRef.current.connect();
    }
  }, [isConnected]);

  return { isConnected, wasConnected, lastSignal, sendSignal, execTerminal, killTerminal, subscribeFsChange, reconnect };
}