import React, { useState, useEffect } from 'react';
import { useProjectStore, ProjectFile } from '../../store/useProjectStore';
import { FileText, Play, Save, CheckCircle, Bot, Code, AlertTriangle } from 'lucide-react';

interface EditorPanelProps {
  projectFiles: ProjectFile[];
  activeFileId: string;
  editorContent: string;
  setEditorContent: (content: string) => void;
  setActiveFileId: (id: string) => void;
  setProjectFiles: (files: ProjectFile[]) => void;
}

export function EditorPanel({
  projectFiles,
  activeFileId,
  editorContent,
  setEditorContent,
  setActiveFileId,
  setProjectFiles,
}: EditorPanelProps) {
  const { 
    attachedAgent, 
    addTerminalOutput,
    llmProvider,
    openrouterKey,
    ollamaEndpoint,
    ragKnowledge,
    agentMemories,
    longTermMemories,
    currentMode
  } = useProjectStore();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSwarming, setIsSwarming] = useState(false);

  const activeFile = projectFiles.find((f) => f.id === activeFileId);

  // Trigger manual save
  const handleSave = () => {
    setSaveStatus('saving');
    addTerminalOutput(`[SYSTEM] Saving modifications to "${activeFile?.name || 'file'}"...`);
    
    // Write back content to project store files array
    const updatedFiles = projectFiles.map((f) =>
      f.id === activeFileId ? { ...f, content: editorContent } : f
    );
    setProjectFiles(updatedFiles);

    setTimeout(() => {
      setSaveStatus('saved');
      addTerminalOutput(`[SYSTEM] Saved changes to "${activeFile?.name || 'file'}" successfully.`);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  // Run swarm tasks on the current file
  const handleRunAgent = async () => {
    if (!attachedAgent) {
      addTerminalOutput('[SYSTEM] RUN AGENT halted: Please attach an agent first (type "attach sage" in Neural Studio).');
      return;
    }

    setIsSwarming(true);
    addTerminalOutput(`[SWARM] Commencing file compilation & structural modification loop...`);

    // We can call Swarm logic from here
    try {
      const prompt = `You are executing a code optimization/improvement task. Fully analyze the active file and improve it using your specialized personality (${attachedAgent.name.toUpperCase()}). Maintain syntax correctness and output ONLY the complete updated file code without any conversational framing.`;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentFile: editorContent,
          fileName: activeFile?.name || 'untitled',
          language: activeFile?.language || 'typescript',
          attachedAgent,
          mode: currentMode,
          llmProvider,
          openrouterKey,
          ollamaEndpoint,
          ragKnowledge,
          agentMemories,
          longTermMemories
        }),
      });

      if (!response.ok) throw new Error('API server unreachable.');

      const data = await response.json();
      let code = data.text || '';
      
      // Sanitize AI Markdown outputs
      if (code.includes('```')) {
        const parts = code.split('```');
        const contentBlock = parts[1];
        if (contentBlock) {
          const lines = contentBlock.split('\n');
          if (lines[0].trim() && !lines[0].includes(' ') && lines[0].length < 15) {
            lines.shift();
          }
          code = lines.join('\n').trim();
        }
      }

      setEditorContent(code);
      
      // Update store
      const updatedFiles = projectFiles.map((f) =>
        f.id === activeFileId ? { ...f, content: code } : f
      );
      setProjectFiles(updatedFiles);

      addTerminalOutput(`[${attachedAgent.name.toUpperCase()}] Refactoring pipeline finished. Check modified editor contents.`);
    } catch (err: any) {
      addTerminalOutput(`[SYSTEM EXCEPTION] Swarm pipeline error: ${err.message || err}`);
    } finally {
      setIsSwarming(false);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
      currentMode === 'development' ? 'glass-panel-dev' : 'glass-panel-audit'
    }`}>
      {/* LEFT: File Navigator sidebar */}
      <div className="w-full md:w-56 bg-black/45 border-b md:border-b-0 md:border-r border-white/5 p-2 md:p-3 select-none flex flex-row md:flex-col shrink-0 overflow-x-auto md:overflow-y-auto custom-scrollbar gap-2 md:gap-0 items-center md:items-stretch max-h-14 md:max-h-none">
        <div className="hidden md:flex items-center gap-2 mb-4 px-2 py-1.5 border-b border-white/5 shrink-0">
          <Code className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-[10px] font-bold text-slate-400 tracking-wider">FILES IN WORKSPACE</span>
        </div>
        
        <div className="flex flex-row md:flex-col gap-1.5 md:space-y-1.5 w-full shrink-0 md:shrink">
          {projectFiles.map((file) => {
            const isSelected = file.id === activeFileId;
            return (
              <button
                key={file.id}
                onClick={() => setActiveFileId(file.id)}
                className={`flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-xl text-left transition-all shrink-0 md:w-full border ${
                  isSelected
                    ? currentMode === 'development'
                      ? 'bg-indigo-950/20 border-indigo-500/25 text-indigo-300 font-bold'
                      : 'bg-emerald-950/20 border-emerald-500/25 text-emerald-300 font-bold'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-transparent'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? (currentMode === 'development' ? 'text-blue-400' : 'text-emerald-400') : 'text-slate-600'}`} />
                <span className="font-mono text-[11px] md:text-xs truncate max-w-[120px] md:max-w-none">{file.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Editor workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Editor Sub-Header */}
        <div className="p-3 sm:p-4 border-b border-white/5 bg-black/25 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between select-none">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-300">
                ACTIVE FILE: <span className={currentMode === 'development' ? 'text-blue-400' : 'text-emerald-400'}>{activeFile?.name || 'No file selected'}</span>
              </span>
              {attachedAgent && (
                <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-0.5 ${
                  currentMode === 'development' ? 'bg-indigo-950/20 border-indigo-900/35 text-indigo-400' : 'bg-emerald-950/20 border-emerald-900/35 text-emerald-400'
                }`}>
                  <Bot className="w-3 h-3 animate-pulse" />
                  <span className="font-mono text-[9px] font-bold uppercase">
                    {attachedAgent.name} Watching
                  </span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 hidden xs:block">
              Workspace storage is persisted locally in temporary sandbox memory
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Run Swarm agent */}
            <button
              onClick={handleRunAgent}
              disabled={isSwarming || !attachedAgent}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                !attachedAgent
                  ? 'bg-white/5 border border-white/5 text-slate-700 cursor-not-allowed'
                  : currentMode === 'development'
                    ? 'btn-neural-secondary cursor-pointer'
                    : 'btn-neural-audit cursor-pointer'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isSwarming ? 'animate-spin' : ''}`} />
              {isSwarming ? 'SWARMING...' : 'RUN AGENT'}
            </button>

            {/* Save file */}
            <button
              onClick={handleSave}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-all active:scale-95 flex-row shrink-0 ${
                saveStatus === 'saved'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : currentMode === 'development'
                    ? 'btn-neural-primary cursor-pointer'
                    : 'btn-neural-audit cursor-pointer bg-emerald-500/10 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/25'
              }`}
            >
              {saveStatus === 'saved' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  SAVED
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  {saveStatus === 'saving' ? 'SAVING...' : 'SAVE'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code editor pane */}
        <div className="flex-1 relative overflow-hidden bg-black/30 flex font-mono text-sm leading-relaxed p-1.5">
          {/* Mock line numbers */}
          <div className="w-10 text-right pr-3 select-none text-indigo-950/50 border-r border-white/5 font-mono text-xs pt-3 leading-6 shrink-0 font-bold">
            {Array.from({ length: 40 }).map((_, idx) => (
              <div key={idx}>{idx + 1}</div>
            ))}
          </div>

          {/* Text Area Input */}
          <textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="flex-1 h-full bg-transparent text-slate-300 p-3 font-mono text-xs focus:outline-none resize-none leading-6 custom-scrollbar"
            placeholder="No workspace file selected."
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
}
