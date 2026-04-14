import { renderHook, act } from '@testing-library/react';
import { useTerminal } from './useTerminal';
import { vi, describe, it, expect } from 'vitest';

describe('useTerminal', () => {
  const mockPersonality = {
    id: 1,
    name: 'Operator',
    instruction: 'Be helpful.',
    active: true,
    suggestions: ['ls', 'cd', 'ai']
  };

  const mockGenerateAIResponse = vi.fn();
  const mockSetTermuxStatus = vi.fn();

  it('should initialize with default values', () => {
    const { result } = renderHook(() => 
      useTerminal('~', mockPersonality, 'disconnected', mockSetTermuxStatus, mockGenerateAIResponse)
    );

    expect(result.current.terminalOutput).toHaveLength(3);
    expect(result.current.termInput).toBe('');
    expect(result.current.currentDir).toBe('~');
  });

  it('should handle input changes and suggestions', () => {
    const { result } = renderHook(() => 
      useTerminal('~', mockPersonality, 'disconnected', mockSetTermuxStatus, mockGenerateAIResponse)
    );

    act(() => {
      result.current.handleTermInputChange('l');
    });

    expect(result.current.termInput).toBe('l');
    expect(result.current.termSuggestions).toContain('ls');
    expect(result.current.termSuggestion).toBe('ls');
  });

  it('should handle clear command', async () => {
    const { result } = renderHook(() => 
      useTerminal('~', mockPersonality, 'disconnected', mockSetTermuxStatus, mockGenerateAIResponse)
    );

    act(() => {
      result.current.setTermInput('clear');
    });

    await act(async () => {
      await result.current.handleTerminalCommand({ preventDefault: () => {} } as any);
    });

    expect(result.current.terminalOutput).toEqual(['Buffer flushed.']);
  });
});
