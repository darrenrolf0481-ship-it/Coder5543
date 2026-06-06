import sys

file_path = 'src/context/AppContext.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add handleTermuxImport to AppContext
new_props = """
  // Node Bridge Handlers
  handleTermuxImport: (name: string, content: string, path: string) => void;
"""

idx = content.find('  // Terminal Handlers')
if idx != -1:
    line_end = content.find('\n', idx)
    content = content[:idx] + new_props + content[line_end + 1:]

with open(file_path, 'w') as f:
    f.write(content)

file_path = 'index.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add handleTermuxImport logic
new_logic = """
  const handleTermuxImport = (name: string, fileContent: string, path: string) => {
    const ext = name.split('.').pop() ?? 'text';
    const langMap: Record<string,string> = { py:'python', js:'javascript', ts:'typescript', tsx:'typescript', jsx:'javascript', html:'html', css:'css', rs:'rust', go:'go', cpp:'cpp', json:'json', md:'markdown', sh:'shell' };
    const newFile = {
      id: `termux_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      name,
      type: 'file' as const,
      parentId: 'root',
      language: langMap[ext] ?? 'text',
      content: fileContent,
    };
    setProjectFiles((prev: any) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setEditorContent(fileContent);
    setEditorLanguage(newFile.language);
    setActiveTab('editor');
    setTerminalOutput((prev: any) => [...prev, `[IMPORT] ${path} → project`]);
  };
"""

idx = content.find('const toggleTheme = ()')
if idx != -1:
    content = content[:idx] + new_logic + content[idx:]

# Add to appContextValue
value_start = '  const appContextValue: any = {'
value_end = '  };'
idx = content.find('terminal, handleTerminalCommand')
if idx != -1:
    new_vars = 'handleTermuxImport, terminal, handleTerminalCommand'
    content = content.replace('terminal, handleTerminalCommand', new_vars)

# Replace NodeBridgePanel in JSX
panel_start = '<NodeBridgePanel'
panel_end = '/>'
idx = content.find(panel_start)
if idx != -1:
    end_idx = content.find(panel_end, idx)
    if end_idx != -1:
        content = content[:idx] + '<NodeBridgePanel />' + content[end_idx + 2:]

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully injected NodeBridge context.")
