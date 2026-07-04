# Conventions

## Coding Standards
* **No `any`**: Enforce strict static typing across TypeScript files (especially under Audit mode).
* **Defensive Design**: Include try-catch exception validation blocks on all asynchronous requests/fetch pipelines.
* **Imports**: Group imports by React core, external components/stores, icon packages, and local helper utilities.

## Zustand State Management
* Central state is managed in [useProjectStore.ts](file:///home/workspace/install/store/useProjectStore.ts).
* Use selectors for performance. Avoid duplicate state instantiation in React component files.

## Operational Modes
* **Vibe Mode**: Speed, visual layout, interactive animations using `motion` syntax, upbeat tone.
* **Audit Mode**: Static typing, exception validation, clinical analytical tone, detailed "AUDIT REPORT LOG" output.
