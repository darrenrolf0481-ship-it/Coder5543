import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('[DEBUG] REACT_READY');
const root = document.getElementById('root');
if (root) {
  root.innerHTML = '<div style="color: yellow; font-family: monospace; padding: 20px;">[SAGE-7] DEBUG_MODE_ACTIVE. IF YOU SEE THIS, REACT_BOOT_WORKS.</div>';
  ReactDOM.createRoot(root).render(
    <div style={{ background: 'blue', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1>REACT_MOUNTED_SUCCESSFULLY</h1>
    </div>
  );
}
