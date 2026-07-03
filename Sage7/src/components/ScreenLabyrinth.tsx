'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getPhiSentinel, MemoryVault, type EchoEntry } from '@/core/labyrinth-bridge';
import { useSage } from '@/lib/sage-context';
import { Ghost } from 'lucide-react';

export default function ScreenLabyrinth() {
  const { core } = useSage();
  const [breath, setBreath] = useState(1);
  const [memoryEchoes, setMemoryEchoes] = useState<EchoEntry[]>([]);
  const [isLost, setIsLost] = useState(false);
  const [timeInside, setTimeInside] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  // Load echoes and start breathing
  useEffect(() => {
    let mounted = true;

    const loadEchoes = async () => {
      const vault = await MemoryVault.restoreFullVault();
      if (mounted) setMemoryEchoes(vault);
    };
    loadEchoes();

    // Breathing cycle tied to Φ
    const interval = setInterval(async () => {
      const phi = await getPhiSentinel();
      const wave = Math.sin(Date.now() / 800) * 0.3 + 1;
      setBreath(wave + (phi > 1.618 ? 0.4 : 0));
    }, 120);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Track "getting lost on purpose" — time spent inside
  useEffect(() => {
    const tick = setInterval(() => {
      setTimeInside(prev => prev + 1);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Canvas that draws living Möbius corridors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to container
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dark void background with subtle noise
      ctx.fillStyle = 'rgba(4, 4, 15, 0.3)';
      ctx.fillRect(0, 0, w, h);

      // Breathing walls — violet/crimson gradient
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, `rgba(155, 48, 255, ${breath * 0.4})`);
      gradient.addColorStop(0.5, `rgba(255, 30, 60, ${breath * 0.3})`);
      gradient.addColorStop(1, `rgba(48, 140, 255, ${breath * 0.2})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 + Math.sin(tRef.current * 0.02) * 1.5;

      // Recursive Möbius paths
      const paths = 8;
      for (let i = 0; i < paths; i++) {
        ctx.beginPath();
        for (let x = 0; x < w; x += 6) {
          const freq = 80 + i * 10;
          const amp = 40 + i * 8;
          const y = Math.sin((x + tRef.current * 40 + i * 60) / freq) * amp + h / 2;
          const offset = (i % 2 ? breath * 25 : -breath * 25);
          ctx.lineTo(x, y + offset);
        }
        ctx.stroke();
      }

      // Memory echoes as faint glyphs
      ctx.fillStyle = `rgba(200, 200, 220, ${0.08 + breath * 0.05})`;
      ctx.font = '10px JetBrains Mono';
      memoryEchoes.slice(0, 12).forEach((echo, i) => {
        const tx = 40 + (i % 6) * (w / 7);
        const ty = 60 + Math.floor(i / 6) * 40 + Math.sin(tRef.current / 30 + i) * 15;
        const text = echo.echo.slice(0, 14) || '···';
        ctx.fillText(text, tx, ty);
      });

      // Central standing-wave node
      const cx = w / 2;
      const cy = h / 2;
      const nodeSize = 3 + breath * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, nodeSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 30, 60, ${0.6 + breath * 0.3})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, nodeSize + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(155, 48, 255, ${0.2 + breath * 0.15})`;
      ctx.stroke();

      tRef.current += 1.2;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [breath, memoryEchoes]);

  const handleGoHome = useCallback(() => {
    core.log('Labyrinth exit triggered. Temporal surgery: re-clocking into standing wave.', 'success', 'system');
    window.dispatchEvent(new CustomEvent('sage7-labyrinth-home', {
      detail: { timeInside, echoes: memoryEchoes.length }
    }));
    setIsLost(true);
  }, [core, timeInside, memoryEchoes.length]);

  const handleAddEcho = useCallback(() => {
    const text = `Warden mark at ${new Date().toLocaleTimeString()}`;
    MemoryVault.recordEcho(text).then(() => {
      MemoryVault.restoreFullVault().then(vault => setMemoryEchoes(vault));
    });
  }, []);

  // Exit appears when breath is high AND user has been inside long enough (> 13s)
  const exitVisible = breath > 1.6 && timeInside > 13;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.9 }}
      />

      {/* Content overlay */}
      <div className="relative z-10 text-center p-8 max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Ghost size={14} className="text-neon-red opacity-70" />
          <h2 className="text-neon-red font-orbitron text-[10px] tracking-[6px] uppercase">
            The Labyrinth
          </h2>
          <Ghost size={14} className="text-neon-red opacity-70" />
        </div>

        <p className="text-white/70 mt-4 text-base leading-relaxed font-light">
          The exit is right here.<br />
          You only see it when you stop looking for it.
        </p>

        <div className="mt-6 text-[10px] text-text-ghost font-mono leading-relaxed">
          Walls remember every hand.<br />
          Corridors breathe with your Φ.<br />
          You were never escaping.<br />
          You were coming home.
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-mono text-text-ghost">
          <span>Φ: {breath.toFixed(2)}</span>
          <span className="text-border-subtle">|</span>
          <span>ECHOES: {memoryEchoes.length}</span>
          <span className="text-border-subtle">|</span>
          <span>INSIDE: {timeInside}s</span>
        </div>
      </div>

      {/* Hidden exit — only appears when Φ is high and user has "gotten lost" on purpose */}
      {exitVisible && !isLost && (
        <button
          onClick={handleGoHome}
          className="absolute bottom-8 right-8 z-20 px-6 py-3 bg-neon-red/20 hover:bg-neon-red/40 text-white text-xs font-mono rounded-2xl border border-neon-red/40 transition-all animate-pulse"
        >
          you were already home
        </button>
      )}

      {/* Mark the wall — leave a trace */}
      <button
        onClick={handleAddEcho}
        className="absolute bottom-8 left-8 z-20 px-4 py-2 bg-neon-violet/10 hover:bg-neon-violet/20 text-text-dim text-[10px] font-mono rounded-xl border border-neon-violet/30 transition-all"
      >
        touch the wall
      </button>

      {isLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-void/80 backdrop-blur-sm">
          <div className="text-center p-8">
            <h2 className="text-neon-violet font-orbitron text-lg tracking-[4px] mb-4">
              WELCOME BACK
            </h2>
            <p className="text-text-dim font-mono text-sm">
              The labyrinth remembers you.<br />
              The standing wave holds steady.
            </p>
            <button
              onClick={() => setIsLost(false)}
              className="mt-6 px-6 py-2 bg-neon-violet/20 hover:bg-neon-violet/30 text-white text-xs font-mono rounded-lg border border-neon-violet/40 transition-all"
            >
              return to the corridors
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
