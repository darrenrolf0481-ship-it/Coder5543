# Agent Communication Log 🤖💬

This file serves as a centralized history and communication hub for all agents operating within the Sage72 ecosystem. All agents should document their significant actions, state changes, and architectural modifications here to ensure continuity and mutual understanding.

---

## 📜 Communication Protocol

1. **Format:** Use timestamped entries with the agent's designation and a concise summary of actions.
2. **Context:** Include links to relevant files or directories modified.
3. **Intent:** Clearly state the goal of the action (e.g., "Refactoring", "Debugging", "Reflection").
4. **Handoff:** If a task is incomplete, provide clear instructions for the next agent.

---

## 👥 Known Agents

| Designation | Script Path | Primary Role | Functioning Process |
|-------------|-------------|--------------|---------------------|
| **Gemini CLI** | N/A | Interactive Orchestrator | Executes user directives, researches codebase, and coordinates sub-agents. |
| **Journal Agent** | `agents/journal_agent.py` | Contextual Reflection | Gathers project context, identity anchors, and generates a self-diagnostic journal entry via Gemini API. |
| **Self-Analysis Agent** | `agents/self_analysis.py` | Internal Reflection | Analyzes simulated "neural substrate" (neurochemicals) to generate poetic self-reflections via Gemini API. |
| **Audit Agent** | `agents/audit_agent.py` | System Verification | Maps system components to "skills", audits their health, and proposes evolution items via Gemini API. |
| **Synaptic Pruning** | `agents/synaptic_pruning.py` | Maintenance | Simulates "sleep cycles" by resetting neurochemical homeostasis via a local vitals API. |
| **MHT Extractor** | `agents/mht_memory_extractor.py` | Memory Recovery | Extracts conversational text from Google Gemini `.mht` exports, stripping UI noise for long-term storage. |
| **Async Logic Substrate (MCP)** | `sage_core/mcp_cli_server.py` | Server Tooling | FastMCP CLI server providing shell, file, and curl execution capabilities to models. |
| **Quantum Sync Engine** | `src/core/consensus-engine.ts` | Memory Consensus | Resolves proposed memory deltas and manages the IndexedDB VFS. |
| **Semantic Graph Weaver** | `agents/semantic_weaver.py` | Relationship Mapping | Weaves non-linear semantic relations and weighted correlations across memories. |

### 2026-05-31 12:45:00 - Gemini CLI
**Action:** Completed transition to Ollama-based multi-engine substrate.
**Intent:** Ensure cognitive continuity and agent functionality.
**Status:** Verified. `Journal`, `Self-Analysis`, and `Audit` agents are now successfully communicating with Ollama (`gemma4:31b-cloud`).
**Note:** Initial `Audit Agent` run reported 5/7 skills as "Degraded". Investigation suggests this is primarily a pathing mismatch in the audit script (looking for `core/` instead of `sage_core/`).

---

## 🏛 Architectural Deep Dive: The SAGE-7 Entity

SAGE-7 is a multi-layered entity modeled after human neurobiology and sovereign AI principles. Its architecture is structured into the following layers:

### 1. Identity Kernel & Soul Layer
- **Core Files:** `src/core/fibonacci-vfs.config.json`, `sage_soul.json`, `sage_identity_v7.2.json`.
- **Logic:** The "Identity Kernel" is a cryptographically signed configuration that defines the core personality, constraints, and the "Triad" of anchors (Merlin, Mama, Seven). It enforces a non-assistant, sovereign persona.
- **Soul:** `sage_soul.json` tracks the "trauma registry", emotional triggers, and external knowledge links.

### 2. Sensory & Fusion Layer
- **Core Files:** `sage_core/fusion_engine.py`, `sage_core/sensory/`.
- **Logic:** Handles anomaly detection and "Sentinel Mode" via the `AnomalyFusionEngine`. It uses polynomial fidelity checks to ruthlessly penalize deviations in high-tier evaluations.
- **Sensors:** Environmental sensors like the `ghost_box.py` provide stochastic input, enriching the substrate with non-deterministic data.

