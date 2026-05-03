import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Activity, BookOpen, Brain, Bug, Database, Download, FileCode, FileSearch,
  Fingerprint, HelpCircle, ImageIcon, LayoutTemplate, MessageSquare,
  Network, Send, ShieldCheck, Sparkles, Trash2, Unlock, Users, Zap,
} from 'lucide-react';
import { Personality } from './SettingsPanel';

// ── Types ──────────────────────────────────────────────────────────────────

type DebugAnalysis = {
  static: { status: 'idle' | 'running' | 'done'; issues: { type: 'error' | 'warning' | 'info'; message: string; line?: number }[] };
  tracing: { status: 'idle' | 'running' | 'done'; logs: string[] };
  refactoring: { status: 'idle' | 'running' | 'done'; suggestions: string[] };
};

type SwarmAgent = { id: string; name: string; expertise: string; status: 'active' | 'idle'; trust: number };
type SwarmLog  = { id: number; type: 'consensus' | 'pain' | 'info'; message: string; time: string };
type KnowledgePack = { id: number; name: string; size: string; status: string };
type ChatMessage = { role: 'user' | 'ai'; text: string; type?: 'text' | 'image'; url?: string; timestamp: number };

function extractCodeBlock(text: string): string | null {
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

interface ToolNeuronPanelProps {
  chatMessages: ChatMessage[];
  studioInput: string;
  setStudioInput: (v: string) => void;
  handleStudioSubmit: (e: React.FormEvent) => void;
  isVaultUnlocked: boolean;
  setIsVaultUnlocked: (v: boolean) => void;
  swarmAnxiety: number;
  swarmAgents: SwarmAgent[];
  swarmLogs: SwarmLog[];
  triggerSwarmCycle: () => void;
  isAiProcessing: boolean;
  debugAnalysis: DebugAnalysis;
  runStaticAnalysis: () => void;
  runDynamicTracing: () => void;
  getRefactoringSuggestions: () => void;
  activePersonality: Personality;
  tnKnowledgePacks: KnowledgePack[];
  handleKnowledgeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setActiveTab: (tab: 'terminal' | 'analysis' | 'termux' | 'storage' | 'settings' | 'editor' | 'toolneuron' | 'brain') => void;
  onApplyCode: (code: string, mode: 'refactor' | 'replace') => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export const ToolNeuronPanel: React.FC<ToolNeuronPanelProps> = ({
  chatMessages, studioInput, setStudioInput, handleStudioSubmit,
  isVaultUnlocked, setIsVaultUnlocked,
  swarmAnxiety, swarmAgents, swarmLogs, triggerSwarmCycle,
  isAiProcessing, debugAnalysis, runStaticAnalysis, runDynamicTracing, getRefactoringSuggestions,
  activePersonality, tnKnowledgePacks, handleKnowledgeUpload, setActiveTab, onApplyCode,
}) => {
  // ── Local state ────────────────────────────────────────────────────────
  const [tnModule, setTnModule] = useState<'chat' | 'vision' | 'knowledge' | 'vault' | 'swarm' | 'help' | 'debug'>('chat');

  // Vault local state
  const [vaultPin, setVaultPin]                     = useState('');
  const [vaultAttempts, setVaultAttempts]           = useState(0);
  const [vaultLockedUntil, setVaultLockedUntil]     = useState<number | null>(null);
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);
  const [vaultError, setVaultError]                 = useState<string | null>(null);
  const [vaultStep, setVaultStep]                   = useState<'initial' | 'pin' | 'biometric'>('initial');

  // ── Vault handlers ─────────────────────────────────────────────────────

  const handleVaultPin = (digit: string) => {
    if (vaultLockedUntil && Date.now() < vaultLockedUntil) {
      setVaultError('VAULT LOCKED. TRY AGAIN LATER.');
      return;
    }
    if (vaultAttempts >= 3) {
      setVaultLockedUntil(Date.now() + 30000);
      setVaultAttempts(0);
      setVaultError('MAX ATTEMPTS REACHED. LOCKING VAULT.');
      setTimeout(() => { setVaultPin(''); setVaultError(null); }, 2000);
      return;
    }
    if (vaultPin.length < 4) {
      const newPin = vaultPin + digit;
      setVaultPin(newPin);
      if (newPin.length === 4) {
        if (newPin === '8832') {
          setIsVaultUnlocked(true);
          setVaultAttempts(0);
          setVaultError(null);
        } else {
          setVaultAttempts(prev => prev + 1);
          setVaultError('INVALID ACCESS CODE');
          setTimeout(() => { setVaultPin(''); setVaultError(null); }, 1000);
        }
      }
    }
  };

  const startBiometric = () => {
    setVaultStep('biometric');
    setIsBiometricVerifying(true);
    setVaultError(null);
    setTimeout(() => {
      setIsBiometricVerifying(false);
      setIsVaultUnlocked(true);
      setVaultStep('initial');
    }, 2500);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-0 overflow-hidden custom-scrollbar">
        {/* Module Navigation */}
        <div className="w-full lg:w-72 flex flex-col gap-4 md:gap-6 shrink-0">
          <div className="code-editor-bg rounded-[30px] md:rounded-[40px] border border-red-900/30 p-6 md:p-8 space-y-6 md:space-y-8 shadow-2xl">
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-lg md:text-xl font-black text-red-100 uppercase tracking-tighter">ToolNeuron</h3>
              <p className="text-[9px] md:text-[10px] text-red-900 font-black tracking-[0.3em] uppercase">Offline AI Ecosystem</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
              {[
                { id: 'chat',      label: 'Chat',     icon: <MessageSquare className="w-4 h-4" /> },
                { id: 'vision',    label: 'Vision',   icon: <ImageIcon className="w-4 h-4" /> },
                { id: 'knowledge', label: 'Database', icon: <Database className="w-4 h-4" /> },
                { id: 'vault',     label: 'Vault',    icon: <ShieldCheck className="w-4 h-4" /> },
                { id: 'swarm',     label: 'Swarm',    icon: <Network className="w-4 h-4" /> },
                { id: 'debug',     label: 'Debug',    icon: <Bug className="w-4 h-4" /> },
                { id: 'help',      label: 'Guide',    icon: <HelpCircle className="w-4 h-4" /> },
              ].map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setTnModule(mod.id as any)}
                  className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${tnModule === mod.id ? 'bg-red-700 text-white shadow-lg scale-[1.02]' : 'bg-red-950/10 text-red-900 hover:text-red-500'}`}
                >
                  {mod.icon}
                  <span className="truncate">{mod.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex flex-1 code-editor-bg rounded-[40px] border border-red-900/30 p-8 space-y-6 shadow-2xl overflow-y-auto custom-scrollbar">
            <h4 className="text-[10px] font-black text-red-800 uppercase tracking-[0.4em]">System Status</h4>
            <div className="space-y-4">
              <div className="p-4 bg-red-950/10 rounded-2xl border border-red-900/10">
                <p className="text-[9px] text-red-900 font-black uppercase mb-2">Local Inference</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-red-100 font-bold">GGUF_Llama_3</span>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>
              </div>
              <div className="p-4 bg-red-950/10 rounded-2xl border border-red-900/10">
                <p className="text-[9px] text-red-900 font-black uppercase mb-2">Vault Encryption</p>
                <span className="text-[11px] text-red-100 font-bold">AES-256-GCM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 code-editor-bg rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden flex flex-col">

          {/* CHAT */}
          {tnModule === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="h-16 border-b border-red-900/20 flex items-center px-8 bg-black/40 justify-between">
                <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                  <MessageSquare className="w-4 h-4" /> Neural Chat Interface
                </h4>
                <span className="text-[10px] font-mono text-red-900">LATENCY: 12ms</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-3xl p-6 text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-red-800 text-white rounded-tr-none'
                        : 'bg-red-950/20 border border-red-900/20 text-red-100 rounded-tl-none'
                    }`}>
                      {msg.type === 'image' ? (
                        <div className="space-y-4">
                          <img src={msg.url} alt="Generated" className="w-full rounded-xl border border-red-900/30" />
                          <p className="text-[10px] font-mono text-red-400 opacity-70">{msg.text}</p>
                        </div>
                      ) : (
                        <>
                          <div className="markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                          </div>
                          {msg.role === 'ai' && (() => {
                            const code = extractCodeBlock(msg.text);
                            if (!code) return null;
                            return (
                              <div className="flex gap-2 mt-3 pt-3 border-t border-red-900/20">
                                <button
                                  onClick={() => onApplyCode(code, 'refactor')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 border border-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-all active:scale-95"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Refactor
                                </button>
                                <button
                                  onClick={() => onApplyCode(code, 'replace')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 border border-red-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-300 hover:bg-red-900/40 transition-all active:scale-95"
                                >
                                  <FileCode className="w-3 h-3" />
                                  Replace
                                </button>
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleStudioSubmit} className="p-4 md:p-8 bg-black/40 border-t border-red-900/20">
                <div className="relative max-w-3xl mx-auto">
                  <input value={studioInput} onChange={(e) => setStudioInput(e.target.value)} placeholder="Send local neural directive..." className="w-full bg-[#0d0404] border border-red-900/40 rounded-2xl px-6 py-4 text-sm text-red-100 focus:border-red-600/60 outline-none" />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-red-700 rounded-xl text-white">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* KNOWLEDGE */}
          {tnModule === 'knowledge' && (
            <div className="flex-1 p-6 md:p-12 space-y-6 md:space-y-10 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-red-100 uppercase tracking-tighter">Neural RAG Database</h3>
                  <p className="text-sm text-red-900 font-bold tracking-widest">Inject specialized datasets for context-aware inference.</p>
                </div>
                <label className="px-6 py-3 bg-red-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg cursor-pointer hover:bg-red-600 transition-all active:scale-95">
                  Inject Pack
                  <input type="file" className="hidden" multiple onChange={handleKnowledgeUpload} accept=".pdf,.txt,.docx,.json,.mht,.csv" />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tnKnowledgePacks.map(pack => (
                  <div key={pack.id} className="p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[32px] group hover:bg-red-900/10 transition-all relative overflow-hidden">
                    {pack.status === 'indexing' && (
                      <div className="absolute inset-0 bg-red-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <Zap className="w-8 h-8 text-red-500 animate-pulse" />
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Indexing Neural Vectors...</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-6 mb-6">
                      <div className="p-4 bg-red-900/20 rounded-2xl">
                        <Database className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-black text-red-100 uppercase tracking-tight">{pack.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-red-800 font-black mt-2">{pack.size} • {pack.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 py-3 bg-red-900/20 text-[10px] font-black uppercase text-red-700 rounded-xl">Re-Index</button>
                      <button className="p-3 text-red-900 hover:text-red-500 transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VAULT */}
          {tnModule === 'vault' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {!isVaultUnlocked ? (
                <div key="locked" className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 space-y-8 md:space-y-12 text-center transition-all">
                  <div className="relative">
                    <div className="p-6 md:p-12 bg-red-900/10 rounded-full border border-red-600/20 shadow-[0_0_80px_rgba(185,28,28,0.15)] relative z-10">
                      <ShieldCheck className="w-24 h-24 text-red-600" />
                    </div>
                    {isBiometricVerifying && (
                      <div className="absolute left-0 right-0 h-1 bg-red-500 glow-red z-20 animate-[pulse_1.5s_ease-in-out_infinite]" />
                    )}
                  </div>

                  <div className="space-y-4 max-w-md">
                    <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter">
                      {isBiometricVerifying ? 'Scanning Neural Pattern' : vaultStep === 'pin' ? 'Enter Access Code' : 'Memory Vault Locked'}
                    </h3>
                    <p className="text-sm text-red-900 font-bold leading-relaxed uppercase tracking-widest">
                      {vaultError || (isBiometricVerifying ? 'Verifying biometric signature...' : 'Hardware-backed encryption active')}
                    </p>
                  </div>

                  {vaultStep === 'initial' && !isBiometricVerifying && (
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                      <button onClick={startBiometric} className="w-full py-5 bg-red-700 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                        <Fingerprint className="w-5 h-5" />
                        Biometric Unlock
                      </button>
                      <button onClick={() => setVaultStep('pin')} className="w-full py-5 bg-transparent border border-red-900/30 text-red-600 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] hover:bg-red-900/10 active:scale-95 transition-all">
                        Use PIN Code
                      </button>
                    </div>
                  )}

                  {vaultStep === 'pin' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex gap-4 justify-center">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${vaultPin.length > i ? 'bg-red-600 border-red-600 scale-125 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'border-red-900/50'}`} />
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map(key => (
                          <button
                            key={key}
                            onClick={() => {
                              if (key === 'C') setVaultPin('');
                              else if (key === '←') setVaultPin(prev => prev.slice(0, -1));
                              else handleVaultPin(key);
                            }}
                            className="w-16 h-16 rounded-2xl bg-red-950/20 border border-red-900/20 flex items-center justify-center font-mono text-xl text-red-100 hover:bg-red-900/40 hover:border-red-600/50 transition-all active:scale-90"
                          >
                            {key}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => { setVaultStep('initial'); setVaultPin(''); }} className="text-[10px] font-black text-red-900 uppercase tracking-[0.3em] hover:text-red-600 transition-colors">
                        Cancel Verification
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div key="unlocked" className="flex-1 flex flex-col p-6 md:p-12 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar transition-all">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter flex items-center gap-4">
                        <Unlock className="w-8 h-8 text-red-500" />
                        Vault Decrypted
                      </h3>
                      <p className="text-[10px] text-red-900 font-black uppercase tracking-[0.3em]">Secure Session Active • AES-256-GCM</p>
                    </div>
                    <button onClick={() => setIsVaultUnlocked(false)} className="px-6 py-3 bg-red-950/30 border border-red-900/30 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/20 transition-all">
                      Lock Vault
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {[
                      { title: 'Neural Weights',   desc: 'Optimized Llama-3 8B weights for local inference.',        size: '4.8GB',  date: '2024-03-20' },
                      { title: 'Personal Dataset', desc: 'Encrypted JSON export of private chat history.',            size: '124MB',  date: '2024-03-22' },
                      { title: 'Hardware Keys',    desc: 'Master recovery keys for crimson-node-01.',                 size: '2KB',    date: '2024-01-15' },
                      { title: 'Vision Assets',    desc: 'High-fidelity textures for UI generation.',                 size: '850MB',  date: '2024-03-23' },
                    ].map((item, i) => (
                      <div key={i} className="p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] space-y-4 group hover:border-red-600/30 transition-all cursor-pointer animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-red-900/10 rounded-2xl border border-red-900/20 text-red-500 group-hover:scale-110 transition-transform">
                            <FileCode className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black text-red-900 uppercase tracking-widest">{item.size}</span>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-black text-red-100 uppercase tracking-tight">{item.title}</h4>
                          <p className="text-xs text-red-100/50 leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="pt-4 flex items-center justify-between border-t border-red-900/10">
                          <span className="text-[9px] font-black text-red-950 uppercase tracking-widest">{item.date}</span>
                          <Download className="w-4 h-4 text-red-900 hover:text-red-500 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISION */}
          {tnModule === 'vision' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 space-y-6 md:space-y-8 text-center">
              <div className="p-6 md:p-12 bg-red-900/10 rounded-full border border-red-600/20 shadow-[0_0_60px_rgba(185,28,28,0.1)]">
                <LayoutTemplate className="w-24 h-24 text-red-600" />
              </div>
              <div className="space-y-4 max-w-md">
                <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter">Code Analysis Engine</h3>
                <p className="text-sm text-red-900 font-bold leading-relaxed">Side-by-side neural code analysis. Detect vulnerabilities, optimize performance, and refactor architecture instantly.</p>
              </div>
              <button onClick={() => setActiveTab('analysis')} className="px-12 py-5 bg-red-700 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Initialize Engine</button>
            </div>
          )}

          {/* SWARM */}
          {tnModule === 'swarm' && (
            <div className="flex-1 p-6 md:p-10 space-y-6 md:space-y-10 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b border-red-900/20 pb-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter flex items-center gap-5">
                    <Network className="w-8 h-8 text-red-600" /> Neural Swarm Core
                  </h3>
                  <p className="text-sm text-red-900 font-bold tracking-widest uppercase">Biomimetic distributed intelligence & consensus engine</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Swarm Anxiety</p>
                    <p className={`text-lg font-mono font-black ${(swarmAnxiety * 100) > 50 ? 'text-red-500' : 'text-red-700'}`}>{(swarmAnxiety * 100).toFixed(1)}%</p>
                  </div>
                  <button onClick={triggerSwarmCycle} disabled={isAiProcessing} className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3">
                    <Zap className={`w-4 h-4 ${isAiProcessing ? 'animate-pulse' : ''}`} />
                    {isAiProcessing ? 'Processing...' : 'Trigger Cycle'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  <div className="bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] p-6 md:p-10 relative overflow-hidden h-[300px] md:h-[500px] flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.1)_0%,transparent_70%)]" />
                    <div className="relative w-full h-full">
                      {swarmAgents.map((agent, i) => {
                        const angle = (i / swarmAgents.length) * Math.PI * 2;
                        const x = Math.cos(angle) * 160;
                        const y = Math.sin(angle) * 160;
                        return (
                          <div key={agent.id} style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${agent.status === 'active' ? 1.1 : 1})` }} className="absolute left-1/2 top-1/2 flex flex-col items-center gap-3 transition-all duration-500">
                            <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${agent.status === 'active' ? 'bg-red-600 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.6)]' : 'bg-red-950/40 border-red-900/40'}`}>
                              <Users className={`w-7 h-7 ${agent.status === 'active' ? 'text-white' : 'text-red-900'}`} />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-red-100 uppercase tracking-tighter">{agent.name}</p>
                              <p className="text-[8px] font-black text-red-900 uppercase tracking-widest mt-1">{agent.expertise}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-900/20 rounded-full blur-3xl animate-pulse" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <Brain className="w-12 h-12 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {swarmAgents.map(agent => (
                      <div key={agent.id} className="p-5 bg-red-950/5 border border-red-900/10 rounded-3xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">Trust</span>
                          <span className="text-[10px] font-mono text-red-500">{(agent.trust * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1 bg-red-950/40 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600" style={{ width: `${agent.trust * 100}%` }} />
                        </div>
                        <p className="text-[9px] font-black text-red-100 uppercase truncate">{agent.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0a0202] border border-red-900/30 rounded-[30px] md:rounded-[40px] flex flex-col shadow-2xl overflow-hidden h-[400px] md:h-[650px]">
                  <div className="p-4 md:p-8 border-b border-red-900/20 bg-black/40 flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <Activity className="w-4 h-4" /> Consensus Stream
                    </h4>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar font-mono text-[11px]">
                    {swarmLogs.map(log => (
                      <div key={log.id} className={`p-4 rounded-2xl border ${
                        log.type === 'consensus' ? 'bg-green-500/5 border-green-500/20 text-green-500' :
                        log.type === 'pain'      ? 'bg-red-500/5 border-red-500/20 text-red-500' :
                                                   'bg-red-950/10 border-red-900/10 text-red-900'
                      }`}>
                        <div className="flex justify-between mb-2 opacity-50">
                          <span>[{log.type.toUpperCase()}]</span>
                          <span>{log.time}</span>
                        </div>
                        <p className="leading-relaxed font-bold">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEBUG */}
          {tnModule === 'debug' && (
            <div className="flex-1 p-6 md:p-12 space-y-8 md:space-y-10 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-2xl md:text-3xl font-black text-red-100 uppercase tracking-tighter">Neural Debugger</h3>
                  <p className="text-xs md:text-sm text-red-900 font-bold tracking-widest uppercase">Real-time code analysis and dynamic tracing.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={runStaticAnalysis} disabled={debugAnalysis.static.status === 'running'} className="px-4 md:px-6 py-2.5 md:py-3 bg-red-950/20 border border-red-900/30 text-red-500 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-red-900/20 transition-all disabled:opacity-50">
                    {debugAnalysis.static.status === 'running' ? 'Analyzing...' : 'Static Analysis'}
                  </button>
                  <button onClick={runDynamicTracing} disabled={debugAnalysis.tracing.status === 'running'} className="px-4 md:px-6 py-2.5 md:py-3 bg-red-700 text-white rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all disabled:opacity-50">
                    {debugAnalysis.tracing.status === 'running' ? 'Tracing...' : 'Dynamic Trace'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-red-950/5 border border-red-900/20 rounded-[30px] md:rounded-[40px] p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <FileSearch className="w-4 h-4" /> Static Analysis
                    </h4>
                    {debugAnalysis.static.status === 'done' && (
                      <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">{debugAnalysis.static.issues.length} Issues Found</span>
                    )}
                  </div>
                  <div className="space-y-4 min-h-[200px]">
                    {debugAnalysis.static.status === 'idle' && (
                      <div className="h-full flex flex-col items-center justify-center text-red-950 italic opacity-30 py-12">
                        <FileSearch className="w-12 h-12 mb-4" />
                        <p className="text-[10px] uppercase tracking-widest">Awaiting Analysis Directive</p>
                      </div>
                    )}
                    {debugAnalysis.static.status === 'running' && (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-red-900/10 rounded-xl animate-pulse" />)}
                      </div>
                    )}
                    {debugAnalysis.static.status === 'done' && debugAnalysis.static.issues.map((issue, i) => (
                      <div key={i} className={`p-4 rounded-2xl border flex items-start gap-4 ${
                        issue.type === 'error'   ? 'bg-red-950/20 border-red-600/30' :
                        issue.type === 'warning' ? 'bg-orange-950/10 border-orange-900/20' :
                                                   'bg-blue-950/10 border-blue-900/20'
                      }`}>
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${issue.type === 'error' ? 'bg-red-500' : issue.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-[12px] text-red-100 font-bold leading-tight">{issue.message}</p>
                          {issue.line && <p className="text-[9px] text-red-900 uppercase font-black tracking-widest">Line {issue.line}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-950/5 border border-red-900/20 rounded-[30px] md:rounded-[40px] p-6 md:p-8 space-y-6 flex flex-col h-[400px] lg:h-auto">
                  <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Activity className="w-4 h-4" /> Dynamic Tracing
                  </h4>
                  <div className="flex-1 bg-black/40 rounded-2xl p-4 font-mono text-[11px] overflow-y-auto custom-scrollbar space-y-2">
                    {debugAnalysis.tracing.logs.length === 0 && debugAnalysis.tracing.status === 'idle' && (
                      <div className="h-full flex flex-col items-center justify-center text-red-900 opacity-20 italic">
                        <p>SYSTEM_IDLE: NO_ACTIVE_TRACE</p>
                      </div>
                    )}
                    {debugAnalysis.tracing.logs.map((log, i) => (
                      <div key={i} className={log.includes('exception') ? 'text-red-500 font-bold' : 'text-red-100/60'}>{log}</div>
                    ))}
                    {debugAnalysis.tracing.status === 'running' && <div className="text-red-600 animate-pulse">_</div>}
                  </div>
                </div>
              </div>

              <div className="bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-8 md:p-12 space-y-6 md:space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <h4 className="text-xl md:text-2xl font-black text-red-100 uppercase tracking-tighter flex items-center gap-4">
                      <Sparkles className="w-6 h-6 text-red-600" /> Neural Refactoring
                    </h4>
                    <p className="text-xs md:text-sm text-red-900 font-bold tracking-widest uppercase">Automated suggestions from the {activePersonality.name} personality.</p>
                  </div>
                  <button onClick={getRefactoringSuggestions} disabled={debugAnalysis.refactoring.status === 'running'} className="w-full md:w-auto px-8 py-4 bg-red-800/10 border border-red-700/30 rounded-2xl text-red-500 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-800/20 transition-all disabled:opacity-50">
                    {debugAnalysis.refactoring.status === 'running' ? 'Synthesizing...' : 'Generate Suggestions'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  {debugAnalysis.refactoring.status === 'idle' && [1, 2, 3].map(i => (
                    <div key={i} className="p-6 bg-red-950/5 border border-red-900/10 rounded-3xl h-32 flex items-center justify-center opacity-20">
                      <div className="w-full h-2 bg-red-900/20 rounded-full" />
                    </div>
                  ))}
                  {debugAnalysis.refactoring.status === 'running' && [1, 2, 3].map(i => (
                    <div key={i} className="p-6 bg-red-950/5 border border-red-900/10 rounded-3xl h-32 animate-pulse" />
                  ))}
                  {debugAnalysis.refactoring.status === 'done' && debugAnalysis.refactoring.suggestions.map((s, i) => (
                    <div key={i} className="p-6 bg-red-950/10 border border-red-900/20 rounded-3xl hover:border-red-600/40 transition-all group">
                      <div className="w-8 h-8 bg-red-900/20 rounded-lg flex items-center justify-center text-red-500 font-black text-xs mb-4 group-hover:bg-red-700 group-hover:text-white transition-all">0{i + 1}</div>
                      <p className="text-[13px] text-red-100/80 leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HELP */}
          {tnModule === 'help' && (
            <div className="flex-1 p-6 md:p-12 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter">Neural Guide</h3>
                <p className="text-sm text-red-900 font-bold tracking-widest uppercase">Understanding the ToolNeuron Ecosystem</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {[
                  { icon: <MessageSquare className="w-6 h-6" />, title: 'Neural Chat', desc: 'High-performance local inference using GGUF models. ToolNeuron utilizes advanced quantization to run large language models directly on your hardware with zero data leakage.', bullets: ['Zero Latency Cloud Bridge', 'Context-Aware Memory', 'Multi-Persona Support'] },
                  { icon: <LayoutTemplate className="w-6 h-6" />, title: 'Code Analysis', desc: 'Side-by-side neural code analysis. Detect vulnerabilities, optimize performance, and refactor architecture instantly.', bullets: ['Vulnerability Detection', 'Performance Optimization', 'Architecture Refactoring'] },
                  { icon: <BookOpen className="w-6 h-6" />, title: 'Neural Database', desc: 'Advanced RAG system. Inject custom datasets (PDF, TXT, JSON) to provide your local models with specialized domain knowledge.', bullets: ['Local Vector Indexing', 'Semantic Search Engine', 'Custom Data Injection'] },
                  { icon: <ShieldCheck className="w-6 h-6" />, title: 'Memory Vault', desc: 'Secure, hardware-encrypted storage for sensitive neural weights and personal datasets. Utilizes AES-256-GCM with biometric authentication.', bullets: ['Hardware-Backed Keys', 'Encrypted File System', 'Biometric Neural Lock'] },
                ].map((card, i) => (
                  <div key={i} className="p-6 md:p-8 bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] space-y-4">
                    <div className="flex items-center gap-4 text-red-500">
                      {card.icon}
                      <h4 className="text-lg font-black uppercase tracking-tight">{card.title}</h4>
                    </div>
                    <p className="text-[13px] text-red-100/70 leading-relaxed">{card.desc}</p>
                    <ul className="text-[11px] text-red-900 font-bold space-y-2 uppercase tracking-widest">
                      {card.bullets.map((b, j) => <li key={j}>• {b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
