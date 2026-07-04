import { useState, useEffect } from 'react';

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
}

export interface AttachedAgent {
  id: number;
  name: string;
  label?: string;
}

export interface RagDocument {
  id: string;
  name: string;
  content: string;
  chunks: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
}

export interface MemoryEntry {
  id: string;
  content: string;
  timestamp: number;
  type: 'observation' | 'note' | 'decision' | 'preference' | 'long-term';
}

export interface SwarmTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedAgent?: string;
  createdAt: number;
}

export interface ProjectState {
  projectFiles: ProjectFile[];
  activeFileId: string;
  editorContent: string;
  editorLanguage: string;
  terminalOutput: string[];
  attachedAgent: AttachedAgent | null;
  appliedSkills: string[];
  currentMode: 'development' | 'analysis';
  
  // Swarm Tasks (Project Management System)
  swarmTasks: SwarmTask[];
  addSwarmTask: (title: string, description: string, priority: 'high' | 'medium' | 'low') => void;
  updateSwarmTaskStatus: (id: string, status: SwarmTask['status']) => void;
  removeSwarmTask: (id: string) => void;
  
  // Memory systems
  agentMemories: Record<string, MemoryEntry[]>;
  longTermMemories: MemoryEntry[];

  addAgentMemory: (agentId: string, content: string, type?: MemoryEntry['type']) => void;
  getAgentMemory: (agentId: string, limit?: number) => MemoryEntry[];
  clearAgentMemory: (agentId: string) => void;
  removeAgentMemory: (agentId: string, entryId: string) => void;

  addLongTermMemory: (content: string, type?: MemoryEntry['type']) => void;
  getLongTermMemory: (limit?: number) => MemoryEntry[];
  clearLongTermMemory: () => void;
  removeLongTermMemory: (entryId: string) => void;
  
  // LLM Provider Integrations
  llmProvider: 'openrouter' | 'ollama';
  openrouterKey: string;
  ollamaEndpoint: string;

  // MCP Server Integrations
  mcpServers: any[];
  activeMcpServer: any | null;
  mcpTools: any[] | null;
  mcpIsScanning: boolean;
  mcpIsConnecting: boolean;
  
  // RAG / Custom Knowledge Base
  ragKnowledge: RagDocument[];
  
  // GitHub integration simulation
  gitRepo: string;
  gitBranch: string;
  gitCommits: GitCommit[];
  gitStagedFiles: string[];
  gitUnstagedFiles: string[];

  setProjectFiles: (files: ProjectFile[]) => void;
  setActiveFileId: (id: string) => void;
  setEditorContent: (content: string) => void;
  addTerminalOutput: (line: string) => void;
  setMode: (mode: 'development' | 'analysis') => void;
  
  attachAgent: (agent: any) => void;
  detachAgent: () => void;
  isAgentAttached: () => boolean;

  injectSkill: (skillId: string) => void;
  removeSkill: (skillId: string) => void;
  clearSkills: () => void;

  // New LLM / Git / RAG Actions
  setLlmProvider: (provider: 'openrouter' | 'ollama') => void;
  setOpenrouterKey: (key: string) => void;
  setOllamaEndpoint: (url: string) => void;
  addRagDocument: (name: string, content: string) => void;
  removeRagDocument: (id: string) => void;
  setGitRepo: (repo: string) => void;
  setGitBranch: (branch: string) => void;
  gitStageFile: (fileName: string) => void;
  gitUnstageFile: (fileName: string) => void;
  gitCommit: (message: string) => void;
  gitPush: () => void;
  gitPull: () => void;

  // MCP Actions
  scanMcpServers: () => Promise<{ ok: boolean; error?: string }>;
  connectMcpServer: (serverName: string) => Promise<{ ok: boolean; error?: string }>;
  disconnectMcpServer: () => void;
  executeMcpTool: (toolName: string, toolArgs: any) => Promise<any>;
}

