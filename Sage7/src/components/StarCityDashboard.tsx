'use client';

import React, { useState, useEffect } from 'react';
import CrystallineRadar from './CrystallineRadar';
import QuartzBarChart from './QuartzBarChart';

const StarCityDashboard = () => {
  const [researchData, setResearchData] = useState({
    radar: [0.8, 0.6, 0.9, 0.5, 0.7, 0.85],
    genetics: [
      { label: 'S1', value: 45 },
      { label: 'S2', value: 82 },
      { label: 'S3', value: 61 },
      { label: 'S4', value: 95 },
      { label: 'S5', value: 30 }
    ]
  });

  // Mock hydration from VFS or Puter.js
  useEffect(() => {
    console.log("[NOREPINEPHRINE] Syncing Star City Node...");
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] p-4 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Header: Institutional Branding */}
      <header className="mb-8 border-b border-cyan-900/50 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-cyan-50">
            Star City <span className="font-bold text-cyan-400">Research</span>
          </h1>
          <p className="text-[10px] font-mono text-indigo-400 mt-1 uppercase tracking-widest">
            Node: Crimson-01 // Auth: Sage-Level
          </p>
        </div>
        <div className="text-right font-mono text-[9px] text-slate-500">
          SYSTEM_STABILITY: 98.4%<br/>
          LATENCY: 12ms
        </div>
      </header>

      {/* Main Grid: Vertical Stacks for Mobile, Multi-column for Desktop */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        {/* Primary Research Pipeline (Radar) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/50" />
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400">Project Cosmos</h2>
          </div>
          <CrystallineRadar data={researchData.radar} size={380} />
        </section>

        {/* Analytics & Metrics (Quartz Bars) */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-indigo-400">Astro-Genetics</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-500/50" />
          </div>
          <QuartzBarChart data={researchData.genetics} width={500} height={300} />

          {/* Bottom Log Stack (Mobile-Optimized) */}
          <div className="bg-slate-900/40 border border-white/5 rounded p-4 font-mono text-[11px] h-32 overflow-y-auto">
            <div className="text-cyan-500/70">{`> [INFO] Crystal-Sync initialized.`}</div>
            <div className="text-indigo-400/70">{`> [DATA] Sequence V.09 alignment: 100%.`}</div>
            <div className="text-slate-500">{`> [SYSTEM] Monitoring for refraction anomalies...`}</div>
          </div>
        </section>
      </main>

      {/* Navigation: Mobile-Sovereign Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-t border-cyan-900/30 flex justify-around items-center lg:hidden z-50">
        <button className="text-cyan-400 p-2">◈</button>
        <button className="text-slate-500 p-2">⬢</button>
        <button className="text-slate-500 p-2">⬦</button>
      </nav>
    </div>
  );
};

export default StarCityDashboard;
