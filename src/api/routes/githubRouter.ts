import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { parseGitHubUrl } from '../../utils/githubUrl.js';

const execAsync = promisify(exec);
const router = Router();

// Ignored folders and files
const IGNORED_NAMES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'venv',
  '__pycache__',
  '.next',
  '.idea',
  '.vscode',
]);
const BINARY_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'ico',
  'pdf',
  'zip',
  'gz',
  'tar',
  'tgz',
  'exe',
  'dll',
  'so',
  'dylib',
  'woff',
  'woff2',
  'eot',
  'ttf',
  'pyc',
  'db',
  'sqlite',
  'mp4',
  'mp3',
  'wav',
  'safetensors',
  'ckpt',
  'bin',
  'out',
]);

const LANGUAGE_MAP: Record<string, string> = {
  py: 'python',
  js: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  jsx: 'javascript',
  html: 'html',
  css: 'css',
  rs: 'rust',
  cpp: 'cpp',
  hpp: 'cpp',
  c: 'c',
  h: 'c',
  json: 'json',
  md: 'markdown',
  sh: 'shell',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  go: 'go',
  java: 'java',
};

async function walkDir(
  dir: string,
  baseDir: string,
  parentId: string = 'root',
  fileCount = { count: 0 },
): Promise<any[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result: any[] = [];

  if (fileCount.count > 150) return result;

  for (const entry of entries) {
    if (IGNORED_NAMES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const folderId = relPath;
      result.push({
        id: folderId,
        name: entry.name,
        type: 'folder',
        parentId: parentId,
        isOpen: false,
      });
      const subResults = await walkDir(fullPath, baseDir, folderId, fileCount);
      result.push(...subResults);
    } else if (entry.isFile()) {
      const ext = entry.name.split('.').pop() || '';
      if (BINARY_EXTENSIONS.has(ext.toLowerCase())) {
        continue;
      }

      fileCount.count++;
      if (fileCount.count > 150) continue;

      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        result.push({
          id: relPath,
          name: entry.name,
          type: 'file',
          parentId: parentId,
          language: LANGUAGE_MAP[ext.toLowerCase()] || 'text',
          content: content,
        });
      } catch (err) {
        console.warn(`Failed to read file ${fullPath}:`, err);
      }
    }
  }
  return result;
}

router.post('/push', async (_req, res) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
    return;
  }
  try {
    const ghRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'neural-repo' }),
    });
    res.status(ghRes.ok ? 200 : ghRes.status).json({ ok: ghRes.ok });
  } catch {
    res.status(500).json({ error: 'GitHub request failed' });
  }
});

router.get('/pull', async (_req, res) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'GITHUB_TOKEN not configured' });
    return;
  }
  try {
    const ghRes = await fetch('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${token}` },
    });
    const data = ghRes.ok ? await ghRes.json() : [];
    res.status(ghRes.ok ? 200 : ghRes.status).json({ ok: ghRes.ok, data });
  } catch {
    res.status(500).json({ error: 'GitHub request failed' });
  }
});

router.post('/clone', async (req, res) => {
  const { repoUrl, branch } = req.body as { repoUrl?: string; branch?: string };
  if (!repoUrl) {
    res.status(400).json({ error: 'repoUrl is required' });
    return;
  }

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    res.status(400).json({
      error:
        'Invalid repository format. Supported: "owner/repo", "https://github.com/owner/repo" or "git@github.com:owner/repo.git"',
    });
    return;
  }

  // Validate fields for safety
  const safeName = /^[a-zA-Z0-9_\-\.]+$/;
  if (!safeName.test(parsed.owner) || !safeName.test(parsed.repo)) {
    res.status(400).json({ error: 'Invalid owner or repository name' });
    return;
  }

  const effectiveBranch = branch || parsed.branch;
  if (effectiveBranch && !/^[a-zA-Z0-9_\-\.\/]+$/.test(effectiveBranch)) {
    res.status(400).json({ error: 'Invalid branch name format' });
    return;
  }

  try {
    let cloneUrl = parsed.cloneUrl;
    const token = process.env.GITHUB_TOKEN;
    if (token && cloneUrl.startsWith('https://github.com/')) {
      cloneUrl = cloneUrl.replace('https://github.com/', `https://${token}@github.com/`);
    }
    const repoName = parsed.repoName;
    const projectsDir = path.join(process.cwd(), 'projects');

    // Ensure projects folder exists
    await fs.mkdir(projectsDir, { recursive: true });

    const targetDir = path.join(projectsDir, repoName);

    let exists = false;
    try {
      await fs.access(targetDir);
      exists = true;
    } catch {}

    if (!exists) {
      const branchArg = effectiveBranch ? `-b "${effectiveBranch}"` : '';
      await execAsync(`git clone --depth 1 ${branchArg} "${cloneUrl}" "${targetDir}"`);
    } else {
      // Pull latest changes if it exists
      await execAsync(`git pull`, { cwd: targetDir });
    }

    const fileCount = { count: 0 };
    const files = await walkDir(targetDir, targetDir, 'root', fileCount);

    const rootNode = {
      id: 'root',
      name: repoName,
      type: 'folder',
      parentId: null,
      isOpen: true,
    };

    res.json({
      success: true,
      repoName,
      files: [rootNode, ...files],
      truncated: fileCount.count > 150,
    });
  } catch (err: any) {
    console.error('Error during git clone:', err);
    res.status(500).json({ error: err.message || 'Failed to clone repository' });
  }
});

router.get('/projects', async (_req, res) => {
  try {
    const projectsDir = path.join(process.cwd(), 'projects');
    await fs.mkdir(projectsDir, { recursive: true });
    const entries = await fs.readdir(projectsDir, { withFileTypes: true });
    const projects = [];
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const stats = await fs.stat(path.join(projectsDir, entry.name));
        projects.push({
          id: `server_project_${entry.name}`,
          name: entry.name,
          path: path.join(projectsDir, entry.name),
          createdAt: stats.birthtimeMs || stats.ctimeMs || Date.now(),
          lastAccessed: stats.atimeMs || Date.now(),
        });
      }
    }
    res.json({ projects });
  } catch (err: any) {
    console.error('Error listing server projects:', err);
    res.status(500).json({ error: err.message || 'Failed to list server projects' });
  }
});

router.get('/load', async (req, res) => {
  const { project } = req.query as { project?: string };
  if (!project) {
    res.status(400).json({ error: 'project parameter is required' });
    return;
  }
  // Sanitize project name to prevent path traversal
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(project)) {
    res.status(400).json({ error: 'Invalid project name' });
    return;
  }

  try {
    const projectsDir = path.join(process.cwd(), 'projects');
    const targetDir = path.join(projectsDir, project);

    let exists = false;
    try {
      await fs.access(targetDir);
      exists = true;
    } catch {}

    if (!exists) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const fileCount = { count: 0 };
    const files = await walkDir(targetDir, targetDir, 'root', fileCount);

    const rootNode = {
      id: 'root',
      name: project,
      type: 'folder',
      parentId: null,
      isOpen: true,
    };

    res.json({
      success: true,
      files: [rootNode, ...files],
      truncated: fileCount.count > 150,
    });
  } catch (err: any) {
    console.error('Error loading project files:', err);
    res.status(500).json({ error: err.message || 'Failed to load project files' });
  }
});

export default router;
