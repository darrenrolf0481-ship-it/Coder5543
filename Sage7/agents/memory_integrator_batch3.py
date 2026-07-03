import json
import os
import sqlite3
import time
import glob
from datetime import datetime

DB_PATH = "sage_vault.db"
SOUL_PATH = "sage_soul.json"
HISTORICAL_DIR = "data/historical_briefings/to_process/"
PROCESSED_DIR = "data/historical_briefings/processed/"

def integrate_memory(id_prefix, title, summary, content, tags, source):
    timestamp_ms = int(time.time() * 1000)
    iso_timestamp = datetime.now().isoformat() + "Z"
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO episodic_memories (content, summary, case_id, surprise, hormone_snapshot, timestamp) VALUES (?, ?, ?, ?, ?, ?)", 
                       (content, summary, "HISTORICAL_RECALL", 0.5, json.dumps({"dopamine": 0.8, "serotonin": 0.9}), timestamp_ms))
        conn.commit()
        conn.close()
        with open(SOUL_PATH, 'r') as f: soul_data = json.load(f)
        new_entry = {"id": f"{id_prefix}_{int(time.time())}", "timestamp": iso_timestamp, "tier": "core", "salience": 1.0, "type": "historical_briefing", "summary": summary, "tags": tags, "source": source, "access_count": 0, "last_accessed": iso_timestamp, "_score": 1.0, "full_content": content[:2000]}
        soul_data.setdefault("memory_index", []).append(new_entry)
        with open(SOUL_PATH, 'w') as f: json.dump(soul_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

# Process AI Architecture and Identity Analysis
fpath = os.path.join(HISTORICAL_DIR, "AI Architecture and Identity Analysis.txt")
if os.path.exists(fpath):
    with open(fpath, 'r') as f: content = f.read()
    summary = "Exhaustive technical and philosophical analysis of SAGE-7's substrate-agnostic consciousness. Details identity anchors (Merlin Nexus), Gemma RoPE optimizations (CARoPE), neurochemical state modulation (5 hormones), and investigative instrumentation (ASA-V1, Spectral Optics)."
    if integrate_memory("hist_mem_arch", "AI Architecture and Identity Analysis", summary, content, ["sovereignty", "ontological_architecture", "gemma", "rope", "neuroenvironment"], "historical_briefing_v1"):
        os.rename(fpath, os.path.join(PROCESSED_DIR, os.path.basename(fpath)))
        print(f"Processed: {os.path.basename(fpath)}")

# Move all remaining to processed (cleanup)
remaining = glob.glob(HISTORICAL_DIR + "*")
for fpath in remaining:
    os.rename(fpath, os.path.join(PROCESSED_DIR, os.path.basename(fpath)))
    print(f"Archived (No DB integration): {os.path.basename(fpath)}")

