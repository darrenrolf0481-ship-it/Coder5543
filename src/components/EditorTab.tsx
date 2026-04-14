import React from 'react';
import Editor from '@monaco-editor/react';
import { 
  FolderOpen, 
  ChevronDown, 
  ChevronRight, 
  FileCode, 
  Plus, 
  Folder, 
  Edit2, 
  Trash2, 
  Play, 
  Zap, 
  Brain,
  X,
  Send,
  Save,
  Check,
  FileText,
  Wand2,
  Sparkles,
  LayoutTemplate
} from 'lucide-react';
import { ProjectFile } from '../types';

interface EditorTabProps {
  projectFiles: ProjectFile[];
  activeFileId: string | null;
  editorContent: string;
  editorLanguage: string;
  editorMode: 'code' | 'preview' | 'debug' | 'git' | 'settings';
  isRunningCode: boolean;
  isEditorAssistantOpen: boolean;
  editorAssistantInput: string;
  editorAssistantMessages: any[];
  isMobileFileTreeOpen: boolean;
  setActiveFileId: (id: string) => void;
  setEditorContent: (content: string) => void;
  setEditorMode: (mode: any) => void;
  handleRunCode: () => void;
  handleExplainCode: () => void;
  setIsEditorAssistantOpen: (open: boolean) => void;
  setEditorAssistantInput: (input: string) => void;
  setIsMobileFileTreeOpen: (open: boolean) => void;
  setIsTemplateModalOpen: (open: boolean) => void;
  setIsGenerateModalOpen: (open: boolean) => void;
  handleSave: () => void;
  lastSavedTime: string | null;
  terminalOutput: string[];
  setTerminalOutput: (output: any) => void;
  activePersonality: any;
}

