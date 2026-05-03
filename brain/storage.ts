import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = path.join(os.homedir(), 'brain-data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function filePath(key: string): string {
  return path.join(DATA_DIR, `${key.replace(/[^a-z0-9_-]/gi, '_')}.json`);
}

export const storage = {
  getItem(key: string): string | null {
    try {
      return fs.readFileSync(filePath(key), 'utf-8');
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    fs.writeFileSync(filePath(key), value, 'utf-8');
  },
};

export { DATA_DIR };
