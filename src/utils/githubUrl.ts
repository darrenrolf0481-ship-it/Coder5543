/**
 * Normalized GitHub repository URL parser.
 *
 * Accepts:
 *   - owner/repo
 *   - owner/repo:branch
 *   - https://github.com/owner/repo
 *   - https://github.com/owner/repo/tree/branch
 *   - https://github.com/owner/repo.git
 *   - git@github.com:owner/repo.git
 *
 * Strips trailing slashes, query params and fragments.
 */

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
  /** The original input in a clean, display-friendly form. */
  url: string;
  /** A cloneable HTTPS URL. */
  cloneUrl: string;
  /** Sanitized repo name safe for use as a directory name. */
  repoName: string;
}

const PATH_SEGMENT = '[a-zA-Z0-9_.-]+';
const BRANCH_SEGMENT = '[a-zA-Z0-9_.-/]+';

export function parseGitHubUrl(input: string): ParsedGitHubUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Strip query params, fragments, and trailing slash.
  let clean = trimmed.replace(/[?#].*$/, '').replace(/\/$/, '');

  // 1. HTTPS: https://github.com/owner/repo/tree/branch or /blob/branch
  const httpsTree = new RegExp(
    `^https://github\\.com/(${PATH_SEGMENT})/(${PATH_SEGMENT}?)(?:\\.git)?/(?:tree|blob)/(${BRANCH_SEGMENT})$`,
  ).exec(clean);
  if (httpsTree) {
    const [, owner, repo, branch] = httpsTree;
    return makeResult(owner, repo, branch, clean);
  }

  // 2. HTTPS: https://github.com/owner/repo or https://github.com/owner/repo.git
  const https = new RegExp(
    `^https://github\\.com/(${PATH_SEGMENT})/(${PATH_SEGMENT}?)(?:\\.git)?$`,
  ).exec(clean);
  if (https) {
    const [, owner, repo] = https;
    return makeResult(owner, repo, undefined, clean);
  }

  // 3. SSH: git@github.com:owner/repo.git or git@github.com:owner/repo
  const ssh = new RegExp(`^git@github\\.com:(${PATH_SEGMENT})/(${PATH_SEGMENT}?)(?:\\.git)?$`).exec(
    clean,
  );
  if (ssh) {
    const [, owner, repo] = ssh;
    return makeResult(owner, repo, undefined, clean);
  }

  // 4. Shorthand with optional branch: owner/repo:branch
  const shorthandBranch = new RegExp(
    `^(${PATH_SEGMENT})/(${PATH_SEGMENT})(?::(${BRANCH_SEGMENT}))?$`,
  ).exec(clean);
  if (shorthandBranch) {
    const [, owner, repo, branch] = shorthandBranch;
    return makeResult(owner, repo, branch, clean);
  }

  return null;
}

function makeResult(
  owner: string,
  repo: string,
  branch: string | undefined,
  original: string,
): ParsedGitHubUrl {
  const repoName = repo.replace(/\.git$/, '');
  const shorthand = `${owner}/${repoName}`;
  return {
    owner,
    repo: repoName,
    branch,
    url:
      original.startsWith('http') || original.startsWith('git@')
        ? original.replace(/\.git$/, '').replace(/\/$/, '')
        : shorthand,
    cloneUrl: `https://github.com/${shorthand}.git`,
    repoName,
  };
}

/** Returns a display-friendly "owner/repo" string or null. */
export function normalizeRepoDisplay(input: string): string | null {
  const parsed = parseGitHubUrl(input);
  return parsed ? `${parsed.owner}/${parsed.repo}` : null;
}
