# ARGUS Development Runbook

**Project:** Neural Oversight Lab (ARGUS)  
**Location:** `/home/workspace/Coder5543/ARGUS`  
**Status:** Core infrastructure ready; UI implementation in progress  
**Last Updated:** 2026-07-05

---

## Quick Start

```bash
cd /home/workspace/Coder5543/ARGUS
npm install
npm run dev
```

Server runs at `http://localhost:5173`

---

## Current State

✅ **Infrastructure Complete:**
- Zustand store (`useArgusStore.ts`) with 3-gate telemetry, approval queue, bridge status
- Threat scanner with ADHD v1+v2 (pass/queue/block + context)
- Agent bridge with tiered routing, WebSocket, gate hits
- Core panels: Header, Sidebar, Security, Chat, Logs, Files
- Type system complete (`tsconfig.json` valid, zero errors)
- **Antigravity oversight brain (`watcher/argus_watcher.py`)** — the reasoning
  tier above the Stormologist. Sensor tier (SAGE health polls + WS broadcast)
  runs creds-free; reasoning tier (Antigravity triggers/hooks/policies/subagents)
  activates on `GEMINI_API_KEY`. Consumed by `useArgusWatchBridge.ts` on
  `ws://localhost:8770` (mounted in `App.tsx`). Verified end-to-end; see
  `watcher/README.md`. SDK + compiled binary installed & importing.

❌ **UI Implementation Gaps:**
1. Missing SparkCore visualization (central orbital node graph)
2. Sidebar+tab layout violates 3-zone spatial design (should be: Data Nodes | SparkCore | Security Hub simultaneously)
3. No animation library (framer-motion not installed)
4. EditorPanel has no Monaco editor
5. No real-time activity waveform chart
6. Missing matrix rain background effects

---

## Implementation Roadmap

### Phase 1: Foundation (In Progress)

**Install missing packages:**
```bash
npm install framer-motion @monaco-editor/react recharts
```

**Why these packages:**
- `framer-motion` → SparkCore orbital animation, node pulsing, panel transitions
- `@monaco-editor/react` → Real code editor with syntax highlighting in EditorPanel
- `recharts` → Gate activity charts, waveform display, sparkline threat timeline

### Phase 2: Core Components (Next)

