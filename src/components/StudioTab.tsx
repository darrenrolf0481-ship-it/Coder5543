import React from 'react';
import { 
  MessageSquare, 
  Send, 
  Zap, 
  ImageIcon, 
  Trash2, 
  Sliders, 
  HardDrive, 
  Activity, 
  Gauge, 
  Upload,
  ChevronRight,
  X,
  Brain,
  Download
} from 'lucide-react';
import { ChatMessage, Personality } from '../types';

interface StudioTabProps {
  chatMessages: ChatMessage[];
  studioInput: string;
  isAiProcessing: boolean;
  studioRefImage: { data: string, mimeType: string } | null;
  negativePrompt: string;
  sdParams: any;
  activePersonality: Personality;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  setStudioInput: (input: string) => void;
  setStudioRefImage: (img: any) => void;
  setNegativePrompt: (prompt: string) => void;
  setSdParams: (params: any) => void;
  handleStudioSubmit: (e: React.FormEvent) => void;
}

const StudioTab: React.FC<StudioTabProps> = ({
  chatMessages,
  studioInput,
  isAiProcessing,
  studioRefImage,
  negativePrompt,
  sdParams,
  activePersonality,
  chatEndRef,
  setStudioInput,
  setStudioRefImage,
  setNegativePrompt,
  setSdParams,
  handleStudioSubmit
}) => {
  return (
    <div className="h-full flex flex-col lg:flex-row p-4 md:p-8 gap-4 md:gap-8 overflow-hidden">
      {/* Config Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-4 md:gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-2">
        <div className="bg-[#0d0404]/80 rounded-[30px] border border-red-900/30 p-6 space-y-6 shadow-2xl">
          <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-3">
            <Sliders className="w-4 h-4" /> Config Matrix
          </h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-800 uppercase tracking-widest">Neural Weights</label>
              <select 
                value={sdParams.checkpoint}
                onChange={(e) => setSdParams({...sdParams, checkpoint: e.target.value})}
                className="w-full bg-red-950/10 border border-red-900/20 rounded-xl px-4 py-2 text-[11px] text-red-100 outline-none"
              >
                <option value="SDXL-V1.0-Base">SDXL-V1.0-Base</option>
                <option value="Crimson-V4-Realistic">Crimson-V4-Realistic</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-800 uppercase tracking-widest">Guidance Scale</label>
              <input 
                type="range" min="1" max="20" step="0.5"
                value={sdParams.cfgScale}
                onChange={(e) => setSdParams({...sdParams, cfgScale: parseFloat(e.target.value)})}
                className="w-full accent-red-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-red-900">
                <span>1.0</span>
                <span>{sdParams.cfgScale}</span>
                <span>20.0</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0404]/80 rounded-[30px] border border-red-900/30 p-6 space-y-4">
          <h4 className="text-[11px] font-black text-red-800 uppercase tracking-widest">Reference Frame</h4>
          <div className="aspect-square bg-red-950/5 border border-dashed border-red-900/20 rounded-2xl flex items-center justify-center relative group">
            {studioRefImage ? (
              <div className="relative w-full h-full p-2">
                <img src={`data:${studioRefImage.mimeType};base64,${studioRefImage.data}`} className="w-full h-full object-cover rounded-xl" />
                <button onClick={() => setStudioRefImage(null)} className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-red-900" />
                <span className="text-[9px] font-black text-red-900 uppercase">Inject Visual Data</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = (event.target?.result as string).split(',')[1];
                        setStudioRefImage({
                          data: base64,
                          mimeType: file.type
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Chat/Generation Area */}
      <div className="flex-1 flex flex-col bg-[#0d0404]/80 rounded-[30px] md:rounded-[40px] border border-red-900/30 shadow-2xl overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-red-700 border-red-500' : 'bg-red-950/20 border-red-900/30'}`}>
                {msg.role === 'user' ? <Zap className="w-5 h-5 text-white" /> : <Brain className="w-5 h-5 text-red-500" />}
              </div>
              <div className={`max-w-[80%] space-y-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-red-900/20 text-red-100 rounded-tr-none' : 'bg-red-950/10 border border-red-900/10 text-red-100/80 rounded-tl-none'}`}>
                  {msg.text}
                </div>
                {msg.type === 'image' && (
                  <div className="relative group/img inline-block">
                    <img src={msg.url} className="rounded-3xl border border-red-900/30 shadow-2xl max-w-full lg:max-w-md" />
                    <div className="absolute inset-0 bg-red-950/40 opacity-0 group-hover/img:opacity-100 transition-all rounded-3xl flex items-center justify-center gap-4">
                      <button className="p-3 bg-red-700 text-white rounded-xl shadow-xl"><Download className="w-5 h-5" /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleStudioSubmit} className="p-6 md:p-8 bg-[#120202]/50 border-t border-red-900/30">
          <div className="relative">
            <input 
              value={studioInput}
              onChange={(e) => setStudioInput(e.target.value)}
              placeholder="Describe the neural synthesis..."
              className="w-full bg-red-950/10 border border-red-900/30 rounded-2xl px-6 py-5 pr-16 text-sm text-red-100 placeholder:text-red-900 outline-none focus:border-red-500/50"
            />
            <button 
              type="submit"
              disabled={isAiProcessing}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-red-700 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isAiProcessing ? <Zap className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudioTab;
