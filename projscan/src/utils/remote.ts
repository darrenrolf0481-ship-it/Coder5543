import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

/**
 * Check if the input looks like a Git URL.
 */
export function isGitUrl(input: string): boolean {
  return (
    input.startsWith('http://') ||
    input.startsWith('https://') ||
    input.startsWith('git@') ||
    input.startsWith('ssh://')
  );
}

/**
 * Ensure a remote repository is cloned locally and return its path.
 * Uses .projscan-cache/clones as the root.
 */
export async function ensureClone(url: string, baseRoot: string): Promise<string> {
  const cacheRoot = path.join(baseRoot, '.projscan-cache', 'clones');
  if (!existsSync(cacheRoot)) {
    mkdirSync(cacheRoot, { recursive: true });
  }

  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 8);
  const repoName = url.split('/').pop()?.replace(/\.git$/, '') ?? 'repo';
  const targetDir = path.join(cacheRoot, `${repoName}-${hash}`);

  if (existsSync(targetDir)) {
    // Try to refresh
    try {
      execSync('git pull --quiet', { cwd: targetDir, stdio: 'ignore' });
    } catch {
      // ignore pull errors
    }
    return targetDir;
  }

  try {
    execSync(`git clone --depth 1 --quiet ${url} "${targetDir}"`, { stdio: 'inherit' });
    return targetDir;
  } catch (err) {
    throw new Error(`Failed to clone repository: ${err instanceof Error ? err.message : String(err)}`);
  }
}