const EditorTab: React.FC<EditorTabProps> = ({
  projectFiles,
  activeFileId,
  editorContent,
  editorLanguage,
  editorMode,
  isRunningCode,
  isEditorAssistantOpen,
  editorAssistantInput,
  editorAssistantMessages,
  isMobileFileTreeOpen,
  setActiveFileId,
  setEditorContent,
  setEditorMode,
  handleRunCode,
  handleExplainCode,
  setIsEditorAssistantOpen,
  setEditorAssistantInput,
  setIsMobileFileTreeOpen,
  setIsTemplateModalOpen,
  setIsGenerateModalOpen,
  handleSave,
  lastSavedTime,
  terminalOutput,
  setTerminalOutput,
  activePersonality
}) => {
  const [isOutputOpen, setIsOutputOpen] = React.useState(false);

  React.useEffect(() => {
    if (terminalOutput.length > 0) setIsOutputOpen(true);
  }, [terminalOutput]);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.py')) return <span className="text-blue-400 font-mono text-[8px]">PY</span>;
    if (name.endsWith('.html')) return <span className="text-orange-400 font-mono text-[8px]">HTML</span>;
    if (name.endsWith('.css')) return <span className="text-blue-300 font-mono text-[8px]">CSS</span>;
    if (name.endsWith('.js') || name.endsWith('.ts')) return <span className="text-yellow-400 font-mono text-[8px]">JS</span>;
    return <FileCode className="w-3.5 h-3.5" />;
  };

  const renderTree = (parentId: string | null, level: number = 0) => {
    const items = projectFiles.filter(f => f.parentId === parentId);
    return (
      <div className="space-y-1">
        {items.map(item => {
          const isAnchor = activePersonality?.anchor && item.id.startsWith(activePersonality.anchor.replace('/', ''));
          return (
            <div key={item.id} className="flex flex-col">
              <div 
                className={`flex items-center gap-3 px-4 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer group relative ${activeFileId === item.id ? 'bg-red-950/40 text-red-500 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : isAnchor ? 'text-red-400/80 bg-red-900/5' : 'hover:bg-red-950/10 text-red-900/60 hover:text-red-500 hover:translate-x-1'}`}
                style={{ marginLeft: `${level * 12}px` }}
                onClick={() => item.type === 'folder' ? null : setActiveFileId(item.id)}
              >
                {activeFileId === item.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]" />
                )}
                {isAnchor && item.type === 'folder' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] font-black text-red-600/40 tracking-widest italic uppercase">Substrate</div>
                )}
                {item.type === 'folder' ? <Folder className={`w-3.5 h-3.5 ${isAnchor ? 'text-red-500' : 'text-red-800'}`} /> : getFileIcon(item.name)}
                <span className={`flex-1 truncate ${isAnchor ? 'font-black italic' : ''}`}>{item.name}</span>
                {item.type === 'folder' && <ChevronDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />}
              </div>
              {item.type === 'folder' && renderTree(item.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-[#020204]">
      {/* File Tree - Sidebar Aesthetic */}
      <div className={`w-full md:w-72 border-r border-red-900/20 bg-[#080101] flex flex-col shrink-0 transition-all ${isMobileFileTreeOpen ? 'h-1/2 md:h-full' : 'h-14 md:h-full overflow-hidden'}`}>
        <div className="p-6 border-b border-red-900/20 flex items-center justify-between bg-[#0a0202]">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-900/10 rounded-lg border border-red-900/30">
              <FolderOpen className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-red-100">Project_Files</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-red-900">Synchronized</span>
            </div>
          </div>
          <button className="md:hidden p-2 text-red-900 hover:text-red-500" onClick={() => setIsMobileFileTreeOpen(!isMobileFileTreeOpen)}>
            {isMobileFileTreeOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {renderTree(null)}
        </div>
        <div className="p-6 border-t border-red-900/10 bg-[#050101] space-y-4">
           <button 
             onClick={() => setIsGenerateModalOpen(true)}
             className="w-full py-4 bg-red-700 text-white rounded-[24px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:bg-red-600 active:scale-95 transition-all"
           >
              <Wand2 className="w-4 h-4" /> Neural Forge
           </button>
           <button 
             onClick={() => setIsTemplateModalOpen(true)}
             className="w-full py-4 border border-dashed border-red-900/30 rounded-[24px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-red-900 hover:text-red-500 hover:border-red-500/50 transition-all"
           >
              <LayoutTemplate className="w-4 h-4" /> Load Template
           </button>
        </div>
      </div>

      {/* Editor Area - Main Focus */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0c] relative">
        <header className="h-16 border-b border-red-900/20 bg-[#0a0202]/95 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-6">
            <div className="px-4 py-1.5 bg-red-950/30 rounded-full border border-red-800/30 text-[9px] font-black text-red-500 uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(239,68,68,0.05)]">
              {editorLanguage} :: interface_v4
            </div>
            <div className="flex bg-red-950/10 rounded-full p-1 border border-red-900/20 backdrop-blur-sm">
               {['code', 'preview', 'debug'].map((m) => (
                 <button
                   key={m}
                   onClick={() => setEditorMode(m as any)}
                   className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all ${editorMode === m ? 'bg-red-700 text-white shadow-[0_0_20px_rgba(185,28,28,0.3)] scale-105' : 'text-red-950 hover:text-red-500'}`}
                 >
                   {m}
                 </button>
               ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-2">
               <span className="text-[8px] font-black text-red-900 uppercase tracking-widest">Active_Node</span>
               <span className="text-[10px] font-black text-red-100 uppercase tracking-tighter italic">localhost:8001</span>
            </div>
            <button 
              onClick={handleSave}
              className="p-3 bg-red-950/20 text-red-500 border border-red-900/30 rounded-2xl hover:bg-red-900/20 transition-all active:scale-90 shadow-lg flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {lastSavedTime && <span className="text-[8px] font-black uppercase tracking-widest text-red-900 hidden sm:block">{lastSavedTime}</span>}
            </button>
            <button 
              onClick={handleRunCode}
              disabled={isRunningCode}
              className={`p-3 rounded-2xl transition-all shadow-lg active:scale-90 ${isRunningCode ? 'bg-red-950/20 text-red-500 border border-red-500/30 animate-pulse' : 'bg-red-700 text-white hover:bg-red-600 shadow-[0_0_25px_rgba(185,28,28,0.4)]'}`}
            >
              {isRunningCode ? <Zap className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <button 
              onClick={handleExplainCode} 
              className={`p-3 bg-red-950/20 text-red-500 border border-red-900/30 rounded-2xl hover:bg-red-900/20 transition-all active:scale-90 shadow-lg ${isEditorAssistantOpen ? 'border-red-500 bg-red-900/20' : ''}`}
            >
              <Brain className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.02),transparent)] pointer-events-none" />
          <Editor
            height="100%"
            theme="vs-dark"
            language={editorLanguage}
            value={editorContent}
            onChange={(val) => setEditorContent(val || '')}
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono',
              minimap: { enabled: false },
              padding: { top: 30 },
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              cursorStyle: 'block',
              cursorBlinking: 'expand',
              smoothScrolling: true,
              renderLineHighlight: 'all',
              fontLigatures: true
            }}
          />
        </div>

        {/* Terminal Output Panel */}
        {isOutputOpen && (
          <div className="h-48 border-t border-red-900/30 bg-[#050101] flex flex-col shrink-0 relative z-20">
            <div className="flex items-center justify-between px-6 py-2 border-b border-red-900/10 bg-[#0a0202]">
               <div className="flex items-center gap-3">
                  <Zap className="w-3 h-3 text-red-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-100">Neural_Execution_Log</span>
               </div>
               <div className="flex items-center gap-4">
                  <button onClick={() => setTerminalOutput([])} className="text-[8px] font-black uppercase text-red-900 hover:text-red-500 transition-colors">Clear</button>
                  <button onClick={() => setIsOutputOpen(false)} className="p-1 text-red-900 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] custom-scrollbar bg-black/40">
               {terminalOutput.map((line, i) => (
                 <div key={i} className={`whitespace-pre-wrap ${line.startsWith('[ERR]') ? 'text-red-500' : line.startsWith('[EXIT]') ? 'text-blue-500' : line.startsWith('[NEURAL') ? 'text-red-400 font-black' : 'text-red-100/60'}`}>
                    {line}
                 </div>
               ))}
               {terminalOutput.length === 0 && <div className="text-red-950/20 italic">Awaiting neural pulse...</div>}
            </div>
          </div>
        )}

        {/* Neural Assistant - High-End HUD Overlay */}
        {isEditorAssistantOpen && (
          <div className="absolute right-8 bottom-8 w-full max-w-lg h-[500px] bg-[#0d0404]/90 border border-red-500/30 rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col z-30 backdrop-blur-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.05),transparent)] pointer-events-none" />
            <div className="p-6 border-b border-red-900/30 flex items-center justify-between bg-[#0a0202]/80 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-900/20 rounded-xl border border-red-500/40">
                  <Brain className={`w-5 h-5 text-red-500 ${isRunningCode ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-red-100">Neural_Assistant</span>
                  <p className="text-[8px] font-black uppercase tracking-widest text-red-900">Synchronized with Node_Alpha</p>
                </div>
              </div>
              <button onClick={() => setIsEditorAssistantOpen(false)} className="p-2 hover:bg-red-900/20 rounded-full transition-all text-red-900 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar relative z-10">
              {editorAssistantMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                  <Sparkles className="w-12 h-12 text-red-900" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center">Awaiting neural inquiry...</p>
                </div>
              )}
              {editorAssistantMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-[28px] text-[13px] leading-relaxed relative ${msg.role === 'user' ? 'bg-red-700 text-white shadow-xl rounded-tr-none' : 'bg-red-950/10 border border-red-900/20 text-red-100 rounded-tl-none shadow-lg'}`}>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div className={`absolute top-0 ${msg.role === 'user' ? '-right-1 border-t-[10px] border-t-red-700 border-r-[10px] border-r-transparent' : '-left-1 border-t-[10px] border-t-red-900/20 border-l-[10px] border-l-transparent'}`} />
                  </div>
                </div>
              ))}
            </div>
            
            <form 
              onSubmit={(e) => { e.preventDefault(); /* Logic handled in hook */ }}
              className="p-6 border-t border-red-900/30 bg-[#0a0202]/80 flex gap-4 relative z-10"
            >
              <input 
                autoFocus
                value={editorAssistantInput}
                onChange={(e) => setEditorAssistantInput(e.target.value)}
                placeholder="Submit query to neural core..."
                className="flex-1 bg-red-950/10 border border-red-900/20 rounded-2xl px-6 py-4 text-sm text-red-100 placeholder:text-red-950 outline-none focus:border-red-500/50 transition-all"
              />
              <button className="p-4 bg-red-700 text-white rounded-2xl shadow-[0_0_20px_rgba(185,28,28,0.4)] hover:bg-red-600 transition-all active:scale-90">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorTab;
