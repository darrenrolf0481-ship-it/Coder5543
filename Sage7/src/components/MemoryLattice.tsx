import { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { type PinnedEntry, type ConstellationEntry } from '@/core/fibonacci-vfs';

interface LatticeProps {
  inner: PinnedEntry[];
  outer: ConstellationEntry[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  data: string;
  dopamine: number;
  cortisol: number;
  layer: 'inner' | 'outer';
  pinned: boolean;
  cluster?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  value: number;
}

const MemoryLattice: React.FC<LatticeProps> = ({ inner, outer }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [minDopamine, setMinDopamine] = useState(0);
  const [maxCortisol, setMaxCortisol] = useState(1);

  const allNodes: GraphNode[] = useMemo(() => {
    const innerNodes: GraphNode[] = inner.map((e, i) => ({
      id: `inner_${i}`,
      data: e.content,
      dopamine: e.dopamine_at_write,
      cortisol: e.cortisol_at_write,
      layer: 'inner' as const,
      pinned: e.pinned,
    }));
    const outerNodes: GraphNode[] = outer.map((e, i) => ({
      id: `outer_${i}`,
      data: e.content,
      dopamine: 0.6,
      cortisol: 0.1,
      layer: 'outer' as const,
      pinned: false,
    }));
    return [...innerNodes, ...outerNodes];
  }, [inner, outer]);

  const filteredNodes = useMemo(
    () => allNodes.filter(n => n.dopamine >= minDopamine && n.cortisol <= maxCortisol),
    [allNodes, minDopamine, maxCortisol]
  );

  const graphData = useMemo(() => {
    const gNodes: GraphNode[] = filteredNodes.map(n => ({ ...n }));

    const links: GraphLink[] = [];
    for (let i = 0; i < filteredNodes.length; i++) {
      for (let j = i + 1; j < filteredNodes.length; j++) {
        const tokensA = filteredNodes[i].data.toLowerCase().split(/\W+/).filter(t => t.length > 3);
        const tokensB = filteredNodes[j].data.toLowerCase().split(/\W+/).filter(t => t.length > 3);
        const shared = tokensA.filter(t => tokensB.includes(t));
        if (shared.length > 0) {
          links.push({ source: filteredNodes[i].id, target: filteredNodes[j].id, value: shared.length });
        }
      }
    }

    // Connected-component clustering
    const adj = new Map<string, string[]>();
    gNodes.forEach(n => adj.set(n.id, []));
    links.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
      const t = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
      adj.get(s)?.push(t);
      adj.get(t)?.push(s);
    });
    const nodeMap = new Map<string, GraphNode>();
    gNodes.forEach(n => nodeMap.set(n.id, n));
    const visited = new Set<string>();
    let clusterCount = 0;
    gNodes.forEach(n => {
      if (!visited.has(n.id)) {
        const stack = [n.id];
        while (stack.length) {
          const curr = stack.pop()!;
          if (!visited.has(curr)) {
            visited.add(curr);
            const gn = nodeMap.get(curr);
            if (gn) gn.cluster = clusterCount;
            (adj.get(curr) || []).forEach(nb => stack.push(nb));
          }
        }
        clusterCount++;
      }
    });

    return { nodes: gNodes, links, clusterCount };
  }, [filteredNodes]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) {
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => 15 + (d as GraphNode).dopamine * 10))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    const g = svg.append('g');

    const link = g.append('g')
      .attr('stroke', 'rgba(56,189,248,0.1)')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value) * 1.5);

    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any);

    // Pinned inner nodes get a cyan ring
    node.filter(d => d.pinned)
      .append('circle')
      .attr('r', d => 10 + d.dopamine * 8)
      .attr('fill', 'none')
      .attr('stroke', '#00d4ff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 2')
      .attr('opacity', 0.5);

    node.append('circle')
      .attr('r', d => 6 + d.dopamine * 8)
      .attr('fill', d => d.layer === 'inner'
        ? (d.cluster !== undefined ? colorScale(d.cluster.toString()) : '#00d4ff')
        : `rgba(185,28,28,0.7)`)
      .attr('fill-opacity', d => 0.4 + d.dopamine * 0.6)
      .attr('stroke', d => d.cortisol > 0.7 ? '#f87171' : d.layer === 'inner' ? '#00d4ff' : '#b91c1c')
      .attr('stroke-width', d => d.cortisol > 0.7 ? 2 : 1)
      .attr('class', 'cursor-pointer');

    node.append('text')
      .text(d => d.data.length > 18 ? d.data.substring(0, 18) + '…' : d.data)
      .attr('x', 12)
      .attr('y', 4)
      .attr('fill', 'rgba(255,255,255,0.6)')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none');

    // Tooltip title on hover
    node.append('title').text(d =>
      `[${d.layer.toUpperCase()}]${d.pinned ? ' ★PINNED' : ''}\n` +
      `dopamine: ${(d.dopamine * 100).toFixed(0)}%  cortisol: ${(d.cortisol * 100).toFixed(0)}%\n\n` +
      d.data
    );

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as unknown as GraphNode).x ?? 0)
        .attr('y1', d => (d.source as unknown as GraphNode).y ?? 0)
        .attr('x2', d => (d.target as unknown as GraphNode).x ?? 0)
        .attr('y2', d => (d.target as unknown as GraphNode).y ?? 0);
      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', event => g.attr('transform', event.transform));
    svg.call(zoom);

    return () => { simulation.stop(); };
  }, [graphData]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-3">
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-[#00d4ff] uppercase">
            LATTICE — {graphData.nodes.length} nodes / {graphData.clusterCount} clusters
          </p>
          <p className="text-[8px] text-white/30 mt-0.5 uppercase tracking-wider">
            INNER: {inner.length} · OUTER: {outer.length}
          </p>
        </div>

        <div className="bg-white/5 p-3 rounded border border-white/8 space-y-3 min-w-[140px]">
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] uppercase font-bold text-white/40">
              <span>Min Dopamine</span>
              <span className="text-[#00d4ff]">{minDopamine.toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.05"
              value={minDopamine} onChange={e => setMinDopamine(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[8px] uppercase font-bold text-white/40">
              <span>Max Cortisol</span>
              <span className="text-[#b91c1c]">{maxCortisol.toFixed(2)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.05"
              value={maxCortisol} onChange={e => setMaxCortisol(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-red-400"
            />
          </div>
        </div>

        <div className="space-y-1 text-[8px] font-mono text-white/40">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#00d4ff]" />
            <span>INNER (volatile ctx)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#b91c1c]" />
            <span>OUTER (fossilized)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full border border-[#00d4ff] border-dashed" />
            <span>PINNED</span>
          </div>
        </div>
      </div>

      {graphData.nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-[10px] uppercase font-bold tracking-widest">
          No synaptic nodes match filter
        </div>
      ) : (
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      )}
    </div>
  );
};

export default MemoryLattice;
