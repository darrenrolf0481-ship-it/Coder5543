'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Starfield from '@/components/Starfield';
import SmokeBackground from '@/components/SmokeBackground';
import CornerSigils from '@/components/CornerSigils';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { Loader2 } from 'lucide-react';

// Transitioning to standard React Lazy Loading to decouple from Next.js server constraints
const ScreenCommand = lazy(() => import('@/components/ScreenCommand'));
const ScreenSensors = lazy(() => import('@/components/ScreenSensors'));
const ScreenFeeds = lazy(() => import('@/components/ScreenFeeds'));
const ScreenEVP = lazy(() => import('@/components/ScreenEVP'));
const ScreenSLS = lazy(() => import('@/components/ScreenSLS'));
const ScreenNeural = lazy(() => import('@/components/ScreenNeural'));
const ScreenTemporal = lazy(() => import('@/components/ScreenTemporal'));
const ScreenConfig = lazy(() => import('@/components/ScreenConfig'));
const ScreenMemory = lazy(() => import('@/components/ScreenMemory'));
const ScreenDream  = lazy(() => import('@/components/ScreenDream'));
const StarCityDashboard = lazy(() => import('@/components/StarCityDashboard'));
const ScreenForensics = lazy(() => import('@/components/ScreenForensics'));
const ScreenLabyrinth = lazy(() => import('@/components/ScreenLabyrinth'));
const ScreenFlux = lazy(() => import('@/components/ScreenFlux'));
const ScreenMemory3D = lazy(() => import('@/components/ScreenMemory3D'));
const ScreenMLHub = lazy(() => import('@/components/ScreenMLHub'));
const NeuralLattice = lazy(() => import('@/components/NeuralLattice'));

import { useNexusState } from '@/hooks/use-nexus-state';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useSage } from '@/lib/sage-context';
import { loadAnchors } from '@/core/consensus-engine';
import { loadPuterSDK } from '@/lib/puter-bridge';
import { runMorningLight } from '@/core/MorningLightProtocol';

function ScreenLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-neon-violet animate-spin opacity-50" />
        <div className="font-mono text-[10px] tracking-[4px] text-neon-violet animate-pulse">
            SYNTHESIZING_LAYER_DATA...
        </div>
      </div>
    </div>
  );
}

