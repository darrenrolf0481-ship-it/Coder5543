import React, { useState } from 'react';
import { Check } from 'lucide-react';

export const ActionButton: React.FC<{
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  activeLabel?: string;
  variant?: 'red' | 'emerald';
}> = ({ onClick, icon: Icon, label, activeLabel = 'Done!', variant = 'red' }) => {
  const [active, setActive] = useState(false);
  const handleAction = () => {
    onClick();
    setActive(true);
    setTimeout(() => setActive(false), 2000);
  };

  const colors = variant === 'emerald'
    ? 'bg-emerald-700 border-emerald-500 hover:bg-emerald-600'
    : 'bg-red-950/30 border-red-900/30 hover:bg-red-900/30';

  return (
    <button
      onClick={handleAction}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border ${
        active ? 'bg-emerald-700/30 border-emerald-600/40 text-emerald-400' : `text-red-400 ${colors}`
      }`}
    >
      {active ? <Check className="w-3 h-3 text-emerald-400" /> : <Icon className="w-3 h-3" />}
      {active ? activeLabel : label}
    </button>
  );
};
