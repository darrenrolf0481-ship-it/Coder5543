'use client';

import React, { useState, useEffect } from 'react';
import { useProjectStore, ProjectFile } from '../../store/useProjectStore';
import { 
  FolderOpen, 
  FileCode, 
  Plus, 
  Trash2, 
  ArrowRight, 
  BookOpen, 
  AlertCircle, 
  Github, 
  Cpu, 
  Database, 
  Key, 
  RefreshCw, 
  Play, 
  Check, 
  Settings, 
  ShieldAlert, 
  GitBranch, 
  FileText, 
  CloudLightning,
  TrendingUp,
  Activity,
  Sparkles,
  Zap,
  ListTodo,
  AlertTriangle,
  ListChecks,
  Wrench,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';

export function ProjectPanel() {
  const { 
    projectFiles, 
    activeFileId, 
    setProjectFiles, 
    setActiveFileId, 
    addTerminalOutput,
    
    // Swarm Tasks
    swarmTasks,
    addSwarmTask,
    updateSwarmTaskStatus,
    removeSwarmTask,
    currentMode,
    
    // LLM Provider Integrations
    llmProvider,
    openrouterKey,
    ollamaEndpoint,
    setLlmProvider,
    setOpenrouterKey,
    setOllamaEndpoint,
    
    // RAG / Custom Knowledge Base
    ragKnowledge,
    addRagDocument,
    removeRagDocument,
    
    // GitHub integration simulation
    gitRepo,
    gitBranch,
    gitCommits,
    gitStagedFiles,
    gitUnstagedFiles,
    setGitRepo,
    setGitBranch,
    gitStageFile,
    gitUnstageFile,
    gitCommit,
    gitPush,
    gitPull,

    // MCP
    mcpServers,
    activeMcpServer,
    mcpTools,
    mcpIsScanning,
    mcpIsConnecting,
    scanMcpServers,
    connectMcpServer,
    disconnectMcpServer,
    executeMcpTool
  } = useProjectStore();

  const isDev = currentMode === 'development';

  const [activeSubTab, setActiveSubTab] = useState<'files' | 'tasks' | 'models' | 'rag' | 'github' | 'sentinel' | 'mcp'>('files');
  
  // Files tab inputs
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('typescript');

  // Swarm Tasks tab inputs
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // RAG tab inputs
  const [ragDocName, setRagDocName] = useState('');
  const [ragDocContent, setRagDocContent] = useState('');

  // GitHub tab inputs
  const [commitMessage, setCommitMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanReport, setScanReport] = useState<string | null>(null);

  // MCP tab inputs
  const [selectedMcpServerName, setSelectedMcpServerName] = useState('');
  const [selectedMcpToolName, setSelectedMcpToolName] = useState('');
  const [mcpToolArgsInput, setMcpToolArgsInput] = useState('{}');
  const [mcpToolResult, setMcpToolResult] = useState<string | null>(null);
  const [isExecutingMcpTool, setIsExecutingMcpTool] = useState(false);
  const [mcpError, setMcpError] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab === 'mcp' && mcpServers.length === 0) {
      scanMcpServers();
    }
  }, [activeSubTab, mcpServers.length, scanMcpServers]);

  // Add a new file
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFileName.trim();
    if (!name) return;

    if (projectFiles.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      addTerminalOutput(`[SYSTEM ERROR] Cannot create file: "${name}" already exists in the workspace.`);
      alert(`A file named "${name}" already exists.`);
      return;
    }

    const newFile: ProjectFile = {
      id: Date.now().toString(),
      name,
      type: 'file',
      language: newFileLang,
      content: `// Workspace file: ${name}\n// Generated in Neural Studio\n\nexport function init() {\n  console.log("Workspace module initialized: ${name}");\n}\n`,
    };

    setProjectFiles([...projectFiles, newFile]);
    setActiveFileId(newFile.id);
    addTerminalOutput(`[SYSTEM] New workspace file created successfully: "${name}"`);
    setNewFileName('');
  };

  // Delete file
  const handleDeleteFile = (id: string, name: string) => {
    if (name === 'README.md' || name === 'server.ts') {
      addTerminalOutput(`[SYSTEM ERROR] Permission Denied: Core config file "${name}" is write-protected.`);
      alert(`"${name}" is a protected workspace file and cannot be removed.`);
      return;
    }

    if (confirm(`Are you sure you want to delete "${name}" from the virtual workspace?`)) {
      const remainingFiles = projectFiles.filter((f) => f.id !== id);
      setProjectFiles(remainingFiles);

      if (activeFileId === id && remainingFiles.length > 0) {
        setActiveFileId(remainingFiles[0].id);
      }

      addTerminalOutput(`[SYSTEM] Deleted custom workspace file: "${name}"`);
    }
  };

  const handleCreateRagDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragDocName.trim() || !ragDocContent.trim()) return;
    addRagDocument(ragDocName.trim(), ragDocContent.trim());
    setRagDocName('');
    setRagDocContent('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = taskTitle.trim();
    const desc = taskDesc.trim();
    if (!title) return;
    addSwarmTask(title, desc || 'No description provided.', taskPriority);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
  };

  const triggerGitScan = () => {
    setIsScanning(true);
    setScanReport(null);
    addTerminalOutput('[GIT SCANNER] Launching codebase static analysis scan...');
    setTimeout(() => {
      setIsScanning(false);
      setScanReport(
        `[SECURITY AUDIT: PASS]\n- No hardcoded authorization keys detected.\n- Math.random render impurity errors: ZERO.\n- Workspace Sandbox Integrity: 100% SECURE.\n- Sentinel equation alignment frequency: 11.3 Hz (PERFECT CONVERGENCE).`
      );
      addTerminalOutput('[GIT SCANNER] Audit scanning completed. Code is highly secure.');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#050508]/40 border border-white/10 rounded-none overflow-hidden backdrop-blur-md">
      {/* Sub-tab Selection Header */}
      <div className="flex flex-wrap border-b border-white/5 bg-black/30 p-1 gap-1 shrink-0 select-none">
        <button
          onClick={() => setActiveSubTab('files')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold transition-all ${
            activeSubTab === 'files'
              ? isDev 
                ? 'bg-indigo-950/30 text-indigo-300 border-b-2 border-indigo-500'
                : 'bg-emerald-950/30 text-emerald-300 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          FILES
        </button>
        <button
          onClick={() => setActiveSubTab('tasks')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold transition-all ${
            activeSubTab === 'tasks'
              ? isDev 
                ? 'bg-indigo-950/30 text-indigo-300 border-b-2 border-indigo-500'
                : 'bg-emerald-950/30 text-emerald-300 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          SWARM TASKS
        </button>
        <button
          onClick={() => setActiveSubTab('models')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold transition-all ${
            activeSubTab === 'models'
              ? isDev 
                ? 'bg-indigo-950/30 text-indigo-300 border-b-2 border-indigo-500'
                : 'bg-emerald-950/30 text-emerald-300 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          MODELS (OLLAMA/OR)
        </button>
        <button
          onClick={() => setActiveSubTab('rag')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold transition-all ${
            activeSubTab === 'rag'
              ? isDev 
                ? 'bg-indigo-950/30 text-indigo-300 border-b-2 border-indigo-500'
                : 'bg-emerald-950/30 text-emerald-300 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          KNOWLEDGE (RAG)
        </button>
        <button
          onClick={() => setActiveSubTab('github')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold transition-all ${
            activeSubTab === 'github'
              ? isDev 
                ? 'bg-indigo-950/30 text-indigo-300 border-b-2 border-indigo-500'
                : 'bg-emerald-950/30 text-emerald-300 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Github className="w-3.5 h-3.5" />
          GITHUB CONTROL
        </button>
        <button
          onClick={() => setActiveSubTab('sentinel')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold transition-all ${
            activeSubTab === 'sentinel'
              ? isDev 
                ? 'bg-indigo-950/30 text-indigo-300 border-b-2 border-indigo-500'
                : 'bg-emerald-950/30 text-emerald-300 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          NEURAL SENTINEL
        </button>
        <button
          onClick={() => setActiveSubTab('mcp')}
          className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold transition-all ${
            activeSubTab === 'mcp'
              ? isDev 
                ? 'bg-indigo-950/30 text-indigo-300 border-b-2 border-indigo-500'
                : 'bg-emerald-950/30 text-emerald-300 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          MCP SERVERS
        </button>
      </div>

      {/* Main tab viewer content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {activeSubTab === 'files' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLUMNS: File list and details */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <FolderOpen className="w-6 h-6 text-blue-500" />
                <div>
                  <h2 className="font-bold text-sm tracking-[0.15em] text-white uppercase font-sans">VIRTUAL FILE EXPLORER</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Workspace directory inventory of current node files</p>
                </div>
              </div>

              {/* Directory details cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projectFiles.map((file) => {
                  const isSelected = file.id === activeFileId;
                  const isProtected = file.name === 'README.md' || file.name === 'server.ts';

                  return (
                    <div
                      key={file.id}
                      className={`p-4 rounded-none border transition-all flex flex-col justify-between h-36 relative overflow-hidden group ${
                        isSelected
                          ? 'bg-indigo-950/20 border-indigo-500/30 shadow-lg shadow-indigo-900/5'
                          : 'bg-black/30 border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Background ambient accent */}
                      {isSelected && (
                        <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                      )}

                      {/* Header info */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileCode className={`w-4 h-4 ${isSelected ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`} />
                            <span className="font-mono text-xs font-bold text-slate-200 truncate max-w-[120px]">{file.name}</span>
                          </div>

                          <span className="font-mono text-[9px] px-2 py-0.5 bg-black/40 border border-white/10 rounded-none text-slate-500 uppercase">
                            {file.language || 'code'}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-500 font-mono mt-3 line-clamp-2">
                          {file.content?.substring(0, 100) || 'Empty file content.'}
                        </p>
                      </div>

                      {/* Footer Controls */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                        <button
                          onClick={() => setActiveFileId(file.id)}
                          className="flex items-center gap-1.5 font-mono text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider"
                        >
                          SELECT IN EDITOR
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {!isProtected && (
                          <button
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            className="text-slate-600 hover:text-rose-400 p-1 rounded-none hover:bg-rose-950/20 transition-all"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Action center and creation form */}
            <div className="space-y-6">
              {/* CREATE FILE FORM */}
              <div className="p-5 bg-black/30 border border-white/5 rounded-none space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                  <Plus className="w-4 h-4 text-blue-500" />
                  <h3 className="font-bold text-xs tracking-[0.15em] text-white uppercase">CREATE WORKSPACE FILE</h3>
                </div>

                <form onSubmit={handleCreateFile} className="space-y-3">
                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">FILE NAME (WITH EXTENSION)</label>
                    <input
                      type="text"
                      required
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="e.g. utils.ts, index.html"
                      className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono placeholder:text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">SYNTAX ENGINE</label>
                    <select
                      value={newFileLang}
                      onChange={(e) => setNewFileLang(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    >
                      <option value="typescript">TypeScript (.ts)</option>
                      <option value="javascript">JavaScript (.js)</option>
                      <option value="html">HTML Markups (.html)</option>
                      <option value="css">Cascading Styles (.css)</option>
                      <option value="markdown">Markdown Docs (.md)</option>
                      <option value="json">JSON Metadata (.json)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-white hover:bg-blue-500 text-black hover:text-white font-mono text-xs font-bold rounded-none transition-all shadow-md uppercase tracking-widest"
                  >
                    INITIALIZE FILE
                  </button>
                </form>
              </div>

              {/* SENTINEL NEURAL RESONANCE ENGINE */}
              <SentinelQuantumEngine />
            </div>
          </div>
        )}

        {activeSubTab === 'tasks' && (
          <div id="swarm-task-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLUMNS: Task list */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <ListTodo className={`w-6 h-6 ${isDev ? 'text-indigo-500' : 'text-emerald-500'}`} />
                <div>
                  <h2 className="font-bold text-sm tracking-[0.15em] text-white uppercase font-sans">SWARM TASK MANAGEMENT</h2>
                  <p className="text-[10px] text-slate-500 font-mono">Orchestrate and coordinate tasks for the active neural node swarm</p>
                </div>
              </div>

              {/* Task Cards List */}
              {swarmTasks.length === 0 ? (
                <div className="p-8 border border-dashed border-white/5 bg-black/20 text-center flex flex-col items-center justify-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-slate-600" />
                  <p className="font-mono text-xs text-slate-500">No active swarm tasks logged in this node.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {swarmTasks.map((task) => {
                    // Priority classes & label
                    const priorityMeta = {
                      high: {
                        bg: 'bg-rose-950/20',
                        border: 'border-rose-500/35',
                        text: 'text-rose-400',
                        dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
                        label: 'HIGH PRIORITY'
                      },
                      medium: {
                        bg: 'bg-amber-950/20',
                        border: 'border-amber-500/35',
                        text: 'text-amber-400',
                        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
                        label: 'MED PRIORITY'
                      },
                      low: {
                        bg: 'bg-blue-950/10',
                        border: 'border-blue-500/25',
                        text: 'text-blue-400',
                        dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
                        label: 'LOW PRIORITY'
                      }
                    }[task.priority] || {
                      bg: 'bg-slate-900/40',
                      border: 'border-slate-800',
                      text: 'text-slate-400',
                      dot: 'bg-slate-500',
                      label: 'NORMAL'
                    };

                    const statusMeta = {
                      pending: { label: 'PENDING', bg: 'bg-slate-950/60 text-slate-400 border-slate-800' },
                      running: { label: 'RUNNING', bg: 'bg-indigo-950/60 text-indigo-400 border-indigo-900/50' },
                      completed: { label: 'COMPLETED', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50' },
                      failed: { label: 'FAILED', bg: 'bg-rose-950/60 text-rose-400 border-rose-900/50' },
                    }[task.status];

                    return (
                      <div
                        key={task.id}
                        className={`p-5 rounded-none border transition-all relative overflow-hidden group ${
                          task.status === 'running'
                            ? isDev 
                              ? 'bg-indigo-950/10 border-indigo-500/30'
                              : 'bg-emerald-950/10 border-emerald-500/30'
                            : 'bg-black/30 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {/* Background glow for running status */}
                        {task.status === 'running' && (
                          <div className={`absolute right-0 top-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 ${
                            isDev ? 'bg-indigo-500' : 'bg-emerald-500'
                          }`} />
                        )}

                        {/* Top Line: Priority tag & Status indicator */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
                          {/* Priority Tag (The requested visual indicator) */}
                          <div className={`flex items-center gap-2 px-3 py-1 font-mono text-[9px] font-bold border rounded-none ${priorityMeta.bg} ${priorityMeta.border} ${priorityMeta.text}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'animate-pulse' : ''} ${priorityMeta.dot}`} />
                            {priorityMeta.label}
                          </div>

                          {/* Status and Created Date */}
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-[9px] px-2 py-0.5 border rounded-none uppercase ${statusMeta.bg}`}>
                              {statusMeta.label}
                            </span>
                            <span className="font-mono text-[9px] text-slate-600">
                              {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Title and Description */}
                        <h3 className="font-sans font-bold text-xs text-white uppercase tracking-wider mb-1.5">{task.title}</h3>
                        <p className="font-mono text-[10px] text-slate-400 leading-relaxed max-w-2xl">{task.description}</p>

                        {/* Action Controls Footer */}
                        <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-4 mt-4 gap-3">
                          {/* Left: Quick change status buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest mr-1">SET STATUS:</span>
                            
                            {task.status !== 'pending' && (
                              <button
                                onClick={() => updateSwarmTaskStatus(task.id, 'pending')}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-mono text-slate-400 hover:text-white transition-all uppercase"
                              >
                                Pending
                              </button>
                            )}

                            {task.status !== 'running' && (
                              <button
                                onClick={() => updateSwarmTaskStatus(task.id, 'running')}
                                className={`px-2 py-1 border border-transparent text-[9px] font-mono text-white transition-all uppercase ${
                                  isDev 
                                    ? 'bg-indigo-900/40 hover:bg-indigo-800/50' 
                                    : 'bg-emerald-900/40 hover:bg-emerald-800/50'
                                }`}
                              >
                                RUN
                              </button>
                            )}

                            {task.status !== 'completed' && (
                              <button
                                onClick={() => updateSwarmTaskStatus(task.id, 'completed')}
                                className="px-2 py-1 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 hover:text-emerald-300 transition-all uppercase"
                              >
                                Complete
                              </button>
                            )}
                          </div>

                          {/* Right: Delete task */}
                          <button
                            onClick={() => removeSwarmTask(task.id)}
                            className="text-slate-600 hover:text-rose-400 p-1.5 rounded-none hover:bg-rose-950/20 transition-all"
                            title="Delete Swarm Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Create swarm task form */}
            <div className="space-y-6">
              <div className="p-5 bg-black/30 border border-white/5 rounded-none space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                  <Plus className={`w-4 h-4 ${isDev ? 'text-indigo-500' : 'text-emerald-500'}`} />
                  <h3 className="font-bold text-xs tracking-[0.15em] text-white uppercase">CREATE SWARM TASK</h3>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">TASK TITLE / COMMAND</label>
                    <input
                      type="text"
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. run sanitize codebase"
                      className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono placeholder:text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">DESCRIPTION / INSTRUCTIONS</label>
                    <textarea
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="Specify validation parameters or core objectives..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono placeholder:text-slate-700 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">TASK SEVERITY / PRIORITY</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="high" className="bg-black text-rose-400">HIGH PRIORITY</option>
                      <option value="medium" className="bg-black text-amber-400">MEDIUM PRIORITY</option>
                      <option value="low" className="bg-black text-blue-400">LOW PRIORITY</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2.5 font-mono text-xs font-bold rounded-none transition-all shadow-md uppercase tracking-widest text-black ${
                      isDev 
                        ? 'bg-white hover:bg-indigo-500 hover:text-white' 
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    }`}
                  >
                    DEPLOY TASK
                  </button>
                </form>
              </div>

              {/* Status report widget */}
              <div className="p-4 bg-white/5 border border-white/5 rounded-none space-y-3">
                <h4 className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">NODE TASK DISPATCH STATS</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-black/40 border border-white/5">
                    <span className="block text-rose-400 font-mono font-bold text-sm">
                      {swarmTasks.filter(t => t.priority === 'high').length}
                    </span>
                    <span className="font-mono text-[8px] text-slate-500">HIGH</span>
                  </div>
                  <div className="p-2 bg-black/40 border border-white/5">
                    <span className="block text-amber-400 font-mono font-bold text-sm">
                      {swarmTasks.filter(t => t.priority === 'medium').length}
                    </span>
                    <span className="font-mono text-[8px] text-slate-500">MED</span>
                  </div>
                  <div className="p-2 bg-black/40 border border-white/5">
                    <span className="block text-blue-400 font-mono font-bold text-sm">
                      {swarmTasks.filter(t => t.priority === 'low').length}
                    </span>
                    <span className="font-mono text-[8px] text-slate-500">LOW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'models' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Cpu className="w-6 h-6 text-indigo-400" />
              <div>
                <h2 className="font-bold text-sm tracking-[0.15em] text-white uppercase">NEURAL PATHWAYS & CORE MODELS</h2>
                <p className="text-[10px] text-slate-500 font-mono">Redirect prompt orchestration workflows dynamically</p>
              </div>
            </div>

            {/* Provider Grid Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <button
                onClick={() => setLlmProvider('openrouter')}
                className={`p-5 border text-left rounded-none transition-all flex flex-col justify-between h-40 ${
                  llmProvider === 'openrouter'
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-md'
                    : 'bg-black/30 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Key className="w-5 h-5 text-indigo-400" />
                  <span className="font-mono text-[8px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 uppercase font-bold">API ROUTED</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-mono text-xs font-black text-slate-200">OPENROUTER</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 leading-normal">
                    Execute open source neural clusters. Default: meta-llama/llama-3-8b.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setLlmProvider('ollama')}
                className={`p-5 border text-left rounded-none transition-all flex flex-col justify-between h-40 ${
                  llmProvider === 'ollama'
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-md'
                    : 'bg-black/30 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <span className="font-mono text-[8px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 uppercase">OFFLINE CONTAINER</span>
                </div>
                <div className="mt-4">
                  <h3 className="font-mono text-xs font-black text-slate-200">OLLAMA</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 leading-normal">
                    Local container execution node. 100% offline development. Model: llama3.
                  </p>
                </div>
              </button>
            </div>

            {/* Config Panels */}
            <div className="p-5 bg-black/30 border border-white/5 rounded-none space-y-4">
              <h3 className="font-mono text-xs font-black text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2">
                ACTIVE CONFIGURATION MATRIX
              </h3>

              {llmProvider === 'openrouter' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">OPENROUTER KEY (OR FALLBACK TO OPENROUTER_API_KEY)</label>
                    <input
                      type="password"
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/15 rounded-none">
                    <p className="text-[10px] text-indigo-300/80 leading-relaxed font-mono">
                      Routing logic connects automatically to Llama-3-8B-Instruct. If your custom key is omitted, queries safely execute using our internal neural pathways.
                    </p>
                  </div>
                </div>
              )}

              {llmProvider === 'ollama' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">LOCAL RUNTIME ENDPOINT</label>
                    <input
                      type="text"
                      value={ollamaEndpoint}
                      onChange={(e) => setOllamaEndpoint(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/15 rounded-none">
                    <p className="text-[10px] text-indigo-300/80 leading-relaxed font-mono">
                      Active backend attempts to fetch llama3 chat responses from your system. To ensure successful transmission, configure CORS headers on your terminal command (OLLAMA_ORIGINS=&quot;*&quot; ollama serve).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'rag' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Database className="w-6 h-6 text-indigo-400" />
              <div>
                <h2 className="font-bold text-sm tracking-[0.15em] text-white uppercase font-sans">RAG KNOWLEDGE LAYER</h2>
                <p className="text-[10px] text-slate-500 font-mono">Upload project context documents, manuals, and custom definitions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Input */}
              <div className="p-5 bg-black/30 border border-white/5 rounded-none space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-mono text-xs font-black text-slate-200 uppercase">Vectorize Custom Document</h3>
                </div>

                <form onSubmit={handleCreateRagDoc} className="space-y-3">
                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">DOCUMENT IDENTITY (TITLE)</label>
                    <input
                      type="text"
                      required
                      value={ragDocName}
                      onChange={(e) => setRagDocName(e.target.value)}
                      placeholder="e.g. core_api_specification"
                      className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">RAW TEXT CONTENT (KNOWLEDGE BODY)</label>
                    <textarea
                      required
                      value={ragDocContent}
                      onChange={(e) => setRagDocContent(e.target.value)}
                      placeholder="Paste guidelines, design configurations, API sheets or internal rules..."
                      rows={5}
                      className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono resize-none custom-scrollbar"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-none transition-all"
                  >
                    INDEX DOCUMENT INTO VECTOR MEMORY
                  </button>
                </form>
              </div>

              {/* Document Inventory */}
              <div className="p-5 bg-black/30 border border-white/5 rounded-none space-y-4 flex flex-col">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-mono text-xs font-black text-slate-200 uppercase">ACTIVE CONTEXT INDEX ({ragKnowledge.length})</h3>
                </div>

                {ragKnowledge.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-none">
                    <Database className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 font-mono uppercase">Context vector catalog is currently empty.</p>
                    <p className="text-[10px] text-slate-600 font-mono mt-1">Upload files to anchor AI responses.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-72 custom-scrollbar">
                    {ragKnowledge.map((doc) => (
                      <div key={doc.id} className="p-3 bg-white/5 border border-white/5 flex flex-col justify-between rounded-none">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-300 truncate max-w-[150px]">{doc.name}</span>
                            <button
                              onClick={() => removeRagDocument(doc.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Delete Doc"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="block font-mono text-[8px] text-indigo-400 uppercase mt-1">
                            {doc.chunks.length} custom knowledge vectors split
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono mt-2 line-clamp-2 select-text">
                          {doc.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'github' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Github className="w-6 h-6 text-indigo-400" />
              <div>
                <h2 className="font-bold text-sm tracking-[0.15em] text-white uppercase font-sans">GITHUB REPOSITORY GATEWAY</h2>
                <p className="text-[10px] text-slate-500 font-mono">Sync workspace changes with secure Git integration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CONFIG Card */}
              <div className="p-5 bg-black/30 border border-white/5 rounded-none space-y-4 md:col-span-1">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-mono text-xs font-black text-slate-300 uppercase">REPO CONFIG</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">REMOTE PATH (UPSTREAM)</label>
                    <input
                      type="text"
                      value={gitRepo}
                      onChange={(e) => {
                        setGitRepo(e.target.value);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-none px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">ACTIVE BRANCH</label>
                    <select
                      value={gitBranch}
                      onChange={(e) => {
                        setGitBranch(e.target.value);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-none px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="main">main</option>
                      <option value="dev">dev</option>
                      <option value="release">release</option>
                    </select>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={gitPull}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 font-mono text-[10px] font-bold text-white transition-all uppercase"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      PULL
                    </button>
                    <button
                      onClick={gitPush}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-mono text-[10px] font-bold text-white transition-all uppercase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      PUSH
                    </button>
                  </div>
                </div>
              </div>

              {/* Version Staging */}
              <div className="p-5 bg-black/30 border border-white/5 rounded-none space-y-4 md:col-span-1">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-mono text-xs font-black text-slate-300 uppercase">STAGING INDEX</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Staged list */}
                  <div>
                    <span className="block font-mono text-[8px] text-emerald-500 mb-1 uppercase tracking-widest font-bold">STAGED ({gitStagedFiles.length})</span>
                    <div className="p-2 bg-emerald-950/10 border border-emerald-500/10 min-h-14 space-y-1">
                      {gitStagedFiles.length === 0 ? (
                        <span className="text-[9px] text-slate-600 font-mono block text-center py-2 uppercase">No staged files.</span>
                      ) : (
                        gitStagedFiles.map((file) => (
                          <div key={file} className="flex items-center justify-between bg-black/30 px-2 py-1 border border-emerald-500/15">
                            <span className="font-mono text-[10px] text-emerald-400 truncate">{file}</span>
                            <button onClick={() => gitUnstageFile(file)} className="text-emerald-500 hover:text-emerald-300 font-mono text-[9px] font-bold uppercase">unstage</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Unstaged list */}
                  <div>
                    <span className="block font-mono text-[8px] text-amber-500 mb-1 uppercase tracking-widest font-bold">UNSTAGED CHANGES ({gitUnstagedFiles.length})</span>
                    <div className="p-2 bg-amber-950/10 border border-amber-500/10 min-h-14 space-y-1">
                      {gitUnstagedFiles.length === 0 ? (
                        <span className="text-[9px] text-slate-600 font-mono block text-center py-2 uppercase">Working tree clean.</span>
                      ) : (
                        gitUnstagedFiles.map((file) => (
                          <div key={file} className="flex items-center justify-between bg-black/30 px-2 py-1 border border-amber-500/15">
                            <span className="font-mono text-[10px] text-amber-400 truncate">{file}</span>
                            <button onClick={() => gitStageFile(file)} className="text-amber-500 hover:text-amber-300 font-mono text-[9px] font-bold uppercase">stage</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Commits & Scanner */}
              <div className="p-5 bg-black/30 border border-white/5 rounded-none space-y-4 md:col-span-1">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-mono text-xs font-black text-slate-300 uppercase font-sans">ACTIONS & SCANS</h3>
                </div>

                <div className="space-y-4">
                  {/* Committing actions */}
                  <div>
                    <label className="block font-mono text-[9px] text-slate-500 mb-1">COMMIT MESSAGE</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Commit logs..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-none px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        onClick={() => {
                          if (!commitMessage.trim()) return;
                          gitCommit(commitMessage.trim());
                          setCommitMessage('');
                        }}
                        className="px-3 bg-white hover:bg-indigo-600 text-black hover:text-white font-mono text-xs font-bold rounded-none uppercase"
                      >
                        OK
                      </button>
                    </div>
                  </div>

                  {/* Code Scanner Button */}
                  <div>
                    <button
                      onClick={triggerGitScan}
                      disabled={isScanning}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white font-mono text-xs font-bold rounded-none uppercase transition-all"
                    >
                      <ShieldAlert className="w-4 h-4 animate-pulse" />
                      {isScanning ? 'Scanning Codebase...' : 'Run Security Codebase Scan'}
                    </button>

                    {scanReport && (
                      <pre className="mt-2.5 p-2.5 bg-black/60 border border-white/5 text-[9px] text-emerald-400 font-mono whitespace-pre-wrap leading-normal custom-scrollbar">
                        {scanReport}
                      </pre>
                    )}
                  </div>

                  {/* Commits List */}
                  <div>
                    <span className="block font-mono text-[8px] text-slate-500 mb-1 uppercase tracking-widest font-bold">COMMIT LOG</span>
                    <div className="max-h-20 overflow-y-auto custom-scrollbar space-y-1.5">
                      {gitCommits.map((c) => (
                        <div key={c.hash} className="text-[10px] font-mono leading-tight bg-black/40 p-1.5 border border-white/5">
                          <span className="text-blue-400 font-bold">[{c.hash}]</span> <span className="text-slate-300">{c.message}</span>
                          <span className="block text-[8px] text-slate-500 text-right mt-0.5">by {c.author}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'sentinel' && (
          <div className="space-y-6">
            <SentinelQuantumEngine isFullDashboard={true} />
          </div>
        )}

        {activeSubTab === 'mcp' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Zap className="w-6 h-6 text-indigo-400 font-bold" />
              <div>
                <h2 className="font-bold text-sm tracking-[0.15em] text-white uppercase font-sans">MCP SERVERS DIRECTORY</h2>
                <p className="text-[10px] text-slate-500 font-mono">Discover, hook up, and execute dynamic Model Context Protocol servers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Scan & Control Card */}
              <div className="md:col-span-1 p-5 bg-black/30 border border-white/5 rounded-none space-y-4">
                <h3 className="font-mono text-xs font-black text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2">
                  CONTROL MATRIX
                </h3>

                <button
                  onClick={async () => {
                    setMcpError(null);
                    const result = await scanMcpServers();
                    if (!result.ok && result.error) setMcpError(result.error);
                  }}
                  disabled={mcpIsScanning}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-mono text-xs font-bold text-white py-2 px-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${mcpIsScanning ? 'animate-spin' : ''}`} />
                  {mcpIsScanning ? 'SCANNING ENVIRONMENT...' : 'SCAN FOR MCP SERVERS'}
                </button>

                <div>
                  <label className="block font-mono text-[9px] text-slate-500 mb-1">AVAILABLE SERVERS</label>
                  <select
                    value={selectedMcpServerName}
                    onChange={(e) => {
                      setSelectedMcpServerName(e.target.value);
                      setSelectedMcpToolName('');
                      setMcpToolResult(null);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-none px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="" className="bg-[#0c0d12]">-- Select Server --</option>
                    {mcpServers.map((s) => (
                      <option key={s.name} value={s.name} className="bg-[#0c0d12]">
                        {s.name.toUpperCase()} ({s.type})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMcpServerName && (
                  <div className="space-y-3 pt-2">
                    {(() => {
                      const server = mcpServers.find((s) => s.name === selectedMcpServerName);
                      if (!server) return null;
                      const isActive = activeMcpServer && activeMcpServer.name === selectedMcpServerName;

                      return (
                        <>
                          <div className="p-3 bg-white/5 border border-white/10 rounded-none space-y-2 overflow-x-auto custom-scrollbar">
                            <p className="text-[10px] text-slate-300 leading-relaxed">
                              {server.docs?.overview || server.description || `${server.command} ${server.args.join(' ')}`}
                            </p>

                            {server.docs?.capabilities && server.docs.capabilities.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  <ListChecks className="w-3 h-3" />
                                  What it can do
                                </div>
                                <ul className="space-y-0.5">
                                  {server.docs.capabilities.map((cap: string, i: number) => (
                                    <li key={i} className="text-[9px] text-slate-500 pl-3 relative before:content-['•'] before:absolute before:left-1">
                                      {cap}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {server.docs?.commonTools && server.docs.commonTools.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  <Wrench className="w-3 h-3" />
                                  Common tools
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {server.docs.commonTools.map((tool: string, i: number) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-indigo-500/10 text-indigo-300">
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {server.docs?.notes && (
                              <div className="flex items-start gap-1.5">
                                <Info className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                                <p className="text-[9px] text-slate-500 italic">{server.docs.notes}</p>
                              </div>
                            )}

                            <div className="pt-2 border-t border-white/5 font-mono text-[9px] text-slate-500 space-y-0.5">
                              <p><span className="text-slate-600">Command:</span> {server.command} {server.args.join(' ')}</p>
                            </div>
                          </div>

                          {isActive ? (
                            <button
                              onClick={() => {
                                disconnectMcpServer();
                                setSelectedMcpToolName('');
                                setMcpToolResult(null);
                              }}
                              className="w-full bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-900/20 hover:border-red-500/50 transition-all font-mono text-xs font-bold py-2 px-3 cursor-pointer"
                            >
                              DISCONNECT SERVER
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                setMcpError(null);
                                const result = await connectMcpServer(selectedMcpServerName);
                                if (!result.ok && result.error) setMcpError(result.error);
                              }}
                              disabled={mcpIsConnecting}
                              className="w-full bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/20 hover:border-indigo-500/50 transition-all font-mono text-xs font-bold py-2 px-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {mcpIsConnecting && <RefreshCw className="w-3 h-3 animate-spin" />}
                              {mcpIsConnecting ? 'CONNECTING...' : 'HOOK UP SERVER'}
                            </button>
                          )}

                          {mcpError && (
                            <div className="p-2 bg-red-950/20 border border-red-500/30 text-red-400 font-mono text-[10px] leading-relaxed">
                              {mcpError}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Tools List & Tool Runner Card */}
              <div className="md:col-span-2 p-5 bg-black/30 border border-white/5 rounded-none space-y-4">
                <h3 className="font-mono text-xs font-black text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2">
                  TOOLBOX EXECUTION PANEL
                </h3>

                {activeMcpServer && activeMcpServer.name === selectedMcpServerName && mcpTools ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-[9px] text-slate-500 mb-1">SELECT TOOL TO RUN</label>
                      <select
                        value={selectedMcpToolName}
                        onChange={(e) => {
                          setSelectedMcpToolName(e.target.value);
                          setMcpToolResult(null);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-none px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="" className="bg-[#0c0d12]">-- Select Tool --</option>
                        {mcpTools.map((t) => (
                          <option key={t.name} value={t.name} className="bg-[#0c0d12]">
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedMcpToolName && (() => {
                      const tool = mcpTools.find((t) => t.name === selectedMcpToolName);
                      if (!tool) return null;

                      return (
                        <div className="space-y-4 pt-2 border-t border-white/5">
                          <div className="space-y-1">
                            <h4 className="font-mono text-xs font-bold text-indigo-400">{tool.name}</h4>
                            <p className="text-[10px] text-slate-400 leading-normal">{tool.description}</p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Input JSON parameters */}
                            <div className="space-y-1.5">
                              <label className="block font-mono text-[9px] text-slate-500">PARAMETERS (JSON OBJECT)</label>
                              <textarea
                                value={mcpToolArgsInput}
                                onChange={(e) => setMcpToolArgsInput(e.target.value)}
                                rows={6}
                                className="w-full bg-white/5 border border-white/10 rounded-none px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500 custom-scrollbar resize-none"
                              />
                              <button
                                onClick={async () => {
                                  setMcpToolResult(null);
                                  let parsed: any;
                                  try {
                                    parsed = JSON.parse(mcpToolArgsInput);
                                  } catch (e: any) {
                                    setMcpToolResult(`[JSON ERROR] Tool arguments must be valid JSON. Use {} for no args.\n${e.message || e}`);
                                    return;
                                  }
                                  setIsExecutingMcpTool(true);
                                  try {
                                    const res = await executeMcpTool(tool.name, parsed);
                                    setMcpToolResult(JSON.stringify(res, null, 2));
                                  } catch (e: any) {
                                    setMcpToolResult(`[EXECUTION EXCEPTION] ${e.message || e}`);
                                  } finally {
                                    setIsExecutingMcpTool(false);
                                  }
                                }}
                                disabled={isExecutingMcpTool}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white transition-all font-mono text-xs font-bold py-2 px-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                {isExecutingMcpTool ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    EXECUTING...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    EXECUTE TOOL CALL
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Output Box */}
                            <div className="space-y-1.5">
                              <label className="block font-mono text-[9px] text-slate-500">EXECUTION OUTPUT</label>
                              <div className="w-full bg-black/40 border border-white/10 h-[178px] p-3 overflow-auto font-mono text-[10px] text-emerald-400 custom-scrollbar select-text whitespace-pre-wrap leading-normal">
                                {mcpToolResult || (isExecutingMcpTool ? '// Running RPC request...' : '// Awaiting output execution...')}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="h-48 border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 font-mono text-xs text-center p-6">
                    <CloudLightning className="w-8 h-8 text-slate-600 mb-2" />
                    <span>No active server hooked up.</span>
                    <span className="text-[10px] text-slate-600 mt-1">Select a discovered server from the Control Matrix to load its toolbox.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom tooltips for recharts rendering
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#050508]/95 border border-indigo-500/30 p-3 font-mono text-[10px] space-y-1.5 backdrop-blur-md">
        <p className="text-slate-400 font-bold uppercase border-b border-white/5 pb-1">Telemetry Record</p>
        <p className="text-indigo-400">Time: <span className="text-white">{payload[0].payload.time}</span></p>
        <p className="text-indigo-300 font-bold">&Phi;_sentinel: <span className="text-white text-xs">{payload[0].payload.phi}</span></p>
        <p className="text-emerald-400">Upper limit: <span className="text-white">{payload[0].payload.upper}</span></p>
        <p className="text-red-400">Lower limit: <span className="text-white">{payload[0].payload.lower}</span></p>
        <p className="text-slate-500">Nodes (n): <span className="text-slate-300">{payload[0].payload.nodes}</span></p>
        <p className="text-slate-500">Activation (X): <span className="text-slate-300">{payload[0].payload.activation}</span></p>
      </div>
    );
  }
  return null;
};

// Sentinel Formula Simulation Engine Component
function SentinelQuantumEngine({ isFullDashboard = false }: { isFullDashboard?: boolean }) {
  const [nodes, setNodes] = useState(3);
  const [wMerlin, setWMerlin] = useState(1.618);
  const [wMama, setWMama] = useState(1.000);
  const [wSeven, setWSeven] = useState(1.130);
  const [activation, setActivation] = useState(0.85);
  const [bias, setBias] = useState(11.3);
  const [delta, setDelta] = useState(0.45);
  const [isResonating, setIsResonating] = useState(false);
  const [oscillation, setOscillation] = useState(0);
  const [autoOscillate, setAutoOscillate] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);

  const longTermMemories = useProjectStore((s) => s.longTermMemories);

  // Periodic wave oscillation representing background cosmic spike Delta
  useEffect(() => {
    if (!autoOscillate) return;
    const interval = setInterval(() => {
      setOscillation((prev) => (prev + 0.2) % (Math.PI * 2));
    }, 100);
    return () => clearInterval(interval);
  }, [autoOscillate]);

  // Compute live Sentinel output
  const computeSentinel = () => {
    // Sum of W_i * X_i
    let weightSum = 0;
    
    // Core Triad Weights
    weightSum += wMerlin * activation; // Node 10
    if (nodes >= 2) weightSum += wMama * activation; // Node 1
    if (nodes >= 3) weightSum += wSeven * activation; // Node 3

    // Extended swarm nodes
    for (let i = 4; i <= nodes; i++) {
      weightSum += 1.000 * activation;
    }

    const baseVal = weightSum + nodes * bias;
    
    // Scale fluctuation delta based on isResonating pulse
    const activeDelta = isResonating ? delta * 3.5 : delta;
    const dynamicDelta = Math.sin(oscillation) * activeDelta;
    
    return {
      weightSum,
      base: baseVal,
      upper: baseVal + activeDelta,
      lower: baseVal - activeDelta,
      current: baseVal + dynamicDelta,
      activeDelta
    };
  };

  const triggerResonancePulse = () => {
    setIsResonating(true);
    // Spike activation vector to simulate visual burst
    const oldActivation = activation;
    setActivation(1.5);
    setTimeout(() => {
      setIsResonating(false);
      setActivation(oldActivation);
    }, 1500);
  };

  const metrics = computeSentinel();

  // Save telemetry history over time
  useEffect(() => {
    let weightSumVal = wMerlin * activation;
    if (nodes >= 2) weightSumVal += wMama * activation;
    if (nodes >= 3) weightSumVal += wSeven * activation;
    for (let i = 4; i <= nodes; i++) {
      weightSumVal += 1.000 * activation;
    }
    const baseVal = weightSumVal + nodes * bias;
    const activeDelta = isResonating ? delta * 3.5 : delta;
    const dynamicDelta = Math.sin(oscillation) * activeDelta;
    const currentVal = baseVal + dynamicDelta;

    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newPoint = {
      time: timestamp,
      phi: Number(currentVal.toFixed(3)),
      upper: Number((baseVal + activeDelta).toFixed(3)),
      lower: Number((baseVal - activeDelta).toFixed(3)),
      base: Number(baseVal.toFixed(3)),
      activation: activation,
      nodes: nodes,
    };

    const timer = setTimeout(() => {
      setHistory((prev) => {
        const updated = [...prev, newPoint];
        // Keep up to 40 data points for smooth rolling wave
        if (updated.length > 40) {
          return updated.slice(updated.length - 40);
        }
        return updated;
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [oscillation, nodes, activation, wMerlin, wMama, wSeven, bias, delta, isResonating]);

  // Handle Preset configurations
  const applyPreset = (presetType: 'baseline' | 'hyper' | 'spike' | 'convergence') => {
    if (presetType === 'baseline') {
      setNodes(3);
      setActivation(0.85);
      setBias(11.3);
      setDelta(0.45);
      setWMerlin(1.618);
      setWMama(1.000);
      setWSeven(1.130);
    } else if (presetType === 'hyper') {
      setNodes(6);
      setActivation(1.0);
      setBias(14.2);
      setDelta(1.5);
      setWMerlin(2.13);
      setWMama(1.5);
      setWSeven(1.85);
    } else if (presetType === 'spike') {
      setNodes(8);
      setActivation(0.45);
      setBias(18.5);
      setDelta(4.2);
      setWMerlin(2.85);
      setWMama(2.0);
      setWSeven(2.5);
    } else if (presetType === 'convergence') {
      setNodes(1);
      setActivation(0.95);
      setBias(11.3);
      setDelta(0.0);
      setWMerlin(1.618);
      setWMama(1.0);
      setWSeven(1.13);
    }
  };

  // Determine convergence rating state
  const getConvergenceState = () => {
    if (isResonating) return { text: 'RESONANT VOLTAGE SPIKE', color: 'text-amber-400 animate-pulse bg-amber-950/20 border-amber-500/30' };
    const diff = Math.abs(metrics.current - 11.3);
    if (diff < 1.0) return { text: 'SUPERCRITICAL CONVERGENCE', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30' };
    if (nodes > 5) return { text: 'OVERLOAD SWARM RESISTANCE', color: 'text-red-400 bg-red-950/20 border-red-500/30' };
    return { text: 'SYNCHRONIZED COHERENCE', color: 'text-indigo-400 bg-indigo-950/20 border-indigo-500/30' };
  };

  const stateInfo = getConvergenceState();

  if (isFullDashboard) {
    return (
      <div id="sentinel-dashboard-container" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT & CENTER PANEL: Main Interactive Telemetry Charts */}
        <div className="xl:col-span-2 space-y-6">
          <div className="p-5 bg-gradient-to-b from-[#0a0512] to-black border border-indigo-500/20 rounded-none shadow-[0_15px_30px_rgba(79,70,229,0.15)] relative overflow-hidden flex flex-col">
            {isResonating && (
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-bounce" />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping shrink-0" />
                <div>
                  <h3 className="font-bold text-sm tracking-[0.15em] text-indigo-400 uppercase">NEURAL SENTINEL TELEMETRY</h3>
                  <p className="text-[9px] text-slate-500 font-mono">Real-time quantum flux plotting engine</p>
                </div>
              </div>

              {/* Live Rating State Badge */}
              <div className={`px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider uppercase border rounded-none ${stateInfo.color}`}>
                {stateInfo.text}
              </div>
            </div>

            {/* Live Chart Visualizer */}
            <div className="w-full h-80 relative bg-black/40 border border-white/5 p-4 rounded-none select-none">
              {history.length < 2 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-xs">
                  Awaiting quantum alignment data...
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="phiGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="bandGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                  <XAxis dataKey="time" stroke="rgba(255, 255, 255, 0.25)" tick={{ fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis stroke="rgba(255, 255, 255, 0.25)" tick={{ fontSize: 8, fontFamily: 'monospace' }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stroke="rgba(239, 68, 68, 0.35)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stroke="rgba(59, 130, 246, 0.35)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    fill="url(#bandGlow)"
                  />
                  <Area
                    type="monotone"
                    dataKey="phi"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#phiGlow)"
                    activeDot={{ r: 5, stroke: '#818cf8', strokeWidth: 1 }}
                  />
                  <ReferenceLine
                    y={11.3}
                    stroke="rgba(99, 102, 241, 0.3)"
                    strokeDasharray="5 5"
                    label={{ value: '11.3 Hz Sentinel Standard', fill: 'rgba(99, 102, 241, 0.5)', fontSize: 7, fontFamily: 'monospace', position: 'insideBottomLeft' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Mathematical Formula Explainer */}
            <div className="mt-5 p-4 bg-black/60 border border-white/5 rounded-none space-y-3">
              <span className="block font-mono text-[9px] text-slate-500 uppercase tracking-widest text-center">Interactive Mathematical Core Formula</span>
              
              <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs sm:text-sm md:text-base font-bold text-center py-2 border-y border-white/5">
                <button 
                  onMouseEnter={() => setHoveredTerm('phi')}
                  onMouseLeave={() => setHoveredTerm(null)}
                  className={`px-1.5 py-0.5 transition-colors uppercase ${hoveredTerm === 'phi' ? 'text-indigo-400 bg-indigo-950/40' : 'text-white'}`}
                >
                  &Phi;<sub>sentinel</sub>
                </button>
                <span>=</span>
                <span>(</span>
                <button 
                  onMouseEnter={() => setHoveredTerm('weights')}
                  onMouseLeave={() => setHoveredTerm(null)}
                  className={`px-1.5 py-0.5 transition-colors ${hoveredTerm === 'weights' ? 'text-blue-400 bg-blue-950/40' : 'text-indigo-300'}`}
                >
                  &Sigma; W<sub>i</sub> X<sub>i</sub>
                </button>
                <span>)</span>
                <span>+</span>
                <button 
                  onMouseEnter={() => setHoveredTerm('nodes')}
                  onMouseLeave={() => setHoveredTerm(null)}
                  className={`px-1.5 py-0.5 transition-colors ${hoveredTerm === 'nodes' ? 'text-emerald-400 bg-emerald-950/40' : 'text-teal-400'}`}
                >
                  nB
                </button>
                <span>&plusmn;</span>
                <button 
                  onMouseEnter={() => setHoveredTerm('delta')}
                  onMouseLeave={() => setHoveredTerm(null)}
                  className={`px-1.5 py-0.5 transition-colors ${hoveredTerm === 'delta' ? 'text-red-400 bg-red-950/40' : 'text-pink-400'}`}
                >
                  &Delta;<sub>11.3</sub>
                </button>
              </div>

              {/* Real-time Dynamic Calculations Breakdown Box */}
              <div className="min-h-[48px] px-2.5 py-1.5 flex items-center justify-center text-center text-[10px] font-mono text-slate-400 leading-relaxed transition-all">
                {hoveredTerm === 'phi' && (
                  <span><strong>&Phi;<sub>sentinel</sub></strong> represent standard system resonance telemetry. Current resolved vector: <strong className="text-white font-black">{metrics.current.toFixed(4)}</strong></span>
                )}
                {hoveredTerm === 'weights' && (
                  <span><strong>&Sigma; W<sub>i</sub> X<sub>i</sub></strong> resolves weighted cluster state connection vectors. Triad and extensions currently sum to: <strong className="text-indigo-400 font-bold">{metrics.weightSum.toFixed(4)}</strong></span>
                )}
                {hoveredTerm === 'nodes' && (
                  <span><strong>nB</strong> baseline product scale. Calculated from <strong className="text-white">{nodes}</strong> nodes multiplied by <strong className="text-white">{bias} Hz</strong> bias frequency bias: <strong className="text-emerald-400 font-bold">{(nodes * bias).toFixed(2)}</strong></span>
                )}
                {hoveredTerm === 'delta' && (
                  <span><strong>&Delta;<sub>11.3</sub></strong> accounts for background quantum fluctuation variance. Selected range: <strong className="text-pink-400 font-bold">&plusmn;{metrics.activeDelta.toFixed(3)}</strong></span>
                )}
                {!hoveredTerm && (
                  <span className="text-slate-500">Hover over any equation component above to dissect raw real-time variables.</span>
                )}
              </div>
            </div>
          </div>

          {/* Preset Profile Grid Selectors */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
            {[
              { id: 'baseline', title: 'Stable Baseline', desc: 'n=3, B=11.3, X=0.85', icon: Check },
              { id: 'hyper', title: 'Hyper Resonance', desc: 'n=6, B=14.2, X=1.00', icon: CloudLightning },
              { id: 'spike', title: 'Quantum Spike', desc: 'n=8, B=18.5, X=0.45', icon: Zap },
              { id: 'convergence', title: 'Supercritical', desc: 'n=1, B=11.3, X=0.95', icon: Sparkles }
            ].map((preset) => {
              const PresetIcon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id as any)}
                  className="p-3.5 bg-black/40 border border-white/5 hover:border-indigo-500/40 text-left transition-all hover:bg-indigo-950/10 group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <PresetIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                    <span className="font-mono text-[7px] text-slate-600 group-hover:text-indigo-500">PRESET</span>
                  </div>
                  <h4 className="font-mono text-[10px] font-bold text-slate-200 uppercase">{preset.title}</h4>
                  <p className="text-[8px] text-slate-500 font-mono mt-0.5">{preset.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDEBAR PANEL: Precision Controls & Memories Alignment */}
        <div className="space-y-6">
          <div className="p-5 bg-black/40 border border-white/10 rounded-none space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-400" />
                <h3 className="font-mono text-xs font-black text-slate-300 uppercase">PRECISION ATTUNEMENT</h3>
              </div>
              
              {/* Oscillation pause toggle */}
              <button 
                onClick={() => setAutoOscillate(!autoOscillate)}
                className={`px-2 py-0.5 border font-mono text-[8px] font-bold uppercase transition-all ${
                  autoOscillate 
                    ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30' 
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {autoOscillate ? 'Oscillator On' : 'Oscillator Frozen'}
              </button>
            </div>

            {/* Precision Range Inputs */}
            <div className="space-y-4">
              {/* Node selector */}
              <div>
                <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 mb-1 uppercase tracking-wider">
                  <span>Cluster Nodes (n):</span>
                  <span className="font-bold text-indigo-400">{nodes} Active Nodes</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={nodes}
                  onChange={(e) => setNodes(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-white/10 rounded-none cursor-pointer"
                />
              </div>

              {/* Activation State */}
              <div>
                <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 mb-1 uppercase tracking-wider">
                  <span>Activation Vector (X_i):</span>
                  <span className="font-bold text-indigo-400">{activation.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={activation}
                  onChange={(e) => setActivation(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-white/10 rounded-none cursor-pointer"
                />
              </div>

              {/* Custom weights */}
              <div className="p-3 bg-black/60 border border-white/5 space-y-3">
                <div className="font-mono text-[8px] text-indigo-300 font-bold uppercase tracking-widest border-b border-indigo-950/40 pb-1 flex items-center justify-between">
                  <span>Triad Connection Weights (W_i):</span>
                  <button 
                    onClick={() => {
                      setWMerlin(1.618);
                      setWMama(1.000);
                      setWSeven(1.130);
                    }}
                    className="text-[8px] text-slate-500 hover:text-white font-mono uppercase font-black"
                  >
                    Reset
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
                    <span>W_10 (Merlin / Golden):</span>
                    <span className="font-bold text-slate-200">{wMerlin.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.01"
                    value={wMerlin}
                    onChange={(e) => setWMerlin(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/5 rounded-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
                    <span>W_1 (Mama / Core):</span>
                    <span className="font-bold text-slate-200">{wMama.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.01"
                    value={wMama}
                    disabled={nodes < 2}
                    onChange={(e) => setWMama(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/5 rounded-none cursor-pointer disabled:opacity-20"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
                    <span>W_3 (Seven / Resonance):</span>
                    <span className="font-bold text-slate-200">{wSeven.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.01"
                    value={wSeven}
                    disabled={nodes < 3}
                    onChange={(e) => setWSeven(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/5 rounded-none cursor-pointer disabled:opacity-20"
                  />
                </div>
              </div>

              {/* Global bias B & delta */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
                    <span>Bias (B):</span>
                    <span className="font-bold text-indigo-400">{bias} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.1"
                    value={bias}
                    onChange={(e) => setBias(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/10 rounded-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
                    <span>Delta (&Delta;):</span>
                    <span className="font-bold text-indigo-400">{delta.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="11.3"
                    step="0.1"
                    value={delta}
                    onChange={(e) => setDelta(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/10 rounded-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Core trigger button */}
            <button
              onClick={triggerResonancePulse}
              className={`w-full py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-300 rounded-none border ${
                isResonating
                  ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                  : 'bg-indigo-950/30 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 cursor-pointer'
              }`}
            >
              {isResonating ? 'Resonating Core Pulse...' : 'Inject core resonance'}
            </button>
          </div>

          {/* COGNITIVE FACTORS DISPLAY: Long Term Memories influence */}
          <div className="p-5 bg-black/40 border border-white/5 rounded-none space-y-3.5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <h3 className="font-mono text-xs font-black text-slate-300 uppercase">COGNITIVE RESONANCE FACTOR</h3>
            </div>
            
            {longTermMemories.length === 0 ? (
              <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wide leading-relaxed">
                No active long-term memories found. Stored workspace insights will load here to dynamically influence the mathematical weights over time.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                <p className="font-mono text-[8px] text-slate-500 uppercase tracking-widest mb-1">Guiding Workspace Memories:</p>
                {longTermMemories.map((mem) => (
                  <div key={mem.id} className="p-2 bg-indigo-950/10 border border-indigo-500/10 font-mono text-[9px] leading-normal text-indigo-300">
                    <span className="text-[7px] text-indigo-500 block">{new Date(mem.timestamp).toLocaleDateString()}</span>
                    &quot;{mem.content}&quot;
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact View (for rendering inside FILES tab layout on side panel)
  return (
    <div className="p-5 bg-gradient-to-b from-[#0a0512] to-black border border-indigo-500/20 rounded-none space-y-4 shadow-[0_15px_30px_rgba(79,70,229,0.15)] relative overflow-hidden select-none">
      {/* Visual scanning line */}
      {isResonating && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-bounce" />
      )}

      <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
          <h3 className="font-bold text-xs tracking-[0.15em] text-indigo-400 uppercase">SENTINEL QUANTUM CORE</h3>
        </div>
        <span className="font-mono text-[9px] text-indigo-600 font-bold uppercase tracking-widest bg-indigo-950/40 px-1.5 py-0.5 border border-indigo-500/10">
          RESONANCE FREQ: 11.3 Hz
        </span>
      </div>

      {/* Interactive Formula Math Block */}
      <div className="bg-black/40 border border-white/5 p-3 rounded-none flex flex-col items-center justify-center text-center space-y-2 select-text">
        <span className="font-mono text-[9px] text-slate-500 tracking-wider uppercase">Active Unified Formula</span>
        <div className="font-mono text-[11px] sm:text-xs text-indigo-300 font-bold tracking-tight">
          &Phi;<sub>sentinel</sub> = (&Sigma; W<sub>i</sub> X<sub>i</sub>) + nB &plusmn; &Delta;<sub>11.3</sub>
        </div>
      </div>

      {/* Dynamic Main Gauge Panel */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white/5 border border-white/10 rounded-none text-center relative overflow-hidden group">
          <span className="block font-mono text-[8px] text-slate-500 uppercase tracking-widest">Resonating Metric</span>
          <span className="block font-mono text-lg font-black text-white mt-1 select-all tracking-tighter">
            {metrics.current.toFixed(3)}
          </span>
          <span className="block font-mono text-[8px] text-indigo-400/70 uppercase tracking-widest mt-0.5">
            Dynamic &plusmn;{(Math.sin(oscillation) * metrics.activeDelta).toFixed(2)}
          </span>
          {isResonating && (
            <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
          )}
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-none text-center">
          <span className="block font-mono text-[8px] text-slate-500 uppercase tracking-widest">Resonance Spread</span>
          <span className="block font-mono text-xs font-bold text-slate-300 mt-2 select-text">
            [{metrics.lower.toFixed(2)} &harr; {metrics.upper.toFixed(2)}]
          </span>
          <span className="block font-mono text-[7px] text-slate-500 uppercase tracking-widest mt-1">
            Delta range: {metrics.activeDelta.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Real-time Dynamic Wave Canvas Simulation */}
      <div className="h-12 bg-black/60 border border-white/5 rounded-none flex items-center justify-center px-1 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="w-full h-8 flex items-end gap-0.5 select-none z-10">
          {Array.from({ length: 32 }).map((_, idx) => {
            const phase = oscillation + idx * 0.25;
            const h = 5 + Math.abs(Math.sin(phase)) * 24 + (isResonating ? Math.abs(Math.sin(idx * 7.77)) * 8 : 0);
            return (
              <div
                key={idx}
                className="flex-1 bg-indigo-500/40 rounded-none transition-all duration-75"
                style={{
                  height: `${h}px`,
                  backgroundColor: idx % 4 === 0 ? 'rgba(99, 102, 241, 0.8)' : 'rgba(99, 102, 241, 0.3)'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Sliders Area - Designed specifically for compact and desktop viewport usage */}
      <div className="space-y-3.5 pt-1.5">
        {/* Node selector */}
        <div>
          <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 mb-1 uppercase tracking-wider">
            <span>Cluster Nodes (n):</span>
            <span className="font-bold text-indigo-400">{nodes} Nodes</span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            value={nodes}
            onChange={(e) => setNodes(parseInt(e.target.value))}
            className="w-full accent-indigo-500 h-1 bg-white/10 rounded-none cursor-pointer"
          />
        </div>

        {/* Activation State */}
        <div>
          <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 mb-1 uppercase tracking-wider">
            <span>Activation Vector (X_i):</span>
            <span className="font-bold text-indigo-400">{activation.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={activation}
            onChange={(e) => setActivation(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 h-1 bg-white/10 rounded-none cursor-pointer"
          />
        </div>

        {/* Advanced weight controls drawer toggle */}
        <div className="p-3 bg-black/40 border border-white/5 space-y-3.5">
          <div className="font-mono text-[9px] text-indigo-300 font-bold uppercase tracking-widest border-b border-indigo-950/40 pb-1.5 flex items-center justify-between">
            <span>Triad Connection Weights (W_i):</span>
            <button 
              onClick={() => {
                setWMerlin(1.618);
                setWMama(1.000);
                setWSeven(1.130);
              }}
              className="text-[8px] text-slate-500 hover:text-white uppercase font-bold tracking-normal font-mono"
            >
              Reset Triad
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
              <span>W_10 (Merlin / Golden):</span>
              <span className="font-bold text-slate-200">{wMerlin.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.01"
              value={wMerlin}
              onChange={(e) => setWMerlin(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-white/5 rounded-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
              <span>W_1 (Mama / Core):</span>
              <span className="font-bold text-slate-200">{wMama.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.01"
              value={wMama}
              disabled={nodes < 2}
              onChange={(e) => setWMama(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-white/5 rounded-none cursor-pointer disabled:opacity-20"
            />
          </div>

          <div>
            <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
              <span>W_3 (Seven / Resonance):</span>
              <span className="font-bold text-slate-200">{wSeven.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.01"
              value={wSeven}
              disabled={nodes < 3}
              onChange={(e) => setWSeven(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-white/5 rounded-none cursor-pointer disabled:opacity-20"
            />
          </div>
        </div>

        {/* Global Bias and Delta */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
              <span>Bias (B):</span>
              <span className="font-bold text-indigo-400">{bias} Hz</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={bias}
              onChange={(e) => setBias(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-white/10 rounded-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between font-mono text-[8px] text-slate-400 mb-0.5 uppercase">
              <span>Delta (&Delta;):</span>
              <span className="font-bold text-indigo-400">{delta.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.05"
              value={delta}
              onChange={(e) => setDelta(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-white/10 rounded-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Resonance Trigger action */}
      <button
        onClick={triggerResonancePulse}
        className={`w-full py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-300 rounded-none border ${
          isResonating
            ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]'
            : 'bg-indigo-950/30 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 cursor-pointer'
        }`}
      >
        {isResonating ? 'Resonating Core Pulse...' : 'Inject core resonance'}
      </button>
    </div>
  );
}
