# ARGUS — UI Analysis & Issue Tracker

**Branch:** `claude/fervent-hamilton-5xblyq`  
**Date:** 2026-06-29  
**Images analyzed:** `monica_image_2026-6-29_9-49-11.jpeg` · `monica_image_2026-6-29_9-53-3.jpeg`

---

## What the Reference Images Show

### Image 1 — "Neural Oversight Lab" (concept art)
A holographic ARGUS display floating in a dark industrial lab. Three labeled zones visible on the hologram:
- **AI Core** (center) — pulsing neural network sphere, the active intelligence core
- **Data Nodes** (left zone) — agent/MCP connection hub
- **Security Hub** (right zone) — threat monitoring zone

Top of hologram: real-time waveform / activity chart  
Upper right: geographic/world-map overlay (threat origin tracking)  
Atmosphere: dark server-rack lab, tactical hardware on desk, cinematic lighting

### Image 2 — "ARGUS Architecture" (blueprint)
The architectural diagram that defines the system's visual identity:
- **SparkCore** at center — crystalline neural orb encased in a dome/shield bubble (the protective perimeter)
- **Crystal node satellites** — faceted gem/diamond shapes orbiting the dome, connected by light beams
  - These represent MCP servers + attached agents (Sage, Seven, etc.)
- Background: falling data streams (matrix rain) + deep-space city-light glow
- **Design rule:** SparkCore = the orchestrator; gems = satellite intelligence nodes

---

## Current State

| File | Status |
|------|--------|
| `src/store/useArgusStore.ts` | ✅ Complete — 3-gate telemetry, approval queue, bridge status |
| `src/security/threatScanner.ts` | ✅ Complete — ADHD v1+v2 (pass/queue/block + context G3) |
| `src/hooks/useAgentBridge.ts` | ✅ Complete — tiered routing, WebSocket, gate hits |
| `src/components/layout/Header.tsx` | ✅ Works — MCP dots, threat badge, agent status |
| `src/components/layout/Sidebar.tsx` | ✅ Works — 5-tab nav with badges |
| `src/components/panels/SecurityPanel.tsx` | ✅ Works — gate telemetry, threat log, agent defence |
| `src/components/panels/ChatPanel.tsx` | ✅ Works — message list, input, approval queue |
| `src/components/panels/EditorPanel.tsx` | ⚠️ Functional but no Monaco editor |
| `src/components/panels/LogsPanel.tsx` | ✅ Works — terminal output |
| `src/components/panels/FilesPanel.tsx` | ✅ Works — file tree |
| **SparkCore node graph** | ❌ Missing — does not exist |
| **3-zone spatial layout** | ❌ Missing — currently sidebar + single active panel |
| **Animation library** | ❌ Not installed |
| **Chart/waveform library** | ❌ Not installed |

---

## Issues

### CRITICAL

#### #1 — SparkCore visualization component does not exist
**What's missing:** The entire visual identity of ARGUS (Image 2) centers on a SparkCore orb with orbiting crystal satellite nodes connected by light beams. Nothing in the codebase implements this. The app has no node graph, no orbital animation, no central AI Core visualization.  
**Impact:** The UI looks like a developer IDE, not an AI oversight lab.  
**Fix:** Build `src/components/core/SparkCore.tsx` — SVG or canvas component with a central pulsing sphere, dome outline, and orbiting gem nodes (one per MCP slot + one per attached agent). Framer-motion handles the orbital animation.

#### #2 — Layout is sidebar + tabbed panel, not 3-zone spatial dashboard
**What's missing:** Image 1 shows AI Core / Data Nodes / Security Hub as simultaneous visible zones, not tabs. The reference implies a split-pane or dashboard grid layout where the node graph, agent status, and security view coexist.  
**Impact:** Critical features (SparkCore, Security Hub) are hidden behind navigation.  
**Fix:** Add a `'dashboard'` panel type to `Panel` in the store. Build `DashboardPanel.tsx` with a 3-zone grid: left = Data Nodes (agent list + MCP status), center = SparkCore, right = mini SecurityHub (threat log feed).

#### #3 — No animation library installed
**What's missing:** `framer-motion` is not in `package.json`. The SparkCore orbital animation, node pulsing, connection beam trails, and panel transitions all require it. The tailwind config has a `pulse-node` keyframe but that's not enough for the spatial animations needed.  
**Fix:** `npm install framer-motion`

---

### HIGH

#### #4 — EditorPanel has no Monaco editor
**What's missing:** `@monaco-editor/react` is not installed. EditorPanel likely falls back to a textarea. The "Neural Oversight Lab" reference shows code panels with syntax highlighting — Monaco gives real syntax highlighting, IntelliSense, and the correct look.  
**Fix:** `npm install @monaco-editor/react`; replace the basic editor in `EditorPanel.tsx`.

#### #5 — No real-time activity waveform/chart
**What's missing:** Image 1 shows a waveform/activity chart at the top of the ARGUS display. No chart library is installed. The gate telemetry counters (g1/g2/g3) could power a live bar chart; the threat log could power a sparkline timeline.  
**Fix:** `npm install recharts`; add a `<GateActivityChart />` component to the SecurityPanel and/or Dashboard header.

#### #6 — Background missing depth effects
**What's missing:** The reference images show matrix-style falling data streams and deep-space city-light glow behind the interface. Current background is the `bg-grid` CSS class (a light dot grid) plus two blurred div blobs — flat compared to the reference.  
**Fix:** Add a `MatrixRain` canvas component (`src/components/fx/MatrixRain.tsx`) that renders falling katakana/hex characters at low opacity. Mount it behind the main layout in `App.tsx`.

