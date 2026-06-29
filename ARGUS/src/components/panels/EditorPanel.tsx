import React from 'react';
import { FileCode, Copy, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';
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
    <div className="flex flex-col h-full bg-[#03070f]">
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
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={editorLanguage.toLowerCase()}
          theme="vs-dark"
          value={editorContent}
          onChange={(val) => {
            const newContent = val ?? '';
            setEditorContent(newContent);
            addTerminalOutput(`[EDITOR] Content updated — ${newContent.split('\n').length} lines`);
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 11,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorStyle: 'line',
            automaticLayout: true,
            padding: { top: 12 },
          }}
          loading={
            <div className="w-full h-full flex items-center justify-center bg-[#03070f] text-[9px] font-mono text-slate-700 uppercase tracking-widest">
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
