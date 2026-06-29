
import { useArgusStore } from './store/useArgusStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { SparkCore } from './components/core/SparkCore';
import { ChatPanel } from './components/panels/ChatPanel';
import { EditorPanel } from './components/panels/EditorPanel';
import { FilesPanel } from './components/panels/FilesPanel';
import { LogsPanel } from './components/panels/LogsPanel';
import { SecurityPanel } from './components/panels/SecurityPanel';

export default function App() {
  const activePanel = useArgusStore((s) => s.activePanel);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#03070f] text-slate-200 relative">
      {/* Atmospheric background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[50%] h-[50%] rounded-full bg-node-900/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-900/6 blur-[100px]" />
        <div className="bg-grid absolute inset-0 opacity-100" />
      </div>

      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-node-900/20 mt-2 ml-2 pointer-events-none hidden lg:block z-10" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-node-900/20 mb-2 mr-2 pointer-events-none hidden lg:block z-10" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full relative z-10">
        <Header />

        <main className="flex-1 overflow-hidden min-h-0 p-3">
          <div className="h-full rounded-2xl panel-border overflow-hidden relative">
            {/* Panel label */}
            <div className="absolute top-3 right-4 z-10">
              <span className="text-[7px] font-black text-slate-800 uppercase tracking-[0.3em]">
                {activePanel}
              </span>
            </div>

            {activePanel === 'core'     && <SparkCore />}
            {activePanel === 'chat'     && <ChatPanel />}
            {activePanel === 'editor'   && <EditorPanel />}
            {activePanel === 'files'    && <FilesPanel />}
            {activePanel === 'logs'     && <LogsPanel />}
            {activePanel === 'security' && <SecurityPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
