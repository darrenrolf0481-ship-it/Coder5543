
import { Eye } from 'lucide-react';
import { useArgusStore, McpStatus, BridgeStatus } from '../../store/useArgusStore';
import { MCP_REGISTRY } from '../../data/mcpRegistry';

function StatusDot({ status, size = 'sm' }: { status: McpStatus | BridgeStatus; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5';
  const color =
    status === 'online'
      ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]'
      : status === 'connecting'
      ? 'bg-amber-400 animate-pulse'
      : status === 'error'
      ? 'bg-red-500'
      : 'bg-slate-700';
  return <span className={`${sz} rounded-full shrink-0 ${color}`} />;
}

export function Header() {
  const mcpStatus = useArgusStore((s) => s.mcpStatus);
  const sageBridgeStatus = useArgusStore((s) => s.sageBridgeStatus);
  const sevenBridgeStatus = useArgusStore((s) => s.sevenBridgeStatus);
  const attachedAgent = useArgusStore((s) => s.attachedAgent);
  const threatLog = useArgusStore((s) => s.threatLog);
  const approvalQueue = useArgusStore((s) => s.approvalQueue);

  const onlineMcp = Object.values(mcpStatus).filter((s) => s === 'online').length;
  const pendingApprovals = approvalQueue.filter((a) => a.status === 'pending').length;
  const lastThreat = threatLog[threatLog.length - 1];

  return (
    <header className="h-12 md:h-14 border-b border-node-900/30 flex items-center justify-between px-4 md:px-6 bg-[#040c18] z-20 shrink-0 overflow-x-auto no-scrollbar">
      {/* Left — Branding */}
      <div className="flex items-center gap-3 shrink-0">
        <Eye className="w-5 h-5 text-node-500" />
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-black tracking-[0.3em] text-node-400 uppercase">
            ARGUS
          </span>
          <span className="text-[7px] text-slate-600 tracking-widest uppercase">
            Neural Oversight Lab
          </span>
        </div>

        {attachedAgent && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-node-950/60 border border-node-800/40 ml-2">
            <StatusDot status="online" />
            <span className="text-[9px] font-black text-node-400 uppercase tracking-widest">
              {attachedAgent}
            </span>
          </div>
        )}
      </div>

      {/* Center — MCP Status */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/30">
        {MCP_REGISTRY.map((mcp) => (
          <div
            key={mcp.id}
            title={`${mcp.label}: ${mcpStatus[mcp.id]}`}
            className="flex items-center gap-1"
          >
            <StatusDot status={mcpStatus[mcp.id]} />
          </div>
        ))}
        <span className="text-[8px] text-slate-600 ml-1 font-black">
          {onlineMcp}/{MCP_REGISTRY.length} MCP
        </span>
      </div>

      {/* Right — Agents + Threat */}
      <div className="flex items-center gap-3 shrink-0">
        {lastThreat && (lastThreat.level === 'high' || lastThreat.level === 'critical') && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-950/40 border border-red-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[8px] font-black text-red-400 uppercase tracking-wider">
              {lastThreat.level} threat
            </span>
          </div>
        )}

        {pendingApprovals > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-950/40 border border-amber-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider">
              {pendingApprovals} pending
            </span>
          </div>
        )}

        {/* Live Agents */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-0.5" title={`Seven: ${sevenBridgeStatus}`}>
            <StatusDot status={sevenBridgeStatus} size="md" />
            <span className="text-[6px] text-slate-600 uppercase tracking-widest">7</span>
          </div>
          <div className="flex flex-col items-center gap-0.5" title={`Sage: ${sageBridgeStatus}`}>
            <StatusDot status={sageBridgeStatus} size="md" />
            <span className="text-[6px] text-slate-600 uppercase tracking-widest">S</span>
          </div>
        </div>
      </div>
    </header>
  );
}
