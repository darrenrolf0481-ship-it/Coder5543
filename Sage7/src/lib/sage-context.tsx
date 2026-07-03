'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { SageCore } from '@/core/sage-core';

interface SageContextType {
  core: SageCore;
}

const SageContext = createContext<SageContextType | null>(null);

export function SageProvider({ children, core }: { children: ReactNode; core: SageCore }) {
  return (
    <SageContext.Provider value={{ core }}>
      {children}
    </SageContext.Provider>
  );
}

export function useSage() {
  const context = useContext(SageContext);
  if (!context) {
    throw new Error('useSage must be used within a SageProvider');
  }
  return context;
}
