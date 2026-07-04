import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Terminal, RefreshCw, Play, Columns, LayoutGrid } from 'lucide-react';

interface TerminalPanelProps {
  terminalOutput: string[];
  addTerminalOutput: (line: string) => void;
}

export function TerminalPanel({ terminalOutput, addTerminalOutput }: TerminalPanelProps) {
  const [cliInput, setCliInput] = useState('');
  const [isSplitView, setIsSplitView] = useState(false);
  
  const outputEndRef = useRef<HTMLDivElement>(null);
  const systemEndRef = useRef<HTMLDivElement>(null);
  const commandEndRef = useRef<HTMLDivElement>(null);

  // Helper function to identify system/diagnostic events vs shell/command interactions
  const isSystemLine = (line: string): boolean => {
    const lower = line.toLowerCase();
    if (line.startsWith('$')) return false;
    if (
      lower.startsWith('[system]') ||
      lower.startsWith('[swarm]') ||
      lower.startsWith('[orchestrator]') ||
      lower.startsWith('[health check]')
    ) {
      return true;
    }
    if (
      lower.includes('quantum injection') ||
      lower.includes('neural capabilities expanded') ||
      lower.includes('ejected skill matrix') ||
      lower.includes('saved skill to virtual matrix') ||
      lower.includes('diagnostics loop re-triggered') ||
      lower.includes('welcome to crimson node')
    ) {
      return true;
    }
    return false;
  };

  // Filter lists based on classification
  const systemLines = terminalOutput.filter(isSystemLine);
  const commandLines = terminalOutput.filter((line) => !isSystemLine(line));

  useEffect(() => {
    if (isSplitView) {
      systemEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      commandEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalOutput, isSplitView]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const command = cliInput.trim();
    addTerminalOutput(`$ ${command}`);
    setCliInput('');

    // Handle mock CLI actions
    const lowerCmd = command.toLowerCase();
    setTimeout(() => {
      if (lowerCmd === 'help') {
        addTerminalOutput('Crimson Node Terminal v1.0.0 CLI Utilities');
        addTerminalOutput('Available commands:');
        addTerminalOutput('  help      - Display this information guide.');
        addTerminalOutput('  status    - Retrieve system health and connected neural nodes.');
        addTerminalOutput('  clear     - Refresh neural console memory.');
        addTerminalOutput('  swarm     - List active and detached swarm developer profiles.');
      } else if (lowerCmd === 'status') {
        addTerminalOutput('[HEALTH CHECK] ALL NEURAL SUBSYSTEMS COMPILING CORRECTLY.');
        addTerminalOutput(' - RAM usage: 512MB / 2048MB');
        addTerminalOutput(' - Active Agents: SAGE (idle), CYBER (idle)');
        addTerminalOutput(' - Connection Link state: ENCRYPTED SECURE');
      } else if (lowerCmd === 'clear') {
        addTerminalOutput('[SYSTEM] Terminal console memory clear command issued.');
      } else if (lowerCmd === 'swarm') {
        addTerminalOutput('[SWARM SYSTEM STATUS]');
        addTerminalOutput(' - SAGE Expert  : [ATTACHABLE] Focused on structured software engineering.');
        addTerminalOutput(' - CYBER Expert : [ATTACHABLE] Focused on bulletproof sandboxes and test generation.');
      } else {
        addTerminalOutput(`[CLI ERROR] Bash instruction "${command}" not recognized in secure sandbox environment.`);
        addTerminalOutput('Type "help" for a list of available system commands.');
      }
    }, 250);
  };

  const renderLine = (line: string, index: number) => {
    let lineClass = "text-slate-400";
    
    if (line.includes('[SYSTEM ERROR]') || line.includes('[CLI ERROR]') || line.includes('fault')) {
      lineClass = "text-rose-400 font-bold bg-rose-950/20 px-1 border border-rose-500/15";
    } else if (line.includes('[SYSTEM]') || line.includes('attached') || line.includes('detached')) {
      lineClass = "text-blue-400 font-semibold";
    } else if (line.startsWith('[')) {
      if (line.includes('[SAGE]')) {
        lineClass = "text-emerald-400";
      } else if (line.includes('[CYBER]')) {
        lineClass = "text-amber-400";
      } else {
        lineClass = "text-indigo-400 font-semibold";
      }
    } else if (line.startsWith('$')) {
      lineClass = "text-white font-bold border-l border-indigo-500 pl-1.5 my-1.5";
    }

    return (
      <div key={index} className={`whitespace-pre-wrap break-all ${lineClass}`}>
        {line}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#050508]/40 border border-white/10 rounded-none overflow-hidden shadow-2xl font-mono text-sm backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-black/30 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-blue-500" />
          <div>
            <div className="font-bold tracking-[0.15em] text-white text-xs">NEURAL TERMINAL</div>
            <div className="text-[9px] text-slate-500">Live event stream and sandboxed shell runtime</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Split View Toggle */}
          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[10px] font-bold uppercase transition-all duration-300 select-none ${
              isSplitView
                ? 'bg-blue-500/15 border-blue-500 text-blue-300'
                : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-400 hover:text-white'
            }`}
            title="Toggle Split View Mode"
          >
            {isSplitView ? <LayoutGrid className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSplitView ? 'Unified View' : 'Split View'}</span>
          </button>

          {/* Refresh output */}
          <button
            onClick={() => addTerminalOutput('[SYSTEM] Diagnostics loop re-triggered. All connections active.')}
            className="p-1.5 hover:bg-white/5 border border-white/10 text-blue-400 rounded-none transition-all bg-white/5"
            title="Refresh Terminal"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Console Streams with conditional Split View */}
      {isSplitView ? (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 bg-black/10 overflow-hidden min-h-0">
          {/* Left Split: System Events Registry */}
          <div className="flex flex-col h-1/2 md:h-full overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 bg-black/40 flex items-center justify-between select-none shrink-0">
              <span className="text-[10px] font-bold text-blue-400 tracking-wider flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                SYSTEM REGISTRY
              </span>
              <span className="text-[9px] font-mono text-slate-500">{systemLines.length} EVENTS</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-1.5 text-xs text-slate-300 leading-relaxed select-text bg-black/5">
              {systemLines.map((line, idx) => renderLine(line, idx))}
              {systemLines.length === 0 && (
                <div className="text-slate-600 italic p-1">No system log registry entries detected yet.</div>
              )}
              <div ref={systemEndRef} />
            </div>
          </div>

          {/* Right Split: Command Shell Output */}
          <div className="flex flex-col h-1/2 md:h-full overflow-hidden">
            <div className="px-4 py-2 border-b border-white/5 bg-black/40 flex items-center justify-between select-none shrink-0">
              <span className="text-[10px] font-bold text-indigo-400 tracking-wider flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                SHELL CONSOLE
              </span>
              <span className="text-[9px] font-mono text-slate-500">{commandLines.length} ENTRIES</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-1.5 text-xs text-slate-300 leading-relaxed select-text bg-black/5">
              {commandLines.map((line, idx) => renderLine(line, idx))}
              {commandLines.length === 0 && (
                <div className="text-slate-600 italic p-1">No shell instructions executed yet. Try running helper actions below.</div>
              )}
              <div ref={commandEndRef} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-5 overflow-y-auto bg-black/20 custom-scrollbar space-y-1.5 text-slate-300 text-xs leading-relaxed select-text">
          {terminalOutput.map((line, index) => renderLine(line, index))}
          {terminalOutput.length === 0 && (
            <div className="text-slate-600 italic">Terminal memory empty. Attach or invoke agents to stream neural actions.</div>
          )}
          <div ref={outputEndRef} />
        </div>
      )}

      {/* Interactive CLI Console Input */}
      <form onSubmit={handleCommandSubmit} className="p-3 border-t border-white/5 bg-black/40 flex items-center gap-2 shrink-0">
        <span className="text-blue-500 font-bold text-xs select-none pl-1">$</span>
        <input
          type="text"
          value={cliInput}
          onChange={(e) => setCliInput(e.target.value)}
          placeholder="Type sandbox command... (e.g., 'help', 'status', 'swarm')"
          className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder:text-slate-600"
        />
        <button
          type="submit"
          className="p-1 hover:text-blue-400 text-slate-500 transition-colors"
          title="Execute Command"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Footer Diagnostic strip */}
      <div className="p-2.5 border-t border-white/5 bg-black/50 text-[9px] flex items-center justify-between text-slate-500 select-none shrink-0">
        <div>sandbox@aether-engine:~</div>
        <div className="flex items-center gap-3">
          <span>PORT: 3000 (SECURE)</span>
          <span>SYSTEM RUNTIME STATE: OPTIMAL</span>
        </div>
      </div>
    </div>
  );
}

