import { useArgusStore } from '../../store/useArgusStore';
import { SparkCore } from '../core/SparkCore';
import { SecurityPanel } from './SecurityPanel';
import { Shield, ShieldCheck, Server } from 'lucide-react';

export function DashboardPanel() {
  const mcpStatus = useArgusStore((s) => s.mcpStatus);
  const sageBridgeStatus = useArgusStore((s) => s.sageBridgeStatus);
  const sevenBridgeStatus = useArgusStore((s) => s.sevenBridgeStatus);
  const attachedAgent = useArgusStore((s) => s.attachedAgent);

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-4 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-node-900/20 bg-[#02050c]/80 backdrop-blur-md">
      {/* Left Zone: Data Nodes (Agent & MCP Status) */}
      <div className="lg:col-span-1 flex flex-col p-4 overflow-y-auto scrollbar-node gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-node-400 tracking-[0.2em] uppercase">ZONE 01 // DATA NODES</span>
          <span className="text-[7px] text-slate-500 font-mono">Agent & MCP Connection status</span>
        </div>

        {/* Agent List */}
        <div className="panel-border rounded-xl p-3 flex flex-col gap-2.5">
          <span className="text-[8px] font-black text-slate-500 tracking-wider uppercase">Active Agents</span>
          {[
            { id: 'sage', name: 'Sage Agent', status: sageBridgeStatus },
            { id: 'seven', name: 'Seven Agent', status: sevenBridgeStatus },
          ].map((agent) => {
            const isAttached = attachedAgent === agent.id;
            return (
              <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg bg-[#040915] border border-node-900/10">
                <div className="flex items-center gap-2">
                  {agent.status === 'online' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 filter drop-shadow-[0_0_4px_rgba(6,182,212,0.4)]" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-slate-700" />
                  )}
                  <span className="text-[10px] font-mono font-bold text-slate-200">{agent.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isAttached && (
                    <span className="text-[6px] font-black bg-cyan-950 text-cyan-400 px-1 py-0.5 rounded border border-cyan-800/30 uppercase">
                      ATTACHED
                    </span>
                  )}
                  <span className={`text-[8px] font-mono font-black uppercase ${
                    agent.status === 'online' ? 'text-cyan-400' : 'text-slate-600'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* MCP Servers List */}
        <div className="panel-border rounded-xl p-3 flex flex-col gap-2">
          <span className="text-[8px] font-black text-slate-500 tracking-wider uppercase">MCP Registry</span>
          <div className="flex flex-col gap-1.5">
            {Object.entries(mcpStatus).map(([id, status]) => (
              <div key={id} className="flex items-center justify-between p-1.5 rounded bg-[#03070f] border border-slate-900/50">
                <div className="flex items-center gap-2">
                  <Server className={`w-3 h-3 ${status === 'online' ? 'text-cyan-500' : 'text-slate-700'}`} />
                  <span className="text-[9px] font-mono text-slate-400 capitalize">{id}</span>
                </div>
                <span className={`text-[8px] font-mono font-black uppercase ${
                  status === 'online' ? 'text-cyan-400' : 'text-slate-700'
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Zone: SparkCore visualization (Node Graph) */}
      <div className="lg:col-span-2 flex flex-col overflow-hidden relative">
        <SparkCore />
      </div>

      {/* Right Zone: Security Hub */}
      <div className="lg:col-span-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-node-900/20 bg-[#03070f]/40 flex flex-col gap-1 shrink-0">
          <span className="text-[9px] font-black text-node-400 tracking-[0.2em] uppercase">ZONE 03 // SECURITY HUB</span>
          <span className="text-[7px] text-slate-500 font-mono">Real-time threat monitoring feed</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SecurityPanel />
        </div>
      </div>
    </div>
  );
}
