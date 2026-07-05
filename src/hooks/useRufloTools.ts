// ── useRufloTools ─────────────────────────────────────────────────────────────
// React hook for calling Ruflo MCP tools from the browser.  Wraps the server
// proxy so the UI never needs to know the Ruflo command path.

import { useCallback, useEffect, useState } from 'react';
import { resolveApiUrl } from '../utils/apiUrl';

export interface RufloTool {
  name: string;
}

export interface RufloStatus {
  enabled: boolean;
  connected: boolean;
  toolCount: number;
  tools: string[];
}

export interface UseRufloToolsReturn {
  status: RufloStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  callTool: (tool: string, args?: Record<string, unknown>) => Promise<any>;
  searchMemory: (query: string, k?: number) => Promise<any>;
  storeMemory: (content: string, tags?: string[]) => Promise<any>;
  listAgents: () => Promise<any>;
  checkSwarmHealth: () => Promise<any>;
}

export function useRufloTools(): UseRufloToolsReturn {
  const [status, setStatus] = useState<RufloStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(resolveApiUrl('ruflo/status'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RufloStatus;
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to query Ruflo status');
      setStatus({ enabled: false, connected: false, toolCount: 0, tools: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const callTool = useCallback(async (tool: string, args: Record<string, unknown> = {}) => {
    const res = await fetch(resolveApiUrl('ruflo/call'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, args }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Ruflo tool ${tool} failed (${res.status})`);
    return data.result;
  }, []);

  const searchMemory = useCallback(
    async (query: string, k = 5) => {
      return callTool('memory_search', { query, k });
    },
    [callTool],
  );

  const storeMemory = useCallback(
    async (content: string, tags: string[] = []) => {
      return callTool('memory_store', { content, tags });
    },
    [callTool],
  );

  const listAgents = useCallback(() => callTool('agent_list', {}), [callTool]);
  const checkSwarmHealth = useCallback(() => callTool('swarm_health', {}), [callTool]);

  return {
    status,
    loading,
    error,
    refresh,
    callTool,
    searchMemory,
    storeMemory,
    listAgents,
    checkSwarmHealth,
  };
}
