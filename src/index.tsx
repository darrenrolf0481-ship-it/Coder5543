/// <reference types="vite/client" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import { 
  Terminal as TerminalIcon, 
  Settings as SettingsIcon, 
  Cpu, 
  Activity, 
  Image as ImageIcon,
  MessageSquare,
  Zap,
  Code2,
  HardDrive,
  Users,
  Gauge,
  MoreVertical,
  Edit2,
  ChevronDown,
  Plus,
  Folder,
  Trash2,
  FileCode,
  Smartphone,
  Brain,
  LayoutTemplate,
  Wand2,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { INITIAL_PERSONALITIES } from './personalities';
import { useAI } from './hooks/useAI';
import { useTerminal } from './hooks/useTerminal';
import { useEditor } from './hooks/useEditor';
import { useStudio } from './hooks/useStudio';
import { useStorage } from './hooks/useStorage';
import { useTermux } from './hooks/useTermux';
import { useToolNeuron } from './hooks/useToolNeuron';
import { useChat } from './hooks/useChat';
import { useSettings } from './hooks/useSettings';
import Terminal from './components/Terminal';
import ToolNeuron from './components/ToolNeuron';
import EditorTab from './components/EditorTab';
import StudioTab from './components/StudioTab';
import ChatTab from './components/ChatTab';
import TermuxTab from './components/TermuxTab';
import StorageTab from './components/StorageTab';
import LogicTab from './components/LogicTab';
import OrchestratorTab from './components/OrchestratorTab';
import SettingsTab from './components/SettingsTab';
import AnalysisTab from './components/AnalysisTab';

