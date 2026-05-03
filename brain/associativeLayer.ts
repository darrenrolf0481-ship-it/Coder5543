// Correction map: common typos and domain jargon → canonical form
const STATIC_CORRECTIONS: Record<string, string> = {
  // typos
  'funtion': 'function', 'funciton': 'function', 'recieve': 'receive',
  'occured': 'occurred', 'seperete': 'separate', 'seperate': 'separate',
  'definately': 'definitely', 'asycn': 'async', 'asynch': 'async',
  'javascrip': 'javascript', 'typescirpt': 'typescript', 'pythong': 'python',
  'clas': 'class', 'clss': 'class', 'improt': 'import', 'imoprt': 'import',
  'retun': 'return', 'retrun': 'return', 'cosnt': 'const', 'conts': 'const',
  // jargon normalization
  'llm': 'language model', 'ai': 'artificial intelligence',
  'kb': 'knowledge base', 'stm': 'short-term memory', 'ltm': 'long-term memory',
  'fn': 'function', 'func': 'function', 'impl': 'implementation',
  'init': 'initialize', 'cfg': 'configuration', 'config': 'configuration',
  'auth': 'authentication', 'authn': 'authentication', 'authz': 'authorization',
  'db': 'database', 'repo': 'repository', 'deps': 'dependencies',
  'dep': 'dependency', 'pkg': 'package', 'pkgs': 'packages',
  'msg': 'message', 'msgs': 'messages', 'err': 'error', 'errs': 'errors',
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export class AssociativeLayer {
  private dynamicCorrections: Map<string, string> = new Map();

  // Learn a correction at runtime (e.g., from user feedback)
  learn(wrong: string, correct: string): void {
    this.dynamicCorrections.set(wrong.toLowerCase(), correct.toLowerCase());
  }

  correct(token: string): string {
    const lower = token.toLowerCase();
    // 1. Exact match in static or dynamic map
    if (STATIC_CORRECTIONS[lower]) return STATIC_CORRECTIONS[lower];
    if (this.dynamicCorrections.has(lower)) return this.dynamicCorrections.get(lower)!;

    // 2. Fuzzy match against static corrections (only for tokens ≥ 5 chars to avoid false positives)
    if (lower.length >= 5) {
      let bestKey = '';
      let bestDist = Infinity;
      for (const key of Object.keys(STATIC_CORRECTIONS)) {
        if (Math.abs(key.length - lower.length) > 2) continue;
        const d = levenshtein(lower, key);
        if (d === 1 && d < bestDist) { bestDist = d; bestKey = key; }
      }
      if (bestKey) return STATIC_CORRECTIONS[bestKey];
    }

    return token; // no correction found
  }

  // Process a full input string, returning corrected version + change map
  processInput(input: string): { corrected: string; changes: Record<string, string> } {
    const changes: Record<string, string> = {};
    const corrected = input.replace(/\b([a-zA-Z]+)\b/g, (match) => {
      const fix = this.correct(match);
      if (fix !== match) { changes[match] = fix; }
      return fix;
    });
    return { corrected, changes };
  }
}
