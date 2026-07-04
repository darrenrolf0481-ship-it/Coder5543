'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Code,
  Sparkles,
  Zap,
  Binary,
  HardDrive,
  Workflow,
  CheckSquare,
  Activity,
  Shield,
  BookOpen,
  ChevronDown,
  Check,
  Search,
  Sliders,
  X,
  Plus,
  Terminal,
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { AGENT_SKILLS, SKILL_CATEGORIES, AgentSkill } from '../../lib/skillsData';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Layers,
  Code,
  Sparkles,
  Zap,
  Binary,
  HardDrive,
  Workflow,
  CheckSquare,
  Activity,
  Shield,
  BookOpen,
};

export default function SkillsLibraryDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill>(AGENT_SKILLS[0]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { appliedSkills, injectSkill, removeSkill, addTerminalOutput, attachedAgent } = useProjectStore();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSkills = AGENT_SKILLS.filter((skill) => {
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.rules.some((rule) => rule.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleInject = (skill: AgentSkill) => {
    injectSkill(skill.id);
    addTerminalOutput(`[SWARM] Commencing quantum injection of module: "${skill.name}"`);
    addTerminalOutput(`[SYSTEM] Initialized telemetry tracking for: ${skill.id.toUpperCase()}`);
    if (attachedAgent) {
      addTerminalOutput(`[${attachedAgent.name.toUpperCase()}] Cognitive neural capabilities expanded. Loaded prompt rules.`);
    } else {
      addTerminalOutput(`[ORCHESTRATOR] Saved skill to virtual matrix. Attach an agent to synthesize.`);
    }
  };

  const handleEject = (skill: AgentSkill) => {
    removeSkill(skill.id);
    addTerminalOutput(`[SWARM] Ejected skill matrix: "${skill.name}" from active buffers.`);
    if (attachedAgent) {
      addTerminalOutput(`[${attachedAgent.name.toUpperCase()}] Operational instruction set restored to baseline.`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 border text-xs font-mono font-bold tracking-widest uppercase transition-all duration-300 relative select-none ${
          isOpen
            ? 'bg-gradient-to-r from-blue-500/15 to-indigo-500/15 border-blue-500 text-blue-300'
            : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
        }`}
      >
        <Sliders className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden xs:inline">SKILLS ENGINE</span>
        <span className="inline xs:hidden">SKILLS</span>
        {appliedSkills.length > 0 && (
          <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-sans font-black rounded-none">
            {appliedSkills.length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Drawer panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-4 sm:right-6 md:right-8 w-[calc(100vw-2rem)] xs:w-[480px] sm:w-[680px] md:w-[740px] bg-[#050508] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.95)] z-[9999] text-white rounded-none p-1 overflow-hidden"
          >
            {/* Header section with Close Button */}
            <div className="p-4 border-b border-white/5 bg-black/40 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold font-mono tracking-[0.2em] text-blue-400 uppercase flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-500" />
                      AETHER SKILLS MATRIX ENGINE
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wide">
                      Curated agent capabilities from awesome-agent-skills
                    </p>
                  </div>

                  {/* Quick statistics */}
                  <div className="flex items-center gap-2 text-[9px] font-mono bg-white/5 border border-white/10 px-2 py-1 shrink-0">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-slate-400 uppercase">SYNCHRONIZED:</span>
                    <span className="font-bold text-white">{appliedSkills.length} ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 border border-transparent hover:border-white/10 text-slate-400 hover:text-white transition-all shrink-0 -mt-1 -mr-1"
                title="Close Skills Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Header: Search & Category filter */}
            <div className="p-3 bg-black/20 border-b border-white/5 flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search skills, rules, or configurations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-blue-500/50 rounded-none pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none transition-all"
                />
              </div>

              {/* Category Quick Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white/5 border border-white/5 focus:border-blue-500/50 text-slate-300 font-mono text-xs px-3 py-2 rounded-none focus:outline-none"
              >
                <option value="all">ALL CATEGORIES</option>
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Screen Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 h-[380px]">
              {/* Left Column: Skills List (8 Columns or 5 Columns depending on selection) */}
              <div className="sm:col-span-5 border-r border-white/5 overflow-y-auto custom-scrollbar bg-black/10">
                {filteredSkills.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-mono text-xs">
                    No active skill modules found matching filters.
                  </div>
                ) : (
                  filteredSkills.map((skill) => {
                    const SkillIcon = ICON_MAP[skill.iconName] || Layers;
                    const isSelected = selectedSkill.id === skill.id;
                    const isInjected = appliedSkills.includes(skill.id);

                    return (
                      <button
                        key={skill.id}
                        onClick={() => setSelectedSkill(skill)}
                        className={`w-full text-left p-3.5 border-b border-white/5 flex items-start gap-3 transition-all relative ${
                          isSelected
                            ? 'bg-indigo-950/20 border-r-2 border-r-blue-500'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className={`p-1.5 rounded-none shrink-0 ${
                          isInjected 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : isSelected 
                            ? 'bg-white/10 text-white' 
                            : 'bg-white/5 text-slate-500'
                        }`}>
                          <SkillIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold font-mono tracking-wide text-slate-200 truncate">
                              {skill.name}
                            </span>
                            {isInjected && (
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_4px_rgba(59,130,246,0.8)]" />
                            )}
                          </div>
                          <span className="block text-[8px] font-mono tracking-widest text-slate-500 uppercase mt-0.5">
                            {skill.category.split(' ')[0]}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Column: Selected Skill Details & Rules Panel */}
              <div className="sm:col-span-7 flex flex-col h-full bg-black/40 overflow-hidden">
                {selectedSkill ? (
                  <div className="flex-1 flex flex-col justify-between p-5 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                      {/* Skill identity */}
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-none shrink-0">
                          {(() => {
                            const Icon = ICON_MAP[selectedSkill.iconName] || Layers;
                            return <Icon className="w-5 h-5" />;
                          })()}
                        </div>
                        <div>
                          <span className="text-[9px] font-mono tracking-widest text-blue-400 uppercase font-bold">
                            {selectedSkill.category}
                          </span>
                          <h4 className="text-sm font-black font-mono text-white tracking-wide mt-0.5 uppercase">
                            {selectedSkill.name}
                          </h4>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        {selectedSkill.description}
                      </p>

                      {/* Injected Rules */}
                      <div className="space-y-2">
                        <span className="block text-[9px] font-mono tracking-widest text-slate-500 uppercase font-bold">
                          SYSTEM INSTRUCTION DIRECTIVES:
                        </span>
                        <div className="space-y-2 bg-black/30 border border-white/5 p-3 rounded-none font-mono text-[10px] text-slate-300 leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar">
                          {selectedSkill.rules.map((rule, index) => (
                            <div key={index} className="flex gap-2.5 items-start">
                              <span className="text-blue-500 font-bold shrink-0">{(index + 1).toString().padStart(2, '0')}.</span>
                              <p className="text-slate-300">{rule}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer injection controller */}
                    <div className="pt-4 border-t border-white/5 mt-5">
                      {appliedSkills.includes(selectedSkill.id) ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleEject(selectedSkill)}
                            className="w-full py-2.5 bg-rose-950/30 hover:bg-rose-900/30 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold tracking-widest uppercase rounded-none transition-all"
                          >
                            EJECT SKILL MATRIX
                          </button>
                          <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono text-slate-500">
                            <Check className="w-3.5 h-3.5 text-blue-400" />
                            MODULE STATE: SECURE & ACTIVE
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleInject(selectedSkill)}
                            className="w-full py-2.5 bg-white hover:bg-blue-500 text-black hover:text-white font-mono text-xs font-bold tracking-widest uppercase rounded-none transition-all flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            INJECT SKILL MATRIX
                          </button>
                          <div className="text-[9px] text-center font-mono text-slate-500">
                            Loads strict guidelines into active agent context buffers
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-slate-500 font-mono text-xs">
                    Select an awesome skill to view directives.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
