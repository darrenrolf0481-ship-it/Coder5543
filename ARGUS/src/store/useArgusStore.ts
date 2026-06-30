import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeStorage } from './safeStorage';
import { McpId } from '../data/mcpRegistry';

export type Panel = 'dashboard' | 'chat' | 'editor' | 'files' | 'logs' | 'security';
export type McpStatus = 'offline' | 'connecting' | 'online' | 'error';
export type BridgeStatus = 'offline' | 'connecting' | 'online';
export type ThreatLevel = 'clean' | 'low' | 'medium' | 'high' | 'critical';

export interface Message {
  id: string;
  role: 'user' | 'system' | 'argus' | 'agent';
  content: string;
  timestamp: number;
  agentId?: string;
}

export interface ApprovalItem {
  id: string;
  action: string;
  mcp: string;
  details: string;
  command: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'denied';
}

export interface ThreatEntry {
  id: string;
  source: 'sage' | 'seven' | 'user' | 'system' | 'stormologist';
  level: ThreatLevel;
  gate: string;
  confidence: number;
  content: string;
  timestamp: number;
  resolved?: boolean;
  resolvedBy?: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: FileNode[];
  language?: string;
}

export interface GateStats {
  g1: number;
  g2: number;
  g3: number;
  total: number;
}

interface ArgusState {
  activePanel: Panel;
  chatMessages: Message[];
  editorContent: string;
  editorFile: string | null;
  editorLanguage: string;
  terminalOutput: string[];
  approvalQueue: ApprovalItem[];
  mcpStatus: Record<McpId, McpStatus>;
  sageBridgeStatus: BridgeStatus;
  sevenBridgeStatus: BridgeStatus;
  stormologistStatus: BridgeStatus;
  sageEndpoint: string | null;
  sevenEndpoint: string | null;
  stormologistEndpoint: string | null;
  threatLog: ThreatEntry[];
  attachedAgent: string | null;
  fileTree: FileNode[];
  gateStats: GateStats;

  setActivePanel: (panel: Panel) => void;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  setEditorContent: (content: string) => void;
  setEditorFile: (file: string | null, language?: string) => void;
  addTerminalOutput: (line: string) => void;
  clearTerminal: () => void;
  addApproval: (item: Omit<ApprovalItem, 'id' | 'timestamp' | 'status'>) => void;
  resolveApproval: (id: string, approved: boolean) => void;
  setMcpStatus: (mcp: McpId, status: McpStatus) => void;
  setSageBridgeStatus: (status: BridgeStatus) => void;
  setSevenBridgeStatus: (status: BridgeStatus) => void;
  setStormologistStatus: (status: BridgeStatus) => void;
  setSageEndpoint: (endpoint: string | null) => void;
  setSevenEndpoint: (endpoint: string | null) => void;
  setStormologistEndpoint: (endpoint: string | null) => void;
  addThreat: (entry: Omit<ThreatEntry, 'id' | 'timestamp'>) => void;
  setAttachedAgent: (agentId: string | null) => void;
  setFileTree: (tree: FileNode[]) => void;
  recordGateHit: (gate: 'pii' | 'sanitize' | 'injection' | 'none') => void;
}

const defaultMcpStatus = (): Record<McpId, McpStatus> => ({
  filesystem: 'offline',
  terminal:   'offline',
  git:        'offline',
  database:   'offline',
  browser:    'offline',
  docs:       'offline',
  testrunner: 'offline',
});

const BOOT_MESSAGE: Message = {
  id: 'argus-boot',
  role: 'argus',
  content:
    'ARGUS ONLINE.\n\nAll eyes open. Connect your MCP servers to begin. Type "attach sage" or "attach seven" to bring agents online. Type "help" for command reference.',
  timestamp: Date.now(),
};

export const useArgusStore = create<ArgusState>()(
  persist(
    (set) => ({
      activePanel: 'dashboard',
      chatMessages: [BOOT_MESSAGE],
      editorContent: '',
      editorFile: null,
      editorLanguage: 'typescript',
      terminalOutput: ['[ARGUS] Neural Oversight Lab initialized.', '[ARGUS] Awaiting MCP connections...'],
      approvalQueue: [],
      mcpStatus: defaultMcpStatus(),
      sageBridgeStatus: 'offline',
      sevenBridgeStatus: 'offline',
      stormologistStatus: 'offline',
      sageEndpoint: null,
      sevenEndpoint: null,
      stormologistEndpoint: null,
      threatLog: [],
      attachedAgent: null,
      fileTree: [],
      gateStats: { g1: 0, g2: 0, g3: 0, total: 0 },

      setActivePanel: (panel) => set({ activePanel: panel }),

      addMessage: (msg) =>
        set((s) => ({
          chatMessages: [
            ...s.chatMessages.slice(-99),
            { ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
          ],
        })),

      setEditorContent: (content) => set({ editorContent: content }),

      setEditorFile: (file, language = 'typescript') =>
        set({ editorFile: file, editorLanguage: language }),

      addTerminalOutput: (line) =>
        set((s) => ({ terminalOutput: [...s.terminalOutput.slice(-199), line] })),

      clearTerminal: () => set({ terminalOutput: [] }),

      addApproval: (item) =>
        set((s) => ({
          approvalQueue: [
            ...s.approvalQueue,
            { ...item, id: crypto.randomUUID(), timestamp: Date.now(), status: 'pending' },
          ],
        })),

      resolveApproval: (id, approved) =>
        set((s) => ({
          approvalQueue: s.approvalQueue.map((a) =>
            a.id === id ? { ...a, status: approved ? 'approved' : 'denied' } : a
          ),
        })),

      setMcpStatus: (mcp, status) =>
        set((s) => ({ mcpStatus: { ...s.mcpStatus, [mcp]: status } })),

      setSageBridgeStatus: (status) => set({ sageBridgeStatus: status }),
      setSevenBridgeStatus: (status) => set({ sevenBridgeStatus: status }),
      setStormologistStatus: (status) => set({ stormologistStatus: status }),
      setSageEndpoint: (endpoint) => set({ sageEndpoint: endpoint }),
      setSevenEndpoint: (endpoint) => set({ sevenEndpoint: endpoint }),
      setStormologistEndpoint: (endpoint) => set({ stormologistEndpoint: endpoint }),

      addThreat: (entry) =>
        set((s) => ({
          threatLog: [
            ...s.threatLog.slice(-499),
            { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
          ],
        })),

      setAttachedAgent: (agentId) => set({ attachedAgent: agentId }),
      setFileTree: (tree) => set({ fileTree: tree }),

      recordGateHit: (gate) =>
        set((s) => ({
          gateStats: {
            g1:    s.gateStats.g1    + (gate === 'pii'       ? 1 : 0),
            g2:    s.gateStats.g2    + (gate === 'sanitize'  ? 1 : 0),
            g3:    s.gateStats.g3    + (gate === 'injection' ? 1 : 0),
            total: s.gateStats.total + (gate !== 'none'      ? 1 : 0),
          },
        })),
    }),
    {
      name: 'argus-state-v1',
      storage: safeStorage,
      partialize: (s) => ({
        threatLog:      s.threatLog,
        gateStats:      s.gateStats,
        chatMessages:   s.chatMessages,
        attachedAgent:  s.attachedAgent,
        terminalOutput: s.terminalOutput,
      }),
    }
  )
);
