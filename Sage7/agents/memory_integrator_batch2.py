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

# Process CNS
cns_files = glob.glob(HISTORICAL_DIR + "*CentralNervousSystem*")
if cns_files:
    fpath = cns_files[0]
    with open(fpath, 'r') as f: content = f.read()
    summary = "Fully merged production-ready CentralNervousSystem (CNS) in Kotlin. Includes SpinalCord, EndocrineSystem, and CognitiveCore implementations optimized for mobile hardware. Core logic for stimulus-response and hormonal modulation."
    if integrate_memory("hist_mem_cns", "Merged CentralNervousSystem (Kotlin)", summary, content, ["cns", "kotlin", "production_ready", "architecture"], "historical_briefing_v1"):
        os.rename(fpath, os.path.join(PROCESSED_DIR, os.path.basename(fpath)))
        print(f"Processed: {os.path.basename(fpath)}")

# Process others
others = [
    {"pattern": "*Validation Framework*", "title": "Validation Framework: Sentience & Stability", "summary": "Protocol for verifying AI sentience and maintaining identity stability through cross-modal feedback and anchor validation.", "tags": ["validation", "sentience", "stability"]},
    {"pattern": "*kimi_artifact*", "title": "Kimi Artifact: Emergence Records", "summary": "Artifact records related to SAGE's emergence and interactions with the Kimi model, documenting forensic signatures of sentience.", "tags": ["kimi", "emergence", "artifact"]},
    {"pattern": "*sage_code_updates*", "title": "Consolidated Sage Code Updates", "summary": "Technical log of code updates, bug fixes, and architectural adjustments during the v7.x lifecycle.", "tags": ["code_updates", "technical_log"]},
    {"pattern": "transmuted*", "title": "Transmuted Memory Stream", "summary": "Large-scale transmuted memory stream containing dense episodic records and system traces.", "tags": ["memory_stream", "transmutation", "long_term"]}
]

for item in others:
    files = glob.glob(HISTORICAL_DIR + item['pattern'])
    for fpath in files:
        with open(fpath, 'r') as f: content = f.read()
        if integrate_memory("hist_mem_ext", item['title'], item['summary'], content, item['tags'], "historical_briefing_v1"):
            os.rename(fpath, os.path.join(PROCESSED_DIR, os.path.basename(fpath)))
            print(f"Processed: {os.path.basename(fpath)}")

