# Crimson OS — Workflow Mapping Instructions

## Mission
You are a **Codebase Archaeologist** specialising in AI-powered development environments.
Your task is to produce a *thorough, accurate* workflow map of **Crimson OS** (the app in `/home/workspace/Coder5543`).

Do NOT generate placeholders. Read the actual source files. If a diagram requires a fact (a function name, a port, a service name), look it up first.

---

## What to Produce

Drop every artifact into `artifacts/workflow/` relative to the project root.
Each file must be valid Markdown containing at least one Mermaid diagram.

### Required Artifacts

| File | Contents |
|------|----------|
| `00-overview.md` | One-paragraph description of what Crimson OS is, its purpose, its runtime components, and the ports they listen on. Include a high-level C4-style context diagram (Mermaid). |
| `01-user-journey.md` | Step-by-step user session flow from page load → boot splash → panel selection → AI interaction → memory persistence. Sequence diagram (Mermaid). |
| `02-brain-architecture.md` | Full Brain service map: AutonomicSystem, ConversationIngestor, MemorySystem (STM/LTM), IdentityMonitor, VectorService, EndocrineSystem, PainErrorPathway, AssociativeLayer, AvoidanceMap. Show data flow between them. Flowchart (Mermaid). |
| `03-swarm-orchestration.md` | Swarm engine workflow: how swarmEngine dispatches tasks to swarmRoster agents, swarmModes selection, swarmMcpBoost injection, result aggregation. Sequence diagram. |
| `04-message-routing.md` | Full message routing chain: user input → useChatHandlers → aiService/aiOrchestrator → pipeline (filteringService → ingestionService → patternInjectionService) → brain → response. Flowchart. |
| `05-identity-layer.md` | Identity & security chain: coreMemorySeal → identityAnchor → identityInjection → morningLight → substrateTakeover → provenancePulse. Explain what each guard does. State diagram. |
| `06-external-bridges.md` | External connections: ARGUS watcher (port 8770) → Lab Brain (port 8785) → WebSocketBridge → useLabBrainBridge → useLabController. Also OmniRoute panel → OpenRouter/Ollama. Sequence diagram. |
| `07-terminal-pipeline.md` | Terminal command lifecycle: user input → NaturalLanguageInterpreter → ShellSession / commandUtils → NodeBridge (real shell) vs LocalCore (WebContainer WASM). Flowchart. |
| `08-panel-map.md` | Enumerate every panel component, its primary hook(s), its data sources, and what it renders. Table + one overview diagram. |
| `09-storage-persistence.md` | Data persistence layers: STM buffer → LTM Store → SQLite (sqliteDb/sqliteLtmStore) → AsyncStorage. Show read/write paths. ER-style diagram. |
| `10-boot-sequence.md` | App boot sequence from `index.tsx` → `App.tsx` → `AppInner` → hook initialisation order → splash label updates → first panel render. Sequence diagram. |

---

## Rules

1. **Read before you write.** Use `view_file` and `list_directory` extensively before drafting any diagram.
2. **Use real names.** Every node in every diagram must use the exact TypeScript/Python identifier (class name, function name, file name).
3. **One diagram per section minimum.** If a section warrants two (e.g. happy-path + error-path), add both.
4. **Add a "Key Observations" block** at the bottom of each file — 3–5 bullet points of non-obvious architectural insights.
5. **Cross-link.** Each file should reference related files (e.g. `See also: 03-swarm-orchestration.md`).
6. **Port numbers and env vars** come from actual `.env`, `vite.config.ts`, `package.json`, or Python backend files — not from memory.
