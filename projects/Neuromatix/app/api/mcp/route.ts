import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body: object, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...corsHeaders(), ...(init?.headers || {}) },
  });
}

interface McpServerEntry {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  description?: string;
  [key: string]: unknown;
}

interface McpConfig {
  mcpServers?: Record<string, McpServerEntry>;
  disabledMcpServers?: Record<string, McpServerEntry>;
  [key: string]: unknown;
}

interface ServerDocs {
  overview?: string;
  capabilities?: string[];
  commonTools?: string[];
  notes?: string;
}

interface DiscoveredServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
  description?: string;
  type: string;
  docs?: ServerDocs;
}

// Pre-defined built-in servers
const BUILTIN_SERVERS: DiscoveredServer[] = [];

const NEUROMATIX_CONFIG = path.join(process.cwd(), "config", "mcp-servers.json");
const SERVER_DOCS = path.join(process.cwd(), "config", "mcp-server-docs.json");
const SYSTEM_MCPO_CONFIG = "/etc/zo/mcpo/config.json";
const BRIDGE_CONFIG = "/home/workspace/Mcp/ollama-mcp-bridge/bridge_config.json";
const PYTHON_SERVERS_DIR = "/home/workspace/Mcp/mcp-servers";

function resolveEnv(entry: McpServerEntry): Record<string, string> | undefined {
  if (!entry.env) return undefined;
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(entry.env)) {
    if (typeof value !== "string") continue;
    // Resolve ${VAR} placeholders or empty values from process.env
    const match = value.match(/^\$\{(.+)\}$/);
    if (match) {
      const envValue = process.env[match[1]];
      if (envValue) resolved[key] = envValue;
    } else if (value === "" && process.env[key]) {
      resolved[key] = process.env[key]!;
    } else {
      resolved[key] = value;
    }
  }
  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

function addServer(
  servers: DiscoveredServer[],
  name: string,
  entry: McpServerEntry,
  type: string,
  prefix = "",
  docs?: ServerDocs
) {
  const safeName = prefix ? `${prefix}-${name}` : name;
  if (servers.some((s) => s.name === safeName)) return;
  servers.push({
    name: safeName,
    command: entry.command || "",
    args: Array.isArray(entry.args) ? entry.args : [],
    env: resolveEnv(entry) || entry.env,
    cwd: entry.cwd,
    description: entry.description || `${type} MCP server`,
    type,
    docs,
  });
}

function loadJsonConfig(filePath: string): McpConfig | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as McpConfig;
  } catch (e) {
    console.warn(`Failed to load MCP config from ${filePath}:`, e);
    return null;
  }
}

function loadConfigServers(
  servers: DiscoveredServer[],
  filePath: string,
  type: string,
  prefix = "",
  docsMap?: Record<string, ServerDocs>
) {
  const config = loadJsonConfig(filePath);
  if (!config || !config.mcpServers) return;
  for (const [name, entry] of Object.entries(config.mcpServers)) {
    const safeName = prefix ? `${prefix}-${name}` : name;
    addServer(servers, name, entry, type, prefix, docsMap?.[safeName] || docsMap?.[name]);
  }
}

