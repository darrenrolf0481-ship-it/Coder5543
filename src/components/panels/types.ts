export type DebugAnalysis = {
  static: { status: 'idle' | 'running' | 'done'; issues: { type: 'error' | 'warning' | 'info'; message: string; line?: number }[] };
  tracing: { status: 'idle' | 'running' | 'done'; logs: string[] };
  refactoring: { status: 'idle' | 'running' | 'done'; suggestions: string[] };
};

export type { SwarmAgent } from '../../services/swarm/types';

export type SwarmLog = { id: number; type: 'consensus' | 'pain' | 'info'; message: string; time: string };

export type KnowledgePack = { id: number; name: string; size: string; status: string; progress?: number };

export type ChatMessage = { role: 'user' | 'ai'; text: string; type?: 'text' | 'image'; url?: string; timestamp: number };
