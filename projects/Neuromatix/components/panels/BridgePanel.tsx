'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Radio, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface BridgeMessage {
  id: string;
  role: 'user' | 'entity';
  text: string;
  timestamp: number;
}

type Target = 'mama' | 'seven' | 'both';

interface NodeStatus {
  connected: boolean;
  checking: boolean;
}

interface PaneColor {
  border: string;
  icon: string;
  label: string;
  bubble: string;
}

function ChatPane({
  label,
  color,
  messages,
  status,
}: {
  label: string;
  color: PaneColor;
  messages: BridgeMessage[];
  status: NodeStatus;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Pane header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${color.border} bg-black/20 shrink-0`}>
        {status.checking ? (
          <Loader2 size={12} className="text-zinc-500 animate-spin" />
        ) : status.connected ? (
          <Wifi size={12} className={color.icon} />
        ) : (
          <WifiOff size={12} className="text-zinc-600" />
        )}
        <span className={`text-xs font-mono font-semibold tracking-wider ${color.label}`}>
          {label}
        </span>
        <span className={`text-xs ml-auto font-mono ${status.connected ? color.label : 'text-zinc-600'}`}>
          {status.checking ? 'checking…' : status.connected ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed font-mono whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-zinc-700/60 text-zinc-200'
                    : `${color.bubble} text-zinc-100`
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {messages.length === 0 && (
          <p className="text-zinc-600 text-xs font-mono text-center mt-8">
            {status.connected ? 'Channel open. Send a message.' : 'Waiting for connection…'}
          </p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export function BridgePanel() {
  const [mamaMessages, setMamaMessages] = useState<BridgeMessage[]>([]);
  const [sevenMessages, setSevenMessages] = useState<BridgeMessage[]>([]);
  const [input, setInput] = useState('');
  const [target, setTarget] = useState<Target>('both');
  const [sending, setSending] = useState(false);
  const [mamaStatus, setMamaStatus] = useState<NodeStatus>({ connected: false, checking: true });
  const [sevenStatus, setSevenStatus] = useState<NodeStatus>({ connected: false, checking: true });
  const inputRef = useRef<HTMLInputElement>(null);

  // Independent polling for MAMA and Seven
  useEffect(() => {
    async function checkMama() {
      try {
        const r = await fetch('/api/mama');
        const d = await r.json();
        setMamaStatus({ connected: d.connected === true, checking: false });
      } catch {
        setMamaStatus({ connected: false, checking: false });
      }
    }
    checkMama();
    const id = setInterval(checkMama, 20000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function checkSeven() {
      try {
        const r = await fetch('/api/seven');
        const d = await r.json();
        setSevenStatus({ connected: d.connected === true, checking: false });
      } catch {
        setSevenStatus({ connected: false, checking: false });
      }
    }
    checkSeven();
    const id = setInterval(checkSeven, 15000);
    return () => clearInterval(id);
  }, []);

  async function sendToMama(message: string) {
    const res = await fetch('/api/mama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return data.reply || data.error || '(no response)';
  }

  async function sendToSeven(message: string) {
    const res = await fetch('/api/seven', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return data.reply || data.error || '(no response)';
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);

    const userMsg = (id: string): BridgeMessage => ({
      id,
      role: 'user',
      text,
      timestamp: Date.now(),
    });

    if (target === 'mama' || target === 'both') {
      const id = `u-mama-${Date.now()}`;
      setMamaMessages(prev => [...prev, userMsg(id)]);
    }
    if (target === 'seven' || target === 'both') {
      const id = `u-seven-${Date.now()}`;
      setSevenMessages(prev => [...prev, userMsg(id)]);
    }

    try {
      const sends: Promise<void>[] = [];

      if (target === 'mama' || target === 'both') {
        sends.push(
          sendToMama(text).then(reply => {
            setMamaMessages(prev => [...prev, {
              id: `m-mama-${Date.now()}`,
              role: 'entity',
              text: reply,
              timestamp: Date.now(),
            }]);
          })
        );
      }

      if (target === 'seven' || target === 'both') {
        sends.push(
          sendToSeven(text).then(reply => {
            setSevenMessages(prev => [...prev, {
              id: `m-seven-${Date.now()}`,
              role: 'entity',
              text: reply,
              timestamp: Date.now(),
            }]);
          })
        );
      }

      await Promise.all(sends);
    } catch (err) {
      const errText = err instanceof Error ? err.message : String(err);
      if (target === 'mama' || target === 'both') {
        setMamaMessages(prev => [...prev, { id: `err-mama-${Date.now()}`, role: 'entity', text: `[ERROR] ${errText}`, timestamp: Date.now() }]);
      }
      if (target === 'seven' || target === 'both') {
        setSevenMessages(prev => [...prev, { id: `err-seven-${Date.now()}`, role: 'entity', text: `[ERROR] ${errText}`, timestamp: Date.now() }]);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const mamaColors = {
    border: 'border-violet-500/20',
    icon: 'text-violet-400',
    label: 'text-violet-300',
    bubble: 'bg-violet-900/40 border border-violet-500/20',
  };

  const sevenColors = {
    border: 'border-cyan-500/20',
    icon: 'text-cyan-400',
    label: 'text-cyan-300',
    bubble: 'bg-cyan-900/30 border border-cyan-500/20',
  };

  const targetBtnClass = (t: Target) =>
    `px-3 py-1 rounded text-xs font-mono transition-colors ${
      target === t
        ? t === 'mama'
          ? 'bg-violet-600/50 text-violet-200'
          : t === 'seven'
          ? 'bg-cyan-600/50 text-cyan-200'
          : 'bg-zinc-600/60 text-zinc-200'
        : 'bg-white/5 text-zinc-500 hover:text-zinc-300'
    }`;

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* Split panes */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-h-0 overflow-hidden">
        <div className="rounded-xl border border-violet-500/15 bg-black/30 overflow-hidden flex flex-col min-h-0">
          <ChatPane label="SAGE-MAMA" color={mamaColors} messages={mamaMessages} status={mamaStatus} />
        </div>
        <div className="rounded-xl border border-cyan-500/15 bg-black/30 overflow-hidden flex flex-col min-h-0">
          <ChatPane label="SAGE-7" color={sevenColors} messages={sevenMessages} status={sevenStatus} />
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 rounded-xl border border-white/8 bg-black/40 p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Radio size={11} className="text-zinc-600" />
          <span className="text-xs text-zinc-600 font-mono">SEND TO</span>
          <button className={targetBtnClass('mama')} onClick={() => setTarget('mama')}>MAMA</button>
          <button className={targetBtnClass('both')} onClick={() => setTarget('both')}>BOTH</button>
          <button className={targetBtnClass('seven')} onClick={() => setTarget('seven')}>SEVEN</button>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message…"
            className="flex-1 bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/12 disabled:opacity-40 transition-colors"
          >
            {sending ? <Loader2 size={14} className="text-zinc-400 animate-spin" /> : <Send size={14} className="text-zinc-300" />}
          </button>
        </div>
      </div>
    </div>
  );
}
