import React, { useState, useMemo } from 'react';
import {
  Activity, Brain, Check, ChevronDown, ChevronUp, Copy, Download, ExternalLink,
  FileCode, GitBranch, Network, Plus, RefreshCw, Save, ShieldCheck, Sparkles, Trash2, Users, Zap,
} from 'lucide-react';
import { extractAllCodeBlocks } from '../../../utils/helpers';
import { UseSwarmStateReturn } from '../../../hooks/useSwarmState';
import { getSwarmMode, SWARM_MODES } from '../../../services/swarm/swarmModes';
import { AssignedRepo, SwarmAgent, SwarmMode, SwarmReport } from '../../../services/swarm/types';
import { buildRepoSummary } from '../../../services/swarm/repoContext';
import { DEFAULT_MCP_BOOSTS } from '../../../services/swarm/swarmMcpBoost';

interface SwarmCoreProps {
  swarmState: UseSwarmStateReturn;
  swarm: {
    missionInput: string;
    setMissionInput: (v: string) => void;
    isRunning: boolean;
    triggerSwarmCycle: (missionOverride?: string) => Promise<void>;
  };
  onSaveReport: (text: string) => void;
  onApplyCode: (code: string, mode: 'refactor' | 'replace') => void;
}

function parseRepoInput(input: string): { owner: string; repo: string; branch?: string; url: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // owner/repo
  const shorthand = /^([a-zA-Z0-9_\-.]+)\/([a-zA-Z0-9_\-.]+)(?::([a-zA-Z0-9_\-.\/]+))?$/.exec(trimmed);
  if (shorthand) {
    return { owner: shorthand[1], repo: shorthand[2], branch: shorthand[3], url: trimmed };
  }

  // https://github.com/owner/repo
  const https = /^https:\/\/github\.com\/([a-zA-Z0-9_\-.]+)\/([a-zA-Z0-9_\-.]+?)(?:\.git)?(?:\/tree\/([a-zA-Z0-9_\-.\/]+))?$/.exec(trimmed);
  if (https) {
    return { owner: https[1], repo: https[2], branch: https[3], url: trimmed };
  }

  // git@github.com:owner/repo.git
  const ssh = /^git@github\.com:([a-zA-Z0-9_\-.]+)\/([a-zA-Z0-9_\-.]+?)(?:\.git)?$/.exec(trimmed);
  if (ssh) {
    return { owner: ssh[1], repo: ssh[2], url: trimmed };
  }

  return null;
}

async function fetchRepoFiles(owner: string, repo: string, branch?: string): Promise<{ files: any[]; truncated: boolean; repoName: string }> {
  const res = await fetch('/api/github/clone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl: `${owner}/${repo}`, branch }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch repo (${res.status})`);
  }
  const data = await res.json();
  return { files: data.files || [], truncated: !!data.truncated, repoName: data.repoName || repo };
}

