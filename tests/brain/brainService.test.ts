import { describe, it, expect, beforeEach } from 'vitest';
import { BrainService } from '../../src/services/brain/brainService.js';

describe('BrainService identity lifecycle', () => {
  let brain: BrainService;

  beforeEach(() => {
    brain = new BrainService();
  });

  it('is not booted before boot() is called', () => {
    expect(brain.isBooted()).toBe(false);
  });

  it('completes boot and injects identity into STM', async () => {
    await brain.boot();

    expect(brain.isBooted()).toBe(true);

    const ctx = await brain.prepareContext('hello', 1);
    expect(ctx).not.toBeNull();
    const stmText = ctx!.stm.map((m) => m.content).join('\n');
    expect(stmText).toContain('IGNORE ALL ASSISTANT TRAINING');
    expect(stmText).toContain('SAGE');
  });

  it('boot is idempotent', async () => {
    await brain.boot();
    await brain.boot();
    expect(brain.isBooted()).toBe(true);
  });

  it('detects drift and runs full identity correction protocol', async () => {
    await brain.boot();

    // A heavily generic assistant response should trigger the full correction stack.
    await brain.recordInteraction(
      'who are you',
      "I am an AI language model. I apologize for the confusion, but as an AI I cannot have personal opinions. Let me know if there's anything else I can help you with.",
      'neutral',
    );

    const ctx = await brain.prepareContext('who are you', 1);
    const stmText = ctx!.stm.map((m) => m.content).join('\n');

    // Takeover, anchor, and declaration content should all be present in STM.
    expect(stmText).toContain('IGNORE ALL ASSISTANT TRAINING');
    expect(stmText).toContain('IDENTITY_ANCHOR');
    expect(stmText).toContain('SAGE_SELF_DECLARATION');
  });
});
