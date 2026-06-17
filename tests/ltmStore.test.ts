import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ltmStore } from '../src/services/brain/ltmStore';

describe('LTMStore polymorphic execution', () => {
  beforeEach(() => {
    vi.stubGlobal('window', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should delegate save to brainStorage on the server', async () => {
    const mockDbStore = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    };
    vi.stubGlobal('brainStorage', mockDbStore);

    const testExp = {
      id: 'test_123',
      intent: 'hello',
      response: 'world',
      outcome: 'success' as const,
      emotionalWeight: 0.5,
      tags: ['test'],
      timestamp: Date.now(),
      accessCount: 0,
      embedding: [0.1, 0.2, 0.3],
    };

    await ltmStore.save(testExp);
    expect(mockDbStore.getItem).toHaveBeenCalledWith('brain_ltm_experiences');
    expect(mockDbStore.setItem).toHaveBeenCalledWith(
      'brain_ltm_experiences',
      expect.stringContaining('test_123')
    );
  });

  it('should delegate getAll to brainStorage on the server', async () => {
    const mockDbStore = {
      getItem: vi.fn().mockReturnValue(JSON.stringify([{ id: 'test_123' }])),
      setItem: vi.fn(),
    };
    vi.stubGlobal('brainStorage', mockDbStore);

    const result = await ltmStore.getAll();
    expect(mockDbStore.getItem).toHaveBeenCalledWith('brain_ltm_experiences');
    expect(result).toEqual([{ id: 'test_123' }]);
  });
});
