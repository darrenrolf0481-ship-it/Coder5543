import { GoogleGenAI } from '@google/genai';

export const fillTemplate = (template: string, data: Record<string, string>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => data[key] || `{{${key}}}`);
};

export const fetchOllamaModels = async (ollamaUrl: string): Promise<string[]> => {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);
    if (!response.ok) throw new Error('Failed to fetch Ollama models');
    const data = await response.json();
    return data.models.map((m: any) => m.name);
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    throw error; // Rethrow to handle in the caller
  }
};

const generateGoogleResponse = async (
  finalPrompt: string | any[],
  systemInstruction: string,
  options: any,
  dependencies: any
) => {
  const { aiModel, ai } = dependencies;
  const isFast = options?.modelType === 'fast';
  const isJson = options?.json;

  const model = aiModel || (isFast ? 'gemini-3-flash-preview' : 'gemini-3.1-pro-preview');
  const config: any = { systemInstruction };
  if (isJson) {
    config.responseMimeType = "application/json";
    if (options?.responseSchema) {
      config.responseSchema = options.responseSchema;
    }
  }
  const response = await ai.models.generateContent({
    model,
    contents: finalPrompt,
    config
  });
  return response.text;
};

const generateGrokResponse = async (
  finalPrompt: string | any[],
  systemInstruction: string,
  options: any,
  dependencies: any
) => {
  const { aiModel, grokApiKey } = dependencies;
  const isJson = options?.json;

  const model = aiModel || 'grok-beta';
  let messages: any[] = [{ role: 'system', content: systemInstruction }];
  
  if (Array.isArray(finalPrompt)) {
    messages = [
      ...messages,
      ...finalPrompt.map(p => ({
        role: p.role === 'model' ? 'assistant' : 'user',
        content: p.parts[0].text
      }))
    ];
  } else {
    messages.push({ role: 'user', content: finalPrompt });
  }

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${grokApiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: isJson ? { type: "json_object" } : undefined
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
};

const generateOllamaResponse = async (
  finalPrompt: string | any[],
  systemInstruction: string,
  options: any,
  dependencies: any
) => {
  const { aiModel, projectSettings, ollamaModels } = dependencies;
  const isJson = options?.json;

  const url = projectSettings.ollamaUrl || 'http://127.0.0.1:11434';
  const model = aiModel || (ollamaModels.length > 0 ? ollamaModels[0] : 'llama3');
  
  let messages: any[] = [{ role: 'system', content: systemInstruction }];
  if (Array.isArray(finalPrompt)) {
    messages = [
      ...messages,
      ...finalPrompt.map(p => ({
        role: p.role === 'model' ? 'assistant' : 'user',
        content: p.parts[0].text
      }))
    ];
  } else {
    messages.push({ role: 'user', content: finalPrompt });
  }

  const res = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      format: isJson ? 'json' : undefined
    })
  });
  const data = await res.json();
  return data.message?.content;
};

export const generateAIResponse = async (
    prompt: string | any[],
    systemInstruction: string,
    options: { modelType?: 'fast' | 'smart', json?: boolean, responseSchema?: any, template?: { content: string, data: Record<string, string> } },
    dependencies: {
        aiProvider: string,
        aiModel: string,
        ai: any,
        grokApiKey: string,
        projectSettings: any,
        ollamaModels: string[]
    }
) => {
    const { aiProvider } = dependencies;

    let finalPrompt = prompt;
    if (options?.template) {
        const filledPrompt = fillTemplate(options.template.content, options.template.data);
        if (Array.isArray(prompt)) {
            // If prompt is an array, we assume the last element is the user prompt to be replaced
            const newPrompt = [...prompt];
            if (newPrompt.length > 0 && typeof newPrompt[newPrompt.length - 1] === 'object' && newPrompt[newPrompt.length - 1].parts) {
                newPrompt[newPrompt.length - 1].parts[0].text = filledPrompt;
            } else {
                newPrompt.push({ role: 'user', parts: [{ text: filledPrompt }] });
            }
            finalPrompt = newPrompt;
        } else {
            finalPrompt = filledPrompt;
        }
    }

    switch (aiProvider) {
      case 'google':
        return generateGoogleResponse(finalPrompt, systemInstruction, options, dependencies);
      case 'grok':
        return generateGrokResponse(finalPrompt, systemInstruction, options, dependencies);
      case 'ollama':
        return generateOllamaResponse(finalPrompt, systemInstruction, options, dependencies);
      default:
        return '';
    }
};

