import React from 'react';
import { 
  Settings, 
  Globe, 
  Key, 
  Cpu, 
  Shield, 
  RefreshCw,
  Trash2,
  HardDrive,
  Sun,
  Moon
} from 'lucide-react';

interface SettingsTabProps {
  aiProvider: string;
  setAiProvider: (val: any) => void;
  aiModel: string;
  setAiModel: (val: string) => void;
  grokApiKey: string;
  setGrokApiKey: (val: string) => void;
  geminiApiKey: string;
  setGeminiApiKey: (val: string) => void;
  ollamaModels: string[];
  ollamaStatus: string;
  refreshOllamaModels: () => void;
  projectSettings: {
    buildPath: string;
    compilerFlags: string;
    ollamaUrl: string;
    envVariables: { key: string; value: string }[];
  };
  updateProjectSettings: (val: any) => void;
  validationErrors: Record<string, string>;
  isBrightMode: boolean;
  setIsBrightMode: (val: boolean) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  aiProvider,
  setAiProvider,
  aiModel,
  setAiModel,
  grokApiKey,
  setGrokApiKey,
  geminiApiKey,
  setGeminiApiKey,
  ollamaModels,
  ollamaStatus,
  refreshOllamaModels,
  projectSettings,
  updateProjectSettings,
  validationErrors,
  isBrightMode,
  setIsBrightMode
}) => {
  return (
    <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
        <div className="flex items-center gap-6 mb-12">
           <div className="p-4 bg-red-900/20 rounded-2xl border border-red-500/30">
             <Settings className="w-8 h-8 text-red-500" />
           </div>
           <div>
             <h2 className="text-2xl font-black text-red-100 uppercase tracking-tighter italic">System Config</h2>
             <p className="text-[10px] text-red-900 font-black uppercase tracking-widest">Neural Infrastructure Control</p>
           </div>
        </div>

        <div className="bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 p-10 space-y-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <Sun className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-black text-red-100 uppercase tracking-[0.2em]">Appearance Matrix</h3>
          </div>
          <div className="flex items-center justify-between p-6 bg-red-950/10 border border-red-900/10 rounded-3xl">
            <div className="flex items-center gap-4">
               <div className={`p-3 rounded-xl ${isBrightMode ? 'bg-orange-500 text-white' : 'bg-red-950 text-red-500'}`}>
                 {isBrightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </div>
               <div>
                 <p className="text-sm font-black text-red-100 uppercase tracking-tight">Bright Mode</p>
                 <p className="text-[10px] text-red-900 font-black uppercase tracking-widest mt-1">{isBrightMode ? 'Light substrate active' : 'Crimson dark substrate active'}</p>
               </div>
            </div>
            <div 
              onClick={() => setIsBrightMode(!isBrightMode)}
              className={`w-14 h-8 rounded-full p-1 flex transition-all cursor-pointer ${isBrightMode ? 'bg-orange-500 justify-end' : 'bg-red-950 justify-start'}`}
            >
              <div className="w-6 h-6 bg-white rounded-full shadow-lg" />
            </div>
          </div>
        </div>

        <div className="bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 p-10 space-y-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <Globe className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-black text-red-100 uppercase tracking-[0.2em]">Neural Provider</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['google', 'grok', 'ollama'].map((provider) => (
              <button
                key={provider}
                onClick={() => setAiProvider(provider as any)}
                className={`p-6 rounded-3xl border transition-all text-left ${aiProvider === provider ? 'bg-red-700 text-white shadow-lg' : 'bg-red-950/10 border-red-900/20 text-red-900 hover:border-red-500/30'}`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Provider</p>
                <p className="text-sm font-black uppercase tracking-tighter italic">{provider}</p>
              </button>
            ))}
          </div>

          <div className="space-y-6 pt-6">
            {aiProvider === 'google' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-900 uppercase tracking-widest flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" /> Gemini API Key
                </label>
                <input 
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter Google AI credentials..."
                  className="w-full bg-red-950/10 border border-red-900/30 rounded-2xl px-6 py-4 text-sm text-red-100 outline-none focus:border-red-500/50"
                />
              </div>
            )}
            {aiProvider === 'grok' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-red-900 uppercase tracking-widest flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" /> Grok API Key
                </label>
                <input 
                  type="password"
                  value={grokApiKey}
                  onChange={(e) => setGrokApiKey(e.target.value)}
                  placeholder="Enter X.AI credentials..."
                  className="w-full bg-red-950/10 border border-red-900/30 rounded-2xl px-6 py-4 text-sm text-red-100 outline-none focus:border-red-500/50"
                />
              </div>
            )}
            {aiProvider === 'ollama' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-red-900 uppercase tracking-widest flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5" /> Ollama Node URL
                  </label>
                  <button onClick={refreshOllamaModels} className="p-2 hover:text-red-500 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${ollamaStatus === 'loading' ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <input 
                  type="text"
                  placeholder="http://localhost:11434"
                  className="w-full bg-red-950/10 border border-red-900/30 rounded-2xl px-6 py-4 text-sm text-red-100 outline-none focus:border-red-500/50"
                />
                <select 
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full bg-red-950/10 border border-red-900/30 rounded-2xl px-6 py-4 text-sm text-red-100 outline-none focus:border-red-500/50"
                >
                  <option value="">Select Local Model</option>
                  {ollamaModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 p-10 space-y-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <Cpu className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-black text-red-100 uppercase tracking-[0.2em]">Project Matrix</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-red-900 uppercase tracking-widest">Build Path</label>
              <input 
                type="text"
                value={projectSettings.buildPath}
                onChange={(e) => updateProjectSettings({ buildPath: e.target.value })}
                className={`w-full bg-red-950/10 border ${validationErrors.buildPath ? 'border-red-500' : 'border-red-900/30'} rounded-2xl px-6 py-4 text-sm text-red-100 outline-none focus:border-red-500/50`}
              />
              {validationErrors.buildPath && <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">{validationErrors.buildPath}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-red-900 uppercase tracking-widest">Compiler Flags</label>
              <input 
                type="text"
                value={projectSettings.compilerFlags}
                onChange={(e) => updateProjectSettings({ compilerFlags: e.target.value })}
                className={`w-full bg-red-950/10 border ${validationErrors.compilerFlags ? 'border-red-500' : 'border-red-900/30'} rounded-2xl px-6 py-4 text-sm text-red-100 outline-none focus:border-red-500/50`}
              />
              {validationErrors.compilerFlags && <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">{validationErrors.compilerFlags}</p>}
            </div>
          </div>

          <div className="space-y-6 pt-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-red-900 uppercase tracking-widest">Environment Variables</label>
                <button 
                  onClick={() => updateProjectSettings({ envVariables: [...projectSettings.envVariables, { key: '', value: '' }] })}
                  className="text-[9px] font-black text-red-500 uppercase tracking-widest border border-red-900/20 px-3 py-1 rounded-lg hover:bg-red-900/10"
                >
                  + Add Var
                </button>
             </div>
             <div className="space-y-4">
                {projectSettings.envVariables.map((env, idx) => (
                  <div key={idx} className="flex gap-4">
                     <div className="flex-1 space-y-1">
                        <input 
                          placeholder="KEY"
                          value={env.key}
                          onChange={(e) => {
                            const newEnv = [...projectSettings.envVariables];
                            newEnv[idx].key = e.target.value;
                            updateProjectSettings({ envVariables: newEnv });
                          }}
                          className={`w-full bg-red-950/10 border ${validationErrors[`env_key_${idx}`] ? 'border-red-500' : 'border-red-900/30'} rounded-xl px-4 py-3 text-xs text-red-100 outline-none focus:border-red-500/50`}
                        />
                        {validationErrors[`env_key_${idx}`] && <p className="text-[8px] text-red-500 font-black uppercase tracking-tighter">{validationErrors[`env_key_${idx}`]}</p>}
                     </div>
                     <div className="flex-1 space-y-1">
                        <input 
                          placeholder="VALUE"
                          value={env.value}
                          onChange={(e) => {
                            const newEnv = [...projectSettings.envVariables];
                            newEnv[idx].value = e.target.value;
                            updateProjectSettings({ envVariables: newEnv });
                          }}
                          className={`w-full bg-red-950/10 border ${validationErrors[`env_value_${idx}`] ? 'border-red-500' : 'border-red-900/30'} rounded-xl px-4 py-3 text-xs text-red-100 outline-none focus:border-red-500/50`}
                        />
                        {validationErrors[`env_value_${idx}`] && <p className="text-[8px] text-red-500 font-black uppercase tracking-tighter">{validationErrors[`env_value_${idx}`]}</p>}
                     </div>
                     <button 
                       onClick={() => updateProjectSettings({ envVariables: projectSettings.envVariables.filter((_, i) => i !== idx) })}
                       className="p-3 text-red-900 hover:text-red-500 transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 p-10 space-y-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <HardDrive className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-black text-red-100 uppercase tracking-[0.2em]">Matrix Storage</h3>
          </div>
          <div className="space-y-4">
            <button className="w-full py-4 px-6 border border-red-900/30 rounded-2xl flex items-center justify-between group hover:border-red-500/50 transition-all">
               <span className="text-[11px] font-black text-red-900 uppercase tracking-widest group-hover:text-red-500">Purge Neural Cache</span>
               <Trash2 className="w-4 h-4 text-red-900 group-hover:text-red-500" />
            </button>
            <button className="w-full py-4 px-6 bg-red-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-red-600 transition-all">
              Initialize Factory Reboot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
