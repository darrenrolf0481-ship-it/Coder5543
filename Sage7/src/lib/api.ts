'use client';

export async function generateResponse(
  provider: string,
  model: string,
  prompt: string,
  _settings: any,
  systemPrompt?: string,
  history?: { role: string; content: string }[]
) {
  return `[${provider.toUpperCase()} SIMULATION] I processed your request: "${prompt.substring(0, 30)}..."`;
}
