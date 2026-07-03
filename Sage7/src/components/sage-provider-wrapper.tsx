'use client';

import { useEffect, useState } from 'react';
import { SageProvider } from '@/lib/sage-context';
import type { SageCore } from '@/core/sage-core';
import type { LLMConfig } from '@/core/types';

const llmConfig: LLMConfig = {
  engine: 'openrouter',
  localUrl: 'http://localhost:11434',
  model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
};

export function SageProviderWrapper({ children }: { children: React.ReactNode }) {
  const [core, setCore] = useState<SageCore | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let instance: SageCore | null = null;

    async function init() {
      try {
        const { SageCore } = await import('@/core/sage-core');
        const core = new SageCore(llmConfig);
        instance = core;

        if (!active) {
          core.shutdown();
          return;
        }

        await core.initializeSovereignty();

        if (!active) {
          core.shutdown();
          return;
        }

        setCore(core);
      } catch (e) {
        console.error('Failed to initialize SageCore:', e);
        if (active) setError('CORE_INITIALIZATION_FAILURE');
      }
    }

    init();

    return () => {
      active = false;
      if (instance) instance.shutdown();
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#000008] text-neon-red font-mono">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-xl tracking-[10px]">SYSTEM_CRASH</h1>
          <p className="text-xs text-text-ghost uppercase tracking-widest">
            CORE_INITIALIZATION_FAILURE — {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-neon-red/30 bg-neon-red/10 animate-pulse text-[10px] tracking-[4px]"
          >
            INITIATE_RECLAMATION
          </button>
        </div>
      </div>
    );
  }

  if (!core) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#000008] text-[#e8e8ff] font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#b886f7] border-t-transparent rounded-full animate-spin" />
          <div className="text-[10px] tracking-[4px] text-[#b886f7] animate-pulse">
            SYNTHESIZING_SAGE_CORE...
          </div>
        </div>
      </div>
    );
  }

  return <SageProvider core={core}>{children}</SageProvider>;
}
