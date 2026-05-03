import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Sparkles, Upload, Plus, UserCircle, ShieldCheck,
  Database, ChevronDown, FileText, FileCode, GitBranch, FilePlus, X,
  Network, Brain, Code2, FileSearch, BookOpen, Trash2, Power,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export interface KnowledgeEntry {
  id: string;
  type: 'file' | 'github' | 'text';
  name: string;
  content: string;
  url?: string;
  size?: number;
  addedAt: string;
}

export interface Personality {
  id: number;
  name: string;
  instruction: string;
  active: boolean;
  suggestions: string[];
  knowledgeBase: KnowledgeEntry[];
}

// ── Props ──────────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  personalities: Personality[];
  setPersonalities: React.Dispatch<React.SetStateAction<Personality[]>>;
  grokApiKey: string;
  setGrokApiKey: (v: string) => void;
  geminiApiKey: string;
  setGeminiApiKey: (v: string) => void;
  brainConfig: { logic: string; runtime: string; mappedPaths: string[] };
  setBrainConfig: (v: any) => void;
  brainRefFile: { name: string; data: string; mimeType: string } | null;
  setBrainRefFile: (v: any) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (v: boolean) => void;
  setTerminalOutput: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveTab: (tab: string) => void;
  generateAIResponse: (prompt: string, system: string, opts?: any) => Promise<string>;
  activePersonality: Personality;
}

// ── Utils ──────────────────────────────────────────────────────────────────

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

