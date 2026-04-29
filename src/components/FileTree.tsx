import React from 'react';
import { ChevronDown, FolderOpen, Folder, FileCode, Edit2, Check, GitBranch } from 'lucide-react';

export const FileTree = ({ 
  parentId, 
  level = 0, 
  fileTree, 
  gitRepo, 
  renamingId, 
  activeFileId, 
  newName,
  setNewName,
  setRenamingId,
  toggleFolder,
  handleFileSwitch,
  setContextMenu,
  moveItem,
  handleConfirmRename,
  isSearching
}: any) => {
  const items = fileTree.get(parentId) || [];
  
  return (
    <>
      {items.map((item: any) => {
        const isModified = gitRepo.modified.includes(item.id);
        const isStaged = gitRepo.staged.includes(item.id);
        const isRenaming = renamingId === item.id;
        const isExpanded = item.isOpen || isSearching;

        return (
          <div key={item.id} className="flex flex-col">
            <div 
              draggable={true}
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.id); }}
              onDragOver={(e) => { if (item.type === 'folder') e.preventDefault(); }}
              onDrop={(e) => { if (item.type === 'folder') { e.preventDefault(); const draggedId = e.dataTransfer.getData('text/plain'); moveItem(draggedId, item.id); } }}
              className={`group flex items-center gap-3 px-4 py-2.5 md:py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                activeFileId === item.id 
                  ? 'bg-red-700 text-white glow-red border border-red-500 scale-[1.02]' 
                  : item.type === 'folder' 
                    ? (isExpanded ? 'bg-red-950/30 text-red-300 border border-red-900/30 hover:bg-red-900/40 hover:translate-x-1' : 'hover:bg-red-950/20 text-red-800 hover:text-red-400 border border-transparent hover:translate-x-1')
                    : `hover:bg-red-950/20 text-red-900 hover:text-red-500 border border-transparent hover:translate-x-1 ${isModified ? 'border-l-2 border-l-orange-500' : isStaged ? 'border-l-2 border-l-green-500' : ''}`
              }`}
              style={{ paddingLeft: `${level * 12 + 12}px` }}
              onClick={() => item.type === 'folder' ? toggleFolder(item.id) : handleFileSwitch(item.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id });
              }}
            >
              {item.type === 'folder' ? (
                <div className="flex items-center gap-1.5">
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isExpanded ? '' : '-rotate-90'}`} />
                  {isExpanded ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <Folder className="w-3.5 h-3.5 shrink-0" />}
                </div>
              ) : (
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isModified ? 'text-orange-500' : isStaged ? 'text-green-500' : ''}`} />
              )}
              
              {isRenaming ? (
                <input
                  autoFocus
                  className="flex-1 bg-red-950/40 border border-red-500/50 rounded px-2 py-0.5 text-white outline-none font-mono text-[10px]"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmRename();
                    if (e.key === 'Escape') { setRenamingId(null); setNewName(''); }
                  }}
                  onBlur={handleConfirmRename}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={`flex-1 truncate flex items-center gap-2`}>
                  {item.name}
                  {isModified && <Edit2 className="w-3 h-3 text-orange-500 shrink-0" />}
                  {isStaged && <Check className="w-3 h-3 text-green-500 shrink-0" />}
                  {!isModified && !isStaged && item.type === 'file' && <GitBranch className="w-3 h-3 text-gray-700 shrink-0" />}
                </span>
              )}
            </div>
            {item.type === 'folder' && isExpanded && (
              <FileTree 
                parentId={item.id} 
                level={level + 1} 
                fileTree={fileTree} 
                gitRepo={gitRepo} 
                renamingId={renamingId} 
                activeFileId={activeFileId} 
                newName={newName}
                setNewName={setNewName}
                setRenamingId={setRenamingId}
                toggleFolder={toggleFolder}
                handleFileSwitch={handleFileSwitch}
                setContextMenu={setContextMenu}
                moveItem={moveItem}
                handleConfirmRename={handleConfirmRename}
                isSearching={isSearching}
              />
            )}
          </div>
        );
      })}
    </>
  );
};
