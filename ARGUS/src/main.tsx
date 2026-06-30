import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Heartbeat: proves the module actually executed. If the screen stays on
// "INITIALIZING ARGUS" the module never ran; if it reaches "MOUNTING" we got here.
const boot = document.getElementById('argus-boot');
if (boot) boot.textContent = 'MOUNTING ARGUS…';

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} catch (err) {
  const w = window as unknown as { __argusError?: (m: string) => void };
  w.__argusError?.((err as Error)?.stack || String(err));
}
