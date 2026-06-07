import React from 'react';
import { X, Network, Terminal as TerminalIcon, Smartphone, Brain, Database, Layers } from 'lucide-react';
import { PROJECT_TEMPLATES } from '../../services/templates';

interface TemplateModalProps {
  isTemplateModalOpen: boolean;
  setIsTemplateModalOpen: (open: boolean) => void;
  handleLoadTemplate: (templateKey: keyof typeof PROJECT_TEMPLATES) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isTemplateModalOpen,
  setIsTemplateModalOpen,
  handleLoadTemplate,
}) => {
  if (!isTemplateModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-[#0d0404] border border-accent-900/30 rounded-[30px] md:rounded-[60px] shadow-[0_0_100px_var(--color-accent-800)/20] overflow-hidden flex flex-col max-h-[90vh] md:max-h-[80vh]">
        <div className="p-6 md:p-10 border-b border-accent-900/20 bg-black/40 flex items-center justify-between shrink-0">
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-xl md:text-3xl font-black text-accent-100 uppercase tracking-tighter">
              Initialize Neural Project
            </h3>
            <p className="text-[10px] md:text-sm text-accent-900 font-bold tracking-widest uppercase">
              Select a predefined template to begin your development cycle
            </p>
          </div>
          <button
            onClick={() => setIsTemplateModalOpen(false)}
            className="p-3 md:p-4 bg-accent-950/20 border border-accent-900/20 rounded-full text-accent-500 hover:bg-accent-900/40 transition-all shrink-0 ml-4"
            aria-label="Close template modal"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {(Object.keys(PROJECT_TEMPLATES) as Array<keyof typeof PROJECT_TEMPLATES>).map(
              (key) => (
                <button
                  key={key}
                  onClick={() => handleLoadTemplate(key)}
                  className="group p-4 md:p-8 bg-accent-950/5 border border-accent-900/20 rounded-[20px] md:rounded-[40px] text-left space-y-4 md:space-y-6 hover:bg-accent-900/10 hover:border-accent-500/40 transition-all active:scale-95"
                  aria-label={`Load ${key} template`}
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-accent-900/20 rounded-2xl flex items-center justify-center text-accent-500 group-hover:scale-110 transition-transform">
                    {key === 'python-web' && <Network className="w-6 h-6 md:w-8 md:h-8" />}
                    {key === 'rust-cli' && <TerminalIcon className="w-6 h-6 md:w-8 md:h-8" />}
                    {key === 'neural-module' && <Brain className="w-6 h-6 md:w-8 md:h-8" />}
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <h4 className="text-sm md:text-lg font-black text-accent-100 uppercase tracking-tight group-hover:text-accent-500 transition-colors">
                      {key.replace('-', ' ')}
                    </h4>
                    <p className="text-[9px] md:text-xs text-accent-900 font-bold leading-relaxed uppercase tracking-wider line-clamp-3">
                      {PROJECT_TEMPLATES[key].description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2 pt-2 md:pt-4">
                    {PROJECT_TEMPLATES[key].tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 md:px-3 py-1 bg-accent-950/20 border border-accent-900/20 rounded-full text-[7px] md:text-[9px] font-black text-accent-400 uppercase tracking-widest"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
