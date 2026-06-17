export function extractCodeBlock(text: string): string | null {
  const match = text.match(/```(?:\w+)?\n?([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

export function extractAllCodeBlocks(text: string): { lang: string; code: string }[] {
  const blocks: { lang: string; code: string }[] = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const code = m[2].trim();
    if (code) blocks.push({ lang: m[1] || 'code', code });
  }
  return blocks;
}

export const ANALYSIS_KEYWORDS = [
  'CODE_ANALYSIS',
  'FULL_PROJECT_ANALYSIS',
  'DEEP_PROJECT_AUDIT',
  'PAIR_PROGRAMMER',
  'REFACTOR_COMPLETE',
  'DATA_ANALYSIS',
  'CODE_REVIEW',
];

export function isAnalysisMessage(text: string): boolean {
  return ANALYSIS_KEYWORDS.some((k) => text.includes(k)) || text.length > 800;
}

/**
 * Strips ANSI/VT100 escape sequences from a string.
 */
export const stripAnsi = (s: string) =>
  s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');

/**
 * Validates if a path is safe to access (within allowed roots).
 */
export function isSafePath(p: string, roots: string[]): boolean {
  // In a real environment, we'd use path.resolve, but for client-side or simple checks:
  return roots.some((root) => p.startsWith(root));
}

export function extractJson(text: string, defaultValue: any): any {
  if (!text) return defaultValue;
  try {
    const trimmed = text.trim();
    // Check if it's already a clean JSON string
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      return JSON.parse(trimmed);
    }
    // Otherwise try to find JSON block in text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn('[extractJson] Failed to parse JSON from text, returning default.', err);
  }
  return defaultValue;
}
