import React from 'react';

export type AiDomain = 'editor' | 'terminal' | 'chat' | 'swarm' | 'analysis' | 'debug' | 'default';

export function useAiRequest(generateFn: (...args: any[]) => Promise<any>) {
  const [loading, setLoading] = React.useState<Partial<Record<AiDomain, boolean>>>({});
  const [errors, setErrors] = React.useState<Partial<Record<AiDomain, string | undefined>>>({});

  const request = React.useCallback(
    async (
      domain: AiDomain,
      prompt: string,
      systemInstruction: string,
      options?: object,
    ): Promise<string | null> => {
      setLoading((prev) => ({ ...prev, [domain]: true }));
      setErrors((prev) => ({ ...prev, [domain]: undefined }));
      try {
        return (await generateFn(prompt, systemInstruction, options, domain)) ?? null;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          console.warn(`[AI:${domain}] Request was aborted.`);
          return null;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setErrors((prev) => ({ ...prev, [domain]: msg }));
        console.error(`[AI:${domain}]`, msg);
        return null;
      } finally {
        setLoading((prev) => ({ ...prev, [domain]: false }));
      }
    },
    [generateFn],
  );

  const isLoading = React.useCallback((d: AiDomain) => !!loading[d], [loading]);
  const anyLoading = Object.values(loading).some(Boolean);
  const getError = React.useCallback((d: AiDomain) => errors[d] ?? null, [errors]);

  return { request, isLoading, anyLoading, getError };
}
