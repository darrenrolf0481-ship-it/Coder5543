import { Router } from 'express';
import logger from '../../utils/logger.js';
import { ShellSession } from '../../services/terminal/ShellSession.js';

const router = Router();

const TERMUX_HOME_DIR = '/home/workspace/Coder5543';

router.get('/cwd', (_req, res) => {
  res.json({ cwd: TERMUX_HOME_DIR });
});

router.post('/exec', async (req, res) => {
  const { cmd, cwd } = req.body as { cmd?: string; cwd?: string };
  if (!cmd) { res.status(400).json({ error: 'cmd required' }); return; }

  const workingDir = cwd || TERMUX_HOME_DIR;
  logger.info(`[Terminal] Executing command: "${cmd}" in ${workingDir}`);

  const session = new ShellSession(workingDir);

  if (/^cd(\s|$)/.test(cmd.trim())) {
    const result = await session.changeDirectory(cmd);
    res.json(result);
    return;
  }

  const chunks: string[] = [];
  let exitCode: number | null = null;

  const accepted = await session.run(cmd, workingDir, {
    onStdout: (text) => chunks.push(text),
    onStderr: (text) => chunks.push(`[ERROR] ${text}`),
    onClose: (code) => { exitCode = code; },
  });

  if (!accepted) {
    res.status(423).json({ error: 'A command is already running in this session', exitCode: 1, newCwd: workingDir });
    return;
  }

  // Wait for the close event to fire (the session resets activeChild there).
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (session.activeChild === null) {
        clearInterval(check);
        resolve();
      }
    }, 50);
  });

  const stdout = chunks.filter((c) => !c.startsWith('[ERROR] ')).join('');
  const stderr = chunks.filter((c) => c.startsWith('[ERROR] ')).map((c) => c.slice(8)).join('');

  res.json({ stdout, stderr, exitCode: exitCode ?? 0, newCwd: session.cwd });
});

export default router;
