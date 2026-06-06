import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger.js';

const router = Router();

const TERMUX_HOME = '/data/data/com.termux/files/home';
const FS_ROOTS = [TERMUX_HOME, process.env.HOME, process.cwd()].filter((r): r is string => !!r);

function isSafePath(p: string): boolean {
  const norm = path.resolve(p);
  return FS_ROOTS.some(root => norm.startsWith(path.resolve(root)));
}

router.get('/browse', async (req, res) => {
  const dirPath = (req.query.path as string) || TERMUX_HOME;
  
  if (!isSafePath(dirPath)) {
    logger.warn(`[FS] Security Rejection: Attempted to browse unsafe path: ${dirPath}`);
    res.status(403).json({ error: 'Path not allowed' }); 
    return; 
  }

  try {
    logger.info(`[FS] Browsing directory: ${dirPath}`);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    res.json({
      path: dirPath,
      parent: path.dirname(dirPath),
      entries: entries
        .filter(e => !e.name.startsWith('.'))
        .map(e => ({
          name: e.name,
          type: e.isDirectory() ? 'dir' : 'file',
          path: path.join(dirPath, e.name),
        }))
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
    });
  } catch (err: any) {
    logger.error(`[FS] Failed to browse ${dirPath}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

router.get('/read', async (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) { res.status(400).json({ error: 'path required' }); return; }
  
  if (!isSafePath(filePath)) {
    logger.warn(`[FS] Security Rejection: Attempted to read unsafe path: ${filePath}`);
    res.status(403).json({ error: 'Path not allowed' }); 
    return; 
  }

  try {
    logger.info(`[FS] Reading file: ${filePath}`);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content });
  } catch (err: any) {
    logger.error(`[FS] Failed to read ${filePath}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

router.post('/write', async (req, res) => {
  const { path: filePath, content, encoding } = req.body;
  if (!filePath) { res.status(400).json({ error: 'path required' }); return; }
  
  if (!isSafePath(filePath)) {
    logger.warn(`[FS] Security Rejection: Attempted to write unsafe path: ${filePath}`);
    res.status(403).json({ error: 'Path not allowed' }); 
    return; 
  }

  try {
    logger.info(`[FS] Writing file: ${filePath}`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    if (encoding === 'base64') {
      const buffer = Buffer.from(content, 'base64');
      await fs.writeFile(filePath, buffer);
    } else {
      await fs.writeFile(filePath, content, 'utf8');
    }
    res.json({ success: true });
  } catch (err: any) {
    logger.error(`[FS] Failed to write ${filePath}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

router.post('/create-directory', async (req, res) => {
  const { path: dirPath } = req.body;
  if (!dirPath) { res.status(400).json({ error: 'path required' }); return; }
  
  if (!isSafePath(dirPath)) {
    logger.warn(`[FS] Security Rejection: Attempted to create unsafe directory: ${dirPath}`);
    res.status(403).json({ error: 'Path not allowed' }); 
    return; 
  }

  try {
    logger.info(`[FS] Creating directory: ${dirPath}`);
    await fs.mkdir(dirPath, { recursive: true });
    res.json({ success: true });
  } catch (err: any) {
    logger.error(`[FS] Failed to create directory ${dirPath}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

router.post('/delete', async (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath) { res.status(400).json({ error: 'path required' }); return; }
  
  if (!isSafePath(targetPath)) {
    logger.warn(`[FS] Security Rejection: Attempted to delete unsafe path: ${targetPath}`);
    res.status(403).json({ error: 'Path not allowed' }); 
    return; 
  }

  try {
    logger.info(`[FS] Deleting path: ${targetPath}`);
    await fs.rm(targetPath, { recursive: true, force: true });
    res.json({ success: true });
  } catch (err: any) {
    logger.error(`[FS] Failed to delete ${targetPath}: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;