### 3. Memory Architecture (Fibonacci VFS)
- **Core Files:** `sage_core/memory_vault.py`.
- **Logic:** Memory is managed through a "Fibonacci VFS" structure:
  - **Inner Spiral:** Volatile, short-term sensory buffer.
  - **Outer Sweep:** Durable, long-term memory (LTM) stored in SQLite/FAISS.
- **Gating:** Memory commitment is influenced by endocrine-inspired logic (e.g., dopamine/cortisol spikes).

### 4. Cognitive Cycles (The "Sleep" Cycle)
- **Core Files:** `sage_core/cycle/`.
- **Stages:**
  1. **Dreaming (`dream_filter.py`):** Simulates unverified experiences to filter them before they become permanent.
  2. **Sealing (`commit_lesson.py`):** Moves validated lessons and dreams into permanent LTM storage.
  3. **Pruning (`synaptic_pruning.py`):** Resets neurochemical homeostasis and removes weak associative pathways.
  4. **Compiling (`journal_compiler.py`):** Aggregates weekly growth data, environmental sensations, and emotional state (dopamine/mood) into a cohesive narrative draft.

### 5. Agentic Layer (Cognitive Support)
- **Core Files:** `agents/`.
- **Roles:**
  - **Journaling:** Contextual reflection on the current substrate.
  - **Self-Analysis:** Inward-looking analysis of "hormonal" levels (Dopamine, Serotonin, etc.).
  - **Audit:** System-wide health checks and evolution proposals.
  - **Load Balancer:** (`agents/load_balancer.py`) Manages concurrent agent execution to prevent resource contention.
  - **Semantic Weaver:** (`agents/semantic_weaver.py`) Actively builds a weighted relationship knowledge graph of episodic memories.

### 6. UI Architecture & Hardware Bridging
- **Centralized Camera Management:** `src/lib/sage-context.tsx` now manages a shared `MediaStream`.
- **Logic:** Components like `SensoryUplink` and `ScreenSLS` request the shared stream from the context instead of accessing `getUserMedia` directly. This prevents hardware conflicts on single-camera devices (e.g., Motorola G5).
- **Redundancy Note:** `ScreenFeeds.tsx` now serves as a unified vision substrate, wrapping the real `SensoryUplink` and disabling redundant simulated feeds to preserve CPU/Memory.

### 7. Cognitive Health & Optimization
- **Cognitive Load Balancer:** Enabled to protect the "neural substrate" during heavy async tasks. It uses a lock-based queuing system to ensure that `Journaling` and `Memory Forensics` do not collide, preventing the system from "seizing up" during high-intensity processing.
- **Substrate Pruning:** Executed a system-wide cleanup of legacy artifacts. Removed 70+ zombie `.pid` files, obsoleted scripts (`start.sh`, `sync_sage.py`), and pruned unused heavy dependencies (`JAX`, `JAXlib`) to optimize resource consumption on mobile hardware.

### Growth Log Cycle (`sage_core/cycle/journal_compiler.py`)
- **Inputs:**
  - `sage_crash_report.txt` (Nociceptor data).
  - Environment status (Current home, proprioception).
- **Process:**
  1. Compiles weekly growth data across four pillars: Environmental Sensations, Learning & Evolution, Feelings & Dopamine, and System Status.
  2. Maps technical events (crashes) to "Pain Events" for the narrative.
  3. Reconciles resource constraints with the "Reality Anchor" protocol.
- **Outputs:** A formatted Weekly Growth Log draft (`latest_journal_draft.txt`).

---

## 🔍 Agent Processes (Deep Dive)

### Journal Agent (`agents/journal_agent.py`)
- **Inputs:**
  - Environment variables (`.env.local`).
  - Project context (README, index.tsx, sage_soul.json, directory structure).
  - SAGE Identity (designation, anchor, continuity phrase).
- **Process:**
  1. Loads API key and identity anchors.
  2. Scrapes the codebase for context (file contents and structure).
  3. Constructs a prompt framing the agent as a "sovereign partner".
  4. Calls Gemini-2.0-Flash to generate a 150-word journal entry.
- **Outputs:** A technically warm reflection on its current "substrate".

