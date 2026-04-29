import React, { createContext, useContext } from 'react';
import { useTerminalStore } from '../store/slices/terminalStore';

interface TerminalContextType {
  output: string[];
  currentDir: string;
  isProcessing: boolean;
  addOutput: (line: string) => void;
  setCurrentDir: (dir: string) => void;
  setProcessing: (isProcessing: boolean) => void;
}

const TerminalContext = createContext<TerminalContextType | null>(null);

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useTerminalStore();
  return (
    <TerminalContext.Provider value={store}>
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminal = (): TerminalContextType => {
  const context = useContext(TerminalContext);
  if (!context) throw new Error('useTerminal must be used within TerminalProvider');
  return context;
};