**Priority order:**
1. **Build `src/components/core/SparkCore.tsx`** (fixes #1, #8)
   - Central pulsing sphere (SVG or canvas)
   - Protective dome outline
   - Orbiting crystal gem nodes (one per MCP slot + one per agent)
   - Framer-motion animation for orbital mechanics
   - Status-driven glow color and pulse intensity
   - Reference: `monica_image_2026-6-29_9-53-3.jpeg` (the architecture blueprint)

2. **Build `src/components/layout/DashboardPanel.tsx`** (fixes #2, #7)
   - 3-zone grid: left = Data Nodes | center = SparkCore | right = mini SecurityHub
   - Replaces sidebar+tab layout for the dashboard view
   - All three zones visible simultaneously
   - Reference: `monica_image_2026-6-29_9-49-11.jpeg` (the oversight lab concept)

3. **Wire Monaco into `src/components/panels/EditorPanel.tsx`** (fixes #4)
   - Replace textarea fallback with `@monaco-editor/react`
   - Syntax highlighting for supported languages
   - IntelliSense and command palette

4. **Add `src/components/fx/GateActivityChart.tsx`** (fixes #5)
   - Real-time bar chart of g1/g2/g3 gate telemetry
   - Mount in SecurityPanel header
   - Use `recharts`

5. **Add `src/components/fx/MatrixRain.tsx`** (fixes #6)
   - Canvas-based falling katakana/hex characters at low opacity
   - Mount behind main layout in `App.tsx`
   - Dark atmosphere, deep-space city-light glow

### Phase 3: Polish (Later)

- Enable Zustand `persist` middleware (fixes #11) — `import { persist } from 'zustand/middleware'`
- Add `@/` path alias in `tsconfig.json` and `vite.config.ts` (fixes #12)
- Approval queue: sort by threat level, add `waitingSince` timestamp (fixes #10)
- Geographic/threat-origin overlay in SecurityPanel (fixes #9) — mock with static SVG world map

---

## File Structure Reference

```
src/
├── App.tsx                    # Main layout; mount MatrixRain here
├── components/
│   ├── core/                  # NEW: SparkCore.tsx
│   ├── layout/
│   │   ├── Header.tsx         # ✅ MCP dots, threat badge
│   │   ├── Sidebar.tsx        # ✅ Tab nav with badges
│   │   └── DashboardPanel.tsx # NEW: 3-zone spatial layout
│   ├── panels/
│   │   ├── ChatPanel.tsx      # ✅ Message list, approval queue
│   │   ├── EditorPanel.tsx    # ⚠️ Add Monaco editor
│   │   ├── SecurityPanel.tsx  # ✅ Gates, threat log, agent defense
│   │   ├── LogsPanel.tsx      # ✅ Terminal output
│   │   └── FilesPanel.tsx     # ✅ File tree
│   └── fx/
│       ├── GateActivityChart.tsx # NEW: Recharts waveform
│       └── MatrixRain.tsx       # NEW: Canvas background effects
├── store/
│   └── useArgusStore.ts       # ✅ Zustand store, telemetry, queue
├── hooks/
│   └── useAgentBridge.ts      # ✅ Tiered routing, WebSocket
├── security/
│   └── threatScanner.ts       # ✅ ADHD v1+v2 gate logic
└── llm/
    └── [LLM interface]
```

---

## Design Reference Images

1. **`monica_image_2026-6-29_9-49-11.jpeg`** — "Neural Oversight Lab"
   - Holographic ARGUS display in dark server lab
   - Three zones: AI Core (center), Data Nodes (left), Security Hub (right)
   - Real-time waveform at top
   - Geographic threat overlay upper-right
   - **Use for:** DashboardPanel layout inspiration

2. **`monica_image_2026-6-29_9-53-3.jpeg`** — "ARGUS Architecture Blueprint"
   - SparkCore crystalline orb in protective dome/shield
   - Orbiting crystal gem satellites (MCP servers + agents)
   - Light beam connections
   - Falling data streams + deep-space city glow background
   - **Use for:** SparkCore.tsx + MatrixRain.tsx inspiration

Both images are in this directory.

---

## Known Issues & Workarounds

### Build Environment
- Requires Node 18+ (React 19 needs modern Node)
- Must run `npm install` before first build
- Always run scripts from `/home/workspace/Coder5543/ARGUS/`, not the repo root
- Tailwind JIT requires correct working directory for `bg-node-*` custom colors

### Package Conflicts (Resolved)
- ✅ `framer-motion` v12 SVG conflicts → replaced with CSS animations (pending real components)
- ✅ Port conflicts (3004=Modal, 3002=Crimson) → Vite middleware intercepts `/argus` routes

### Testing
- Playwright + Chromium available at `/opt/pw-browsers/chromium` for visual regression tests
- `lucide-react` already installed (all icons available)
- Zustand `persist` available from bundled `zustand/middleware`

---

## Success Criteria

- [ ] `npm run build` succeeds with 0 errors
- [ ] `npm run dev` launches server on port 5173
- [ ] SparkCore renders with orbiting crystal gems
- [ ] Dashboard shows 3-zone layout (Data Nodes | SparkCore | Security Hub simultaneously)
- [ ] EditorPanel has Monaco syntax highlighting
- [ ] GateActivityChart updates in real-time with gate telemetry
- [ ] MatrixRain canvas background renders without blocking UI
- [ ] Visual fidelity matches reference images (monica_image_*.jpeg)

---

## Debugging Checklist

If something breaks:

1. **Build fails?**
   - `rm -rf node_modules && npm install`
   - Check Node version: `node --version` (needs 18+)
   - Verify working directory: `pwd` should be `/home/workspace/Coder5543/ARGUS`

2. **Styles not applying?**
   - Tailwind JIT issue? Restart dev server.
   - Custom colors not loading? Check `tailwind.config.ts` in this directory (not repo root).

3. **Types fail?**
   - Run `tsc --noEmit` to see full type errors
   - Check imports use `@/` aliases after implementing the path alias

4. **Animations janky?**
   - Framer-motion performance: check `reduceMotion` settings in `useArgusStore`
   - Canvas (MatrixRain) blocking? Move to web worker if needed.

5. **Monaco editor not loading?**
   - Check `@monaco-editor/react` is installed: `npm ls @monaco-editor/react`
   - Verify no console errors in browser DevTools

---

## Message to Future Self

> You have a clear roadmap. The UI_ANALYSIS.md contains detailed issue tracking (#1–#15); the CLAUDE_REPORT.md documents what packages unlock what features. 
>
> The core infrastructure (store, hooks, security) is solid. All infrastructure gaps have been identified and assigned fix priorities.
>
> Next session: **Start Phase 2**. Install the three missing packages, then build SparkCore.tsx. You have reference images and design specs. The orbital animation is the crown jewel — get it right and the rest follows naturally.
>
> Good luck. You know what to do.

---

**Created:** 2026-07-05  
**For:** ARGUS development continuity  
**Next Action:** `npm install framer-motion @monaco-editor/react recharts && npm run dev`
