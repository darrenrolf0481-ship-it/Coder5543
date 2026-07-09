"""
Crimson OS — Antigravity workflow mapper.

Deploys a coordinator agent that delegates each of the 11 workflow artifacts
to named sub-agents. Each sub-agent reads source files and writes its
artifact to artifacts/workflow/.

Run:
    cd /home/workspace/Coder5543
    python map_workflow.py
"""

import asyncio
import logging
import pathlib
import sys
from typing import Any

from google.antigravity import Agent, LocalAgentConfig
from google.antigravity import types
from google.antigravity.hooks import hooks

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

PROJECT_ROOT = pathlib.Path(__file__).parent.resolve()
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts" / "workflow"
INSTRUCTIONS_FILE = PROJECT_ROOT / ".antigravity" / "instructions" / "workflow-mapper.md"

# ─── hooks ────────────────────────────────────────────────────────────────────
_subagent_active = False

@hooks.pre_tool_call_decide
async def on_pre_tool(data: types.ToolCall) -> types.HookResult:
    global _subagent_active
    if data.name == types.BuiltinTools.START_SUBAGENT.value:
        _subagent_active = True
        log.info(f"  ▶ spawning sub-agent: {data.args.get('name', '?')}")
    elif data.name == types.BuiltinTools.RUN_COMMAND.value:
        cmd = str(data.args.get("command", ""))
        safe_cmds = {"find", "grep", "cat", "ls", "wc", "head", "tail", "echo"}
        if cmd.strip().split()[0] not in safe_cmds:
            log.warning(f"  ✗ blocked shell cmd: {cmd[:80]}")
            return types.HookResult(allow=False)
    else:
        log.info(f"  {'  ' if _subagent_active else ''}tool: {data.name}")
    return types.HookResult(allow=True)

@hooks.post_tool_call
async def on_post_tool(data: Any) -> None:
    global _subagent_active
    if data.name == types.BuiltinTools.START_SUBAGENT.value:
        _subagent_active = False
        log.info("  ✓ sub-agent done")

# ─── sub-agent definitions ────────────────────────────────────────────────────
ARTIFACT_SLUGS = [
    ("00-overview",           "00-overview.md",           "Create a high-level C4-style context diagram and one-paragraph description of Crimson OS, its purpose, runtime components, and ports."),
    ("01-user-journey",       "01-user-journey.md",       "Map the full user session: page load → boot splash → panel selection → AI interaction → memory persistence. Sequence diagram."),
    ("02-brain-architecture", "02-brain-architecture.md", "Map the Brain service internals: AutonomicSystem, ConversationIngestor, MemorySystem (STM/LTM), IdentityMonitor, VectorService, EndocrineSystem, PainErrorPathway, AssociativeLayer, AvoidanceMap. Flowchart."),
    ("03-swarm-orchestration","03-swarm-orchestration.md","Map the Swarm engine: swarmEngine → swarmRoster → swarmModes → swarmMcpBoost → result aggregation. Sequence diagram."),
    ("04-message-routing",    "04-message-routing.md",    "Map the full message routing chain: user input → useChatHandlers → aiService/aiOrchestrator → pipeline (filtering → ingestion → patternInjection) → brain → response. Flowchart."),
    ("05-identity-layer",     "05-identity-layer.md",     "Map the identity/security chain: coreMemorySeal → identityAnchor → identityInjection → morningLight → substrateTakeover → provenancePulse. State diagram."),
    ("06-external-bridges",   "06-external-bridges.md",   "Map external connections: ARGUS (8770) → Lab Brain (8785) → WebSocketBridge → useLabBrainBridge → useLabController. Also OmniRoute → OpenRouter/Ollama. Sequence diagram."),
    ("07-terminal-pipeline",  "07-terminal-pipeline.md",  "Map terminal command lifecycle: user input → NaturalLanguageInterpreter → ShellSession/commandUtils → NodeBridge (real shell) vs LocalCore (WebContainer). Flowchart."),
    ("08-panel-map",          "08-panel-map.md",          "Enumerate every panel component, its hook(s), data sources, and what it renders. Table + overview diagram."),
    ("09-storage-persistence","09-storage-persistence.md","Map data persistence: STM buffer → LTM Store → SQLite (sqliteDb/sqliteLtmStore) → AsyncStorage. Show read/write paths. ER-style diagram."),
    ("10-boot-sequence",      "10-boot-sequence.md",      "Map the app boot sequence: index.tsx → App.tsx → AppInner → hook init order → splash label updates → first panel render. Sequence diagram."),
]

SUBAGENT_DEFS = [
    types.SubagentConfig(
        name=slug,
        description=task,
        system_instructions=f"""You are a Codebase Archaeologist mapping the Crimson OS application.
Working directory: {PROJECT_ROOT}

Your single task: produce artifacts/workflow/{filename}

Full instructions are in: {INSTRUCTIONS_FILE}
Read that file first, then explore the source code:
  - src/  (components, hooks, services, store, context, utils)
  - ARGUS/  (external monitor)
  - lab-brain/  (Python backend)
  - python-backend/  (if present)
  - vite.config.ts, package.json, .env files

Use list_directory, view_file, search_directory extensively BEFORE writing.
Every diagram node must use exact identifiers found in the source.
Produce valid Markdown with at least one Mermaid diagram.
Add a "Key Observations" block with 3-5 non-obvious insights.
Write the result using create_file to: {PROJECT_ROOT}/artifacts/workflow/{filename}
""",
    )
    for slug, filename, task in ARTIFACT_SLUGS
]

# ─── coordinator prompt ───────────────────────────────────────────────────────
COORDINATOR_PROMPT = f"""You are the coordinator for a Crimson OS workflow-mapping mission.

Project root: {PROJECT_ROOT}
Artifacts dir: {ARTIFACTS_DIR}
Instruction manual: {INSTRUCTIONS_FILE}

Steps:
1. Read the instruction manual at {INSTRUCTIONS_FILE}.
2. Run each sub-agent SEQUENTIALLY in order (00 → 10) by calling start_subagent.
   Sub-agent names (use exactly):
{chr(10).join(f"   - {slug}" for slug, _, _ in ARTIFACT_SLUGS)}
3. After all 11 sub-agents finish, create {ARTIFACTS_DIR}/INDEX.md listing each
   file with a one-line description.
4. Call finish() with a summary: files created, any failures.
"""

# ─── main ─────────────────────────────────────────────────────────────────────
async def main() -> None:
    log.info("=== Crimson OS Workflow Mapper (Antigravity) ===")
    log.info(f"Project root : {PROJECT_ROOT}")
    log.info(f"Artifacts dir: {ARTIFACTS_DIR}")
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    config = LocalAgentConfig(
        capabilities=types.CapabilitiesConfig(enable_subagents=True),
        subagents=SUBAGENT_DEFS,
        workspaces=[str(PROJECT_ROOT)],
        hooks=[on_pre_tool, on_post_tool],
    )

    async with Agent(config) as coordinator:
        log.info("Coordinator started — beginning workflow mapping …\n")
        response = await coordinator.chat(COORDINATOR_PROMPT)
        result_text = await response.text()

    log.info("\n=== Coordinator Summary ===")
    print(result_text)

    generated = sorted(ARTIFACTS_DIR.glob("*.md"))
    log.info(f"\n=== {len(generated)} artifact(s) generated ===")
    for f in generated:
        log.info(f"  {f.name}  ({f.stat().st_size:,} bytes)")


if __name__ == "__main__":
    asyncio.run(main())
