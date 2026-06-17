import { spawn, exec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import logger from '../../utils/logger.js';

const execAsync = promisify(exec);

const DEFAULT_CWD = '/home/workspace/Coder5543';

const stripAnsi = (s: string) =>
  s
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\][^\x07]*\x07/g, '');

export interface ExecResult {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  newCwd?: string;
}

export class ShellSession {
  cwd: string;
  activeChild: ChildProcess | null = null;

  constructor(cwd = DEFAULT_CWD) {
    this.cwd = cwd;
  }

  /**
   * Handles `cd` synchronously and updates the session's working directory.
   */
  async changeDirectory(cmd: string): Promise<ExecResult> {
    const cdArg = cmd.trim().replace(/^cd\s*/, '').trim() || DEFAULT_CWD;
    const quotedArg =
      cdArg === '~' || cdArg.startsWith('~/')
        ? cdArg
        : `"${cdArg.replace(/"/g, '\\"')}"`;

    try {
      const { stdout } = await execAsync(`cd ${quotedArg} && pwd`, {
        cwd: this.cwd,
        shell: '/bin/sh',
        timeout: 5000,
      });
      const newCwd = stdout.trim();
      this.cwd = newCwd;
      logger.info(`[ShellSession] Directory changed to: ${newCwd}`);
      return { stdout: '', stderr: '', exitCode: 0, newCwd };
    } catch (err: any) {
      logger.error(`[ShellSession] CD failed: ${err.message}`);
      return {
        stdout: '',
        stderr: err.message ?? String(err),
        exitCode: 1,
        newCwd: this.cwd,
      };
    }
  }

  /**
   * Spawns a long-running command and streams stdout/stderr. Resolves when the
   * process closes. Only one command may run at a time per session.
   */
  async run(
    cmd: string,
    cwd: string,
    handlers: {
      onStdout?: (text: string) => void;
      onStderr?: (text: string) => void;
      onClose?: (exitCode: number | null) => void;
    }
  ): Promise<boolean> {
    if (this.activeChild && !this.activeChild.killed) {
      logger.warn('[ShellSession] Rejected overlapping command');
      return false;
    }

    const workingDir = cwd || this.cwd;
    logger.info(`[ShellSession] Spawning: "${cmd}" in ${workingDir}`);

    const child = spawn(cmd, {
      cwd: workingDir,
      shell: '/bin/sh',
      env: { ...process.env, TERM: 'dumb', NO_COLOR: '1' },
    });

    this.activeChild = child;

    child.stdout?.on('data', (data: Buffer) => {
      handlers.onStdout?.(stripAnsi(data.toString()));
    });

    child.stderr?.on('data', (data: Buffer) => {
      handlers.onStderr?.(stripAnsi(data.toString()));
    });

    child.on('close', (code) => {
      this.activeChild = null;
      handlers.onClose?.(code);
    });

    child.on('error', (err) => {
      logger.error('[ShellSession] Spawn error:', err);
      this.activeChild = null;
      handlers.onStderr?.(err.message);
      handlers.onClose?.(1);
    });

    return true;
  }

  /**
   * Kills the active child process gracefully, escalating to SIGKILL if needed.
   */
  kill(): void {
    const child = this.activeChild;
    if (!child || child.killed) return;

    logger.info('[ShellSession] Sending SIGTERM to active child');
    child.kill('SIGTERM');

    setTimeout(() => {
      if (child && !child.killed) {
        logger.warn('[ShellSession] Escalating to SIGKILL');
        child.kill('SIGKILL');
      }
    }, 3000);
  }

  dispose(): void {
    this.kill();
  }
}

export const defaultSession = new ShellSession(DEFAULT_CWD);
