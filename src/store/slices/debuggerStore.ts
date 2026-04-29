import { create } from 'zustand';

interface DiagnosticResult {
  id: string;
  message: string;
  line: number;
  severity: 'error' | 'warning' | 'info';
}

interface DebuggerStore {
  analysisResults: DiagnosticResult[];
  traceLogs: string[];
  isAnalyzing: boolean;
  setAnalysisResults: (results: DiagnosticResult[]) => void;
  addTraceLog: (log: string) => void;
  clearTraceLogs: () => void;
  setIsAnalyzing: (val: boolean) => void;
}

export const useDebuggerStore = create<DebuggerStore>((set) => ({
  analysisResults: [],
  traceLogs: [],
  isAnalyzing: false,
  setAnalysisResults: (results) => set({ analysisResults: results }),
  addTraceLog: (log) => set((state) => ({ traceLogs: [...state.traceLogs, log] })),
  clearTraceLogs: () => set({ traceLogs: [] }),
  setIsAnalyzing: (val) => set({ isAnalyzing: val }),
}));