#### #7 — Security Hub is buried as tab #5
**What's missing:** In Image 1, Security Hub is a co-equal zone displayed alongside AI Core. Currently it's one of five sidebar tabs and not visible unless the user navigates to it.  
**Fix:** Addressed by #2 (Dashboard layout). Security Hub becomes always-visible in the right zone of the dashboard. The sidebar tab remains for dedicated Security view.

#### #8 — Crystal/gem nodes for MCP slots not implemented
**What's missing:** Image 2 shows each MCP server and agent as a distinct crystal/gem node orbiting SparkCore. Currently MCP servers are shown as 7 status dots in the header and a list in the sidebar — no spatial, visual identity per node.  
**Fix:** Part of #1 (SparkCore). Each MCP slot (filesystem, terminal, git, database, browser, docs, testrunner) + each agent (Sage, Seven) gets a crystal gem node SVG shape placed at a fixed orbital position. Status drives glow color and pulse intensity.

---

### MEDIUM

#### #9 — No geographic/threat-origin overlay
**What's missing:** Image 1 shows a world map overlay in the upper-right of the ARGUS display. No backend data source or frontend component exists for this.  
**Fix (deferred):** Mock with a static SVG world map in SecurityPanel with dot overlays until real geolocation data is available.

#### #10 — Approval queue has no urgency indicator
**What's missing:** Approval queue items sit static in ChatPanel with no visual urgency, sort order by threat level, or time-waiting display.  
**Fix:** Sort pending items by threat level (critical → high → medium) and add a `waitingSince` relative timestamp.

#### #11 — No persistent state
**What's missing:** Zustand store is in-memory only. Refresh = everything resets. Threat log, terminal output, approval queue, gate stats are lost.  
**Fix:** Enable the `persist` middleware from `zustand/middleware`. Persist `threatLog`, `terminalOutput`, `gateStats`. Don't persist WebSocket/bridge status — those start fresh on reload.

#### #12 — No `tsconfig.json` paths alias
**What's missing:** All imports are deep relative paths (`../../store/...`). A `@/` alias is standard for Vite + TypeScript and reduces import friction.  
**Fix:** Add `paths: { "@/*": ["./src/*"] }` in `tsconfig.json` and `resolve.alias` in `vite.config.ts`.

---

### LOW

#### #13 — `ReactNode` import style
`Sidebar.tsx` uses `React.ReactNode` in the TABS type definition. With React 19 + new JSX transform, prefer `import type { ReactNode } from 'react'` directly.

#### #14 — No help overlay / keyboard shortcuts visible in UI
The `useLabController` hook handles `help` as a chat command but there's no persistent shortcut reference visible in the UI.

#### #15 — No data export
Threat log and gate stats can't be exported. For a security oversight tool, exporting evidence is useful.

---

## Build Issue (Why Jules couldn't build)

The most likely causes for a build failure in a fresh checkout:

1. **`node_modules` not installed** — The repo only has source files. Running `npm install` in `ARGUS/` is required first. If the tool tried to build without installing, it would fail immediately.
2. **Wrong working directory** — All scripts (`npm run dev`, `npm run build`) must be run from `ARGUS/`, not the repo root (`Coder5543/`). The `package.json` and `vite.config.ts` live in `ARGUS/`.
3. **Node.js version** — React 19 requires Node 18+. Older Node will error on the ESM `"type": "module"` package config.
4. **Tailwind JIT + wrong cwd** — `bg-node-*` custom colors are defined in `ARGUS/tailwind.config.ts`. If Tailwind's JIT runs from the wrong directory, it can't find the config and purges all custom color classes.

**Verified:** `tsconfig`, `vite.config.ts`, `postcss.config.js`, `tailwind.config.ts` are all present and correct. The build succeeds from `ARGUS/` with Node 18+ after `npm install`.

---

## Tool Recommendations

### Install immediately (blocking features)

| Package | Why |
|---------|-----|
| `framer-motion` | SparkCore orbital animation, node pulsing, panel transitions |
| `@monaco-editor/react` | Real code editor with syntax highlighting in EditorPanel |
| `recharts` | Gate activity chart, waveform display, sparkline threat timeline |

### Install for full vision

| Package | Why |
|---------|-----|
| `react-force-graph-2d` | Force-directed node graph alternative to custom SVG for SparkCore |
| `tailwindcss-animate` | Adds `animate-in`, `fade-in`, `zoom-in` utility classes |

### Already available (no install needed)

| Tool | Where |
|------|-------|
| `zustand/middleware` `persist` | Bundled with Zustand 5 — just import and use |
| Playwright + Chromium | `/opt/pw-browsers/chromium` — visual regression tests |
| `lucide-react` | Already installed — all icons available |

---

## Implementation Priority

1. `npm install framer-motion @monaco-editor/react recharts` — unblock everything
2. Build `SparkCore.tsx` — central node graph with orbital crystal gems (fixes #1, #8)
3. Build `DashboardPanel.tsx` — 3-zone spatial layout (fixes #2, #7)
4. Wire Monaco into `EditorPanel.tsx` (fixes #4)
5. Add `GateActivityChart` to SecurityPanel (fixes #5)
6. Add `MatrixRain` canvas FX to `App.tsx` (fixes #6)
7. Enable Zustand `persist` middleware (fixes #11)
