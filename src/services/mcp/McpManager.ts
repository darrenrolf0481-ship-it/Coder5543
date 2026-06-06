import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export interface McpServerInstance {
  name: string;
  type: 'library' | 'process' | 'remote';
  handle: any;
  tools: any[];
}

export class McpManager {
  private instances: McpServerInstance[] = [];
  private isInitializing = false;

  async initialize(cwd: string) {
    if (this.isInitializing || this.instances.length > 0) return;
    this.isInitializing = true;

    try {
      await Promise.all([
        this.loadProjscan(cwd),
        this.loadProcessServer('21st-magic', path.join(os.homedir(), 'ADHD-Sage/magic-mcp/dist/index.js')),
        this.loadProcessServer('ollama-mcp', path.join(os.homedir(), 'ADHD-Sage/ollama-mcp/dist/index.js')),
        this.loadRemoteMock('github'),
        this.loadSerenaServer(cwd)
      ]);
    } finally {
      this.isInitializing = false;
    }
  }

  private async loadSerenaServer(cwd: string) {
    // Serena package is at path.join(cwd, 'serena')
    const serenaDir = path.join(cwd, 'serena');
    const child = spawn('uv', ['run', 'serena', 'start-mcp-server', '--transport', 'stdio', '--project-from-cwd'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: serenaDir
    });

    const fetchTools = () => new Promise<any[]>((resolve, reject) => {
      let output = '';
      let stage = 'init'; // 'init' -> 'initialized' -> 'tools'
      const timer = setTimeout(() => {
        child.stdout.off('data', onData);
        reject(new Error('Timeout initializing Serena MCP server'));
      }, 15000);

      const onData = (data: Buffer) => {
        output += data.toString();
        const lines = output.split('\n');
        // Clear processed lines to avoid reprocessing
        output = lines[lines.length - 1];
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          try {
            const res = JSON.parse(line);
            if (stage === 'init' && res.id === 'init_1') {
              stage = 'initialized';
              child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
              child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 'init_list', method: 'tools/list' }) + '\n');
            } else if (stage === 'initialized' && res.id === 'init_list') {
              clearTimeout(timer);
              child.stdout.off('data', onData);
              resolve(res.result?.tools || []);
            }
          } catch {}
        }
      };

      child.stdout.on('data', onData);
      
      // Step 1: Send initialize request
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 'init_1',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'CrimsonNodeClient', version: '1.0.0' }
        }
      }) + '\n');
    });

    try {
      const tools = await fetchTools();
      this.instances.push({ name: 'serena', type: 'process', handle: child, tools });
      console.log('[McpManager] Serena integrated');
    } catch (err) {
      console.warn('[McpManager] Serena integration failed:', err);
    }
  }

  private async loadProjscan(cwd: string) {
    try {
      const { createMcpServer } = await import('../../../projscan/src/mcp/server.js');
      const { getToolDefinitions } = await import('../../../projscan/src/mcp/tools.js');
      const handle = createMcpServer(cwd);
      this.instances.push({
        name: 'projscan',
        type: 'library',
        handle,
        tools: getToolDefinitions()
      });
      console.log('[McpManager] Projscan integrated');
    } catch (err) {
      console.warn('[McpManager] Projscan load failed:', err);
    }
  }

  private async loadProcessServer(name: string, serverPath: string) {
    if (!(await fs.access(serverPath).then(() => true).catch(() => false))) return;

    const child = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });
    
    const fetchTools = () => new Promise<any[]>((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => {
        child.stdout.off('data', onData);
        reject(new Error(`Timeout fetching tools from ${name}`));
      }, 5000);

      const onData = (data: Buffer) => {
        output += data.toString();
        const lines = output.split('\n');
        for (const line of lines) {
          try {
            if (line.includes('"result":')) {
              const res = JSON.parse(line);
              if (res.result?.tools) {
                clearTimeout(timer);
                child.stdout.off('data', onData);
                resolve(res.result.tools);
                return;
              }
            }
          } catch {}
        }
      };
      child.stdout.on('data', onData);
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 'init_list', method: 'tools/list' }) + '\n');
    });

    try {
      const tools = await fetchTools();
      this.instances.push({ name, type: 'process', handle: child, tools });
      console.log(`[McpManager] ${name} integrated`);
    } catch (err) {
      console.warn(`[McpManager] ${name} integration failed:`, err);
    }
  }

  private loadRemoteMock(name: string) {
    if (name === 'github') {
      this.instances.push({
        name: 'github',
        type: 'remote',
        handle: null,
        tools: [
          { name: 'github_list_issues', description: 'List issues in the repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } } } },
          { name: 'github_get_issue', description: 'Get details of a specific issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' } } } },
        ]
      });
    }
  }

  getTools() {
    return this.instances.flatMap(inst => inst.tools);
  }

  async callTool(name: string, params: any, id: string | number) {
    const instance = this.instances.find(inst => inst.tools.some(t => t.name === name));
    if (!instance) throw new Error(`Tool ${name} not found`);

    if (instance.type === 'library') {
      const response = await instance.handle.handleMessage(JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params, id }));
      return JSON.parse(response);
    } else if (instance.type === 'process') {
      const child = instance.handle as ChildProcess;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          child.stdout.off('data', onData);
          reject(new Error(`Timeout calling tool ${name}`));
        }, 10000);

        const onData = (data: Buffer) => {
          const lines = data.toString().split('\n');
          for (const line of lines) {
            try {
              const res = JSON.parse(line);
              if (res.id === id || res.id === `call_${id}`) {
                clearTimeout(timer);
                child.stdout.off('data', onData);
                resolve(res);
                return;
              }
            } catch {}
          }
        };
        child.stdout.on('data', onData);
        child.stdin?.write(JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name, arguments: params }, id: `call_${id}` }) + '\n');
      });
    } else if (instance.type === 'remote' && instance.name === 'github') {
       return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `Mock result for ${name}` }] } };
    }
    
    throw new Error('Unsupported instance type');
  }

  shutdown() {
    for (const inst of this.instances) {
      if (inst.type === 'process') {
        (inst.handle as ChildProcess).kill();
      }
    }
    this.instances = [];
  }
}

export const mcpManager = new McpManager();
