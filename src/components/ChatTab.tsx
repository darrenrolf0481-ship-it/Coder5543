import React from 'react';
import { 
  MessageSquare, 
  Send, 
  Zap, 
  Trash2, 
  Activity, 
  Brain,
  Download,
  ShieldCheck,
  Globe,
  Loader2
} from 'lucide-react';
import { ChatMessage, Personality } from '../types';

interface ChatTabProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  isAiProcessing: boolean;
  activePersonality: Personality;
  personalities: Personality[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  setChatInput: (input: string) => void;
  handleChatSubmit: (e?: React.FormEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearChat: () => void;
  currentSpeakerId: number | string;
  setCurrentSpeakerId: (id: number | string) => void;
}

const ChatTab: React.FC<ChatTabProps> = ({
  chatMessages,
  chatInput,
  isAiProcessing,
  activePersonality,
  personalities,
  chatEndRef,
  setChatInput,
  handleChatSubmit,
  handleFileUpload,
  clearChat,
  currentSpeakerId,
  setCurrentSpeakerId
}) => {
  const currentSpeaker = personalities.find(p => p.id === currentSpeakerId) || activePersonality;

  return (
    <div className="h-full flex flex-col lg:flex-row p-0 md:p-8 gap-0 md:gap-8 overflow-hidden bg-[#020204]">
      {/* Sidebar: Personality Details - Hidden on mobile */}
      <div className="hidden lg:flex w-full lg:w-80 flex-col gap-4 md:gap-6 shrink-0 overflow-y-auto custom-scrollbar">
        <div className="bg-[#0d0404]/80 rounded-[30px] border border-red-900/30 p-8 space-y-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(153,27,27,0.1),transparent)] pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
             <div className="p-5 bg-red-900/20 rounded-3xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)] group-hover:scale-110 transition-transform">
                <Brain className="w-12 h-12 text-red-500" />
             </div>
             <div>
                <h3 className="text-2xl font-black text-red-100 uppercase tracking-tighter italic">{currentSpeaker.name}</h3>
                <p className="text-[10px] text-red-900 font-black uppercase tracking-[0.4em] mt-1">Active Specialist</p>
             </div>
          </div>

          <div className="space-y-4 relative z-10">
             <div className="p-4 bg-red-950/10 rounded-2xl border border-red-900/10">
                <h4 className="text-[9px] font-black text-red-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <ShieldCheck className="w-3 h-3" /> Expert Directives
                </h4>
                <p className="text-[11px] text-red-100/60 leading-relaxed font-medium">
                   {currentSpeaker.instruction.substring(0, 150)}...
                </p>
             </div>
             <p className="text-[8px] font-black text-red-900 uppercase tracking-widest">Substrate Anchor: {currentSpeaker.anchor || 'root'}</p>
          </div>
        </div>

        <div className="bg-[#0d0404]/80 rounded-[30px] border border-red-900/30 p-6 space-y-4">
           <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Specialist Tools
           </h4>
           <div className="flex flex-wrap gap-2">
              {currentSpeaker.suggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => { setChatInput(s); handleChatSubmit(); }}
                  className="px-4 py-2 bg-red-950/20 border border-red-900/20 rounded-full text-[10px] text-red-100/60 hover:text-white hover:border-red-500 transition-all font-black uppercase tracking-widest"
                >
                  {s}
                </button>
              ))}
           </div>
        </div>

        <button 
          onClick={clearChat}
          className="w-full p-4 bg-red-950/10 border border-red-900/30 rounded-[20px] text-[10px] font-black uppercase tracking-[0.4em] text-red-900 hover:text-red-500 hover:bg-red-900/10 transition-all flex items-center justify-center gap-3"
        >
          <Trash2 className="w-4 h-4" /> Reset Uplink
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0d0404]/80 rounded-none md:rounded-[40px] border-x-0 md:border border-red-900/30 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.03)_0%,transparent_100%)] pointer-events-none" />

        {/* Chat Header with Selector */}
        <div className="p-6 md:px-10 border-b border-red-900/30 bg-[#0a0202]/80 flex items-center justify-between shrink-0 relative z-10">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-red-900/20 rounded-2xl border border-red-500/30">
                <Brain className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-red-100 uppercase tracking-tight">Specialist Uplink</h2>
                  <select 
                    value={currentSpeakerId}
                    onChange={(e) => setCurrentSpeakerId(e.target.value)}
                    className="bg-red-950 border border-red-900/50 rounded-lg px-3 py-1 text-[10px] font-black text-red-500 uppercase tracking-widest outline-none focus:border-red-500 cursor-pointer"
                  >
                    {personalities.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-red-900 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                   <ShieldCheck className="w-3 h-3" /> SECURE_DIRECT_COMMUNICATION
                </p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                 <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">Active Specialist Host</span>
                 <span className="text-[11px] font-black text-red-100 italic">{currentSpeaker.name}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-950/20 border border-red-900/20 flex items-center justify-center">
                 <Activity className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
           </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar relative z-10">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-12 h-12 rounded-[18px] shrink-0 flex items-center justify-center border transition-all ${msg.role === 'user' ? 'bg-red-700 border-red-500 shadow-[0_0_20px_rgba(185,28,28,0.3)]' : 'bg-red-950/20 border-red-900/30'}`}>
                {msg.role === 'user' ? <Zap className="w-6 h-6 text-white" /> : <Brain className="w-6 h-6 text-red-500" />}
              </div>
              <div className={`max-w-[85%] md:max-w-[70%] space-y-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-red-500' : 'text-red-900'}`}>
                   {msg.role === 'user' ? 'Operator' : (msg.senderName || activePersonality.name)}
                </div>
                <div className={`inline-block p-6 rounded-[32px] text-sm md:text-[15px] leading-relaxed relative ${msg.role === 'user' ? 'bg-red-900/10 text-red-100 rounded-tr-none border border-red-500/20 shadow-xl' : 'bg-red-950/10 border border-red-900/10 text-red-100/90 rounded-tl-none'}`}>
                  {msg.text.split('\n').map((line, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-3' : ''}>{line}</p>
                  ))}
                  {msg.type === 'image' && (
                    <div className="mt-6 relative group/img inline-block overflow-hidden rounded-2xl">
                      <img src={msg.url} className="border border-red-900/30 shadow-2xl max-w-full lg:max-w-md transition-transform duration-700 group-hover/img:scale-110" />
                      <div className="absolute inset-0 bg-red-950/40 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center gap-4">
                        <button className="p-3 bg-red-700 text-white rounded-xl shadow-xl hover:scale-110 transition-all"><Download className="w-5 h-5" /></button>
                      </div>
                    </div>
                  )}
                  {msg.type === 'file' && (
                    <div className="mt-4 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center gap-4 group/file hover:border-red-500/50 transition-all">
                      <div className="p-3 bg-red-900/20 rounded-xl text-red-500 group-hover/file:scale-110 transition-transform">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-black text-red-100 uppercase truncate">{msg.metadata?.fileName || 'neural_package.zip'}</p>
                        <p className="text-[9px] text-red-900 font-black uppercase tracking-widest mt-1">{msg.metadata?.fileSize || '0 KB'} • {msg.metadata?.fileType || 'binary/data'}</p>
                      </div>
                      <div className="p-2 text-red-900 hover:text-red-500 transition-colors">
                        <Download className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-[9px] font-mono text-red-950/40 uppercase tracking-widest px-2">
                   {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isAiProcessing && (
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-[18px] bg-red-950/20 border border-red-900/30 flex items-center justify-center">
                 <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
              </div>
              <div className="space-y-3">
                 <div className="text-[10px] font-black uppercase tracking-widest text-red-900">
                    {currentSpeaker.name} is thinking...
                 </div>
                 <div className="bg-red-950/5 border border-red-900/10 p-6 rounded-[32px] rounded-tl-none">
                    <div className="flex gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]" />
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                 </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {/* Chat Input */}
        <form onSubmit={handleChatSubmit} className="p-4 md:p-10 bg-[#0a0202]/95 backdrop-blur-xl border-t border-red-900/30 relative z-20">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-900/20 to-transparent rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition-opacity" />
            <input 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Communicate...`}
              disabled={isAiProcessing}
              className="w-full bg-[#0d0404] border border-red-900/30 rounded-2xl md:rounded-[24px] px-6 py-4 md:px-8 md:py-6 pl-16 md:pl-20 pr-16 md:pr-20 text-sm md:text-base text-red-100 placeholder:text-red-900/40 outline-none focus:border-red-500/50 shadow-2xl relative z-10 transition-all disabled:opacity-50"
            />
            <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 flex items-center">
              <label className="cursor-pointer p-2 md:p-3 bg-red-950/20 text-red-500 rounded-xl hover:bg-red-700 hover:text-white transition-all">
                <Download className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".zip,.rar,.tar,.7z,application/zip"
                  onChange={handleFileUpload}
                  disabled={isAiProcessing}
                />
              </label>
            </div>
            <button 
              type="submit"
              disabled={isAiProcessing || !chatInput.trim()}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-red-700 text-white rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(185,28,28,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all z-20"
            >
              {isAiProcessing ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Send className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
          </div>
          <p className="mt-3 text-[8px] md:text-[9px] font-black text-red-950 uppercase tracking-[0.4em] text-center italic">Specialist Protocol Initiated</p>

        </form>
      </div>
    </div>
  );
};

export default ChatTab;
