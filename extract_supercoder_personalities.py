import os

base_path = "/storage/emulated/0/coder/coder b/SuperCoder-main (1)/SuperCoder-main/app/prompts"
personalities = []

id_counter = 24 # Start after the previous ones

if os.path.exists(base_path):
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.txt') and not '(1)' in file:
                file_path = os.path.join(root, file)
                name = file.replace('.txt', '').replace('_', ' ').title()
                with open(file_path, 'r') as f:
                    instruction = f.read().strip()
                
                # Truncate instruction if it's too long for a personality description
                # but keep the core idea
                short_instruction = instruction[:500] + "..." if len(instruction) > 500 else instruction
                
                personalities.append({
                    "id": id_counter,
                    "name": f"SuperCoder {name}",
                    "instruction": instruction, # Use full instruction for actual AI logic
                    "active": False,
                    "suggestions": ["generate_code", "fix_bugs", "optimize_logic"]
                })
                id_counter += 1

import json
print(json.dumps(personalities, indent=2))
