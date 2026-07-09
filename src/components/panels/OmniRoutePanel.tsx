import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, ExternalLink, Wifi, WifiOff } from 'lucide-react';

const OMNIROUTE_PORT = 20130;

function resolveOmniRouteUrl(path = ''): string {
  if (typeof window === 'undefined') return `http://localhost:${OMNIROUTE_PORT}${path}`;
  const loc = window.location;
  // code-server proxy: /proxy/<port>/...
  const proxyMatch = loc.pathname.match(/^(\/proxy\/\d+)\//);
  if (proxyMatch) {
    const base = loc.origin + loc.pathname.replace(/\/proxy\/\d+\/.*/, '');
    return `${base}/proxy/${OMNIROUTE_PORT}${path || '/dashboard'}`;
  }
  return `${loc.protocol}//${loc.hostname}:${OMNIROUTE_PORT}${path || '/dashboard'}`;
}

export function OmniRoutePanel() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const dashboardUrl = resolveOmniRouteUrl('/dashboard');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(resolveOmniRouteUrl('/api/v1/health'), {
          signal: AbortSignal.timeout(3000),
        });
        if (!cancelled) setOnline(res.ok || res.status === 401);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };
    check();
    const id = setInterval(check, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080101]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-accent-900/30 bg-[#0a0202] shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-accent-600" />
          <span className="text-[11px] font-black text-accent-500 uppercase tracking-[0.3em]">OmniRoute</span>
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
            style={{
              color: online === null ? '#888' : online ? '#4ade80' : '#f87171',
              borderColor: online === null ? '#444' : online ? '#166534' : '#7f1d1d',
              background: online === null ? '#111' : online ? '#052e16' : '#1c0000',
            }}>
            {online === null ? 'checking' : online ? 'live' : 'offline'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey(k => k + 1)}
            className="p-1.5 rounded-lg border border-accent-900/30 text-accent-700 hover:text-accent-400 hover:bg-accent-900/20 transition-all"
            title="Reload"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-accent-900/30 text-accent-700 hover:text-accent-400 hover:bg-accent-900/20 transition-all"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Body */}
      {online === false ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <WifiOff className="w-12 h-12 text-accent-900" />
          <div className="space-y-1">
            <p className="text-sm font-black text-accent-500 uppercase tracking-widest">OmniRoute Offline</p>
            <p className="text-xs text-accent-800">Expected on :20130 — check supervisord or restart the daemon.</p>
          </div>
          <button
            onClick={() => setReloadKey(k => k + 1)}
            className="px-6 py-2.5 bg-accent-900/20 border border-accent-900/30 text-accent-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent-900/30 transition-all"
          >
            Retry
          </button>
        </div>
      ) : (
        <iframe
          key={reloadKey}
          src={dashboardUrl}
          className="flex-1 w-full border-0"
          title="OmniRoute Dashboard"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  );
}
