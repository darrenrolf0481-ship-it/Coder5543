import React from 'react';
import { FileCode, Copy, Check } from 'lucide-react';
import { useArgusStore } from '../../store/useArgusStore';
import { CodeEditor } from '../editor/CodeEditor';

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
      <CodeEditor
        value={editorContent}
        onChange={setEditorContent}
        onBlur={() => addTerminalOutput(`[EDITOR] ${editorFile ?? 'untitled'} — ${lineCount} lines`)}
        placeholder="// Paste or type code here. AI-applied patches will appear in this panel."
      />
    </div>
  );
}
