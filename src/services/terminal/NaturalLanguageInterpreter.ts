import { isDangerousCommand, buildTerminalContext } from './commandUtils.js';

export interface NaturalLanguageResult {
  command: string;
  explanation: string;
  safe: boolean;
}

export interface InterpreterDeps {
  cwd: string;
  history: string[];
  nearbyFiles: string[];
  activePersonality: any;
  generateAIResponse: (
    prompt: string,
    systemInstruction: string,
    options?: { modelType?: 'fast' | 'smart'; json?: boolean; responseSchema?: any; brainContext?: any }
  ) => Promise<string>;
  prepareContext?: (input: string, personalityId?: number) => Promise<any>;
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    command: { type: 'string', description: 'The exact shell command to run' },
    explanation: { type: 'string', description: 'One-line explanation of what the command does' },
  },
  required: ['command', 'explanation'],
};

const SYSTEM_INSTRUCTION = `You are the Crimson OS terminal translator. The user is speaking in plain English inside a Linux shell at the path provided.

Rules:
- Translate the request into ONE precise shell command.
- Prefer common utilities: ls, cat, grep, find, git, npm, node, python, cd, mkdir, touch, echo.
- Do not chain multiple commands with ; or && unless the user explicitly asks for a sequence.
- Do not add flags the user did not ask for unless they are required for correctness.
- If the request is too vague, ask for clarification by putting a question in the "command" field prefixed with "echo".
- Respond ONLY with the JSON schema. No markdown, no prose.`;

export async function interpretNaturalLanguage(
  request: string,
  deps: InterpreterDeps
): Promise<NaturalLanguageResult> {
  const { cwd, history, nearbyFiles, activePersonality, generateAIResponse, prepareContext } = deps;

  const context = buildTerminalContext(cwd, history, nearbyFiles);
  const prompt = `${context}\n\nUser request: ${request}`;

  const brainContext = prepareContext
    ? await prepareContext(prompt, activePersonality?.id)
    : undefined;

  const system = `${SYSTEM_INSTRUCTION}\n\nPersona: ${activePersonality?.instruction ?? 'Crimson OS terminal assistant'}`;

  const raw = await generateAIResponse(prompt, system, {
    modelType: 'fast',
    json: true,
    responseSchema: RESPONSE_SCHEMA,
    brainContext,
  });

  let parsed: Partial<NaturalLanguageResult> = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Some models return markdown-wrapped JSON.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        // fallthrough
      }
    }
  }

  const command = (parsed.command ?? raw).trim();
  const explanation = (parsed.explanation ?? '').trim();
  const safe = !isDangerousCommand(command);

  return { command, explanation, safe };
}
