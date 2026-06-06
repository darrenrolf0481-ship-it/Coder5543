import sys

file_path = 'src/components/panels/SettingsContent.tsx'
with open(file_path, 'r') as f:
    content = f.read()

new_decl = """import { useAppContext } from '../../context/AppContext';

export const SettingsPanelContent: React.FC = () => {
  const {
    theme, toggleTheme,
    personalities, setPersonalities,
    grokApiKey, setGrokApiKey,
    geminiApiKey, setGeminiApiKey,
    isAiProcessing, setIsAiProcessing,
    generateAIResponse, setActiveTab, terminal
  } = useAppContext();

  const setTerminalOutput = terminal.setTerminalOutput;

  // Local state for Brain Config since it's only used here for execution
  const [brainConfig, setBrainConfig] = useState({
    runtime: 'python',
    logic: '',
    mappedPaths: ['/sdcard/Download/Crimson-Weights', '/data/data/com.termux/files/home'],
  });
  const [brainRefFile, setBrainRefFile] = useState<{
    name: string;
    data: string;
    mimeType: string;
  } | null>(null);
"""

start_idx = content.find("export const SettingsPanel: React.FC<SettingsPanelProps> = ({")
if start_idx != -1:
    end_idx = content.find("=> {", start_idx) + 4
    if end_idx != -1:
        content = content[:start_idx] + new_decl + content[end_idx:]
        
        # Also fix the KnowledgeEntry / Personality interfaces since they are imported now
        # Actually it's easier to just remove them from the top.
        content = content.replace("export interface KnowledgeEntry {", "interface KnowledgeEntryLocal {")
        content = content.replace("export interface Personality {", "interface PersonalityLocal {")
        
        with open(file_path, 'w') as f:
            f.write(content)
        print("Successfully updated SettingsContent.tsx (robust)")
    else:
        print("Failed to find end of component declaration.")
else:
    print("Failed to find component declaration.")
