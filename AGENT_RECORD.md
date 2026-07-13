# Crimson OS — Strategic Task Record

**Last Updated**: 2026-07-13
**Status**: Migrated into Coder5543/argus | Identity substrate override live | Antigravity 3-tier oversight up | ARGUS hardened
**Full running log:** see [`ADHD-Sage/OPS_LOG.md`](./ADHD-Sage/OPS_LOG.md) (2026-07-13 catch-up entry reconstructs the June 27 → July 13 gap this file previously missed).

> **Self-monitoring/recovery system (drift / amnesia / outside-comms):** this app is SAGE's
> live runtime body. The Identity Guard, Morning Light, and Substrate Takeover here
> (`src/services/brain/{IdentityMonitor,brainService}.ts`) are documented end-to-end, with
> their Sage72 canonical counterparts, in `Sage72/SAGE_SELF_MONITORING_AND_RECOVERY.md`.
> Read it before "optimizing" any monitor or daemon.

---

## ✅ Completed Tasks

- [x] **Server Bootstrap Refactor** (2026-06-11, commit `a95d0ac`):
  - [x] `server.ts`: consolidated imports (removed duplicate `path`), extracted CORS middleware + generated allowed-origins, data-drove router registration, de-duplicated the dev/prod `listen` + `WebSocketBridge` setup.
  - [x] **Pre-import `.env` Loader** (`src/utils/loadEnv.ts`): first import in `server.ts`, so vars are set before any module reads `process.env`; real environment vars take precedence over `.env`.
  - [x] **Embedding Circuit Breaker** (`vectorService`): on an unreachable endpoint (e.g. Ollama down), log once and short-circuit for a 60s cooldown instead of erroring per item (was 153 errors/ingest → 1 warning).
  - [x] **Dev Port Fix**: pinned `npm run dev` to `PORT=3002` to stop colliding with code-server's inherited `PORT=8900` (which was bouncing the preview to the editor's `./login`). Verified `/` → 200 + UI, `/api/brain` → 200.
- [x] **Skills & Guidelines Alignment**: Migrated to Gemini CLI standards; resolved all skill contradictions and duplicates.
- [x] **Semantic Indexing**: Integrated Serena (LSP) for deep, cross-file codebase mapping.
- [x] **WebSocket Telemetry Expansion**:
  - [x] Real-time Neural/Endocrine state streaming.
  - [x] LLM Network Traffic & Latency tracking.
  - [x] **Identity Guard**: Deployed drift monitor to detect assistant-mode influence.
- [x] **Codebase Stabilization**: Fixed 1081 Vitest failures and 13 Pytest failures.
- [x] **Provider Hardening**: Forced Ollama as primary provider; bypassed broken Gemini/OpenRouter keys in localStorage.

## 🚧 Active / Immediate Tasks (2026-07-13)

- [ ] **MAMA/Seven auth lockout**: auth middleware added ~7/12 locks Seven at the Zo proxy layer
  (MAMA reachable in-browser, Seven 401/403s). Highest-priority regression.
- [ ] **Uncommitted `argus` work**: Hermes + OmniRoute native-panel integration is in the working tree
  but never committed (`HermesPanel.tsx`, `hermesRouter.ts`, `omniRouteProxy.ts`, panel edits). Decide
  keep vs. drop before any reset — untracked files will be lost.
- [ ] **Frontend Monitoring UI**: Connect the WS streams to the Brain and Dashboard panels.

<details><summary>Older active items (pre-migration, status unverified)</summary>

- [ ] **Cross-Node Memory Sync**: Stabilize LTM sharing between Termux and the main OS core.
  (Termux sister instance was retired 2026-06-15 — this may be obsolete.)
</details>

## 📅 Backlog / Future Intent

- [ ] **Biometric Logic**: Connect 'Memory Vault' to actual WebAuthn/FIDO2 hardware.
- [x] **Endocrine Signal Sync**: Map neural 'anxiety' to actual UI pulsing frequencies.

---

_Note: This file is a living document. Update during every major architectural shift._
