import os
import re

skills_dir = "/data/data/com.termux/files/home/toolneuron-hub/skills"
personalities = []

for skill_name in os.listdir(skills_dir):
    skill_path = os.path.join(skills_dir, skill_name)
    if os.path.isdir(skill_path):
        skill_md_path = os.path.join(skill_path, "SKILL.md")
        if os.path.exists(skill_md_path):
            with open(skill_md_path, 'r') as f:
                content = f.read()
                
                # Extract name from frontmatter
                name_match = re.search(r'^name:\s*(.*)$', content, re.MULTILINE)
                name = name_match.group(1).strip() if name_match else skill_name
                
                # Extract description from frontmatter
                desc_match = re.search(r'^description:\s*\|\n((?:\s+.*\n)*)', content, re.MULTILINE)
                description = ""
                if desc_match:
                    description = desc_match.group(1)
                    # Clean up indentation
                    lines = description.split('\n')
                    if lines:
                        indent = len(lines[0]) - len(lines[0].lstrip())
                        description = '\n'.join(line[indent:] for line in lines).strip()
                
                # Get main content (after frontmatter)
                main_content = re.sub(r'^---[\s\S]*?---', '', content).strip()
                
                # Combine description and main content as instruction
                instruction = f"{description}\n\n{main_content}".strip()
                
                personalities.append({
                    "name": name.replace('-', ' ').title(),
                    "instruction": instruction
                })

# Print as JSON list
import json
print(json.dumps(personalities, indent=2))
