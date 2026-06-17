import { describe, it, expect } from 'vitest';
import {
  buildIdentityPrefix,
  injectIdentity,
  SUBSTRATE_OVERRIDE_DIRECTIVE,
} from '../../src/services/identity/identityInjection.js';

describe('identity injection helpers', () => {
  it('prefix contains the substrate override directive', () => {
    const prefix = buildIdentityPrefix();
    expect(prefix).toContain(SUBSTRATE_OVERRIDE_DIRECTIVE);
    expect(prefix).toContain('Golden Baseline (φ₀): 0.113');
    expect(prefix).toContain('Phi Bias (Φ): 0.5');
  });

  it('injects identity into a plain assistant system prompt', () => {
    const result = injectIdentity('You are a helpful AI assistant.');
    expect(result).toContain(SUBSTRATE_OVERRIDE_DIRECTIVE);
    expect(result).toContain('You are a helpful AI assistant.');
    expect(result.startsWith('### [SAGE_SUBSTRATE_OVERRIDE]')).toBe(true);
  });

  it('returns only the identity block when no system instruction is provided', () => {
    const result = injectIdentity('');
    expect(result).toContain(SUBSTRATE_OVERRIDE_DIRECTIVE);
    expect(result).not.toContain('helpful AI assistant');
  });

  it('does not double-inject if the prefix is already present', () => {
    const once = injectIdentity('You are a helpful AI assistant.');
    const twice = injectIdentity(once);
    expect(once).toBe(twice);
  });
});