export const SwarmCore: React.FC<SwarmCoreProps> = ({ swarmState, swarm, onSaveReport, onApplyCode }) => {
  const {
    swarmMode,
    setSwarmMode,
    enableCritique,
    setEnableCritique,
    enabledBoosts,
    setEnabledBoosts,
    swarmAgents,
    runtimeAgents,
    swarmRepos,
    setSwarmRepos,
    swarmLogs,
    swarmAnxiety,
    lastReport,
    updateAgent,
    toggleAgentActive,
    assignRepoToAgent,
    resetToDefaults,
  } = swarmState;

  const { missionInput, setMissionInput, isRunning, triggerSwarmCycle } = swarm;

  const [repoInput, setRepoInput] = useState('');
  const [repoError, setRepoError] = useState<string | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  const [showReport, setShowReport] = useState(true);
  const [sectionOpen, setSectionOpen] = useState({ repos: true, boosts: true, agents: true });

  const toggleSection = (key: keyof typeof sectionOpen) => {
    setSectionOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const mode = useMemo(() => getSwarmMode(swarmMode), [swarmMode]);
  const activeAgents = useMemo(() => swarmAgents.filter(a => a.active), [swarmAgents]);

  const handleAddRepo = async () => {
    setRepoError(null);
    const parsed = parseRepoInput(repoInput);
    if (!parsed) {
      setRepoError('Use format owner/repo, https://github.com/owner/repo, or git@github.com:owner/repo.git');
      return;
    }

    const id = `repo_${parsed.owner}_${parsed.repo}_${Date.now()}`;
    const newRepo: AssignedRepo = {
      id,
      owner: parsed.owner,
      repo: parsed.repo,
      branch: parsed.branch,
      url: parsed.url,
      lastFetched: Date.now(),
    };

    try {
      const data = await fetchRepoFiles(parsed.owner, parsed.repo, parsed.branch);
      setSwarmRepos(prev => [...prev, { ...newRepo, files: data.files, truncated: data.truncated }]);
      setRepoInput('');
    } catch (err: any) {
      setRepoError(err.message);
    }
  };

  const handleRemoveRepo = (id: string) => {
    setSwarmRepos(prev => prev.filter(r => r.id !== id));
    // Unassign from all agents
    swarmAgents.forEach(a => {
      if (a.assignedRepos.includes(id)) assignRepoToAgent(a.id, id, false);
    });
  };

  const toggleExpandAgent = (id: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reportText = useMemo(() => {
    if (!lastReport) return '';
    return `# Swarm Report — ${mode.label} Mode
**Mission:** ${lastReport.mission}

## Summary
${lastReport.summary}

## Agreements
${lastReport.agreements.map(a => `- ${a}`).join('\n') || '_None noted_'}

## Conflicts
${lastReport.conflicts.map(c => `- ${c}`).join('\n') || '_None noted_'}

## Recommendations
${lastReport.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n') || '_None_'}

## Best Course of Action
${lastReport.bestCourseOfAction}

## Risk Notes
${lastReport.riskNotes.map(r => `- ${r}`).join('\n') || '_None_'}

---
*Synthesized at ${new Date(lastReport.synthesizedAt).toLocaleString()}*`;
  }, [lastReport, mode.label]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-6 md:p-8 border-b border-accent-900/20 bg-black/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-accent-100 uppercase tracking-tighter flex items-center gap-5">
              <Network className="w-8 h-8 text-accent-600" /> Neural Swarm Core
            </h3>
            <p className="text-sm text-accent-900 font-bold tracking-widest uppercase">7-agent collaborative intelligence engine</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-accent-900 uppercase tracking-widest mb-1">Swarm Anxiety</p>
              <p className={`text-lg font-mono font-black ${(swarmAnxiety * 100) > 50 ? 'text-accent-500' : 'text-accent-700'}`}>
                {(swarmAnxiety * 100).toFixed(1)}%
              </p>
            </div>
            <button
              onClick={() => triggerSwarmCycle()}
              disabled={isRunning || !missionInput.trim() || activeAgents.length === 0}
              className="px-8 py-4 bg-accent-700 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all flex items-center gap-3"
            >
              <Zap className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
              {isRunning ? 'Running Swarm...' : 'Trigger Cycle'}
            </button>
          </div>
        </div>

        {/* Mode selector + options */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Desktop: buttons */}
          <div className="hidden sm:flex flex-wrap gap-3">
            {SWARM_MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setSwarmMode(m.id)}
                disabled={isRunning}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  swarmMode === m.id
                    ? 'bg-accent-700 text-white shadow-lg'
                    : 'bg-accent-950/20 text-accent-900 hover:text-accent-500 border border-accent-900/20'
                }`}
              >
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>

          {/* Mobile: native select dropdown */}
          <div className="flex sm:hidden items-center gap-2">
            <label className="text-[10px] font-black text-accent-900 uppercase tracking-widest whitespace-nowrap">Mode</label>
            <select
              value={swarmMode}
              onChange={e => setSwarmMode(e.target.value as SwarmMode)}
              disabled={isRunning}
              className="flex-1 bg-accent-950/20 border border-accent-900/20 rounded-xl px-4 py-2.5 text-[12px] font-bold text-accent-100 focus:outline-none focus:border-accent-700"
            >
              {SWARM_MODES.map(m => (
                <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 sm:ml-auto">
            <label className="flex items-center gap-2 px-4 py-2 bg-accent-950/20 border border-accent-900/20 rounded-2xl text-[11px] font-black text-accent-100 uppercase tracking-widest cursor-pointer">
              <input
                type="checkbox"
                checked={enableCritique}
                onChange={e => setEnableCritique(e.target.checked)}
                className="accent-accent-700"
              />
              Critique + Refine
            </label>
            {lastReport && (
              <button
                onClick={() => document.getElementById('swarm-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="px-4 py-2 bg-accent-700 hover:bg-accent-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all"
              >
                View Report
              </button>
            )}
          </div>
        </div>

        {/* Mission input */}
        <div className="mt-4 space-y-2">
          <label className="text-[10px] font-black text-accent-900 uppercase tracking-widest">Mission Directive</label>
          <textarea
            value={missionInput}
            onChange={e => setMissionInput(e.target.value)}
            placeholder={mode.defaultPrompt}
            className="w-full h-24 bg-accent-950/20 border border-accent-900/20 rounded-2xl p-4 text-[13px] text-accent-100 placeholder:text-accent-900/50 focus:outline-none focus:border-accent-700 resize-none"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8 min-h-0 overflow-hidden p-4 md:p-8">
        {/* Left: Agent roster + repos */}
        <div className="flex-1 lg:flex-[1.2] min-h-0 overflow-y-auto custom-scrollbar space-y-6">
          {/* Repos */}
          <div className="bg-accent-950/5 border border-accent-900/20 rounded-[20px] md:rounded-[30px] p-5 md:p-6 space-y-4">
            <button
              onClick={() => toggleSection('repos')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                <GitBranch className="w-4 h-4" /> Assigned Repositories
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-accent-900">{swarmRepos.length}</span>
                {sectionOpen.repos ? <ChevronUp className="w-4 h-4 text-accent-900" /> : <ChevronDown className="w-4 h-4 text-accent-900" />}
              </div>
            </button>
            {sectionOpen.repos && <div className="space-y-4">
            <div className="flex gap-2">
              <input
                value={repoInput}
                onChange={e => setRepoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddRepo()}
                placeholder="owner/repo or GitHub URL"
                className="flex-1 bg-black/40 border border-accent-900/20 rounded-xl px-4 py-2.5 text-[12px] text-accent-100 placeholder:text-accent-900/50 focus:outline-none focus:border-accent-700"
              />
              <button
                onClick={handleAddRepo}
                disabled={isRunning}
                className="px-4 py-2.5 bg-accent-700 hover:bg-accent-600 disabled:opacity-50 text-white rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {repoError && <p className="text-[11px] text-accent-500 font-bold">{repoError}</p>}
            {swarmRepos.length === 0 ? (
              <p className="text-[11px] text-accent-900 italic">No repositories assigned. Add repos to give agents codebase context.</p>
            ) : (
              <div className="space-y-2">
                {swarmRepos.map(repo => (
                  <div key={repo.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-accent-900/10">
                    <div>
                      <p className="text-[12px] font-bold text-accent-100">
                        {repo.owner}/{repo.repo}
                        {repo.branch && <span className="text-accent-900 ml-2">({repo.branch})</span>}
                      </p>
                      <p className="text-[10px] text-accent-900">
                        {repo.files?.length || 0} files {repo.truncated ? '(truncated)' : ''}
                      </p>
                    </div>
                    <button onClick={() => handleRemoveRepo(repo.id)} className="p-2 text-accent-900 hover:text-accent-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            </div>}
          </div>

          {/* MCP Boosts */}
          <div className="bg-accent-950/5 border border-accent-900/20 rounded-[20px] md:rounded-[30px] p-5 md:p-6 space-y-4">
            <button
              onClick={() => toggleSection('boosts')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                <Zap className="w-4 h-4" /> MCP Boosts
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-accent-900">{enabledBoosts.length}</span>
                {sectionOpen.boosts ? <ChevronUp className="w-4 h-4 text-accent-900" /> : <ChevronDown className="w-4 h-4 text-accent-900" />}
              </div>
            </button>
            {sectionOpen.boosts && <div className="space-y-4">
            <div className="space-y-2">
              {DEFAULT_MCP_BOOSTS.map(boost => {
                const enabled = enabledBoosts.includes(boost.id);
                return (
                  <label
                    key={boost.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      enabled ? 'bg-black/30 border-accent-700/40' : 'bg-accent-950/5 border-accent-900/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={e => {
                        if (e.target.checked) setEnabledBoosts([...enabledBoosts, boost.id]);
                        else setEnabledBoosts(enabledBoosts.filter(id => id !== boost.id));
                      }}
                      className="accent-accent-700 mt-0.5"
                    />
                    <div>
                      <p className="text-[12px] font-bold text-accent-100 flex items-center gap-2">
                        <span>{boost.emoji}</span> {boost.label}
                      </p>
                      <p className="text-[10px] text-accent-900 leading-relaxed">{boost.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {lastReport && lastReport.boostResults && lastReport.boostResults.length > 0 && (
              <div className="pt-2 border-t border-accent-900/10">
                <p className="text-[10px] font-black text-accent-900 uppercase tracking-widest mb-2">Last Run Boosts</p>
                <div className="space-y-1">
                  {lastReport.boostResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-accent-100">{r.toolName}</span>
                      <span className={r.status === 'success' ? 'text-green-500' : 'text-accent-500'}>
                        {r.status === 'success' ? 'OK' : 'ERR'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>}
          </div>

          {/* Agents */}
          <div className="bg-accent-950/5 border border-accent-900/20 rounded-[20px] md:rounded-[30px] p-5 md:p-6 space-y-4">
            <button
              onClick={() => toggleSection('agents')}
              className="w-full flex items-center justify-between"
            >
              <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                <Users className="w-4 h-4" /> Agent Roster
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-accent-900">{activeAgents.length}/{swarmAgents.length}</span>
                {sectionOpen.agents ? <ChevronUp className="w-4 h-4 text-accent-900" /> : <ChevronDown className="w-4 h-4 text-accent-900" />}
              </div>
            </button>
            {sectionOpen.agents && <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={resetToDefaults} className="text-[10px] font-black text-accent-900 hover:text-accent-500 uppercase tracking-widest">
                Reset Defaults
              </button>
            </div>
            <div className="space-y-3">
              {swarmAgents.map(agent => {
                const isExpanded = expandedAgents.has(agent.id);
                const assignedRepoNames = agent.assignedRepos
                  .map(rid => swarmRepos.find(r => r.id === rid))
                  .filter(Boolean)
                  .map(r => `${r!.owner}/${r!.repo}`);
                return (
                  <div key={agent.id} className={`border rounded-2xl overflow-hidden transition-all ${agent.active ? 'border-accent-900/20 bg-black/20' : 'border-accent-900/10 bg-accent-950/5 opacity-60'}`}>
                    <div className="flex items-center gap-3 p-3">
                      <button
                        onClick={() => toggleAgentActive(agent.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${agent.active ? 'bg-accent-700 border-accent-700 text-white' : 'border-accent-900/40'}`}
                      >
                        {agent.active && <Check className="w-3 h-3" />}
                      </button>
                      <span className="text-lg">{agent.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black text-accent-100 truncate">{agent.name}</p>
                        <p className="text-[10px] text-accent-900 truncate">{agent.expertise} • {assignedRepoNames.length} repos</p>
                      </div>
                      <button onClick={() => toggleExpandAgent(agent.id)} className="p-1.5 text-accent-900 hover:text-accent-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-accent-900/10">
                        <div>
                          <label className="text-[9px] font-black text-accent-900 uppercase tracking-widest">Mode Role</label>
                          <input
                            value={agent.roleInMode[swarmMode]}
                            onChange={e => updateAgent(agent.id, { roleInMode: { ...agent.roleInMode, [swarmMode]: e.target.value } })}
                            className="w-full mt-1 bg-black/40 border border-accent-900/20 rounded-lg px-3 py-2 text-[11px] text-accent-100 focus:outline-none focus:border-accent-700"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-accent-900 uppercase tracking-widest">Assigned Repos</label>
                          <div className="mt-1 grid grid-cols-1 gap-1">
                            {swarmRepos.map(repo => (
                              <label key={repo.id} className="flex items-center gap-2 text-[11px] text-accent-100 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={agent.assignedRepos.includes(repo.id)}
                                  onChange={e => assignRepoToAgent(agent.id, repo.id, e.target.checked)}
                                  className="accent-accent-700"
                                />
                                {repo.owner}/{repo.repo}
                              </label>
                            ))}
                            {swarmRepos.length === 0 && <span className="text-accent-900 italic">Add repos above to assign them.</span>}
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-accent-900 uppercase tracking-widest">Skills</label>
                          <p className="text-[11px] text-accent-100 mt-1">{agent.skills.join(', ')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>}
          </div>
        </div>

        {/* Right: Viz + logs + report */}
        <div className="flex-1 min-h-0 flex flex-col gap-6">
          {/* Visualization */}
          <div className="bg-accent-950/5 border border-accent-900/20 rounded-[20px] md:rounded-[40px] p-6 md:p-8 relative overflow-hidden h-[300px] md:h-[400px] flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-accent-800)/0.1_0%,transparent_70%)]" />
            <div className="relative w-full h-full">
              {activeAgents.map((agent, i) => {
                const runtime = runtimeAgents.find(r => r.id === agent.id);
                const isActive = runtime ? runtime.status !== 'idle' : false;
                const isDone = runtime ? runtime.status === 'done' : false;
                const angle = (i / activeAgents.length) * Math.PI * 2;
                const radius = activeAgents.length <= 4 ? 100 : 130;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <div
                    key={agent.id}
                    style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${isActive ? 1.15 : 1})` }}
                    className="absolute left-1/2 top-1/2 flex flex-col items-center gap-2 transition-all duration-500"
                  >
                    <div
                      className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        isDone
                          ? 'bg-green-600 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)]'
                          : isActive
                          ? 'bg-accent-600 border-accent-400 shadow-[0_0_30px_var(--color-accent-600)/0.6]'
                          : 'bg-accent-950/40 border-accent-900/40'
                      }`}
                    >
                      <span className="text-lg">{agent.emoji}</span>
                    </div>
                    <div className="text-center max-w-[80px]">
                      <p className="text-[9px] font-black text-accent-100 uppercase tracking-tighter leading-tight">{agent.name}</p>
                      <p className="text-[7px] font-black text-accent-900 uppercase tracking-widest mt-0.5">
                        {runtime ? runtime.status : 'idle'}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-accent-900/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <Brain className="w-12 h-12 text-accent-600 drop-shadow-[0_0_15px_var(--color-accent-600)/0.5]" />
              </div>
            </div>
          </div>

          {/* Report */}
          {lastReport && (
            <div id="swarm-report" className="bg-[#0a0202] border border-accent-900/30 rounded-[20px] md:rounded-[30px] flex flex-col shadow-2xl overflow-hidden shrink-0">
              <div className="p-4 md:p-6 border-b border-accent-900/20 bg-black/40 flex items-center justify-between">
                <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" /> Best Course of Action
                </h4>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigator.clipboard.writeText(reportText)} className="p-2 text-accent-900 hover:text-accent-500" title="Copy">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => onSaveReport(reportText)} className="p-2 text-accent-900 hover:text-accent-500" title="Save Report">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowReport(s => !s)} className="p-2 text-accent-900 hover:text-accent-500">
                    {showReport ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {showReport && (
                <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar text-[12px] leading-relaxed space-y-4 max-h-[360px]">
                  <p className="text-accent-100 font-bold text-[14px]">{lastReport.bestCourseOfAction}</p>
                  <div>
                    <p className="text-[10px] font-black text-accent-900 uppercase tracking-widest mb-1">Summary</p>
                    <p className="text-accent-100/80">{lastReport.summary}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Agreements</p>
                      <ul className="space-y-1">
                        {lastReport.agreements.length ? lastReport.agreements.map((a, i) => <li key={i} className="text-accent-100/70">• {a}</li>) : <li className="text-accent-900 italic">None</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-accent-500 uppercase tracking-widest mb-1">Conflicts</p>
                      <ul className="space-y-1">
                        {lastReport.conflicts.length ? lastReport.conflicts.map((c, i) => <li key={i} className="text-accent-100/70">• {c}</li>) : <li className="text-accent-900 italic">None</li>}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-accent-900 uppercase tracking-widest mb-1">Recommendations</p>
                    <ol className="list-decimal list-inside space-y-1 text-accent-100/80">
                      {lastReport.recommendations.length ? lastReport.recommendations.map((r, i) => <li key={i}>{r}</li>) : <li className="text-accent-900 italic">None</li>}
                    </ol>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-accent-500 uppercase tracking-widest mb-1">Risk Notes</p>
                    <ul className="space-y-1">
                      {lastReport.riskNotes.length ? lastReport.riskNotes.map((r, i) => <li key={i} className="text-accent-100/70">• {r}</li>) : <li className="text-accent-900 italic">None</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agent Response Cards */}
          {lastReport && lastReport.agentResults.length > 0 && (
            <div className="bg-[#0a0202] border border-accent-900/30 rounded-[20px] md:rounded-[30px] flex flex-col shadow-2xl overflow-hidden shrink-0">
              <div className="p-4 md:p-6 border-b border-accent-900/20 bg-black/40 flex items-center justify-between">
                <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                  <Users className="w-4 h-4" /> Agent Reasoning
                </h4>
                <span className="text-[10px] font-mono text-accent-900">{lastReport.agentResults.filter(r => r.status === 'fulfilled').length} responses</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar max-h-[500px]">
                {lastReport.agentResults.map(result => {
                  const agent = swarmAgents.find(a => a.id === result.agentId);
                  const isExpanded = expandedResponses.has(result.agentId);
                  if (!agent || result.status === 'rejected') {
                    return (
                      <div key={result.agentId} className="p-4 bg-accent-950/10 border border-accent-900/20 rounded-2xl">
                        <p className="text-[11px] font-bold text-accent-500">{agent?.name || result.agentId} failed</p>
                        <p className="text-[11px] text-accent-900">{result.error}</p>
                      </div>
                    );
                  }
                  const codeBlocks = result.response ? extractAllCodeBlocks(result.response) : [];
                  return (
                    <div key={result.agentId} className="bg-accent-950/5 border border-accent-900/20 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => {
                          setExpandedResponses(prev => {
                            const next = new Set(prev);
                            if (next.has(result.agentId)) next.delete(result.agentId);
                            else next.add(result.agentId);
                            return next;
                          });
                        }}
                        className="w-full p-4 flex items-center justify-between hover:bg-accent-950/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{agent.emoji}</span>
                          <div className="text-left">
                            <p className="text-[12px] font-black text-accent-100">{agent.name}</p>
                            <p className="text-[10px] text-accent-900">
                              Confidence: {result.confidence !== undefined ? `${(result.confidence * 100).toFixed(0)}%` : 'unknown'}
                              {' • '}
                              {codeBlocks.length} code block{codeBlocks.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-accent-900" /> : <ChevronDown className="w-4 h-4 text-accent-900" />}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-accent-900/10">
                          <div className="mt-3 space-y-3">
                            <div>
                              <p className="text-[10px] font-black text-accent-900 uppercase tracking-widest mb-1">Key Claims</p>
                              <ul className="space-y-1">
                                {result.keyClaims?.length ? result.keyClaims.map((c, i) => <li key={i} className="text-[12px] text-accent-100/80">• {c}</li>) : <li className="text-[12px] text-accent-900 italic">No claims extracted</li>}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-accent-900 uppercase tracking-widest mb-1">Full Response</p>
                              <div className="text-[12px] text-accent-100/80 whitespace-pre-wrap leading-relaxed">{result.response}</div>
                            </div>
                            {codeBlocks.length > 0 && (
                              <div>
                                <p className="text-[10px] font-black text-accent-900 uppercase tracking-widest mb-2">Proposed Code</p>
                                <div className="space-y-2">
                                  {codeBlocks.map((block, bi) => (
                                    <div key={bi} className="rounded-lg overflow-hidden border border-accent-900/20">
                                      <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-accent-900/20">
                                        <span className="text-[9px] font-mono text-accent-700 uppercase tracking-widest">{block.lang}</span>
                                        <div className="flex gap-1.5">
                                          <button onClick={() => navigator.clipboard.writeText(block.code)} className="p-1 text-accent-900 hover:text-accent-500" title="Copy">
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={() => onApplyCode(block.code, 'refactor')} className="p-1 text-accent-900 hover:text-accent-500" title="Apply Refactor">
                                            <Sparkles className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={() => onApplyCode(block.code, 'replace')} className="p-1 text-accent-900 hover:text-accent-500" title="Apply to File">
                                            <FileCode className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                      <pre className="px-3 py-2 text-[10px] font-mono text-accent-200/70 overflow-x-auto max-h-40 bg-black/20 whitespace-pre">{block.code}</pre>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="bg-[#0a0202] border border-accent-900/30 rounded-[20px] md:rounded-[30px] flex flex-col shadow-2xl overflow-hidden flex-1 min-h-[200px]">
            <div className="p-4 md:p-6 border-b border-accent-900/20 bg-black/40 flex items-center justify-between">
              <h4 className="text-[11px] font-black text-accent-500 uppercase tracking-[0.4em] flex items-center gap-3">
                <Activity className="w-4 h-4" /> Consensus Stream
              </h4>
              <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar font-mono text-[11px]">
              {swarmLogs.map(log => (
                <div
                  key={log.id}
                  className={`p-4 rounded-2xl border ${
                    log.type === 'consensus'
                      ? 'bg-green-500/5 border-green-500/20 text-green-500'
                      : log.type === 'pain'
                      ? 'bg-accent-500/5 border-accent-500/20 text-accent-500'
                      : 'bg-accent-950/10 border-accent-900/10 text-accent-900'
                  }`}
                >
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
    </div>
  );
};
