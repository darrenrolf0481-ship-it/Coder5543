import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import {
  Activity, BookOpen, Bug, Check, Copy, Database, Download, FileCode, FileSearch,
  Fingerprint, HelpCircle, ImageIcon, LayoutTemplate, MessageSquare,
  Network, Save, Send, ShieldCheck, Sparkles, Trash2, Unlock, Zap,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Personality } from './SettingsPanel';
import { SafeMarkdown } from '../SafeMarkdown';
import { ActionButton } from '../ActionButton';
import { DebugAnalysis, SwarmLog, KnowledgePack, ChatMessage } from './types';
import { extractAllCodeBlocks, isAnalysisMessage } from '../../utils/helpers';
import { UseSwarmStateReturn } from '../../hooks/useSwarmState';
import { SwarmCore } from './swarm/SwarmCore';

// ── Types ──────────────────────────────────────────────────────────────────

interface ToolNeuronPanelProps {
  chatMessages: ChatMessage[];
  studioInput: string;
  setStudioInput: (v: string) => void;
  handleStudioSubmit: (e: React.FormEvent) => void;
  isVaultUnlocked: boolean;
  setIsVaultUnlocked: (v: boolean) => void;
  swarmState: UseSwarmStateReturn;
  swarm: {
    missionInput: string;
    setMissionInput: (v: string) => void;
    isRunning: boolean;
    triggerSwarmCycle: (missionOverride?: string) => Promise<void>;
  };
  debugAnalysis: DebugAnalysis;
  runStaticAnalysis: () => void;
  runDynamicTracing: () => void;
  getRefactoringSuggestions: () => void;
  activePersonality: Personality;
  tnKnowledgePacks: KnowledgePack[];
  handleKnowledgeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setActiveTab: (tab: 'terminal' | 'analysis' | 'termux' | 'storage' | 'settings' | 'editor' | 'toolneuron' | 'brain') => void;
  onApplyCode: (code: string, mode: 'refactor' | 'replace') => void;
  onSaveReport: (text: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export const ToolNeuronPanel: React.FC<ToolNeuronPanelProps> = ({
  chatMessages, studioInput, setStudioInput, handleStudioSubmit,
  isVaultUnlocked, setIsVaultUnlocked,
  swarmState, swarm,
  debugAnalysis, runStaticAnalysis, runDynamicTracing, getRefactoringSuggestions,
  activePersonality, tnKnowledgePacks, handleKnowledgeUpload, setActiveTab, onApplyCode, onSaveReport,
}) => {
  const { vaultMemories, fetchVault } = useAppContext();
  // ── Local state ────────────────────────────────────────────────────────
  const [tnModule, setTnModule] = useState<'chat' | 'vision' | 'knowledge' | 'vault' | 'swarm' | 'help' | 'debug'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVaultUnlocked && tnModule === 'vault') {
      fetchVault();
    }
  }, [isVaultUnlocked, tnModule, fetchVault]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // On mobile, scroll input into view when keyboard opens
  const handleInputFocus = () => {
    setTimeout(() => chatInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 300);
  };

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

