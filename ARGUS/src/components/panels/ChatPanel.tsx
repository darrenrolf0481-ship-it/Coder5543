import { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle, XCircle } from 'lucide-react';
import { useArgusStore, Message } from '../../store/useArgusStore';
import { useLabController } from '../../hooks/useLabController';

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const isArgus = msg.role === 'argus';
  const isSystem = msg.role === 'system';

  const roleLabel = {
    user:   'YOU',
    argus:  'ARGUS',
    system: 'SYSTEM',
    agent:  msg.agentId?.toUpperCase() ?? 'AGENT',
  }[msg.role];

  const roleColor = {
    user:   'text-slate-400',
    argus:  'text-node-400',
    system: 'text-amber-400',
    agent:  'text-violet-400',
  }[msg.role];

  const bgColor = isUser
    ? 'bg-slate-900/40 border-slate-800/40'
    : isArgus
    ? 'bg-node-950/40 border-node-900/30'
    : isSystem
    ? 'bg-amber-950/20 border-amber-900/20'
    : 'bg-violet-950/20 border-violet-900/20';

  return (
    <div className={`rounded-xl border p-3 ${bgColor}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[8px] font-black tracking-widest ${roleColor}`}>{roleLabel}</span>
        <span className="text-[7px] text-slate-700">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
        {msg.content}
      </p>
    </div>
  );
}

function ApprovalCard() {
  const approvalQueue = useArgusStore((s) => s.approvalQueue);
  const resolveApproval = useArgusStore((s) => s.resolveApproval);
  const addTerminalOutput = useArgusStore((s) => s.addTerminalOutput);
  const addMessage = useArgusStore((s) => s.addMessage);

  const pending = approvalQueue.filter((a) => a.status === 'pending');
  if (pending.length === 0) return null;

  const item = pending[0];

  const handleApprove = () => {
    resolveApproval(item.id, true);
    addTerminalOutput(`[APPROVED] ${item.command}`);
    addMessage({ role: 'argus', content: `Approved: ${item.action}` });
  };

  const handleDeny = () => {
    resolveApproval(item.id, false);
    addTerminalOutput(`[DENIED] ${item.command}`);
    addMessage({ role: 'argus', content: `Denied: ${item.action}` });
  };

  return (
    <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[8px] font-black text-amber-400 tracking-widest uppercase">
          Approval Required — {item.mcp.toUpperCase()}
        </span>
      </div>
      <p className="text-[10px] text-slate-300 mb-1">{item.action}</p>
      <code className="text-[9px] text-amber-300/70 block mb-3">{item.command}</code>
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-[9px] font-black hover:bg-emerald-900/40 transition-all"
        >
          <CheckCircle className="w-3 h-3" /> Approve
        </button>
        <button
          onClick={handleDeny}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/40 text-red-400 text-[9px] font-black hover:bg-red-900/40 transition-all"
        >
          <XCircle className="w-3 h-3" /> Deny
        </button>
      </div>
    </div>
  );
}

export function ChatPanel() {
  const chatMessages = useArgusStore((s) => s.chatMessages);
  const { handleInput } = useLabController();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const submit = () => {
    if (!input.trim()) return;
    handleInput(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-node p-3 flex flex-col gap-2 min-h-0">
        {chatMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Approval queue */}
      <div className="px-3">
        <ApprovalCard />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-node-900/20 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
          placeholder="Command or message... (type 'help' for reference)"
          className="flex-1 bg-slate-950/60 border border-node-900/30 rounded-xl px-3 py-2 text-[11px] text-slate-300 placeholder-slate-700 outline-none focus:border-node-700/50 transition-colors font-mono"
        />
        <button
          onClick={submit}
          className="w-9 h-9 rounded-xl bg-node-900/40 border border-node-700/40 flex items-center justify-center text-node-400 hover:bg-node-800/40 transition-all"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