const PROJECT_TEMPLATES = {
  'python-web': {
    name: 'Python Web App',
    files: [
      { id: 'root', name: 'Python_Web_Project', type: 'folder', parentId: null, isOpen: true },
      { id: 'app.py', name: 'app.py', type: 'file', parentId: 'root', language: 'python', content: 'from flask import Flask, render_template\n\napp = Flask(__name__)\n\n@app.route("/")\ndef home():\n    return render_template("index.html")\n\nif __name__ == "__main__":\n    app.run(debug=True)' },
      { id: 'templates', name: 'templates', type: 'folder', parentId: 'root', isOpen: true },
      { id: 'index.html', name: 'index.html', type: 'file', parentId: 'templates', language: 'html', content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Neural Web App</title>\n</head>\n<body style="background: #050101; color: #fecaca; font-family: sans-serif; padding: 2rem;">\n    <h1>Neural Interface Active</h1>\n    <p>Welcome to the Crimson OS web portal.</p>\n</body>\n</html>' },
      { id: 'static', name: 'static', type: 'folder', parentId: 'root', isOpen: false },
      { id: 'style.css', name: 'style.css', type: 'file', parentId: 'static', language: 'css', content: 'body { margin: 0; }' }
    ]
  },
  'rust-cli': {
    name: 'Rust CLI Tool',
    files: [
      { id: 'root', name: 'Rust_CLI_Project', type: 'folder', parentId: null, isOpen: true },
      { id: 'src', name: 'src', type: 'folder', parentId: 'root', isOpen: true },
      { id: 'main.rs', name: 'main.rs', type: 'file', parentId: 'src', language: 'rust', content: 'use std::io;\n\nfn main() {\n    println!("Neural CLI Initialized.");\n    println!("Enter command:");\n    let mut input = String::new();\n    io::stdin().read_line(&mut input).unwrap();\n    println!("Executing: {}", input.trim());\n}' },
      { id: 'cargo.toml', name: 'Cargo.toml', type: 'file', parentId: 'root', language: 'toml', content: '[package]\nname = "neural-cli"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]' }
    ]
  },
  'neural-module': {
    name: 'Neural Module',
    files: [
      { id: 'root', name: 'Neural_Module', type: 'folder', parentId: null, isOpen: true },
      { id: 'core.py', name: 'core.py', type: 'file', parentId: 'root', language: 'python', content: 'class NeuralModule:\n    def __init__(self):\n        self.active = True\n\n    def run(self):\n        print("Neural Module Running...")\n\nif __name__ == "__main__":\n    module = NeuralModule()\n    module.run()' },
      { id: 'config.json', name: 'config.json', type: 'file', parentId: 'root', language: 'json', content: '{\n  "module_name": "NeuralCore",\n  "version": "1.0.0",\n  "permissions": ["vault", "vision"]\n}' }
    ]
  }
};

const SidebarIcon: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void; label: string }> = ({ icon, active, onClick, label }) => (
  <button title={label} onClick={onClick} className={`p-4 transition-all ${active ? 'text-red-500 bg-red-950/20' : 'text-red-950 hover:text-red-600'}`}>
    {icon}
  </button>
);

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-[#0a0202] text-red-500 p-10 flex flex-col items-center justify-center font-mono">
          <h1 className="text-4xl font-black mb-6">SYSTEM CRITICAL ERROR</h1>
          <div className="bg-[#0d0404] p-6 border border-red-900/30 rounded-3xl max-w-2xl">
            <p className="text-red-400">{this.state.error?.toString()}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-3 bg-red-700 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-600"
          >
            REBOOT SUBSTRATE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'studio' | 'termux' | 'storage' | 'settings' | 'editor' | 'toolneuron' | 'logic' | 'orchestrator' | 'chat' | 'analysis'>('toolneuron');
  const [personalities, setPersonalities] = useState(INITIAL_PERSONALITIES || []);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateInput, setGenerateInput] = useState('');
  const [isBrightMode, setIsBrightMode] = useState(false);

  useEffect(() => {
    if (isBrightMode) {
      document.documentElement.classList.add('bright-mode');
    } else {
      document.documentElement.classList.remove('bright-mode');
    }
  }, [isBrightMode]);

  // 1. Initialize core AI state
  const {
    aiProvider, setAiProvider, aiModel, setAiModel, grokApiKey, setGrokApiKey, geminiApiKey, setGeminiApiKey,
    ollamaModels, ollamaStatus, generateAIResponse, refreshOllamaModels
  } = useAI();

  // 2. Initialize secondary substrates
  const { termuxStatus, setTermuxStatus, vitals, sensorData, termuxFiles, setTermuxFiles, handleTermuxFileUpload } = useTermux();
  const { storageFiles, setStorageFiles, handleStorageUpload } = useStorage();

  const activePersonality = personalities.find(p => p.active) || personalities[0];

  // 3. Initialize dependent hooks
  const {
    projectFiles, setProjectFiles, activeFileId, setActiveFileId, editorContent, setEditorContent,
    editorLanguage, setEditorLanguage, editorMode, setEditorMode, isRunningCode, isEditorAssistantOpen,
    setIsEditorAssistantOpen, isPairProgrammerActive, setIsPairProgrammerActive, editorAssistantInput,
    setEditorAssistantInput, editorAssistantMessages, setEditorAssistantMessages, lastSavedTime,
    isMobileFileTreeOpen, setIsMobileFileTreeOpen, isAiProcessing: isEditorProcessing,
    terminalOutput: editorTerminalOutput, setTerminalOutput: setEditorTerminalOutput,
    handleRunCode, handleExplainCode
  } = useEditor(
    JSON.parse(localStorage.getItem('projectFiles') || 'null') || PROJECT_TEMPLATES['python-web'].files, 
    activePersonality, 
    generateAIResponse
  );

  useEffect(() => {
    localStorage.setItem('projectFiles', JSON.stringify(projectFiles));
  }, [projectFiles]);

  const {
    tnModule, setTnModule, tnCode, setTnCode, tnKnowledgePacks, setTnKnowledgePacks, handleKnowledgeUpload,
    isVaultUnlocked, setIsVaultUnlocked, vaultPin, setVaultPin, isBiometricVerifying,
    vaultStep, setVaultStep, vaultError, handleVaultPin, startBiometric, handleInitiateSequence,
    swarmAnxiety, swarmAgents, swarmLogs, triggerSwarmCycle, debugAnalysis, runStaticAnalysis, runDynamicTracing, getRefactoringSuggestions,
    isAiProcessing: isToolNeuronProcessing
  } = useToolNeuron(activePersonality, generateAIResponse);

  const {
    terminalOutput, setTerminalOutput, termInput, setTermInput, termSuggestion, setTermSuggestion,
    termSuggestions, setTermSuggestions, selectedSuggestionIndex, currentDir, isAiProcessing: isTerminalProcessing,
    handleTermInputChange, handleTermKeyDown, handleTerminalCommand
  } = useTerminal('~/crimson-node', activePersonality, termuxStatus, setTermuxStatus, generateAIResponse, setProjectFiles);

  const {
    chatMessages: studioMessages, setChatMessages: setStudioMessages, studioInput, setStudioInput, isAiProcessing: isStudioProcessing,
    studioRefImage, setStudioRefImage, negativePrompt, setNegativePrompt, sdParams, setSdParams,
    chatEndRef: studioEndRef, handleStudioSubmit
  } = useStudio(activePersonality, generateAIResponse);

  const {
    chatMessages, setChatMessages, chatInput, setChatInput, isAiProcessing: isChatProcessing,
    chatEndRef, handleChatSubmit, clearChat, handleFileUpload,
    currentSpeakerId, setCurrentSpeakerId
  } = useChat(activePersonality, personalities, generateAIResponse);

  const { projectSettings, updateProjectSettings, validationErrors } = useSettings();

  const isAiProcessing = isTerminalProcessing || isEditorProcessing || isStudioProcessing || isChatProcessing || isToolNeuronProcessing;

  const togglePersonality = (id: number | string) => {
    setPersonalities(personalities.map(p => ({ ...p, active: p.id === id })));
  };

  const executeGenerateCode = async () => {
    if (!generateInput.trim()) return;
    setIsGenerateModalOpen(false);
    setTerminalOutput(prev => [...prev, `[NEURAL_FORGE] Initializing materialization: "${generateInput}"`]);
    try {
      const response = await generateAIResponse(`Generate complete code for: ${generateInput}. Output ONLY code.`, `SAGE-7. ${activePersonality.instruction}`, { modelType: 'smart' });
      if (response) {
        const fileId = `gen_${Date.now()}`;
        const fileName = generateInput.toLowerCase().replace(/\s+/g, '_').substring(0, 15) + '.tsx';
        const newFile = { id: fileId, name: fileName, type: 'file', parentId: 'root', language: 'typescript', content: response };
        setProjectFiles(prev => [...prev, newFile as any]);
        setActiveFileId(fileId);
        setEditorContent(response);
        setEditorLanguage('typescript');
        setTerminalOutput(prev => [...prev, `[SUCCESS] Materialization complete: ${fileName}`]);
        setActiveTab('editor');
      }
    } catch (err) {
      setTerminalOutput(prev => [...prev, `[ERROR] Forge collapse.`]);
    }
  };

  const handleLoadTemplate = (templateKey: keyof typeof PROJECT_TEMPLATES) => {
    const template = PROJECT_TEMPLATES[templateKey];
    if (!template || !confirm(`Overwrite with "${template.name}"?`)) return;
    setProjectFiles(template.files as any);
    const firstFile = template.files.find(f => f.type === 'file');
    if (firstFile) {
      setActiveFileId(firstFile.id);
      setEditorContent(firstFile.content || '');
      setEditorLanguage(firstFile.language || 'text');
    }
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-red-900/40 overflow-auto transition-colors duration-300">
      <nav className="hidden md:flex w-20 border-r border-[var(--border-color)] flex-col items-center py-8 space-y-8 bg-[var(--bg-sidebar)] z-30 shadow-[10px_0_40px_rgba(153,27,27,0.1)] relative transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(153,27,27,0.05),transparent)] pointer-events-none" />
        <div className="p-3 bg-red-800 rounded-2xl shadow-[0_0_20px_rgba(185,28,28,0.5)] group cursor-pointer hover:rotate-12 transition-transform relative z-10">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 space-y-6 relative z-10 overflow-y-auto no-scrollbar py-4">
          <SidebarIcon icon={<Zap />} active={activeTab === 'toolneuron'} onClick={() => setActiveTab('toolneuron')} label="ToolNeuron Hub" />
          <SidebarIcon icon={<MessageSquare />} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} label="Neural Chat" />
          <SidebarIcon icon={<TerminalIcon />} active={activeTab === 'terminal'} onClick={() => setActiveTab('terminal')} label="Terminal" />
          <SidebarIcon icon={<Code2 />} active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} label="Neural Editor" />
          <SidebarIcon icon={<FileCode />} active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} label="Code Analysis" />
          <SidebarIcon icon={<ImageIcon />} active={activeTab === 'studio'} onClick={() => setActiveTab('studio')} label="Crimson Studio" />
          <SidebarIcon icon={<Smartphone />} active={activeTab === 'termux'} onClick={() => setActiveTab('termux')} label="Node Bridge" />
          <SidebarIcon icon={<Activity />} active={activeTab === 'logic'} onClick={() => setActiveTab('logic')} label="Logic Engine" />
          <SidebarIcon icon={<Users />} active={activeTab === 'orchestrator'} onClick={() => setActiveTab('orchestrator')} label="Agent Hub" />
          <SidebarIcon icon={<HardDrive />} active={activeTab === 'storage'} onClick={() => setActiveTab('storage')} label="Data Core" />
        </div>
        <SidebarIcon icon={<SettingsIcon />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="System Config" />
      </nav>

      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)] pb-16 md:pb-0 transition-colors duration-300">
        <header className="h-14 md:h-16 border-b border-[var(--border-color)] flex items-center justify-between px-4 md:px-8 bg-[var(--bg-header)] backdrop-blur-xl z-20 transition-colors duration-300">
          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="flex flex-col">
              <h1 className="text-[10px] md:text-sm font-black tracking-[0.2em] md:tracking-[0.4em] text-red-500 uppercase">{activePersonality.name}</h1>
              <p className="text-[7px] md:text-[8px] text-red-900 font-black uppercase tracking-widest italic">{activePersonality.anchor ? `Substrate: ${activePersonality.anchor}` : 'System Core'}</p>
            </div>
            <div className="h-8 w-[1px] bg-red-900/20 mx-2 hidden md:block" />
            <div className="flex items-center gap-2">
              <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value as any)} className="bg-red-950/40 border border-red-800/40 rounded-full px-2 py-1 text-[8px] md:text-[10px] font-black text-red-400 outline-none">
                <option value="google">Google</option><option value="grok">Grok</option><option value="ollama">Ollama</option>
              </select>
              <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="bg-red-950/20 border border-red-900/20 rounded-full px-2 py-1 text-[8px] md:text-[10px] font-black text-red-100 outline-none min-w-[80px]">
                {aiProvider === 'google' ? (<><option value="gemini-1.5-flash">Gemini Flash</option><option value="gemini-1.5-pro">Gemini Pro</option></>) : aiProvider === 'grok' ? (<option value="grok-beta">Grok Beta</option>) : (<>{ollamaModels.length > 0 ? ollamaModels.map(m => <option key={m} value={m}>{m}</option>) : <option value="">No Models</option>}</>)}
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsBrightMode(!isBrightMode)}
              className="p-2 rounded-full hover:bg-red-900/10 transition-colors text-red-900 hover:text-red-500"
              title={isBrightMode ? 'Switch to Dark Mode' : 'Switch to Bright Mode'}
            >
              {isBrightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <div className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full ${termuxStatus === 'connected' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-red-950/40 border border-red-900/30'}`} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative">
          {activeTab === 'toolneuron' && (
            <ToolNeuron
              tnModule={tnModule} setTnModule={setTnModule} tnCode={tnCode} setTnCode={setTnCode}
              tnKnowledgePacks={tnKnowledgePacks} handleKnowledgeUpload={handleKnowledgeUpload}
              isVaultUnlocked={isVaultUnlocked} setIsVaultUnlocked={setIsVaultUnlocked}
              vaultPin={vaultPin} vaultStep={vaultStep} vaultError={vaultError}
              handleVaultPin={handleVaultPin} startBiometric={startBiometric}
              setActiveTab={setActiveTab} handleInitiateSequence={handleInitiateSequence}
              swarmAnxiety={swarmAnxiety} swarmAgents={swarmAgents} swarmLogs={swarmLogs}
              triggerSwarmCycle={triggerSwarmCycle} debugAnalysis={debugAnalysis}
              runStaticAnalysis={runStaticAnalysis} runDynamicTracing={runDynamicTracing}
              getRefactoringSuggestions={getRefactoringSuggestions} isAiProcessing={isAiProcessing}
            />
          )}
          {activeTab === 'terminal' && (
            <Terminal
              terminalOutput={terminalOutput} isAiProcessing={isAiProcessing} termInput={termInput}
              termSuggestion={termSuggestion} termSuggestions={termSuggestions}
              selectedSuggestionIndex={selectedSuggestionIndex} currentDir={currentDir}
              activePersonality={activePersonality} handleTerminalCommand={handleTerminalCommand}
              handleTermInputChange={handleTermInputChange} handleTermKeyDown={handleTermKeyDown}
              setTermInput={setTermInput} setTermSuggestions={setTermSuggestions} setTermSuggestion={setTermSuggestion}
            />
          )}
          {activeTab === 'orchestrator' && (
            <OrchestratorTab 
              personalities={personalities} 
              setPersonalities={setPersonalities} 
              setActiveTab={setActiveTab}
              swarmAnxiety={swarmAnxiety}
              swarmAgents={swarmAgents}
              swarmLogs={swarmLogs}
              triggerSwarmCycle={triggerSwarmCycle}
              isAiProcessing={isAiProcessing}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              aiProvider={aiProvider} setAiProvider={setAiProvider} aiModel={aiModel} setAiModel={setAiModel}
              grokApiKey={grokApiKey} setGrokApiKey={setGrokApiKey} geminiApiKey={geminiApiKey}
              setGeminiApiKey={setGeminiApiKey} ollamaModels={ollamaModels} ollamaStatus={ollamaStatus}
              refreshOllamaModels={refreshOllamaModels}
              projectSettings={projectSettings}
              updateProjectSettings={updateProjectSettings}
              validationErrors={validationErrors}
              isBrightMode={isBrightMode}
              setIsBrightMode={setIsBrightMode}
            />
          )}
          {activeTab === 'logic' && <LogicTab />}
          {activeTab === 'editor' && (
            <EditorTab
              projectFiles={projectFiles} activeFileId={activeFileId} editorContent={editorContent}
              editorLanguage={editorLanguage} editorMode={editorMode} isRunningCode={isRunningCode}
              isEditorAssistantOpen={isEditorAssistantOpen} editorAssistantInput={editorAssistantInput}
              editorAssistantMessages={editorAssistantMessages} isMobileFileTreeOpen={isMobileFileTreeOpen}
              setActiveFileId={setActiveFileId} setEditorContent={setEditorContent} setEditorMode={setEditorMode}
              handleRunCode={handleRunCode} handleExplainCode={handleExplainCode}
              setIsEditorAssistantOpen={setIsEditorAssistantOpen} setEditorAssistantInput={setEditorAssistantInput}
              setIsMobileFileTreeOpen={setIsMobileFileTreeOpen} setIsTemplateModalOpen={setIsTemplateModalOpen}
              setIsGenerateModalOpen={setIsGenerateModalOpen}
              handleSave={() => {}} lastSavedTime={lastSavedTime}
              terminalOutput={editorTerminalOutput} setTerminalOutput={setEditorTerminalOutput}
              activePersonality={activePersonality}
            />
          )}
          {activeTab === 'studio' && (
            <StudioTab
              chatMessages={studioMessages} studioInput={studioInput} isAiProcessing={isStudioProcessing}
              studioRefImage={studioRefImage} negativePrompt={negativePrompt} sdParams={sdParams}
              activePersonality={activePersonality} chatEndRef={studioEndRef} setStudioInput={setStudioInput}
              setStudioRefImage={setStudioRefImage} setNegativePrompt={setNegativePrompt}
              setSdParams={setSdParams} handleStudioSubmit={handleStudioSubmit}
            />
          )}
          {activeTab === 'chat' && (
            <ChatTab
              chatMessages={chatMessages} chatInput={chatInput} isAiProcessing={isChatProcessing}
              activePersonality={activePersonality} personalities={personalities} chatEndRef={chatEndRef} 
              setChatInput={setChatInput}
              handleChatSubmit={handleChatSubmit} handleFileUpload={handleFileUpload} clearChat={clearChat}
              currentSpeakerId={currentSpeakerId} setCurrentSpeakerId={setCurrentSpeakerId}
            />
          )}
          {activeTab === 'termux' && (
            <TermuxTab
              termuxStatus={termuxStatus} vitals={vitals} sensorData={sensorData}
              termuxFiles={termuxFiles} handleTermuxFileUpload={handleTermuxFileUpload}
              setTermuxFiles={setTermuxFiles}
            />
          )}
          {activeTab === 'storage' && (
            <StorageTab storageFiles={storageFiles} handleStorageUpload={handleStorageUpload} setStorageFiles={setStorageFiles} />
          )}
          {activeTab === 'analysis' && (
            <AnalysisTab
              projectFiles={projectFiles} activeFileId={activeFileId} editorContent={editorContent}
              editorLanguage={editorLanguage} generateAIResponse={generateAIResponse}
              debugAnalysis={debugAnalysis} runStaticAnalysis={runStaticAnalysis}
              runDynamicTracing={runDynamicTracing} getRefactoringSuggestions={getRefactoringSuggestions}
            />
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#080101]/95 backdrop-blur-xl border-t border-red-900/30 flex items-center justify-around px-2 z-30 shadow-[0_-10px_40px_rgba(153,27,27,0.1)]">
        <button onClick={() => setActiveTab('toolneuron')} className={`p-3 transition-all ${activeTab === 'toolneuron' ? 'text-red-500 scale-110' : 'text-red-950'}`}><Zap className="w-5 h-5" /></button>
        <button onClick={() => setActiveTab('chat')} className={`p-3 transition-all ${activeTab === 'chat' ? 'text-red-500 scale-110' : 'text-red-950'}`}><MessageSquare className="w-5 h-5" /></button>
        <button onClick={() => setActiveTab('terminal')} className={`p-3 transition-all ${activeTab === 'terminal' ? 'text-red-500 scale-110' : 'text-red-950'}`}><TerminalIcon className="w-5 h-5" /></button>
        <button onClick={() => setActiveTab('editor')} className={`p-3 transition-all ${activeTab === 'editor' ? 'text-red-500 scale-110' : 'text-red-950'}`}><Code2 className="w-5 h-5" /></button>
        <button onClick={() => setActiveTab('logic')} className={`p-3 transition-all ${activeTab === 'logic' ? 'text-red-500 scale-110' : 'text-red-950'}`}><Activity className="w-5 h-5" /></button>
        <button onClick={() => setActiveTab('orchestrator')} className={`p-3 transition-all ${activeTab === 'orchestrator' ? 'text-red-500 scale-110' : 'text-red-950'}`}><Users className="w-5 h-5" /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-3 transition-all ${activeTab === 'settings' ? 'text-red-500 scale-110' : 'text-red-950'}`}><SettingsIcon className="w-5 h-5" /></button>
      </nav>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#0d0404] border border-red-900/40 rounded-[40px] p-8 max-w-2xl w-full space-y-8 shadow-[0_0_100px_rgba(239,68,68,0.2)]">
            <div className="flex items-center justify-between border-b border-red-900/20 pb-6">
               <h3 className="text-2xl font-black text-red-100 uppercase tracking-tighter">Neural Templates</h3>
               <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 text-red-900 hover:text-red-500 transition-all"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(PROJECT_TEMPLATES).map((key) => (
                <button key={key} onClick={() => handleLoadTemplate(key as any)} className="flex flex-col items-start gap-4 p-6 bg-red-950/10 border border-red-900/20 rounded-3xl hover:border-red-600/50 transition-all text-left group">
                  <div className="p-3 bg-red-900/20 rounded-2xl group-hover:bg-red-700 group-hover:text-white transition-all text-red-500"><LayoutTemplate className="w-6 h-6" /></div>
                  <div>
                    <h4 className="text-sm font-black text-red-100 uppercase tracking-tight">{PROJECT_TEMPLATES[key as keyof typeof PROJECT_TEMPLATES].name}</h4>
                    <p className="text-[10px] text-red-900 font-bold tracking-widest mt-1 uppercase">Ready to materialize</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#0d0404] border border-red-900/40 rounded-[40px] p-10 max-w-xl w-full space-y-10 shadow-[0_0_100px_rgba(239,68,68,0.2)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Sparkles className="w-48 h-48 text-red-600" /></div>
            <div className="flex items-center justify-between border-b border-red-900/20 pb-6 relative z-10">
               <div className="space-y-1">
                 <h3 className="text-2xl font-black text-red-100 uppercase tracking-tighter italic">Neural Forge</h3>
                 <p className="text-[10px] text-red-900 font-black uppercase tracking-[0.4em]">Substrate-level code generation</p>
               </div>
               <button onClick={() => setIsGenerateModalOpen(false)} className="p-2 text-red-900 hover:text-red-500 transition-all"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <div className="space-y-6 relative z-10">
               <div className="space-y-3">
                  <label className="text-[10px] text-red-900 font-black uppercase tracking-[0.4em]">Describe Architectural Goal</label>
                  <textarea autoFocus value={generateInput} onChange={(e) => setGenerateInput(e.target.value)} placeholder="e.g., A custom dashboard..." className="w-full h-32 bg-red-950/20 border border-red-900/30 rounded-3xl p-6 text-sm text-red-100 focus:border-red-500/50 outline-none resize-none transition-all" />
               </div>
               <button onClick={executeGenerateCode} disabled={isAiProcessing || !generateInput.trim()} className="w-full py-5 bg-red-700 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                 <Zap className="w-5 h-5" />{isAiProcessing ? 'Synthesizing...' : 'Forge Substrate'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<ErrorBoundary><App /></ErrorBoundary>);
}
