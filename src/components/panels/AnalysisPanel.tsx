import React from 'react';
import { FileCode, Sparkles, Wand2 } from 'lucide-react';

// ── Props ──────────────────────────────────────────────────────────────────

interface AnalysisPanelProps {
  editorContent: string;
  editorOutput: string;
  isAiProcessing: boolean;
  editorAssistantInput: string;
  setEditorAssistantInput: (v: string) => void;
  handleAnalyzeCode: () => void;
  projectFiles: any[];
  activeFileId: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  editorContent,
  editorOutput,
  isAiProcessing,
  editorAssistantInput,
  setEditorAssistantInput,
  handleAnalyzeCode,
  projectFiles,
  activeFileId,
}) => {
  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-500 bg-[#020204]">
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left Pane: Current Code */}
        <div className="flex-1 flex flex-col border-r border-red-900/30">
          <div className="h-12 border-b border-red-900/30 flex items-center px-4 bg-[#0a0202]">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5" /> Original: {projectFiles.find(f => f.id === activeFileId)?.name || 'No file'}
            </span>
          </div>
          <div className="flex-1 p-4 overflow-auto custom-scrollbar">
            <pre className="text-xs font-mono text-red-100/80">
              <code>{editorContent}</code>
            </pre>
          </div>
        </div>

        {/* Right Pane: Analysis / Refactored */}
        <div className="flex-1 flex flex-col bg-[#050101]">
          <div className="h-12 border-b border-red-900/30 flex items-center px-4 bg-[#0a0202]">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Analysis
            </span>
          </div>
          <div className="flex-1 p-4 overflow-auto custom-scrollbar">
            {isAiProcessing ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
                </div>
                <span className="text-[10px] font-black text-red-700 uppercase tracking-[0.3em]">Analyzing Code Structure...</span>
              </div>
            ) : (
              <div className="text-xs font-mono text-red-100 whitespace-pre-wrap leading-relaxed">
                {editorOutput || "No analysis generated yet. Enter a prompt below to analyze the current file."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-4 md:p-6 bg-[#0a0202]/80 border-t border-red-900/20 backdrop-blur-md shrink-0">
        <div className="max-w-5xl mx-auto flex gap-4">
          <div className="relative flex-1">
            <input
              value={editorAssistantInput}
              onChange={(e) => setEditorAssistantInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAnalyzeCode();
                }
              }}
              placeholder="E.g., Find security vulnerabilities, optimize performance, or explain this code..."
              className="w-full bg-[#0d0404] border border-red-900/40 rounded-xl px-6 py-4 text-xs text-red-100 focus:border-red-600/60 outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]"
            />
          </div>
          <button
            onClick={handleAnalyzeCode}
            disabled={isAiProcessing || !editorAssistantInput.trim()}
            className="px-8 bg-red-600 rounded-xl text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" /> Analyze
          </button>
        </div>
      </div>
    </div>
  );
};
