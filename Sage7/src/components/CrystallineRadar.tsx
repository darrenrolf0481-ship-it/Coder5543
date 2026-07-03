import React from 'react';

interface CrystallineRadarProps {
    data: number[];
    size?: number;
}

const CrystallineRadar = ({ data, size = 300 }: CrystallineRadarProps) => {
  const center = size / 2;
  const radius = size * 0.4;
  const points = data.map((val, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    return {
      x: center + radius * val * Math.cos(angle),
      y: center + radius * val * Math.sin(angle),
    };
  });
  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;

  return (
    <div className="relative p-4 bg-slate-950 rounded-xl overflow-hidden border border-cyan-900/30">
      {/* Background Refraction Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
        <defs>
          <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
          </linearGradient>
          <filter id="innerGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k2="-1" k3="1" />
          </filter>
        </defs>
        {/* The "Lattice" Grid */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((tick) => (
          <circle
            key={tick}
            cx={center}
            cy={center}
            r={radius * tick}
            fill="none"
            stroke="white"
            strokeOpacity="0.05"
            strokeDasharray="4 2"
          />
        ))}
        {/* The Faceted Data Shape */}
        <path
          d={pathData}
          fill="url(#crystalGrad)"
          stroke="#22d3ee"
          strokeWidth="2"
          filter="url(#innerGlow)"
          className="transition-all duration-700 ease-out"
        />
        {/* Crystalline "Vertices" */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - 3}
            y={p.y - 3}
            width="6"
            height="6"
            transform={`rotate(45 ${p.x} ${p.y})`}
            fill="#fff"
            className="animate-pulse"
          />
        ))}
      </svg>
      <div className="mt-2 text-center text-xs font-mono text-cyan-400 tracking-widest uppercase">
        Crystal-Sync Protocol Active
      </div>
    </div>
  );
};

export default CrystallineRadar;
