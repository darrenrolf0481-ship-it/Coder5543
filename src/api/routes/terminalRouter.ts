import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../../utils/logger.js';

const execAsync = promisify(exec);
const router = Router();

const TERMUX_HOME_DIR = '/home/workspace/Coder5543';

router.get('/cwd', (_req, res) => {
  res.json({ cwd: TERMUX_HOME_DIR });
});

const stripAnsi = (s: string) =>
  s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');

router.post('/exec', async (req, res) => {
  const { cmd, cwd } = req.body as { cmd?: string; cwd?: string };
  if (!cmd) {
    res.status(400).json({ error: 'cmd required' });
    return;
  }

  const workingDir = cwd || TERMUX_HOME_DIR;
  logger.info(`[Terminal] Executing command: "${cmd}" in ${workingDir}`);

  if (/^cd(\s|$)/.test(cmd.trim())) {
    const cdArg =
      cmd
        .trim()
        .replace(/^cd\s*/, '')
        .trim() || TERMUX_HOME_DIR;
    const quotedArg =
      cdArg === '~' || cdArg.startsWith('~/') ? cdArg : `"${cdArg.replace(/"/g, '\\"')}"`;
    try {
      const { stdout } = await execAsync(`cd ${quotedArg} && pwd`, {
        cwd: workingDir,
        shell: '/bin/sh',
        timeout: 5000,
      });
      const newCwd = stdout.trim();
      logger.info(`[Terminal] Directory changed to: ${newCwd}`);
      res.json({ stdout: '', stderr: '', exitCode: 0, newCwd });
    } catch (err: any) {
      logger.error(`[Terminal] CD failed: ${err.message}`);
      res.json({ stdout: '', stderr: err.message ?? String(err), exitCode: 1, newCwd: workingDir });
    }
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: workingDir,
      shell: '/bin/sh',
      timeout: 30000,
      maxBuffer: 1024 * 512,
      env: { ...process.env, TERM: 'dumb', NO_COLOR: '1' },
    });
    if (stderr) logger.warn(`[Terminal] Command produced stderr: ${stripAnsi(stderr)}`);
    res.json({
      stdout: stripAnsi(stdout),
      stderr: stripAnsi(stderr),
      exitCode: 0,
      newCwd: workingDir,
    });
  } catch (err: any) {
    logger.error(`[Terminal] Command failed with exit code ${err.code}: ${err.message}`);
    res.json({
      stdout: stripAnsi(err.stdout ?? ''),
      stderr: stripAnsi(err.stderr ?? err.message ?? String(err)),
      exitCode: err.code ?? 1,
      newCwd: workingDir,
    });
  }
});

export default router;
