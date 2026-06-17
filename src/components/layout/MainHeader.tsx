import React from 'react';
import { FolderOpen, Gauge, UserCircle } from 'lucide-react';
import { AgentDefinition, AGENT_DOMAINS, getAgentsByDomain } from '../../data/agentRegistry';
import { WorkerConfig } from '../../hooks/useAiWorkers';
import { Personality } from '../../data/personalities';

interface MainHeaderProps {
  activeTab: string;
  setIsMobileFileTreeOpen: (open: boolean) => void;
  setWorkerSheetOpen: (open: boolean) => void;
  ollamaStatus: string;
  workers: WorkerConfig[];
  setWorkers: React.Dispatch<React.SetStateAction<WorkerConfig[]>>;
  availableModels: string[];
  refreshOllamaModels: () => void;
  personalities: Personality[];
  setPersonalities: React.Dispatch<React.SetStateAction<Personality[]>>;
  activePersonality: Personality;
  termuxStatus: string;
  localCoreStatus: 'idle' | 'booting' | 'online' | 'error';
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  activeTab,
  setIsMobileFileTreeOpen,
  setWorkerSheetOpen,
  ollamaStatus,
  workers,
  setWorkers,
  availableModels,
  refreshOllamaModels,
  personalities,
  setPersonalities,
  activePersonality,
  termuxStatus,
  localCoreStatus,
}) => {
  return (
    <header className="h-14 md:h-16 border-b border-accent-900/30 flex items-center justify-between px-4 md:px-8 bg-[#0a0202] z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar">
      <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
        <button
          onClick={() => setIsMobileFileTreeOpen(true)}
          className="lg:hidden p-2 text-accent-500 hover:bg-accent-900/20 rounded-xl transition-all"
          aria-label="Open project files"
        >
          <FolderOpen className="w-5 h-5" />
        </button>
        <h1 className="text-[10px] md:text-sm font-black tracking-[0.2em] md:tracking-[0.4em] text-accent-500 uppercase drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] truncate max-w-[80px] md:max-w-none">
          {activeTab} node
        </h1>

        {/* MOBILE: Ollama model button → tap to open sheet */}
        <button
          onClick={() => setWorkerSheetOpen(true)}
          className={`md:hidden flex items-center gap-1.5 border rounded-full px-3 py-1.5 transition-all ${ollamaStatus === 'connected' ? 'bg-green-950/40 border-green-800/40' : ollamaStatus === 'connecting' ? 'bg-yellow-950/40 border-yellow-800/40' : 'bg-accent-950/40 border-accent-800/40'}`}
          title="Configure Ollama models"
          aria-label="Configure Ollama models"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${ollamaStatus === 'connected' ? 'bg-green-500' : ollamaStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-accent-700'}`}
          />
          <span className="text-[10px] font-black text-accent-200 uppercase tracking-wider">
            Ollama
          </span>
          <span className="text-[9px] text-accent-400">▾</span>
        </button>

        {/* DESKTOP: full inline worker slots */}
        <div className="hidden md:flex items-center gap-2">
          {workers.map((w) => (
            <div
              key={w.id}
              className={`flex items-center gap-1 border rounded-full px-2 py-0.5 transition-all ${w.enabled ? 'bg-accent-950/40 border-accent-800/40' : 'bg-accent-950/10 border-accent-900/20 opacity-50'}`}
            >
              <button
                onClick={() =>
                  setWorkers((prev) =>
                    prev.map((x) => (x.id === w.id ? { ...x, enabled: !x.enabled } : x)),
                  )
                }
                className={`text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${w.enabled ? 'bg-accent-600 text-white shadow-[0_0_6px_rgba(220,38,38,0.6)]' : 'bg-accent-900/40 text-accent-700'}`}
                title={w.enabled ? `Disable W${w.id}` : `Enable W${w.id}`}
                aria-label={w.enabled ? `Disable W${w.id}` : `Enable W${w.id}`}
              >
                {w.id}
              </button>
              <select
                value={w.provider}
                onChange={(e) =>
                  setWorkers((prev) =>
                    prev.map((x) =>
                      x.id === w.id
                        ? {
                            ...x,
                            provider: e.target.value as any,
                            model:
                              e.target.value === 'google'
                                ? 'gemini-2.5-flash'
                                : e.target.value === 'grok'
                                  ? 'grok-beta'
                                  : e.target.value === 'openrouter'
                                    ? 'meta-llama/llama-3.3-70b-instruct:free'
                                    : x.model || 'llama3.2:latest',
                          }
                        : x,
                    ),
                  )
                }
                className={`bg-transparent text-[9px] font-black outline-none cursor-pointer w-14 truncate transition-colors ${w.enabled ? 'text-accent-300' : 'text-accent-900 pointer-events-none'}`}
                title="Provider"
                aria-label={`Provider for W${w.id}`}
              >
                <option value="ollama" className="bg-[#0a0202] text-accent-200">
                  Ollama
                </option>
                <option value="google" className="bg-[#0a0202] text-accent-200">
                  Google
                </option>
                <option value="grok" className="bg-[#0a0202] text-accent-200">
                  Grok
                </option>
                <option value="openrouter" className="bg-[#0a0202] text-accent-200">
                  OpenRouter
                </option>
              </select>
              <select
                value={w.model}
                onChange={(e) =>
                  setWorkers((prev) =>
                    prev.map((x) => (x.id === w.id ? { ...x, model: e.target.value } : x)),
                  )
                }
                className={`bg-transparent text-[10px] font-black outline-none cursor-pointer w-24 truncate transition-colors ${w.enabled ? 'text-accent-300' : 'text-accent-900 pointer-events-none'}`}
                aria-label={`Model for W${w.id}`}
              >
                {w.provider === 'ollama' && availableModels.length > 0 ? (
                  availableModels.map((m) => (
                    <option key={m} value={m} className="bg-[#0a0202] text-accent-200">
                      {m}
                    </option>
                  ))
                ) : w.provider === 'google' ? (
                  ['gemini-2.5-flash', 'gemini-2.5-pro'].map((m) => (
                    <option key={m} value={m} className="bg-[#0a0202] text-accent-200">
                      {m}
                    </option>
                  ))
                ) : w.provider === 'grok' ? (
                  ['grok-beta', 'grok-2-latest'].map((m) => (
                    <option key={m} value={m} className="bg-[#0a0202] text-accent-200">
                      {m}
                    </option>
                  ))
                ) : w.provider === 'openrouter' ? (
                  [
                    'meta-llama/llama-3.3-70b-instruct:free',
                    'deepseek/deepseek-chat',
                    'google/gemini-2.5-flash',
                    'meta-llama/llama-3-8b-instruct:free',
                  ].map((m) => (
                    <option key={m} value={m} className="bg-[#0a0202] text-accent-200">
                      {m}
                    </option>
                  ))
                ) : (
                  <option value={w.model} className="bg-[#0a0202]">
                    {w.model || 'llama3'}
                  </option>
                )}
              </select>
              <select
                value={w.agentId || ''}
                onChange={(e) =>
                  setWorkers((prev) =>
                    prev.map((x) =>
                      x.id === w.id ? { ...x, agentId: e.target.value || undefined } : x,
                    ),
                  )
                }
                className={`bg-transparent text-[9px] font-black outline-none cursor-pointer max-w-[80px] truncate transition-colors ${w.enabled ? 'text-accent-400' : 'text-accent-900 pointer-events-none'}`}
                title="Agent role"
                aria-label={`Agent role for W${w.id}`}
              >
                <option value="" className="bg-[#0a0202] text-accent-200">
                  🤖 General
                </option>
                {AGENT_DOMAINS.map((domain) => (
                  <optgroup key={domain} label={domain} className="bg-[#0a0202]">
                    {getAgentsByDomain(domain).map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#0a0202] text-accent-200">
                        {a.emoji} {a.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ))}
          <button
            onClick={() => refreshOllamaModels()}
            className={`text-[11px] transition-colors shrink-0 ${ollamaStatus === 'connected' ? 'text-green-500 hover:text-green-400' : ollamaStatus === 'connecting' ? 'text-yellow-500 animate-pulse' : 'text-accent-700 hover:text-accent-400'}`}
            title={`Ollama: ${ollamaStatus}`}
            aria-label="Refresh Ollama models"
          >
            ↻
          </button>
        </div>

        {/* Personality Selector */}
        <div className="hidden md:flex items-center gap-2 bg-accent-950/40 border border-accent-800/40 rounded-full px-3 py-1">
          <UserCircle className="w-4 h-4 text-accent-500" />
          <select
            value={personalities.find((p) => p.active)?.id || ''}
            onChange={(e) => {
              const id = parseInt(e.target.value);
              setPersonalities((prev) => prev.map((pers) => ({ ...pers, active: pers.id === id })));
            }}
            className="bg-transparent text-[10px] font-black text-accent-400 outline-none cursor-pointer uppercase tracking-widest max-w-[120px] truncate"
            aria-label="Select active personality"
          >
            {personalities.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0a0202]">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="px-2 md:px-4 py-1 bg-accent-950/40 border border-accent-800/40 rounded-full text-[8px] md:text-[10px] text-accent-400 font-black flex items-center gap-1.5 md:gap-3">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-accent-500 animate-pulse glow-accent" />
          <span className="truncate max-w-[60px] md:max-w-none">
            {activePersonality.name.toUpperCase()} ACTIVE
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-4 md:space-x-8 shrink-0">
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-accent-400/60 bg-accent-950/20 px-4 py-2 rounded-xl border border-accent-900/20">
          <Gauge className="w-4 h-4 text-accent-600" />
          <span className="font-black tracking-widest">88%</span>
        </div>
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <div className="flex flex-col items-end">
            <span className="hidden xs:block text-[7px] font-black text-accent-900 uppercase tracking-widest leading-none mb-1">
              Local Core
            </span>
            <div
              title={`Local Core (WebContainer): ${localCoreStatus}`}
              className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full transition-all duration-500 ${
                localCoreStatus === 'online'
                  ? 'bg-cyan-500 glow-cyan shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                  : localCoreStatus === 'booting'
                    ? 'bg-yellow-500 animate-pulse'
                    : localCoreStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-accent-950/40 border border-accent-900/30'
              }`}
              aria-label={`Local Core status: ${localCoreStatus}`}
            />
          </div>
          <div className="flex flex-col items-end">
            <span className="hidden xs:block text-[7px] font-black text-accent-900 uppercase tracking-widest leading-none mb-1">
              Node Bridge
            </span>
            <div
              title={termuxStatus === 'connected' ? 'Node Bridge Online' : 'Node Bridge Offline'}
              className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full transition-all duration-500 ${termuxStatus === 'connected' ? 'bg-accent-500 glow-accent' : 'bg-accent-950/40 border border-accent-900/30'}`}
              aria-label={
                termuxStatus === 'connected' ? 'Node Bridge Online' : 'Node Bridge Offline'
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
};
