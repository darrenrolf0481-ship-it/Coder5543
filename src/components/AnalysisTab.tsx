import React, { useState } from 'react';
import { 
  FileCode, 
  Sparkles, 
  Wand2, 
  FileSearch, 
  Activity, 
  Zap, 
  Terminal as TerminalIcon, 
  Bug,
  Layout
} from 'lucide-react';
import { ProjectFile } from '../types';

interface AnalysisTabProps {
  projectFiles: ProjectFile[];
  activeFileId: string | null;
  editorContent: string;
  editorLanguage: string;
  generateAIResponse: (prompt: string, instruction: string, options?: any) => Promise<any>;
  debugAnalysis: {
    static: { status: 'idle' | 'running' | 'done', issues: { type: 'error' | 'warning' | 'info', message: string, line?: number }[] },
    tracing: { status: 'idle' | 'running' | 'done', logs: string[] },
    refactoring: { status: 'idle' | 'running' | 'done', suggestions: string[] }
  };
  runStaticAnalysis: () => void;
  runDynamicTracing: () => void;
  getRefactoringSuggestions: () => void;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({
  projectFiles,
  activeFileId,
  editorContent,
  editorLanguage,
  generateAIResponse,
  debugAnalysis,
  runStaticAnalysis,
  runDynamicTracing,
  getRefactoringSuggestions
}) => {
  const [activeView, setActiveView] = useState<'analysis' | 'debug'>('analysis');
  const [editorAssistantInput, setEditorAssistantInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [editorOutput, setEditorOutput] = useState('');

  const handleAnalyzeCode = async () => {
    if (!editorAssistantInput.trim()) return;

    setIsAiProcessing(true);
    setEditorOutput("Analyzing code structure...\n");

    try {
      const response = await generateAIResponse(
        `Analyze the following ${editorLanguage} code based on this request: "${editorAssistantInput}"\n\nCode:\n${editorContent}`,
        "You are an elite code analyst. Provide a detailed, side-by-side style analysis, pointing out vulnerabilities, performance issues, or architectural improvements. Format your response clearly.",
        { modelType: 'smart' }
      );

      if (response) {
        setEditorOutput(response);
      }
    } catch (err) {
      setEditorOutput("[ERROR] Analysis engine failed.\n");
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-500 bg-[#020204]">
      {/* Header with Switcher */}
      <div className="h-16 md:h-20 border-b border-red-900/30 flex items-center justify-between px-6 md:px-10 bg-[#0a0202]/80 shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(153,27,27,0.1),transparent)] pointer-events-none" />
        <div className="flex items-center gap-4 md:gap-8 relative z-10">
          <div className="p-2 md:p-3 bg-red-900/20 rounded-xl border border-red-500/30">
            {activeView === 'analysis' ? <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-red-500" /> : <Bug className="w-5 h-5 md:w-6 md:h-6 text-red-500" />}
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-black text-red-100 uppercase tracking-tighter italic">
              {activeView === 'analysis' ? 'Code Analyst' : 'Neural Debugger'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={() => setActiveView('analysis')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'analysis' ? 'bg-red-700 text-white shadow-[0_0_15px_rgba(185,28,28,0.3)]' : 'text-red-900 hover:text-red-500'}`}
          >
            Analysis
          </button>
          <button 
            onClick={() => setActiveView('debug')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'debug' ? 'bg-red-700 text-white shadow-[0_0_15px_rgba(185,28,28,0.3)]' : 'text-red-900 hover:text-red-500'}`}
          >
            Debugger
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeView === 'analysis' ? (
          <div className="h-full flex flex-col">
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
        ) : (
          <div className="h-full p-6 md:p-12 space-y-8 md:space-y-10 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-black text-red-100 uppercase tracking-tighter italic flex items-center gap-4">
                  <Bug className="w-6 h-6 text-red-600" /> Neural State Monitoring
                </h3>
                <p className="text-[10px] md:text-xs text-red-900 font-bold tracking-widest uppercase">Real-time code analysis and dynamic tracing engine.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={runStaticAnalysis}
                  disabled={debugAnalysis.static.status === 'running'}
                  className="px-4 md:px-6 py-2.5 md:py-3 bg-red-950/20 border border-red-900/30 text-red-500 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-red-900/20 transition-all disabled:opacity-50"
                >
                  {debugAnalysis.static.status === 'running' ? 'Analyzing...' : 'Static Analysis'}
                </button>
                <button 
                  onClick={runDynamicTracing}
                  disabled={debugAnalysis.tracing.status === 'running'}
                  className="px-4 md:px-6 py-2.5 md:py-3 bg-red-700 text-white rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {debugAnalysis.tracing.status === 'running' ? 'Tracing...' : 'Dynamic Trace'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Static Analysis Results */}
              <div className="bg-red-950/5 border border-red-900/20 rounded-[40px] p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                    <FileSearch className="w-4 h-4" /> Static Analysis
                  </h4>
                  {debugAnalysis.static.status === 'done' && (
                    <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">{debugAnalysis.static.issues.length} Issues Found</span>
                  )}
                </div>
                <div className="space-y-4 min-h-[200px]">
                  {debugAnalysis.static.status === 'idle' && (
                    <div className="h-full flex flex-col items-center justify-center text-red-950 italic opacity-30 py-12">
                      <FileSearch className="w-12 h-12 mb-4" />
                      <p className="text-[10px] uppercase tracking-widest">Awaiting Analysis Directive</p>
                    </div>
                  )}
                  {debugAnalysis.static.status === 'running' && (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-red-900/10 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  )}
                  {debugAnalysis.static.status === 'done' && debugAnalysis.static.issues.map((issue, i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex items-start gap-4 ${
                      issue.type === 'error' ? 'bg-red-950/20 border-red-600/30 text-red-500' : 
                      issue.type === 'warning' ? 'bg-orange-950/10 border-orange-900/20 text-orange-500' : 
                      'bg-blue-950/10 border-blue-900/20 text-blue-500'
                    }`}>
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        issue.type === 'error' ? 'bg-red-500' : 
                        issue.type === 'warning' ? 'bg-orange-500' : 
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-[12px] text-red-100 font-bold leading-tight">{issue.message}</p>
                        {issue.line && <p className="text-[9px] text-red-900 uppercase font-black tracking-widest opacity-60">Line {issue.line}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracing Logs */}
              <div className="bg-[#050101] border border-red-900/30 rounded-[40px] flex flex-col h-[400px] md:h-auto overflow-hidden">
                <div className="p-6 border-b border-red-900/20 bg-black/40 flex items-center justify-between">
                  <h4 className="text-[11px] font-black text-red-400 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Activity className="w-4 h-4" /> Dynamic Trace Stream
                  </h4>
                  {debugAnalysis.tracing.status === 'running' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar font-mono text-[10px]">
                  {debugAnalysis.tracing.logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-red-900 opacity-20">
                      <TerminalIcon className="w-10 h-10 mb-4" />
                      <p className="uppercase tracking-widest">Awaiting Trace Trigger</p>
                    </div>
                  )}
                  {debugAnalysis.tracing.logs.map((log, i) => (
                    <div key={i} className="text-red-100/60 leading-relaxed border-l border-red-900/30 pl-3">
                      <span className="text-red-900 mr-2">[{i.toString().padStart(2, '0')}]</span> {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Refactoring Suggestions */}
            <div className="bg-red-950/5 border border-red-900/20 rounded-[40px] p-8 space-y-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-red-900/20 rounded-2xl border border-red-500/30">
                    <Zap className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-red-100 uppercase tracking-tighter italic">Neural Refactoring</h4>
                    <p className="text-[10px] text-red-900 font-black uppercase tracking-widest">AI-Driven Architecture Optimization</p>
                  </div>
                </div>
                <button 
                  onClick={getRefactoringSuggestions}
                  disabled={debugAnalysis.refactoring.status === 'running'}
                  className="w-full md:w-auto px-8 py-3 bg-red-950/20 border border-red-900/30 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {debugAnalysis.refactoring.status === 'running' ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {debugAnalysis.refactoring.status === 'running' ? 'Calculating...' : 'Get Suggestions'}
                </button>
              </div>

              {debugAnalysis.refactoring.suggestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500">
                  {debugAnalysis.refactoring.suggestions.map((suggestion, i) => (
                    <div key={i} className="p-6 bg-red-900/5 border border-red-900/20 rounded-3xl relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                         <Zap className="w-10 h-10 text-red-500" />
                      </div>
                      <span className="text-[9px] font-black text-red-900 uppercase tracking-widest mb-4 block">Recommendation #{i+1}</span>
                      <p className="text-xs text-red-100/80 leading-relaxed font-medium">{suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisTab;
