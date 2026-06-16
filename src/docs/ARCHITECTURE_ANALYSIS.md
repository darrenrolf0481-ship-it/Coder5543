# Coder5543 / ToolNeuron Hub — Architecture Analysis

> **Date**: 2026-06-16 | **Scope**: Full codebase scan + architectural log
> **Purpose**: Reference document. Records what exists, what changed, and what the numbers are. Not a task list.

---

## Executive Summary

A projscan sweep scored the project **0/F (full)** initially, **90/A (compact)** after committed remediations. The primary findings were god-objects (EditorPanel, brainService), high cyclomatic complexity (FileTree, useTerminalLogic), and cross-panel communication via prop-drilling. This document catalogs what was found, what was done, and what infrastructure is staged but not yet wired.

---

## 1. Health Metrics

| Metric | Pre-remediation | Current (committed) |
|--------|-----------------|---------------------|
| Health score (projscan) | 0/F (full) | 90/A (compact) |
| EditorPanel hotspot | 193.9 | ~95 |
| brainService fan-out | 6 internal imports | 2 facade imports |
| brainService instability | 0.88 | ~0.22 |
| Dependency cycles | 0 | 0 |

---

## 2. Findings & Changes

### 2.1 EditorPanel.tsx Decomposition ✅ Committed
**What was found**: 2,121 lines, cyclomatic complexity ~194, monolithic sidebar + output area + settings + debug + git + preview in one file.

**What was done**: Extracted into three modules:

| Module | Lines | Responsibility |
|--------|-------|----------------|
| `EditorPanel.tsx` | 1,031 | Layout orchestration, file editing |
| `AssistantSidebar.tsx` | 221 | AI chat sidebar, prompt input, action buttons |
| `OutputPanel.tsx` | 1,239 | Tabbed output: Terminal, Preview, Debug, Git, Settings |

**Design context**:
- OutputPanel contains 5 sub-components (TerminalOutput, PreviewPanel, DebugPanel, GitPanel, SettingsPanel) as named exports
- Props passed explicitly — no context injection; EditorPanel is the single source of truth
- `SafeMarkdown` and `ActionButton` shared components imported, not duplicated

### 2.2 brainService.ts Facade Pattern ✅ Committed
**What was found**: brainService imported from 6 internal modules (STMBuffer, LTMStore, AssociativeLayer, EndocrineSystem, AvoidanceMap, PainErrorPathway), instability 0.88.

**What was done**: Two facade classes:

| Facade | Lines | Groups | Delegates |
|--------|-------|--------|-----------|
| `MemorySystem.ts` | 69 | STMBuffer + LTMStore + AssociativeLayer | `correctInput()`, `getShortTermMemories()`, `pushShortTermMemory()`, `findSimilarExperiences()`, `saveExperience()`, `drainShortTermMemory()`, `pruneOldMemories()` |
| `AutonomicSystem.ts` | 104 | EndocrineSystem + AvoidanceMap + PainErrorPathway | `reward()`, `punish()`, `decayEndocrine()`, `getEndocrineState()`, `getLearningRate()`, `getRiskTolerance()`, `getProcessingMode()`, `shouldAvoid()`, `recordSuccess()`, `recordPain()`, `pruneWeakAvoidance()`, `processPainSignal()` |

**Why facades, not a full re-architecture**: The three autonomic modules form a feedback loop (pain → endocrine → avoidance). A facade keeps them together while reducing brainService's import surface. Same for the memory trio (STM feeds LTM, associative sits atop both).

### 2.3 TermuxBrowser Extraction from FileTree ✅ Committed
**What was found**: FileTree.tsx was 1,255 lines (CC 148). Termux browser (lines 412–701) was an embedded sub-component with its own state and render tree.

**What was done**: Extracted `TermuxBrowser.tsx` (225 lines). FileTree: 1,255 → 671 lines.

### 2.4 Dead Code & Duplicate Cleanup ✅ Committed
- `ask_sage.py` — zero callers, deleted
- 8 duplicate analysis files under `projects/Coder5543/` — identical to root copies, deleted
- `.gitignore` — added `*_report.json`, `project_graph.json`, `ARCHITECTURE_REPORT.md`

### 2.5 Boot-Up Race Condition Fixes ✅ Committed (8 bugs + 4 UI issues)

| Symptom | What was happening | What changed |
|---------|--------------------|--------------|
| WebContainer timeout | No timeout on slow connections | Configurable timeout with retry + fallback |
| MCP process leaks | No tracking on rapid restart | Process reference tracking + kill-before-spawn guard |
| WebSocket reconnect storms | Immediate reconnect with no backoff | Exponential backoff with jitter |
| Brain retry | No delay between retries | Capped retry with delay |
| VFS sync race | Concurrent mount attempts | Sequential mount queue |
| Storage lazy proxy crash | Access before initialization | Guard on uninitialized proxy |
| Executor guard | No concurrency limit | Concurrency limiter added |
| Ollama/WebContainer startup | No retry on transient failure | Retry with backoff |
| Splash bar stuck at 0% | Progress not tracking real phases | Track real phase progress |
| Terminal flicker | No debounce on connect | Debounce Termux connections |
| Tab state desync | Multiple state sources | Single source of truth |
| Analysis panel stale data | No invalidation on tab switch | Invalidate on tab switch |

---

