import { useArgusStore, ThreatLevel } from '../../store/useArgusStore';

// Zero-dep SVG telemetry: gate-distribution bars + a recent-threat activity
// strip coloured by severity. Same no-external-deps philosophy as the editor.

const GATE_COLOR = { g1: '#f472b6', g2: '#fbbf24', g3: '#f87171' };
const LEVEL_FILL: Record<ThreatLevel, string> = {
  clean:    '#34d399',
  low:      '#facc15',
  medium:   '#fb923c',
  high:     '#f87171',
  critical: '#fca5a5',
};

export function GateActivityChart() {
  const gateStats = useArgusStore((s) => s.gateStats);
  const threatLog = useArgusStore((s) => s.threatLog);

  const gates = [
    { key: 'G1·PII', v: gateStats.g1, c: GATE_COLOR.g1 },
    { key: 'G2·SAN', v: gateStats.g2, c: GATE_COLOR.g2 },
    { key: 'G3·INJ', v: gateStats.g3, c: GATE_COLOR.g3 },
  ];
  const gateMax = Math.max(1, ...gates.map((g) => g.v));

  const recent = threatLog.slice(-40);
  const BAR_W = 6, GAP = 2, H = 46;

  return (
    <div className="panel-border rounded-xl p-3">
      <p className="text-[8px] text-node-600 uppercase tracking-widest mb-3 font-black">Gate Activity</p>

      {/* Gate distribution bars */}
      <div className="flex items-end gap-3 h-16 mb-1">
        {gates.map((g) => (
          <div key={g.key} className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="text-[9px] font-black mb-0.5" style={{ color: g.v > 0 ? g.c : '#475569' }}>{g.v}</span>
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${(g.v / gateMax) * 100}%`,
                minHeight: 2,
                background: g.v > 0 ? g.c : '#1e293b',
                boxShadow: g.v > 0 ? `0 0 8px ${g.c}66` : 'none',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mb-3">
        {gates.map((g) => (
          <span key={g.key} className="flex-1 text-center text-[6px] text-slate-600 uppercase tracking-wider">{g.key}</span>
        ))}
      </div>

      {/* Recent-threat activity strip, height = confidence, colour = severity */}
      <p className="text-[6px] text-slate-600 uppercase tracking-wider mb-1">Recent threats (severity × confidence)</p>
      {recent.length === 0 ? (
        <div className="h-[46px] flex items-center justify-center text-[7px] text-slate-700">no threat activity yet</div>
      ) : (
        <svg viewBox={`0 0 ${recent.length * (BAR_W + GAP)} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: H }}>
          {recent.map((t, i) => {
            const h = Math.max(3, (t.confidence || 0.15) * H);
            return (
              <rect
                key={t.id}
                x={i * (BAR_W + GAP)}
                y={H - h}
                width={BAR_W}
                height={h}
                rx={1}
                fill={LEVEL_FILL[t.level]}
                opacity={0.85}
              >
                <title>{`${t.level} · ${t.source}/${t.gate} · ${(t.confidence * 100).toFixed(0)}%`}</title>
              </rect>
            );
          })}
        </svg>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {(['low', 'medium', 'high', 'critical'] as ThreatLevel[]).map((l) => (
            <span key={l} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-sm" style={{ background: LEVEL_FILL[l] }} />
              <span className="text-[6px] text-slate-600 uppercase">{l}</span>
            </span>
          ))}
        </div>
        <span className="text-[6px] text-slate-700">{gateStats.total} hits · {threatLog.length} logged</span>
      </div>
    </div>
  );
}
