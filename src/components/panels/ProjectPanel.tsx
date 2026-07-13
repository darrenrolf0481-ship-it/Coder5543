import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, RefreshCw, Trash2, Check, GitBranch, Loader2 } from 'lucide-react';
import { resolveApiUrl } from '../../utils/apiUrl';

interface Project {
  id: string;
  name: string;
  path?: string;
  createdAt: number;
  lastAccessed: number;
  isDefault?: boolean;
  isServerProject?: boolean;
}

interface ProjectPanelProps {
  currentProject: Project | null;
  savedProjects: Project[];
  onProjectSwitch: (project: Project) => void;
  onProjectCreate: (name: string) => void;
  onProjectDelete: (projectId: string) => void;
  onLoadServerProject: (projectName: string) => void;
  onGitHubClone?: (files: any[], mainFileId: string | null) => void;
}

export function ProjectPanel({
  currentProject,
  savedProjects,
  onProjectSwitch,
  onProjectCreate,
  onProjectDelete,
  onLoadServerProject,
  onGitHubClone,
}: ProjectPanelProps) {
  const [serverProjects, setServerProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<'saved' | 'server' | 'github'>('saved');
  const [repoUrl, setRepoUrl] = useState('');
  const [cloning, setCloning] = useState(false);
  const [cloneMsg, setCloneMsg] = useState('');

  useEffect(() => {
    fetchServerProjects();
  }, []);

  const fetchServerProjects = async () => {
    try {
      const res = await fetch(resolveApiUrl('github/projects'));
      if (res.ok) {
        const data = await res.json();
        setServerProjects(data.projects || []);
      }
    } catch {}
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    onProjectCreate(newProjectName.trim());
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleClone = async () => {
    if (!repoUrl.trim()) return;
    setCloning(true);
    setCloneMsg('Cloning…');
    try {
      const res = await fetch(resolveApiUrl('github/clone'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setCloneMsg(`Error: ${data.error}`); return; }
      setCloneMsg(`✓ Cloned ${data.repoName}${data.mainFileId ? ' — opening main file' : ''}`);
      setRepoUrl('');
      fetchServerProjects();
      if (onGitHubClone) onGitHubClone(data.files || [], data.mainFileId || null);
    } catch (err: any) {
      setCloneMsg(`Error: ${err.message}`);
    } finally {
      setCloning(false);
    }
  };

  const formatDate = (ts: number) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString();
  };

  const tabCls = (id: string) =>
    `px-3 py-1 rounded text-xs font-black uppercase tracking-widest transition-all ${
      activeTab === id ? 'bg-accent-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
    }`;

  return (
    <div className="p-4 h-full flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      <h2 className="text-sm font-black uppercase tracking-widest mb-3 text-accent-400 flex items-center gap-2 shrink-0">
        <FolderOpen className="w-4 h-4" /> Projects
      </h2>

      {currentProject && (
        <div className="mb-3 p-2 bg-accent-900/20 rounded-lg border border-accent-700/30 shrink-0">
          <div className="text-[9px] text-accent-600 uppercase tracking-widest">Active</div>
          <div className="font-bold text-white text-xs mt-0.5">{currentProject.name}</div>
        </div>
      )}

      <div className="flex gap-1 mb-3 shrink-0">
        <button onClick={() => setActiveTab('saved')} className={tabCls('saved')}>Saved</button>
        <button onClick={() => setActiveTab('server')} className={tabCls('server')}>Cloned</button>
        <button onClick={() => setActiveTab('github')} className={tabCls('github')}>
          <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />GitHub</span>
        </button>
      </div>

      {/* Saved Projects */}
      {activeTab === 'saved' && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {savedProjects.map((p) => (
            <div key={p.id}
              className={`p-2.5 rounded-lg border text-xs ${currentProject?.id === p.id ? 'bg-accent-900/30 border-accent-700/40' : 'bg-gray-800 border-gray-700'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-gray-500 text-[10px]">Last: {formatDate(p.lastAccessed)}</div>
                </div>
                <div className="flex gap-1">
                  {currentProject?.id !== p.id && (
                    <button onClick={() => onProjectSwitch(p)} className="p-1 rounded hover:bg-gray-700 text-gray-300" title="Switch">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!p.isDefault && (
                    <button onClick={() => onProjectDelete(p.id)} className="p-1 rounded hover:bg-red-900/40 text-red-500" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isCreating ? (
            <div className="space-y-2">
              <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name" autoFocus
                className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); if (e.key === 'Escape') { setIsCreating(false); setNewProjectName(''); } }} />
              <div className="flex gap-2">
                <button onClick={handleCreateProject} className="px-3 py-1.5 rounded bg-accent-600 hover:bg-accent-700 text-white text-xs">Create</button>
                <button onClick={() => { setIsCreating(false); setNewProjectName(''); }} className="px-3 py-1.5 rounded bg-gray-700 text-white text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsCreating(true)}
              className="w-full px-3 py-2 rounded bg-accent-700/40 hover:bg-accent-700/60 text-accent-300 border border-accent-800/40 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
              <Plus className="w-3.5 h-3.5" /> New Project
            </button>
          )}
        </div>
      )}

      {/* Server / Cloned Projects */}
      {activeTab === 'server' && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex justify-end mb-2">
            <button onClick={fetchServerProjects} className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {serverProjects.map((p) => (
              <div key={p.id} className="p-2.5 rounded-lg border bg-gray-800 border-gray-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">{p.name}</div>
                  <div className="text-[10px] text-gray-500">GitHub clone</div>
                </div>
                <button onClick={() => onLoadServerProject(p.name)}
                  className="px-2.5 py-1 rounded bg-accent-700 hover:bg-accent-600 text-white text-xs font-black uppercase tracking-widest">
                  Load
                </button>
              </div>
            ))}
            {serverProjects.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-xs">
                <p>No cloned repos yet</p>
                <p className="mt-1 text-[10px]">Use the GitHub tab to clone one</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GitHub Clone */}
      {activeTab === 'github' && (
        <div className="flex-1 overflow-y-auto space-y-3">
          <p className="text-[10px] text-gray-500">Paste a GitHub URL or owner/repo — it'll clone and auto-open the main file in the editor.</p>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="github.com/owner/repo or owner/repo"
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white text-xs"
            onKeyDown={(e) => { if (e.key === 'Enter') handleClone(); }}
          />
          <button
            onClick={handleClone}
            disabled={cloning || !repoUrl.trim()}
            className="w-full px-3 py-2 rounded bg-accent-700 hover:bg-accent-600 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {cloning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Cloning…</> : <><GitBranch className="w-3.5 h-3.5" />Clone & Open</>}
          </button>
          {cloneMsg && (
            <div className={`text-xs px-3 py-2 rounded border ${cloneMsg.startsWith('✓') ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400' : 'bg-red-950/30 border-red-800/40 text-red-400'}`}>
              {cloneMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
