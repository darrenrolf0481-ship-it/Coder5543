/**
 * Resolves a clean absolute path for API calls, handling both local running
 * and proxy running (e.g. code-server / VS Code port forwarding at /proxy/<port>/)
 * regardless of trailing slashes in the browser URL.
 */
export function resolveApiUrl(apiPath: string): string {
  // Trim leading dots and slashes
  const cleanPath = apiPath.replace(/^\.?\/+/, '');
  if (typeof window === 'undefined') {
    return `/api/${cleanPath}`;
  }
  const base = window.location.pathname.replace(/\/$/, '');
  return `${base}/api/${cleanPath}`;
}
