import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useArgusStore, ThreatLevel } from '../../store/useArgusStore';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

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

function GateActivityChart({ gateStats }: { gateStats: any }) {
  const data = [
    { name: 'G1 PII', value: gateStats.g1, color: '#ec4899' },
    { name: 'G2 SANIT', value: gateStats.g2, color: '#f59e0b' },
    { name: 'G3 INJECT', value: gateStats.g3, color: '#ef4444' },
  ];

  return (
    <div className="h-28 w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
          <XAxis dataKey="name" stroke="#475569" fontSize={7} tickLine={false} />
          <YAxis stroke="#475569" fontSize={7} allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }}
            contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '8px' }}
          />
          <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SecurityPanel() {
  const threatLog = useArgusStore((s) => s.threatLog);
  const sageBridgeStatus = useArgusStore((s) => s.sageBridgeStatus);
  const sevenBridgeStatus = useArgusStore((s) => s.sevenBridgeStatus);
  const gateStats = useArgusStore((s) => s.gateStats);

  const counts = threatLog.reduce(
    (acc, t) => { acc[t.level] = (acc[t.level] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  const highCount = (counts.high || 0) + (counts.critical || 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-node p-4 gap-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="panel-border rounded-xl p-3">
          <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1">Total Threats</p>
          <p className="text-2xl font-black text-node-400">{threatLog.length}</p>
        </div>
        <div className={`rounded-xl border p-3 ${highCount > 0 ? 'bg-red-950/30 border-red-900/30' : 'panel-border'}`}>
          <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1">High / Critical</p>
          <p className={`text-2xl font-black ${highCount > 0 ? 'text-red-400' : 'text-slate-600'}`}>
            {highCount}
          </p>
        </div>
      </div>

      {/* Gate Telemetry */}
      <div className="panel-border rounded-xl p-3">
        <p className="text-[8px] text-node-600 uppercase tracking-widest mb-3 font-black">Gate Telemetry</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'G1 PII',    count: gateStats.g1, color: 'text-pink-400' },
            { label: 'G2 SANIT',  count: gateStats.g2, color: 'text-amber-400' },
            { label: 'G3 INJECT', count: gateStats.g3, color: 'text-red-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-slate-950/40 rounded-lg p-2 text-center">
              <p className="text-[7px] text-slate-600 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-lg font-black ${count > 0 ? color : 'text-slate-700'}`}>{count}</p>
            </div>
          ))}
        </div>
        <GateActivityChart gateStats={gateStats} />
        <p className="text-[7px] text-slate-700 mt-2 text-right">
          {gateStats.total} total hits · context-aware G3 active
        </p>
      </div>

      {/* Agent Defence Status */}
      <div className="panel-border rounded-xl p-3">
        <p className="text-[8px] text-node-600 uppercase tracking-widest mb-3 font-black">Agent Defence</p>
        <div className="flex flex-col gap-2">
          {[
            { id: 'seven', status: sevenBridgeStatus, guard: 'HIGH GUARD', guardColor: 'text-red-400 bg-red-950/40 border-red-900/30' },
            { id: 'sage',  status: sageBridgeStatus,  guard: 'STANDARD',   guardColor: 'text-slate-500 bg-slate-900/40 border-slate-800/30' },
          ].map(({ id, status, guard, guardColor }) => (
            <div key={id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status === 'online'
                  ? <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  : <Shield className="w-4 h-4 text-slate-700" />
                }
                <span className="text-[10px] font-black text-slate-300 uppercase">{id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${guardColor}`}>
                  {guard}
                </span>
                <span className={`text-[8px] font-black uppercase ${
                  status === 'online' ? 'text-emerald-500' : 'text-slate-700'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Threat Log */}
      <div className="panel-border rounded-xl p-3 flex-1">
        <p className="text-[8px] text-node-600 uppercase tracking-widest mb-3 font-black">Threat Log</p>
        {threatLog.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <ShieldCheck className="w-8 h-8 text-slate-800" />
            <p className="text-[9px] text-slate-700">No threats detected.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {[...threatLog].reverse().slice(0, 20).map((t) => (
              <div key={t.id} className={`rounded-lg border p-2 ${LEVEL_BG[t.level]}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-3 h-3 ${LEVEL_COLOR[t.level]}`} />
                    <span className={`text-[8px] font-black uppercase ${LEVEL_COLOR[t.level]}`}>
                      {t.level}
                    </span>
                    <span className="text-[7px] text-slate-600 uppercase">{t.source} → {t.gate}</span>
                  </div>
                  <span className="text-[7px] text-slate-700">
                    {(t.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono truncate">{t.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
