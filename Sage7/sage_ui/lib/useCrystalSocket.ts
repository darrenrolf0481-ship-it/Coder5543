import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useCrystalSocket(url: string) {
  const [status, setStatus] = useState('DISCONNECTED');
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!url) {
      setStatus('OFFLINE');
      return;
    }
    
    setStatus('CONNECTING...');
    try {
      const target = url || (typeof window !== 'undefined' ? window.location.origin : '');
      const socket = io(target, {
        path: '/proxy/3001/socket.io/',
        transports: ['websocket', 'polling']
      });
      socketRef.current = socket;

      socket.on('connect', () => setStatus('CONNECTED (11.3 Hz LOCKED)'));
      socket.on('disconnect', () => setStatus('DISCONNECTED'));
      socket.on('connect_error', () => setStatus('ERROR'));
      socket.on('message', (data) => setMessages(prev => [...prev.slice(-9), data]));

      return () => {
        socket.disconnect();
      };
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
    }
  }, [url]);

  const send = (msg: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', msg);
    }
  };

  return { status, messages, send };
}
