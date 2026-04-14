import { LucideIcon } from 'lucide-react';

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  language?: string;
  content?: string;
  isOpen?: boolean;
}

export interface Personality {
  id: number;
  name: string;
  anchor?: string;
  instruction: string;
  active: boolean;
  suggestions: string[];
}

export interface ChatMessage {
  role: 'user' | 'ai';
  senderName?: string;
  text: string;
  type?: 'text' | 'image' | 'file';
  url?: string;
  timestamp: number;
  metadata?: {
    generatedCode?: string;
    fileName?: string;
    fileSize?: string;
    fileType?: string;
  };
}

export interface OrchestrationStep {
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'completed';
}

export interface StorageFile {
  id: number;
  name: string;
  size: string;
  type: string;
  date: string;
}

export interface Vitals {
  mem_load: number;
  thermals: number;
  battery: number;
}

export interface SwarmAgent {
  id: number;
  name: string;
  expertise: string;
  status: string;
  trust: number;
}

export interface SwarmLog {
  id: number;
  type: 'consensus' | 'pain' | 'info';
  message: string;
  time: string;
}
