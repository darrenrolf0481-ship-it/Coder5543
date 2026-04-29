import React from 'react';
import { ChevronDown, FolderOpen, Folder, FileCode, Edit2, Trash2 } from 'lucide-react';
import { useFileSystem } from '../hooks/useFileSystem';

interface FileTreeProps {
  parentId: string | null;
  level?: number;
  fileTree: Map<string | null, any[]>;
  activeFileId: string | null;
  refresh: () => void;
  onFileClick: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onRename: (item: any) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ 
  parentId, 
  level = 0, 
  fileTree, 
  activeFileId, 
  refresh,
  onFileClick,
  onToggleFolder,
  onRename
}) => {
  const items = fileTree.get(parentId) || [];
  const { deleteItem } = useFileSystem();
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteItem(id);
  };
  
  return (
    <>
      {items.map((item) => (
        <div key={item.id} className="flex flex-col">
          <div 
            className={`group flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              activeFileId === item.id 
                ? 'bg-red-700 text-white border border-red-500' 
                : 'hover:bg-red-950/20 text-red-900 hover:text-red-500'
            }`}
            style={{ paddingLeft: `${level * 12 + 12}px` }}
            onClick={() => item.type === 'folder' ? onToggleFolder(item.id) : onFileClick(item.id)}
          >
            {item.type === 'folder' ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${item.isOpen ? '' : '-rotate-90'}`} />
                {item.isOpen ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
              </div>
            ) : (
              <FileCode className="w-3.5 h-3.5 shrink-0" />
            )}
            
            <span className="flex-1 truncate">{item.name}</span>
            
            <div className="hidden group-hover:flex items-center gap-2 opacity-60">
                <Edit2 className="w-3 h-3 cursor-pointer hover:text-white" onClick={(e) => { e.stopPropagation(); onRename(item); }} />
                <Trash2 className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={(e) => handleDelete(e, item.id)} />
            </div>
          </div>

          {item.type === 'folder' && item.isOpen && (
            <FileTree 
              parentId={item.id} 
              level={level + 1} 
              fileTree={fileTree} 
              activeFileId={activeFileId} 
              refresh={refresh}
              onFileClick={onFileClick}
              onToggleFolder={onToggleFolder}
              onRename={onRename}
            />
          )}
        </div>
      ))}
    </>
  );
};
