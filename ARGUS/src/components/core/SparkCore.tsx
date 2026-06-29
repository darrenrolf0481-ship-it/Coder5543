import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useArgusStore, McpStatus, BridgeStatus } from '../../store/useArgusStore';
import { MCP_REGISTRY } from '../../data/mcpRegistry';

type NodeStatus = McpStatus | BridgeStatus;

interface OrbitNode {
  id: string;
  label: string;
  glyph: string;
  status: NodeStatus;
  kind: 'mcp' | 'agent';
}

const STATUS_COLOR: Record<string, { stroke: string; fill: string; glow: string; text: string }> = {
  online:     { stroke: '#34d399', fill: 'rgba(16,185,129,0.18)', glow: 'rgba(16,185,129,0.85)', text: '#6ee7b7' },
  connecting: { stroke: '#fbbf24', fill: 'rgba(251,191,36,0.16)', glow: 'rgba(251,191,36,0.75)', text: '#fcd34d' },
  error:      { stroke: '#f87171', fill: 'rgba(239,68,68,0.18)',  glow: 'rgba(239,68,68,0.85)',  text: '#fca5a5' },
  offline:    { stroke: '#3d6e96', fill: 'rgba(56,189,248,0.10)', glow: 'rgba(56,189,248,0.25)', text: '#64748b' },
};

const colorFor = (s: NodeStatus) => STATUS_COLOR[s] ?? STATUS_COLOR.offline;

