'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Cpu,
  Database,
  Play,
  Square,
  RefreshCw,
  Layers,
  Zap,
  CheckCircle2,
  XCircle,
  Terminal,
  ShieldCheck,
  Activity,
  Plus,
  Trash,
  Link,
  Link2Off,
  Wrench,
  Server,
  Send,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface OllamaModel {
  name: string;
  model?: string;
  size?: number;
  digest?: string;
  modified_at?: string;
}

interface OllamaStatus {
  running: boolean;
  models: OllamaModel[];
  version: string;
}

interface MPCNode {
  id: string;
  name: string;
  ip: string;
  port: string;
  status: 'connected' | 'disconnected';
  latency: number;
  models: number;
  error: string;
}

interface MCPTool {
  server: string;
  tool: string;
  summary: string;
  description: string;
}

const LS_NODES = 'sage7-mlhub-nodes';
const LS_MODELS_VIEW = 'sage7-mlhub-view';

function loadNodes(): MPCNode[] {
  if (typeof window === 'undefined') return defaultNodes();
  try {
    const raw = localStorage.getItem(LS_NODES);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultNodes();
}

function defaultNodes(): MPCNode[] {
  return [
    { id: '1', name: 'LOCAL_DAEMON', ip: '127.0.0.1', port: '11434', status: 'disconnected', latency: -1, models: 0, error: '' },
  ];
}

function saveNodes(nodes: MPCNode[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_NODES, JSON.stringify(nodes)); } catch { /* ignore */ }
}

