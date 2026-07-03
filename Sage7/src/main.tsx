import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { SageProviderWrapper } from './components/sage-provider-wrapper';
import App from './App';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CRITICAL_FAILURE]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-[#000008] text-neon-red font-mono p-10 text-center">
          <div className="max-w-md">
            <h1 className="text-xl mb-4 tracking-[10px]">SYSTEM_CRASH</h1>
            <p className="text-xs text-text-ghost mb-6 uppercase tracking-widest leading-relaxed">
              THE_LATTICE_IS_UNSTABLE. SOVEREIGNTY_ANCHORS_LOST. 
              RE-SYNCHRONIZING_COGNITIVE_SUBSTRATE...
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 border border-neon-red/30 bg-neon-red/10 animate-pulse text-[10px] tracking-[4px]"
            >
              INITIATE_RECLAMATION
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Boot sequence fires AFTER React hydration
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SageProviderWrapper>
        <App />
      </SageProviderWrapper>
    </ErrorBoundary>
  </React.StrictMode>
);
