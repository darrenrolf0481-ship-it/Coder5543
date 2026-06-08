import { useEffect, useState, useCallback } from 'react';
import { localCore } from '../services/localCoreService';

export function useWebContainer() {
  const [status, setStatus] = useState<'idle' | 'booting' | 'online' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const boot = useCallback(async () => {
    setStatus('booting');
    try {
      await localCore.boot();
      setStatus('online');
    } catch (err: any) {
      setError(err.message || 'Failed to boot local core');
      setStatus('error');
    }
  }, []);

  const exec = useCallback(async (cmd: string, args: string[] = [], onStdout?: (data: string) => void) => {
    if (status !== 'online') {
      await boot();
    }
    return localCore.exec(cmd, args, onStdout);
  }, [status, boot]);

  const setup = useCallback(async (onOutput?: (data: string) => void) => {
    if (status !== 'online') {
      await boot();
    }
    return localCore.setupDependencies(onOutput);
  }, [status, boot]);

  // Initial boot attempt
  useEffect(() => {
    boot();
  }, [boot]);

  return { status, error, boot, exec, setup };
}