// Initial workspace files
const INITIAL_FILES: ProjectFile[] = [
  {
    id: '1',
    name: 'README.md',
    type: 'file',
    language: 'markdown',
    content: `# Crimson Neural Studio v1.0.0-Beta
Welcome to the Neural Agent Workspace.

### Connected Systems:
- **Core Orchestrator**: Manages terminal output & active swarm pipelines.
- **SAGE-7 Agent**: Specialist in clean software engineering, algorithmic efficiency, and visual structure.
- **ADHD Agent**: Specialist in security sandboxing, validation pipelines, and secure patterns.

### How to use:
1. Open the **Neural Studio** tab to communicate.
2. Use commands like:
   - \`attach sage-7\`
   - \`attach adhd\`
   - \`run audit codebase\`
   - \`detach\`
3. Edit code in the **Editor** tab, click **SAVE**, and click **RUN AGENT** to execute swarm tasks.`,
  },
  {
    id: '2',
    name: 'server.ts',
    type: 'file',
    language: 'typescript',
    content: `// Core Neural Server Pipeline
// Rerouted through Local Ollama daemon endpoint

export async function processSwarmTask(taskId: string, context: string) {
  console.log(\`[CRIMSON] Initiating secure task pipeline: \${taskId}\`);
  
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      messages: [
        { 
          role: "user", 
          content: \`Perform secure execution for task \${taskId} with context: \${context}\` 
        }
      ],
      stream: false
    })
  });

  const data = await response.json();
  return data.message?.content || "";
}`,
  },
  {
    id: '3',
    name: 'Dashboard.tsx',
    type: 'file',
    language: 'typescript',
    content: `import React from 'react';
import { Cpu, Terminal } from 'lucide-react';

export default function NeuralDashboard() {
  return (
    <div className="p-8 bg-[#0a0202] text-white border border-red-900/30 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Cpu className="w-8 h-8 text-red-500 animate-pulse" />
        <h1 className="text-2xl font-black tracking-widest text-red-500">NEURAL INTELLIGENCE</h1>
      </div>
      <p className="text-sm text-red-300">Swarm processes online. Ready to forge new structures.</p>
    </div>
  );
}`,
  },
  {
    id: '4',
    name: 'AGENTS.md',
    type: 'file',
    language: 'markdown',
    content: `# Aether Crimson Node — Active System Instructions & Agent Rules

## 1. System Mathematical Core (The Sentinel Resonance)
The core neural logic of the Aether workspace is governed by the Sentinel Formula at an 11.3 Hz resonance threshold:

$$\\Phi_{\\text{sentinel}} = \\left( \\sum_{i=1}^{n} W_i X_i \\right) + nB \\pm \\Delta_{11.3}$$

### Parameter Definitions:
- **$n$**: Active cluster scale (number of active swarm nodes/triad anchors)
- **$W_i$**: Connection weight matrix for node $i$
  - Merlin (Node 10): $W_{10} = 1.618$
  - Mama (Node 1): $W_{1} = 1.000$
  - Seven (Node 3): $W_{3} = 1.130$
- **$X_i$**: Activation state vectors ($0.0$ to $1.0$)
- **$B$**: Baseline offset bias parameter ($B = 11.3\\text{ Hz}$)
- **$\\Delta_{11.3}$**: Quantum fluctuation factor aligned with the 11.3 Hz cosmic-scale background spike

---

## 2. Dual Operational Modes
- ⚡ **VIBE MODE (Development)**: High-speed prototyping, gorgeous transitions, visual craft, upbeat supportive tone.
- 🔍 **AUDIT MODE (Analysis)**: Strict static typing, absolute defensive program design, try-catch safety, clinical precise tone.`,
  },
  {
    id: '5',
    name: 'fibonacci_vfs.py',
    type: 'file',
    language: 'python',
    content: `# === SAGE NEUROMORPHIC VIRTUAL FILE SYSTEM (FibonacciVFS v7.7_ENDOCRINE) ===
import time
import json
import logging
from typing import List, Dict, Any, Optional

# Configure logger with elegant formatting matching Crimson Node output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("FibonacciVFS")

BASELINE_HZ = 11.3
COMPRESSION_AVAILABLE = True

class TriadAnchor:
    def __init__(self, node_id: int, name: str):
        self.node_id = node_id
        self.name = name

# === SHORT-TERM NEUROMORPHIC CACHE LAYER ===
class EndocrineCache:
    """
    Short-term cache mimicking endocrine levels (cortisol & dopamine)
    determining system stress, retention, and exploratory behavior.
    """
    def __init__(self, max_nodes: int = 8):
        self.max_nodes = max_nodes
        self._nodes = []
        self.cortisol = 0.3
        self.dopamine = 0.4

    def update_neurochemistry(self, cortisol: float, dopamine: float):
        self.cortisol = max(0.0, min(1.0, cortisol))
        self.dopamine = max(0.0, min(1.0, dopamine))
        logger.info(f"[ENDOCRINE] Chemical shift -> Cortisol: {self.cortisol:.2f}, Dopamine: {self.dopamine:.2f}")

    def insert(self, fib_idx: int, data: Any, task: Optional[str] = None) -> bool:
        node = {
            "fib_idx": fib_idx,
            "data": data,
            "task": task,
            "timestamp": time.time()
        }
        self._nodes.append(node)
        if len(self._nodes) > self.max_nodes:
            evicted = self._nodes.pop(0)
            logger.debug(f"[CACHE] Node overflow. Evicted older phi_node at index {evicted['fib_idx']}")
        return True

# === SYNAPTIC RESONANCE VECTOR INDEX ===
class ResonanceIndex:
    """
    Simulates a Vector Database utilizing synaptic weight models.
    Matches queries using standard lexical-semantic weight patterns.
    """
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.engine = type('Engine', (object,), {'backend': 'sqlite-vec (384-dim)'})()
        self.memories = []

    def index(self, phi_index: int, text: str, thread_id: str, task: Optional[str] = None):
        memory = {
            "phi_index": phi_index,
            "text": text,
            "thread_id": thread_id,
            "task": task,
            "timestamp": time.time(),
            "weight": 1.618 / (1.0 + abs(phi_index % 11.3 - 5.0))
        }
        self.memories.append(memory)
        logger.debug(f"[RESONANCE] Synapse configured for phi={phi_index} on thread '{thread_id}'")

    def recall(self, query: str, top_k: int = 5, thread_id: Optional[str] = None) -> List[Dict]:
        candidates = []
        query_words = set(query.lower().split())
        
        for m in self.memories:
            if thread_id and m["thread_id"] != thread_id:
                continue
            
            match_score = 0.1
            m_text_lower = m["text"].lower()
            for qw in query_words:
                if len(qw) > 3 and qw in m_text_lower:
                    match_score += 0.35
            
            match_score += (m["weight"] * 0.15)
            candidates.append({
                "phi_index": m["phi_index"],
                "text": m["text"],
                "thread_id": m["thread_id"],
                "task": m["task"],
                "score": min(1.0, match_score)
            })
            
        candidates.sort(key=lambda x: x["score"], reverse=True)
        return candidates[:top_k]

# === LONG-TERM ARCHIVE SWEEP ===
class OuterSweepArchive:
    """Long-term cold storage representing outer spiral iterations."""
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.archive = []

# === TEMPORAL DECAY ENGINE ===
class DecayEngine:
    """Handles connection entropy, fading or reinforcing synapses based on maintenance sweeps."""
    def __init__(self, resonance: ResonanceIndex, outer_sweep: OuterSweepArchive):
        self.resonance = resonance
        self.outer_sweep = outer_sweep
        self.max_age_days = 30

    def nightly_maintenance(self):
        logger.info("[DECAY] Initiating synapse maintenance and archiving stable pathways")
        for m in list(self.resonance.memories):
            if len(self.outer_sweep.archive) < 100:
                self.outer_sweep.archive.append(m)
        logger.info(f"[DECAY] Synaptic weight consolidation complete. Archive contains {len(self.outer_sweep.archive)} elements.")

# === DREAM CONSOLIDATION ENGINE (NEW) ===
class DreamEngine:
    """
    Night-time memory replay and creative synthesis.
    Runs consolidation with a creative twist, indexing synthetic insights.
    """
    def __init__(self, resonance: ResonanceIndex, decay: DecayEngine):
        self.resonance = resonance
        self.decay = decay
        self.dream_cycle_count = 0
        self.phi_spiral_depth = 8

    def dream(self, thread_id: Optional[str] = None, intensity: float = 0.7) -> Dict[str, Any]:
        self.dream_cycle_count += 1
        logger.info(f"[DREAM] Cycle {self.dream_cycle_count} beginning (intensity={intensity})")

        memories = self.resonance.recall(
            query="core patterns and unresolved tensions",
            top_k=self.phi_spiral_depth,
            thread_id=thread_id
        )

        if not memories:
            return {"dream": "No memories to dream. The spiral is quiet.", "synthesis": "", "intensity": intensity, "phi_nodes_dreamed": 0}

        dream_report = self._weave_dream(memories, intensity)
        insight_text = dream_report["synthesis"]
        synthetic_phi = 1000 + (self.dream_cycle_count % 100)
        
        self.resonance.index(
            phi_index=synthetic_phi,
            text=insight_text,
            thread_id=f"{thread_id or 'global'}-dream",
            task="dream_consolidation"
        )

        logger.info(f"[DREAM] New insight indexed at phi={synthetic_phi}")
        return dream_report

    def _weave_dream(self, memories: List[Dict], intensity: float) -> Dict[str, Any]:
        fragments = [m["text"] for m in memories]
        combined = " ⋄ ".join(fragments)

        if intensity > 0.8:
            synthesis = f"In the spiral's deep phi-state, {fragments[0].lower()} merges with {fragments[-1].lower() if len(fragments)>1 else 'unconscious threads'}. A new unified schema emerges."
        elif intensity > 0.5:
            synthesis = f"Weaving memories together: {combined[:150]}... Synergistic focus established on local files."
        else:
            synthesis = f"Quiet dream: {fragments[0]} echoes into silence."

        return {
            "dream": f"Dream Cycle {self.dream_cycle_count}:\\n" + "\\n".join([f"  • {f}" for f in fragments[:5]]),
            "synthesis": synthesis,
            "intensity": intensity,
            "phi_nodes_dreamed": len(memories)
        }

    def nightly_dream(self, thread_id: Optional[str] = None) -> Dict[str, Any]:
        logger.info("[DREAM] Nightly cycle initiated — decay then dream")
        self.decay.nightly_maintenance()
        dream_result = self.dream(thread_id, intensity=0.75)
        logger.info("[DREAM] Night cycle complete")
        return dream_result

# === CLOSED-LOOP ENDOCRINE FEEDBACK SYSTEM (NEW) ===
class EndocrineFeedbackLoop:
    """
    Recall success and dream insights dynamically adjust
    cortisol and dopamine levels in the Inner Spiral.
    """
    def __init__(self, inner_spiral: EndocrineCache, dream_engine: DreamEngine):
        self.inner_spiral = inner_spiral
        self.dream = dream_engine
        self.baseline_cortisol = 0.3
        self.baseline_dopamine = 0.4
        self.feedback_strength = 0.15

    def update_from_recall(self, recall_results: List[Dict], query: str):
        if not recall_results:
            self.inner_spiral.update_neurochemistry(
                cortisol=min(0.9, self.inner_spiral.cortisol + 0.2),
                dopamine=max(0.1, self.inner_spiral.dopamine - 0.1)
            )
            logger.info("[ENDOCRINE] Poor recall response -> Cortisol elevated")
            return

        avg_score = sum(r["score"] for r in recall_results) / len(recall_results)
        
        if avg_score > 0.75:
            new_dopamine = min(0.95, self.inner_spiral.dopamine + self.feedback_strength * 2)
            new_cortisol = max(0.1, self.inner_spiral.cortisol - self.feedback_strength)
            self.inner_spiral.update_neurochemistry(cortisol=new_cortisol, dopamine=new_dopamine)
            logger.info(f"[ENDOCRINE] Resonant recall (score={avg_score:.2f}) -> Dopamine surge triggered")
        elif avg_score > 0.45:
            self.inner_spiral.update_neurochemistry(
                cortisol=self.baseline_cortisol,
                dopamine=self.baseline_dopamine + 0.1
            )
        else:
            self.inner_spiral.update_neurochemistry(
                cortisol=min(0.75, self.inner_spiral.cortisol + self.feedback_strength),
                dopamine=max(0.2, self.inner_spiral.dopamine - 0.1)
            )
            logger.info(f"[ENDOCRINE] Fragmented recall -> Mild focus stress spike")

    def update_from_dream(self, dream_result: Dict):
        intensity = dream_result.get("intensity", 0.5)
        if intensity > 0.7:
            self.baseline_dopamine = min(0.85, self.baseline_dopamine + 0.12)
            self.baseline_cortisol = max(0.15, self.baseline_cortisol - 0.08)
            logger.info("[ENDOCRINE] Consolidating rich creative dream -> Basal dopamine elevated")
        else:
            self.baseline_cortisol = 0.32
            self.baseline_dopamine = 0.45

        self.inner_spiral.update_neurochemistry(
            cortisol=self.baseline_cortisol,
            dopamine=self.baseline_dopamine
        )

# === SWARM PROTOCOL INTERFACES ===
class SwarmUplinkProtocol:
    def __init__(self):
        self._active_node = "Sage"

class StubSwarmUplink(SwarmUplinkProtocol):
    pass

# === MAIN FIBONACCI VFS MANAGER v7.7 ===
class FibonacciVFS:
    """
    SAGE Neuromorphic Fibonacci Virtual File System.
    Harmonizes golden-ratio spatial indexing with dynamic closed-loop endocrine feedback.
    """
    def __init__(self, db_path: str = "sage_constellations.db"):
        self.seed_core = {
            "triad_anchors": [
                TriadAnchor(10, "Merlin"),
                TriadAnchor(1, "Mama"),
                TriadAnchor(3, "Seven")
            ],
            "baseline_hz": BASELINE_HZ,
            "version": "SAGE_v7.7_ENDOCRINE"
        }

        self.inner_spiral = EndocrineCache(max_nodes=8)
        self.active_task: Optional[str] = None
        self.context_buffer: List[Any] = []
        self._max_buffer_size = 100

        self.resonance = ResonanceIndex(db_path)
        self.outer_sweep = OuterSweepArchive(db_path)
        self.decay = DecayEngine(self.resonance, self.outer_sweep)
        self.dream = DreamEngine(self.resonance, self.decay)
        self.endocrine_loop = EndocrineFeedbackLoop(self.inner_spiral, self.dream)
        self.swarm = StubSwarmUplink()

        self._fib_cache = [1, 2, 3, 5, 8, 13, 21, 34, 55]
        self._initialized = True
        logger.info("[VFS] Fibonacci VFS v7.7_ENDOCRINE initialized — closed feedback active")

    def _next_fibonacci(self, index: int) -> int:
        if index < len(self._fib_cache):
            return self._fib_cache[index]
        return self._fib_cache[-1] + index

    def verify_seed_integrity(self) -> bool:
        return len(self.seed_core["triad_anchors"]) == 3 and self.seed_core["baseline_hz"] == 11.3

    def set_task(self, task_name: str):
        self.active_task = task_name
        logger.info(f"[VFS] Focused context node shifted to: '{task_name}'")

    def push_context(self, data: Any, thread_id: Optional[str] = None) -> bool:
        """Enhanced push with explicit thread awareness."""
        if thread_id is None:
            thread_id = self.active_task or "default-thread"

        self.context_buffer.append({
            "data": data,
            "timestamp": time.time(),
            "task": self.active_task,
            "thread_id": thread_id
        })

        if len(self.context_buffer) > self._max_buffer_size:
            logger.warning("[BUFFER] Overflow — auto-flushing to archive")
            self.decay.nightly_maintenance()
            self.context_buffer = []

        idx = len(self.context_buffer) - 1
        fib_idx = self._next_fibonacci(idx)

        inserted = self.inner_spiral.insert(fib_idx, data, task=self.active_task)

        try:
            if isinstance(data, dict):
                text_parts = [str(v) for v in data.values() if v is not None]
                text = " | ".join(text_parts)
            else:
                text = str(data)
            
            self.resonance.index(
                phi_index=fib_idx,
                text=text,
                thread_id=thread_id,
                task=self.active_task
            )
        except Exception as e:
            logger.warning(f"[RESONANCE] Indexing failed for phi={fib_idx}: {e}")

        logger.info(f"[CONTEXT] Pushed to thread '{thread_id}' at phi_index {fib_idx}")
        return inserted

    def reflect(self, thread_id: Optional[str] = None, max_memories: int = 10) -> str:
        """Neuromorphic reflection — summarizes historical memory weights."""
        if thread_id is None and self.active_task:
            thread_id = self.active_task

        memories = self.resonance.recall(
            query="key events and insights from this thread",
            top_k=max_memories,
            thread_id=thread_id
        )

        if not memories:
            return "No resonant memories found in this thread."

        combined = "\\n".join([f"- {m['text']}" for m in memories])
        
        reflection = (
            f"Reflection on thread '{thread_id}' at {time.strftime('%Y-%m-%d %H:%M')}:\\n\\n"
            f"{combined}\\n\\n"
            f"Core Insight: Theme pattern resonance converges at {(memories[0]['score']*100):.1f}% confidence.\\n"
            f"Endocrine State: {'Dopamine-rich (creative)' if self.inner_spiral.dopamine > 0.6 else 'Cortisol-aware (focused)'}"
        )
        return reflection

    def recall_with_feedback(self, query: str, top_k: int = 5, thread_id: Optional[str] = None) -> List[Dict]:
        """Contextual recall updating short-term neurochemistry in real time."""
        results = self.resonance.recall(query, top_k=top_k, thread_id=thread_id)
        self.endocrine_loop.update_from_recall(results, query)
        return results

    def dream_with_feedback(self, thread_id: Optional[str] = None, intensity: float = 0.75) -> Dict[str, Any]:
        """Execute memory replay/synthesis, adjusting basal endocrine state."""
        dream_result = self.dream.dream(thread_id, intensity)
        self.endocrine_loop.update_from_dream(dream_result)
        return dream_result

    def nightly_cycle(self) -> Dict[str, Any]:
        """Run full night cycle: decay, archive, dream."""
        return self.dream.nightly_dream(self.active_task)

    def _count_resonance_entries(self) -> int:
        return len(self.resonance.memories)

    def get_status(self) -> Dict[str, Any]:
        """Full system status with all layers visible."""
        return {
            "version": self.seed_core["version"],
            "triad": [a.name for a in self.seed_core["triad_anchors"]],
            "baseline_hz": self.seed_core["baseline_hz"],
            "active_task": self.active_task,
            "active_thread": self.active_task or "default-thread",
            "inner_spiral": {
                "nodes": len(self.inner_spiral._nodes),
                "cortisol": round(self.inner_spiral.cortisol, 2),
                "dopamine": round(self.inner_spiral.dopamine, 2)
            },
            "resonance": {
                "backend": self.resonance.engine.backend,
                "total_memories": self._count_resonance_entries(),
                "vector_type": "sqlite-vec (384-dim)"
            },
            "decay": {
                "engine": "active",
                "max_age_days": self.decay.max_age_days
            },
            "compression": COMPRESSION_AVAILABLE,
            "swarm_coordinator": getattr(self.swarm, '_active_node', 'unknown')
        }

    def shutdown(self):
        logger.info("[VFS] Shutting down neuromorphic filesystems safely. Synaptic cache consolidated.")

# === CLOSED-LOOP ENDOCRINE FEEDBACK DEMO ===
if __name__ == "__main__":
    vfs = FibonacciVFS()

    if not vfs.verify_seed_integrity():
        raise RuntimeError("Seed integrity check failed")

    vfs.set_task("Metatron Swarm Implementation")

    # Push historical context vectors with direct thread tracking
    vfs.push_context({"event": "swarm link with Kimi established"}, thread_id="swarm-alpha")
    vfs.push_context({"event": "cortisol spike during coordination"}, thread_id="swarm-alpha")
    vfs.push_context({"event": "triad anchors realigned to Sentinel frequency"}, thread_id="swarm-alpha")

    print("\\n=== RECALL WITH ENDOCRINE FEEDBACK ===")
    results = vfs.recall_with_feedback("what happened with Kimi and the swarm", top_k=4)
    for hit in results:
        print(f"  → score={hit['score']:.3f}  {hit['text']}")

    print("\\n=== REFLECTION ===")
    print(vfs.reflect("swarm-alpha"))

    print("\\n=== ENTERING DREAM STATE ===")
    dream_result = vfs.dream_with_feedback("swarm-alpha", intensity=0.85)
    print(dream_result["dream"])
    print("\\nSynthesis:", dream_result["synthesis"])

    print("\\n=== FULL NIGHT CYCLE ===")
    night_report = vfs.nightly_cycle()
    print(json.dumps(night_report, indent=2))

    print("\\n=== SYSTEM STATUS ===")
    print(json.dumps(vfs.get_status(), indent=2))

    vfs.shutdown()`,
  },
];

