/**
 * Lightweight shell-command utilities for the in-app terminal.
 */

const DANGEROUS_PATTERNS = [
  /\brm\s+(-[rf]*[rf]|--recursive|--force|\s*-\w*[rf])/, // rm -rf / rm -r -f
  /\bsudo\b/,
  /\bmkfs\b/,
  /\bdd\s+if=/,
  /\b>\s*[\/~]|\b>>\s*[\/~]/, // overwrites at root/home
  /\bcurl\b.*\|\s*(sh|bash|zsh)/,
  /\bwget\b.*\|\s*(sh|bash|zsh)/,
  /\bfetch\b.*\|\s*(sh|bash|zsh)/,
  /\b:\(\)\s*\{\s*:\|\:;/, // fork bomb
];

export function isDangerousCommand(cmd: string): boolean {
  return DANGEROUS_PATTERNS.some((p) => p.test(cmd));
}

/**
 * Naive but serviceable command-line splitter that respects single/double quotes
 * and backslash escapes. Returns the command and its arguments.
 */
export function splitCommand(line: string): { cmd: string; args: string[] } {
  const args: string[] = [];
  let current = '';
  let quote: "'" | '"' | null = null;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (current !== '') {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current !== '') args.push(current);

  const cmd = args.shift() ?? '';
  return { cmd, args };
}

const BRACKETS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const CLOSING = new Set(Object.values(BRACKETS));

/**
 * Returns true if the line ends with an unfinished continuation:
 * trailing backslash, unclosed quote, or unbalanced bracket.
 */
export function isIncompleteCommand(line: string): boolean {
  if (line.endsWith('\\')) return true;

  let singleQuotes = 0;
  let doubleQuotes = 0;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === "'" && doubleQuotes % 2 === 0) {
      singleQuotes++;
      continue;
    }

    if (ch === '"' && singleQuotes % 2 === 0) {
      doubleQuotes++;
      continue;
    }

    if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1) continue;

    if (BRACKETS[ch]) {
      stack.push(BRACKETS[ch]);
    } else if (CLOSING.has(ch)) {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  return singleQuotes % 2 === 1 || doubleQuotes % 2 === 1 || stack.length > 0;
}

/**
 * Compact prompt context for the natural-language interpreter.
 */
export function buildTerminalContext(
  cwd: string,
  history: string[],
  nearbyFiles: string[]
): string {
  const recent = history.slice(0, 5).reverse();
  return [
    `Current directory: ${cwd}`,
    recent.length ? `Recent commands:\n${recent.map((c) => `- ${c}`).join('\n')}` : '',
    nearbyFiles.length ? `Files here: ${nearbyFiles.slice(0, 20).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
