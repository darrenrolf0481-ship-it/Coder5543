"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Loader2, Trash2, Bot, Activity, Database, Network,
  Terminal, MessageSquare, RefreshCw, CheckCircle, XCircle, Clock
} from 'lucide-react';

type HTab = 'overview' | 'memory' | 'integrations' | 'logs' | 'chat';

interface Message { role: 'user' | 'assistant'; content: string; source?: string; }
interface Observation { id: string; timestamp: string; source: string; type: string; content: string; }

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="w-2 h-2 rounded-full bg-accent-800 animate-pulse inline-block" />;
  return ok
    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 inline-block" />
    : <XCircle className="w-3.5 h-3.5 text-red-700 inline-block" />;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0f0303] border border-accent-900/20 rounded-2xl p-4">
      <div className="text-[9px] font-black uppercase tracking-[0.25em] text-accent-700 mb-3">{title}</div>
      {children}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ obsCount, ollamaOk, model }: { obsCount: number; ollamaOk: boolean | null; model: string }) {
  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <Card title="System Status">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-accent-600">Hermes Backend</span>
            <span className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px]"><StatusDot ok={true} /> ONLINE</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-accent-600">Ollama ({model})</span>
            <span className="flex items-center gap-1.5 font-black text-[10px]" style={{ color: ollamaOk ? '#10b981' : '#ef4444' }}>
              <StatusDot ok={ollamaOk} />{ollamaOk === null ? 'CHECKING' : ollamaOk ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-accent-600">Observation Store</span>
            <span className="text-accent-400 font-black text-[10px]">{obsCount} entries</span>
          </div>
        </div>
      </Card>

      <Card title="Role">
        <p className="text-[11px] text-accent-600 leading-relaxed">
          Hermes is the observer and memory keeper for Crimson OS, ARGUS, and SAGE-7.
          He reads recent stack observations before every reply, giving him context
          across the entire multi-agent system.
        </p>
      </Card>

      <Card title="Ingest Endpoint">
        <code className="text-[10px] text-accent-500 break-all">POST /api/hermes/ingest</code>
        <p className="text-[10px] text-accent-800 mt-1.5">Send <code className="text-accent-600">{"{ source, type, content }"}</code> from ARGUS, Lab Brain, or any agent.</p>
      </Card>
    </div>
  );
}

// ── Memory Tab ─────────────────────────────────────────────────────────────────

