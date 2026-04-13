import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAIResponse } from '../src/services/aiService';

describe('generateAIResponse', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should call Google Gemini API', async () => {
    const mockAi = {
      models: {
        generateContent: vi.fn().mockResolvedValue({ text: 'Google response' })
      }
    };
    
    const response = await generateAIResponse(
      'test prompt',
      'system instruction',
      {},
      {
        aiProvider: 'google',
        aiModel: 'gemini-3.1-pro-preview',
        ai: mockAi,
        grokApiKey: '',
        projectSettings: {},
        ollamaModels: []
      }
    );
    
    expect(response).toBe('Google response');
    expect(mockAi.models.generateContent).toHaveBeenCalled();
  });

  it('should call Grok API', async () => {
    (fetch as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'Grok response' } }] })
    });
    
    const response = await generateAIResponse(
      'test prompt',
      'system instruction',
      {},
      {
        aiProvider: 'grok',
        aiModel: 'grok-beta',
        ai: {},
        grokApiKey: 'test-key',
        projectSettings: {},
        ollamaModels: []
      }
    );
    
    expect(response).toBe('Grok response');
    expect(fetch).toHaveBeenCalledWith('https://api.x.ai/v1/chat/completions', expect.any(Object));
  });

  it('should call Ollama API', async () => {
    (fetch as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ message: { content: 'Ollama response' } })
    });
    
    const response = await generateAIResponse(
      'test prompt',
      'system instruction',
      {},
      {
        aiProvider: 'ollama',
        aiModel: 'llama3',
        ai: {},
        grokApiKey: '',
        projectSettings: { ollamaUrl: 'http://localhost:11434' },
        ollamaModels: ['llama3']
      }
    );
    
    expect(response).toBe('Ollama response');
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/chat', expect.any(Object));
  });

  it('should fill prompt template', async () => {
    const mockAi = {
      models: {
        generateContent: vi.fn().mockResolvedValue({ text: 'Template response' })
      }
    };
    
    const response = await generateAIResponse(
      'original prompt',
      'system instruction',
      { template: { content: 'Hello {{name}}', data: { name: 'World' } } },
      {
        aiProvider: 'google',
        aiModel: 'gemini-3.1-pro-preview',
        ai: mockAi,
        grokApiKey: '',
        projectSettings: {},
        ollamaModels: []
      }
    );
    
    expect(response).toBe('Template response');
    expect(mockAi.models.generateContent).toHaveBeenCalledWith(expect.objectContaining({
      contents: 'Hello World'
    }));
  });
});