export default function ScreenMLHub() {
  const [view, setView] = useState<'overview' | 'mpc' | 'mcp'>('overview');
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [actionLoading, setActionLoading] = useState<'start' | 'stop' | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const [nodes, setNodes] = useState<MPCNode[]>(loadNodes);
  const [newNode, setNewNode] = useState({ name: '', ip: '', port: '' });
  const [checkingNodes, setCheckingNodes] = useState(false);

  // MCP Tools state
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [mcpParams, setMcpParams] = useState('{}');
  const [mcpResult, setMcpResult] = useState<any>(null);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [mcpInvokeLoading, setMcpInvokeLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('api/ollama/status');
      const data = await res.json();
      setStatus(data);
      setLastError(null);
    } catch {
      setStatus({ running: false, models: [], version: 'unknown' });
    }
  }, []);

  const startOllama = async () => {
    setActionLoading('start');
    try {
      const res = await fetch('api/ollama/start', { method: 'POST' });
      const data = await res.json();
      setStatus(prev => prev ? { ...prev, running: data.success, models: data.models || [] } : { running: data.success, models: data.models || [], version: 'unknown' });
      if (!data.success) setLastError(data.message);
      else setLastError(null);
    } catch (e: any) {
      setLastError(e.message || 'Start failed');
    } finally {
      setActionLoading(null);
      setTimeout(checkStatus, 2000);
    }
  };

  const stopOllama = async () => {
    setActionLoading('stop');
    try {
      const res = await fetch('api/ollama/stop', { method: 'POST' });
      const data = await res.json();
      setStatus(prev => prev ? { ...prev, running: !data.success } : { running: false, models: [], version: 'unknown' });
      if (!data.success) setLastError(data.message);
      else setLastError(null);
    } catch (e: any) {
      setLastError(e.message || 'Stop failed');
    } finally {
      setActionLoading(null);
      setTimeout(checkStatus, 2000);
    }
  };

  const scanNodes = async () => {
    setCheckingNodes(true);
    try {
      const res = await fetch('api/nodes/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: nodes.map(n => ({ name: n.name, ip: n.ip, port: n.port })) })
      });
      const data = await res.json();
      if (data.results) {
        setNodes(prev => prev.map(n => {
          const r = data.results.find((x: any) => x.name === n.name && x.ip === n.ip && x.port === n.port);
          if (!r) return n;
          return { ...n, status: r.online ? 'connected' : 'disconnected', latency: r.latency, models: r.models, error: r.error || '' };
        }));
      }
    } catch (e) {
      console.error('Node scan failed:', e);
    } finally {
      setCheckingNodes(false);
    }
  };

  const addNode = () => {
    if (!newNode.name || !newNode.ip || !newNode.port) return;
    const created: MPCNode = {
      id: Math.random().toString(36).slice(2, 9),
      name: newNode.name,
      ip: newNode.ip,
      port: newNode.port,
      status: 'disconnected',
      latency: -1,
      models: 0,
      error: ''
    };
    setNodes(prev => [...prev, created]);
    setNewNode({ name: '', ip: '', port: '' });
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  useEffect(() => {
    saveNodes(nodes);
  }, [nodes]);

  // MCP Tools fetch
  const fetchMcpTools = useCallback(async () => {
    setMcpLoading(true);
    setMcpError(null);
    try {
      const res = await fetch('/api/mcp/tools');
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.tools)) {
        setMcpTools(data.tools);
      } else {
        setMcpError(data.message || 'Failed to fetch MCP tools');
      }
    } catch (e: any) {
      setMcpError(e.message || 'Network error fetching MCP tools');
    } finally {
      setMcpLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'mcp' && mcpTools.length === 0) {
      fetchMcpTools();
    }
  }, [view, fetchMcpTools, mcpTools.length]);

  const invokeMcpTool = async () => {
    if (!selectedTool) return;
    setMcpInvokeLoading(true);
    setMcpResult(null);
    setMcpError(null);
    try {
      let payload: any = {};
      try {
        payload = JSON.parse(mcpParams);
      } catch {
        setMcpError('Invalid JSON in parameters');
        setMcpInvokeLoading(false);
        return;
      }
      const res = await fetch(`/api/mcp/${selectedTool.server}/${selectedTool.tool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setMcpResult(data);
    } catch (e: any) {
      setMcpError(e.message || 'Invocation failed');
    } finally {
      setMcpInvokeLoading(false);
    }
  };

  const groupedTools = mcpTools.reduce<Record<string, MCPTool[]>>((acc, tool) => {
    if (!acc[tool.server]) acc[tool.server] = [];
    acc[tool.server].push(tool);
    return acc;
  }, {});

  const isRunning = status?.running ?? false;
  const modelCount = status?.models?.length ?? 0;
  const connectedCount = nodes.filter(n => n.status === 'connected').length;
  const avgLatency = connectedCount > 0
    ? Math.round(nodes.filter(n => n.status === 'connected' && n.latency > 0).reduce((a, n) => a + n.latency, 0) / connectedCount)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu size={20} className="text-neon-blue" />
          <h2 className="font-orbitron text-lg font-bold text-text-bright tracking-wider">ML HUB</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('overview')}
            className={cn(
              "text-[10px] font-bold uppercase px-3 py-1.5 border rounded-sm tracking-wider transition-all",
              view === 'overview'
                ? "bg-neon-blue/10 text-neon-blue border-neon-blue/30"
                : "bg-transparent text-text-ghost border-border-subtle hover:text-text-bright"
            )}
          >
            Ollama
          </button>
          <button
            onClick={() => setView('mpc')}
            className={cn(
              "text-[10px] font-bold uppercase px-3 py-1.5 border rounded-sm tracking-wider transition-all",
              view === 'mpc'
                ? "bg-neon-violet/10 text-neon-violet border-neon-violet/30"
                : "bg-transparent text-text-ghost border-border-subtle hover:text-text-bright"
            )}
          >
            MPC Nodes
          </button>
          <button
            onClick={() => setView('mcp')}
            className={cn(
              "text-[10px] font-bold uppercase px-3 py-1.5 border rounded-sm tracking-wider transition-all",
              view === 'mcp'
                ? "bg-neon-green/10 text-neon-green border-neon-green/30"
                : "bg-transparent text-text-ghost border-border-subtle hover:text-text-bright"
            )}
          >
            MCP Tools
          </button>
          <span className={cn(
            "text-[10px] font-bold uppercase px-2 py-1 border rounded-sm tracking-wider",
            isRunning
              ? "bg-neon-green/10 text-neon-green border-neon-green/20"
              : "bg-neon-red/10 text-neon-red border-neon-red/20"
          )}>
            {status === null ? '...' : isRunning ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {view === 'overview' ? (
        <>
          {/* Ollama Control Card */}
          <div className="border border-border-subtle bg-panel rounded-[4px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-50" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-neon-blue opacity-70" />
                  <span className="text-[10px] font-bold text-text-ghost uppercase tracking-[3px]">Ollama Runtime</span>
                </div>
                <span className="text-[10px] font-mono text-text-dim">{modelCount} model(s)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <StatCard label="Status" value={isRunning ? 'Running' : 'Stopped'} icon={isRunning ? CheckCircle2 : XCircle} color={isRunning ? 'text-neon-green' : 'text-neon-red'} />
                <StatCard label="Models" value={String(modelCount)} icon={Layers} color="text-neon-violet" />
                <StatCard label="Version" value={status?.version || '—'} icon={Terminal} color="text-neon-cyan" />
              </div>

              {lastError && (
                <div className="mb-3 px-3 py-2 bg-neon-red/5 border border-neon-red/20 rounded-sm text-[11px] text-neon-red font-mono">
                  {lastError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={startOllama}
                  disabled={actionLoading === 'start' || isRunning}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all border",
                    isRunning
                      ? "bg-white/5 text-text-ghost border-border-subtle cursor-not-allowed opacity-40"
                      : "bg-neon-blue/10 text-neon-blue border-neon-blue/30 hover:bg-neon-blue/20"
                  )}
                >
                  {actionLoading === 'start' ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                  Start Ollama
                </button>
                <button
                  onClick={stopOllama}
                  disabled={actionLoading === 'stop' || !isRunning}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all border",
                    !isRunning
                      ? "bg-white/5 text-text-ghost border-border-subtle cursor-not-allowed opacity-40"
                      : "bg-neon-red/10 text-neon-red border-neon-red/30 hover:bg-neon-red/20"
                  )}
                >
                  {actionLoading === 'stop' ? <RefreshCw size={12} className="animate-spin" /> : <Square size={12} />}
                  Stop
                </button>
                <button
                  onClick={checkStatus}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all border border-border-subtle text-text-dim hover:bg-white/5 hover:text-text-bright"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Model List */}
          <div className="border border-border-subtle bg-panel rounded-[4px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-violet to-transparent opacity-50" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-neon-violet/5">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-neon-violet" />
                <span className="font-orbitron text-[10px] font-bold text-neon-violet tracking-[3px] uppercase">Model Library</span>
              </div>
              <span className="text-[9px] font-mono text-text-ghost">{modelCount} ENTRIES</span>
            </div>

            <div className="divide-y divide-border-subtle/30">
              {status?.models && status.models.length > 0 ? (
                status.models.map((model, idx) => (
                  <motion.div
                    key={model.name + idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Database size={14} className="text-text-ghost opacity-40 group-hover:text-neon-blue group-hover:opacity-100 transition-all" />
                      <div>
                        <div className="text-[11px] font-bold text-text-bright font-mono">{model.name}</div>
                        <div className="text-[9px] font-mono text-text-ghost">
                          {model.digest ? model.digest.slice(0, 12) : '—'} {model.size ? `· ${(model.size / 1024 / 1024 / 1024).toFixed(2)} GB` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-sm font-bold uppercase">
                        Ready
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-[11px] text-text-ghost">
                  {status === null ? 'Loading models...' : 'No models loaded. Start Ollama to populate the library.'}
                </div>
              )}
            </div>
          </div>
        </>
      ) : view === 'mpc' ? (
        /* MPC Nodes View */
        <div className="space-y-6">
          {/* Protocol & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border-subtle bg-panel rounded-[4px] p-4">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider text-text-bright flex items-center gap-2">
                <ShieldCheck size={14} className="text-neon-blue" /> Active Protocols
              </h3>
              <div className="space-y-2">
                <ProtocolItem label="Standard" value="SPDZ-2 / MASCOT" />
                <ProtocolItem label="Field Type" value="Prime GF(p)" />
                <ProtocolItem label="Shares" value="Additive (n-1)" />
                <ProtocolItem label="Corruptions" value="Malicious (Up to n-1)" />
              </div>
            </div>

            <div className="border border-border-subtle bg-panel rounded-[4px] p-4">
              <h3 className="text-xs font-bold mb-3 uppercase tracking-wider text-text-bright flex items-center gap-2">
                <Activity size={14} className="text-neon-green" /> Topology Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                  <span className="text-text-ghost flex-1">Network Stability</span>
                  <span className="font-mono text-neon-green">{connectedCount > 0 ? '100%' : '0%'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-blue" />
                  <span className="text-text-ghost flex-1">Active Channels</span>
                  <span className="font-mono text-neon-blue">{connectedCount} / {nodes.length}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-gold" />
                  <span className="text-text-ghost flex-1">Average Latency</span>
                  <span className="font-mono text-neon-gold">{avgLatency > 0 ? `${avgLatency}ms` : '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Node Management */}
          <div className="border border-border-subtle bg-panel rounded-[4px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-violet to-transparent opacity-50" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-neon-violet/5">
              <span className="font-orbitron text-[10px] font-bold text-neon-violet tracking-[3px] uppercase">Node Infrastructure</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-text-ghost">{nodes.length} UNITS</span>
                <button
                  onClick={scanNodes}
                  disabled={checkingNodes}
                  className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-sm hover:bg-neon-blue/20 transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={10} className={checkingNodes ? 'animate-spin' : ''} />
                  {checkingNodes ? 'Scanning...' : 'Scan'}
                </button>
              </div>
            </div>

            {/* Add Node Form */}
            <div className="p-3 bg-black/20 border-b border-border-subtle grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                placeholder="Node Name"
                value={newNode.name}
                onChange={e => setNewNode({ ...newNode, name: e.target.value })}
                className="bg-void border border-border-subtle px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-neon-blue transition-all text-text-bright rounded-sm"
              />
              <input
                placeholder="IP Address"
                value={newNode.ip}
                onChange={e => setNewNode({ ...newNode, ip: e.target.value })}
                className="bg-void border border-border-subtle px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-neon-blue transition-all text-text-bright rounded-sm"
              />
              <input
                placeholder="Port"
                value={newNode.port}
                onChange={e => setNewNode({ ...newNode, port: e.target.value })}
                className="bg-void border border-border-subtle px-2 py-1.5 text-[10px] font-mono focus:outline-none focus:border-neon-blue transition-all text-text-bright rounded-sm"
              />
              <button
                onClick={addNode}
                className="bg-neon-blue text-white text-[10px] font-bold uppercase py-1.5 px-3 rounded-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
              >
                <Plus size={12} /> Add Node
              </button>
            </div>

            {/* Nodes List */}
            <div className="divide-y divide-border-subtle/30">
              {nodes.map(node => (
                <div key={node.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      node.status === 'connected'
                        ? "bg-neon-green shadow-[0_0_4px_rgba(74,222,128,0.4)]"
                        : "bg-neon-red/40"
                    )} />
                    <div>
                      <div className="text-[11px] font-bold text-text-bright">{node.name}</div>
                      <div className="text-[9px] font-mono text-text-ghost uppercase">{node.ip}:{node.port}</div>
                      {node.status === 'connected' && node.latency > 0 && (
                        <div className="text-[9px] font-mono text-neon-green">{node.latency}ms · {node.models} models</div>
                      )}
                      {node.error && (
                        <div className="text-[9px] font-mono text-neon-red">{node.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 border rounded-sm font-bold uppercase",
                      node.status === 'connected'
                        ? "bg-neon-green/10 text-neon-green border-neon-green/20"
                        : "bg-neon-red/10 text-neon-red border-neon-red/20"
                    )}>
                      {node.status === 'connected' ? 'ONLINE' : 'OFFLINE'}
                    </span>
                    <button
                      onClick={() => removeNode(node.id)}
                      className="p-1.5 text-text-ghost hover:text-neon-red hover:bg-neon-red/10 rounded-sm transition-all"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* MCP Tools View */
        <div className="space-y-6">
          {/* MCP Status Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-neon-green" />
              <span className="font-orbitron text-[10px] font-bold text-neon-green tracking-[3px] uppercase">
                MCP Tool Console
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-text-ghost">
                {mcpTools.length} TOOL{mcpTools.length !== 1 ? 'S' : ''} ACROSS {Object.keys(groupedTools).length} SERVER{Object.keys(groupedTools).length !== 1 ? 'S' : ''}
              </span>
              <button
                onClick={fetchMcpTools}
                disabled={mcpLoading}
                className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-sm hover:bg-neon-green/20 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={10} className={mcpLoading ? 'animate-spin' : ''} />
                {mcpLoading ? 'Scanning...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
            {/* Tool List */}
            <div className="border border-border-subtle bg-panel rounded-[4px] relative overflow-hidden max-h-[600px] flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-50" />
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-neon-green/5">
                <span className="font-orbitron text-[10px] font-bold text-neon-green tracking-[3px] uppercase">Available Tools</span>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {mcpLoading && mcpTools.length === 0 && (
                  <div className="text-center py-8 text-text-ghost text-[11px]">Discovering MCP servers...</div>
                )}
                {Object.entries(groupedTools).map(([server, tools]) => (
                  <div key={server} className="mb-3">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-text-dim">
                      <Server size={10} className="text-neon-blue" />
                      {server}
                    </div>
                    {tools.map((tool, idx) => (
                      <button
                        key={`${server}-${tool.tool}-${idx}`}
                        onClick={() => {
                          setSelectedTool(tool);
                          setMcpResult(null);
                          setMcpError(null);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-sm transition-all border border-transparent",
                          selectedTool?.server === tool.server && selectedTool?.tool === tool.tool
                            ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                            : "hover:bg-white/5 text-text-dim hover:text-text-bright"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <ChevronRight size={10} />
                          <span className="text-[10px] font-mono font-bold">{tool.tool}</span>
                        </div>
                        {tool.summary && (
                          <div className="text-[9px] text-text-ghost mt-0.5 truncate">{tool.summary}</div>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
                {!mcpLoading && mcpTools.length === 0 && (
                  <div className="text-center py-8 text-text-ghost text-[11px]">
                    No MCP tools discovered.<br />Ensure mcpo is running on port 3030.
                  </div>
                )}
              </div>
            </div>

            {/* Tool Invocation Panel */}
            <div className="border border-border-subtle bg-panel rounded-[4px] relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-50" />
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-neon-blue/5">
                <span className="font-orbitron text-[10px] font-bold text-neon-blue tracking-[3px] uppercase">
                  {selectedTool ? `${selectedTool.server} / ${selectedTool.tool}` : 'Select a Tool'}
                </span>
              </div>

              <div className="p-4 space-y-4 flex-1">
                {selectedTool ? (
                  <>
                    {selectedTool.description && (
                      <div className="text-[11px] text-text-dim leading-relaxed bg-black/20 p-3 rounded-sm border border-border-subtle/30">
                        {selectedTool.description}
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-text-ghost mb-1.5 block">Parameters (JSON)</label>
                      <textarea
                        value={mcpParams}
                        onChange={e => setMcpParams(e.target.value)}
                        className="w-full h-32 bg-void border border-border-subtle rounded-sm p-3 text-[11px] font-mono text-text-bright focus:outline-none focus:border-neon-blue transition-all resize-none"
                        placeholder='{"path": "/tmp", "recursive": true}'
                        spellCheck={false}
                      />
                    </div>

                    <button
                      onClick={invokeMcpTool}
                      disabled={mcpInvokeLoading}
                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all border bg-neon-blue/10 text-neon-blue border-neon-blue/30 hover:bg-neon-blue/20 disabled:opacity-40"
                    >
                      {mcpInvokeLoading ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                      Invoke Tool
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-text-ghost">
                    <Wrench size={32} className="opacity-20 mb-3" />
                    <div className="text-[11px] font-mono uppercase tracking-widest">Select a tool from the list</div>
                  </div>
                )}

                {mcpError && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-neon-red/5 border border-neon-red/20 rounded-sm text-[11px] text-neon-red font-mono">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    {mcpError}
                  </div>
                )}

                {mcpResult !== null && (
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-text-ghost">Result</div>
                    <pre className="bg-black/30 border border-border-subtle rounded-sm p-3 text-[10px] font-mono text-neon-green overflow-x-auto max-h-[300px] overflow-y-auto">
                      {JSON.stringify(mcpResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="border border-border-subtle/30 p-3 rounded bg-void/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} className={color} />
        <div className="text-[9px] text-text-ghost font-mono uppercase">{label}</div>
      </div>
      <div className={cn("font-orbitron font-bold text-sm", color)}>{value}</div>
    </div>
  );
}

function ProtocolItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-[10px] py-1 border-b border-border-subtle/30 last:border-0">
      <span className="text-text-ghost uppercase">{label}</span>
      <span className="text-text-bright font-mono">{value}</span>
    </div>
  );
}
