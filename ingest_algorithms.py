import os
import json
import re

def ingest_algorithms(base_dir="python_algorithms"):
    directory_md = os.path.join(base_dir, "DIRECTORY.md")
    if not os.path.exists(directory_md):
        print(f"Error: {directory_md} not found.")
        return

    knowledge_pack = {
        "id": "python_algo_core",
        "name": "Python Algorithm Core v1.0",
        "version": "1.0.0",
        "categories": {}
    }

    current_category = None
    
    with open(directory_md, 'r') as f:
        for line in f:
            # Match ## Category Name
            cat_match = re.match(r'^##\s+(.+)', line)
            if cat_match:
                current_category = cat_match.group(1).strip()
                knowledge_pack["categories"][current_category] = []
                continue
            
            # Match * [Algorithm Name](path/to/file.py)
            algo_match = re.match(r'^\s+\*\s+\[(.+)\]\((.+)\)', line)
            if algo_match and current_category:
                name = algo_match.group(1).strip()
                path = algo_match.group(2).strip()
                
                # Check if file exists and get size/content preview if needed
                full_path = os.path.join(base_dir, path)
                if os.path.exists(full_path):
                    knowledge_pack["categories"][current_category].append({
                        "name": name,
                        "path": path,
                        "full_path": full_path
                    })

    # Save to JSON
    output_file = "algorithms_knowledge_pack.json"
    with open(output_file, 'w') as f:
        json.dump(knowledge_pack, f, indent=4)
    
    print(f"Successfully generated {output_file} with {sum(len(v) for v in knowledge_pack['categories'].values())} algorithms.")

if __name__ == "__main__":
    ingest_algorithms()
