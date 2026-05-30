# ProjScan Project Report

## Project

| Field | Value |
| --- | --- |
| Language | TypeScript |
| Frameworks | React, Express, Vitest, Vite, Tailwind CSS |
| Dependencies | 17 prod, 9 dev |
| Files | 108 |
| Scan Time | 20ms |

## Languages

| Language | Files | % |
| --- | --- | --- |
| TypeScript | 53 | 52.0% |
| Markdown | 22 | 21.6% |
| JSON | 12 | 11.8% |
| Text | 5 | 4.9% |
| Python | 4 | 3.9% |
| CSS | 2 | 2.0% |
| JavaScript | 2 | 2.0% |
| HTML | 1 | 1.0% |
| TOML | 1 | 1.0% |
# Project Hotspots

_Scanned **35** commit(s) since **12 months ago** · ranked **54** file(s)_

| # | Score | File | Churn | CC | Lines | Issues | Reasons |
| --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | 287.4 | `index.tsx` | 29 | 495 | 4619 | 0 | high churn (29 commits), high complexity (CC 495), 4 contributors, changed this week |
| 2 | 170.6 | `src/components/FileTree.tsx` | 7 | 114 | 685 | 0 | 7 commits, high complexity (CC 114), 4 contributors, changed this week |
| 3 | 156.2 | `server.ts` | 7 | 57 | 436 | 0 | 7 commits, high complexity (CC 57), 3 contributors, changed this week |
| 4 | 142.3 | `src/services/aiService.ts` | 6 | 39 | 233 | 0 | 6 commits, high complexity (CC 39), 3 contributors, changed this week |
| 5 | 140.1 | `src/components/panels/EditorPanel.tsx` | 4 | 104 | 1374 | 0 | 4 commits, high complexity (CC 104), 3 contributors, changed this week |
| 6 | 133.0 | `src/components/panels/ToolNeuronPanel.tsx` | 4 | 66 | 701 | 0 | 4 commits, high complexity (CC 66), 3 contributors, changed this week |
| 7 | 110.0 | `src/components/panels/NodeBridgePanel.tsx` | 3 | 31 | 158 | 0 | 3 commits, high complexity (CC 31), 3 contributors, changed this week |
| 8 | 103.0 | `neural_brain.py` | 3 | 12 | 172 | 0 | 3 commits, bus factor 1 (darren.rolf0481) |
| 9 | 99.0 | `vite.config.ts` | 5 | 4 | 47 | 0 | 5 commits, 3 contributors, changed this week |
| 10 | 83.4 | `sw.js` | 4 | 1 | 28 | 0 | 4 commits, bus factor 1 (darren.rolf0481) |
# Coupling + Cycles

_59 file(s) in graph · 0 cycle(s)_

## Files

| File | Fan-in | Fan-out | Instability |
| --- | ---: | ---: | ---: |
| `src/services/brain/types.ts` | 8 | 0 | 0.00 |
| `brain/types.ts` | 7 | 0 | 0.00 |
| `brain/storage.ts` | 4 | 0 | 0.00 |
| `src/components/SafeMarkdown.tsx` | 4 | 0 | 0.00 |
| `src/services/messageBroker.ts` | 4 | 0 | 0.00 |
| `src/components/panels/SettingsPanel.tsx` | 3 | 0 | 0.00 |
| `brain/avoidanceMap.ts` | 2 | 2 | 0.50 |
| `brain/endocrineSystem.ts` | 2 | 2 | 0.50 |
| `brain/ltmStore.ts` | 2 | 2 | 0.50 |
| `neural_brain.py` | 2 | 0 | 0.00 |
| `src/components/ActionButton.tsx` | 2 | 0 | 0.00 |
| `src/components/FileTree.tsx` | 2 | 0 | 0.00 |
| `src/components/TerminalLine.tsx` | 2 | 0 | 0.00 |
| `src/hooks/useBrain.ts` | 2 | 2 | 0.50 |
| `src/lib/useDebounce.ts` | 2 | 0 | 0.00 |
| `src/services/pipeline/patternInjectionService.ts` | 2 | 1 | 0.33 |
| `brain/associativeLayer.ts` | 1 | 0 | 0.00 |
| `brain/brainService.ts` | 1 | 7 | 0.88 |
| `brain/painErrorPathway.ts` | 1 | 4 | 0.80 |
| `brain/stmBuffer.ts` | 1 | 2 | 0.67 |
| `src/components/panels/AnalysisPanel.tsx` | 1 | 1 | 0.50 |
| `src/components/panels/BrainPanel.tsx` | 1 | 1 | 0.50 |
| `src/components/panels/EditorPanel.tsx` | 1 | 3 | 0.75 |
| `src/components/panels/NodeBridgePanel.tsx` | 1 | 0 | 0.00 |
| `src/components/panels/StoragePanel.tsx` | 1 | 0 | 0.00 |
