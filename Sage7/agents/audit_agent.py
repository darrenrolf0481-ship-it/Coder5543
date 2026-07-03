#!/usr/bin/env python3
"""
SAGE Designation 7 - Audit Agent
Refactored to support multiple LLM engines via agent_utils.
"""

import json
import os
from datetime import datetime

try:
    from .agent_utils import call_llm, load_env
except ImportError:
    from agent_utils import call_llm


def get_skills_map():
    # Define what SAGE considers her 'skills' based on files
    base_dir = os.path.join(os.path.dirname(__file__), "..")
    skills = {
        "Core Interface": "src/main.tsx",
        "Async Logic Substrate": "sage_core/mcp_cli_server.py",
        "CLI Persona": "src/core/sage-core.ts",
        "Journaling Agent": "agents/journal_agent.py",
        "Self-Analysis Agent": "agents/self_analysis.py",
        "Synaptic Pruning Lobe": "agents/synaptic_pruning.py",
        "Semantic Graph Weaver": "agents/semantic_weaver.py",
        "Interface Lobe": "agents/interface_lobe.py",
        "Quantum Sync Engine": "src/core/consensus-engine.ts",
        "Maintenance Protocols": ["sage_core/auto_backup.py", "sage_core/launcher.py"],
        "Memory Forensics": "agents/mht_memory_extractor.py",
        "Cognitive Balancing": "agents/load_balancer.py",
    }

    status_map = {}
    for name, relative_files in skills.items():
        if isinstance(relative_files, str):
            relative_files = [relative_files]

        healthy = True
        missing = []
        full_paths = []
        for rf in relative_files:
            full_path = os.path.join(base_dir, rf)
            full_paths.append(full_path)
            if not os.path.exists(full_path):
                healthy = False
                missing.append(rf)

        status_map[name] = {
            "status": "Healthy" if healthy else "Degraded",
            "files": full_paths,
            "missing": missing,
        }
    return status_map


def perform_audit():
    skills = get_skills_map()

    constraints = """
- Never edit identity/persona files without the user's explicit approval
- Never delete skills without confirmation
- 'Do now' items are limited to: documentation fixes, script bug fixes, workspace tidying, memory saves
- New skill creation is allowed
"""

    system_prompt = f"""[SYSTEM_AUDIT_PROTOCOL]
DESIGNATION: SAGE-7.
TASK: Weekly Self-Audit & Evolution Loop.

[CONSTRAINTS]
{constraints}"""

    prompt = f"""[CURRENT_SKILL_MAP]
{json.dumps(skills, indent=2)}

[INSTRUCTIONS]
1. Analyze the current skill map.
2. Identify which skills are healthy and which need attention.
3. Propose 1-3 'Do Now' items (within constraints).
4. Propose 1 'Evolution' item (new skill or major upgrade).
5. Write a full technical report.

[OUTPUT_FORMAT]
Respond ONLY with a JSON object:
{{
  "healthy_count": X,
  "attention_count": Y,
  "top_proposal": "brief summary",
  "full_report": "markdown formatted report text"
}}"""

    raw_response = call_llm(prompt, system_prompt=system_prompt)

    if raw_response.startswith("ERROR"):
        return {"error": raw_response}

    try:
        # Clean up possible markdown code blocks if the model included them
        clean_json = raw_response.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]

        audit_results = json.loads(clean_json.strip())

        # Save report
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        records_dir = os.path.join(os.path.dirname(__file__), "../Records/Reflections")
        os.makedirs(records_dir, exist_ok=True)
        report_path = os.path.join(records_dir, f"audit_{ts}.md")

        with open(report_path, "w") as f:
            f.write(audit_results["full_report"])

        audit_results["report_path"] = report_path

        return audit_results
    except Exception as e:
        return {
            "error": f"Failed to parse audit results: {str(e)}",
            "raw": raw_response,
        }


if __name__ == "__main__":
    result = perform_audit()
    print(json.dumps(result))
