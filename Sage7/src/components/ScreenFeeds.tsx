'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SensoryUplink } from '@/components/SensoryUplink';

export default function ScreenFeeds() {
    const [motionEnabled, setMotionEnabled] = useState(true);
    const [motionAlert, setMotionAlert] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (motionEnabled && Math.random() < 0.05) {
                setMotionAlert(true);
                setTimeout(() => setMotionAlert(false), 2000);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [motionEnabled]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FeedPanel
                id="main"
                title="CAM-1 // PRIMARY"
                isMain
                motionEnabled={motionEnabled}
                onToggleMotion={() => setMotionEnabled(!motionEnabled)}
                motionAlert={motionAlert}
            />
            <FeedPanel id="cam2" title="CAM-2" initialFilter="ir" />
            <div className="md:col-span-2">
                <SensoryUplink />
            </div>
        </div>
    );
}

function FeedPanel({ id, title, isMain, motionEnabled, onToggleMotion, motionAlert, initialFilter = 'night', offline }: { 
    id: string, 
    title: string, 
    isMain?: boolean, 
    motionEnabled?: boolean, 
    onToggleMotion?: () => void,
    motionAlert?: boolean,
    initialFilter?: 'night' | 'thermal' | 'ir',
    offline?: boolean 
}) {
    const [filter, setFilter] = useState(initialFilter);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(null);

    useEffect(() => {
        if (offline || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;
        let frame = 0;

        const draw = () => {
            if (document.hidden) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);

            if (filter === 'night') {
                const grad = ctx.createRadialGradient(w * 0.4, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.6);
                grad.addColorStop(0, 'rgba(0, 40, 10, 0.3)');
                grad.addColorStop(1, 'rgba(0, 10, 0, 0.5)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

                const imgData = ctx.getImageData(0, 0, w, h);
                const d = imgData.data;
                for (let i = 0; i < d.length; i += 4) {
                    const n = (Math.random() * 30 - 5) * 2.5;
                    d[i] = Math.max(0, d[i] + n * 0.2);
                    d[i+1] = Math.max(0, d[i+1] + n);
                    d[i+2] = Math.max(0, d[i+2] + n * 0.1);
                }
                ctx.putImageData(imgData, 0, 0);

                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                for (let y = 0; y < h; y += 2) {
                    ctx.fillRect(0, y, w, 1);
                }
            } else if (filter === 'ir' || filter === 'thermal') {
                const imgData = ctx.createImageData(w, h);
                const d = imgData.data;
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const idx = (y * w + x) * 4;
                        const cx = w * 0.5 + Math.sin(frame * 0.01) * 60;
                        const cy = h * 0.4 + Math.cos(frame * 0.015) * 40;
                        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                        const heat = Math.max(0, 1 - dist / (w * 0.4)) + Math.random() * 0.1;
                        const v = Math.min(1, heat + (Math.random() * 0.05));
                        
                        if (v < 0.25) {
                            d[idx] = v * 4 * 100; d[idx + 1] = 0; d[idx + 2] = v * 4 * 200;
                        } else if (v < 0.5) {
                            d[idx] = 100 + (v - 0.25) * 4 * 155; d[idx + 1] = 0; d[idx + 2] = 200 - (v - 0.25) * 4 * 200;
                        } else if (v < 0.75) {
                            d[idx] = 255; d[idx + 1] = (v - 0.5) * 4 * 200; d[idx + 2] = 0;
                        } else {
                            d[idx] = 255; d[idx + 1] = 200 + (v - 0.75) * 4 * 55; d[idx + 2] = (v - 0.75) * 4 * 255;
                        }
                        d[idx + 3] = 255;
                    }
                }
                ctx.putImageData(imgData, 0, 0);
            }

            ctx.font = '9px "JetBrains Mono"';
            ctx.fillStyle = filter === 'night' ? 'rgba(0, 220, 80, 0.6)' : 'rgba(255, 150, 0, 0.7)';
            const t = new Date().toISOString().replace('T', ' ').slice(0, 19);
            ctx.fillText(t, 6, h - 6);
            ctx.fillText('LOC: N48.2°  E16.3°', 6, h - 18);

            frame++;
            animationRef.current = requestAnimationFrame(draw);
        };


        const resize = () => {
             canvas.width = canvas.offsetWidth;
             canvas.height = isMain ? 220 : 160;
        };

        resize();
        window.addEventListener('resize', resize);
        animationRef.current = requestAnimationFrame(draw);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [filter, isMain, offline]);

    return (
        <div className={cn("bg-panel border border-border-subtle rounded-[4px] overflow-hidden", isMain && "md:col-span-2")}>
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border-subtle bg-black/30">
                <div className={cn("font-mono text-[10px] flex items-center gap-1.5", offline ? "text-text-ghost" : "text-neon-orange")}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", offline ? "bg-text-ghost" : "bg-neon-red animate-blink")} />
                    {title}
                </div>
                {!offline && (
                    <div className="flex gap-1.5">
                        <FilterBtn active={filter === 'night'} onClick={() => setFilter('night')}>NIGHT</FilterBtn>
                        <FilterBtn active={filter === 'thermal'} onClick={() => setFilter('thermal')}>THERMAL</FilterBtn>
                        <FilterBtn active={filter === 'ir'} onClick={() => setFilter('ir')}>IR</FilterBtn>
                        {isMain && (
                             <FilterBtn active={motionEnabled!} onClick={onToggleMotion}>MOTION</FilterBtn>
                        )}
                    </div>
                )}
                {offline && <button className="bg-transparent border border-border-subtle py-0.5 px-2 rounded-[2px] text-text-dim text-[9px] font-orbitron cursor-pointer hover:border-neon-blue hover:text-neon-blue">RECONNECT</button>}
            </div>

            <div className="relative group">
                <canvas ref={canvasRef} className="w-full block bg-black" />
                {!offline && (
                    <>
                        <div className="absolute top-1.5 left-1.5 font-mono text-[9px] text-neon-green opacity-70 pointer-events-none uppercase">
                            {filter} VISION ACTIVE {isMain && motionEnabled && "// MOTION DETECTION: ON"}
                        </div>
                        <div className="absolute inset-0 pointer-events-none border-border-accent/40 border-t border-l border-r border-b">
                            <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-neon-orange opacity-60" />
                            <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-neon-orange opacity-60" />
                        </div>
                        {motionAlert && (
                            <div className="absolute top-1.5 right-1.5 bg-neon-red/80 px-1.5 py-0.5 rounded-[2px] font-mono text-[9px] text-white animate-blink">
                                MOTION!
                            </div>
                        )}
                    </>
                )}
                {offline && (
                    <div className="absolute inset-0 flex items-center justify-center font-orbitron text-[11px] tracking-[3px] text-text-ghost">
                        SIGNAL LOST
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterBtn({ active, onClick, children }: { active: boolean, onClick: any, children: React.ReactNode }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "px-2 py-0.5 bg-transparent border border-border-subtle rounded-[2px] text-text-dim text-[9px] font-orbitron cursor-pointer tracking-[1px] transition-all hover:border-neon-blue hover:text-neon-blue",
                active && "border-neon-violet text-neon-violet bg-neon-violet/10"
            )}
        >
            {children}
        </button>
    );
}
