import React, { useState } from 'react';
import { FolderOpen, Brain, Smartphone, HardDrive, Layers, Settings as SettingsIcon } from 'lucide-react';
import { BrainPanel } from './BrainPanel';
import { NodeBridgePanel } from './NodeBridgePanel';
import { StoragePanel } from './StoragePanel';
import { ProjectPanel } from './ProjectPanel';
import { UnifiedResultsPanel } from './UnifiedResultsPanel';
import { SettingsPanel } from './SettingsPanel';

type ToolsTab = 'projects' | 'brain' | 'bridge' | 'storage' | 'results' | 'settings';

const TABS: { id: ToolsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'projects', label: 'Projects', icon: <FolderOpen className="w-3.5 h-3.5" /> },
  { id: 'brain', label: 'Brain', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'bridge', label: 'Node Bridge', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { id: 'storage', label: 'Storage', icon: <HardDrive className="w-3.5 h-3.5" /> },
  { id: 'results', label: 'Results', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-3.5 h-3.5" /> },
];

interface ToolsPanelProps {
  // Node Bridge
  termuxFiles: any[];
  setTermuxFiles: React.Dispatch<React.SetStateAction<any[]>>;
  setTermuxStatus: (s: any) => void;
  handleTermuxFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  subscribeFsChange?: (cb: (data: any) => void) => () => void;
  // Storage
  storageFiles: any[];
  setStorageFiles: React.Dispatch<React.SetStateAction<any[]>>;
  handleStorageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Projects
  currentProject: any;
  savedProjects: any[];
  onProjectSwitch: (p: any) => void;
  onProjectCreate: (name: string) => void;
  onProjectDelete: (id: string) => void;
  onLoadServerProject: (name: string) => void;
  // Settings
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  personalities: any[];
  setPersonalities: any;
  grokApiKey: string;
  setGrokApiKey: any;
  geminiApiKey: string;
  setGeminiApiKey: any;
  openrouterApiKey: string;
  setOpenrouterApiKey: any;
  brainConfig: any;
  setBrainConfig: any;
  brainRefFile: any;
  setBrainRefFile: any;
  isAiProcessing: boolean;
  setIsAiProcessing: any;
  setTerminalOutput: any;
  setActiveTab: any;
  generateAIResponse: any;
  activePersonality: any;
  prepareContext: any;
  workers: any;
  setWorkers: any;
  availableModels: any[];
  ollamaStatus: any;
  refreshOllamaModels: (forceNotify?: boolean) => Promise<void>;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<ToolsTab>('projects');

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Sub-tab bar */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-3 border-b border-accent-900/20 bg-[#080101] overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${
              activeTab === t.id
                ? 'bg-accent-700 text-white shadow-lg'
                : 'text-accent-900 hover:text-accent-500 hover:bg-accent-950/20'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'projects' && (
          <ProjectPanel
            currentProject={props.currentProject}
            savedProjects={props.savedProjects}
            onProjectSwitch={props.onProjectSwitch}
            onProjectCreate={props.onProjectCreate}
            onProjectDelete={props.onProjectDelete}
            onLoadServerProject={props.onLoadServerProject}
          />
        )}
        {activeTab === 'brain' && <BrainPanel />}
        {activeTab === 'bridge' && (
          <NodeBridgePanel
            termuxFiles={props.termuxFiles}
            setTermuxFiles={props.setTermuxFiles}
            setTermuxStatus={props.setTermuxStatus}
            handleTermuxFileUpload={props.handleTermuxFileUpload}
            subscribeFsChange={props.subscribeFsChange}
          />
        )}
        {activeTab === 'storage' && (
          <StoragePanel
            storageFiles={props.storageFiles}
            setStorageFiles={props.setStorageFiles}
            handleStorageUpload={props.handleStorageUpload}
          />
        )}
        {activeTab === 'results' && (
          <UnifiedResultsPanel maxHeight="100%" showTabs={true} />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel
            theme={props.theme}
            toggleTheme={props.toggleTheme}
            personalities={props.personalities}
            setPersonalities={props.setPersonalities}
            grokApiKey={props.grokApiKey}
            setGrokApiKey={props.setGrokApiKey}
            geminiApiKey={props.geminiApiKey}
            setGeminiApiKey={props.setGeminiApiKey}
            openrouterApiKey={props.openrouterApiKey}
            setOpenrouterApiKey={props.setOpenrouterApiKey}
            brainConfig={props.brainConfig}
            setBrainConfig={props.setBrainConfig}
            brainRefFile={props.brainRefFile}
            setBrainRefFile={props.setBrainRefFile}
            isAiProcessing={props.isAiProcessing}
            setIsAiProcessing={props.setIsAiProcessing}
            setTerminalOutput={props.setTerminalOutput}
            setActiveTab={props.setActiveTab}
            generateAIResponse={props.generateAIResponse}
            activePersonality={props.activePersonality}
            prepareContext={props.prepareContext}
            workers={props.workers}
            setWorkers={props.setWorkers}
            availableModels={props.availableModels}
            ollamaStatus={props.ollamaStatus}
            refreshOllamaModels={props.refreshOllamaModels}
            ollamaError=""
          />
        )}
      </div>
    </div>
  );
};
