import React from 'react';
import { X, Zap } from 'lucide-react';

interface GenerateModalProps {
  isGenerateModalOpen: boolean;
  setIsGenerateModalOpen: (open: boolean) => void;
  generateMode: 'snippet' | 'file';
  setGenerateMode: (mode: 'snippet' | 'file') => void;
  generatePrompt: string;
  setGeneratePrompt: (prompt: string) => void;
  executeGenerateCode: () => void;
  isAiProcessing: boolean;
}

export const GenerateModal: React.FC<GenerateModalProps> = ({
  isGenerateModalOpen,
  setIsGenerateModalOpen,
  generateMode,
  setGenerateMode,
  generatePrompt,
  setGeneratePrompt,
  executeGenerateCode,
  isAiProcessing,
}) => {
  if (!isGenerateModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in zoom-in duration-300">
    <div className="w-full max-w-2xl bg-[#0d0404] border border-accent-900/30 rounded-[30px] md:rounded-[40px] shadow-[0_0_100px_var(--color-accent-800)/20] overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="p-6 border-b border-accent-900/20 bg-black/40 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-black text-accent-100 uppercase tracking-tighter">
              Neural Forge
            </h3>
            <p className="text-[10px] md:text-xs text-accent-900 font-bold tracking-widest uppercase">
              Describe desired functionality to generate code
            </p>
          </div>
          <button
            onClick={() => setIsGenerateModalOpen(false)}
            className="p-3 bg-accent-950/20 border border-accent-900/20 rounded-full text-accent-500 hover:bg-accent-900/40 transition-all shrink-0 ml-4"
            aria-label="Close forge modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-accent-800 uppercase tracking-[0.3em]">
              Generation Mode
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setGenerateMode('snippet')}
                className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${generateMode === 'snippet' ? 'bg-accent-700 border-accent-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-accent-950/20 border-accent-900/30 text-accent-500 hover:bg-accent-900/40'}`}
                aria-label="Generate code snippet"
              >
                Snippet (Insert)
              </button>
              <button
                onClick={() => setGenerateMode('file')}
                className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${generateMode === 'file' ? 'bg-accent-700 border-accent-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-accent-950/20 border-accent-900/30 text-accent-500 hover:bg-accent-900/40'}`}
                aria-label="Generate new file"
              >
                New File
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-accent-800 uppercase tracking-[0.3em]">
              Prompt
            </label>
            <textarea
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              placeholder={
                generateMode === 'file'
                  ? 'e.g., Create a React component named UserProfile that fetches user data...'
                  : 'e.g., Write a function to sort an array of objects by a specific key...'
              }
              className="w-full h-32 bg-black/60 border border-accent-900/40 rounded-2xl p-4 text-xs text-accent-100 focus:border-accent-500/50 outline-none transition-all resize-none custom-scrollbar"
              aria-label="Forge prompt"
            />
          </div>
        </div>
        <div className="p-6 md:p-8 border-t border-accent-900/20 bg-black/40 flex justify-end shrink-0">
          <button
            onClick={executeGenerateCode}
            disabled={!generatePrompt.trim() || isAiProcessing}
            className="px-8 py-3 bg-accent-600 rounded-xl text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-accent-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-2"
            aria-label="Materialize Code"
          >
            <Zap className="w-4 h-4" /> Materialize Code
          </button>
        </div>
      </div>
    </div>
  );
};
