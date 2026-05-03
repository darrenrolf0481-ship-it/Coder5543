import React from 'react';
import { ChevronRight, Sparkles, Zap } from 'lucide-react';
import { TerminalLine } from '../TerminalLine';
import { Personality } from './SettingsPanel';

interface TerminalPanelProps {
  terminalOutput: string[];
  terminalEndRef: React.RefObject<HTMLDivElement>;
  isAiProcessing: boolean;
  activePersonality: Personality;
  termInput: string;
  setTermInput: React.Dispatch<React.SetStateAction<string>>;
  termSuggestion: string;
  setTermSuggestion: React.Dispatch<React.SetStateAction<string>>;
  termSuggestions: string[];
  setTermSuggestions: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSuggestionIndex: number;
  handleTermInputChange: (val: string) => void;
  handleTermKeyDown: (e: React.KeyboardEvent) => void;
  handleTerminalCommand: (e: React.FormEvent) => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  terminalOutput, terminalEndRef, isAiProcessing, activePersonality,
  termInput, setTermInput, termSuggestion, setTermSuggestion,
  termSuggestions, setTermSuggestions, selectedSuggestionIndex,
  handleTermInputChange, handleTermKeyDown, handleTerminalCommand,
}) => (
  <div className="h-full flex flex-col p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
    <div className="flex-1 code-editor-bg rounded-[30px] md:rounded-[40px] border border-red-900/30 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden group relative">
      <div className="flex-1 p-6 md:p-8 font-mono text-[12px] md:text-[14px] overflow-y-auto custom-scrollbar bg-[linear-gradient(rgba(13,4,4,1),rgba(8,1,1,1))]">
        {terminalOutput.map((line, i) => (
          <TerminalLine key={i} line={line} />
        ))}
        {isAiProcessing && (
          <div className="text-red-600/50 text-[12px] animate-pulse py-4 flex items-center gap-3 font-black tracking-widest">
            <Zap className="w-4 h-4" />
            CALCULATING_NEURAL_VECTORS...
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {termSuggestions.length > 0 && termInput && (
        <div className="px-6 py-4 bg-[#0a0202] border-t border-red-900/10 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between px-2">
            <span className="text-[9px] font-black text-red-900 uppercase tracking-[0.3em]">Neural Suggestions</span>
            <span className="text-[9px] font-black text-red-950 uppercase tracking-[0.3em]">Press [Tab] to Cycle</span>
          </div>
          <div className="flex flex-wrap md:flex-nowrap md:overflow-x-auto no-scrollbar gap-2 md:gap-3 pb-2 md:pb-0">
            {termSuggestions.map((suggestion, idx) => {
              const isPersonalityMatch = activePersonality.suggestions?.includes(suggestion);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTermInput(suggestion);
                    setTermSuggestions([]);
                    setTermSuggestion('');
                  }}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-mono text-[10px] md:text-[11px] transition-all flex items-center gap-2 whitespace-nowrap ${
                    selectedSuggestionIndex === idx
                      ? 'bg-red-700 text-white shadow-[0_0_20px_rgba(185,28,28,0.4)] scale-105 border-red-500'
                      : 'bg-red-950/10 text-red-900 border border-red-900/20 hover:text-red-500 hover:border-red-500/30'
                  }`}
                >
                  {isPersonalityMatch && <Sparkles className="w-3 h-3" />}
                  {suggestion}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleTerminalCommand} className="p-6 bg-[#120202] border-t border-red-900/30 flex items-center gap-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] relative">
        <ChevronRight className="w-6 h-6 text-red-600" />
        <div className="flex-1 relative">
          {termSuggestion && (
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <span className="font-mono text-base text-red-900 opacity-40">
                {termInput}
                {termSuggestion.substring(termInput.length)}
              </span>
            </div>
          )}
          <input
            autoFocus
            value={termInput}
            onChange={(e) => handleTermInputChange(e.target.value)}
            onKeyDown={handleTermKeyDown}
            placeholder="system@crimson_sh ~ "
            className="w-full bg-transparent border-none outline-none font-mono text-base text-red-100 placeholder:text-red-950 relative z-10"
          />
        </div>
      </form>
    </div>
  </div>
);