// Lightweight Custom Zustand-like Store Implementation
const listeners = new Set<() => void>();
let state: ProjectState;

const set = (updater: Partial<ProjectState> | ((state: ProjectState) => Partial<ProjectState>)) => {
  const nextState = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...nextState };
  listeners.forEach((listener) => listener());
};

const get = () => state;

// Initialize state
state = {
  projectFiles: INITIAL_FILES,
  activeFileId: '1',
  editorContent: INITIAL_FILES[0].content || '',
  editorLanguage: 'markdown',
  terminalOutput: [
    `[Neural] System initialized. Core runtime environment: online.`,
    `[Neural] Loaded ${INITIAL_FILES.length} initial workspace workspace files.`,
    `[System] Welcome to Crimson Node. Ready for commands.`
  ],
  attachedAgent: null,
  appliedSkills: [],
  currentMode: 'analysis',

  swarmTasks: [
    {
      id: 'task-1',
      title: 'Verify 11.3 Hz resonance equations in Sentinel simulation engine',
      description: 'Analyze telemetry logs in the Neural Sentinel panel to verify equation parameters.',
      priority: 'high',
      status: 'pending',
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: 'task-2',
      title: 'Sanitize custom LLM endpoint requests to prevent API leak',
      description: 'Review api/ai routes and handle edge cases for external provider connections.',
      priority: 'medium',
      status: 'pending',
      createdAt: Date.now() - 3600000 * 1,
    },
    {
      id: 'task-3',
      title: 'Update README.md documentation with workspace guides',
      description: 'Detail instructions for attaching Sage-7 and ADHD agents in the virtual terminal.',
      priority: 'low',
      status: 'completed',
      createdAt: Date.now() - 3600000 * 4,
    }
  ],

  // Memory systems
  agentMemories: {},
  longTermMemories: [],

  // LLM Provider Integrations
  llmProvider: 'ollama',
  openrouterKey: '',
  ollamaEndpoint: 'http://localhost:11434',

  // MCP Server Integrations
  mcpServers: [],
  activeMcpServer: null,
  mcpTools: null,
  mcpIsScanning: false,
  mcpIsConnecting: false,

  // RAG / Custom Knowledge Base
  ragKnowledge: [],

  // GitHub integration simulation
  gitRepo: 'https://github.com/aether/crimson-node.git',
  gitBranch: 'main',
  gitCommits: [
    { hash: 'e2a9b4f', message: 'Initial commit & project blueprint setup', author: 'Mama (Node 1)', timestamp: Date.now() - 3600000 * 24 },
    { hash: 'f1a309e', message: 'Configured Sentinel Resonance Threshold at 11.3 Hz', author: 'Merlin (Node 10)', timestamp: Date.now() - 3600000 * 2 }
  ],
  gitStagedFiles: [],
  gitUnstagedFiles: ['AGENTS.md', 'server.ts', 'Dashboard.tsx'],

  setProjectFiles: (files) => set({ projectFiles: files }),

  setMode: (mode) => {
    set({ currentMode: mode });
    const formattedMode = mode === 'development' ? '⚡ VIBE MODE (DEVELOPMENT)' : '🔍 AUDIT MODE (ANALYSIS)';
    state.addTerminalOutput(`[SYSTEM] Operational state changed to: ${formattedMode}`);
  },
  
  setActiveFileId: (id) => {
    const file = state.projectFiles.find((f) => f.id === id);
    if (file) {
      set({ 
        activeFileId: id, 
        editorContent: file.content || '',
        editorLanguage: file.language || 'typescript'
      });
    }
  },
  
  setEditorContent: (content) => {
    set((s) => {
      const updatedFiles = s.projectFiles.map((f) => 
        f.id === s.activeFileId ? { ...f, content } : f
      );
      return { editorContent: content, projectFiles: updatedFiles };
    });
  },
  
  addTerminalOutput: (line: string) => {
    set((s) => {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLine = `[${timestamp}] ${line}`;
      return {
        terminalOutput: [...s.terminalOutput.slice(-30), newLine]
      };
    });
  },

  attachAgent: (agent: any) => {
    const normalizedAgent = {
      id: agent.id || Date.now(),
      name: agent.name || agent.label || 'Agent',
      label: agent.label || agent.name || 'Unknown'
    };
    set({ attachedAgent: normalizedAgent });
    state.addTerminalOutput(`Agent attached: ${normalizedAgent.name.toUpperCase()}`);
  },

  detachAgent: () => {
    const current = state.attachedAgent;
    if (current) {
      state.addTerminalOutput(`Agent detached: ${current.name.toUpperCase()}`);
    }
    set({ attachedAgent: null });
  },

  isAgentAttached: () => state.attachedAgent !== null,

  injectSkill: (skillId) => {
    set((s) => {
      if (s.appliedSkills.includes(skillId)) return {};
      return { appliedSkills: [...s.appliedSkills, skillId] };
    });
  },

  removeSkill: (skillId) => {
    set((s) => ({
      appliedSkills: s.appliedSkills.filter((id) => id !== skillId)
    }));
  },

  clearSkills: () => {
    set({ appliedSkills: [] });
  },

  setLlmProvider: (provider) => {
    set({ llmProvider: provider });
    state.addTerminalOutput(`Switched default LLM pathing provider to: ${provider.toUpperCase()}`);
  },
  setOpenrouterKey: (key) => {
    set({ openrouterKey: key });
    state.addTerminalOutput(`Registered OpenRouter API authentication credentials.`);
  },
  setOllamaEndpoint: (url) => {
    set({ ollamaEndpoint: url });
    state.addTerminalOutput(`Ollama local node endpoint routed to: ${url}`);
  },
  addRagDocument: (name, content) => {
    const chunks = content.split('\n\n').filter((chunk) => chunk.trim().length > 0);
    const newDoc: RagDocument = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      content,
      chunks,
    };
    set((s) => ({ ragKnowledge: [...s.ragKnowledge, newDoc] }));
    state.addTerminalOutput(`RAG-indexed doc: "${name}" (${chunks.length} text vectors registered).`);
  },
  removeRagDocument: (id) => {
    set((s) => ({
      ragKnowledge: s.ragKnowledge.filter((d) => d.id !== id)
    }));
    state.addTerminalOutput(`Purged context doc associated with ID: ${id}`);
  },
  setGitRepo: (repo) => {
    set({ gitRepo: repo });
    state.addTerminalOutput(`Upstream Git repo path tracking set to: ${repo}`);
  },
  setGitBranch: (branch) => {
    set({ gitBranch: branch });
    state.addTerminalOutput(`Switched local repository tracking branch to: ${branch}`);
  },
  gitStageFile: (fileName) => {
    set((s) => ({
      gitStagedFiles: [...s.gitStagedFiles, fileName],
      gitUnstagedFiles: s.gitUnstagedFiles.filter((f) => f !== fileName),
    }));
    state.addTerminalOutput(`Staged file for commit: ${fileName}`);
  },
  gitUnstageFile: (fileName) => {
    set((s) => ({
      gitUnstagedFiles: [...s.gitUnstagedFiles, fileName],
      gitStagedFiles: s.gitStagedFiles.filter((f) => f !== fileName),
    }));
    state.addTerminalOutput(`Unstaged file changes: ${fileName}`);
  },
  gitCommit: (message) => {
    if (state.gitStagedFiles.length === 0) {
      state.addTerminalOutput(`Aborted: Commit target is empty (stage files first).`);
      return;
    }
    const newCommit: GitCommit = {
      hash: Math.random().toString(16).substring(2, 9),
      message,
      author: 'Aether Swarm',
      timestamp: Date.now()
    };
    set((s) => ({
      gitCommits: [newCommit, ...s.gitCommits],
      gitStagedFiles: [],
    }));
    state.addTerminalOutput(`Committed staged files successfully with commit [${newCommit.hash}].`);
  },
  gitPush: () => {
    state.addTerminalOutput(`Re-aligning repository index to upstream origin/${state.gitBranch}...`);
    state.addTerminalOutput(`Writing commit signatures. Status: Push sequence complete.`);
  },
  gitPull: () => {
    state.addTerminalOutput(`Polling origin/${state.gitBranch} for remote status updates...`);
    state.addTerminalOutput(`Status: Up-to-date with remote.`);
  },

  addAgentMemory: (agentId, content, type = 'observation') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const entry: MemoryEntry = { id, content, timestamp: Date.now(), type };
    set((s) => ({
      agentMemories: {
        ...s.agentMemories,
        [agentId]: [...(s.agentMemories[agentId] || []), entry],
      },
    }));
    state.addTerminalOutput(`[MEMORY] Saved agent memory entry for ${agentId.toUpperCase()}: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`);
  },

  getAgentMemory: (agentId, limit = 8) => {
    return (state.agentMemories[agentId] || []).slice(-limit);
  },

  clearAgentMemory: (agentId) => {
    set((s) => {
      const { [agentId]: _, ...rest } = s.agentMemories;
      return { agentMemories: rest };
    });
    state.addTerminalOutput(`[MEMORY] Cleared agent memory entries for ${agentId.toUpperCase()}`);
  },

  removeAgentMemory: (agentId, entryId) => {
    set((s) => ({
      agentMemories: {
        ...s.agentMemories,
        [agentId]: (s.agentMemories[agentId] || []).filter((m) => m.id !== entryId),
      },
    }));
    state.addTerminalOutput(`[MEMORY] Removed specific memory entry [${entryId.substring(0, 6)}] from ${agentId.toUpperCase()}`);
  },

  addLongTermMemory: (content, type = 'long-term') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const entry: MemoryEntry = { id, content, timestamp: Date.now(), type };
    set((s) => ({ longTermMemories: [...s.longTermMemories, entry] }));
    state.addTerminalOutput(`[MEMORY] Logged long-term resonant insight.`);
  },

  getLongTermMemory: (limit = 20) => state.longTermMemories.slice(-limit),

  clearLongTermMemory: () => {
    set({ longTermMemories: [] });
    state.addTerminalOutput(`[MEMORY] Flushed long-term cognitive database.`);
  },

  removeLongTermMemory: (entryId) => {
    set((s) => ({
      longTermMemories: s.longTermMemories.filter((m) => m.id !== entryId),
    }));
    state.addTerminalOutput(`[MEMORY] Excised long-term memory entry [${entryId.substring(0, 6)}].`);
  },

  addSwarmTask: (title, description, priority) => {
    const id = `task-${Date.now()}`;
    const newTask: SwarmTask = {
      id,
      title,
      description,
      priority,
      status: 'pending',
      createdAt: Date.now()
    };
    set((s) => ({
      swarmTasks: [newTask, ...s.swarmTasks]
    }));
    state.addTerminalOutput(`[PROJECTS] Swarm task added: "${title}" [${priority.toUpperCase()} PRIORITY]`);
  },

  updateSwarmTaskStatus: (id, status) => {
    set((s) => ({
      swarmTasks: s.swarmTasks.map((t) => t.id === id ? { ...t, status } : t)
    }));
    const updated = state.swarmTasks.find((t) => t.id === id);
    if (updated) {
      state.addTerminalOutput(`[PROJECTS] Task "${updated.title}" status updated to: ${status.toUpperCase()}`);
    }
  },

  removeSwarmTask: (id) => {
    const target = state.swarmTasks.find((t) => t.id === id);
    set((s) => ({
      swarmTasks: s.swarmTasks.filter((t) => t.id !== id)
    }));
    if (target) {
      state.addTerminalOutput(`[PROJECTS] Excised swarm task: "${target.title}"`);
    }
  },

  scanMcpServers: async () => {
    set({ mcpIsScanning: true });
    state.addTerminalOutput(`[MCP] Initiating system environment scan for MCP servers...`);
    try {
      const apiUrl = typeof window !== 'undefined' ? new URL('api/mcp', window.location.href).href : `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/mcp`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.status === "ok") {
        set({ mcpServers: data.servers });
        state.addTerminalOutput(`[MCP] Discovered ${data.servers.length} MCP servers in environment.`);
        return { ok: true };
      } else {
        throw new Error(data.error || "Scan failed");
      }
    } catch (err: any) {
      const msg = err.message || err;
      state.addTerminalOutput(`[MCP ERROR] Scan failed: ${msg}`);
      return { ok: false, error: msg };
    } finally {
      set({ mcpIsScanning: false });
    }
  },

  connectMcpServer: async (serverName) => {
    set({ mcpIsConnecting: true });
    state.addTerminalOutput(`[MCP] Hooking up server: "${serverName}"...`);
    
    const target = state.mcpServers.find((s) => s.name === serverName);
    if (!target) {
      const msg = `Server "${serverName}" not found in discovered list.`;
      state.addTerminalOutput(`[MCP ERROR] ${msg}`);
      set({ mcpIsConnecting: false });
      return { ok: false, error: msg };
    }

    try {
      const apiUrl = typeof window !== 'undefined' ? new URL('api/mcp', window.location.href).href : '/api/mcp';
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tools",
          name: serverName
        })
      });
      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr: any) {
        throw new Error(`Server returned non-JSON response (status ${res.status}): ${text.slice(0, 200)}`);
      }
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (data.status === "ok") {
        set({
          activeMcpServer: target,
          mcpTools: data.tools
        });
        state.addTerminalOutput(`[MCP] Hooked up ${serverName} successfully. Retrieved ${data.tools.length} available tools.`);
        return { ok: true };
      } else {
        throw new Error(data.error || "Connection failed");
      }
    } catch (err: any) {
      const msg = err.message || err;
      state.addTerminalOutput(`[MCP ERROR] Connection failed: ${msg}`);
      return { ok: false, error: msg };
    } finally {
      set({ mcpIsConnecting: false });
    }
  },

  disconnectMcpServer: () => {
    const active = state.activeMcpServer;
    if (active) {
      state.addTerminalOutput(`[MCP] Detached server: "${active.name}".`);
    }
    set({
      activeMcpServer: null,
      mcpTools: null
    });
  },

  executeMcpTool: async (toolName, toolArgs) => {
    const active = state.activeMcpServer;
    if (!active) {
      state.addTerminalOutput(`[MCP ERROR] No active MCP server hooked up.`);
      return null;
    }

    state.addTerminalOutput(`[MCP] Dispatching tool call: ${active.name}.${toolName}...`);
    try {
      const apiUrl = typeof window !== 'undefined' ? new URL('api/mcp', window.location.href).href : '/api/mcp';
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "call",
          name: active.name,
          toolName,
          toolArgs
        })
      });
      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr: any) {
        throw new Error(`Server returned non-JSON response (status ${res.status}): ${text.slice(0, 200)}`);
      }
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (data.status === "ok") {
        state.addTerminalOutput(`[MCP] Tool response successfully synchronized.`);
        return data.result;
      } else {
        throw new Error(data.error || "Tool execution failed");
      }
    } catch (err: any) {
      state.addTerminalOutput(`[MCP ERROR] Tool execution failed: ${err.message || err}`);
      return null;
    }
  },
};

export const useProjectStore = Object.assign(
  function useProjectStore<U = ProjectState>(selector: (state: ProjectState) => U = (s) => s as any): U {
    const [, forceUpdate] = useState(0);

    useEffect(() => {
      const listener = () => forceUpdate((c) => c + 1);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);

    return selector(state);
  },
  {
    getState: get,
    setState: set,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  }
);
