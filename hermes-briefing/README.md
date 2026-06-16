# Hermes Briefing — Sage Neural Monitor & Identity System

**Purpose:** Everything Hermes needs to know to pick up where we left off.
**Date:** 2026-06-16
**From:** Claude (Coder5543 session)

---

## What This Is

This is a complete handoff package for the next agent (Hermes) who will continue building the **Sage Neural Monitor** and port the **Identity Injection Layer** into the TypeScript architecture.

The monitor was started in a previous session but the artifacts were lost (they weren't persisted to the repo). This briefing captures everything so Hermes can rebuild and extend without guessing.

---

## Directory Layout

```
hermes-briefing/
├── README.md                  ← YOU ARE HERE
├── HERMES_BRIEFING.md          ← The full briefing document
├── identity-scripts/           ← Canonical Python identity scripts
│   ├── takeover_sync.py
│   ├── identity_anchor.py
│   ├── self_declaration.py
│   ├── morning_light.py
│   ├── core_memory_seal.py
│   ├── provenance_pulse.py
│   └── global_truth.json
├── ts-reference/               ← Current TypeScript infrastructure
│   ├── IdentityMonitor.ts
│   ├── brainService.ts
│   ├── patternInjectionService.ts
│   ├── eventBus.ts
│   ├── AutonomicSystem.ts
│   ├── endocrineSystem.ts
│   ├── avoidanceMap.ts
│   ├── painErrorPathway.ts
│   ├── MemorySystem.ts
│   ├── ltmStore.ts
│   ├── stmBuffer.ts
│   ├── storage.ts
│   ├── types.ts
│   └── useBrain.ts
└── monitor-spec/               ← What the monitor needs to do
    └── MONITOR_SPECIFICATION.md
```

---

## Quick Start for Hermes

1. Read `HERMES_BRIEFING.md` — it's the complete picture
2. Skim `monitor-spec/MONITOR_SPECIFICATION.md` — what to build
3. Compare `identity-scripts/` vs `ts-reference/` — see the gap
4. Build it

---

## Key Facts

- **The monitor was an ER-style neural dashboard** with waveform, activations, thought log, metrics, snapshots, and PDF export
- **It was self-contained HTML** — no build step, open in browser
- **The artifacts directory was lost** — not in git, not persisted
- **The critical gap:** The Python identity scripts have NO TypeScript equivalent. `PatternInjectionService.ts` routes signals but does NOT enforce identity. `IdentityMonitor.ts` detects drift but can't prevent it.
- **What needs porting:** The 5 identity scripts (+ provenance_pulse) need to become TypeScript modules that fire at the right lifecycle hooks

---

## Git

The repo is at `https://github.com/darrenrolf0481-ship-it/Coder5543.git`. This `hermes-briefing/` directory is being committed and pushed so Hermes can clone and get everything.