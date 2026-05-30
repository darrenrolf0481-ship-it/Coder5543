import { GoogleGenAI } from './googleGenAiStub';
import type { BrainContext } from './brain/types';

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
  const mcpToolFilters = options?.mcpTools || [];

  const model = aiModel || (isFast ? 'gemini-2.5-flash' : 'gemini-2.5-pro');
  const config: any = { systemInstruction: enrichedSystemInstruction };
  
  // ── MCP Tool Integration ───────────────────────────────────────────────────
  if (mcpToolFilters.length > 0) {
    try {
      // 1. Fetch tool definitions from our MCP bridge
      const mcpRes = await fetch('./api/mcp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'tools_list', method: 'tools/list' }),
      });
      if (mcpRes.ok) {
        const mcpData = await mcpRes.json();
        const allTools = mcpData.result?.tools || [];
        
        // 2. Filter tools based on agent personality
        const filteredTools = allTools.filter((t: any) => 
          mcpToolFilters.includes('*') || mcpToolFilters.includes(t.name)
        );

        if (filteredTools.length > 0) {
          // 3. Map MCP tools to Gemini function declarations
          config.tools = [{
            functionDeclarations: filteredTools.map((t: any) => ({
              name: t.name,
              description: t.description,
              parameters: t.inputSchema,
            }))
          }];
        }
      }
    } catch (err) {
      console.warn('[AI Service] MCP tool discovery failed:', err);
    }
  }

  if (isJson) {
    config.responseMimeType = "application/json";
    if (options?.responseSchema) {
      config.responseSchema = options.responseSchema;
    }
  }

  // Handle multi-turn tool calling
  let contents = Array.isArray(finalPrompt) ? [...finalPrompt] : [{ role: 'user', parts: [{ text: finalPrompt }] }];
  let response = await ai.models.generateContent({ model, contents, config });

  // Loop to handle potential tool calls (maximum 5 turns to prevent runaway)
  for (let turn = 0; turn < 5; turn++) {
    const functionCalls = response.functionCalls();
    if (!functionCalls || functionCalls.length === 0) break;

    const functionResponses = [];
    for (const call of functionCalls) {
      try {
        const mcpExecRes = await fetch('./api/mcp/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: `call_${Date.now()}`,
            method: 'tools/call',
            params: { name: call.name, arguments: call.args }
          }),
        });
        
        if (mcpExecRes.ok) {
          const mcpResult = await mcpExecRes.json();
          // Projscan returns { content: [{ type: 'text', text: '...' }] }
          const textResult = mcpResult.result?.content?.[0]?.text || JSON.stringify(mcpResult.result);
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { content: textResult }
            }
          });
        } else {
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: `MCP execution failed with status ${mcpExecRes.status}` }
            }
          });
        }
      } catch (err: any) {
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { error: err.message }
          }
        });
      }
    }

    // Update history with the function calls and their responses
    contents.push(response.candidates[0].content);
    contents.push({ role: 'user', parts: functionResponses });

    // Generate next response
    response = await ai.models.generateContent({ model, contents, config });
  }

  const text = response.text();
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

  const model = aiModel || 'meta-llama/llama-3.3-70b-instruct:free';
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
      'Authorization': `Bearer ${openrouterApiKey || ''}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Crimson OS'
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
    throw new Error(`OpenRouter API returned empty response: ${data.error?.message || JSON.stringify(data).slice(0, 200)}`);
  }
  return text;
};

export const generateAIResponse = async (
    prompt: string | any[],
    systemInstruction: string,
    options?: { modelType?: 'fast' | 'smart', json?: boolean, responseSchema?: any, template?: { content: string, data: Record<string, string> } },
    dependencies?: {
        aiProvider?: string,
        aiModel?: string,
        ai?: any,
        grokApiKey?: string,
        openrouterApiKey?: string,
        projectSettings?: any,
        ollamaModels?: string[],
        signal?: AbortSignal,
        brainContext?: BrainContext;
    }
) => {
    let resolvedProvider = dependencies?.aiProvider;
    let resolvedModel = dependencies?.aiModel;
    let resolvedAi = dependencies?.ai;
    let resolvedGrokKey = dependencies?.grokApiKey;
    let resolvedOpenRouterKey = dependencies?.openrouterApiKey;
    let resolvedSettings = dependencies?.projectSettings;
    let resolvedOllamaModels = dependencies?.ollamaModels || [];
    const signal = dependencies?.signal;
    const brainContext = dependencies?.brainContext;

    if (!resolvedProvider || !resolvedOpenRouterKey) {
      try {
        const stored = localStorage.getItem('node_preferences');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.aiProvider === 'google' || parsed.aiProvider === 'openrouter' || parsed.aiModel?.includes('gemini-3')) {
            parsed.aiProvider = 'ollama';
            parsed.aiModel = 'llama3.2:latest';
          }
          if (!resolvedProvider) {
            resolvedProvider = parsed.aiProvider;
          }
          if (!resolvedModel) {
            resolvedModel = parsed.aiModel;
          }
          if (!resolvedGrokKey) {
            resolvedGrokKey = parsed.grokApiKey;
          }
          if (!resolvedOpenRouterKey) {
            resolvedOpenRouterKey = parsed.openrouterApiKey;
          }
          if (!resolvedSettings) {
            resolvedSettings = parsed.projectSettings;
          }
          if (parsed.geminiApiKey && !resolvedAi) {
            resolvedAi = new GoogleGenAI({ apiKey: parsed.geminiApiKey });
          }
        }
      } catch (err) {
        console.warn('[aiService] Fallback config load failed:', err);
      }
    }

    resolvedProvider = resolvedProvider || 'ollama';
    resolvedSettings = resolvedSettings || { ollamaUrl: 'http://127.0.0.1:11434' };

    const resolvedDeps = {
      aiProvider: resolvedProvider,
      aiModel: resolvedModel,
      ai: resolvedAi,
      grokApiKey: resolvedGrokKey,
      openrouterApiKey: resolvedOpenRouterKey,
      projectSettings: resolvedSettings,
      ollamaModels: resolvedOllamaModels,
      signal,
      brainContext,
    };

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

    if (signal?.aborted) return '';

    switch (resolvedProvider) {
      case 'google':
        return generateGoogleResponse(finalPrompt, systemInstruction, options, resolvedDeps);
      case 'grok':
        return generateGrokResponse(finalPrompt, systemInstruction, options, resolvedDeps);
      case 'openrouter':
        return generateOpenRouterResponse(finalPrompt, systemInstruction, options, resolvedDeps);
      case 'ollama':
        return generateOllamaResponse(finalPrompt, systemInstruction, options, resolvedDeps);
      default:
        return '';
    }
};

