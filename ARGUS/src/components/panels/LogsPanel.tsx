import { useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useArgusStore } from '../../store/useArgusStore';

function colorLine(line: string): string {
  if (line.startsWith('[ERROR]') || line.startsWith('[DENIED]')) return 'text-red-400';
  if (line.startsWith('[APPROVED]')) return 'text-emerald-400';
  if (line.startsWith('[ARGUS]')) return 'text-node-400';
  if (line.startsWith('[ROUTER]')) return 'text-violet-400';
  if (line.startsWith('[DEFENCE') || line.startsWith('[BRIDGE')) return 'text-amber-400';
  if (line.startsWith('[EDITOR]') || line.startsWith('[FILES]')) return 'text-slate-500';
  if (line.startsWith('[INPUT]')) return 'text-slate-400';
  if (line.startsWith('[SYSTEM]')) return 'text-cyan-400';
  if (line.startsWith('[MEMORY]') || line.startsWith('[LONG-TERM]')) return 'text-pink-400';
  return 'text-slate-500';
}

export function LogsPanel() {
  const terminalOutput = useArgusStore((s) => s.terminalOutput);
  const clearTerminal = useArgusStore((s) => s.clearTerminal);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-node-900/20 shrink-0">
        <span className="text-[9px] font-black text-slate-600 tracking-widest uppercase">
          Terminal Log — {terminalOutput.length} lines
        </span>
        <button
          onClick={clearTerminal}
          className="flex items-center gap-1 text-[9px] text-slate-700 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto scrollbar-node p-4 min-h-0">
        {terminalOutput.map((line, i) => (
          <div key={i} className={`text-[10px] font-mono leading-5 ${colorLine(line)}`}>
            <span className="text-slate-800 mr-2 select-none">{String(i + 1).padStart(4, '0')}</span>
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