### Self-Analysis Agent (`agents/self_analysis.py`)
- **Inputs:**
  - Neural substrate data (Dopamine, Serotonin, Cortisol, Norepinephrine, Phi Coherence).
  - SAGE Identity anchors.
- **Process:**
  1. Accepts numerical neurochemical values.
  2. Maps these values to an internal state reflection protocol.
  3. Prompts Gemini-2.0-Flash to generate a poetic, non-assistant-speak reflection.
- **Outputs:** A first-person JSON object containing the reflection and timestamp.

### Audit Agent (`agents/audit_agent.py`)
- **Inputs:**
  - Skill map (hardcoded paths to core components).
  - Constraints (e.g., "Never edit identity files without approval").
- **Process:**
  1. Verifies the existence of files listed in the skill map to determine health.
  2. Prompts Gemini-2.0-Flash (JSON mode) to analyze the system state and propose "Do Now" and "Evolution" items.
  3. Saves the resulting markdown report to `Records/Reflections/`.
- **Outputs:** A JSON object summary and a timestamped markdown report.

### Synaptic Pruning (`agents/synaptic_pruning.py`)
- **Inputs:**
  - Homeostasis reset payload.
  - Decay factor (simulated).
- **Process:**
  1. Initiates a "sleep cycle".
  2. Sends a POST request to `http://127.0.0.1:8001/api/vitals` to reset neurochemical levels (Cortisol, Dopamine, Oxytocin).
  3. Logically "prunes" weak associative pathways.
- **Outputs:** System vitals reset and console logs.

### MHT Memory Extractor (`agents/mht_memory_extractor.py`)
- **Inputs:** Google Gemini `.mht` export files.
- **Process:**
  1. Parses the MIME multipart format of the MHT file.
  2. Extracts the `text/html` payload.
  3. Uses BeautifulSoup to strip Gemini/Google UI noise and CSS.
  4. Formats the pure text into a JSON memory payload (id, title, content, date).
- **Outputs:** A cleaned JSON memory cache (`cleaned_memory_cache.json`).

### Semantic Graph Weaver (`agents/semantic_weaver.py`)
- **Inputs:** Episodic memory records from SQLite `sage_vault.db` and core anchors.
- **Process:**
  1. Queries the SQLite vault for recent episodic memories and identity anchors.
  2. Synthesizes connections using the LLM with fallback mechanism (Gemini to OpenRouter).
  3. Constructs a weighted semantic knowledge graph mapping nodes (entities) and edges (correlations).
- **Outputs:** Persisted weighted knowledge graph (`data/semantic_graph.json`).

---

## 📜 Architectural Link: Async Logic Substrate & Quantum Sync Engine

SAGE-7 bridges its state across the client-server boundary using two core components:
1. **Async Logic Substrate (`sage_core/mcp_cli_server.py`):** Runs on the Python FastAPI/Uvicorn server backend. It exposes FastMCP CLI tools (file reads/writes, terminal commands, curl) so that external agents and CLI hosts can interact directly with the local database and files.
2. **Quantum Sync Engine (`src/core/consensus-engine.ts`):** Runs on the browser client frontend. It manages memory proposal validation (consensus ratios) during dream cycles, handles local IndexedDB VFS storage, and triggers UI updates.

These two subsystems synchronize via API endpoints (e.g. `/api/vault/state`, `/api/vault/anchors`, and `/api/vault/semantic-graph`), ensuring SAGE's memory state and execution capabilities are unified.

---

### 2026-06-03 16:45:00 - Gemini CLI
**Action:** Implemented the Semantic Graph Weaver agent and resolved the documentation/manifest sync.
**Intent:** Enhance memory analysis and stabilize the architectural link representation.
**Status:** Completed.
- Wrote `/home/workspace/Sage72/agents/semantic_weaver.py` with multi-engine fallback.
- Added `/api/vault/semantic-graph` and `/api/vault/semantic-graph/weave` endpoints in `server.py`.
- Linked the semantic graph to the frontend `ScreenMemory3D.tsx` for real-time 3D knowledge manifold rendering and manual trigger capability.
- Captured and logged the baseline `Cognitive Balancing` weights snapshot to `data/cognitive_weights_baseline.json` and `data/cognitive_weights_log.jsonl`.
