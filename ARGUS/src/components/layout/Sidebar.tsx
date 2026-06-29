
import {
  Hexagon,
  MessageSquare,
  Code2,
  FolderTree,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import { Panel, useArgusStore } from '../../store/useArgusStore';

const TABS: { id: Panel; icon: React.ReactNode; label: string }[] = [
  { id: 'dashboard', icon: <Hexagon       className="w-5 h-5" />, label: 'Dashboard' },
  { id: 'chat',     icon: <MessageSquare className="w-5 h-5" />, label: 'Chat'     },
  { id: 'editor',   icon: <Code2          className="w-5 h-5" />, label: 'Editor'   },
  { id: 'files',    icon: <FolderTree     className="w-5 h-5" />, label: 'Files'    },
  { id: 'logs',     icon: <Terminal       className="w-5 h-5" />, label: 'Logs'     },
  { id: 'security', icon: <ShieldAlert    className="w-5 h-5" />, label: 'Security' },
];

export function Sidebar() {
  const activePanel = useArgusStore((s) => s.activePanel);
  const setActivePanel = useArgusStore((s) => s.setActivePanel);
  const threatLog = useArgusStore((s) => s.threatLog);
  const approvalQueue = useArgusStore((s) => s.approvalQueue);

  const pendingApprovals = approvalQueue.filter((a) => a.status === 'pending').length;
  const criticalThreats = threatLog.filter((t) => t.level === 'critical' || t.level === 'high').length;

  return (
    <aside className="w-14 md:w-16 h-full flex flex-col items-center py-4 gap-1 border-r border-node-900/30 bg-[#040c18] shrink-0 z-20">
      {/* Logo */}
      <div className="mb-4 flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-lg bg-node-900/60 border border-node-700/40 flex items-center justify-center glow-node">
          <span className="text-node-400 font-black text-[10px] tracking-wider">AR</span>
        </div>
      </div>

      {/* Nav */}
      {TABS.map((tab) => {
        const active = activePanel === tab.id;
        const badge =
          tab.id === 'security'
            ? criticalThreats
            : tab.id === 'chat'
            ? pendingApprovals
            : 0;

        return (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            title={tab.label}
            aria-label={tab.label}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              active
                ? 'bg-node-900/60 text-node-400 border border-node-700/40 shadow-node'
                : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/30'
            }`}
          >
            {tab.icon}
            {badge > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-[7px] font-black text-black flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
}