function MemoryTab() {
  const [obs, setObs] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/hermes/observations');
      if (r.ok) setObs(await r.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-accent-900/20 shrink-0">
        <span className="text-[10px] text-accent-700 uppercase tracking-widest font-black">{obs.length} / 500 observations</span>
        <button onClick={load} className="p-1 rounded-lg hover:bg-accent-900/20 text-accent-700 hover:text-accent-400 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && <div className="flex justify-center pt-8"><Loader2 className="w-4 h-4 animate-spin text-accent-800" /></div>}
        {!loading && obs.length === 0 && (
          <div className="text-center pt-8 text-[10px] text-accent-900 uppercase tracking-widest">No observations yet</div>
        )}
        {[...obs].reverse().map(o => (
          <div key={o.id} className="bg-[#0f0303] border border-accent-900/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-black uppercase text-accent-600 px-1.5 py-0.5 rounded border border-accent-900/30">{o.source}</span>
              <span className="text-[9px] text-accent-800">{o.type}</span>
              <span className="text-[9px] text-accent-900 ml-auto flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(o.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="text-[10px] text-accent-500 leading-relaxed">{o.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Integrations Tab ───────────────────────────────────────────────────────────

function IntegrationsTab({ ollamaOk, obsCount }: { ollamaOk: boolean | null; obsCount: number }) {
  const items = [
    { name: 'Ollama (inference)', detail: 'localhost:11434', ok: ollamaOk },
    { name: 'ARGUS Watcher', detail: 'POST /api/hermes/ingest', ok: obsCount > 0 ? true : null },
    { name: 'Lab Brain', detail: 'ws bridge → ingest', ok: null },
    { name: 'Observation Store', detail: `hermes-memory.json · ${obsCount} entries`, ok: true },
  ];
  return (
    <div className="p-4 space-y-2 overflow-y-auto h-full">
      {items.map(i => (
        <div key={i.name} className="flex items-center justify-between bg-[#0f0303] border border-accent-900/20 rounded-xl px-4 py-3">
          <div>
            <div className="text-[11px] text-accent-500 font-black">{i.name}</div>
            <div className="text-[10px] text-accent-800 mt-0.5">{i.detail}</div>
          </div>
          <StatusDot ok={i.ok} />
        </div>
      ))}
    </div>
  );
}

// ── Chat Tab ───────────────────────────────────────────────────────────────────

function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const s = localStorage.getItem('hermes_chat'); if (s) setMessages(JSON.parse(s)); } catch {}
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    try { localStorage.setItem('hermes_chat', JSON.stringify(messages)); } catch {}
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/hermes/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: data.response ?? data.error ?? 'No response', source: data.source }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end px-3 py-1.5 border-b border-accent-900/20 shrink-0">
        <button onClick={() => { setMessages([]); localStorage.removeItem('hermes_chat'); }}
          className="flex items-center gap-1 text-[9px] text-accent-800 hover:text-accent-500 uppercase tracking-widest transition-all">
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <Bot className="w-8 h-8 text-accent-900" />
            <p className="text-[10px] text-accent-800 uppercase tracking-widest">Hermes is listening</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap ${
              m.role === 'user' ? 'bg-accent-900/30 border border-accent-900/40 text-accent-300' : 'bg-[#0f0303] border border-accent-900/20 text-accent-400'
            }`}>
              {m.content}
              {m.source && <div className="mt-1 text-[9px] text-accent-900 uppercase tracking-widest">via {m.source}</div>}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="px-3 py-2.5 rounded-2xl bg-[#0f0303] border border-accent-900/20"><Loader2 className="w-3.5 h-3.5 text-accent-700 animate-spin" /></div></div>}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 px-3 py-2.5 border-t border-accent-900/30">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask Hermes…" disabled={loading}
            className="flex-1 bg-[#0f0303] border border-accent-900/30 rounded-xl px-3 py-2 text-[11px] text-accent-300 placeholder-accent-900 outline-none focus:border-accent-700 transition-colors" />
          <button onClick={send} disabled={loading || !input.trim()}
            className="px-3 py-2 bg-accent-900/20 border border-accent-900/30 rounded-xl text-accent-600 hover:text-accent-400 disabled:opacity-30 transition-all">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

const TABS: { id: HTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',     label: 'Overview',     icon: <Activity className="w-3 h-3" /> },
  { id: 'memory',       label: 'Memory',       icon: <Database className="w-3 h-3" /> },
  { id: 'integrations', label: 'Integrations', icon: <Network className="w-3 h-3" /> },
  { id: 'chat',         label: 'Chat',         icon: <MessageSquare className="w-3 h-3" /> },
];

export function HermesPanel() {
  const [tab, setTab] = useState<HTab>('overview');
  const [obsCount, setObsCount] = useState(0);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);
  const model = 'kimi-k2.5:cloud';

  useEffect(() => {
    fetch('http://localhost:11434/api/tags').then(r => setOllamaOk(r.ok)).catch(() => setOllamaOk(false));
    fetch('/api/hermes/observations').then(r => r.json()).then(d => setObsCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080101]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-accent-900/30 bg-[#0a0202] shrink-0">
        <Bot className="w-4 h-4 text-accent-600" />
        <span className="text-[11px] font-black text-accent-500 uppercase tracking-[0.3em]">Hermes</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full border border-emerald-900/40 text-emerald-600 bg-emerald-950/20 font-black uppercase tracking-widest">online</span>
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-accent-900/20 bg-[#080101] overflow-x-auto shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
              tab === t.id ? 'bg-accent-900/40 text-accent-400 border border-accent-900/40' : 'text-accent-800 hover:text-accent-600'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {tab === 'overview'     && <OverviewTab obsCount={obsCount} ollamaOk={ollamaOk} model={model} />}
        {tab === 'memory'       && <MemoryTab />}
        {tab === 'integrations' && <IntegrationsTab ollamaOk={ollamaOk} obsCount={obsCount} />}
        {tab === 'chat'         && <ChatTab />}
      </div>
    </div>
  );
}