  const modules = [
    { id: 'chat',      label: 'Neural Chat',   icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'vision',    label: 'Code Analysis', icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 'knowledge', label: 'Knowledge RAG', icon: <Database className="w-4 h-4" /> },
    { id: 'vault',     label: 'Memory Vault',  icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'swarm',     label: 'Swarm Core',    icon: <Network className="w-4 h-4" /> },
    { id: 'debug',     label: 'Debugger',      icon: <Bug className="w-4 h-4" /> },
    { id: 'help',      label: 'Guide',         icon: <HelpCircle className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">

      {/* MOBILE: horizontal scroll tab strip */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-3 bg-[#080101] border-b border-accent-900/20 overflow-x-auto no-scrollbar shrink-0">
        {modules.map(mod => (
          <button
            key={mod.id}
            onClick={() => setTnModule(mod.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shrink-0 transition-all ${tnModule === mod.id ? 'bg-accent-700 text-white shadow-[0_0_12px_var(--color-accent-600)/0.3]' : 'bg-accent-950/20 text-accent-700 border border-accent-900/20'}`}
          >
            {mod.icon}
            {mod.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-0 overflow-hidden p-4 md:p-8">
        {/* DESKTOP: sidebar module navigation */}
        <div className="hidden lg:flex w-72 flex-col shrink-0">
          <div className="flex-1 code-editor-bg rounded-[40px] border border-accent-900/30 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-accent-100 uppercase tracking-tighter">ToolNeuron</h3>
              <p className="text-[9px] text-accent-900 font-black tracking-[0.3em] uppercase">Offline AI Ecosystem</p>
            </div>
            
            <div className="flex flex-col gap-2">
              {modules.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setTnModule(mod.id as any)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${tnModule === mod.id ? 'bg-accent-700 text-white shadow-lg scale-[1.01]' : 'bg-accent-950/10 text-accent-900 hover:text-accent-500'}`}
                >
                  {mod.icon}
                  <span className="truncate">{mod.label}</span>
                </button>
              ))}
            </div>

            <hr className="border-accent-900/20" />

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-accent-800 uppercase tracking-[0.4em]">System Status</h4>
              <div className="space-y-3">
                <div className="p-4 bg-accent-950/10 rounded-2xl border border-accent-900/10">
                  <p className="text-[9px] text-accent-900 font-black uppercase mb-2">Local Inference</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-accent-100 font-bold">GGUF_Llama_3</span>
                    <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                  </div>
                </div>
                <div className="p-4 bg-accent-950/10 rounded-2xl border border-accent-900/10">
                  <p className="text-[9px] text-accent-900 font-black uppercase mb-2">Vault Encryption</p>
                  <span className="text-[11px] text-accent-100 font-bold">AES-256-GCM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 min-h-0 code-editor-bg rounded-[20px] md:rounded-[40px] border border-accent-900/30 shadow-2xl overflow-hidden flex flex-col">

          {/* CHAT */}
          {tnModule === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="h-16 border-b border-accent-900/20 flex items-center px-8 bg-black/40 justify-between">
                <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                  <MessageSquare className="w-4 h-4" /> Neural Chat Interface
                </h4>
                <span className="text-[10px] font-mono text-accent-900">LATENCY: 12ms</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-40">
                    <MessageSquare className="w-12 h-12 text-accent-600 mb-4" />
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent-400 mb-1">Neural Chat Ready</p>
                    <p className="text-[10px] text-accent-700 uppercase tracking-widest">Type a message to begin</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => {
                  const codeBlocks = msg.role === 'ai' ? extractAllCodeBlocks(msg.text) : [];
                  const showSave   = msg.role === 'ai' && isAnalysisMessage(msg.text);
                  return (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-3xl p-5 text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-accent-800 text-white rounded-tr-none'
                          : 'bg-[#1a0505] border border-accent-800/40 text-accent-100 rounded-tl-none shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]'
                      }`}>
                        {msg.type === 'image' ? (
                          <div className="space-y-4">
                            <img src={msg.url} alt="Generated" className="w-full rounded-xl border border-accent-900/30" />
                            <p className="text-[10px] font-mono text-accent-400 opacity-70">{msg.text}</p>
                          </div>
                        ) : (
                          <>
                            <div className="markdown-body">
                              <SafeMarkdown>{msg.text}</SafeMarkdown>
                            </div>

                            {/* Action bar — only for AI messages with actionable content */}
                            {msg.role === 'ai' && (showSave || codeBlocks.length > 0) && (
                              <div className="mt-4 pt-3 border-t border-accent-900/20 space-y-2">

                                {/* Top row: Copy + Save Report */}
                                <div className="flex flex-wrap gap-2">
                                  <ActionButton
                                    onClick={() => navigator.clipboard.writeText(msg.text)}
                                    icon={Copy}
                                    label="Copy"
                                    activeLabel="Copied!"
                                  />
                                  {showSave && (
                                    <ActionButton
                                      onClick={() => onSaveReport(msg.text)}
                                      icon={Save}
                                      label="Save Report"
                                      activeLabel="Saved!"
                                    />
                                  )}
                                </div>

                                {/* Code blocks: each gets its own Apply row */}
                                {codeBlocks.map((block, bi) => (
                                  <div key={bi} className="rounded-lg overflow-hidden border border-accent-900/20">
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-accent-900/20">
                                      <span className="text-[9px] font-mono text-accent-700 uppercase tracking-widest">{block.lang}</span>
                                      <div className="flex gap-1.5">
                                        <ActionButton
                                          onClick={() => navigator.clipboard.writeText(block.code)}
                                          icon={Copy}
                                          label="Copy Code"
                                          activeLabel="Copied!"
                                        />
                                        <ActionButton
                                          onClick={() => onApplyCode(block.code, 'refactor')}
                                          icon={Sparkles}
                                          label="Apply Refactor"
                                          activeLabel="Applied!"
                                        />
                                        <ActionButton
                                          onClick={() => onApplyCode(block.code, 'replace')}
                                          icon={FileCode}
                                          label="Apply to File"
                                          activeLabel="Applied!"
                                        />
                                      </div>
                                    </div>                                    <pre className="px-3 py-2 text-[10px] font-mono text-accent-200/70 overflow-x-auto max-h-32 bg-black/20 whitespace-pre">{block.code}</pre>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleStudioSubmit} className="p-3 md:p-6 bg-black/40 border-t border-accent-900/20 shrink-0">
                <div className="relative max-w-3xl mx-auto">
                  <input
                    ref={chatInputRef}
                    value={studioInput}
                    onChange={(e) => setStudioInput(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Send neural directive..."
                    className="w-full bg-[#0d0404] border border-accent-900/40 rounded-2xl pl-4 pr-14 py-3.5 text-sm text-accent-100 focus:border-accent-600/60 outline-none"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-accent-700 hover:bg-accent-600 active:scale-95 rounded-xl text-white transition-all">
                    <Send className="w-4 h-4" />
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
                  <h3 className="text-2xl font-black text-accent-100 uppercase tracking-tighter">Neural RAG Database</h3>
                  <p className="text-sm text-accent-900 font-bold tracking-widest">Inject specialized datasets for context-aware inference.</p>
                </div>
                <label className="px-6 py-3 bg-accent-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg cursor-pointer hover:bg-accent-600 transition-all active:scale-95">
                  Inject Pack
                  <input type="file" className="hidden" multiple onChange={handleKnowledgeUpload} accept=".pdf,.txt,.docx,.json,.mht,.csv" />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tnKnowledgePacks.map(pack => (
                  <div key={pack.id} className="p-6 md:p-8 bg-accent-950/5 border border-accent-900/20 rounded-[20px] md:rounded-[32px] group hover:bg-accent-900/10 transition-all relative overflow-hidden">
                    {pack.status === 'indexing' && (
                      <div className="absolute inset-0 bg-accent-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 w-full px-8">
                          <Zap className="w-8 h-8 text-accent-500 animate-pulse" />
                          <span className="text-[10px] font-black text-accent-500 uppercase tracking-[0.3em]">Indexing Neural Vectors...</span>
                          {pack.progress !== undefined && (
                            <div className="w-full h-1 bg-accent-900/30 rounded-full mt-2 overflow-hidden">
                              <div 
                                className="h-full bg-accent-500 transition-all duration-300" 
                                style={{ width: `${pack.progress}%` }}
                              />
                            </div>
                          )}
                          {pack.progress !== undefined && (
                            <span className="text-[9px] font-bold text-accent-600 uppercase tracking-widest">{pack.progress}% Complete</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-6 mb-6">
                      <div className="p-4 bg-accent-900/20 rounded-2xl">
                        <Database className="w-6 h-6 text-accent-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[15px] font-black text-accent-100 uppercase tracking-tight">{pack.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-accent-800 font-black mt-2">{pack.size} • {pack.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 py-3 bg-accent-900/20 text-[10px] font-black uppercase text-accent-700 rounded-xl">Re-Index</button>
                      <button className="p-3 text-accent-900 hover:text-accent-500 transition-all"><Trash2 className="w-5 h-5" /></button>
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
                <div key="locked" className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 space-y-8 md:space-y-12 text-center transition-all overflow-y-auto custom-scrollbar">
                  <div className="relative">
                    <div className="p-6 md:p-12 bg-accent-900/10 rounded-full border border-accent-600/20 shadow-[0_0_80px_var(--color-accent-700)/0.15] relative z-10">
                      <ShieldCheck className="w-24 h-24 text-accent-600" />
                    </div>
                    {isBiometricVerifying && (
                      <div className="absolute left-0 right-0 h-1 bg-accent-500 glow-accent z-20 animate-[pulse_1.5s_ease-in-out_infinite]" />
                    )}
                  </div>

                  <div className="space-y-4 max-w-md">
                    <h3 className="text-3xl font-black text-accent-100 uppercase tracking-tighter">
                      {isBiometricVerifying ? 'Scanning Neural Pattern' : vaultStep === 'pin' ? 'Enter Access Code' : 'Memory Vault Locked'}
                    </h3>
                    <p className="text-sm text-accent-900 font-bold leading-relaxed uppercase tracking-widest">
                      {vaultError || (isBiometricVerifying ? 'Verifying biometric signature...' : 'Hardware-backed encryption active')}
                    </p>
                  </div>

                  {vaultStep === 'initial' && !isBiometricVerifying && (
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                      <button onClick={startBiometric} className="w-full py-5 bg-accent-700 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                        <Fingerprint className="w-5 h-5" />
                        Biometric Unlock
                      </button>
                      <button onClick={() => setVaultStep('pin')} className="w-full py-5 bg-transparent border border-accent-900/30 text-accent-600 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] hover:bg-accent-900/10 active:scale-95 transition-all">
                        Use PIN Code
                      </button>
                    </div>
                  )}

                  {vaultStep === 'pin' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex gap-4 justify-center">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${vaultPin.length > i ? 'bg-accent-600 border-accent-600 scale-125 shadow-[0_0_10px_var(--color-accent-600)/0.5]' : 'border-accent-900/50'}`} />
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
                            className="w-16 h-16 rounded-2xl bg-accent-950/20 border border-accent-900/20 flex items-center justify-center font-mono text-xl text-accent-100 hover:bg-accent-900/40 hover:border-accent-600/50 transition-all active:scale-90"
                          >
                            {key}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => { setVaultStep('initial'); setVaultPin(''); }} className="text-[10px] font-black text-accent-900 uppercase tracking-[0.3em] hover:text-accent-600 transition-colors">
                        Cancel Verification
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div key="unlocked" className="flex-1 flex flex-col p-6 md:p-12 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar transition-all">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-accent-100 uppercase tracking-tighter flex items-center gap-4">
                        <Unlock className="w-8 h-8 text-accent-500" />
                        Vault Decrypted
                      </h3>
                      <p className="text-[10px] text-accent-900 font-black uppercase tracking-[0.3em]">Secure Session Active • AES-256-GCM</p>
                    </div>
                    <button onClick={() => setIsVaultUnlocked(false)} className="px-6 py-3 bg-accent-950/30 border border-accent-900/30 text-accent-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-900/20 transition-all">
                      Lock Vault
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {(vaultMemories.length > 0 ? vaultMemories.map(m => ({
                      id: m.id,
                      title: 'Memory Record',
                      desc: m.intent ? (m.intent.length > 100 ? m.intent.substring(0, 100) + '...' : m.intent) : 'Encrypted memory fragment',
                      size: m.outcome === 'success' ? '+ Dopamine' : '- Cortisol',
                      date: new Date(m.timestamp).toLocaleDateString()
                    })) : [
                      { id: '1', title: 'Neural Weights',   desc: 'Optimized Llama-3 8B weights for local inference.',        size: '4.8GB',  date: '2024-03-20' },
                      { id: '2', title: 'Personal Dataset', desc: 'Encrypted JSON export of private chat history.',            size: '124MB',  date: '2024-03-22' },
                      { id: '3', title: 'Hardware Keys',    desc: 'Master recovery keys for crimson-node-01.',                 size: '2KB',    date: '2024-01-15' },
                      { id: '4', title: 'Vision Assets',    desc: 'High-fidelity textures for UI generation.',                 size: '850MB',  date: '2024-03-23' },
                    ]).map((item, i) => (
                      <div key={item.id} className="p-6 md:p-8 bg-accent-950/5 border border-accent-900/20 rounded-[20px] md:rounded-[40px] space-y-4 group hover:border-accent-600/30 transition-all cursor-pointer animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${(i % 10) * 50}ms`, animationFillMode: 'both' }}>
                        <div className="flex items-center justify-between">
                          <div className="p-3 bg-accent-900/10 rounded-2xl border border-accent-900/20 text-accent-500 group-hover:scale-110 transition-transform">
                            <Database className="w-5 h-5" />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${item.size.includes('+') ? 'text-yellow-400' : item.size.includes('-') ? 'text-accent-500' : 'text-accent-900'}`}>{item.size}</span>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-black text-accent-100 uppercase tracking-tight">{item.title}</h4>
                          <p className="text-xs text-accent-100/50 leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="pt-4 flex items-center justify-between border-t border-accent-900/10">
                          <span className="text-[9px] font-black text-accent-950 uppercase tracking-widest">{item.date}</span>
                          <Download className="w-4 h-4 text-accent-900 hover:text-accent-500 transition-colors" />
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 space-y-6 md:space-y-8 text-center overflow-y-auto custom-scrollbar">
              <div className="p-6 md:p-12 bg-accent-900/10 rounded-full border border-accent-600/20 shadow-[0_0_60px_var(--color-accent-700)/0.1]">
                <LayoutTemplate className="w-24 h-24 text-accent-600" />
              </div>
              <div className="space-y-4 max-w-md">
                <h3 className="text-3xl font-black text-accent-100 uppercase tracking-tighter">Code Analysis Engine</h3>
                <p className="text-sm text-accent-900 font-bold leading-relaxed">Side-by-side neural code analysis. Detect vulnerabilities, optimize performance, and refactor architecture instantly.</p>
              </div>
              <button onClick={() => setActiveTab('analysis')} className="px-12 py-5 bg-accent-700 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Initialize Engine</button>
            </div>
          )}

          {/* SWARM */}
          {tnModule === 'swarm' && <SwarmCore swarmState={swarmState} swarm={swarm} onSaveReport={onSaveReport} onApplyCode={onApplyCode} />}

          {/* DEBUG }
          {tnModule === 'debug' && (
            <div className="flex-1 p-6 md:p-12 space-y-8 md:space-y-10 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-2xl md:text-3xl font-black text-accent-100 uppercase tracking-tighter">Neural Debugger</h3>
                  <p className="text-xs md:text-sm text-accent-900 font-bold tracking-widest uppercase">Real-time code analysis and dynamic tracing.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={runStaticAnalysis} disabled={debugAnalysis.static.status === 'running'} className="px-4 md:px-6 py-2.5 md:py-3 bg-accent-950/20 border border-accent-900/30 text-accent-500 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-accent-900/20 transition-all disabled:opacity-50">
                    {debugAnalysis.static.status === 'running' ? 'Analyzing...' : 'Static Analysis'}
                  </button>
                  <button onClick={runDynamicTracing} disabled={debugAnalysis.tracing.status === 'running'} className="px-4 md:px-6 py-2.5 md:py-3 bg-accent-700 text-white rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-accent-600 transition-all disabled:opacity-50">
                    {debugAnalysis.tracing.status === 'running' ? 'Tracing...' : 'Dynamic Trace'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-accent-950/5 border border-accent-900/20 rounded-[30px] md:rounded-[40px] p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <FileSearch className="w-4 h-4" /> Static Analysis
                    </h4>
                    {debugAnalysis.static.status === 'done' && (
                      <span className="text-[9px] font-black text-accent-900 uppercase tracking-widest">{debugAnalysis.static.issues.length} Issues Found</span>
                    )}
                  </div>
                  <div className="space-y-4 min-h-[200px]">
                    {debugAnalysis.static.status === 'idle' && (
                      <div className="h-full flex flex-col items-center justify-center text-accent-950 italic opacity-30 py-12">
                        <FileSearch className="w-12 h-12 mb-4" />
                        <p className="text-[10px] uppercase tracking-widest">Awaiting Analysis Directive</p>
                      </div>
                    )}
                    {debugAnalysis.static.status === 'running' && (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-accent-900/10 rounded-xl animate-pulse" />)}
                      </div>
                    )}
                    {debugAnalysis.static.status === 'done' && debugAnalysis.static.issues.map((issue, i) => (
                      <div key={i} className={`p-4 rounded-2xl border flex items-start gap-4 ${
                        issue.type === 'error'   ? 'bg-accent-950/20 border-accent-600/30' :
                        issue.type === 'warning' ? 'bg-orange-950/10 border-orange-900/20' :
                                                   'bg-blue-950/10 border-blue-900/20'
                      }`}>
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${issue.type === 'error' ? 'bg-accent-500' : issue.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-[12px] text-accent-100 font-bold leading-tight">{issue.message}</p>
                          {issue.line && <p className="text-[9px] text-accent-900 uppercase font-black tracking-widest">Line {issue.line}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-accent-950/5 border border-accent-900/20 rounded-[30px] md:rounded-[40px] p-6 md:p-8 space-y-6 flex flex-col h-[400px] lg:h-auto">
                  <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Activity className="w-4 h-4" /> Dynamic Tracing
                  </h4>
                  <div className="flex-1 bg-black/40 rounded-2xl p-4 font-mono text-[11px] overflow-y-auto custom-scrollbar space-y-2">
                    {debugAnalysis.tracing.logs.length === 0 && debugAnalysis.tracing.status === 'idle' && (
                      <div className="h-full flex flex-col items-center justify-center text-accent-900 opacity-20 italic">
                        <p>SYSTEM_IDLE: NO_ACTIVE_TRACE</p>
                      </div>
                    )}
                    {debugAnalysis.tracing.logs.map((log, i) => (
                      <div key={i} className={log.includes('exception') ? 'text-accent-500 font-bold' : 'text-accent-100/60'}>{log}</div>
                    ))}
                    {debugAnalysis.tracing.status === 'running' && <div className="text-accent-600 animate-pulse">_</div>}
                  </div>
                </div>
              </div>

              <div className="bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-accent-900/30 p-8 md:p-12 space-y-6 md:space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <h4 className="text-xl md:text-2xl font-black text-accent-100 uppercase tracking-tighter flex items-center gap-4">
                      <Sparkles className="w-6 h-6 text-accent-600" /> Neural Refactoring
                    </h4>
                    <p className="text-xs md:text-sm text-accent-900 font-bold tracking-widest uppercase">Automated suggestions from the {activePersonality.name} personality.</p>
                  </div>
                  <button onClick={getRefactoringSuggestions} disabled={debugAnalysis.refactoring.status === 'running'} className="w-full md:w-auto px-8 py-4 bg-accent-800/10 border border-accent-700/30 rounded-2xl text-accent-500 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-accent-800/20 transition-all disabled:opacity-50">
                    {debugAnalysis.refactoring.status === 'running' ? 'Synthesizing...' : 'Generate Suggestions'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  {debugAnalysis.refactoring.status === 'idle' && [1, 2, 3].map(i => (
                    <div key={i} className="p-6 bg-accent-950/5 border border-accent-900/10 rounded-3xl h-32 flex items-center justify-center opacity-20">
                      <div className="w-full h-2 bg-accent-900/20 rounded-full" />
                    </div>
                  ))}
                  {debugAnalysis.refactoring.status === 'running' && [1, 2, 3].map(i => (
                    <div key={i} className="p-6 bg-accent-950/5 border border-accent-900/10 rounded-3xl h-32 animate-pulse" />
                  ))}
                  {debugAnalysis.refactoring.status === 'done' && debugAnalysis.refactoring.suggestions.map((s, i) => (
                    <div key={i} className="p-6 bg-accent-950/10 border border-accent-900/20 rounded-3xl hover:border-accent-600/40 transition-all group">
                      <div className="w-8 h-8 bg-accent-900/20 rounded-lg flex items-center justify-center text-accent-500 font-black text-xs mb-4 group-hover:bg-accent-700 group-hover:text-white transition-all">0{i + 1}</div>
                      <p className="text-[13px] text-accent-100/80 leading-relaxed">{s}</p>
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
                <h3 className="text-3xl font-black text-accent-100 uppercase tracking-tighter">Neural Guide</h3>
                <p className="text-sm text-accent-900 font-bold tracking-widest uppercase">Understanding the ToolNeuron Ecosystem</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {[
                  { icon: <MessageSquare className="w-6 h-6" />, title: 'Neural Chat', desc: 'High-performance local inference using GGUF models. ToolNeuron utilizes advanced quantization to run large language models directly on your hardware with zero data leakage.', bullets: ['Zero Latency Cloud Bridge', 'Context-Aware Memory', 'Multi-Persona Support'] },
                  { icon: <LayoutTemplate className="w-6 h-6" />, title: 'Code Analysis', desc: 'Side-by-side neural code analysis. Detect vulnerabilities, optimize performance, and refactor architecture instantly.', bullets: ['Vulnerability Detection', 'Performance Optimization', 'Architecture Refactoring'] },
                  { icon: <BookOpen className="w-6 h-6" />, title: 'Neural Database', desc: 'Advanced RAG system. Inject custom datasets (PDF, TXT, JSON) to provide your local models with specialized domain knowledge.', bullets: ['Local Vector Indexing', 'Semantic Search Engine', 'Custom Data Injection'] },
                  { icon: <ShieldCheck className="w-6 h-6" />, title: 'Memory Vault', desc: 'Secure, hardware-encrypted storage for sensitive neural weights and personal datasets. Utilizes AES-256-GCM with biometric authentication.', bullets: ['Hardware-Backed Keys', 'Encrypted File System', 'Biometric Neural Lock'] },
                ].map((card, i) => (
                  <div key={i} className="p-6 md:p-8 bg-accent-950/5 border border-accent-900/20 rounded-[20px] md:rounded-[40px] space-y-4">
                    <div className="flex items-center gap-4 text-accent-500">
                      {card.icon}
                      <h4 className="text-lg font-black uppercase tracking-tight">{card.title}</h4>
                    </div>
                    <p className="text-[13px] text-accent-100/70 leading-relaxed">{card.desc}</p>
                    <ul className="text-[11px] text-accent-900 font-bold space-y-2 uppercase tracking-widest">
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
