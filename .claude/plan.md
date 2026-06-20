# Deep Code Audit & Fix Plan — Crimson OS

User focus areas:
1. **Swarm "hubblings" / updates not working.**
2. **Brain / display for Sage 7 (personality 7).**
3. **General lack of functionality and debug issues.**

---

## What the audit found

### Swarm — hubbling path is dead
- `src/services/eventBus.ts` declares swarm events (`swarm:started`, `swarm:completed`, `swarm:agent_update`, `swarm:error`, `swarm:log`) but **no production code emits them**.
- `src/services/swarm/swarmEngine.ts` publishes `SWARM_CYCLE_START`, `SWARM_CONSENSUS`, `SWARM_CONFLICT` to the message broker, but **nothing subscribes** to those signals.
- `src/services/pipeline/patternInjectionService.ts` has a legacy `swarm_cycle_legacy` pattern that can **never match** a filtered signal and only returns a no-op.
- `src/components/panels/UnifiedResultsPanel.tsx` is the component designed to show cross-panel swarm hubblings, but it is **never mounted** anywhere in the app.
- `useSwarm.ts` only drives local `SwarmCore` UI state; there is no guard against concurrent cycles, and `runtimeAgents.response/keyClaims/confidence` are never populated.

**Root cause:** the swarm produces local reports in the Swarm tab, but it does not produce the cross-panel events / live updates the user calls "hubblings".

### Brain / Sage 7 display — theme leaks everywhere
- `BrainPanel` is reachable and wired; `useBrain` provides all the data it needs.
- Sage 7 theme (cyan/blue) is partially applied via CSS variables in `App.tsx`, but the UI is riddled with **hard-coded crimson** in `index.css`, `Sidebar.tsx`, markdown/code styling, scrollbars, inputs, and splash screen.
- `BrainPanel` uses `bg-accent-500` for cortisol, which becomes cyan under Sage 7 — the semantics invert (stress looks healthy).
- There is **no Sage 7-specific panel logic**; `norepinephrine` (focus/panic) is in the endocrine type but never rendered.
- Light mode uses `filter: invert(1) hue-rotate(180deg)`, which turns Sage 7 cyan into orange/red.

### General functionality / debug — stubs and broken wiring
- `App.tsx:1126` maps `handleGenerateDocs` to `debuggerState.handleToggleCurrentLineBreakpoint` — the editor "Generate Docs" button toggles a breakpoint.
- `useEditorLogic.ts` never listens to Monaco cursor selection, so `cursorLine` stays at `1`; breakpoints always toggle line 1.
- The debugger is an AI-simulation facade; breakpoints are never consulted during "stepping".
- `fsState.editorMode` is set to `preview` for HTML files, but `App.tsx` passes `editorState.editorMode` to `EditorPanel`, so HTML preview does not auto-activate.
- `useAnalysisHandlers.ts:191` passes `brainContext` as the 4th argument to `generateAIResponse`, but that argument is the abort `domain` string — the context is dropped and the domain becomes `"[object Object]"`.
- Most root-level diagnostic scripts target port 3000/3001, but `npm run dev` serves on port 3002.
- Several handlers parse JSON directly with `JSON.parse(response || '{}')` instead of the project’s `extractJson` helper, so markdown-wrapped responses reliably throw.

---

## Proposed fix approach

I will run a **multi-agent workflow** to fix the highest-impact issues in parallel, then a final verification pass. Each agent works on one focused area to avoid cross-file conflicts.

### Phase 1 — Fan-out fixes (parallel)

| Agent | Scope | Deliverable |
|---|---|---|
| **Swarm Events Agent** | `useSwarm.ts`, `swarmEngine.ts`, `eventBus.ts`, `ToolNeuronPanel.tsx`, `UnifiedResultsPanel.tsx` | Emit `eventBus` swarm events from the engine; mount `UnifiedResultsPanel` in `App.tsx` (or a hubbling strip); guard against concurrent cycles; populate `runtimeAgents` responses so the orbital view can show live updates. |
| **Sage 7 Display Agent** | `index.css`, `Sidebar.tsx`, `BrainPanel.tsx`, `App.tsx` | Scope hard-coded crimson behind CSS variables; add a Sage 7 branch in `BrainPanel` that renders `norepinephrine` and uses appropriate semantic colors; update splash/meta theme-color when personality changes; stop hue-rotating accent colors in light mode. |
| **Editor / Debugger Agent** | `App.tsx`, `useEditorLogic.ts`, `useDebuggerHandlers.ts`, `useDebuggerLogic.ts`, `EditorPanel.tsx` | Wire Monaco cursor selection to `cursorLine`; fix `handleGenerateDocs` prop mapping; make breakpoints target the real cursor line; replace direct `JSON.parse` with `extractJson` where applicable; wire `fsState.editorMode` into `EditorPanel` so HTML files auto-preview. |
| **Analysis / Diagnostics Agent** | `useAnalysisHandlers.ts`, `useForgeHandlers.ts`, `useChatHandlers.ts`, root `diagnostic*.js` / `check_*.js` / `verify_load.js` / `debug_*.js` / `inspect_page.cjs` / `dump_dom.js` | Fix `generateAIResponse` argument order for `getRefactoringSuggestions`; replace unsafe `JSON.parse` with `extractJson`; update diagnostic script default ports to 3002 and make them respect `process.env.PORT`. |

### Phase 2 — Cross-cutting verification (sequential)

| Agent | Scope | Deliverable |
|---|---|---|
| **Integration Verifier** | `npm run lint`, `npx vitest run`, manual dev-server smoke tests | Confirm all touched files type-check, existing/new tests pass, and the fixed features behave correctly in a running dev server (swarm events fire, Sage 7 theme applies, Generate Docs runs, breakpoints follow cursor, HTML preview works). |

### Out of scope (for this pass)

- Full PTY / interactive shell support in the terminal.
- Rewriting the identity-injection / monitoring layers.
- Adding CI/GitHub Actions.
- Replacing the debugger facade with a real runtime debugger.

---

## Acceptance criteria

1. `npm run lint` passes.
2. `npx vitest run` passes for existing tests and any new tests added.
3. The Swarm tab’s `Trigger Cycle` button emits cross-panel events that `UnifiedResultsPanel` (or a mounted hubbling strip) can display.
4. Selecting Sage 7 changes the sidebar glow, BrainPanel accent colors, and splash/meta theme to cyan/blue consistently.
5. The editor "Generate Docs" button generates docs, not breakpoints.
6. Clicking in the Monaco editor updates the current line; toggling a breakpoint affects that line.
7. Opening an HTML file from the FileTree switches the editor to preview mode.
8. Root diagnostic scripts work against `npm run dev` on port 3002.
9. `getRefactoringSuggestions` correctly passes `brainContext` in the options bag.
