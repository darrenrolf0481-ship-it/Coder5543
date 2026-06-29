import React from 'react';
import { FileCode, Copy, Check } from 'lucide-react';
import { useArgusStore } from '../../store/useArgusStore';

export function EditorPanel() {
  const editorContent = useArgusStore((s) => s.editorContent);
  const editorFile = useArgusStore((s) => s.editorFile);
  const editorLanguage = useArgusStore((s) => s.editorLanguage);
  const setEditorContent = useArgusStore((s) => s.setEditorContent);
  const addTerminalOutput = useArgusStore((s) => s.addTerminalOutput);

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lineCount = editorContent.split('\n').length;

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-node-900/20 shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-node-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            {editorFile ?? 'untitled'}
          </span>
          <span className="text-[8px] text-slate-700 px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-800/40 uppercase">
            {editorLanguage}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] text-slate-700">{lineCount} lines</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[9px] text-slate-600 hover:text-node-400 transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex min-h-0 font-mono text-[11px]">
        {/* Line numbers */}
        <div className="w-10 shrink-0 bg-slate-950/40 border-r border-node-900/10 pt-3 pr-2 text-right overflow-hidden">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="text-slate-800 leading-5 text-[9px]">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={editorContent}
          onChange={(e) => {
            setEditorContent(e.target.value);
            addTerminalOutput(`[EDITOR] Content updated — ${e.target.value.split('\n').length} lines`);
          }}
          spellCheck={false}
          className="flex-1 bg-transparent text-slate-300 resize-none outline-none p-3 leading-5 scrollbar-node"
          placeholder="// Paste or type code here. AI-applied patches will appear in this panel."
        />
      </div>
    </div>
  );
}
