import { AssignedRepo, RepoFile, SwarmAgent } from './types';

const MAX_TOTAL_CHARS_PER_AGENT = 28_000;
const MAX_FILE_CHARS = 5_000;
const MAX_FILES_PER_REPO = 25;

const SKILL_FILE_PATTERNS: Record<string, string[]> = {
  'threat-modeling': [
    'auth',
    'login',
    'session',
    'permission',
    'rbac',
    'oauth',
    'jwt',
    'crypto',
    'password',
    'token',
  ],
  'vulnerability-scanning': [
    'auth',
    'input',
    'validate',
    'sanitize',
    'sql',
    'query',
    'exec',
    'eval',
    'deserialize',
  ],
  'secure-code-review': ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'],
  'dependency-audit': [
    'package.json',
    'package-lock',
    'yarn.lock',
    'pnpm-lock',
    'requirements.txt',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
    'go.sum',
  ],
  'architecture-review': ['architecture', 'adr', 'design', 'README', 'docs', 'CONTRIBUTING'],
  'trade-off-analysis': ['architecture', 'adr', 'design', 'README'],
  'api-design': [
    'api',
    'route',
    'router',
    'controller',
    'endpoint',
    'schema',
    'openapi',
    'swagger',
    'handler',
  ],
  'database-design': [
    'schema',
    'migration',
    'model',
    'repository',
    'prisma',
    'sql',
    'entity',
    'orm',
  ],
  scalability: ['queue', 'cache', 'redis', 'worker', 'load', 'performance', 'batch'],
  react: ['.tsx', '.jsx', 'components/', 'hooks/', 'pages/', 'app/', 'src/'],
  tailwind: ['.css', 'tailwind.config', 'styles/'],
  accessibility: ['a11y', 'aria', 'accessibility', 'focus', 'semantic', 'role='],
  'llm-integration': ['ai', 'llm', 'genai', 'openai', 'gemini', 'ollama', 'prompt', 'claude'],
  'prompt-engineering': ['prompt', 'system', 'instruction', 'messages'],
  'code-review': ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'],
  testing: ['test', 'spec', '.test.', '.spec.', 'jest', 'vitest', 'pytest'],
  'ux-design': ['.tsx', '.jsx', 'components/', 'ui/', 'styles/', 'layout'],
  'responsive-design': ['.css', 'media', 'breakpoint', 'mobile', 'viewport'],
};

function scoreFileForAgent(file: RepoFile, agent: SwarmAgent): number {
  if (file.type !== 'file' || !file.id) return -1;
  const pathLower = file.id.toLowerCase();
  const nameLower = file.name.toLowerCase();
  let score = 0;

  // File-extension / skill matching
  for (const skill of agent.skills) {
    const patterns = SKILL_FILE_PATTERNS[skill] || [skill.toLowerCase()];
    for (const pattern of patterns) {
      if (pathLower.includes(pattern.toLowerCase())) {
        score += pattern.startsWith('.') ? 4 : 3;
      }
    }
  }

  // Domain-specific boosts
  if (agent.agentDefinitionId?.includes('security')) {
    if (pathLower.includes('auth') || pathLower.includes('login')) score += 5;
    if (pathLower.includes('env') || pathLower.includes('secret') || pathLower.includes('config'))
      score += 4;
  }
  if (agent.agentDefinitionId?.includes('frontend') || agent.skills.includes('react')) {
    if (nameLower.endsWith('.tsx') || nameLower.endsWith('.jsx')) score += 3;
    if (pathLower.includes('components/') || pathLower.includes('pages/')) score += 3;
  }
  if (agent.agentDefinitionId?.includes('backend') || agent.skills.includes('api-design')) {
    if (
      pathLower.includes('route') ||
      pathLower.includes('api') ||
      pathLower.includes('controller')
    )
      score += 4;
  }

  // Universal high-value files
  if (nameLower === 'readme.md') score += 6;
  if (nameLower === 'package.json' || nameLower === 'pyproject.toml' || nameLower === 'cargo.toml')
    score += 8;
  if (
    nameLower.startsWith('dockerfile') ||
    nameLower.endsWith('.yml') ||
    nameLower.endsWith('.yaml')
  )
    score += 2;

  // Penalize large/minified/generated files
  if ((file.content?.length ?? 0) > 50_000) score -= 5;
  if (pathLower.includes('.min.')) score -= 10;
  if (pathLower.includes('node_modules')) score -= 100;

  return score;
}

function sortFilesByRelevance(files: RepoFile[], agent: SwarmAgent): RepoFile[] {
  return [...files]
    .filter((f) => f.type === 'file')
    .map((f) => ({ file: f, score: scoreFileForAgent(f, agent) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ file }) => file);
}

export function buildRepoContextForAgent(
  agent: SwarmAgent,
  repos: AssignedRepo[],
  maxChars: number = MAX_TOTAL_CHARS_PER_AGENT,
): { context: string; usedFiles: number; totalFiles: number; truncated: boolean } {
  const assigned = repos.filter((r) => agent.assignedRepos.includes(r.id));
  if (assigned.length === 0) {
    return { context: '', usedFiles: 0, totalFiles: 0, truncated: false };
  }

  let remaining = maxChars;
  const sections: string[] = [];
  let usedFiles = 0;
  let totalFiles = 0;
  let truncated = false;

  for (const repo of assigned) {
    const files = repo.files || [];
    totalFiles += files.length;
    const relevant = sortFilesByRelevance(files, agent).slice(0, MAX_FILES_PER_REPO);

    if (relevant.length === 0) continue;

    const repoSection: string[] = [];
    repoSection.push(
      `## Repository: ${repo.owner}/${repo.repo}${repo.branch ? ` (${repo.branch})` : ''}`,
    );

    for (const file of relevant) {
      if (remaining <= 0) {
        truncated = true;
        break;
      }
      const content = (file.content || '').slice(0, MAX_FILE_CHARS);
      const entry = `\n### ${file.id}\n\`\`\`${file.language || 'text'}\n${content}\n\`\`\``;
      if (entry.length > remaining) {
        truncated = true;
        break;
      }
      repoSection.push(entry);
      remaining -= entry.length;
      usedFiles++;
    }

    if (repo.truncated) {
      repoSection.push(
        '\n_Note: repository was truncated during initial fetch (only 150 files read)._',
      );
    }

    sections.push(repoSection.join('\n'));
  }

  if (sections.length === 0) {
    return { context: '', usedFiles: 0, totalFiles, truncated };
  }

  const header = `[ASSIGNED REPOSITORIES]\nThe following repositories were assigned to you. Focus on files relevant to your specialty.\n`;
  const context = header + '\n\n---\n\n' + sections.join('\n\n---\n\n');
  return { context, usedFiles, totalFiles, truncated };
}

export function buildRepoSummary(repos: AssignedRepo[]): string {
  if (repos.length === 0) return 'No repositories assigned to the swarm.';
  return repos
    .map(
      (r) =>
        `- ${r.owner}/${r.repo}${r.branch ? ` (${r.branch})` : ''}: ${r.files?.length || 0} items${
          r.truncated ? ' (truncated)' : ''
        }`,
    )
    .join('\n');
}
