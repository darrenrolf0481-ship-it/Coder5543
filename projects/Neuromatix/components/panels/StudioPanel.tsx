import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, Link, Unlink, User, Sparkles, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { AGENT_SKILLS } from '../../lib/skillsData';

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

function FormattedTime({ timestamp }: { timestamp: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <span className="opacity-0">--:--</span>;
  }

  let timeString = '--:--';
  try {
    timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    // Fallback to default
  }

  return <>{timeString}</>;
}


interface StudioPanelProps {
  chatMessages: Message[];
  onSubmit: (input: string) => Promise<void>;
  swarm: any;
  onApplyCode: (code: string) => void;
}

export function StudioPanel({ chatMessages, onSubmit, swarm, onApplyCode }: StudioPanelProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { appliedSkills, currentMode } = useProjectStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userInput = input.trim();
    setIsProcessing(true);
    setInput('');
    await onSubmit(userInput);
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Suggest quick actions
  const suggestionPrompts = [
    { text: 'attach sage-7', label: 'Attach Sage-7' },
    { text: 'attach adhd', label: 'Attach ADHD' },
    { text: 'run improve styling', label: 'Run Swarm Style Update', requiresAgent: true },
    { text: 'run add secure error handling', label: 'Run Secure Check', requiresAgent: true },
    { text: 'detach', label: 'Detach Agent', requiresAgent: true },
  ];

  return (
    <div id="studio-panel-root" className={`flex flex-col h-full rounded-2xl overflow-hidden relative transition-all duration-300 scanline shadow-2xl ${
      currentMode === 'development' ? 'glass-panel-dev' : 'glass-panel-audit'
    }`}>
      {/* Dynamic Glow in Background */}
      <div className={`absolute top-0 right-1/4 w-80 h-80 rounded-full blur-[120px] pointer-events-none transition-all duration-300 ${
        currentMode === 'development' ? 'bg-indigo-950/20' : 'bg-emerald-950/20'
      }`} />

      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-black/40 backdrop-blur-md z-10 flex flex-col xs:flex-row xs:items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className={`w-6 h-6 animate-pulse ${currentMode === 'development' ? 'text-indigo-400' : 'text-emerald-400'}`} />
            <div className={`absolute -inset-1 rounded-full blur-md opacity-25 animate-pulse ${
              currentMode === 'development' ? 'bg-indigo-500' : 'bg-emerald-500'
            }`} />
          </div>
          <div>
            <h2 className={`font-bold text-sm tracking-[0.15em] uppercase font-mono ${
              currentMode === 'development' ? 'text-indigo-200 glow-text-blue' : 'text-emerald-200 glow-text-emerald'
            }`}>NEURAL STUDIO</h2>
            <p className="text-[10px] text-slate-400 font-mono">Chat with active agents • Complete workspace vision</p>
          </div>
        </div>

        {/* Suggested Quick Commands */}
        <div className="flex flex-wrap gap-1.5">
          {suggestionPrompts.map((sug, idx) => {
            const isDisabled = sug.requiresAgent && !swarm.attachedAgent;
            if (isDisabled && idx !== 4) return null; // Hide if not applicable
            return (
              <button
                key={idx}
                disabled={isDisabled}
                onClick={() => setInput(sug.text)}
                className="tech-pill disabled:pointer-events-none"
              >
                {sug.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Attached Agent Banner */}
      <AnimatePresence mode="wait">
        {swarm.attachedAgent ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-950/20 border-b border-emerald-900/40 px-5 py-2.5 flex items-center justify-between z-10 select-none"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Link className="w-4 h-4 text-emerald-400 shrink-0" />
              ATTACHED AGENT: <span className="text-white font-black">{swarm.attachedAgent.name.toUpperCase()}</span>
            </div>
            <button
              onClick={() => swarm.detachAgent()}
              className="px-2.5 py-1 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-800 text-emerald-400 hover:text-emerald-300 font-mono text-[10px] font-bold rounded-none transition-all flex items-center gap-1.5"
            >
              <Unlink className="w-3.5 h-3.5" />
              DETACH AGENT
            </button>
          </motion.div>
        ) : (
          <div className="bg-white/5 border-b border-white/5 px-5 py-2 flex items-center justify-between z-10 select-none">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              ORCHESTRATOR PASSIVE RUNTIME MODE
            </div>
            <span className="text-[9px] font-mono text-slate-500">Type &quot;attach sage-7&quot; to deploy agent</span>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Mode Status Banner */}
      <div className={`border-b px-5 py-2 flex items-center justify-between select-none z-10 shrink-0 text-[10px] font-mono font-bold tracking-wider uppercase transition-all duration-300 ${
        currentMode === 'development'
          ? 'bg-blue-950/20 border-blue-500/10 text-blue-400'
          : 'bg-emerald-950/20 border-emerald-500/10 text-emerald-400'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentMode === 'development' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
          <span>MODE: {currentMode === 'development' ? '⚡ DEVELOPMENT / VIBE' : '🔍 ANALYSIS / AUDIT'}</span>
        </div>
        <span className="text-[9px] text-slate-500 font-normal normal-case">
          {currentMode === 'development' ? 'prioritizing velocity & visuals' : 'enforcing strict types & security'}
        </span>
      </div>

      {/* Active Skills Badges Bar */}
      {appliedSkills.length > 0 && (
        <div className="bg-black/50 border-b border-white/5 px-5 py-2 flex items-center gap-2 flex-wrap select-none z-10 shrink-0">
          <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase font-black shrink-0">
            COGNITIVE BUFFERS:
          </span>
          <div className="flex flex-wrap gap-1">
            {appliedSkills.map((id) => {
              const skill = AGENT_SKILLS.find((s) => s.id === id);
              if (!skill) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[9px] rounded-none"
                >
                  <span className="w-1 h-1 bg-blue-400 rounded-full" />
                  {skill.name.toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/10">
        <AnimatePresence initial={false}>
          {chatMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar on Left */}
              {msg.role === 'ai' && (
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-lg shrink-0 transition-all ${
                  currentMode === 'development' ? 'bg-indigo-950/20 border-indigo-500/25 text-indigo-400' : 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`max-w-[80%] px-4 py-3 text-sm shadow-lg leading-relaxed transition-all duration-300 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-2xl rounded-tr-xs shadow-indigo-950/20'
                    : 'bg-black/35 border border-white/8 text-slate-200 rounded-2xl rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.text}
                </div>
                <div className="mt-1.5 text-[9px] opacity-40 font-mono text-right select-none">
                  <FormattedTime timestamp={msg.timestamp} />
                </div>
              </div>

              {/* User Avatar on Right */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shadow-lg shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <div className="flex justify-start items-center gap-3">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center animate-pulse shrink-0 ${
              currentMode === 'development' ? 'bg-indigo-950/20 border-indigo-500/25 text-indigo-400' : 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-black/35 border border-white/8 rounded-xl px-4 py-3 text-slate-400 font-mono text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
              Agent is syncing response...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-black/45 z-10">
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              swarm.attachedAgent
                ? `Run task with ${swarm.attachedAgent.name} (e.g., "run optimize code")`
                : 'Type here... Try: "attach sage-7", "attach adhd", "detach"'
            }
            className={`flex-1 bg-black/45 border px-4 py-3 text-sm focus:outline-none text-white placeholder:text-slate-600 font-mono transition-all rounded-xl ${
              currentMode === 'development'
                ? 'border-indigo-500/20 focus:border-indigo-500 focus:shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                : 'border-emerald-500/20 focus:border-emerald-500 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)]'
            }`}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className={`font-bold w-12 h-12 flex items-center justify-center shadow-lg transition-all rounded-xl ${
              isProcessing || !input.trim()
                ? 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                : currentMode === 'development'
                  ? 'btn-neural-primary cursor-pointer'
                  : 'btn-neural-audit cursor-pointer'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <div className="text-[10px] text-center text-slate-500 mt-3 font-mono">
          System prompt console • Command structures are server-validated
        </div>
      </div>
    </div>
  );
}
