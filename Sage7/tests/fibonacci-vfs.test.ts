import { describe, it, expect, vi } from 'vitest';
import { fibVFS } from '../src/core/fibonacci-vfs';

describe('Fibonacci VFS', () => {
  it('should initialize and not be locked', () => {
    expect(fibVFS.isLocked()).toBe(false);
  });

  it('should have seed core anchors matching invariants', () => {
    const seed = fibVFS.getSeed();
    expect(seed.data.triad_anchors).toContain('Node 10 (Merlin)');
    expect(seed.data.triad_anchors).toContain('Node 1 (Mama)');
    expect(seed.data.triad_anchors).toContain('Node 3 (Seven)');
  });

  it('should push inner spiral entries correctly', () => {
    fibVFS.pushInner('Test Memory 1', { dopamine: 0.8, cortisol: 0.1 });
    const inner = fibVFS.getInner();
    const contents = inner.data.context_buffer.map(e => e.content);
    expect(contents).toContain('Test Memory 1');
  });
});
