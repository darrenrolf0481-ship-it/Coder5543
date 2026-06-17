import { useState } from 'react';

export interface TermuxFile {
  name: string;
  size: string;
  type: string;
  category: 'model' | 'asset' | 'config';
}

export interface StorageFile {
  id: number;
  name: string;
  size: string;
  type: string;
  date: string;
}

export function useSystemStates() {
  const [termuxStatus, setTermuxStatus] = useState<'disconnected' | 'connecting' | 'connected'>(
    'disconnected',
  );
  const [termuxFiles, setTermuxFiles] = useState<TermuxFile[]>([
    { name: 'v1-5-pruned-emaonly.safetensors', size: '3.97GB', type: 'model', category: 'model' },
    { name: 'deliberate_v2.safetensors', size: '2.1GB', type: 'model', category: 'model' },
  ]);

  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([
    { id: 1, name: 'Neural_Architecture_v4.pdf', size: '2.4MB', type: 'pdf', date: '2024-03-20' },
    { id: 2, name: 'System_Directives.docx', size: '45KB', type: 'docx', date: '2024-03-22' },
  ]);

  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

  // AI Studio / SD State
  const [negativePrompt, setNegativePrompt] = useState(
    'blurry, low resolution, artifacts, mutated limbs, bad anatomy',
  );
  const [sdParams, setSdParams] = useState({
    checkpoint: 'SDXL-V1.0-Base',
    steps: 32,
    cfgScale: 8.0,
    seed: -1,
    aspectRatio: '1:1' as '1:1' | '16:9' | '9:16',
  });

  return {
    termuxStatus,
    setTermuxStatus,
    termuxFiles,
    setTermuxFiles,
    storageFiles,
    setStorageFiles,
    isVaultUnlocked,
    setIsVaultUnlocked,
    negativePrompt,
    setNegativePrompt,
    sdParams,
    setSdParams,
  };
}