function scanPythonServers(
  servers: DiscoveredServer[],
  docsMap?: Record<string, ServerDocs>
) {
  try {
    if (!fs.existsSync(PYTHON_SERVERS_DIR)) return;
    const entries = fs.readdirSync(PYTHON_SERVERS_DIR);
    for (const file of entries) {
      if (!file.endsWith(".py")) continue;
      const fullPath = path.join(PYTHON_SERVERS_DIR, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;
      const name = path.basename(file, ".py");
      if (servers.some((s) => s.name === name || s.name === `py-${name}`)) continue;
      servers.push({
        name: `py-${name}`,
        command: "python3",
        args: [fullPath],
        description: `Python MCP server (${name})`,
        type: "python",
        docs: docsMap?.[`py-${name}`] || docsMap?.[name],
      });
    }
  } catch (e) {
    console.warn("Failed to scan Python MCP servers:", e);
  }
}

async function discoverServers(): Promise<DiscoveredServer[]> {
  const servers = [...BUILTIN_SERVERS];

  // Load human-readable documentation map
  const docsConfig = loadJsonConfig(SERVER_DOCS) as { servers?: Record<string, ServerDocs> } | null;
  const docsMap = docsConfig?.servers || {};

  // 1. Neuromatix local registry
  loadConfigServers(servers, NEUROMATIX_CONFIG, "neuromatix", "", docsMap);

  // 2. System mcpo config (/etc/zo/mcpo/config.json)
  loadConfigServers(servers, SYSTEM_MCPO_CONFIG, "mcpo", "", docsMap);

  // 3. Ollama MCP bridge config
  loadConfigServers(servers, BRIDGE_CONFIG, "bridge", "", docsMap);

  // 4. Auto-scan Python MCP servers
  scanPythonServers(servers, docsMap);

  // 5. Discover Claude plugin mcp_config.json files
  try {
    const { stdout } = await execAsync(
      'find /root/.claude -name "mcp_config.json" 2>/dev/null'
    );
    const lines = stdout.split("\n").filter(Boolean);
    for (const line of lines) {
      const config = loadJsonConfig(line);
      if (!config || !config.mcpServers) continue;
      for (const [name, entry] of Object.entries(config.mcpServers)) {
        addServer(servers, name, entry, "discovered", "", docsMap?.[name]);
      }
    }
  } catch (e) {
    console.warn("Failed to scan Claude mcp_config.json files:", e);
  }

  return servers.sort((a, b) => a.name.localeCompare(b.name));
}

function extractJson(output: string) {
  let jsonStr = output;
  const firstBrace = output.indexOf("{");
  const firstBracket = output.indexOf("[");
  const firstChar =
    firstBrace !== -1 && firstBracket !== -1
      ? Math.min(firstBrace, firstBracket)
      : Math.max(firstBrace, firstBracket);
  if (firstChar !== -1) {
    const isObject = output[firstChar] === "{";
    const lastChar = isObject
      ? output.lastIndexOf("}")
      : output.lastIndexOf("]");
    if (lastChar !== -1 && lastChar > firstChar) {
      jsonStr = output.substring(firstChar, lastChar + 1);
    }
  }
  return JSON.parse(jsonStr);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    const servers = await discoverServers();
    return jsonResponse({ status: "ok", servers });
  } catch (error: any) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseErr: any) {
      console.error("MCP POST body parse error:", parseErr.message, "Raw:", rawBody);
      return jsonResponse(
        { error: `Invalid JSON body: ${parseErr.message}` },
        { status: 400 }
      );
    }
    const {
      action,
      name,
      command,
      args,
      env,
      cwd,
      toolName,
      toolArgs,
    } = body;

    let targetCommand = command;
    let targetArgs: string[] = Array.isArray(args) ? args : [];
    let targetEnv: Record<string, string> | undefined = env;
    let targetCwd: string | undefined = cwd;

    // New style: look up server by name from discovered configs
    if (name && typeof name === "string") {
      const servers = await discoverServers();
      const server = servers.find((s) => s.name === name);
      if (!server) {
        return jsonResponse(
          { error: `Server "${name}" not found` },
          { status: 404 }
        );
      }
      targetCommand = server.command;
      targetArgs = server.args;
      targetEnv = server.env;
      targetCwd = server.cwd;
    }

    if (!targetCommand || typeof targetCommand !== "string") {
      return jsonResponse(
        { error: "Missing or invalid command" },
        { status: 400 }
      );
    }

    if (action === "tools") {
      const fullCmd = [targetCommand, ...targetArgs].join(" ");
      const cmdStr = `npx -y mcporter list --stdio "${fullCmd.replace(
        /"/g,
        '\\"'
      )}" --json`;

      const { stdout } = await execAsync(cmdStr, {
        maxBuffer: 1024 * 1024 * 10,
        env: { ...process.env, ...targetEnv },
        cwd: targetCwd,
      });
      const data = extractJson(stdout);

      return jsonResponse({
        status: "ok",
        tools: data.tools || [],
      });
    }

    if (action === "call") {
      const fullCmd = [targetCommand, ...targetArgs].join(" ");
      const argsJson = JSON.stringify(toolArgs || {});
      const cmdStr = `npx -y mcporter call --stdio "${fullCmd.replace(
        /"/g,
        '\\"'
      )}" ${toolName} --args '${argsJson.replace(/'/g, "'\\''")}' --output json`;

      const { stdout } = await execAsync(cmdStr, {
        maxBuffer: 1024 * 1024 * 10,
        env: { ...process.env, ...targetEnv },
        cwd: targetCwd,
      });
      const data = extractJson(stdout);

      return jsonResponse({
        status: "ok",
        result: data,
      });
    }

    return jsonResponse({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("MCP action error:", error);
    return jsonResponse(
      { error: error.message || "Execution error" },
      { status: 500 }
    );
  }
}
