import { Shield, ShieldAlert, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useArgusStore, ThreatLevel, McpStatus, BridgeStatus } from '../../store/useArgusStore';
import { MCP_REGISTRY } from '../../data/mcpRegistry';
import { SparkCore } from '../core/SparkCore';

// ── shared colour maps ────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<ThreatLevel, string> = {
  clean:    'text-emerald-500',
  low:      'text-yellow-400',
  medium:   'text-orange-400',
  high:     'text-red-400',
  critical: 'text-red-300',
};

const LEVEL_BG: Record<ThreatLevel, string> = {
  clean:    'bg-emerald-950/20 border-emerald-900/20',
  low:      'bg-yellow-950/20 border-yellow-900/20',
  medium:   'bg-orange-950/20 border-orange-900/20',
  high:     'bg-red-950/30 border-red-900/30',
  critical: 'bg-red-950/50 border-red-800/50',
};

function statusDot(s: McpStatus | BridgeStatus) {
  if (s === 'online')     return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]';
  if (s === 'connecting') return 'bg-amber-400 animate-pulse';
  if (s === 'error')      return 'bg-red-500';
  return 'bg-slate-700';
}

// ── Left zone: Data Nodes ─────────────────────────────────────────────────────

function DataNodes() {
  const mcpStatus       = useArgusStore((s) => s.mcpStatus);
  const sageBridgeStatus  = useArgusStore((s) => s.sageBridgeStatus);
  const sevenBridgeStatus = useArgusStore((s) => s.sevenBridgeStatus);

  return (
    <div className="h-full flex flex-col gap-3 overflow-y-auto scrollbar-node pr-1">
      {/* Zone header */}
      <ZoneHeader label="Data Nodes" sub="Agent & MCP connections" />

      {/* Agent cards */}
      <div className="flex flex-col gap-2">
        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest px-1">Agents</p>
        <AgentCard id="seven" status={sevenBridgeStatus} guard="HIGH GUARD" guardColor="text-red-400 bg-red-950/40 border-red-900/30" />
        <AgentCard id="sage"  status={sageBridgeStatus}  guard="STANDARD"   guardColor="text-slate-500 bg-slate-900/40 border-slate-800/30" />
      </div>

      {/* MCP servers */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest px-1 mt-1">MCP Servers</p>
        {MCP_REGISTRY.map((mcp) => (
          <div key={mcp.id}
               className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-950/50 border border-slate-800/30 hover:border-node-900/40 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-[11px]">{mcp.icon}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">{mcp.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[7px] uppercase tracking-wider font-black ${
                mcpStatus[mcp.id] === 'online'
                  ? 'text-emerald-500'
                  : mcpStatus[mcp.id] === 'connecting'
                  ? 'text-amber-400'
                  : mcpStatus[mcp.id] === 'error'
                  ? 'text-red-400'
                  : 'text-slate-700'
              }`}>
                {mcpStatus[mcp.id]}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(mcpStatus[mcp.id])}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentCard({ id, status, guard, guardColor }: {
  id: string;
  status: BridgeStatus;
  guard: string;
  guardColor: string;
}) {
  const live = status === 'online';
  return (
    <div className={`rounded-xl border p-3 transition-all ${
      live
        ? 'bg-node-950/30 border-node-800/40'
        : 'bg-slate-950/30 border-slate-800/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {live
            ? <ShieldCheck className="w-4 h-4 text-emerald-500" />
            : <Shield className="w-4 h-4 text-slate-700" />
          }
          <span className="text-[11px] font-black text-slate-200 uppercase tracking-wider">{id}</span>
        </div>
        <span className={`w-2 h-2 rounded-full ${statusDot(status)}`} />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${guardColor}`}>{guard}</span>
        <div className="flex items-center gap-1">
          {live ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-slate-700" />}
          <span className={`text-[8px] font-black uppercase ${live ? 'text-emerald-500' : 'text-slate-700'}`}>{status}</span>
        </div>
      </div>
    </div>
  );
}

// ── Right zone: Security Hub ──────────────────────────────────────────────────

function SecurityHub() {
  const threatLog  = useArgusStore((s) => s.threatLog);
  const gateStats  = useArgusStore((s) => s.gateStats);

  const highCount = threatLog.filter((t) => t.level === 'high' || t.level === 'critical').length;
  const recent    = [...threatLog].reverse().slice(0, 15);

  return (
    <div className="h-full flex flex-col gap-3 overflow-y-auto scrollbar-node pl-1">
      {/* Zone header */}
      <ZoneHeader label="Security Hub" sub="3-gate threat monitor" />

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-2">
        <StatBlock label="Total" value={threatLog.length} color="text-node-400" />
        <StatBlock label="High/Crit" value={highCount} color={highCount > 0 ? 'text-red-400' : 'text-slate-700'} alert={highCount > 0} />
      </div>

      {/* Gate telemetry */}
      <div className="panel-border rounded-xl p-3">
        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-2">Gate Telemetry</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'G1·PII',  count: gateStats.g1, color: 'text-pink-400' },
            { label: 'G2·SAN',  count: gateStats.g2, color: 'text-amber-400' },
            { label: 'G3·INJ',  count: gateStats.g3, color: 'text-red-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-slate-950/50 rounded-lg p-2 text-center">
              <p className="text-[6px] text-slate-600 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-base font-black ${count > 0 ? color : 'text-slate-700'}`}>{count}</p>
            </div>
          ))}
        </div>
        <p className="text-[6px] text-slate-700 mt-2 text-right tracking-wider">
          {gateStats.total} hits · context G3 active
        </p>
      </div>

      {/* Live threat feed */}
      <div className="panel-border rounded-xl p-3 flex-1 overflow-hidden flex flex-col">
        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-2 shrink-0">Live Threats</p>
        <div className="flex-1 overflow-y-auto scrollbar-node flex flex-col gap-1.5">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <ShieldCheck className="w-7 h-7 text-slate-800" />
              <p className="text-[8px] text-slate-700">No threats detected.</p>
            </div>
          ) : (
            recent.map((t) => (
              <div key={t.id} className={`rounded-lg border p-2 ${LEVEL_BG[t.level]}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className={`w-2.5 h-2.5 ${LEVEL_COLOR[t.level]}`} />
                    <span className={`text-[7px] font-black uppercase ${LEVEL_COLOR[t.level]}`}>{t.level}</span>
                    <span className="text-[6px] text-slate-600 uppercase">{t.source}·{t.gate}</span>
                  </div>
                  <span className="text-[6px] text-slate-700">{(t.confidence * 100).toFixed(0)}%</span>
                </div>
                <p className="text-[8px] text-slate-500 font-mono truncate">{t.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function ZoneHeader({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="shrink-0 pb-2 border-b border-node-900/20">
      <h3 className="text-[10px] font-black tracking-[0.4em] text-node-400 uppercase">{label}</h3>
      <p className="text-[6px] text-slate-700 tracking-widest uppercase mt-0.5">{sub}</p>
    </div>
  );
}

function StatBlock({ label, value, color, alert }: { label: string; value: number; color: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${alert ? 'bg-red-950/20 border-red-900/30' : 'panel-border'}`}>
      <p className="text-[7px] text-slate-600 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

// ── Main DashboardPanel ───────────────────────────────────────────────────────

export function DashboardPanel() {
  return (
    <div className="h-full w-full grid grid-cols-[240px_1fr_240px] gap-0 overflow-hidden">
      {/* Left — Data Nodes */}
      <div className="h-full overflow-hidden border-r border-node-900/20 p-3">
        <DataNodes />
      </div>

      {/* Center — AI Core / SparkCore */}
      <div className="h-full overflow-hidden relative">
        {/* Zone label */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="text-[6px] font-black text-slate-700 tracking-[0.5em] uppercase">AI Core</span>
        </div>
        <SparkCore />
      </div>

      {/* Right — Security Hub */}
      <div className="h-full overflow-hidden border-l border-node-900/20 p-3">
        <SecurityHub />
      </div>
    </div>
  );
}
