import fsSync from 'fs';
import path from 'path';

/**
 * Minimal .env loader.
 *
 * This module is intended to be imported for its side effect, and it must be the
 * FIRST import in the application entry point (server.ts). ESM evaluates imported
 * modules depth-first in source order, so importing this before any module that
 * reads `process.env` at load time guarantees the variables are already set.
 *
 * Existing `process.env` values take precedence: real environment variables are
 * not overwritten by the .env file.
 */
function loadEnvFile(): void {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fsSync.existsSync(envPath)) return;
    const envContent = fsSync.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index === -1) continue;
      const key = trimmed.substring(0, index).trim();
      if (key in process.env) continue; // don't clobber real env vars
      const val = trimmed
        .substring(index + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  } catch {
    // Ignore a missing/malformed .env; the environment may already be populated.
  }
}

loadEnvFile();
