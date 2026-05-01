import { useEffect } from 'react';
import { useDebounce } from '../lib/useDebounce';

export function useThrottledStorage<T>(key: string, value: T, delayMs = 2000): void {
  const debounced = useDebounce(value, delayMs);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(debounced));
    } catch (e) {
      console.warn('[Storage] Failed to persist state:', e);
    }
  }, [key, debounced]);
}
