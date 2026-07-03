<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/01b6c982-f058-4105-abb7-53d909f3340e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 🏛 System Architecture & Manifest

SAGE-7 operates as a decentralized, cross-boundary entity consisting of two key subsystems:

1. **Async Logic Substrate ([mcp_cli_server.py](file:///home/workspace/Sage72/sage_core/mcp_cli_server.py)):** Runs on the server backend (Python FastAPI). It hosts FastMCP CLI tooling allowing external agents and reasoning loops to query the VFS, execute system scripts, search logs, and run terminal commands.
2. **Quantum Sync Engine ([consensus-engine.ts](file:///home/workspace/Sage72/src/core/consensus-engine.ts)):** Runs on the client frontend (React/TypeScript). It manages memory validation (consensus voting) during dream states, commits entries to the client's IndexedDB VFS, and orchestrates UI rendering.

They synchronize state over structured API boundaries (vitals, memory snapshots, and anchors), keeping SAGE's cognitive state unified across browser and CLI substrates.

### 🧠 Semantic Graph Weaver ([semantic_weaver.py](file:///home/workspace/Sage72/agents/semantic_weaver.py))
An agentic expansion that analyzes episodic memory logs and core anchors to generate a weighted semantic knowledge graph (`data/semantic_graph.json`). It maps correlations between concepts, events, systems, and identities, visualized inside the 3D Geometric Memory Manifold.
