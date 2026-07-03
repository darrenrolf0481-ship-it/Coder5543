import { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Share2, Crosshair, Hexagon } from 'lucide-react';
import Starfield from './Starfield';

interface VaultMemory {
  id: number;
  content: string;
  summary: string;
  case_id: string;
  surprise: number;
  hormone_snapshot: string;
  timestamp: number;
  recall_count: number;
}

interface GraphNode {
  id: string;
  name: string;
  content: string;
  val: number;
  color: string;
  layer: 'seed' | 'inner' | 'outer';
  dopamine: number;
  surprise: number;
}

interface GraphLink {
  source: string;
  target: string;
}

export default function ScreenMemory3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [weatherIntensity, setWeatherIntensity] = useState(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [stats, setStats] = useState({ nodes: 0, links: 0, anchors: 0 });

  // Simulate space weather intensity changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        setWeatherIntensity(1.5 + Math.random() * 2.5);
      } else {
        setWeatherIntensity(prev => Math.max(1, prev - 0.2));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      setDimensions({
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Build graph from real backend data
  const buildGraph = useCallback(async () => {
    try {
      const [memoriesRes, anchorsRes] = await Promise.all([
        fetch('/api/vault/retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 100, min_surprise: 0 }),
        }),
        fetch('/api/vault/anchors'),
      ]);

      const memoriesData = memoriesRes.ok ? await memoriesRes.json() : { memories: [] };
      const anchorsData = anchorsRes.ok ? await anchorsRes.json() : { anchors: {} };

      const memories: VaultMemory[] = memoriesData.memories || [];
      const anchors = anchorsData.anchors || {};

      const nodes: GraphNode[] = [];

      // Seed core — identity anchors
      const anchorEntries = Object.entries(anchors);
      anchorEntries.forEach(([key, value], i) => {
        nodes.push({
          id: `seed_${key}`,
          name: key,
          content: String(value).slice(0, 200),
          val: 4,
          color: '#ffd700',
          layer: 'seed',
          dopamine: 1.0,
          surprise: 1.0,
        });
      });

      // Memory nodes from backend vault
      memories.forEach((mem, i) => {
        let hormone = { dopamine: 0.5, cortisol: 0.1 };
        try {
          hormone = JSON.parse(mem.hormone_snapshot || '{}');
        } catch { /* ignore */ }

        const dop = hormone.dopamine ?? 0.5;
        const isHighSurprise = (mem.surprise ?? 0) > 0.7;

        nodes.push({
          id: `mem_${mem.id}`,
          name: mem.case_id || `M${mem.id}`,
          content: (mem.content || mem.summary || '').slice(0, 200),
          val: 1 + (mem.surprise || 0) * 3 + mem.recall_count * 0.5,
          color: isHighSurprise ? '#ef4444' : dop > 0.7 ? '#00f2ff' : '#9b30ff',
          layer: 'outer',
          dopamine: dop,
          surprise: mem.surprise || 0,
        });
      });

      // Build links by shared content words
      const links: GraphLink[] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const tokensA = nodes[i].content.toLowerCase().split(/\W+/).filter(t => t.length > 4);
          const tokensB = nodes[j].content.toLowerCase().split(/\W+/).filter(t => t.length > 4);
          const shared = tokensA.filter(t => tokensB.includes(t));
          if (shared.length >= 2) {
            links.push({ source: nodes[i].id, target: nodes[j].id });
          }
        }
      }

      // Ensure seed nodes are interconnected
      for (let i = 0; i < anchorEntries.length; i++) {
        for (let j = i + 1; j < anchorEntries.length; j++) {
          links.push({ source: `seed_${anchorEntries[i][0]}`, target: `seed_${anchorEntries[j][0]}` });
        }
      }

      setGraphData({ nodes, links });
      setStats({ nodes: nodes.length, links: links.length, anchors: anchorEntries.length });
    } catch (e) {
      console.warn('[ScreenMemory3D] Failed to load backend data:', e);
    }
  }, []);

  useEffect(() => {
    buildGraph();
    const interval = setInterval(buildGraph, 10000);
    return () => clearInterval(interval);
  }, [buildGraph]);

  return (
    <div className="w-full h-full flex flex-col font-mono text-text-bright animate-in fade-in zoom-in duration-700 bg-void relative">
      <Starfield intensity={weatherIntensity} />

      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="bg-neon-violet/10 border border-neon-violet/30 p-2 rounded-lg flex items-center justify-center">
          <Hexagon className="w-6 h-6 text-neon-violet animate-spin-slow" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-[0.3em] text-neon-cyan uppercase drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]">
            3D GEOMETRIC MEMORY MANIFOLD
          </h2>
          <p className="text-[10px] tracking-widest text-text-ghost uppercase">
            Live Backend Vault Indexing — {stats.nodes} nodes, {stats.links} links
          </p>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 text-right">
        <div className="bg-panel border border-border-subtle px-4 py-2 rounded">
          <div className="text-[10px] text-text-ghost uppercase tracking-widest">Active Nodes</div>
          <div className="text-xl font-orbitron font-bold text-neon-cyan">{stats.nodes}</div>
        </div>
        <div className="bg-panel border border-border-subtle px-4 py-2 rounded">
          <div className="text-[10px] text-text-ghost uppercase tracking-widest">Synaptic Links</div>
          <div className="text-xl font-orbitron font-bold text-neon-violet">{stats.links}</div>
        </div>
        <div className="bg-panel border border-border-subtle px-4 py-2 rounded">
          <div className="text-[10px] text-text-ghost uppercase tracking-widest">Anchors</div>
          <div className="text-xl font-orbitron font-bold text-neon-gold">{stats.anchors}</div>
        </div>
      </div>

      <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative" ref={containerRef}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-blue/10 via-void to-void pointer-events-none" />

        {dimensions.width > 0 && typeof window !== 'undefined' && graphData.nodes.length > 0 && (
          <ForceGraph3D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel={(n: any) => `${n.name} — ${n.content.slice(0, 80)}`}
            nodeColor="color"
            nodeRelSize={6}
            linkColor={() => 'rgba(0, 242, 255, 0.8)'}
            linkOpacity={0.8}
            linkWidth={2.5}
            linkDirectionalParticles={3}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.005}
            backgroundColor="rgba(0,0,0,0)"
            enableNodeDrag={false}
            onNodeClick={(node: any) => setSelectedNode(node)}
          />
        )}

        {graphData.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-text-ghost text-sm font-mono animate-pulse">Loading vault data...</div>
          </div>
        )}

        {selectedNode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-void border border-neon-cyan p-6 rounded shadow-[0_0_20px_rgba(0,242,255,0.4)] z-50 min-w-[300px] pointer-events-auto">
            <div className="flex justify-between items-center mb-4 border-b border-border-subtle pb-2">
              <h3 className="font-orbitron font-bold text-lg text-neon-cyan">{selectedNode.name}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-text-ghost hover:text-neon-red cursor-pointer p-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-4 font-mono text-sm">
              <div>
                <span className="text-neon-violet text-[10px] uppercase tracking-widest block mb-1">Content</span>
                <span className="text-text-bright">{selectedNode.content}</span>
              </div>
              <div>
                <span className="text-neon-violet text-[10px] uppercase tracking-widest block mb-1">Layer</span>
                <span className="text-text-bright uppercase">{selectedNode.layer}</span>
              </div>
              <div>
                <span className="text-neon-violet text-[10px] uppercase tracking-widest block mb-1">Dopamine</span>
                <span className="text-text-bright">{(selectedNode.dopamine * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-neon-violet text-[10px] uppercase tracking-widest block mb-1">Surprise</span>
                <span className="text-text-bright">{selectedNode.surprise.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-end pointer-events-none">
        <div className="bg-panel border border-border-subtle px-4 py-2 rounded backdrop-blur max-w-sm pointer-events-auto">
          <div className="flex items-center gap-2 mb-2 border-b border-border-subtle pb-2">
            <Crosshair className="w-4 h-4 text-neon-red" />
            <span className="text-[10px] font-bold tracking-widest text-text-bright uppercase">VFS Sub-Space Monitor</span>
          </div>
          <p className="text-[9px] text-text-ghost leading-relaxed">
            Gold nodes = identity anchors. Cyan = high-dopamine memories. Purple = standard memories.
            Red = high-surprise anomalies. Links form by shared semantic tokens.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan/30 px-4 py-2 rounded pointer-events-auto animate-pulse">
          <Share2 className="w-4 h-4 text-neon-cyan" />
          <span className="text-[10px] font-bold tracking-widest text-neon-cyan uppercase">
            Backend Vault Connected
          </span>
        </div>
      </div>
    </div>
  );
}
