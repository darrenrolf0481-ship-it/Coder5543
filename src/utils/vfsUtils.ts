import { ProjectFile } from '../hooks/editor/useEditorFileSystem';

/**
 * Transforms the flat ProjectFile array into a nested FileSystemTree for WebContainer.
 */
export function transformToWebContainerTree(files: ProjectFile[]): Record<string, any> {
  const tree: Record<string, any> = {};

  // Map to store reference to directories by their ID
  const dirMap: Record<string, any> = {
    'root': tree
  };

  // 1. First, identify all folders and their depths
  const folders = files.filter(f => f.type === 'folder');
  
  // Helper to calculate depth iteratively and safely
  const getDepth = (id: string | null): number => {
    let depth = 0;
    let currentId = id;
    const seen = new Set<string>();

    while (currentId && currentId !== 'root') {
      if (seen.has(currentId)) {
        console.warn('[VFS] Circular reference detected for ID:', currentId);
        break;
      }
      seen.add(currentId);
      
      const item = files.find(f => f.id === currentId);
      if (!item || !item.parentId) break;
      
      currentId = item.parentId;
      depth++;
      
      if (depth > 20) break; // Safety limit
    }
    return depth;
  };

  // Sort folders by depth to ensure parents are processed before children
  const sortedFolders = folders.sort((a, b) => getDepth(a.id) - getDepth(b.id));

  // 2. Process folders
  sortedFolders.forEach(file => {
    if (file.id === 'root') return;
    const parent = dirMap[file.parentId || 'root'] || tree;
    parent[file.name] = {
      directory: {}
    };
    dirMap[file.id] = parent[file.name].directory;
  });

  // 3. Process files
  files.forEach(file => {
    if (file.type === 'file') {
      const parent = dirMap[file.parentId || 'root'] || tree;
      parent[file.name] = {
        file: {
          contents: file.content || ''
        }
      };
    }
  });

  return tree;
}
