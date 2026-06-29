import { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { useArgusStore, FileNode } from '../../store/useArgusStore';

function FileTreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [open, setOpen] = useState(depth === 0);
  const setEditorFile = useArgusStore((s) => s.setEditorFile);
  const setActivePanel = useArgusStore((s) => s.setActivePanel);
  const addTerminalOutput = useArgusStore((s) => s.addTerminalOutput);

  const isDir = node.type === 'dir';
  const indent = depth * 12;

  const handleClick = () => {
    if (isDir) {
      setOpen(!open);
    } else {
      setEditorFile(node.path, node.language);
      setActivePanel('editor');
      addTerminalOutput(`[FILES] Opened: ${node.path}`);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        style={{ paddingLeft: `${8 + indent}px` }}
        className="w-full flex items-center gap-1.5 py-1 hover:bg-node-950/40 transition-colors text-left group"
      >
        {isDir ? (
          <>
            <span className="text-slate-700 shrink-0">
              {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
            {open
              ? <FolderOpen className="w-3.5 h-3.5 text-node-600 shrink-0" />
              : <Folder className="w-3.5 h-3.5 text-node-700 shrink-0" />
            }
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          </>
        )}
        <span className="text-[10px] text-slate-400 group-hover:text-slate-200 truncate font-mono transition-colors">
          {node.name}
        </span>
      </button>
      {isDir && open && node.children?.map((child) => (
        <FileTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function FilesPanel() {
  const fileTree = useArgusStore((s) => s.fileTree);

  if (fileTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <Folder className="w-10 h-10 text-slate-800" />
        <p className="text-[10px] text-slate-700 font-mono leading-relaxed">
          No files loaded.{'\n'}Connect the File System MCP server to browse your project.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-node py-2">
      {fileTree.map((node) => (
        <FileTreeNode key={node.id} node={node} />
      ))}
    </div>
  );
}
