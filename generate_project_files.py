import os

root_dir = "/data/data/com.termux/files/home/toolneuron-hub"
dirs_to_add = ["skills", "rules"]

def get_files_recursive(path, parent_id):
    entries = []
    for name in os.listdir(path):
        full_path = os.path.join(path, name)
        entry_id = os.path.relpath(full_path, root_dir).replace('/', '_').replace('.', '_')
        if os.path.isdir(full_path):
            entries.append({
                "id": entry_id,
                "name": name,
                "type": "folder",
                "parentId": parent_id,
                "isOpen": False
            })
            entries.extend(get_files_recursive(full_path, entry_id))
        else:
            lang = name.split('.')[-1]
            if lang == 'md': lang = 'markdown'
            elif lang == 'py': lang = 'python'
            elif lang == 'rs': lang = 'rust'
            
            with open(full_path, 'r') as f:
                content = f.read()
            
            entries.append({
                "id": entry_id,
                "name": name,
                "type": "file",
                "parentId": parent_id,
                "language": lang,
                "content": content
            })
    return entries

all_entries = []
for d in dirs_to_add:
    path = os.path.join(root_dir, d)
    if os.path.exists(path):
        all_entries.extend(get_files_recursive(path, d))

import json
print(json.dumps(all_entries, indent=2))