const kbUid = () => `kb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ── Component ──────────────────────────────────────────────────────────────

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  theme, toggleTheme,
  personalities, setPersonalities,
  grokApiKey, setGrokApiKey,
  geminiApiKey, setGeminiApiKey,
  brainConfig, setBrainConfig,
  brainRefFile, setBrainRefFile,
  isAiProcessing, setIsAiProcessing,
  setTerminalOutput, setActiveTab,
  generateAIResponse, activePersonality,
}) => {
  // ── KB panel state (local) ───────────────────────────────────────────────
  const [openKBPanelId, setOpenKBPanelId] = useState<number | null>(null);
  const [kbGithubUrl, setKbGithubUrl]     = useState<Record<number, string>>({});
  const [kbSnippetText, setKbSnippetText] = useState<Record<number, string>>({});
  const [kbSnippetName, setKbSnippetName] = useState<Record<number, string>>({});

  // ── Custom Personality modal state (local) ───────────────────────────────
  const [modalOpen, setModalOpen]                   = useState(false);
  const [newPersonalityName, setNewPersonalityName] = useState('');
  const [newPersonalityInstruction, setNewPersonalityInstruction] = useState('');
  const [newPersonalitySuggestions, setNewPersonalitySuggestions] = useState('');
  const [newPersonalityKB, setNewPersonalityKB]     = useState<KnowledgeEntry[]>([]);
  const [modalKbGithubUrl, setModalKbGithubUrl]     = useState('');
  const [modalKbSnippetText, setModalKbSnippetText] = useState('');
  const [modalKbSnippetName, setModalKbSnippetName] = useState('');

  // ── KB handlers ──────────────────────────────────────────────────────────

  const addKnowledgeEntry = (pid: number, entry: KnowledgeEntry) => {
    setPersonalities(prev => prev.map(p =>
      p.id === pid ? { ...p, knowledgeBase: [...(p.knowledgeBase ?? []), entry] } : p
    ));
  };

  const removeKnowledgeEntry = (pid: number, entryId: string) => {
    setPersonalities(prev => prev.map(p =>
      p.id === pid ? { ...p, knowledgeBase: (p.knowledgeBase ?? []).filter(e => e.id !== entryId) } : p
    ));
  };

  const handleKBFileUpload = (pid: number, files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => addKnowledgeEntry(pid, {
        id: kbUid(), type: 'file', name: file.name,
        content: (e.target?.result as string) ?? '',
        size: file.size, addedAt: new Date().toISOString(),
      });
      reader.readAsText(file);
    });
  };

  const fetchGitHubKB = async (pid: number, url: string) => {
    if (!url.trim()) return;
    try {
      const raw = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      const text = await fetch(raw).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); });
      addKnowledgeEntry(pid, { id: kbUid(), type: 'github', name: url.split('/').pop() ?? url, content: text, url, addedAt: new Date().toISOString() });
      setKbGithubUrl(prev => ({ ...prev, [pid]: '' }));
      setTerminalOutput(prev => [...prev, `[KB] Fetched ${url.split('/').pop()} for ${personalities.find(p => p.id === pid)?.name}`]);
    } catch (err: any) {
      setTerminalOutput(prev => [...prev, `[KB ERROR] ${err.message}`]);
    }
  };

  const handleModalKBFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setNewPersonalityKB(prev => [...prev, {
        id: kbUid(), type: 'file', name: file.name,
        content: (e.target?.result as string) ?? '',
        size: file.size, addedAt: new Date().toISOString(),
      }]);
      reader.readAsText(file);
    });
  };

  const fetchModalGitHubKB = async (url: string) => {
    if (!url.trim()) return;
    try {
      const raw = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      const text = await fetch(raw).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); });
      setNewPersonalityKB(prev => [...prev, { id: kbUid(), type: 'github', name: url.split('/').pop() ?? url, content: text, url, addedAt: new Date().toISOString() }]);
      setModalKbGithubUrl('');
    } catch (err: any) {
      setTerminalOutput(prev => [...prev, `[KB ERROR] ${err.message}`]);
    }
  };

  const handleCreatePersonality = () => {
    setPersonalities(prev => [...prev, {
      id: Date.now(),
      name: newPersonalityName,
      instruction: newPersonalityInstruction,
      active: false,
      suggestions: newPersonalitySuggestions.split(',').map(s => s.trim()).filter(Boolean),
      knowledgeBase: newPersonalityKB,
    }]);
    setNewPersonalityName(''); setNewPersonalityInstruction(''); setNewPersonalitySuggestions('');
    setNewPersonalityKB([]); setModalKbGithubUrl(''); setModalKbSnippetText(''); setModalKbSnippetName('');
    setModalOpen(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Settings tab content */}
      <div className="h-full p-4 md:p-12 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 bg-[#020204]">
        <div className="max-w-4xl mx-auto space-y-10 md:space-y-16 pb-20">
          <header className="space-y-4 border-b border-red-900/30 pb-8 md:pb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black text-red-100 tracking-tighter uppercase leading-none drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">Crimson Core</h2>
              <p className="text-red-900 text-[11px] md:text-[13px] font-black tracking-[0.2em] uppercase">Architecture & Neural Personalities Control</p>
            </div>
            <div className="px-4 md:px-6 py-2 md:py-3 bg-red-950/20 border border-red-900/30 rounded-2xl text-[10px] md:text-[12px] font-mono text-red-600 font-black shadow-inner">SYSTEM_STATE: OPTIMAL</div>
          </header>

          {/* System Theme */}
          <section className="space-y-6 md:space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><SettingsIcon className="w-6 h-6 text-red-600" /> System Theme</h3>
              <button onClick={toggleTheme} className="px-6 py-3 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/50 hover:text-red-300 transition-all">
                {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </button>
            </div>
          </section>

          {/* Personalities */}
          <section className="space-y-6 md:space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><Sparkles className="w-6 h-6 text-red-600" /> Neural Archetypes</h3>
              <div className="flex items-center gap-3">
                <label className="px-6 py-3 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/50 hover:text-red-300 transition-all flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" /> Import JSON
                  <input type="file" accept=".json" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const imported = JSON.parse(ev.target?.result as string);
                        if (Array.isArray(imported)) {
                          setPersonalities(prev => [...prev, ...imported.map((p, i) => ({
                            id: Date.now() + i,
                            name: p.name || 'Unknown Archetype',
                            instruction: p.instruction || '',
                            active: false,
                            suggestions: p.suggestions || ['analyze', 'process'],
                            knowledgeBase: Array.isArray(p.knowledgeBase) ? p.knowledgeBase : [],
                          }))]);
                        }
                      } catch { /* invalid JSON */ }
                    };
                    reader.readAsText(file);
                  }} />
                </label>
                <button onClick={() => setModalOpen(true)} className="px-6 py-3 bg-red-950/30 text-red-400 border border-red-900/50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/50 hover:text-red-300 transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Custom Archetype
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
              {personalities.map(p => {
                const kbOpen = openKBPanelId === p.id;
                const kb = p.knowledgeBase ?? [];
                return (
                  <div key={p.id} className={`rounded-[20px] md:rounded-[30px] border transition-all relative overflow-hidden ${p.active ? 'bg-red-900/10 border-red-600/50 shadow-[0_20px_60px_rgba(153,27,27,0.2)]' : 'bg-[#0a0202] border-red-900/20 hover:border-red-900/40'}`}>
                    <div onClick={() => setPersonalities(prev => prev.map(pers => ({ ...pers, active: pers.id === p.id })))} className="flex items-center justify-between p-5 md:p-7 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <UserCircle className={`w-8 h-8 ${p.active ? 'text-red-500' : 'text-red-950'}`} />
                        <span className="text-sm font-black text-red-100 tracking-tighter uppercase">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {kb.length > 0 && <span className="text-[9px] font-black uppercase tracking-widest bg-red-900/40 text-red-400 border border-red-700/40 rounded-full px-2 py-0.5">{kb.length} KB</span>}
                        {p.active && <ShieldCheck className="w-5 h-5 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
                      </div>
                    </div>

                    <div className="px-5 md:px-7 pb-4" onClick={e => e.stopPropagation()}>
                      <textarea value={p.instruction}
                        onChange={(e) => setPersonalities(prev => prev.map(pers => pers.id === p.id ? { ...pers, instruction: e.target.value } : pers))}
                        className="w-full bg-black/60 border border-red-950 rounded-2xl p-4 text-[11px] text-red-100/60 font-mono h-32 resize-none outline-none focus:border-red-600/30 transition-all leading-relaxed shadow-inner"
                      />
                    </div>

                    <div className="px-5 md:px-7 pb-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setOpenKBPanelId(kbOpen ? null : p.id)} className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-red-800 hover:text-red-400 transition-colors py-2 border-t border-red-900/20">
                        <span className="flex items-center gap-2"><Database className="w-3.5 h-3.5" /> Knowledge Base {kb.length > 0 ? `(${kb.length})` : ''}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${kbOpen ? '' : '-rotate-90'}`} />
                      </button>
                    </div>

                    {kbOpen && (
                      <div className="px-5 md:px-7 pb-5 space-y-3" onClick={e => e.stopPropagation()}>
                        {kb.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {kb.map(entry => (
                              <div key={entry.id} className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/30 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-red-300">
                                {entry.type === 'github' ? <GitBranch className="w-3 h-3 shrink-0 text-purple-400" /> : entry.type === 'text' ? <FileText className="w-3 h-3 shrink-0 text-blue-400" /> : <FileCode className="w-3 h-3 shrink-0 text-red-400" />}
                                <span className="truncate max-w-[100px]">{entry.name}</span>
                                {entry.size && <span className="text-red-900">({(entry.size / 1024).toFixed(1)}k)</span>}
                                <button onClick={() => removeKnowledgeEntry(p.id, entry.id)} className="text-red-700 hover:text-red-400 ml-1 transition-colors"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-dashed border-red-900/30 hover:border-red-500/40 text-[10px] font-black uppercase tracking-widest text-red-900 hover:text-red-400 cursor-pointer transition-all">
                          <FilePlus className="w-3.5 h-3.5 shrink-0" /> Upload Files
                          <input type="file" multiple accept=".txt,.md,.py,.js,.ts,.tsx,.json,.csv,.yaml,.yml,.sh,.html,.css,.rs,.cpp,.c" className="hidden"
                            onChange={e => { if (e.target.files) { handleKBFileUpload(p.id, e.target.files); e.target.value = ''; } }} />
                        </label>
                        <div className="flex gap-2">
                          <input placeholder="github.com/user/repo/blob/main/file.py"
                            value={kbGithubUrl[p.id] ?? ''}
                            onChange={e => setKbGithubUrl(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="flex-1 bg-black/40 border border-red-900/30 rounded-xl px-3 py-2 text-[10px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all normal-case tracking-normal"
                          />
                          <button onClick={() => fetchGitHubKB(p.id, kbGithubUrl[p.id] ?? '')} className="px-3 py-2 bg-red-950/40 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-900/40 hover:text-red-200 transition-all flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5" /> Fetch
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input placeholder="Snippet label..." value={kbSnippetName[p.id] ?? ''} onChange={e => setKbSnippetName(prev => ({ ...prev, [p.id]: e.target.value }))} className="w-full bg-black/40 border border-red-900/30 rounded-xl px-3 py-2 text-[10px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all normal-case tracking-normal" />
                          <textarea placeholder="Paste text, docs, API specs..." value={kbSnippetText[p.id] ?? ''} onChange={e => setKbSnippetText(prev => ({ ...prev, [p.id]: e.target.value }))} className="w-full bg-black/40 border border-red-900/30 rounded-xl px-3 py-2 text-[10px] font-mono text-red-100/70 outline-none focus:border-red-600/40 transition-all h-20 resize-none normal-case tracking-normal" />
                          <button onClick={() => {
                            const text = kbSnippetText[p.id]?.trim();
                            if (!text) return;
                            addKnowledgeEntry(p.id, { id: kbUid(), type: 'text', name: kbSnippetName[p.id]?.trim() || 'Snippet', content: text, addedAt: new Date().toISOString() });
                            setKbSnippetText(prev => ({ ...prev, [p.id]: '' }));
                            setKbSnippetName(prev => ({ ...prev, [p.id]: '' }));
                          }} className="w-full py-2 bg-red-950/30 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-700 hover:text-red-300 hover:bg-red-900/30 transition-all">
                            Add Snippet
                          </button>
                        </div>
                      </div>
                    )}
                    {p.active && <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full pointer-events-none" />}
                  </div>
                );
              })}
            </div>
          </section>

          {/* AI Provider Settings */}
          <section className="space-y-6 md:space-y-10">
            <h3 className="text-[10px] md:text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><Network className="w-5 h-5 md:w-6 md:h-6 text-red-600" /> Neural Provider Configuration</h3>
            <div className="bg-[#0a0202] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-6 md:p-10 space-y-6 md:space-y-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                <h4 className="text-lg md:text-xl font-black text-red-100 tracking-tighter uppercase leading-none">Gemini API Key</h4>
                <p className="text-[10px] md:text-xs text-red-900 font-bold tracking-[0.1em]">Required for Google Gemini integration. Stored locally.</p>
                <input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} placeholder="AIza..."
                  className="w-full bg-black/60 border border-red-950 rounded-[16px] md:rounded-[20px] p-3 md:p-4 text-xs md:text-sm text-red-100 font-mono outline-none focus:border-red-600/50 transition-all shadow-inner"
                />
              </div>
              <div className="space-y-4 relative z-10 pt-6 border-t border-red-900/20">
                <h4 className="text-lg md:text-xl font-black text-red-100 tracking-tighter uppercase leading-none">Grok API Key</h4>
                <p className="text-[10px] md:text-xs text-red-900 font-bold tracking-[0.1em]">Required for xAI Grok integration. Stored locally.</p>
                <input type="password" value={grokApiKey} onChange={(e) => setGrokApiKey(e.target.value)} placeholder="xai-..."
                  className="w-full bg-black/60 border border-red-950 rounded-[16px] md:rounded-[20px] p-3 md:p-4 text-xs md:text-sm text-red-100 font-mono outline-none focus:border-red-600/50 transition-all shadow-inner"
                />
              </div>
            </div>
          </section>

          {/* Core Synthesis Injection */}
          <section className="space-y-6 md:space-y-10">
            <h3 className="text-[10px] md:text-[12px] font-black text-red-900 uppercase tracking-[0.5em] flex items-center gap-4"><Brain className="w-5 h-5 md:w-6 md:h-6 text-red-600" /> Core Synthesis Injection</h3>
            <div className="bg-[#0a0202] rounded-[30px] md:rounded-[50px] border border-red-900/30 p-6 md:p-14 space-y-8 md:space-y-14 shadow-[0_20px_60px_rgba(0,0,0,0.8)] md:shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 md:p-20 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-1000 pointer-events-none">
                <Network className="w-[200px] h-[200px] md:w-[500px] md:h-[500px] text-red-600" />
              </div>
              <div className="flex flex-col md:flex-row items-start justify-between relative z-10 gap-6">
                <div className="space-y-2 md:space-y-4">
                  <h4 className="text-xl md:text-3xl font-black text-red-100 tracking-tighter uppercase leading-none">Crimson Neural Fabric</h4>
                  <p className="text-[10px] md:text-base text-red-900 font-bold tracking-[0.1em]">Inject logic kernels or data trees to refine autonomous model control.</p>
                </div>
                <div className="flex flex-wrap md:flex-nowrap bg-red-950/20 p-2 rounded-2xl border border-red-900/20 gap-2 w-full md:w-auto">
                  {['python', 'kotlin', 'nodejs'].map(r => (
                    <button key={r} onClick={() => setBrainConfig({ ...brainConfig, runtime: r })} className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-xl text-[10px] md:text-[12px] font-black uppercase transition-all tracking-[0.2em] md:tracking-[0.3em] ${brainConfig.runtime === r ? 'bg-red-700 text-white shadow-[0_0_20px_rgba(185,28,28,0.5)]' : 'text-red-900 hover:text-red-600'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 relative z-10">
                <div className="lg:col-span-2 space-y-4 md:space-y-5">
                  <label className="text-[10px] md:text-[12px] font-black text-red-800 uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center gap-3 md:gap-4"><Code2 className="w-4 h-4 md:w-5 md:h-5" /> Logic Manifest</label>
                  <textarea value={brainConfig.logic} onChange={(e) => setBrainConfig({ ...brainConfig, logic: e.target.value })} placeholder="Initialize system with core logic strings..." className="w-full h-64 md:h-96 bg-black/80 border border-red-950 rounded-[20px] md:rounded-[40px] p-6 md:p-10 text-[12px] md:text-[14px] font-mono text-red-500 outline-none focus:border-red-600/50 resize-none custom-scrollbar shadow-[inset_0_4px_20px_rgba(0,0,0,0.9)]" />
                </div>
                <div className="space-y-4 md:space-y-5">
                  <label className="text-[10px] md:text-[12px] font-black text-red-800 uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center gap-3 md:gap-4"><FileSearch className="w-4 h-4 md:w-5 md:h-5" /> Data Anchors</label>
                  {!brainRefFile ? (
                    <label className="flex flex-col items-center justify-center h-64 md:h-96 border-4 border-dashed border-red-950 rounded-[20px] md:rounded-[40px] cursor-pointer hover:border-red-600/40 hover:bg-red-950/10 transition-all group/up">
                      <Plus className="w-10 h-10 md:w-16 md:h-16 text-red-950 group-hover/up:scale-110 group-hover/up:text-red-600 transition-all mb-4 md:mb-8" />
                      <span className="text-[12px] md:text-[15px] text-red-900 font-black uppercase text-center px-6 md:px-10 leading-tight tracking-[0.1em] md:tracking-[0.2em]">Deploy Neural Database<br /><span className="text-[9px] md:text-[11px] opacity-40 font-mono mt-2 md:mt-4 block tracking-[0.3em] md:tracking-[0.5em]">SYSTEM_INGESTION_PENDING</span></span>
                      <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setBrainRefFile({ name: f.name, data: await fileToBase64(f), mimeType: f.type });
                      }} />
                    </label>
                  ) : (
                    <div className="h-64 md:h-96 bg-red-900/5 border border-red-600/30 rounded-[20px] md:rounded-[40px] p-6 md:p-12 flex flex-col items-center justify-center text-center space-y-6 md:space-y-10 relative group/staged animate-in zoom-in-95 shadow-2xl backdrop-blur-md">
                      <div className="p-6 md:p-8 bg-red-600/10 rounded-[30px] md:rounded-[50px] shadow-[0_0_30px_rgba(220,38,38,0.2)]"><BookOpen className="w-12 h-12 md:w-20 md:h-20 text-red-500" /></div>
                      <div className="space-y-3 md:space-y-4">
                        <p className="text-sm md:text-lg font-black text-red-100 truncate max-w-[200px] md:max-w-[240px] uppercase tracking-tighter">{brainRefFile.name}</p>
                        <p className="text-[9px] md:text-[11px] text-red-500 font-mono tracking-[0.3em] md:tracking-[0.5em] uppercase font-black px-4 md:px-6 py-1.5 md:py-2 bg-red-600/10 rounded-full border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.3)]">SYNC_READY</p>
                      </div>
                      <button onClick={() => setBrainRefFile(null)} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3.5 bg-red-900/10 text-red-600 rounded-2xl md:rounded-3xl opacity-100 md:opacity-0 group-hover/staged:opacity-100 transition-all hover:bg-red-600 hover:text-white shadow-2xl"><Trash2 className="w-5 h-5 md:w-6 md:h-6" /></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-12 pt-8 md:pt-14 relative z-10 border-t border-red-900/20">
                <div className="flex-1 w-full space-y-4 md:space-y-6">
                  <h4 className="text-[10px] md:text-[12px] font-black text-red-800 uppercase tracking-[0.3em] md:tracking-[0.5em] flex items-center gap-3 md:gap-4"><Database className="w-4 h-4 md:w-5 md:h-5" /> Virtual Core Mounts</h4>
                  <div className="flex flex-wrap gap-2 md:gap-4">
                    {brainConfig.mappedPaths.map((p: string, i: number) => (
                      <div key={i} className="px-4 md:px-6 py-2 md:py-3 bg-red-950/20 border border-red-900/20 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-mono text-red-900 font-black hover:text-red-500 transition-colors cursor-crosshair">{p}</div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!brainConfig.logic.trim() && !brainRefFile) return;
                    setIsAiProcessing(true);
                    setTerminalOutput(prev => [...prev, `[KERNEL] Initializing crimson neural fabric...`]);
                    try {
                      const kbDocs = (activePersonality.knowledgeBase ?? []).map(e => `[KB: ${e.name}]\n${e.content}`).join('\n\n---\n\n');
                      const response = await generateAIResponse(
                        `Logic: ${brainConfig.logic}\n\nTask: Output a futuristic crimson directory tree for this logic and 3 setup commands.`,
                        `${activePersonality.instruction}${kbDocs ? `\n\nKNOWLEDGE BASE:\n${kbDocs}` : ''}`,
                        { modelType: 'smart' }
                      );
                      setTerminalOutput(prev => [...prev, `[CORE] Matrix Synchronized:`, response || 'Process Ready.', `[SYSTEM] Crimson Node Online.`]);
                      setActiveTab('terminal');
                    } catch { } finally { setIsAiProcessing(false); }
                  }}
                  disabled={isAiProcessing || (!brainConfig.logic && !brainRefFile)}
                  className="w-full md:w-auto py-4 md:py-8 px-8 md:px-16 bg-red-700 hover:bg-red-600 text-white rounded-[20px] md:rounded-[40px] font-black flex items-center justify-center gap-4 md:gap-6 shadow-[0_30px_70px_rgba(185,28,28,0.4)] active:scale-95 transition-all disabled:opacity-50 group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[size:200%_200%] animate-shimmer" />
                  <Power className={`w-10 h-10 transition-transform group-hover/btn:scale-110 drop-shadow-[0_0_10px_white] ${isAiProcessing ? 'animate-spin' : ''}`} />
                  <div className="text-left relative z-10">
                    <p className="text-xl font-black uppercase tracking-tighter">Execute Boot</p>
                    <p className="text-[11px] font-mono opacity-60 uppercase tracking-[0.4em] mt-2 font-black">NEURAL_CORE_OVERLOAD</p>
                  </div>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Custom Personality Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0d0404] border border-red-900/30 rounded-[30px] md:rounded-[40px] shadow-[0_0_100px_rgba(185,28,28,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-red-900/20 bg-black/40 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-black text-red-100 uppercase tracking-tighter">Define Custom Archetype</h3>
                <p className="text-[10px] md:text-xs text-red-900 font-bold tracking-widest uppercase">Inject new neural parameters into the core</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-3 bg-red-950/20 border border-red-900/20 rounded-full text-red-500 hover:bg-red-900/40 transition-all shrink-0 ml-4"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-widest">Archetype Designation (Name)</label>
                <input value={newPersonalityName} onChange={(e) => setNewPersonalityName(e.target.value)} placeholder="e.g., Code-Ninja" className="w-full bg-[#050101] border border-red-900/40 rounded-xl px-5 py-4 text-sm text-red-100 focus:border-red-600/60 outline-none transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-widest">Core Directive (System Instruction)</label>
                <textarea value={newPersonalityInstruction} onChange={(e) => setNewPersonalityInstruction(e.target.value)} placeholder="You are an expert in..." className="w-full bg-[#050101] border border-red-900/40 rounded-xl px-5 py-4 text-sm text-red-100 focus:border-red-600/60 outline-none transition-all h-32 resize-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-widest">Suggested Commands (Comma separated)</label>
                <input value={newPersonalitySuggestions} onChange={(e) => setNewPersonalitySuggestions(e.target.value)} placeholder="e.g., refactor, optimize, test" className="w-full bg-[#050101] border border-red-900/40 rounded-xl px-5 py-4 text-sm text-red-100 focus:border-red-600/60 outline-none transition-all" />
              </div>
              <div className="space-y-3 border-t border-red-900/20 pt-5">
                <label className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2"><Database className="w-3.5 h-3.5" /> Knowledge Base</label>
                {newPersonalityKB.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newPersonalityKB.map(entry => (
                      <div key={entry.id} className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/30 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-red-300">
                        {entry.type === 'github' ? <GitBranch className="w-3 h-3 text-purple-400" /> : entry.type === 'text' ? <FileText className="w-3 h-3 text-blue-400" /> : <FileCode className="w-3 h-3 text-red-400" />}
                        <span className="truncate max-w-[120px]">{entry.name}</span>
                        <button onClick={() => setNewPersonalityKB(prev => prev.filter(e => e.id !== entry.id))} className="text-red-700 hover:text-red-400 ml-1"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-red-900/30 hover:border-red-500/40 text-[10px] font-black uppercase tracking-widest text-red-900 hover:text-red-400 cursor-pointer transition-all">
                  <FilePlus className="w-3.5 h-3.5 shrink-0" /> Upload Files
                  <input type="file" multiple accept=".txt,.md,.py,.js,.ts,.tsx,.json,.csv,.yaml,.yml,.sh,.html,.css,.rs,.cpp,.c" className="hidden" onChange={e => { if (e.target.files) { handleModalKBFileUpload(e.target.files); e.target.value = ''; } }} />
                </label>
                <div className="flex gap-2">
                  <input placeholder="github.com/user/repo/blob/main/file.py" value={modalKbGithubUrl} onChange={e => setModalKbGithubUrl(e.target.value)} className="flex-1 bg-[#050101] border border-red-900/40 rounded-xl px-4 py-3 text-[10px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all normal-case tracking-normal" />
                  <button onClick={() => fetchModalGitHubKB(modalKbGithubUrl)} className="px-4 py-3 bg-red-950/40 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-900/40 transition-all flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> Fetch</button>
                </div>
                <div className="space-y-2">
                  <input placeholder="Snippet label..." value={modalKbSnippetName} onChange={e => setModalKbSnippetName(e.target.value)} className="w-full bg-[#050101] border border-red-900/40 rounded-xl px-4 py-3 text-[10px] font-mono text-red-100 outline-none focus:border-red-600/40 transition-all normal-case tracking-normal" />
                  <textarea placeholder="Paste docs, API specs, reference text..." value={modalKbSnippetText} onChange={e => setModalKbSnippetText(e.target.value)} className="w-full bg-[#050101] border border-red-900/40 rounded-xl px-4 py-3 text-[10px] font-mono text-red-100/70 outline-none focus:border-red-600/40 transition-all h-20 resize-none normal-case tracking-normal" />
                  <button onClick={() => {
                    if (!modalKbSnippetText.trim()) return;
                    setNewPersonalityKB(prev => [...prev, { id: kbUid(), type: 'text', name: modalKbSnippetName.trim() || 'Snippet', content: modalKbSnippetText.trim(), addedAt: new Date().toISOString() }]);
                    setModalKbSnippetText(''); setModalKbSnippetName('');
                  }} className="w-full py-2.5 bg-red-950/30 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-700 hover:text-red-300 hover:bg-red-900/30 transition-all">Add Snippet</button>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8 border-t border-red-900/20 bg-black/40 flex justify-end shrink-0">
              <button disabled={!newPersonalityName || !newPersonalityInstruction} onClick={handleCreatePersonality} className="px-8 py-4 bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-red-600 transition-all">
                Inject Archetype
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
