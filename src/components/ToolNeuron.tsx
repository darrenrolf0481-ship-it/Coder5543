import React from 'react';
import { 
  MessageSquare, 
  ImageIcon, 
  Database, 
  ShieldCheck, 
  Network, 
  Bug, 
  HelpCircle,
  Zap,
  Fingerprint,
  Lock,
  Unlock,
  Trash2,
  Download,
  Send,
  Activity,
  Users,
  Sparkles,
  FileSearch,
  Brain
} from 'lucide-react';

interface ToolNeuronProps {
  tnModule: string;
  setTnModule: (mod: any) => void;
  tnCode: string;
  setTnCode: (val: string) => void;
  tnKnowledgePacks: any[];
  handleKnowledgeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isVaultUnlocked: boolean;
  setIsVaultUnlocked: (val: boolean) => void;
  vaultPin: string;
  vaultStep: string;
  vaultError: string | null;
  handleVaultPin: (digit: string) => void;
  startBiometric: () => void;
  setActiveTab: (tab: any) => void;
  handleInitiateSequence: () => void;
  // Swarm & Debug
  swarmAnxiety: number;
  swarmAgents: any[];
  swarmLogs: any[];
  triggerSwarmCycle: () => Promise<void>;
  debugAnalysis: any;
  runStaticAnalysis: () => void;
  runDynamicTracing: () => void;
  getRefactoringSuggestions: () => Promise<void>;
  isAiProcessing: boolean;
}

