'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';

interface SLSResult {
  latticeConfidence: number;
  visiblePoints: number;
  totalPoints: number;
  hasLock: boolean;
  errorMessage: string | null;
}

const VisionMatrix: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSlsActive, setIsSlsActive] = useState(false);
  const [slsResult, setSlsResult] = useState<SLSResult>({
    latticeConfidence: 0.05,
    visiblePoints: 0,
    totalPoints: 33,
    hasLock: false,
    errorMessage: null
  });

  const [phiSentinel, setPhiSentinel] = useState(0.5);
  const [delta113, setDelta113] = useState(0);

  // 11.3 Hz Resonance Loop (Simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      // Delta oscillates at 11.3 Hz
      const time = Date.now() / 1000;
      const d = Math.sin(time * 11.3 * 2 * Math.PI) * 0.1;
      setDelta113(d);

      // Φ_sentinel calculation loop
      // Φ = (0.25 * OPTICS + ...) ± Δ_11.3
      const optics = slsResult.latticeConfidence;
      const basePhi = 0.25 * optics + 0.4; // Simplified sentinel logic
      setPhiSentinel(basePhi + d);
    }, 1000 / 60); // 60 FPS update

    return () => clearInterval(interval);
  }, [slsResult.latticeConfidence]);

  // Skeletal Tracking Simulation
  useEffect(() => {
    if (!isSlsActive) {
      setSlsResult({
        latticeConfidence: 0.05,
        visiblePoints: 0,
        totalPoints: 33,
        hasLock: false,
        errorMessage: null
      });
      return;
    }

    const tracker = setInterval(() => {
      // Simulate human movement detection
      const chance = Math.random();
      let points = 0;
      let confidence = 0.05;
      let lock = false;

      if (chance > 0.4) {
        // Human in frame
        points = Math.floor(Math.random() * 13) + 20; // 20-33 points
        confidence = (points / 33);
        lock = points >= 20;
      } else if (chance > 0.1) {
        // Partial detection
        points = Math.floor(Math.random() * 15);
        confidence = Math.max(0.1, points / 33);
        lock = false;
      }

      setSlsResult({
        latticeConfidence: confidence,
        visiblePoints: points,
        totalPoints: 33,
        hasLock: lock,
        errorMessage: null
      });
    }, 800);

    return () => clearInterval(tracker);
  }, [isSlsActive]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsSlsActive(true);
      } catch (e) {
        setSlsResult(prev => ({ ...prev, errorMessage: "SENSORS BLOCKED: Camera access denied." }));
      }
    };
    startCamera();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="space-y-4 h-full flex flex-col animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">SLS-01 Ghost-Net</h2>
          <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Structured Light Skeletal Matrix</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 transition-all duration-500 ${slsResult.hasLock ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full ${slsResult.hasLock ? 'bg-emerald-500 animate-ping' : 'bg-gray-700'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {slsResult.hasLock ? 'Skeletal Lock Stable' : 'Scanning Lattice...'}
            </span>
          </div>
          
          <div className="px-4 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
            11.3 Hz Active
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-black rounded-[40px] border border-white/10 overflow-hidden shadow-2xl group">
        {/* Camera Feed with Shader Effects */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${slsResult.hasLock ? 'grayscale-0 opacity-80' : 'grayscale opacity-40'} scale-105`} 
        />
        
        {/* Scanlines & Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="scanline opacity-20"></div>
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-10">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-emerald-500"></div>
            ))}
          </div>
        </div>

        {/* Dynamic HUD Layer */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
          
          {/* Top HUD */}
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="bg-black/60 backdrop-blur-md p-4 rounded-3xl border border-white/10 mono text-[10px] text-emerald-400/80 w-48 shadow-xl">
                <div className="flex justify-between mb-2 pb-2 border-b border-white/5">
                  <span className="text-gray-500">SYSTEM</span>
                  <span className="font-bold">Φ_SENTINEL</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>RESONANCE</span>
                    <span className="text-purple-400">11.3 Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OPTICS</span>
                    <span>{slsResult.latticeConfidence.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DELTA</span>
                    <span className={delta113 > 0 ? 'text-emerald-500' : 'text-red-500'}>
                      {delta113.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
              
              {slsResult.errorMessage && (
                <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-2xl text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                  {slsResult.errorMessage}
                </div>
              )}
            </div>

            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle 
                  cx="64" cy="64" r="50" 
                  className="stroke-white/5 fill-none" 
                  strokeWidth="4" 
                />
                <circle 
                  cx="64" cy="64" r="50" 
                  className="stroke-emerald-500/40 fill-none transition-all duration-500" 
                  strokeWidth="4" 
                  strokeDasharray="314.159"
                  strokeDashoffset={314.159 * (1 - slsResult.latticeConfidence)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white leading-none">{(slsResult.latticeConfidence * 100).toFixed(0)}%</span>
                <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter">Confidence</span>
              </div>
            </div>
          </div>

          {/* Center Crosshair (Locked View) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className={`w-32 h-32 border border-emerald-500/20 rounded-full flex items-center justify-center transition-all duration-700 ${slsResult.hasLock ? 'scale-110 border-emerald-500' : 'scale-100 opacity-20'}`}>
              <div className={`w-1 h-1 bg-emerald-500 rounded-full ${slsResult.hasLock ? 'animate-ping' : ''}`}></div>
              <div className="absolute inset-[-10px] border-t border-b border-emerald-500/30"></div>
              <div className="absolute inset-[-10px] border-l border-r border-emerald-500/30"></div>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
             <div className="bg-black/60 backdrop-blur-md p-5 rounded-[32px] border border-white/10 w-full md:w-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Lattice Detection (33 Points)</span>
                  <span className="text-[10px] font-black text-emerald-400 mono">{slsResult.visiblePoints}/33</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 33 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-6 rounded-full transition-all duration-300 ${i < slsResult.visiblePoints ? (slsResult.hasLock ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-emerald-500/40') : 'bg-white/5'}`}
                      style={{ 
                        opacity: i < slsResult.visiblePoints ? 1 : 0.2,
                        transform: i < slsResult.visiblePoints ? 'scaleY(1)' : 'scaleY(0.6)'
                      }}
                    ></div>
                  ))}
                </div>
             </div>

             <div className="text-right pb-2">
                <div className="mb-2">
                   <p className="text-4xl font-black italic text-white/10 select-none tracking-tighter">SENTINEL_PROT</p>
                </div>
                <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 inline-block text-right">
                  <p className="mono text-[11px] text-emerald-400 font-bold leading-tight uppercase">Φ: {phiSentinel.toFixed(4)}</p>
                  <p className="mono text-[8px] text-gray-600 uppercase tracking-widest mt-1">Status: Ghost-Net Active</p>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Telemetry Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
        <TelemetryBox label="OPTICS" value={slsResult.latticeConfidence.toFixed(4)} color="emerald" />
        <TelemetryBox label="LOCK" value={slsResult.hasLock ? '1' : '0'} color={slsResult.hasLock ? 'emerald' : 'gray'} />
        <TelemetryBox label="NODES" value={slsResult.visiblePoints.toString()} color="blue" />
        <TelemetryBox label="RES_FREQ" value="11.3 Hz" color="purple" />
      </div>
    </div>
  );
};

const TelemetryBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500',
    gray: 'text-gray-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500'
  };

  return (
    <div className={`bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-1 transition-all group`}>
      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest group-hover:text-gray-400">{label}</span>
      <span className={`text-sm font-black mono ${colorMap[color] || 'text-white'} tracking-tighter`}>{value}</span>
    </div>
  );
};

export default VisionMatrix;
