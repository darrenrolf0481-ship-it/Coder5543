import { useState, useCallback, useRef } from 'react';
import { saveFileContents } from '../../services/fileStore';

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  language?: string;
  content?: string;
  isOpen?: boolean;
}

export function useFileSystem(phi: any) {
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([
    { id: 'root', name: 'Project', type: 'folder', parentId: null, isOpen: true },
    { id: 'src', name: 'src', type: 'folder', parentId: 'root', isOpen: true },
    {
      id: 'brain.py',
      name: 'neural_brain.py',
      type: 'file',
      parentId: 'src',
      language: 'python',
      content:
        '# AI Brain Logic\nclass NeuralCore:\n    def __init__(self):\n        self.synapses = 10**12\n\n    def process(self, input_data):\n        return f"Neural processing: {input_data}"\n\ncore = NeuralCore()\nprint(core.process("Initial stimulus"))',
    },
    {
      id: 'ui.html',
      name: 'interface.html',
      type: 'file',
      parentId: 'src',
      language: 'html',
      content:
        '<div class="p-8 bg-accent-950/20 rounded-3xl border border-accent-500/30">\n  <h1 class="text-2xl font-black text-accent-500 uppercase">Neural Interface</h1>\n  <p class="text-accent-100/60 mt-4">Real-time UI component rendering via Crimson Engine.</p>\n  <button class="mt-8 px-6 py-3 bg-accent-700 text-white rounded-xl uppercase font-black text-xs tracking-widest">Activate Core</button>\n</div>',
    },
    {
      id: 'logic.rs',
      name: 'core_logic.rs',
      type: 'file',
      parentId: 'src',
      language: 'rust',
      content:
        'fn main() {\n    let neural_load = 0.85;\n    println!("System load: {}%", neural_load * 100.0);\n}',
    },
  ]);

  const dirtyIdsRef = useRef<Set<string>>(new Set());
  const idleHandleRef = useRef<number | null>(null);

  const scheduleDirtyFlush = useCallback((files: ProjectFile[]) => {
    if (idleHandleRef.current !== null) return;
    const flush = () => {
      idleHandleRef.current = null;
      const ids = Array.from(dirtyIdsRef.current);
      if (ids.length === 0) return;

      dirtyIdsRef.current.clear();

      const toWrite = files
        .filter(f => f.type === 'file' && ids.includes(f.id))
        .map(f => ({ id: f.id, content: f.content ?? '' }));

      if (toWrite.length === 0) return;
      phi.beginTx();
      saveFileContents(toWrite)
        .then(() => phi.commitTx())
        .catch(err => { phi.rollbackTx(); console.warn('[IdleFlush]', err); });
    };

    if (typeof requestIdleCallback !== 'undefined') {
      idleHandleRef.current = requestIdleCallback(flush, { timeout: 2000 });
    } else {
      idleHandleRef.current = setTimeout(flush, 2000) as unknown as number;
    }
  }, [phi]);

  const markFileDirty = useCallback((id: string) => {
    dirtyIdsRef.current.add(id);
    scheduleDirtyFlush(projectFiles);
  }, [projectFiles, scheduleDirtyFlush]);

  return {
    projectFiles,
    setProjectFiles,
    markFileDirty
  };
}
