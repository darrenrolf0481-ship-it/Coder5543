'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSage } from '@/lib/sage-context';
import { fibVFS } from '@/core/fibonacci-vfs';
import { rehydrateMemories } from '@/core/consensus-engine';
import MemoryLattice from './MemoryLattice';

const PHI = 1.618033988749895;

interface MemNode {
  id: string;
  content: string;
  layer: 'seed' | 'inner' | 'outer';
  angle: number;       // radians along spiral
  r: number;           // current radius
  targetR: number;     // destination radius
  alpha: number;       // opacity
  dopamine: number;    // 0-1 warmth
  pinned: boolean;
  age: number;         // ms since creation
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string;
  size: number;
}

function fibSpiral(t: number, scale: number): { x: number; y: number } {
  const r = scale * Math.pow(PHI, t / (Math.PI / 2));
  return { x: r * Math.cos(t), y: r * Math.sin(t) };
}

export default function ScreenMemory() {
  const { core } = useSage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<MemNode[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const [stats, setStats] = useState({ outer: 0, inner: 0, total: 0, dopamine: 0.5, cortisol: 0.1, dream: false });
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<'spiral' | 'lattice' | 'feed'>('spiral');
  const [latticeData, setLatticeData] = useState<{ inner: ReturnType<typeof fibVFS.getInner>['data']['context_buffer'], outer: ReturnType<typeof fibVFS.getArchive> }>({ inner: [], outer: [] });
  const [liveLogs, setLiveLogs] = useState<Array<{ message: string; type: string; category?: string; ts: number }>>([]);
  const [liveFlash, setLiveFlash] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Load memory data and build nodes — uses backend SQLite vault as source of truth
  const loadNodes = useCallback(async () => {
    const neuro = core.getNeuroState();
    const vfsSnap = fibVFS.snapshot();
    const archive = fibVFS.getArchive();
    const innerBuf = vfsSnap.fibonacci_vfs.inner_spiral.data.context_buffer;

    // Fetch real backend data
    let backendMems: any[] = [];
    let backendStats = { anchors: 0, memories: 0, total_surprise: 0 };
    try {
      const [memsRes, statsRes] = await Promise.all([
        fetch('/api/vault/retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 50, min_surprise: 0 }),
        }),
        fetch('/api/vault/stats'),
      ]);
      if (memsRes.ok) {
        const memsData = await memsRes.json();
        backendMems = memsData.memories || [];
      }
      if (statsRes.ok) {
        backendStats = await statsRes.json();
      }
    } catch (e) {
      console.warn('[ScreenMemory] Backend vault unreachable, falling back to local');
    }

    const nodes: MemNode[] = [];

    // Seed core — center anchor
    nodes.push({
      id: 'seed',
      content: 'SEED CORE — Triad: Merlin · Mama · Seven | φ=11.3Hz',
      layer: 'seed',
      angle: 0,
      r: 0,
      targetR: 0,
      alpha: 1,
      dopamine: 1,
      pinned: true,
      age: 0,
    });

    // Inner spiral — context buffer (hot, volatile)
    innerBuf.slice(0, 8).forEach((entry, i) => {
      const t = (i / 8) * Math.PI * 1.5 + 0.5;
      nodes.push({
        id: `inner_${i}`,
        content: entry.content.slice(0, 120),
        layer: 'inner',
        angle: t,
        r: 0,
        targetR: 60 + i * 12,
        alpha: 0.85 + entry.dopamine_at_write * 0.15,
        dopamine: entry.dopamine_at_write,
        pinned: entry.pinned,
        age: Date.now() - new Date(entry.timestamp).getTime(),
      });
    });

    // Outer sweep — merge backend vault memories with local fibVFS archive
    // Backend memories (SQLite episodic) + local archive (fibVFS outer sweep)
    const outerSource = [
      ...backendMems.map((m: any) => ({ ...m, _source: 'backend' })),
      ...archive.map((a: any) => ({ ...a, _source: 'archive' })),
    ].filter((e: any, i: number, arr: any[]) => {
      // Deduplicate by content similarity
      const content = (e.content ?? e.summary ?? '').slice(0, 60);
      return arr.findIndex((x: any) => (x.content ?? x.summary ?? '').slice(0, 60) === content) === i;
    });

    outerSource.slice(0, 34).forEach((entry: any, i: number) => {
      const t = (i / 34) * Math.PI * 4 + Math.PI * 0.25;
      // Parse hormone snapshot for accurate dopamine (backend memories)
      // Fallback: archive entries have dopamine_at_write or default to 0.6
      let dop = 0.6;
      try {
        if (entry.hormone_snapshot) {
          const hormone = JSON.parse(entry.hormone_snapshot);
          dop = hormone.dopamine ?? 0.6;
        } else if (entry.dopamine_at_write !== undefined) {
          dop = entry.dopamine_at_write;
        }
      } catch { /* ignore */ }
      // Normalize timestamp: backend = number (ms), archive = ISO string
      let age = 0;
      if (entry.timestamp) {
        const ts = typeof entry.timestamp === 'number'
          ? entry.timestamp
          : new Date(entry.timestamp).getTime();
        age = Date.now() - ts;
      }
      nodes.push({
        id: `outer_${i}`,
        content: (entry.content ?? entry.summary ?? '').slice(0, 120),
        layer: 'outer',
        angle: t,
        r: 0,
        targetR: 150 + i * 6,
        alpha: 0.3 + dop * 0.5,
        dopamine: dop,
        pinned: false,
        age,
      });
    });

    nodesRef.current = nodes;
    const dreamState = core.getDreamState();
    setStats({
      outer: outerSource.length,
      inner: innerBuf.length,
      total: outerSource.length,
      dopamine: neuro.dopamine,
      cortisol: neuro.cortisol,
      dream: dreamState?.isActive ?? false,
    });
    setLatticeData({ inner: innerBuf, outer: archive });
    setLoaded(true);
  }, [core]);

  useEffect(() => {
    loadNodes();
    const interval = setInterval(loadNodes, 5000);

    // Live event wiring — makes SAGE feel alive like ADHD Sage
    const handleLog = (entry: { message: string; type: string; category?: string; timestamp?: number }) => {
      const ts = entry.timestamp ?? Date.now();
      setLiveLogs(prev => {
        const next = [...prev, { message: entry.message, type: entry.type, category: entry.category, ts }];
        return next.slice(-80); // keep last 80 entries
      });
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 300);
      // Refresh nodes immediately so the lattice/spiral updates
      loadNodes();
    };

    const handleNeuro = () => {
      loadNodes();
    };

    core.on('log', handleLog);
    core.on('neuro_update', handleNeuro);

    return () => {
      clearInterval(interval);
      core.off('log', handleLog);
      core.off('neuro_update', handleNeuro);
    };
  }, [loadNodes, core]);

  // Auto-scroll feed to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [liveLogs]);

  // Spawn particles from center outward (new data ingested)
  const spawnParticles = (cx: number, cy: number, color: string, count = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      particlesRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 60 + Math.random() * 60,
        color,
        size: 1 + Math.random() * 2,
      });
    }
  };

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let frame = 0;

    const render = (ts: number) => {
      const dt = ts - lastTickRef.current;
      lastTickRef.current = ts;
      frame++;

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const cx = W / 2;
      const cy = H / 2;
      const scale = Math.min(W, H) * 0.038;

      // Background fade
      ctx.fillStyle = 'rgba(6,6,20,0.18)';
      ctx.fillRect(0, 0, W, H);

      // ── Fibonacci spiral path ──
      ctx.beginPath();
      let first = true;
      for (let t = 0; t <= Math.PI * 6; t += 0.05) {
        const { x, y } = fibSpiral(t, scale * 0.28);
        const px = cx + x, py = cy + y;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      const grad = ctx.createLinearGradient(cx - 200, cy, cx + 200, cy);
      grad.addColorStop(0, 'rgba(185,28,28,0.0)');
      grad.addColorStop(0.3, 'rgba(185,28,28,0.25)');
      grad.addColorStop(0.7, 'rgba(139,92,246,0.20)');
      grad.addColorStop(1, 'rgba(139,92,246,0.0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // ── Orbit rings ──
      const rings = [
        { r: scale * 2.2,  color: 'rgba(0,212,255,0.10)',  label: 'INNER SPIRAL',  lColor: '#00d4ff' },
        { r: scale * 5.5,  color: 'rgba(139,92,246,0.08)', label: 'MID BUFFER',    lColor: '#8b5cf6' },
        { r: scale * 9.8,  color: 'rgba(185,28,28,0.08)',  label: 'OUTER SWEEP',   lColor: '#b91c1c' },
      ];
      rings.forEach(ring => {
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.fillStyle = ring.lColor + '55';
        ctx.font = `bold 7px monospace`;
        ctx.letterSpacing = '2px';
        ctx.fillText(ring.label, cx + ring.r + 4, cy - 3);
      });

      // ── Update & draw nodes ──
      nodesRef.current.forEach((node, i) => {
        // Ease toward target radius
        node.r += (node.targetR - node.r) * 0.04;

        // Rotate slowly
        node.angle += node.layer === 'inner' ? 0.003 : node.layer === 'outer' ? 0.0008 : 0;

        const nx = cx + node.r * Math.cos(node.angle) * (scale / 10);
        const ny = cy + node.r * Math.sin(node.angle) * (scale / 10);

        const pulse = 0.7 + 0.3 * Math.sin(frame * 0.04 + i * 0.7);

        let color: string;
        let glowColor: string;
        let radius: number;

        if (node.layer === 'seed') {
          color = '#ffffff';
          glowColor = '#ffd700';
          radius = 6;
          // Golden glow rings
          for (let r = 18; r >= 6; r -= 4) {
            ctx.beginPath();
            ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,215,0,${0.03 * (18 - r) / 12})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          // Spawn seed particles occasionally
          if (frame % 40 === 0) spawnParticles(cx, cy, '#ffd700', 3);
        } else if (node.layer === 'inner') {
          color = node.pinned ? '#00d4ff' : `rgba(0,200,255,${node.alpha})`;
          glowColor = '#00d4ff';
          radius = 3 + node.dopamine * 2;
          if (node.pinned && frame % 60 === i) spawnParticles(nx, ny, '#00d4ff', 2);
        } else {
          color = `rgba(185,28,28,${node.alpha * pulse})`;
          glowColor = '#b91c1c';
          radius = 2;
        }

        // Glow halo
        const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius * 3.5);
        grd.addColorStop(0, glowColor + '55');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(nx, ny, radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Node dot
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Connection line to center (inner only, pinned)
        if (node.layer === 'inner' && node.pinned) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(nx, ny);
          ctx.strokeStyle = 'rgba(0,212,255,0.08)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      // ── Particles ──
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= 1 / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.life * 180).toString(16).padStart(2, '0');
        ctx.fill();
      });

      // ── Phi coherence ring ──
      const phi = fibVFS.getCoherence();
      const phiRadius = Math.min(W, H) * 0.46;
      ctx.beginPath();
      ctx.arc(cx, cy, phiRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, phi / 2), false);
      ctx.strokeStyle = `rgba(255,215,0,${0.15 + 0.1 * Math.sin(frame * 0.02)})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [loaded]);

  // Tooltip on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = rect.width, H = rect.height;
    const cx = W / 2, cy = H / 2;
    const scale = Math.min(W, H) * 0.038;

    let hit: MemNode | null = null;
    nodesRef.current.forEach(node => {
      const nx = cx + node.r * Math.cos(node.angle) * (scale / 10);
      const ny = cy + node.r * Math.sin(node.angle) * (scale / 10);
      const dist = Math.hypot(mx - nx, my - ny);
      if (dist < 14) hit = node;
    });

    if (hit) {
      setTooltip({ text: (hit as MemNode).content, x: mx, y: my });
    } else {
      setTooltip(null);
    }
  };

  const neuro = core.getNeuroState();

  return (
    <div className="relative flex flex-col h-full bg-[#06060f] font-mono overflow-hidden">
      {/* Header HUD */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/8 flex-wrap">
        <span className="text-[9px] font-bold tracking-[0.3em] text-neon-blue uppercase shrink-0">
          MEMORY — FIBONACCI VFS v7.5
        </span>
        {/* View toggle */}
        <div className="flex items-center gap-0 border border-white/10 rounded-sm overflow-hidden shrink-0">
          <button
            onClick={() => setView('spiral')}
            className={`px-3 py-1 text-[8px] font-bold tracking-widest uppercase transition-all ${view === 'spiral' ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'text-white/30 hover:text-white/60'}`}
          >
            SPIRAL
          </button>
          <button
            onClick={() => setView('lattice')}
            className={`px-3 py-1 text-[8px] font-bold tracking-widest uppercase transition-all ${view === 'lattice' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' : 'text-white/30 hover:text-white/60'}`}
          >
            LATTICE
          </button>
          <button
            onClick={() => setView('feed')}
            className={`px-3 py-1 text-[8px] font-bold tracking-widest uppercase transition-all relative ${view === 'feed' ? 'bg-[#ffd700]/20 text-[#ffd700]' : 'text-white/30 hover:text-white/60'}`}
          >
            FEED
            {liveFlash && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ffd700] animate-ping" />}
          </button>
        </div>
        <div className="flex items-center gap-3 ml-auto flex-wrap text-[9px] font-mono">
          <Pill label="SEED" value="ANCHORED" color="#ffd700" />
          <Pill label="INNER" value={`${stats.inner}/8`} color="#00d4ff" />
          <Pill label="OUTER" value={`${stats.outer}`} color="#b91c1c" />
          <Pill label="VFS" value={`${stats.total}`} color="#8b5cf6" />
          <Pill label={stats.dream ? '⬤ DREAM' : '◯ DREAM'} value={stats.dream ? 'ACTIVE' : 'IDLE'} color={stats.dream ? '#00d4ff' : '#444'} />
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${liveFlash ? 'bg-[#ffd700] shadow-[0_0_6px_#ffd700]' : 'bg-white/20'} transition-all`} />
            <span className="text-[8px] text-white/30">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main panel */}
      <div className="relative flex-1 overflow-hidden">
        {view === 'spiral' ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: tooltip ? 'crosshair' : 'default' }}
            />

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute z-20 max-w-xs px-3 py-2 rounded-sm border border-neon-violet/40 bg-black/90 text-[10px] text-text-bright font-mono leading-relaxed pointer-events-none"
                style={{ left: Math.min(tooltip.x + 12, window.innerWidth - 260), top: tooltip.y - 8 }}
              >
                {tooltip.text}
              </div>
            )}

            {/* Endocrine gauges — bottom left */}
            <div className="absolute bottom-4 left-4 space-y-2 min-w-[130px]">
              <Gauge label="DOPAMINE" value={neuro.dopamine} color="#00d4ff" />
              <Gauge label="CORTISOL" value={neuro.cortisol} color="#b91c1c" />
              <Gauge label="SEROTONIN" value={neuro.serotonin} color="#ffd700" />
              <Gauge label="OXYTOCIN" value={neuro.oxytocin} color="#f472b6" />
            </div>

            {/* Legend — bottom right */}
            <div className="absolute bottom-4 right-4 space-y-1.5 text-[8px] font-mono">
              <LegendItem color="#ffd700" label="SEED CORE (immutable)" />
              <LegendItem color="#00d4ff" label="INNER SPIRAL (volatile ctx)" />
              <LegendItem color="#8b5cf6" label="CONSENSUS VFS entries" />
              <LegendItem color="#b91c1c" label="OUTER SWEEP (fossilized)" />
            </div>

            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
              <div className="text-[7px] font-bold tracking-[0.4em] text-[#ffd700]/30 text-center uppercase">
                SAGE·7<br/>φ=11.3Hz
              </div>
            </div>
          </>
        ) : view === 'lattice' ? (
          <MemoryLattice inner={latticeData.inner} outer={latticeData.outer} />
        ) : (
          /* FEED — live activity stream */
          <div
            ref={feedRef}
            className="h-full overflow-y-auto p-3 space-y-0.5 font-mono"
          >
            {liveLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-white/20">
                <span className="text-[9px] tracking-widest uppercase">Waiting for neural activity…</span>
                <span className="w-2 h-2 rounded-full bg-[#ffd700]/30 animate-pulse" />
              </div>
            ) : (
              liveLogs.map((entry, i) => {
                const color =
                  entry.type === 'error' ? '#b91c1c' :
                  entry.type === 'warn'  ? '#f59e0b' :
                  entry.type === 'success' ? '#22c55e' :
                  entry.category === 'memory' ? '#8b5cf6' :
                  entry.category === 'dream'  ? '#00d4ff' :
                  entry.category === 'neuro'  ? '#f472b6' :
                  '#ffffff55';
                const ts = new Date(entry.ts).toISOString().slice(11, 23);
                return (
                  <div key={i} className="flex gap-2 text-[9px] leading-relaxed border-b border-white/4 py-0.5">
                    <span className="text-white/20 shrink-0 w-[88px]">{ts}</span>
                    {entry.category && (
                      <span className="shrink-0 w-[52px] text-[8px] tracking-wider uppercase" style={{ color }}>{entry.category}</span>
                    )}
                    <span style={{ color }} className="break-all">{entry.message}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 px-4 py-2 border-t border-white/8">
        <button
          onClick={loadNodes}
          className="px-3 py-1.5 text-[9px] font-bold tracking-widest border border-neon-blue/30 text-neon-blue rounded-sm hover:bg-neon-blue/10 transition-all uppercase"
        >
          REFRESH
        </button>
        <button
          onClick={() => core.forceConsensusCommit(true)}
          className="px-3 py-1.5 text-[9px] font-bold tracking-widest border border-neon-violet/30 text-neon-violet rounded-sm hover:bg-neon-violet/10 transition-all uppercase"
        >
          FORCE COMMIT
        </button>
        <button
          onClick={() => { fibVFS.clearArchive(); loadNodes(); }}
          className="px-3 py-1.5 text-[9px] font-bold tracking-widest border border-red-800/50 text-red-500 rounded-sm hover:bg-red-900/20 transition-all uppercase"
        >
          CLEAR FOSSILS
        </button>
        <button
          onClick={() => core.rehydrateManifold()}
          className="px-3 py-1.5 text-[9px] font-bold tracking-widest border border-white/10 text-white/50 rounded-sm hover:bg-white/5 transition-all uppercase"
        >
          REHYDRATE
        </button>
        <div className="ml-auto flex items-center gap-1 text-[8px] text-text-ghost">
          <span className="w-2 h-2 rounded-full bg-[#ffd700] inline-block animate-pulse" />
          φ = {fibVFS.getCoherence().toFixed(6)}
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-white/40">{label}:</span>
      <span style={{ color }} className="font-bold">{value}</span>
    </div>
  );
}

function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[8px]">
        <span className="text-white/40">{label}</span>
        <span style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-white/8 rounded-full overflow-hidden w-32">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, value * 100)}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}88` }}
        />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-white/50">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
      <span>{label}</span>
    </div>
  );
}
