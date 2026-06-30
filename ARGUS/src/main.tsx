import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Heartbeat: proves the module actually executed.
(window as unknown as { __argusModuleRan?: boolean }).__argusModuleRan = true;
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