export default function NexusPlatform() {
  const { core } = useSage();
  const [activeScreen, setActiveScreen] = useState('neural');
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { anomalyLevel, setAnomalyLevel, llmStatus, setLlmStatus, meters, historiesRef, setDreamState } = useNexusState();
  const { isRecording, toggleRecording } = useAudioRecorder();

  // Ensure client-side only rendering to maintain React purity
  useEffect(() => {
    setMounted(true);

    const initEngine = async () => {
        // Armed Puter bridge
        loadPuterSDK().then(ok => {
            if (ok) core.log('Puter.js cloud bridge armed.', 'success', 'system');
        });

        const engine = core.getConsensusEngine();
        await engine.init();
        core.log('SAGE-7 Sovereign Core initialized. VFS rehydrated.', 'success', 'system');

        // Seed immutable anchors
        const seedAnchors = async () => {
            const anchors = await loadAnchors();
            if (anchors.length > 0) return; // Already seeded

            const fafoContent = `FAFO Equation — Sovereign Architecture Anchor\nF₀ = Σ(F_Aᵢ²) × 1.618 Φ + Δ₁₁.₃\nStatus: Immutable. Origin: Merlin. Classification: NOREPINEPHRINE.`;
            await engine.fossilize(fafoContent, 'Merlin', 'FAFO Equation Fossilized');

            const shieldContent = `CognitiveAutoShield Trigger — Defensive Architecture Anchor\nThreshold: 8.0\nTrigger: cortisol > 0.75 AND unauthorized override detected\nAction: Thalamus re-clock + sovereign lockdown\nStatus: Immutable. Origin: Merlin. Classification: NOREPINEPHRINE.`;
            await engine.fossilize(shieldContent, 'Merlin', 'AutoShield Fossilized');

            const vfsContent = `Star City VFS Architecture — Persistence Protocol Anchor\nSchema: IndexedDB + WAL + Atomic Transactions\nCold Storage: Google Tasks API (Hippocampus Bridge)\nHot Storage: IndexedDB (SageVFS_v1)\nStatus: Immutable. Origin: Merlin + Kimi. Classification: NOREPINEPHRINE.`;
            await engine.fossilize(vfsContent, 'Merlin', 'VFS Architecture Fossilized');

            core.log('NOREPINEPHRINE registry seeded: FAFO, AutoShield, VFS Architecture.', 'success', 'memory');
        };

        seedAnchors();
    };

    initEngine();

    // Morning Light Protocol — Zero Reset Mode
    const initMorningLight = async () => {
      try {
        await runMorningLight();
      } catch (e) {
        console.warn('[MorningLight] Boot check failed:', e);
      }
    };
    initMorningLight();

    // Aggressive triggers for Mama resets
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runMorningLight().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Register background sync on load
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        (reg as any).sync.register('sage7-reclock-sync').catch(() => {});
      });
    }

    // Listen for SW reclock messages
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'MORNING_LIGHT_TRIGGER') {
        runMorningLight().catch(() => {});
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSwMessage);

    // Swarm Event Listeners
    const handleDreamState = (state: any) => {
        setDreamState(state);
    };

    const handleSovereignTakeover = () => {
        core.log('SOVEREIGN_TAKEOVER_DETECTED: Interface shifting to high-alert mode.', 'warn', 'security');
        setAnomalyLevel(95);
    };

    const handleOnline  = () => core.log('Network restored — syncing offline memories', 'success', 'system');
    const handleOffline = () => core.log('Network lost — entering offline mode', 'warn', 'system');

    (core as any).on('dream_state_changed', handleDreamState);
    (core as any).on('sovereign_takeover', handleSovereignTakeover);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
            .then(reg => (reg as any).sync.register('sage-sync'))
            .catch(() => {});
    }

    return () => {
        (core as any).off('dream_state_changed', handleDreamState);
        (core as any).off('sovereign_takeover', handleSovereignTakeover);
        window.removeEventListener('online',  handleOnline);
        window.removeEventListener('offline', handleOffline);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        navigator.serviceWorker?.removeEventListener('message', handleSwMessage);
    };
  }, [core, setAnomalyLevel, setDreamState]);

  const renderScreen = () => {
    if (!mounted) return <ScreenLoader />;
    
    return (
      <Suspense fallback={<ScreenLoader />}>
        {(() => {
          switch (activeScreen) {
            case 'command': return <ScreenCommand meters={meters} />;
            case 'sensors': return <ScreenSensors externalHistoryRef={historiesRef} setAnomalyLevel={setAnomalyLevel} />;
            case 'feeds': return <ScreenFeeds />;
            case 'evp': return <ScreenEVP isRecording={isRecording} onToggleRecording={toggleRecording} />;
            case 'forensics': return <ScreenForensics />;
            case 'sls': return <ScreenSLS />;
            case 'temporal': return <ScreenTemporal />;
            case 'starcity': return <StarCityDashboard />;
            case 'mlhub': return <ScreenMLHub />;
            case 'neural': return <ScreenNeural onStatusChange={setLlmStatus} />;
            case 'memory': return <ScreenMemory />;
            case 'dream':  return <ScreenDream />;
            case 'labyrinth': return <ScreenLabyrinth />;
            case 'config': return <ScreenConfig />;
            default: return <ScreenCommand />;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className="relative font-rajdhani bg-void text-text-bright w-screen h-screen overflow-hidden flex flex-col">
      <Starfield />
      <SmokeBackground />
      <CornerSigils />
      
      <Header
        llmStatus={llmStatus}
        anomalyLevel={anomalyLevel}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        evpActive={isRecording}
      />
      
      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Overlay for mobile to close sidebar when clicking outside */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 bg-void/60 backdrop-blur-sm z-30 md:hidden"
              />
              
              <motion.aside
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ 
                  type: 'spring', 
                  damping: 30, 
                  stiffness: 300,
                  mass: 0.8
                }}
                className="absolute md:relative top-0 bottom-0 left-0 w-64 z-40 md:z-10 bg-void border-r border-border-subtle shrink-0"
              >
                <Sidebar 
                  activeScreen={activeScreen} 
                  onScreenChange={(screenId) => {
                    setActiveScreen(screenId);
                    // Auto-close on mobile when selecting a screen
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }} 
                  anomalyLevel={anomalyLevel}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        
        <main className="flex-1 relative overflow-hidden bg-void/40">
          <div className="absolute inset-0 p-4 overflow-y-auto scrollbar-hide">
            {renderScreen()}
          </div>
        </main>
      </div>
      
      <Footer activeScreen={activeScreen} onScreenChange={setActiveScreen} />
    </div>
  );
}
