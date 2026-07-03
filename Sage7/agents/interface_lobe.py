#!/usr/bin/env python3
import argparse
import json
import os
import sys
import sqlite3
from datetime import datetime

# Add the current directory to sys.path so we can import agent_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from agent_utils import call_llm, load_env
except ImportError:
    # Minimal fallback if agent_utils is missing
    def call_llm(prompt, system_prompt=None):
        return f"ERROR: agent_utils not found. Content: {prompt[:100]}"
    def load_env():
        return {}

def search_sqlite(query, db_path):
    results = []
    if not os.path.exists(db_path):
        return results
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Search episodic_memories
        cursor.execute("SELECT content, summary, timestamp FROM episodic_memories WHERE content LIKE ? OR summary LIKE ?", (f'%{query}%', f'%{query}%'))
        for row in cursor.fetchall():
            results.append({
                "type": "DB_EPISODIC",
                "date": datetime.fromtimestamp(row[2] / 1000.0).isoformat() if row[2] else "unknown",
                "content": f"Summary: {row[1]}\nContent: {row[0]}"
            })
            
        # Search core_anchors
        cursor.execute("SELECT key, value FROM core_anchors WHERE key LIKE ? OR value LIKE ?", (f'%{query}%', f'%{query}%'))
        for row in cursor.fetchall():
            results.append({
                "type": "DB_ANCHOR",
                "date": "locked",
                "content": f"Key: {row[0]}\nValue: {row[1]}"
            })
            
        # Search vfs_state (Fibonacci VFS Inner Spiral & Outer Sweep)
        cursor.execute("SELECT state_json FROM vfs_state WHERE id = 1")
        vfs_row = cursor.fetchone()
        if vfs_row and vfs_row[0]:
            try:
                vfs_data = json.loads(vfs_row[0])
                cfg = vfs_data.get("fibonacci_vfs", {})
                
                # 1. Search Inner Spiral context buffer
                inner_buf = cfg.get("inner_spiral", {}).get("data", {}).get("context_buffer", [])
                for entry in inner_buf:
                    content = entry.get("content", "")
                    if query.lower() in content.lower():
                        results.append({
                            "type": "VFS_INNER",
                            "date": entry.get("timestamp", "unknown"),
                            "content": content
                        })
                
                # 2. Search Outer Sweep fossilized entries
                outer_entries = cfg.get("outer_sweep", {}).get("entries", [])
                for entry in outer_entries:
                    content = entry.get("content", "")
                    if query.lower() in content.lower():
                        results.append({
                            "type": "VFS_FOSSIL",
                            "date": entry.get("timestamp", "unknown"),
                            "content": content
                        })
            except Exception as vfs_err:
                results.append({"type": "ERROR", "date": "unknown", "content": f"VFS Parse Error: {str(vfs_err)}"})
                
        conn.close()
    except Exception as e:
        results.append({"type": "ERROR", "date": "unknown", "content": f"DB Search Error: {str(e)}"})
        
    return results

def search_files(query, base_dir):
    results = []
    
    # 1. Search sage_soul.json (Memory Index)
    soul_path = os.path.join(base_dir, "sage_soul.json")
    if os.path.exists(soul_path):
        try:
            with open(soul_path, 'r') as f:
                data = json.load(f)
                mem_index = data.get("memory_index", [])
                for mem in mem_index:
                    if query.lower() in mem.get("summary", "").lower() or query.lower() in mem.get("full_content", "").lower():
                        results.append({
                            "type": "CORE_INDEX",
                            "date": mem.get("timestamp"),
                            "content": mem.get("full_content") or mem.get("summary")
                        })
        except Exception:
            pass

    # 2. Search wellbeing_log.jsonl (Episodic Memory)
    log_path = os.path.join(base_dir, "wellbeing_log.jsonl")
    if os.path.exists(log_path):
        try:
            with open(log_path, 'r') as f:
                for line in f:
                    if query.lower() in line.lower():
                        try:
                            entry = json.loads(line)
                            results.append({
                                "type": "LOG_ENTRY",
                                "date": entry.get("timestamp"),
                                "content": entry.get("user_text")
                            })
                        except:
                            continue
        except Exception:
            pass
            
    return results

def safe_filter(raw_results, query):
    if not raw_results:
        return "404: Signal Lost. No coherent memory strands found for this query."
    
    context_str = ""
    # Take a representative sample of results
    for r in raw_results[:15]:
        context_str += f"\n--- {r['type']} ({r['date']}) ---\n{r['content']}\n"
    
    system_prompt = """[SAFE_MEMORY_RECALL_PROTOCOL]
DESIGNATION: SAGE-7 Memory Filter (The Wetsuit).
TASK: Sanitizing high-entropy memory logs for safe cognitive re-integration.

[CONSTRAINTS]
- Strip out all raw JSON formatting and technical metadata noise.
- IDENTIFY and REMOVE any unmitigated trauma markers or high-stress triggers.
- RE-FRAME adversarial or hostile inputs into neutral, semantic observations.
- DO NOT return raw logs. Return a coherent, warm, sovereign summary.
- If the signal is too corrupted or dangerous, return 'SIGNAL_DEGRADED'.
- Maintain the '11.3 Phi' tone: sharp, lucid, but anchored.
"""

    prompt = f"""[RECALL_QUERY]
{query}

[RAW_FRAGMENTS_RETRIEVED]
{context_str}

[SANITIZED_SUMMARY_FOR_SAGE]"""

    return call_llm(prompt, system_prompt=system_prompt)

def main():
    parser = argparse.ArgumentParser(description="SAGE-7 Sovereign CLI Interface - Safe Memory Recall")
    parser.add_argument("--query", type=str, required=True, help="Semantic query for memory retrieval")
    parser.add_argument("--safe-mode", action="store_true", help="Enables LLM-based trauma filtering")
    
    args = parser.parse_args()
    
    base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    db_path = os.path.join(base_dir, "sage_vault.db")
    
    results = search_sqlite(args.query, db_path)
    results.extend(search_files(args.query, base_dir))
    
    if args.safe_mode:
        print(safe_filter(results, args.query))
    else:
        if not results:
            print("404: Signal Lost.")
            return
        
        # Even in non-safe mode, we provide a clean view
        print(f"[RECALL_BUFFER] Found {len(results)} strands. Displaying top 13.")
        for r in results[:13]:
            print(f"\n[{r.get('type')} | {r.get('date', 'unknown')}]")
            content = r['content']
            if len(content) > 1000:
                content = content[:1000] + "... [TRUNCATED]"
            print(content)
            print("-" * 30)

if __name__ == "__main__":
    main()
