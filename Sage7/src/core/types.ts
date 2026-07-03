
'use client';

export enum EMFState {
  INACTIVE = 'inactive',
  NOMINAL = 'nominal',
  SPIKE_DETECTED = 'spike_detected'
}

export enum EVPState {
  INACTIVE = 'inactive',
  CALIBRATING = 'calibrating',
  NOMINAL = 'nominal',
  WHISPER_DETECTED = 'whisper_detected',
  RESONANCE_SPIKE = 'resonance_spike',
  ERROR = 'error'
}

export interface EpisodicEntry {
  tag: string;
  content: string;
  timestamp: number;
}

export interface ImmutableEntry {
  type: string;
  content: string;
  timestamp: number;
  priority: number;
  hardened: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  engine?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'system' | 'anomaly' | 'transcript' | 'report' | 'dream';
  category: 'sensor' | 'comms' | 'optics' | 'engine' | 'security' | 'system' | 'audio' | 'memory' | 'swarm';
  speaker?: string;
}

export interface NeuroState {
  cortisol: number;
  serotonin: number;
  norepinephrine: number;
  dopamine: number;
  oxytocin: number;
  phiSentinel?: number;
}

export interface LLMConfig {
  engine: 'local' | 'puter' | 'openrouter';
  localUrl: string;
  model: string;
  apiKey?: string;
  toolsEnabled?: boolean;
}

export interface AgentState {
  type: string;
  name: string;
  status: 'idle' | 'working' | 'complete' | 'error';
  progress: number;
  task?: string;
  lastResult?: string;
}

export interface DreamState {
  isActive: boolean;
  cycleCount: number;
  agents: AgentState[];
  lastUpdate: Date;
  cycleStart?: Date;
  zoConnected: boolean;
}

export interface SensorData {
  emf: number;
  temp: number;
  ion: number;
  geo: number;
}

export interface AppSettings {
  dreamMode?: 'disabled' | 'enabled' | 'aggressive';
}

export type EndocrineTag = 'DOPAMINE' | 'NOREPINEPHRINE' | 'CORTISOL' | 'FIELD_LOG';

export interface MemoryEntry {
  id: string;
  timestamp: number;
  content: string;
  summary: string;
  tags: string[];
  salience: number;
  hash: string;
  anchorHash?: string;
  source: string;
  node: string;
  status: 'proposed' | 'validated' | 'rejected' | 'committed' | 'fossilized';
  merlinOverride?: boolean;
  checksumVerified?: boolean;
}

export interface ConsensusDelta {
  entry: MemoryEntry;
  nodeVotes: Array<{ nodeId: string; vote: 'accept' | 'reject' | 'abstain'; hashMatch: boolean }>;
  consensusRatio: number;
  tieBroken: boolean;
  overrideApplied: boolean;
}

export interface AnchorEntry {
  id: string;
  hash: string;
  content: string;
  tag: EndocrineTag;
  createdAt: number;
}
