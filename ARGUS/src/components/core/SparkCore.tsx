import { motion } from 'framer-motion';
import { useArgusStore } from '../../store/useArgusStore';

interface SatelliteNode {
  id: string;
  name: string;
  type: 'mcp' | 'agent';
  status: 'online' | 'offline' | 'connecting' | 'error';
  orbitRadius: number;
  angleSpeed: number; // degrees per frame/second
  baseAngle: number;
}

export function SparkCore() {
  const mcpStatus = useArgusStore((s) => s.mcpStatus);
  const sageBridgeStatus = useArgusStore((s) => s.sageBridgeStatus);
  const sevenBridgeStatus = useArgusStore((s) => s.sevenBridgeStatus);
  const attachedAgent = useArgusStore((s) => s.attachedAgent);

  // Define nodes
  const satellites: SatelliteNode[] = [
    // Inner Orbit: Agents (Sage, Seven)
    {
      id: 'sage',
      name: 'Sage Agent',
      type: 'agent',
      status: sageBridgeStatus,
      orbitRadius: 90,
      angleSpeed: 15,
      baseAngle: 0,
    },
    {
      id: 'seven',
      name: 'Seven Agent',
      type: 'agent',
      status: sevenBridgeStatus,
      orbitRadius: 90,
      angleSpeed: 15,
      baseAngle: 180,
    },
    // Outer Orbit: MCP servers
    {
      id: 'filesystem',
      name: 'Filesystem MCP',
      type: 'mcp',
      status: mcpStatus.filesystem,
      orbitRadius: 160,
      angleSpeed: -8,
      baseAngle: 0,
    },
    {
      id: 'terminal',
      name: 'Terminal MCP',
      type: 'mcp',
      status: mcpStatus.terminal,
      orbitRadius: 160,
      angleSpeed: -8,
      baseAngle: 51,
    },
    {
      id: 'git',
      name: 'Git MCP',
      type: 'mcp',
      status: mcpStatus.git,
      orbitRadius: 160,
      angleSpeed: -8,
      baseAngle: 102,
    },
    {
      id: 'database',
      name: 'Database MCP',
      type: 'mcp',
      status: mcpStatus.database,
      orbitRadius: 160,
      angleSpeed: -8,
      baseAngle: 153,
    },
    {
      id: 'browser',
      name: 'Browser MCP',
      type: 'mcp',
      status: mcpStatus.browser,
      orbitRadius: 160,
      angleSpeed: -8,
      baseAngle: 204,
    },
    {
      id: 'docs',
      name: 'Docs MCP',
      type: 'mcp',
      status: mcpStatus.docs,
      orbitRadius: 160,
      angleSpeed: -8,
      baseAngle: 255,
    },
    {
      id: 'testrunner',
      name: 'Test Runner MCP',
      type: 'mcp',
      status: mcpStatus.testrunner,
      orbitRadius: 160,
      angleSpeed: -8,
      baseAngle: 306,
    },
  ];

  const getStatusColor = (status: SatelliteNode['status']) => {
    switch (status) {
      case 'online':
        return '#06b6d4'; // Cyan
      case 'connecting':
        return '#f59e0b'; // Amber
      case 'error':
        return '#ef4444'; // Red
      default:
        return '#475569'; // Slate
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-[#040814]/40 rounded-xl border border-node-900/10 overflow-hidden">
      {/* HUD Backdrop */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-10 pointer-events-none">
        <span className="text-[9px] font-black text-node-400 tracking-[0.2em] uppercase">SPARKCORE NEURAL NODE</span>
        <span className="text-[7px] text-slate-500 font-mono uppercase">Status: ACTIVE</span>
      </div>

      <svg viewBox="0 0 500 500" className="w-[90%] h-[90%] max-w-[450px] max-h-[450px]">
        {/* Grids and Orbits */}
        <circle cx="250" cy="250" r="90" className="stroke-slate-800/40 fill-none stroke-dasharray" strokeDasharray="4 6" />
        <circle cx="250" cy="250" r="160" className="stroke-slate-800/40 fill-none stroke-dasharray" strokeDasharray="3 5" />
        
        {/* Core Dome/Shield Bubble */}
        <circle cx="250" cy="250" r="45" className="stroke-cyan-500/20 fill-none" strokeWidth="1" />
        <motion.circle
          cx="250"
          cy="250"
          r="48"
          className="stroke-cyan-500/10 fill-none"
          strokeWidth="0.5"
          strokeDasharray="2 8"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        />

        {/* Central pulsing SparkCore */}
        <g>
          {/* Outer glow ring */}
          <motion.circle
            cx="250"
            cy="250"
            r="30"
            className="fill-cyan-500/10 stroke-cyan-500/30"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
          {/* Inner core */}
          <motion.circle
            cx="250"
            cy="250"
            r="20"
            className="fill-cyan-400/90 filter drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
          {/* Core nucleus facet design */}
          <path d="M250,234 L264,250 L250,266 L236,250 Z" className="fill-cyan-100/30 stroke-cyan-200/50" strokeWidth="0.5" />
        </g>

        {/* Orbiting Satellites */}
        {satellites.map((node) => {
          const color = getStatusColor(node.status);
          const isAttached = node.type === 'agent' && attachedAgent === node.id.replace('Agent', '').toLowerCase();

          return (
            <motion.g
              key={node.id}
              animate={{ rotate: node.angleSpeed > 0 ? 360 : -360 }}
              transition={{ repeat: Infinity, duration: Math.abs(360 / node.angleSpeed), ease: "linear" }}
              style={{ originX: '250px', originY: '250px' }}
            >
              <g transform={`translate(${250 + node.orbitRadius}, 250)`}>
                {/* Connection beam line back to core */}
                {node.status === 'online' && (
                  <motion.line
                    x1={-node.orbitRadius}
                    y1={0}
                    x2={-30}
                    y2={0}
                    className="stroke-cyan-500/25"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [-10, 0] }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                )}

                {/* Active agent highlights */}
                {isAttached && (
                  <circle cx="0" cy="0" r="14" className="stroke-cyan-400/60 fill-none" strokeWidth="1" strokeDasharray="3 3" />
                )}

                {/* Crystal Node Satellite */}
                <g className="cursor-pointer">
                  {/* Outer aura glow */}
                  {node.status === 'online' && (
                    <motion.circle
                      cx="0"
                      cy="0"
                      r="9"
                      fill={color}
                      className="opacity-20"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                  )}

                  {/* Gem shape (Diamond-faceted node) */}
                  <polygon
                    points="0,-8 6,0 0,8 -6,0"
                    fill={node.status === 'online' ? color : '#1e293b'}
                    stroke={color}
                    strokeWidth="1.5"
                    className="transition-colors duration-300"
                  />
                  {/* Facet line */}
                  <line x1="0" y1="-8" x2="0" y2="8" stroke="#ffffff" strokeWidth="0.5" className="opacity-40" />

                  {/* Node text tooltip */}
                  <g transform="translate(0, 16)">
                    <rect x="-35" y="-6" width="70" height="12" rx="3" fill="#020617/90" stroke={color} strokeWidth="0.5" className="opacity-90" />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {node.name.toUpperCase()}
                    </text>
                  </g>
                </g>
              </g>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
