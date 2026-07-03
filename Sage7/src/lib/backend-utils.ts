import path from 'path';
import fs from 'fs/promises';

export const BASE_DIR = process.cwd();
export const UPLOAD_DIR = path.join(BASE_DIR, 'uploads');
export const PROJECT_DIR = path.join(BASE_DIR, 'projects');
export const DATA_DIR = path.join(BASE_DIR, 'data');

export async function ensureDirs() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(PROJECT_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export function guessType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const types: Record<string, string> = {
    'mp4': 'video', 'webm': 'video', 'mov': 'video',
    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image',
    'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio', 'm4a': 'audio',
    'txt': 'document', 'js': 'document', 'ts': 'document', 'tsx': 'document',
    'py': 'document', 'json': 'document', 'md': 'document'
  };
  return types[ext] || 'document';
}