/** A faceted crystal gem (the satellite-node motif from the ARGUS Architecture blueprint). */
function CrystalNode({ node, cx, cy }: { node: OrbitNode; cx: number; cy: number }) {
  const c = colorFor(node.status);
  const r = node.kind === 'agent' ? 26 : 20;
  const live = node.status === 'online' || node.status === 'connecting';

  // Faceted diamond/gem path centered on origin
  const gem = `M0,${-r} L${r * 0.72},${-r * 0.25} L${r * 0.46},${r} L${-r * 0.46},${r} L${-r * 0.72},${-r * 0.25} Z`;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    >
      <g transform={`translate(${cx},${cy})`}>
        {/* counter-rotate so gems stay upright while the ring spins */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          {live && (
            <motion.path
              d={gem}
              fill="none"
              stroke={c.glow}
              strokeWidth={1}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center', filter: `drop-shadow(0 0 6px ${c.glow})` }}
            />
          )}
          <path
            d={gem}
            fill={c.fill}
            stroke={c.stroke}
            strokeWidth={1.4}
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 ${live ? 8 : 4}px ${c.glow})` }}
          />
          {/* inner facet lines */}
          <path d={`M0,${-r} L0,${r}`} stroke={c.stroke} strokeWidth={0.6} opacity={0.5} />
          <path d={`M${-r * 0.72},${-r * 0.25} L${r * 0.72},${-r * 0.25}`} stroke={c.stroke} strokeWidth={0.6} opacity={0.5} />
          <text textAnchor="middle" y={r + 13} fontSize="7" fontWeight="900"
                fill={c.text} letterSpacing="1.5" style={{ textTransform: 'uppercase' }}>
            {node.label}
          </text>
        </motion.g>
      </g>
    </motion.g>
  );
}

export function SparkCore() {
  const mcpStatus  = useArgusStore((s) => s.mcpStatus);
  const sageStatus = useArgusStore((s) => s.sageBridgeStatus);
  const sevenStatus = useArgusStore((s) => s.sevenBridgeStatus);
  const gateStats  = useArgusStore((s) => s.gateStats);
  const threatLog  = useArgusStore((s) => s.threatLog);

  const W = 760, H = 620;
  const center = { x: W / 2, y: H / 2 };
  const radius = 250;

  const nodes: OrbitNode[] = useMemo(() => [
    { id: 'seven', label: 'SEVEN', glyph: '7', status: sevenStatus, kind: 'agent' },
    ...MCP_REGISTRY.map((m) => ({
      id: m.id, label: m.label.toUpperCase(), glyph: m.icon, status: mcpStatus[m.id], kind: 'mcp' as const,
    })),
    { id: 'sage', label: 'SAGE', glyph: 'S', status: sageStatus, kind: 'agent' },
  ], [mcpStatus, sageStatus, sevenStatus]);

  const placed = nodes.map((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return { node, x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  });

  const onlineCount = placed.filter((p) => p.node.status === 'online').length;
  const lastThreat = threatLog[threatLog.length - 1];
  const breached = lastThreat?.level === 'critical' || lastThreat?.level === 'high';
  const coreColor = breached ? '#f87171' : '#38bdf8';
  const coreGlow  = breached ? 'rgba(248,113,113,0.7)' : 'rgba(56,189,248,0.7)';

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Title */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <h2 className="text-[13px] font-black tracking-[0.55em] text-node-300 uppercase">ARGUS Architecture</h2>
        <p className="text-[7px] text-slate-600 tracking-[0.3em] uppercase mt-1">
          SparkCore Orchestrator · {onlineCount}/{placed.length} nodes linked
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="max-h-full max-w-full" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={coreColor} stopOpacity="0.95" />
            <stop offset="35%" stopColor={coreColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={coreColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="domeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="transparent" />
            <stop offset="92%" stopColor={coreColor} stopOpacity="0.10" />
            <stop offset="100%" stopColor={coreColor} stopOpacity="0.02" />
          </radialGradient>
        </defs>

        {/* Protective dome bubble */}
        <circle cx={center.x} cy={center.y} r={radius + 56} fill="url(#domeGrad)" />
        <motion.circle
          cx={center.x} cy={center.y} r={radius + 56}
          fill="none" stroke={coreColor} strokeWidth={1} strokeOpacity={0.18}
          animate={{ strokeOpacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx={center.x} cy={center.y} r={radius + 30} fill="none" stroke={coreColor}
                strokeWidth={0.5} strokeOpacity={0.1} strokeDasharray="2 6" />

        {/* Connection beams core → nodes */}
        {placed.map(({ node, x, y }) => {
          const c = colorFor(node.status);
          const live = node.status === 'online' || node.status === 'connecting';
          return (
            <g key={`beam-${node.id}`}>
              <line x1={center.x} y1={center.y} x2={x} y2={y}
                    stroke={live ? c.stroke : '#15324d'} strokeWidth={live ? 1.1 : 0.5}
                    strokeOpacity={live ? 0.5 : 0.25} />
              {live && (
                <motion.circle r={2.5} fill={c.glow}
                  animate={{ cx: [center.x, x], cy: [center.y, y], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut',
                                delay: (placed.indexOf(placed.find((p) => p.node.id === node.id)!) % 5) * 0.3 }}
                  style={{ filter: `drop-shadow(0 0 4px ${c.glow})` }} />
              )}
            </g>
          );
        })}

        {/* Rotating orbital ring of crystal nodes */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ transformBox: 'view-box', transformOrigin: `${center.x}px ${center.y}px` }}
        >
          {placed.map(({ node, x, y }) => (
            <CrystalNode key={node.id} node={node} cx={x} cy={y} />
          ))}
        </motion.g>

        {/* Core aura */}
        <circle cx={center.x} cy={center.y} r={120} fill="url(#coreGrad)" />

        {/* Neural filaments inside the core */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          style={{ transformBox: 'view-box', transformOrigin: `${center.x}px ${center.y}px` }}
        >
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const r1 = 22, r2 = 78;
            return (
              <line key={i}
                x1={center.x + Math.cos(a) * r1} y1={center.y + Math.sin(a) * r1}
                x2={center.x + Math.cos(a) * r2} y2={center.y + Math.sin(a) * r2}
                stroke={coreColor} strokeWidth={0.6} strokeOpacity={0.35} />
            );
          })}
        </motion.g>

        {/* Pulsing core orb */}
        <motion.circle
          cx={center.x} cy={center.y}
          fill={coreColor}
          animate={{ r: [30, 36, 30], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: `drop-shadow(0 0 24px ${coreGlow})` }}
        />
        <circle cx={center.x} cy={center.y} r={30} fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={0.8} />
        <text x={center.x} y={center.y + 3} textAnchor="middle" fontSize="11" fontWeight="900"
              fill="#ffffff" letterSpacing="1.5">SparkCore</text>
      </svg>

      {/* Live telemetry strip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2
                      rounded-full bg-slate-950/70 border border-node-900/30 backdrop-blur z-10">
        <Telemetry label="G1·PII" value={gateStats.g1} />
        <Telemetry label="G2·SAN" value={gateStats.g2} />
        <Telemetry label="G3·INJ" value={gateStats.g3} />
        <span className="w-px h-4 bg-node-900/40" />
        <Telemetry label="THREATS" value={threatLog.length} alert={breached} />
      </div>
    </div>
  );
}

function Telemetry({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="flex flex-col items-center leading-none">
      <span className={`text-[12px] font-black ${alert ? 'text-red-400' : 'text-node-300'}`}>{value}</span>
      <span className="text-[6px] text-slate-600 tracking-widest uppercase mt-0.5">{label}</span>
    </div>
  );
}
