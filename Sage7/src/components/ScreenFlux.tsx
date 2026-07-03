import { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Radio } from 'lucide-react';
import * as d3 from 'd3';

export default function ScreenFlux() {
  const [stream, setStream] = useState<any[]>([]);
  const streamRef = useRef<any>(null);
  const [triad, setTriad] = useState({
    authPhi: 0.971,
    mamaPerimeter: 'STABLE [11.3 Hz]',
    baseSway: 0.002
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Use d3 for temporal standing wave
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    const timer = d3.timer((elapsed) => {
        const w = svgRef.current?.clientWidth || 1200;
        const h = svgRef.current?.clientHeight || 400;
        
        svg.selectAll('*').remove();
        
        const latest = streamRef.current;
        const phi = latest ? latest.phi : 0.721;
        const baseline = latest ? latest.delta : 11.3;
        
        // Define filters for the glowing wave
        const defs = svg.append('defs');
        const filter = defs.append('filter').attr('id', 'glow-wave');
        filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        const points = d3.range(0, w, 5).map(x => {
            // Wave length inversely proportional to baseline
            const k = (Math.PI * 2) / (w / 3); 
            const t = elapsed / 1000;
            const omega = baseline; // time frequency
            const amplitude = 60 * phi; // amplitude linked to phi
            
            const y = h / 2 + amplitude * Math.sin(k * x) * Math.cos(omega * t);
            return [x, y] as [number, number];
        });

        const line = d3.line<[number, number]>()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveBasis);

        // Target baseline reference
        svg.append('line')
            .attr('x1', 0).attr('y1', h/2)
            .attr('x2', w).attr('y2', h/2)
            .attr('stroke', '#eab308')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4 4')
            .attr('opacity', 0.3);

        svg.append('path')
            .datum(points)
            .attr('fill', 'none')
            .attr('stroke', '#eab308') // Golden wave
            .attr('stroke-width', 2.5)
            .attr('d', line)
            .attr('opacity', 0.8)
            .attr('filter', 'url(#glow-wave)');
    });

    return () => timer.stop();
  }, []);

  useEffect(() => {
    let frameId: number;
    // create raw simulated fluxgate stream
    const update = () => {
      setStream(prev => {
        const newValue = {
          time: new Date().getTime(),
          bz: -18.3 + (Math.random() * 2 - 1), // nT
          phi: 0.721 + (Math.random() * 0.01 - 0.005),
          delta: 11.3 + (Math.random() * 0.004 - 0.002)
        };
        streamRef.current = newValue;
        const updated = [...prev, newValue].slice(-100); // keep last 100 for graph
        return updated;
      });
      
      setTriad(prev => ({
        authPhi: 0.97 + (Math.random() * 0.01),
        mamaPerimeter: Math.random() > 0.95 ? 'FLUCTUATING [11.3 Hz]' : 'STABLE [11.3 Hz]',
        baseSway: 0.002 + (Math.random() * 0.001 - 0.0005)
      }));
      
      // trigger every 150ms for that raw stream feel
      frameId = setTimeout(update, 150) as any;
    };
    
    update();
    return () => clearTimeout(frameId);
  }, []);

  // Use canvas for brutal raw draw
  const gridCanvasRef = useRef<HTMLCanvasElement | OffscreenCanvas | null>(null);

  useEffect(() => {
    // Initialize the offscreen background grid canvas
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(1200, 400);
    } else {
      canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 400;
    }
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }
    }
    gridCanvasRef.current = canvas;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || stream.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Handle retina displays and dynamic resizing implicitly via CSS pixel ratios,
    // but here we just draw to a fixed brutalist buffer, stretched by CSS.
    // It keeps the noisy aesthetic.
    const w = canvas.width;
    const h = canvas.height;

    // Draw the pre-rendered grid from the offscreen canvas
    if (gridCanvasRef.current) {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(gridCanvasRef.current, 0, 0);
    } else {
      ctx.clearRect(0, 0, w, h);
      // Fallback
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.05)';
      ctx.lineWidth = 1;
      for(let i=0; i<w; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
      for(let i=0; i<h; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
    }

    // Draw Bz string (cyan)
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    stream.forEach((p, i) => {
      const x = (i / 100) * w;
      // Map Bz from approx -20 to -16 => 0 to h
      const y = h - ((p.bz + 20) / 4) * h;
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Draw Phi Sentinel (violet)
    ctx.strokeStyle = 'rgba(155, 48, 255, 0.8)'; // neon-violet
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    stream.forEach((p, i) => {
      const x = (i / 100) * w;
      // Map Phi from 0.70 to 0.74 => 0 to h
      const y = h - ((p.phi - 0.70) / 0.04) * h;
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Scanline effect
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for(let i=0; i<h; i+=4) {
       ctx.fillRect(0, i, w, 1);
    }

  }, [stream]);

  const latest = stream[stream.length - 1] || { bz: 0, phi: 0, delta: 0 };

  return (
    <div className="w-full h-full flex flex-col font-mono text-neon-cyan animate-in fade-in duration-500 relative bg-black/90 p-4">
      {/* Triad Sync Ticker */}
      <div className="absolute top-4 right-4 bg-void border border-neon-cyan/30 p-3 flex flex-col gap-1 z-10 w-64 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
        <div className="text-[10px] uppercase text-text-ghost border-b border-neon-cyan/20 pb-1 mb-1 flex items-center gap-2">
           <ShieldAlert className="w-3 h-3 text-neon-violet" />
           TRIAD SYNC
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-dim">Merlin Auth_Phi</span>
          <span className="text-neon-cyan font-bold">{triad.authPhi.toFixed(4)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-dim">Mama Perimeter</span>
          <span className={triad.mamaPerimeter.includes('STABLE') ? 'text-green-400' : 'text-neon-red'}>{triad.mamaPerimeter}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-dim">Φ Base Sway</span>
          <span className="text-neon-violet">±{triad.baseSway.toFixed(4)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Radio className="w-6 h-6 text-neon-cyan animate-pulse" />
        <div>
          <h2 className="text-xl font-bold tracking-[0.2em] text-neon-cyan drop-shadow-[0_0_5px_rgba(0,242,255,0.5)]">BERING STRAIT FLUXGATE (BSZ-7)</h2>
          <div className="text-[10px] text-text-ghost tracking-widest mt-1">RAW MAGNETOMETER (0.2Hz–10kHz) // Φ_SENTINEL OVERLAY</div>
        </div>
      </div>

      {/* Brutalist Canvas Container */}
      <div className="flex-1 border border-neon-cyan/20 relative bg-[#050505] overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-blue/5 via-void to-void pointer-events-none" />
        <canvas ref={canvasRef} width={1200} height={400} className="absolute inset-0 w-full h-full opacity-90 image-rendering-pixelated" />
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        
        {/* Floating Legends */}
        <div className="absolute top-4 left-4 flex gap-4 text-[10px] font-orbitron bg-black/60 p-2 border border-white/5 backdrop-blur-sm z-10">
           <div className="flex items-center gap-2">
             <div className="w-3 h-1 bg-[#00f2ff] shadow-[0_0_5px_#00f2ff]"></div>
             <span className="text-[#00f2ff]">Bz Component</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-1 bg-[#9b30ff] shadow-[0_0_5px_#9b30ff]"></div>
             <span className="text-[#9b30ff]">Φ_sentinel</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-1 bg-[#eab308] shadow-[0_0_5px_#eab308]"></div>
             <span className="text-[#eab308]">Temporal Wave (11.3 Hz)</span>
           </div>
        </div>

        {/* Live Values */}
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 font-orbitron bg-black/60 p-3 border border-white/5 backdrop-blur-sm">
           <div className="text-2xl font-bold text-[#00f2ff] drop-shadow-[0_0_5px_#00f2ff]">
             {latest.bz.toFixed(2)} <span className="text-xs text-text-dim">nT</span>
           </div>
           <div className="text-lg text-[#9b30ff] drop-shadow-[0_0_5px_#9b30ff]">
             {latest.phi.toFixed(4)} <span className="text-xs text-text-dim">Φ</span>
           </div>
           <div className="text-[10px] text-white/50 tracking-widest">
             Δ11.3: <span className={latest.delta - 11.3 >= 0 ? "text-green-500" : "text-neon-red"}>{(latest.delta - 11.3) > 0 ? '+' : ''}{(latest.delta - 11.3).toFixed(4)}</span>
           </div>
        </div>
      </div>
      
      {/* Terminal Log Stream */}
      <div className="mt-4 p-3 bg-[#020202] border border-neon-cyan/20 h-40 overflow-y-auto custom-scrollbar text-[11px] space-y-1.5 shadow-inner">
        {stream.slice(-15).reverse().map((data: any, idx: number) => (
          <div key={data.time} className={`font-mono flex gap-3 ${idx === 0 ? 'text-white' : 'text-text-dim opacity-70'}`}>
            <span className="text-neon-cyan/50 whitespace-nowrap">[{new Date(data.time).toISOString()}]</span> 
            <span>
              Φ_sentinel = <span className="text-[#9b30ff]">{data.phi.toFixed(3)}</span> ± 0.004 (Δ11.3 = <span className={data.delta - 11.3 >= 0 ? "text-green-400" : "text-neon-red"}>{data.delta - 11.3 >= 0 ? '+' : ''}{(data.delta - 11.3).toFixed(3)}</span>) | BSZ-7 Bz: <span className="text-[#00f2ff]">{data.bz.toFixed(2)} nT</span> | fOPE: {((data.phi * 100) % 2 + 97).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
