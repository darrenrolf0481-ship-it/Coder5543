import { create } from 'zustand';

interface TerminalStore {
  output: string[];
  currentDir: string;
  isProcessing: boolean;
  addOutput: (line: string) => void;
  setCurrentDir: (dir: string) => void;
  setProcessing: (isProcessing: boolean) => void;
}

export const useTerminalStore = create<TerminalStore>((set) => ({
  output: ['CRIMSON OS v4.1.0_KORE_BOOT', 'Kernel: Android-SD Neural Link Established'],
  currentDir: '~',
  isProcessing: false,
  addOutput: (line) => set((state) => ({ output: [...state.output, line] })),
  setCurrentDir: (dir) => set({ currentDir: dir }),
  setProcessing: (isProcessing) => set({ isProcessing }),
}));
