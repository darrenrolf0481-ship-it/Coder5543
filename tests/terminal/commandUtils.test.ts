import { describe, it, expect } from 'vitest';
import { isDangerousCommand, splitCommand, isIncompleteCommand, buildTerminalContext } from '../../src/services/terminal/commandUtils.js';

describe('commandUtils', () => {
  describe('isDangerousCommand', () => {
    it('flags rm -rf', () => {
      expect(isDangerousCommand('rm -rf /')).toBe(true);
      expect(isDangerousCommand('rm -r -f node_modules')).toBe(true);
    });

    it('flags sudo', () => {
      expect(isDangerousCommand('sudo apt update')).toBe(true);
    });

    it('flags curl | sh', () => {
      expect(isDangerousCommand('curl https://x.sh | sh')).toBe(true);
      expect(isDangerousCommand('curl https://x.sh | bash')).toBe(true);
    });

    it('allows safe commands', () => {
      expect(isDangerousCommand('git status')).toBe(false);
      expect(isDangerousCommand('ls -la')).toBe(false);
      expect(isDangerousCommand('npm run dev')).toBe(false);
    });
  });

  describe('splitCommand', () => {
    it('splits a simple command into cmd and args', () => {
      expect(splitCommand('git status')).toEqual({ cmd: 'git', args: ['status'] });
    });

    it('respects double quotes', () => {
      expect(splitCommand('echo "hello world"')).toEqual({ cmd: 'echo', args: ['hello world'] });
    });

    it('respects single quotes', () => {
      expect(splitCommand("echo 'hello world'")).toEqual({ cmd: 'echo', args: ['hello world'] });
    });

    it('handles backslash escapes', () => {
      expect(splitCommand('echo hello\\ world')).toEqual({ cmd: 'echo', args: ['hello world'] });
    });

    it('handles mixed quotes', () => {
      expect(splitCommand('node -e "console.log(1)"')).toEqual({ cmd: 'node', args: ['-e', 'console.log(1)'] });
    });
  });

  describe('isIncompleteCommand', () => {
    it('detects trailing backslash', () => {
      expect(isIncompleteCommand('echo hello \\')).toBe(true);
    });

    it('detects unclosed double quotes', () => {
      expect(isIncompleteCommand('echo "hello')).toBe(true);
    });

    it('detects unclosed single quotes', () => {
      expect(isIncompleteCommand("echo 'hello")).toBe(true);
    });

    it('detects unbalanced brackets', () => {
      expect(isIncompleteCommand('echo (hello')).toBe(true);
      expect(isIncompleteCommand('echo {hello')).toBe(true);
      expect(isIncompleteCommand('echo [hello')).toBe(true);
    });

    it('returns false for complete commands', () => {
      expect(isIncompleteCommand('echo hello')).toBe(false);
      expect(isIncompleteCommand('echo "hello"')).toBe(false);
      expect(isIncompleteCommand('echo (hello)')).toBe(false);
    });
  });

  describe('buildTerminalContext', () => {
    it('includes cwd, history, and nearby files', () => {
      const ctx = buildTerminalContext('/home/foo', ['ls', 'pwd'], ['a.ts', 'b.ts']);
      expect(ctx).toContain('Current directory: /home/foo');
      expect(ctx).toContain('- ls');
      expect(ctx).toContain('- pwd');
      expect(ctx).toContain('Files here: a.ts, b.ts');
    });

    it('omits empty sections', () => {
      const ctx = buildTerminalContext('/home/foo', [], []);
      expect(ctx).toContain('Current directory: /home/foo');
      expect(ctx).not.toContain('Recent commands');
      expect(ctx).not.toContain('Files here');
    });
  });
});