const ToolNeuron: React.FC<ToolNeuronProps> = ({
  tnModule,
  setTnModule,
  tnCode,
  setTnCode,
  tnKnowledgePacks,
  handleKnowledgeUpload,
  isVaultUnlocked,
  setIsVaultUnlocked,
  vaultPin,
  vaultStep,
  vaultError,
  handleVaultPin,
  startBiometric,
  setActiveTab,
  handleInitiateSequence,
  swarmAnxiety,
  swarmAgents,
  swarmLogs,
  triggerSwarmCycle,
  debugAnalysis,
  runStaticAnalysis,
  runDynamicTracing,
  getRefactoringSuggestions,
  isAiProcessing
}) => {
  const [rules, setRules] = React.useState<any[]>([]);
  const [selectedRule, setSelectedRule] = React.useState<string | null>(null);
  const [ruleContent, setRuleContent] = React.useState('');

  React.useEffect(() => {
    if (tnModule === 'rules') {
      fetch('http://localhost:8001/api/rules')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setRules(data); });
    }
  }, [tnModule]);

  const loadRule = (path: string) => {
    setSelectedRule(path);
    fetch(`http://localhost:8001/api/rules/get?path=${encodeURIComponent(path)}`)
      .then(res => res.json())
      .then(data => { if (data.content) setRuleContent(data.content); });
  };

  return (
    <div className="h-full flex flex-col p-0 md:p-8 overflow-hidden bg-[#020204]">
      <div className="flex-1 flex flex-col lg:flex-row gap-0 md:gap-8 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar">
        {/* Module Navigation */}
        <div className="w-full lg:w-72 flex flex-col gap-4 md:gap-6 shrink-0 p-4 md:p-0">
          <div className="bg-[#0d0404]/80 rounded-[30px] md:rounded-[40px] border border-red-900/30 p-6 md:p-8 space-y-6 md:space-y-8 shadow-2xl">
            <div className="space-y-1 md:space-y-2">
               <h3 className="text-lg md:text-xl font-black text-red-100 uppercase tracking-tighter">ToolNeuron</h3>
               <p className="text-[9px] md:text-[10px] text-red-900 font-black tracking-[0.3em] uppercase">Offline AI Ecosystem</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
              {[
                { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
                { id: 'vision', label: 'Vision', icon: <ImageIcon className="w-4 h-4" /> },
                { id: 'knowledge', label: 'Database', icon: <Database className="w-4 h-4" /> },
                { id: 'vault', label: 'Vault', icon: <ShieldCheck className="w-4 h-4" /> },
                { id: 'code', label: 'Logic', icon: <Activity className="w-4 h-4" /> },
                { id: 'rules', label: 'Rules', icon: <ShieldCheck className="w-4 h-4" /> },
                { id: 'swarm', label: 'Swarm', icon: <Network className="w-4 h-4" /> },
                { id: 'debug', label: 'Debug', icon: <Bug className="w-4 h-4" /> },
                { id: 'help', label: 'Guide', icon: <HelpCircle className="w-4 h-4" /> }
              ].map(mod => (
                <button 
                  key={mod.id}
                  onClick={() => {
                    if (mod.id === 'chat') {
                      setActiveTab('chat');
                    } else {
                      setTnModule(mod.id as any);
                    }
                  }}
                  className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all ${tnModule === mod.id ? 'bg-red-700 text-white shadow-lg scale-[1.02]' : 'bg-red-950/10 text-red-900 hover:text-red-500'}`}
                >
                  {mod.icon}
                  <span className="truncate">{mod.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex flex-1 bg-[#0d0404]/80 rounded-[40px] border border-red-900/30 p-8 space-y-6 shadow-2xl overflow-y-auto custom-scrollbar">
             <h4 className="text-[10px] font-black text-red-800 uppercase tracking-[0.4em]">System Status</h4>
             <div className="space-y-4">
                <div className="p-4 bg-red-950/10 rounded-2xl border border-red-900/10">
                   <p className="text-[9px] text-red-900 font-black uppercase mb-2">Local Inference</p>
                   <div className="flex items-center justify-between">
                      <span className="text-[11px] text-red-100 font-bold">GGUF_Llama_3</span>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                   </div>
                </div>
                <div className="p-4 bg-red-950/10 rounded-2xl border border-red-900/10">
                   <p className="text-[9px] text-red-900 font-black uppercase mb-2">Vault Encryption</p>
                   <span className="text-[11px] text-red-100 font-bold">AES-256-GCM</span>
                </div>
             </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 min-w-0 bg-[#0d0404]/80 rounded-none md:rounded-[40px] border-x-0 md:border border-red-900/30 shadow-2xl overflow-y-auto flex flex-col relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.05)_0%,transparent_100%)] pointer-events-none" />
          
          {tnModule === 'chat' && (
            <div className="flex-1 flex flex-col p-6 md:p-10 relative z-10">
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-red-900/20 rounded-2xl border border-red-500/30">
                    <MessageSquare className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-red-100 uppercase tracking-tight">Neural Chat</h2>
                    <p className="text-[10px] text-red-900 font-black uppercase tracking-widest">Secure Local Channel</p>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 mb-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-900/20 flex items-center justify-center shrink-0 border border-red-500/20">
                      <Zap className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="bg-red-950/10 border border-red-900/20 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                      <p className="text-sm text-red-100/80 leading-relaxed">Neural interface established. All communications are end-to-end encrypted and processed locally on this node.</p>
                    </div>
                  </div>
               </div>
               <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Transmitting neural signal..." 
                    className="w-full bg-red-950/10 border border-red-900/30 rounded-2xl px-6 py-4 text-sm text-red-100 placeholder:text-red-950 outline-none focus:border-red-500/50 transition-all"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-red-700 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                    <Send className="w-4 h-4" />
                  </button>
               </div>
            </div>
          )}

          {tnModule === 'code' && (
            <div className="flex-1 flex flex-col p-6 md:p-10 relative z-10">
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-red-900/20 rounded-2xl border border-red-500/30">
                    <Activity className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-red-100 uppercase tracking-tight">Neural Logic</h2>
                    <p className="text-[10px] text-red-900 font-black uppercase tracking-widest">Execute code on this node</p>
                  </div>
               </div>
               
               <div className="flex-1 flex flex-col gap-4">
                  <div className="flex-1 bg-red-950/10 border border-red-900/20 rounded-[30px] p-6 font-mono text-sm relative">
                     <textarea 
                        value={tnCode}
                        onChange={(e) => setTnCode(e.target.value)}
                        className="w-full h-full bg-transparent text-red-100 outline-none resize-none placeholder:text-red-950 custom-scrollbar relative z-10"
                        placeholder="# Transmit neural code here..."
                        spellCheck={false}
                     />
                  </div>
                  <button 
                    onClick={handleInitiateSequence}
                    className="w-full py-4 bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all flex items-center justify-center gap-3"
                  >
                     <Zap className="w-4 h-4" /> Initiate Sequence
                  </button>
               </div>
            </div>
          )}

          {tnModule === 'rules' && (
            <div className="flex-1 flex flex-col p-6 md:p-10 relative z-10">
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-red-900/20 rounded-2xl border border-red-500/30">
                    <ShieldCheck className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-red-100 uppercase tracking-tight">System Rules</h2>
                    <p className="text-[10px] text-red-900 font-black uppercase tracking-widest">Coding Standards & Guidelines</p>
                  </div>
               </div>
               
               <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                  <div className="w-full lg:w-64 space-y-2 overflow-y-auto custom-scrollbar pr-2 shrink-0">
                     {rules.map(rule => (
                        <button 
                          key={rule.path}
                          onClick={() => loadRule(rule.path)}
                          className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRule === rule.path ? 'bg-red-700 text-white' : 'bg-red-950/10 text-red-900 hover:text-red-500 hover:bg-red-950/20'}`}
                        >
                          {rule.name}
                        </button>
                     ))}
                  </div>
                  <div className="flex-1 bg-red-950/10 border border-red-900/20 rounded-[30px] p-8 overflow-y-auto custom-scrollbar">
                     {ruleContent ? (
                        <div className="prose prose-invert prose-red max-w-none text-red-100/80 text-sm whitespace-pre-wrap font-sans">
                           {ruleContent}
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                           <ShieldCheck className="w-12 h-12 text-red-900" />
                           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center italic">Select protocol to visualize...</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {tnModule === 'vault' && (
            <div className="flex-1 flex flex-col items-center justify-center p-10 relative z-10">
              {!isVaultUnlocked ? (
                <div className="max-w-md w-full space-y-10 text-center">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-red-600 blur-[60px] opacity-20 animate-pulse" />
                    <ShieldCheck className="w-24 h-24 text-red-600 relative z-10 mx-auto" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-red-100 uppercase tracking-tighter italic">Secured Vault</h2>
                    <p className="text-[10px] text-red-900 font-black uppercase tracking-[0.4em]">Biometric or Pin Verification Required</p>
                  </div>
                  
                  {vaultError && (
                    <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-500 font-black text-[10px] uppercase tracking-widest animate-bounce">
                      {vaultError}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button 
                        key={num}
                        onClick={() => handleVaultPin(num.toString())}
                        className="w-full aspect-square bg-red-950/10 border border-red-900/20 rounded-2xl flex items-center justify-center text-xl font-black text-red-900 hover:bg-red-700 hover:text-white hover:border-red-500 transition-all"
                      >
                        {num}
                      </button>
                    ))}
                    <button onClick={startBiometric} className="col-span-3 py-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-red-900 hover:text-red-500 transition-all">
                      <Fingerprint className="w-5 h-5" />
                      Initiate Biometric
                    </button>
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full border border-red-900 ${i < vaultPin.length ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col p-10">
                   <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-5">
                        <div className="p-4 bg-red-500 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                          <Unlock className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-red-100 uppercase tracking-tighter">Vault Accessible</h2>
                          <p className="text-[10px] text-red-900 font-black uppercase tracking-widest">Encrypted Data Stream Decoupled</p>
                        </div>
                      </div>
                      <button onClick={() => setIsVaultUnlocked(false)} className="px-6 py-3 border border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-900 hover:text-red-500 transition-all">Lock Vault</button>
                   </div>
                   
                   <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: 'Identity_Matrix.key', type: 'System Key', size: '12KB' },
                        { name: 'Neural_Seeds.enc', type: 'Encrypted Weights', size: '1.4GB' },
                        { name: 'Operator_Journal.md', type: 'Secure Log', size: '45KB' }
                      ].map((item, i) => (
                        <div key={i} className="group bg-red-950/10 border border-red-900/20 p-6 rounded-[30px] hover:border-red-500/30 transition-all cursor-pointer relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                              <Download className="w-4 h-4 text-red-500" />
                           </div>
                           <Activity className="w-8 h-8 text-red-900 mb-4 group-hover:text-red-500 transition-colors" />
                           <h4 className="font-black text-red-100 text-sm truncate">{item.name}</h4>
                           <div className="flex items-center justify-between mt-2">
                              <span className="text-[9px] text-red-900 font-black uppercase tracking-widest">{item.type}</span>
                              <span className="text-[9px] text-red-100/40 font-mono">{item.size}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}

          {tnModule === 'knowledge' && (
            <div className="flex-1 flex flex-col p-6 md:p-10 relative z-10">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-900/20 rounded-2xl border border-red-500/30">
                      <Database className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-red-100 uppercase tracking-tight">Knowledge Core</h2>
                      <p className="text-[10px] text-red-900 font-black uppercase tracking-widest">Vectorized Intelligence Index</p>
                    </div>
                  </div>
                  <label className="px-6 py-2 bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-red-600 transition-all">
                    <Download className="w-3.5 h-3.5" /> Ingest Pack
                    <input type="file" className="hidden" multiple onChange={handleKnowledgeUpload} />
                  </label>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                  {tnKnowledgePacks.map((pack: any) => (
                    <div key={pack.id} className="p-5 bg-red-950/5 border border-red-900/10 rounded-[24px] hover:border-red-500/30 transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-5">
                          <div className="p-3 bg-red-900/10 rounded-xl">
                             <Database className="w-5 h-5 text-red-900 group-hover:text-red-500 transition-colors" />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-red-100 uppercase tracking-tight italic">{pack.name}</h4>
                             <p className="text-[9px] text-red-900 font-black uppercase tracking-widest">{pack.size} • {pack.status}</p>
                          </div>
                       </div>
                       <button className="p-2 text-red-950 hover:text-red-500 transition-all">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {tnModule === 'swarm' && (
            <div className="flex-1 p-6 md:p-10 space-y-6 md:space-y-10 overflow-y-auto custom-scrollbar relative z-10">
               <div className="flex items-center justify-between border-b border-red-900/20 pb-8">
                  <div className="space-y-2">
                     <h3 className="text-3xl font-black text-red-100 uppercase tracking-tighter flex items-center gap-5">
                       <Network className="w-8 h-8 text-red-600" /> Neural Swarm Core
                     </h3>
                     <p className="text-sm text-red-900 font-bold tracking-widest uppercase">Biomimetic distributed intelligence & consensus engine</p>
                  </div>
                  <div className="flex items-center gap-6">
                     <div className="text-right">
                        <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Swarm Anxiety</p>
                        <p className={`text-lg font-mono font-black ${(swarmAnxiety * 100) > 50 ? 'text-red-500' : 'text-red-700'}`}>{(swarmAnxiety * 100).toFixed(1)}%</p>
                     </div>
                     <button 
                       onClick={triggerSwarmCycle}
                       disabled={isAiProcessing}
                       className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                     >
                       <Zap className={`w-4 h-4 ${isAiProcessing ? 'animate-pulse' : ''}`} />
                       {isAiProcessing ? 'Processing...' : 'Trigger Cycle'}
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                  {/* Swarm Visualization */}
                  <div className="lg:col-span-2 space-y-6 md:space-y-8">
                     <div className="bg-red-950/5 border border-red-900/20 rounded-[20px] md:rounded-[40px] p-6 md:p-10 relative overflow-hidden h-[300px] md:h-[500px] flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.1)_0%,transparent_70%)]" />
                        <div className="relative w-full h-full">
                           {swarmAgents.map((agent, i) => {
                             const angle = (i / swarmAgents.length) * Math.PI * 2;
                             const x = Math.cos(angle) * 160;
                             const y = Math.sin(angle) * 160;
                             return (
                               <div
                                 key={agent.id}
                                 style={{ 
                                   transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${agent.status === 'active' ? 1.1 : 1})`
                                 }}
                                 className="absolute left-1/2 top-1/2 flex flex-col items-center gap-3 transition-all duration-500"
                               >
                                  <div className={`w-12 h-12 md:w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                    agent.status === 'active' 
                                      ? 'bg-red-600 border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.6)]' 
                                      : 'bg-red-950/40 border-red-900/40'
                                  }`}>
                                     <Users className={`w-5 h-5 md:w-7 md:h-7 ${agent.status === 'active' ? 'text-white' : 'text-red-900'}`} />
                                  </div>
                                  <div className="text-center">
                                     <p className="text-[10px] font-black text-red-100 uppercase tracking-tighter">{agent.name}</p>
                                     <p className="text-[8px] font-black text-red-900 uppercase tracking-widest mt-1">{agent.expertise}</p>
                                  </div>
                               </div>
                             );
                           })}
                           {/* Center Core */}
                           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-900/20 rounded-full blur-3xl animate-pulse" />
                           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                              <Brain className="w-12 h-12 text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {swarmAgents.map(agent => (
                          <div key={agent.id} className="p-5 bg-red-950/5 border border-red-900/10 rounded-3xl space-y-3">
                             <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">Trust</span>
                                <span className="text-[10px] font-mono text-red-500">{(agent.trust * 100).toFixed(0)}%</span>
                             </div>
                             <div className="w-full h-1 bg-red-950/40 rounded-full overflow-hidden">
                                <div className="h-full bg-red-600" style={{ width: `${agent.trust * 100}%` }} />
                             </div>
                             <p className="text-[9px] font-black text-red-100 uppercase truncate">{agent.name}</p>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Swarm Logs */}
                  <div className="bg-[#0a0202] border border-red-900/30 rounded-[30px] md:rounded-[40px] flex flex-col shadow-2xl overflow-hidden h-[400px] md:h-[650px]">
                     <div className="p-4 md:p-8 border-b border-red-900/20 bg-black/40 flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                           <Activity className="w-4 h-4" /> Consensus Stream
                        </h4>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar font-mono text-[11px]">
                        {swarmLogs.map((log, idx) => (
                          <div key={idx} className={`p-4 rounded-2xl border ${
                            log.type === 'consensus' ? 'bg-green-500/5 border-green-500/20 text-green-500' :
                            log.type === 'pain' ? 'bg-red-500/5 border-red-500/20 text-red-500' :
                            'bg-red-950/10 border-red-900/10 text-red-900'
                          }`}>
                             <div className="flex justify-between mb-2 opacity-50">
                                <span>[{log.type.toUpperCase()}]</span>
                                <span>{log.time}</span>
                             </div>
                             <p className="leading-relaxed font-bold">{log.message}</p>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {tnModule === 'debug' && (
            <div className="flex-1 p-6 md:p-12 space-y-8 md:space-y-10 overflow-y-auto custom-scrollbar relative z-10">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2">
                     <h3 className="text-2xl md:text-3xl font-black text-red-100 uppercase tracking-tighter">Neural Debugger</h3>
                     <p className="text-xs md:text-sm text-red-900 font-bold tracking-widest uppercase">Real-time code analysis and dynamic tracing.</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={runStaticAnalysis}
                       disabled={debugAnalysis.static.status === 'running'}
                       className="px-4 md:px-6 py-2.5 md:py-3 bg-red-950/20 border border-red-900/30 text-red-500 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-red-900/20 transition-all disabled:opacity-50"
                     >
                       {debugAnalysis.static.status === 'running' ? 'Analyzing...' : 'Static Analysis'}
                     </button>
                     <button 
                       onClick={runDynamicTracing}
                       disabled={debugAnalysis.tracing.status === 'running'}
                       className="px-4 md:px-6 py-2.5 md:py-3 bg-red-700 text-white rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all disabled:opacity-50"
                     >
                       {debugAnalysis.tracing.status === 'running' ? 'Tracing...' : 'Dynamic Trace'}
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  {/* Static Analysis Results */}
                  <div className="bg-red-950/5 border border-red-900/20 rounded-[30px] md:rounded-[40px] p-6 md:p-8 space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                           <FileSearch className="w-4 h-4" /> Static Analysis
                        </h4>
                        {debugAnalysis.static.status === 'done' && (
                          <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">{debugAnalysis.static.issues.length} Issues Found</span>
                        )}
                     </div>
                     <div className="space-y-4 min-h-[200px]">
                        {debugAnalysis.static.status === 'idle' && (
                          <div className="h-full flex flex-col items-center justify-center text-red-950 italic opacity-30 py-12">
                            <FileSearch className="w-12 h-12 mb-4" />
                            <p className="text-[10px] uppercase tracking-widest">Awaiting Analysis Directive</p>
                          </div>
                        )}
                        {debugAnalysis.static.status === 'running' && (
                          <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-12 bg-red-900/10 rounded-xl animate-pulse" />
                            ))}
                          </div>
                        )}
                        {debugAnalysis.static.status === 'done' && debugAnalysis.static.issues.map((issue: any, i: number) => (
                          <div key={i} className={`p-4 rounded-2xl border flex items-start gap-4 ${
                            issue.type === 'error' ? 'bg-red-950/20 border-red-600/30' : 
                            issue.type === 'warning' ? 'bg-orange-950/10 border-orange-900/20' : 
                            'bg-blue-950/10 border-blue-900/20'
                          }`}>
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                              issue.type === 'error' ? 'bg-red-500' : 
                              issue.type === 'warning' ? 'bg-orange-500' : 
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1 space-y-1">
                              <p className="text-[12px] text-red-100 font-bold leading-tight">{issue.message}</p>
                              {issue.line && <p className="text-[9px] text-red-900 uppercase font-black tracking-widest">Line {issue.line}</p>}
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Dynamic Tracing Logs */}
                  <div className="bg-red-950/5 border border-red-900/20 rounded-[30px] md:rounded-[40px] p-6 md:p-8 space-y-6 flex flex-col h-[400px] lg:h-auto">
                     <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-3">
                        <Activity className="w-4 h-4" /> Dynamic Tracing
                     </h4>
                     <div className="flex-1 bg-black/40 rounded-2xl p-4 font-mono text-[11px] overflow-y-auto custom-scrollbar space-y-2">
                        {debugAnalysis.tracing.logs.length === 0 && debugAnalysis.tracing.status === 'idle' && (
                          <div className="h-full flex flex-col items-center justify-center text-red-900 opacity-20 italic">
                            <p>SYSTEM_IDLE: NO_ACTIVE_TRACE</p>
                          </div>
                        )}
                        {debugAnalysis.tracing.logs.map((log: string, i: number) => (
                          <div key={i} className={log.includes('exception') ? 'text-red-500 font-bold' : 'text-red-100/60'}>
                            {log}
                          </div>
                        ))}
                        {debugAnalysis.tracing.status === 'running' && (
                          <div className="text-red-600 animate-pulse">_</div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Refactoring Suggestions */}
               <div className="bg-[#0d0404] rounded-[30px] md:rounded-[40px] border border-red-900/30 p-8 md:p-12 space-y-6 md:space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                     <div className="space-y-2">
                        <h4 className="text-xl md:text-2xl font-black text-red-100 uppercase tracking-tighter flex items-center gap-4">
                           <Sparkles className="w-6 h-6 text-red-600" /> Neural Refactoring
                        </h4>
                        <p className="text-xs md:text-sm text-red-900 font-bold tracking-widest uppercase">Automated suggestions from the system personality.</p>
                     </div>
                     <button 
                       onClick={getRefactoringSuggestions}
                       disabled={debugAnalysis.refactoring.status === 'running'}
                       className="w-full md:w-auto px-8 py-4 bg-red-800/10 border border-red-700/30 rounded-2xl text-red-500 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-red-800/20 transition-all disabled:opacity-50"
                     >
                       {debugAnalysis.refactoring.status === 'running' ? 'Synthesizing...' : 'Generate Suggestions'}
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                     {debugAnalysis.refactoring.status === 'idle' && [1, 2, 3].map(i => (
                       <div key={i} className="p-6 bg-red-950/5 border border-red-900/10 rounded-3xl h-32 flex items-center justify-center opacity-20">
                         <div className="w-full h-2 bg-red-900/20 rounded-full" />
                       </div>
                     ))}
                     {debugAnalysis.refactoring.status === 'running' && [1, 2, 3].map(i => (
                       <div key={i} className="p-6 bg-red-950/5 border border-red-900/10 rounded-3xl h-32 animate-pulse" />
                     ))}
                     {debugAnalysis.refactoring.status === 'done' && debugAnalysis.refactoring.suggestions.map((s: string, i: number) => (
                       <div key={i} className="p-6 bg-red-950/10 border border-red-900/20 rounded-3xl hover:border-red-600/40 transition-all group">
                         <div className="w-8 h-8 bg-red-900/20 rounded-lg flex items-center justify-center text-red-500 font-black text-xs mb-4 group-hover:bg-red-700 group-hover:text-white transition-all">
                           0{i+1}
                         </div>
                         <p className="text-[13px] text-red-100/80 leading-relaxed italic">"{s}"</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {!['chat', 'code', 'rules', 'vault', 'knowledge', 'swarm', 'debug'].includes(tnModule) && (
            <div className="flex-1 flex items-center justify-center p-10 opacity-40">
               <div className="text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-red-600 blur-[40px] opacity-10" />
                    <Zap className="w-16 h-16 text-red-900 mx-auto" />
                  </div>
                  <p className="text-[10px] font-black text-red-900 uppercase tracking-[0.5em]">Module "{tnModule}" initialization in progress...</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolNeuron;
