'use client';

import { useEffect, useState } from 'react';

interface SmokeParticle {
  id: number;
  left: number;
  drift: number;
  duration: number;
  size: number;
  delay: number;
}

export default function SmokeBackground() {
  const [particles, setParticles] = useState<SmokeParticle[]>([]);

  useEffect(() => {
    const createParticle = (isInitial = false) => {
      const id = Date.now() + Math.random();
      const duration = Math.random() * 12 + 10;
      const newParticle: SmokeParticle = {
        id,
        left: Math.random() * 100,
        drift: (Math.random() - 0.5) * 120,
        duration,
        size: Math.random() * 200 + 100,
        delay: isInitial ? Math.random() * -duration : 0,
      };

      setParticles((prev) => [...prev, newParticle]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, newParticle.duration * 1000);
    };

    const interval = setInterval(() => {
      if (document.hidden) return;
      createParticle();
    }, 2000);

    // Initial particles
    for (let i = 0; i < 8; i++) {
        createParticle(true);
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-1 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-[-100px] rounded-full blur-[20px] animate-smoke"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'radial-gradient(ellipse, rgba(80, 60, 140, 0.12) 0%, transparent 70%)',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
