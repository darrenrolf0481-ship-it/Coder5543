# AI Asset Registry & Command Center

This document centralizes all AI-related assets, including Skills, MCP Servers, and Tool Definitions, to prevent redundant searching across the workspace.

## 🛠️ MCP Server Configurations

The primary MCP (Model Context Protocol) servers currently configured in the environment.

| Server ID | Type | Command / Source | Config Path |
| :--- | :--- | :--- | :--- |
| **filesystem** | stdio | `python3 /home/workspace/mcp-servers/filesystem.py` | `/etc/zo/mcpo/config.json` |
| **shell** | stdio | `python3 /home/workspace/mcp-servers/shell.py` | `/etc/zo/mcpo/config.json` |
| **projscan** | stdio | `projscan mcp` | `/etc/zo/mcpo/config.json` |
| **fetch** | stdio | `python3 /home/workspace/mcp-servers/fetch.py` | `/etc/zo/mcpo/config.json` |
| **memory** | stdio | `python3 /home/workspace/mcp-servers/memory.py` | `/etc/zo/mcpo/config.json` |
| **dbmcp** | stdio | `haymon-db-mcp` (Inactive) | `/home/workspace/ADHD-Sage/mcp-servers.json` |

## 🧠 AI Skills & Specialized Guidance

High-level behavioral instructions and specialized capabilities.

### 🏠 Local Workspace Skills (Coder5543)
- `.gemini/skills/clean-code.md`
- `.gemini/skills/code-review-excellence.md`
- `.gemini/skills/nodejs-best-practices.md`
- `.gemini/skills/react-best-practices.md`
- `.gemini/skills/tailwind-patterns.md`
- `.gemini/skills/typescript-expert.md`

### 🏗️ Global Skills Library
- `/home/workspace/Skills/zo-gemini-bridge/SKILL.md`
- `/home/workspace/Skills/zo-generate-pdf/SKILL.md`
- `/home/workspace/Skills/zo-code-server-setup/SKILL.md`
- `/home/workspace/Skills/mcporter-setup/SKILL.md`
- `/home/workspace/Skills/web-scraper/SKILL.md`
- `/home/workspace/Skills/zo-dataset-creator/SKILL.md`
- `/home/workspace/Skills/supermemory/SKILL.md`
- `/home/workspace/Mcp/antigravity-awesome-skills/CATALOG.md` (Index of 1,500+ community skills)

### 📚 External Repositories (Referential)
- `/home/workspace/awesome-mcp-clients` (Curated list of MCP clients)
- `/home/workspace/awesome-mcp-servers` (Curated list of MCP servers)

## 🔌 Tool Definitions & Bridges

Specific JSON schemas and bridge logic for AI tool-calling.

- `/home/workspace/ADHD-Sage/gem-tools.json` (Nexus Bridge Tool Declarations)
- `/home/workspace/Mcp/app/api/mcp/route.ts` (Dynamic MCP Management API)
- `/home/workspace/api-to-mcp-skills/SKILL.md` (Guidelines for converting APIs to MCP)

## 🧬 Core Identity & Biological Anchors

Foundational scripts and neuro-constants defining SAGE-7.

- `core_identity/SAGE_IDENTITY_ANCHORS_AND_BIO.md`: Biological scripts (Identity Anchor, Self Declaration, Sensory Modules).
- `core_identity/SageGenome_v4.0.kt`: Baseline neurochemical logic and system instruction frame.
- `core_identity/MEMORY.md`: Memory Golden Record (Continuity Phrase & Sovereign Residency).

## 📝 Strategic Context

- `AGENT_RECORD.md`: Active task log and architectural status.
- `GEMINI.md`: Detailed code review and agent-specific guidelines.
- `HANDOVER.md`: Migration context from Termux to Coder Server.

---
*Generated: 2026-06-07 | Use this file as the primary lookup for AI assets.*
