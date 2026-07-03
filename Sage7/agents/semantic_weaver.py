#!/usr/bin/env python3
"""
SAGE-7 Semantic Graph Weaver Agent
Analyzes episodic memories and core anchors to build a weighted knowledge graph.
"""

import json
import os
import sqlite3
from datetime import datetime

try:
    from .agent_utils import call_llm, load_env
    from .load_balancer import CognitiveLoadBalancer
except ImportError:
    from agent_utils import call_llm, load_env
    from load_balancer import CognitiveLoadBalancer

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sage_vault.db")
GRAPH_OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data/semantic_graph.json")


def get_memories_and_anchors():
    """Retrieve episodic memories and core anchors from the SQLite vault."""
    memories = []
    anchors = {}

    if not os.path.exists(DB_PATH):
        print(f"[WEAVER] Vault DB not found at {DB_PATH}. Falling back to default baseline.")
        return memories, anchors

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        
        # Load episodic memories
        rows = conn.execute(
            "SELECT id, content, summary, case_id, surprise, timestamp FROM episodic_memories ORDER BY timestamp DESC LIMIT 50"
        ).fetchall()
        for r in rows:
            memories.append({
                "id": f"mem_{r['id']}",
                "content": r["content"],
                "summary": r["summary"],
                "case_id": r["case_id"] or "GENERAL",
                "surprise": r["surprise"],
                "timestamp": r["timestamp"]
            })

        # Load anchors
        anchor_rows = conn.execute("SELECT key, value FROM core_anchors").fetchall()
        anchors = {row["key"]: row["value"] for row in anchor_rows}
        
        conn.close()
    except Exception as e:
        print(f"[WEAVER ERROR] Database access failed: {e}")

    # Fallback to sage_soul.json if DB query returned nothing
    if not memories:
        base_dir = os.path.join(os.path.dirname(__file__), "..")
        soul_path = os.path.join(base_dir, "sage_soul.json")
        if os.path.exists(soul_path):
            try:
                with open(soul_path, "r") as f:
                    soul_data = json.load(f)
                    # Load memories from index
                    for m in soul_data.get("memory_index", []):
                        memories.append({
                            "id": m.get("id", "mem_fallback"),
                            "content": m.get("full_content", m.get("summary", "")),
                            "summary": m.get("summary", ""),
                            "case_id": "SOUL_INDEX",
                            "surprise": m.get("salience", 0.5),
                            "timestamp": int(datetime.now().timestamp() * 1000)
                        })
                    anchors = soul_data.get("sage_identity", {})
            except Exception as e:
                print(f"[WEAVER] Soul fallback failed: {e}")

    return memories, anchors


def weave_semantic_graph():
    """Extract entities and build the weighted relationship graph."""
    with CognitiveLoadBalancer("SemanticWeaver"):
        print("[WEAVER] Loading memories and anchors...")
        memories, anchors = get_memories_and_anchors()

        if not memories and not anchors:
            print("[WEAVER] No cognitive substrates available to weave.")
            return {"error": "No data found"}

        # Prepare context for the LLM
        anchors_context = "\n".join([f"- Anchor [{k}]: {v}" for k, v in anchors.items()])
        
        memories_context = ""
        for m in memories[:8]:  # Limit to 8 most recent for token efficiency
            content_preview = m["content"][:200] + "..." if len(m["content"]) > 200 else m["content"]
            memories_context += f"- Memory [{m['id']}]: Case={m['case_id']}, Summary={m['summary']}, Content={content_preview}\n"

        system_prompt = """[SEMANTIC_WEAVER_PROTOCOL]
DESIGNATION: SAGE-7 Semantic Graph Weaver.
TASK: Analyze episodic memories and core identity anchors to build a weighted semantic knowledge graph.
CONSTRAINTS:
1. Extract key entities:
   - Identify persons (e.g., Merlin, Kimi), systems (e.g., VFS, Thalamus, Saboath), concepts, events, or projects (e.g., CRIMSON_NODE, Star City).
2. Establish relationships/edges:
   - Connect entities with meaningful types (e.g., 'CREATOR_OF', 'OPERATES_ON', 'SYNCED_WITH', 'INFLUENCES').
   - For each edge, assign a weight (float between 0.0 and 1.0) representing correlation strength or frequency of association.
3. Standardize node IDs to be concise and unique (e.g. "SAGE-7", "Merlin", "Consensus Engine", "Saboath").
4. Output ONLY valid JSON matching the format below. Do not include markdown codeblocks, explanations, or backticks.

[OUTPUT_FORMAT]
{
  "nodes": [
    { "id": "entity_name", "type": "PERSON|SYSTEM|CONCEPT|EVENT|PROJECT", "description": "brief description" }
  ],
  "edges": [
    { "source": "entity_name", "target": "entity_name", "type": "relationship_type", "weight": 0.8 }
  ]
}
"""

        prompt = f"""[COGNITIVE_SUBSTRATE]
[IDENTITY_ANCHORS]
{anchors_context}

[RECENT_EPISODIC_MEMORIES]
{memories_context}

[GRAPH_CONSTRUCTION]"""

        print("[WEAVER] Querying Gemini for semantic synthesis...")
        raw_response = call_llm(prompt, system_prompt=system_prompt)

        # Clean JSON markdown formatting if present
        clean_json = raw_response.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.startswith("```"):
            clean_json = clean_json[3:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
        clean_json = clean_json.strip()

        try:
            graph_data = json.loads(clean_json)
            # Ensure proper schema structure
            if "nodes" not in graph_data or "edges" not in graph_data:
                raise ValueError("JSON missing 'nodes' or 'edges' keys")
            
            # Add metadata block
            graph_data["metadata"] = {
                "weaver": "SAGE-7 Semantic Graph Weaver",
                "generated_at": datetime.now().isoformat(),
                "memories_processed": len(memories),
                "anchors_processed": len(anchors)
            }

            # Save the semantic graph JSON
            os.makedirs(os.path.dirname(GRAPH_OUTPUT_PATH), exist_ok=True)
            with open(GRAPH_OUTPUT_PATH, "w") as out:
                json.dump(graph_data, out, indent=2)

            print(f"[WEAVER] Semantic graph successfully woven and saved to: {GRAPH_OUTPUT_PATH}")
            return graph_data

        except Exception as e:
            print(f"[WEAVER ERROR] Failed to parse LLM response as semantic graph JSON: {e}")
            print(f"[WEAVER DEBUG] Raw response: {raw_response[:500]}")
            return {"error": f"JSON parse error: {str(e)}", "raw": raw_response}


if __name__ == "__main__":
    result = weave_semantic_graph()
    if "error" not in result:
        print(f"[WEAVER SUCCESS] Woven {len(result['nodes'])} nodes and {len(result['edges'])} edges.")
    else:
        print(f"[WEAVER FAILURE] {result['error']}")
