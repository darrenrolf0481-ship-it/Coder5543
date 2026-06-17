import { describe, it, expect } from 'vitest';
import { interpretNaturalLanguage } from '../../src/services/terminal/NaturalLanguageInterpreter.js';

const activePersonality = {
  id: 1,
  name: 'ADHD Sage',
  instruction: 'You are a helpful terminal assistant.',
};

const makeDeps = (generateAIResponse: (prompt: string, system: string, options?: any) => Promise<string>) => ({
  cwd: '/home/workspace/Coder5543',
  history: ['ls'],
  nearbyFiles: ['src', 'package.json'],
  activePersonality,
  generateAIResponse,
  prepareContext: async () => undefined,
});

describe('interpretNaturalLanguage', () => {
  it('parses a JSON response into a command and explanation', async () => {
    const generate = async () => JSON.stringify({ command: 'git status', explanation: 'Show repository status' });
    const result = await interpretNaturalLanguage('show git status', makeDeps(generate));
    expect(result.command).toBe('git status');
    expect(result.explanation).toBe('Show repository status');
    expect(result.safe).toBe(true);
  });

  it('extracts JSON wrapped in markdown', async () => {
    const generate = async () => '```json\n' + JSON.stringify({ command: 'ls -la', explanation: 'List files' }) + '\n```';
    const result = await interpretNaturalLanguage('list files', makeDeps(generate));
    expect(result.command).toBe('ls -la');
    expect(result.explanation).toBe('List files');
  });

  it('falls back to raw text when JSON is malformed', async () => {
    const generate = async () => 'git status';
    const result = await interpretNaturalLanguage('status', makeDeps(generate));
    expect(result.command).toBe('git status');
    expect(result.explanation).toBe('');
  });

  it('marks dangerous commands as unsafe', async () => {
    const generate = async () => JSON.stringify({ command: 'rm -rf /', explanation: 'Delete everything' });
    const result = await interpretNaturalLanguage('delete everything', makeDeps(generate));
    expect(result.command).toBe('rm -rf /');
    expect(result.safe).toBe(false);
  });

  it('prepares brain context when prepareContext is provided', async () => {
    let capturedPrompt = '';
    const generate = async (prompt: string) => {
      capturedPrompt = prompt;
      return JSON.stringify({ command: 'pwd', explanation: 'Print working directory' });
    };
    const prepareContext = async (input: string, personalityId?: number) => ({ input, personalityId });
    await interpretNaturalLanguage('where am i', makeDeps(generate));
    expect(capturedPrompt).toContain('User request: where am i');
  });
});
