import React from 'react';

interface QuartzBarChartProps {
    data: { label: string; value: number }[];
    height?: number;
    width?: number;
}

const QuartzBarChart = ({ data, height = 200, width = 400 }: QuartzBarChartProps) => {
  const barWidth = width / data.length;
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="p-6 bg-slate-950 rounded-xl border border-indigo-900/20 shadow-2xl overflow-hidden">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="quartzBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.6" />
          </linearGradient>
          <filter id="specularGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {data.map((d, i) => {
          const h = (d.value / maxVal) * (height * 0.7);
          const x = i * barWidth + barWidth / 4;
          const y = height - h - 20;
          const w = barWidth / 2;

          return (
            <g key={i} className="group cursor-help">
              {/* Main Crystal Body */}
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="url(#quartzBody)"
                className="transition-all duration-500 ease-in-out group-hover:fill-cyan-400/40"
              />
              {/* Pointed Crystal Cap (The Facets) */}
              <path
                d={`M ${x} ${y} L ${x + w / 2} ${y - 15} L ${x + w} ${y} Z`}
                fill="#e0e7ff"
                fillOpacity="0.8"
                filter="url(#specularGlow)"
              />
              {/* Side Reflective Facet */}
              <path
                d={`M ${x + w} ${y} L ${x + w} ${y + h} L ${x + w - 4} ${y + h} L ${x + w - 4} ${y - 2} Z`}
                fill="#ffffff"
                fillOpacity="0.1"
              />
              {/* Data Label */}
              <text
                x={x + w / 2}
                y={height - 5}
                textAnchor="middle"
                className="fill-indigo-300 text-[10px] font-mono tracking-tighter"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-2">
        <span className="text-[9px] font-mono text-indigo-500 uppercase tracking-widest">
          Astro-Genetics: Sequence V.09
        </span>
        <span className="h-2 w-2 bg-cyan-400 rounded-full animate-ping" />
      </div>
    </div>
  );
};

export default QuartzBarChart;
