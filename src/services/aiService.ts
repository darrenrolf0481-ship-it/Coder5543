import { GoogleGenAI } from '@google/genai';
import type { BrainContext } from './brain/types';
import { broker } from './messageBroker.js';

export const fillTemplate = (template: string, data: Record<string, string>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => data[key] || `{{${key}}}`);
};

export const fetchOllamaModels = async (_ollamaUrl: string): Promise<string[]> => {
  try {
    // Use the server-side proxy to avoid CORS issues
    const response = await fetch('./api/ollama/tags');
    if (!response.ok) {
      if (response.status === 502) throw new Error('Ollama service is currently offline (502)');
      throw new Error(`Failed to fetch Ollama models: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.models.map((m: any) => m.name);
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    throw error;
  }
};

const formatNeuralContext = (context: BrainContext): string => {
  const { stm, relevantExperiences, endocrine, learningRate, riskTolerance, avoidanceActive } = context;
  
  let neuralPrompt = `\n\n[NEURAL_STATE_ACTIVE]
Current Physiological State:
- Dopamine: ${endocrine.dopamine.toFixed(2)} (Learning Rate: ${learningRate.toFixed(2)})
- Cortisol: ${endocrine.cortisol.toFixed(2)} (Risk Tolerance: ${riskTolerance.toFixed(2)})
${avoidanceActive ? '- AVOIDANCE_PROTOCOL_TRIGGERED: Previous patterns led to logical pain/failure. Exercise extreme caution.' : ''}

Recent Working Memory (STM):
${stm.map(m => `- [${m.role.toUpperCase()}]: ${m.content}`).join('\n')}

Relevant Past Experiences (LTM):
${relevantExperiences.map(e => `- Intent: ${e.intent}\n  Result: ${e.outcome}\n  Response: ${e.response}`).join('\n')}
`;
  return neuralPrompt;
};

const generateGoogleResponse = async (
  finalPrompt: string | any[],
  systemInstruction: string,
  options: any,
  dependencies: any
) => {
  const { aiModel, ai, brainContext } = dependencies;
  if (!ai) throw new Error('Google AI client not initialised. Set your Gemini API key in System Config → Neural Provider Configuration.');
  
  let enrichedSystemInstruction = systemInstruction;
  if (brainContext) {
    enrichedSystemInstruction += formatNeuralContext(brainContext);
  }

  const isFast = options?.modelType === 'fast';
  const isJson = options?.json;

  const model = aiModel || (isFast ? 'gemini-3-flash' : 'gemini-3.1-pro-preview');
  const config: any = { systemInstruction: enrichedSystemInstruction };
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
  // Defensive: .text getter returns undefined when the model emits non-text parts
  // (e.g. function calls, unexpected finish reasons) or empty candidates.
  const text = response.text;
  if (text === undefined) {
    const finishReason = response.candidates?.[0]?.finishReason;
    const nonTextParts = response.candidates?.[0]?.content?.parts
      ?.filter((p: any) => !p.text)
      ?.map((p: any) => Object.keys(p).join(','))
      ?.join('; ');
    throw new Error(
      `Google model returned no text. finishReason=${finishReason || 'unknown'}${nonTextParts ? ` nonTextParts=[${nonTextParts}]` : ''}`
    );
  }
  return text;
};

const generateGrokResponse = async (
  finalPrompt: string | any[],
  systemInstruction: string,
  options: any,
  dependencies: any
) => {
  const { aiModel, grokApiKey, signal, brainContext } = dependencies;
  const isJson = options?.json;

  let enrichedSystemInstruction = systemInstruction;
  if (brainContext) {
    enrichedSystemInstruction += formatNeuralContext(brainContext);
  }

  const model = aiModel || 'grok-beta';
  let messages: any[] = [{ role: 'system', content: enrichedSystemInstruction }];
  
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
    }),
    signal,
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (text === undefined) {
    throw new Error(`Grok API returned empty response: ${data.error?.message || JSON.stringify(data).slice(0, 200)}`);
  }
  return text;
};

const generateOllamaResponse = async (
  finalPrompt: string | any[],
  systemInstruction: string,
  options: any,
  dependencies: any
) => {
  const { aiModel, projectSettings, ollamaModels, signal, brainContext } = dependencies;
  const isJson = options?.json;

  let enrichedSystemInstruction = systemInstruction;
  if (brainContext) {
    enrichedSystemInstruction += formatNeuralContext(brainContext);
  }

  const model = aiModel || (ollamaModels.length > 0 ? ollamaModels[0] : 'llama3.2:latest');

  let messages: any[] = [{ role: 'system', content: enrichedSystemInstruction }];
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

  // Use server-side proxy to avoid CORS
  const res = await fetch('./api/ollama/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      format: isJson ? 'json' : undefined
    }),
    signal,
  });

  if (!res.ok) {
    if (res.status === 502) throw new Error('Ollama service is currently offline (502)');
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Ollama error (${res.status}): ${errorData.error || res.statusText}`);
  }

  const data = await res.json();
  const text = data.message?.content;
  if (text === undefined) {
    throw new Error(`Ollama returned empty response: ${data.error || JSON.stringify(data).slice(0, 200)}`);
  }
  return text;
};

const generateOpenRouterResponse = async (
  finalPrompt: string | any[],
  systemInstruction: string,
  options: any,
  dependencies: any
) => {
  const { aiModel, openrouterApiKey, signal, brainContext } = dependencies;
  const isJson = options?.json;

  let enrichedSystemInstruction = systemInstruction;
  if (brainContext) {
    enrichedSystemInstruction += formatNeuralContext(brainContext);
  }

  const model = aiModel || 'google/gemma-2-9b-it:free';
  let messages: any[] = [{ role: 'system', content: enrichedSystemInstruction }];
  
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

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openrouterApiKey}`,
      'HTTP-Referer': 'https://docs.zocomputer.com',
      'X-Title': 'Crimson OS'
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: isJson ? { type: "json_object" } : undefined
    }),
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter error (${res.status}): ${errorData.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (text === undefined) {
    throw new Error(`OpenRouter API returned empty response: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return text;
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
        openrouterApiKey?: string,
        projectSettings: any,
        ollamaModels: string[],
        signal?: AbortSignal,
        brainContext?: BrainContext;
    }
) => {
    const { aiProvider, aiModel } = dependencies;
    const startTime = Date.now();

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

    if (dependencies.signal?.aborted) return '';

    try {
        let response = '';
        switch (aiProvider) {
          case 'google':
            response = await generateGoogleResponse(finalPrompt, systemInstruction, options, dependencies);
            break;
          case 'grok':
            response = await generateGrokResponse(finalPrompt, systemInstruction, options, dependencies);
            break;
          case 'ollama':
            response = await generateOllamaResponse(finalPrompt, systemInstruction, options, dependencies);
            break;
          case 'openrouter':
            response = await generateOpenRouterResponse(finalPrompt, systemInstruction, options, dependencies);
            break;
          default:
            response = '';
        }

        const duration = Date.now() - startTime;
        broker.publish('LLM_NETWORK_TRAFFIC', {
            provider: aiProvider,
            model: aiModel,
            latencyMs: duration,
            status: 'success',
            timestamp: startTime
        }, 'system');

        return response;
    } catch (error: any) {
        const duration = Date.now() - startTime;
        broker.publish('LLM_NETWORK_TRAFFIC', {
            provider: aiProvider,
            model: aiModel,
            latencyMs: duration,
            status: 'error',
            error: error.message,
            timestamp: startTime
        }, 'system');
        throw error;
    }
};

