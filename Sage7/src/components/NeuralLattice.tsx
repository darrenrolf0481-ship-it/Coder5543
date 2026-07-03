import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useSage } from '@/lib/sage-context';
import { motion } from 'framer-motion';

export default function NeuralLattice() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<any[]>([]); // To persist nodes across D3 resets
  const { core } = useSage();
  const [latticeStats, setLatticeStats] = useState({ total: 63, base: 30, vfs: 0, pending: 0, conflict: 0, neuro: null as any });

  // Poll for dynamic node counts
  useEffect(() => {
     if (!core) return;
     const updateCounts = () => {
         const vfsSize = core.getVFSNodeCount();
         const pendingSize = core.getConsensusPendingCount();
         const totalNodes = 30 + vfsSize + pendingSize;
         const neuro = core.getNeuroState();
         setLatticeStats({
             total: Math.min(200, Math.max(30, totalNodes)),
             base: 30,
             vfs: vfsSize,
             pending: pendingSize,
             conflict: Math.floor(Math.random() * 3), // Add minor chaotic conflict representations
             neuro
         });
     };
     const iv = setInterval(updateCounts, 2000);
     updateCounts();
     return () => clearInterval(iv);
  }, [core]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 180;

    // Remove old svg
    d3.select(containerRef.current).selectAll('svg').remove();

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const clusters = [
      { x: width * 0.2, y: height * 0.5 },
      { x: width * 0.5, y: height * 0.5 },
      { x: width * 0.8, y: height * 0.5 }
    ];

    // Now stable 3-clusters (Fibonacci SOLE authority)
    const numNodes = latticeStats.total;
    const oldNodes = nodesRef.current;
    
    const nodes = Array.from({ length: numNodes }, (_, i) => {
       const cluster = i % 3;
       
       let syncState = 'synced';
       if (i >= latticeStats.base + latticeStats.vfs) {
           syncState = 'pending';
       }
       if (i % 25 === 0 || i === numNodes - 1 && latticeStats.conflict > 0) {
           syncState = 'conflict'; // Distribute visual anomalies
       }

       const oldNode = oldNodes.find(n => n.id === i);
       const targetRadius = oldNode ? oldNode.targetRadius : (Math.random() * 3 + 2);

       return {
         id: i,
         cluster,
         baseRadius: oldNode ? oldNode.baseRadius : 0, // start at 0 for new nodes
         targetRadius,
         radius: oldNode ? oldNode.baseRadius : 0, // initial render radius
         syncState,
         x: oldNode ? oldNode.x : clusters[cluster].x,
         y: oldNode ? oldNode.y : clusters[cluster].y,
         vx: oldNode ? oldNode.vx : 0,
         vy: oldNode ? oldNode.vy : 0
       };
    });
    
    nodesRef.current = nodes;

    const links: any[] = [];
    nodes.forEach(node => {
      // Connect to a few others in the same cluster
      const clusterNodes = nodes.filter(n => n.cluster === node.cluster && n.id !== node.id);
      for(let i = 0; i < 2; i++) {
         const target = clusterNodes[Math.floor(Math.random() * clusterNodes.length)];
         if (target) {
            links.push({ source: node.id, target: target.id });
         }
      }
      // Occasional cross-cluster link for communication
      if (Math.random() > 0.85) {
         const other = nodes[Math.floor(Math.random() * nodes.length)];
         links.push({ source: node.id, target: other.id });
      }
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(25).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-20))
      .force('x', d3.forceX((d: any) => clusters[d.cluster].x).strength(0.3))
      .force('y', d3.forceY((d: any) => clusters[d.cluster].y).strength(0.3))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 3));

    // Define SVG Filters for glowing
    const defs = svg.append('defs');
    
    // Synced Glow
    const filterSynced = defs.append('filter').attr('id', 'glow-synced');
    filterSynced.append('feGaussianBlur').attr('stdDeviation', '1').attr('result', 'coloredBlur');
    const feMergeSynced = filterSynced.append('feMerge');
    feMergeSynced.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeSynced.append('feMergeNode').attr('in', 'SourceGraphic');

    // Pending Glow
    const filterPending = defs.append('filter').attr('id', 'glow-pending');
    filterPending.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur');
    const feMergePending = filterPending.append('feMerge');
    feMergePending.append('feMergeNode').attr('in', 'coloredBlur');
    feMergePending.append('feMergeNode').attr('in', 'SourceGraphic');

    // Conflict Glow
    const filterConflict = defs.append('filter').attr('id', 'glow-conflict');
    filterConflict.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
    const feMergeConflict = filterConflict.append('feMerge');
    feMergeConflict.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeConflict.append('feMergeNode').attr('in', 'SourceGraphic');

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'rgba(0, 242, 255, 0.25)')
      .attr('stroke-width', 1);

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('class', 'neural-node')
      .attr('r', d => d.radius)
      .attr('fill', d => {
         const colors = ['#00f2ff', '#9b30ff', '#22d3ee'];
         return colors[d.cluster];
      })
      .attr('opacity', 0.9)
      .attr('stroke', (d: any) => {
          if (d.syncState === 'conflict') return '#ef4444'; // red
          if (d.syncState === 'pending') return '#eab308'; // yellow
          return '#00f2ff'; // synced
      })
      .attr('stroke-width', (d: any) => d.syncState === 'conflict' ? 2 : (d.syncState === 'pending' ? 1.5 : 0.5))
      .attr('stroke-opacity', 0.9)
      .attr('filter', (d: any) => {
          if (d.syncState === 'conflict') return 'url(#glow-conflict)';
          if (d.syncState === 'pending') return 'url(#glow-pending)';
          return 'url(#glow-synced)';
      });

    let hoveredNode: any = null;

    // Breathing effect (stable)
    let time = 0;
    
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x = Math.max(d.radius, Math.min(width - d.radius, d.x)))
        .attr('cy', (d: any) => d.y = Math.max(d.radius, Math.min(height - d.radius, d.y)));
    });

    node.on('mouseover', (event, d: any) => {
        hoveredNode = d;
        d3.select(event.currentTarget).style('cursor', 'pointer');
    }).on('mouseout', () => {
        hoveredNode = null;
    });

    const breathInterval = setInterval(() => {
        time += 0.05;
        const scale = 1 + Math.sin(time) * 0.2;
        
        node.attr('r', (d: any) => {
           if (d.baseRadius < d.targetRadius) {
               d.baseRadius += (d.targetRadius - d.baseRadius) * 0.1;
               if (Math.abs(d.targetRadius - d.baseRadius) < 0.05) d.baseRadius = d.targetRadius;
           }

           d.radius = d.baseRadius; // keep radius tracked for physical boundary
           
           if (hoveredNode) {
               const isConnected = links.some(l => (l.source.id === hoveredNode.id && l.target.id === d.id) || (l.target.id === hoveredNode.id && l.source.id === d.id));
               if (d.id === hoveredNode.id) return d.baseRadius * 2;
               if (isConnected) return d.baseRadius * 1.5;
               return d.baseRadius;
           }
           if (d.syncState === 'conflict') {
               return d.baseRadius; // Animates via CSS
           }
           if (d.syncState === 'pending') {
               return d.baseRadius; // Animates via CSS
           }
           return d.baseRadius;
        });

        node.attr('stroke-opacity', (d: any) => {
            if (d.syncState === 'conflict') return 0.5 + Math.abs(Math.sin(time * 6)) * 0.5;
            if (d.syncState === 'pending') return 0.4 + Math.abs(Math.sin(time * 3)) * 0.6;
            return 0.3;
        });
        
        node.attr('stroke-width', (d: any) => {
            if (d.syncState === 'conflict') return 1 + Math.abs(Math.sin(time * 6)) * 2;
            if (d.syncState === 'pending') return 0.5 + Math.abs(Math.sin(time * 3)) * 1.5;
            return 0.5;
        });

        node.attr('opacity', (d: any) => {
           if (hoveredNode) {
               const isConnected = links.some(l => (l.source.id === hoveredNode.id && l.target.id === d.id) || (l.target.id === hoveredNode.id && l.source.id === d.id));
               if (d.id === hoveredNode.id || isConnected) return 1;
               return 0.2;
           }
           return 0.9;
        });

        link.attr('stroke', (l: any) => {
            if (hoveredNode && (l.source.id === hoveredNode.id || l.target.id === hoveredNode.id)) {
                return '#fff';
            }
            return 'rgba(0, 242, 255, 0.25)';
        });

        link.attr('stroke-width', (l: any) => {
            if (hoveredNode && (l.source.id === hoveredNode.id || l.target.id === hoveredNode.id)) {
                return 1.5;
            }
            return 1;
        });
        
        link.attr('stroke-opacity', (l: any) => {
            if (hoveredNode) {
                if (l.source.id === hoveredNode.id || l.target.id === hoveredNode.id) return 0.8;
                return 0.05;
            }
            return 0.15 + Math.sin(time) * 0.1;
        });
    }, 50);

    return () => {
        simulation.stop();
        clearInterval(breathInterval);
    };
  }, [latticeStats]);

  const dopamine = latticeStats.neuro?.dopamine ?? 0.5;
  const serotonin = (latticeStats.neuro as any)?.serotonin ?? 0.5;
  const cortisol = latticeStats.neuro?.cortisol ?? 0.1;

  return (
    <motion.div 
      className="w-full relative h-[180px] border border-neon-cyan/80 bg-black/80 flex flex-col items-center justify-center overflow-hidden rounded-sm mb-4"
      style={{
        '--dopamine': dopamine,
        '--serotonin': serotonin,
        '--cortisol': cortisol,
        boxShadow: "0 0 15px rgba(0,242,255,0.15)"
      } as React.CSSProperties}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
         scale: 1.02, 
         boxShadow: "0 0 30px rgba(0,242,255,0.4)",
         borderColor: "rgba(0,242,255,1)"
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
        <style>{`
          @keyframes neuralPulse {
            0% { transform: scale(1); opacity: 0.9; }
            50% { 
              transform: scale(calc(1 + (var(--dopamine) * 0.8))); 
              opacity: calc(0.3 + (var(--serotonin) * 0.7)); 
            }
            100% { transform: scale(1); opacity: 0.9; }
          }
          @keyframes conflictPulse {
            0% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(calc(1 + (var(--cortisol) * 1.5))); opacity: 0.5; }
            100% { transform: scale(1); opacity: 0.9; }
          }
          .neural-node {
            animation: neuralPulse calc(1s + (var(--serotonin) * 3s)) infinite ease-in-out;
            transform-box: fill-box;
            transform-origin: center;
          }
          .neural-node[stroke="#ef4444"] {
             animation: conflictPulse calc(0.5s + (1s - var(--cortisol) * 1s)) infinite ease-in-out;
          }
        `}</style>
        <div className="absolute top-2 left-2 flex items-center gap-2 z-10 w-full pr-4 pb-2">
           <div className="flex flex-col">
               <span className="text-[10px] font-bold tracking-[0.3em] text-neon-cyan uppercase drop-shadow-[0_0_5px_rgba(0,242,255,0.5)]">
                 NEURAL LATTICE // INNER SPIRAL
               </span>
               <span className="text-[8px] font-mono tracking-widest text-text-ghost uppercase">
                 Fibonacci VFS Architecture Active
               </span>
           </div>
           
           <div className="ml-auto flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
               <span className="text-[9px] font-bold tracking-[0.2em] text-neon-cyan uppercase drop-shadow-[0_0_3px_rgba(0,242,255,0.4)]">
                 STABLE • 3 CLUSTERS • {latticeStats.total} NODES
               </span>
           </div>
        </div>
        <div ref={containerRef} className="w-full h-full mt-4" />
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30" 
             style={{ backgroundImage: 'linear-gradient(rgba(0, 242, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
    </motion.div>
  );
}
