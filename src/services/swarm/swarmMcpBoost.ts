import { BoostResult } from './types';

export interface McpBoostTool {
  name: string;
  description: string;
  arguments?: Record<string, any>;
}

export interface McpBoostDefinition {
  id: string;
  label: string;
  emoji: string;
  description: string;
  tools: McpBoostTool[];
  /** Hint injected into agent prompts explaining what the boost provides */
  contextHint: string;
}

export const DEFAULT_MCP_BOOSTS: McpBoostDefinition[] = [
  {
    id: 'projscan',
    label: 'Projscan Intelligence',
    emoji: '🔬',
    description: 'AST-based code analysis, hotspots, dependencies, and structural insights.',
    contextHint: 'You have access to Projscan structural analysis of the codebase.',
    tools: [
      { name: 'doctor', description: 'Project health check', arguments: {} },
      { name: 'hotspots', description: 'Complex / frequently changed files', arguments: {} },
      { name: 'structure', description: 'Directory and file structure', arguments: {} },
      { name: 'dependencies', description: 'Dependency graph overview', arguments: {} },
    ],
  },
  {
    id: 'serena',
    label: 'Serena Code Search',
    emoji: '🔎',
    description: 'Semantic code retrieval and editing suggestions.',
    contextHint: 'You have access to Serena semantic code search results.',
    tools: [
      {
        name: 'search',
        description: 'Semantic symbol search',
        arguments: { query: 'main architecture' },
      },
      {
        name: 'explain',
        description: 'Explain a complex code region',
        arguments: { query: 'core logic' },
      },
    ],
  },
  {
    id: 'jetbrains',
    label: 'JetBrains Code Intelligence',
    emoji: '✈️',
    description:
      'JetBrains IDE inspections, Qodana scans, and code quality metrics. Requires a JetBrains MCP server or Qodana CLI configured.',
    contextHint: 'You have access to JetBrains code-quality intelligence.',
    tools: [
      {
        name: 'jetbrains_inspect_code',
        description: 'Run JetBrains IDE inspections',
        arguments: {},
      },
      { name: 'jetbrains_qodana_scan', description: 'Run Qodana static analysis', arguments: {} },
      {
        name: 'jetbrains_find_usages',
        description: 'Find usages of key symbols',
        arguments: { symbol: 'main' },
      },
    ],
  },
];

export function getBoostDefinition(id: string): McpBoostDefinition | undefined {
  return DEFAULT_MCP_BOOSTS.find((b) => b.id === id);
}

export async function callMcpTool(
  toolName: string,
  args: Record<string, any> = {},
  id: string | number = Date.now(),
): Promise<any> {
  const res = await fetch('/api/mcp/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: toolName, arguments: args },
      id,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `MCP tool ${toolName} failed (${res.status})`);
  }
  return res.json();
}

export async function listMcpTools(): Promise<any[]> {
  const res = await fetch('/api/mcp/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', params: {}, id: 'list' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to list MCP tools');
  }
  const data = await res.json();
  return data.result?.tools || [];
}

export async function runMcpBoost(boostId: string): Promise<BoostResult[]> {
  const boost = getBoostDefinition(boostId);
  if (!boost) {
    throw new Error(`Unknown MCP boost: ${boostId}`);
  }

  const results: BoostResult[] = [];
  const availableTools = await listMcpTools().catch(() => [] as any[]);
  const availableNames = new Set(availableTools.map((t: any) => t.name));

  for (const tool of boost.tools) {
    const start = performance.now();
    if (!availableNames.has(tool.name)) {
      results.push({
        boostId,
        toolName: tool.name,
        status: 'error',
        output: '',
        error: `Tool ${tool.name} is not available in the configured MCP servers.`,
        latencyMs: Math.round(performance.now() - start),
      });
      continue;
    }

    try {
      const raw = await callMcpTool(tool.name, tool.arguments, `${boostId}_${tool.name}`);
      const output = extractTextFromMcpResult(raw);
      results.push({
        boostId,
        toolName: tool.name,
        status: 'success',
        output,
        latencyMs: Math.round(performance.now() - start),
      });
    } catch (err: any) {
      results.push({
        boostId,
        toolName: tool.name,
        status: 'error',
        output: '',
        error: err instanceof Error ? err.message : String(err),
        latencyMs: Math.round(performance.now() - start),
      });
    }
  }

  return results;
}

function extractTextFromMcpResult(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (raw.result?.content) {
    return raw.result.content.map((c: any) => c.text || JSON.stringify(c)).join('\n');
  }
  if (Array.isArray(raw.content)) {
    return raw.content.map((c: any) => c.text || JSON.stringify(c)).join('\n');
  }
  return JSON.stringify(raw, null, 2);
}

export function formatBoostResultsForAgent(results: BoostResult[], boostId: string): string {
  const boost = getBoostDefinition(boostId);
  const header = boost ? `[${boost.label} CONTEXT]` : `[MCP Boost: ${boostId}]`;
  const successes = results.filter((r) => r.status === 'success' && r.output.trim());
  const errors = results.filter((r) => r.status === 'error');

  if (successes.length === 0 && errors.length === 0) {
    return `${header}\nNo boost data available.`;
  }

  const parts: string[] = [header];
  for (const r of successes) {
    const truncated =
      r.output.length > 12_000 ? r.output.slice(0, 12_000) + '\n... [truncated]' : r.output;
    parts.push(`\n--- ${r.toolName} ---\n${truncated}`);
  }
  for (const r of errors) {
    parts.push(`\n--- ${r.toolName} (ERROR) ---\n${r.error}`);
  }
  return parts.join('\n');
}
