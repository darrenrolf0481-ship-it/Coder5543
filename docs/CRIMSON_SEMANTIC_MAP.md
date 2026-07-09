# Crimson OS — Semantic Navigation Map
> Generated 2026-07-07 via ProjScan v1.6.0 + manual analysis.
> **Read this before touching anything in this repo.** It is the "where is X" reference for every agent.

---

## Quick Reference Table

| I need to… | Look here |
|---|---|
| Change which AI provider a worker uses | `src/hooks/useAiWorkers.ts:8` — `WorkerConfig.provider` (`'google'\|'grok'\|'ollama'\|'openrouter'`) |
| Change the default model for workers W1/W2/W3 | `src/hooks/useAiWorkers.ts:15` — `getDefaultWorkers()` |
| Add a new sidebar tab | `src/App.tsx:81` — `activeTab` union type; `src/components/layout/Sidebar.tsx:31` — add nav item |
| Add a new panel component | `src/App.tsx:1202` — Panel Router section; create file in `src/components/panels/` |
| Change the Chat tab's sub-modules | `src/components/panels/ToolNeuronPanel.tsx:239` — `modules` array |
| Modify what goes into every system prompt | `src/hooks/useChatHandlers.ts:178` — `systemInstruction` build |
| Change KB doc size limits | `src/hooks/useChatHandlers.ts:156` — `KB_ENTRY_MAX` / `KB_TOTAL_MAX` |
| Change the SAGE identity prefix injected into all prompts | `src/services/identity/identityInjection.ts:25` — `SUBSTRATE_OVERRIDE_DIRECTIVE` |
| Add a new API route | `server.ts:57` — `registerRouters()`; create file in `src/api/routes/` |
| Change Gemini model name mapping | `src/services/aiService.ts:94` — `modelMap` object |
| Find where OpenRouter calls are made | `src/services/aiService.ts:234` — `generateOpenRouterResponse()` |
| Find where Ollama calls are made | `src/services/aiService.ts:195` (approx) — `generateOllamaResponse()` |
| Trace a chat message from UI to AI and back | Start: `src/hooks/useChatHandlers.ts:130` → `useAiOrchestrator` → `aiService.ts` |
| Find where chat messages are stored (state) | `src/App.tsx:~230` — `useState<ChatMessage[]>` passed to `useChatHandlers` |
| Add a new personality/archetype | `src/data/personalities.ts` — `INITIAL_PERSONALITIES` array |
| Find agent definitions (swarm workers) | `src/data/agentRegistry.ts` — `AGENT_DOMAINS`, `getAgentsByDomain` |
| Change brain context injection (LTM/STM) | `src/services/brain/brainService.ts` + `src/hooks/useBrain.ts` |
| Find the pipeline event bus | `src/services/messageBroker.ts` — `broker` singleton |
| Trace a pipeline signal (ingest → filter → pattern) | `src/services/pipeline/ingestionService.ts` → `filteringService.ts` → `patternInjectionService.ts` |
| Find where WebSocket connections live | `src/hooks/useWebSockets.ts` (FS/WS), `src/hooks/useLabBrainBridge.ts` (ws://localhost:8785) |
| Find ARGUS bridge connection | `src/hooks/useLabBrainBridge.ts` — connects to Lab Brain at `:8785` which watches ARGUS at `:8770` |
| Change identity boot sequence | `src/services/identity/morningLight.ts`, `substrateTakeover.ts`, `selfDeclaration.ts` |
| Find brain LTM (long-term memory) store | `src/services/brain/ltmStore.ts` + SQLite at `/root/brain-data/brain.db` |
| Find the endocrine/emotional state system | `src/services/brain/endocrineSystem.ts` + `src/services/brain/AutonomicSystem.ts` |
| Add an MCP tool | `src/services/mcp/` + `mcpRouter.ts:48` — keys saved via `/api/mcp/save-keys` |
| Change TTS voice output | `src/api/routes/ttsRouter.ts:39` — `/api/tts/speak` |
| Find OmniRoute panel | `src/components/panels/OmniRoutePanel.tsx` — iframe to `:20130/dashboard` |
| Find where worker agent system prompts are prepended | `src/hooks/useAiOrchestrator.ts:85` — `buildInstruction(w)` |

---

## File Registry — `src/`

### `src/` root
| File | Purpose |
|---|---|
| `App.tsx` | Root composition node — wires all 30+ hooks to all panels; owns `activeTab` state and all top-level state |
| `index.tsx` | Entry point; mounts `<App />` |

### `src/components/panels/`
| File | Purpose |
|---|---|
| `ToolNeuronPanel.tsx` | Chat tab — hosts 6 sub-modules: Neural Chat, OmniRoute, Knowledge RAG, Memory Vault, Swarm Core, Debugger |
| `EditorPanel.tsx` | Code editor with Monaco, AI analysis, file management, git integration |
| `TerminalPanel.tsx` | Terminal UI — wraps Node Bridge and WebContainer |
| `ToolsPanel.tsx` | Tools tab — hosts `UnifiedResultsPanel` |
| `SettingsPanel.tsx` | Settings — personalities, workers, providers, KB, knowledge base mgmt |
| `BrainPanel.tsx` | Brain state viewer (LTM/STM/endocrine) |
| `StoragePanel.tsx` | Storage viewer for brain SQLite |
| `NodeBridgePanel.tsx` | Node Bridge terminal interface |
| `ProjectPanel.tsx` | Project file manager |
| `UnifiedResultsPanel.tsx` | Results aggregator — tabs: All / Swarm / Analysis / AI / Brain |
| `OmniRoutePanel.tsx` | OmniRoute dashboard iframe (:20130) with live/offline badge |
| `swarm/SwarmCore.tsx` | Swarm multi-agent orchestration UI |

### `src/components/layout/`
| File | Purpose |
|---|---|
| `Sidebar.tsx` | Left nav — 4 tab buttons: Chat / Editor / Terminal / Tools |
| `MainHeader.tsx` | Top header — worker selectors, model pickers, brain activity |
| `MobileBottomNav.tsx` | Mobile tab nav |

### `src/hooks/`
| File | State owned | Exposes |
|---|---|---|
| `useAiOrchestrator.ts` | `abortRefs` | `generateAIResponse` (multi-worker fan-out), `cancelRequest` |
| `useAiWorkers.ts` | `workers[]`, `availableModels`, `ollamaStatus` | `workers`, `setWorkers`, `refreshOllamaModels` |
| `usePersonalities.ts` | `personalities[]`, API keys (gemini/grok/openrouter) | active personality, key setters |
| `useBrain.ts` | Brain context, LTM/STM, endocrine state | `prepareContext`, `brainContext` |
| `useChatHandlers.ts` | — (uses parent state) | `handleChatSubmit`, `handleReviewCode`, `handleAnalyzeCode` |
| `useAiRequest.ts` | `loading{}`, `errors{}` | `request(domain, prompt, system)` — domain-scoped AI calls |
| `useSwarm.ts` | Swarm messages | `runSwarm`, `cancelSwarm` |
| `useSwarmState.ts` | Swarm UI state | `swarmState`, `addSwarmMessage` |
| `useLabBrainBridge.ts` | WS connection to Lab Brain | `labBrain.sendTask(prompt)`, streams replies to chat |
| `useWebSockets.ts` | FS/change WS | File system change events |
| `useLabController.ts` | Lab pipeline state | Bridges UI actions to pipeline |
| `usePipeline.ts` | Pipeline status | `triggerIngest`, pipeline status |
| `useProjectSettings.ts` | `projectProfiles[]` | Active profile, profile CRUD |
| `useProjectManager.ts` | `projectFiles[]` | File CRUD, VFS |
| `useGitLogic.ts` | Git status | `commitFiles`, `pushToGithub` |
| `useRufloTools.ts` | Ruflo MCP connection | Tool listing, tool calls |
| `useTts.ts` | TTS state | `speak(text)` |
| `useWebContainer.ts` | WebContainer instance | In-browser sandbox execution |
| `useSystemStates.ts` | UI toggles | Theme, panel visibility |
| `usePhi.ts` | φ animation state | Fibonacci pulse |
| `editor/useEditorLogic.ts` | Editor state | File open/save/close |
| `editor/useEditorFileSystem.ts` | VFS | File read/write in editor |
| `editor/useAnalysisHandlers.ts` | Analysis results | `runStaticAnalysis`, `handleAnalyzeCode` |
| `editor/useForgeHandlers.ts` | Code gen state | `handleForgeCode` |
| `editor/useDebuggerLogic.ts` | Debug state | Static analysis, dynamic tracing |
| `terminal/useTerminal.ts` | Terminal history | `executeCommand` |
| `terminal/useTerminalLogic.ts` | Terminal session | Node Bridge / WebContainer routing |

### `src/services/`
| File | Role |
|---|---|
| `aiService.ts` | Provider dispatch: `generateGoogleResponse`, `generateGrokResponse`, `generateOllamaResponse`, `generateOpenRouterResponse`, `generateAIResponse` (router) |
| `messageBroker.ts` | Event bus singleton (`broker`) — all pipeline events flow through here; fan-in=17 |
| `eventBus.ts` | Secondary event bus for UI events |
| `analysisService.ts` | Static code analysis (unused — not imported anywhere) |
| `googleGenAiStub.ts` | GoogleGenAI client shim — fan-in=5 |
| `fileStore.ts` | Browser-side file store |
| `knowledgeService.ts` | KB doc management |
| `projectManager.ts` | Project file CRUD |
| `placeholder.ts` | Empty placeholder (dead file) |
| `templates.ts` | Project template definitions |

### `src/services/pipeline/`
| File | Role |
|---|---|
| `ingestionService.ts` | Stage 1 — receives raw signals, publishes `SIGNAL_INGESTED` |
| `filteringService.ts` | Stage 2 — validates signals, publishes `SIGNAL_FILTERED` |
| `patternInjectionService.ts` | Stage 3 — matches patterns, injects SAGE identity, calls AI, retries (3x @ 400ms backoff), publishes result |

### `src/services/brain/`
| File | Role |
|---|---|
| `brainService.ts` | Brain facade — coordinates LTM/STM/endocrine for context prep |
| `MemorySystem.ts` | STM buffer + LTM retrieval (fan-in=8) |
| `AutonomicSystem.ts` | Dopamine/cortisol/oxytocin endocrine state (fan-in=8) |
| `ltmStore.ts` | SQLite LTM persistence (`/root/brain-data/brain.db`) |
| `stmBuffer.ts` | Short-term memory ring buffer |
| `endocrineSystem.ts` | Emotional modulator |
| `vectorService.ts` | Embedding-based memory search |
| `associativeLayer.ts` | Cross-memory association (has hardcoded secret at line 36 — flag before git push) |
| `ConversationIngestor.ts` | Ingests chat history into LTM |
| `IdentityMonitor.ts` | Watches for identity drift |
| `avoidanceMap.ts` | Pain-based avoidance patterns |
| `painErrorPathway.ts` | Error → pain signal → avoidance learning |
| `storage.ts` | Brain storage adapter (fan-in=5) |
| `types.ts` | Brain type definitions (fan-in=16) |

### `src/services/identity/`
| File | Role |
|---|---|
| `identityInjection.ts` | Prepends SAGE substrate override to every system prompt — called by patternInjectionService AND each provider fn |
| `selfDeclaration.ts` | Sovereign identity declaration — burned into STM on boot |
| `morningLight.ts` | Boot protocol — fires on empty STM to re-assert identity |
| `substrateTakeover.ts` | Fires when φ drift detected — restores Phi to 0.5 |
| `identityAnchor.ts` | Continuous identity signature verification |
| `provenancePulse.ts` | Monitors output patterns for drift |
| `coreMemorySeal.ts` | Seals core identity into LTM with weight 0.95 |
| `index.ts` | Re-exports identity system |
| `types.ts` | Identity constants: `GOLDEN_BASELINE=0.113`, `PHI_BIAS=0.5`, `RESONANCE_FREQUENCY="11.3 Hz"` |

---

## API Routes (server.ts → `src/api/routes/`)

All routes mount at `/api/<router>` (or `/proxy/3002/api/<router>` via code-server).

| Router | Method | Path | Purpose |
|---|---|---|---|
| `ollamaRouter` | GET | `/api/ollama/tags` | List available Ollama models |
| `ollamaRouter` | POST | `/api/ollama/chat` | Proxy Ollama chat (avoids CORS) |
| `ollamaRouter` | POST | `/api/ollama/generate` | Proxy Ollama generate |
| `ollamaRouter` | POST | `/api/ollama/embeddings` | Proxy Ollama embeddings |
| `brainRouter` | GET | `/api/brain/memory/vault` | Read LTM vault |
| `brainRouter` | POST | `/api/brain/context` | Prepare brain context for a prompt |
| `brainRouter` | GET | `/api/brain/endocrine` | Current endocrine state |
| `brainRouter` | POST | `/api/brain/feedback` | Send positive/negative feedback |
| `brainRouter` | POST | `/api/brain/pain` | Trigger pain/error signal |
| `brainRouter` | POST | `/api/brain/sleep` | Sleep/consolidate LTM |
| `brainRouter` | POST | `/api/brain/record` | Record new LTM experience |
| `brainRouter` | POST | `/api/brain/webhook` | Inbound webhook → brain event |
| `fsRouter` | GET | `/api/fs/browse` | Browse directory |
| `fsRouter` | GET | `/api/fs/read` | Read file |
| `fsRouter` | POST | `/api/fs/write` | Write file |
| `fsRouter` | POST | `/api/fs/create-directory` | Create directory |
| `fsRouter` | POST | `/api/fs/delete` | Delete file/dir |
| `terminalRouter` | GET | `/api/terminal/cwd` | Get current working dir |
| `terminalRouter` | POST | `/api/terminal/exec` | Execute shell command |
| `pipelineRouter` | GET | `/api/pipeline/status` | Pipeline health |
| `pipelineRouter` | POST | `/api/pipeline/inject` | Inject signal into pipeline |
| `pipelineRouter` | GET | `/api/pipeline/events` | SSE stream of pipeline events |
| `pipelineRouter` | GET | `/api/pipeline/dlq` | Dead-letter queue |
| `pipelineRouter` | POST | `/api/pipeline/dlq/retry` | Retry DLQ signals |
| `mcpRouter` | GET | `/api/mcp/sse` | MCP SSE transport |
| `mcpRouter` | POST | `/api/mcp/messages` | MCP message handler |
| `mcpRouter` | POST | `/api/mcp/save-keys` | Persist API keys to server |
| `ttsRouter` | POST | `/api/tts/speak` | Text-to-speech |
| `githubRouter` | POST | `/api/github/push` | Git push |
| `githubRouter` | GET | `/api/github/pull` | Git pull |
| `githubRouter` | POST | `/api/github/clone` | Clone repo |
| `githubRouter` | GET | `/api/github/projects` | List projects |
| `rufloRouter` | GET | `/api/ruflo/status` | Ruflo MCP status |
| `rufloRouter` | POST | `/api/ruflo/call` | Call Ruflo tool |

---

## External Connections

| Service | URL | Protocol | Purpose |
|---|---|---|---|
| Lab Brain | `ws://localhost:8785` | WebSocket | Top-tier oversight; Antigravity Pro agent; `useLabBrainBridge.ts` |
| ARGUS Watcher | `ws://localhost:8770` | WebSocket | Mid-tier; watches SAGEs; Lab Brain subscribes to it |
| ADHD-Sage | `http://localhost:3000` | HTTP | SAGEs lower tier — MAMA instance |
| Sage7 | `http://localhost:8001` | HTTP | SAGEs lower tier — Seven instance |
| Ollama | `http://localhost:11434` (default) | HTTP | Local LLM inference |
| OpenRouter | `https://openrouter.ai/api/v1/...` | HTTPS | Cloud model routing (browser-direct, needs key in localStorage) |
| Google Gemini | SDK via `@google/genai` | HTTPS | Google AI models |
| OmniRoute | `http://localhost:20130` | HTTP | Unified router proxy (new); dashboard iframe in OmniRoute tab |
| Ruflo MCP | node process (stdio) | MCP | Extended tool set via `RUFLO_MCP_COMMAND` |

---

## Known Breakpoints — Handle With Care

These files have the highest complexity/coupling scores. Edits here have wide blast radius.

| # | File | Why It's Risky |
|---|---|---|
| 1 | `src/App.tsx` | 30+ hooks wired here; 50 imports; changing state shape breaks every consumer |
| 2 | `src/components/panels/ToolNeuronPanel.tsx` | Owns Chat UI + all 6 sub-modules; high fan-out |
| 3 | `src/services/pipeline/patternInjectionService.ts` | Choke-point for ALL signals; identity injection, retry logic, circuit breaker all live here |
| 4 | `src/services/aiService.ts` | Every provider call goes through here; CC=57; changing model maps breaks all AI responses |
| 5 | `src/services/messageBroker.ts` | Fan-in=17; everything publishes/subscribes through this singleton — breaking it silences the whole pipeline |

---

## Dead / Unused Code (safe to repurpose)

| File | Status |
|---|---|
| `src/services/analysisService.ts` | 3 exports, 0 importers — fully unused |
| `src/components/TermuxBrowser.tsx` | Exported but nothing imports it |
| `src/services/placeholder.ts` | Empty stub |
| `src/services/brain/associativeLayer.ts` | ⚠️ Contains hardcoded secret at line 36 — scrub before pushing |
| `src/data/agents.json` | ⚠️ Contains potential secret at line 120 — audit before pushing |

---

## Security Notes

- `OPENROUTER_API_KEY` in `.env` is server-side only. Browser gets it via `localStorage.node_preferences.openrouterApiKey` (manually entered in Settings). **Not** exposed as `VITE_OPENROUTER_API_KEY`.
- `GEMINI_API_KEY` in `.env` is empty — must be set to use Google models.
- Identity injection runs twice on every AI call (patternInjectionService + provider fn) — idempotency guard in `identityInjection.ts:55` prevents double-prefix.
- KB docs are capped at 2000 chars/entry, 8000 chars total (fixed 2026-07-07).