## 3. Staged Infrastructure (Not Yet Wired)

These files exist in the tree but are not integrated into App.tsx:

### 3.1 Event Bus (`src/services/eventBus.ts`)
- 18 event types across 6 domains (swarm, analysis, editor, terminal, brain, git, AI)
- `useEventListener` / `useEventEmitter` React hooks
- 100-event rolling history
- Source tracking
- Integration guide: `INNER_APP_COMMUNICATION.md`

### 3.2 Analysis Service (`src/services/analysisService.ts`)
- `analyzeProject()` — static, security, architecture, performance, deep analysis
- Routes results through the event bus
- `Finding` and `AnalysisResult` typed interfaces
- Singleton instance `analysisService`

### 3.3 Unified Results Panel (`src/components/panels/UnifiedResultsPanel.tsx`)
- Subscribes to event bus, displays results from any source

### 3.4 Project Manager (`src/services/projectManager.ts` + `src/hooks/useProjectManager.ts`)
- Project lifecycle management hook + service

### 3.5 SQLite LTM Store (`src/services/storage/sqliteLtmStore.ts`)
- SQLite-backed long-term memory storage

---

## 4. Security Observations

| Finding | Severity | Current state |
|---------|----------|---------------|
| `serena.key` in git history (commits c82d1db, e821369) | High | Removed from HEAD and `.gitignore`; still present in git history |
| Hardcoded secrets (projscan) | Medium | 16/24 findings addressed; 8 remain as runtime env vars |
| `innerHTML` without DOMPurify in legacy code | Medium | Present in analysis service's static checker |

---

## 5. Notable Modules (High Complexity, Not Yet Refactored)

### 5.1 FileTree.tsx
- 671 lines (was 1,255 before TermuxBrowser extraction), CC still elevated
- Contains TermuxBrowser extraction point, potential TreeRow virtualization surface

### 5.2 useTerminalLogic.ts
- 579 lines, CC 102
- `handleTerminalCommand` is 304 lines (lines 156–460)
- JSDoc documentation partially done (commit `eb42c7d`)

### 5.3 Event Bus Integration
- The bus and analysis service exist but are not wired into App.tsx
- `INNER_APP_COMMUNICATION.md` describes a 4-phase migration path

---

## 6. Module Map (Current State)

```
src/
├── components/
│   ├── panels/
│   │   ├── EditorPanel.tsx        (1031 lines — layout + editor)
│   │   ├── AssistantSidebar.tsx    (221 lines — AI chat sidebar)
│   │   ├── OutputPanel.tsx         (1239 lines — tabbed output)
│   │   ├── UnifiedResultsPanel.tsx (staged — not wired)
│   │   ├── ProjectPanel.tsx        (staged — not wired)
│   │   ├── AnalysisPanel.tsx
│   │   ├── BrainPanel.tsx
│   │   ├── NodeBridgePanel.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── StoragePanel.tsx
│   │   ├── TerminalPanel.tsx
│   │   ├── ToolNeuronPanel.tsx
│   │   └── swarm/
│   ├── FileTree.tsx               (671 lines — TermuxBrowser extracted)
│   ├── TermuxBrowser.tsx          (225 lines — extracted from FileTree)
│   └── SafeMarkdown.tsx, ActionButton.tsx, ...
├── services/
│   ├── brain/
│   │   ├── brainService.ts        (321 lines — imports MemorySystem + AutonomicSystem)
│   │   ├── MemorySystem.ts         (69 lines — facade: STM + LTM + Associative)
│   │   ├── AutonomicSystem.ts      (104 lines — facade: Endocrine + Avoidance + Pain)
│   │   ├── stmBuffer.ts, ltmStore.ts, associativeLayer.ts
│   │   ├── endocrineSystem.ts, avoidanceMap.ts, painErrorPathway.ts
│   │   ├── ConversationIngestor.ts, IdentityMonitor.ts, vectorService.ts
│   │   ├── storage.ts, types.ts
│   │   └── ...
│   ├── eventBus.ts                 (staged — not wired)
│   ├── analysisService.ts          (staged — not wired)
│   ├── projectManager.ts           (staged — not wired)
│   ├── storage/
│   │   └── sqliteLtmStore.ts       (staged — not wired)
│   └── aiService.ts, localCoreService.ts, mcp/, pipeline/, ...
├── hooks/
│   ├── terminal/
│   │   ├── useTerminalLogic.ts    (579 lines — CC 102)
│   │   └── useTerminal.ts
│   ├── useProjectManager.ts        (staged — not wired)
│   ├── useBrain.ts, useSwarm.ts, useWebSockets.ts, ...
│   └── editor/, ...
└── docs/
    ├── ARCHITECTURE_ANALYSIS.md   (this file)
    └── INNER_APP_COMMUNICATION.md (event bus integration guide)
```

---

## 7. Key Metrics Summary

| File | Before | Current | Δ | Status |
|------|--------|---------|---|--------|
| EditorPanel.tsx | 2,121 | 1,031 | −51% | ✅ Committed |
| FileTree.tsx | 1,255 | 671 | −47% | ✅ Committed |
| brainService.ts imports | 6 internal | 2 facades | −67% | ✅ Committed |
| brainService instability | 0.88 | ~0.22 | −75% | ✅ Committed |
| New infrastructure files | — | 8 | +8 | ⏳ Staged, not wired |