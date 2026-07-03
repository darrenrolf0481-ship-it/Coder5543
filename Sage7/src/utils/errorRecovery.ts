export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ClassifiedError {
  message: string;
  severity: ErrorSeverity;
  retryable: boolean;
  suppressed: boolean;
  category: 'network' | 'server' | 'client' | 'auth' | 'rate_limit';
}

// Habituation: suppress repeated non-critical noise; sensitize to first-time criticals
const errorCounts = new Map<string, number>();
const HABITUATION_THRESHOLD = 3;

export function classifyError(error: unknown): ClassifiedError {
  const err = error instanceof Error ? error : new Error(String(error));
  const msg = err.message.toLowerCase();

  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('offline')) {
    return { message: err.message, severity: 'medium', retryable: true, suppressed: false, category: 'network' };
  }
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
    return { message: err.message, severity: 'high', retryable: true, suppressed: false, category: 'server' };
  }
  if (msg.includes('429') || msg.includes('rate limit')) {
    return { message: err.message, severity: 'medium', retryable: true, suppressed: false, category: 'rate_limit' };
  }
  if (msg.includes('401') || msg.includes('403')) {
    return { message: err.message, severity: 'low', retryable: false, suppressed: false, category: 'auth' };
  }
  if (msg.includes('400') || msg.includes('404')) {
    return { message: err.message, severity: 'low', retryable: false, suppressed: false, category: 'client' };
  }
  if (msg.includes('out of memory') || msg.includes('heap') || msg.includes('abort')) {
    return { message: err.message, severity: 'critical', retryable: false, suppressed: false, category: 'client' };
  }
  return { message: err.message, severity: 'medium', retryable: true, suppressed: false, category: 'client' };
}

// Adaptive wrapper: habituates to repeated low-severity errors, flags first-time criticals
export function classifyAndAdapt(error: unknown): ClassifiedError & { firstCritical: boolean } {
  const base = classifyError(error);
  const key = `${base.category}_${base.severity}`;
  const count = (errorCounts.get(key) ?? 0) + 1;
  errorCounts.set(key, count);

  const suppressed = base.severity === 'low' && count > HABITUATION_THRESHOLD;
  const firstCritical = base.severity === 'critical' && count === 1;

  return { ...base, suppressed, firstCritical };
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!classifyError(err).retryable) throw err;
      const delay = baseDelayMs * Math.pow(2, i) + Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
