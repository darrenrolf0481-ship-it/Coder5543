'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track document visibility and window resize.
 * Centralizes these common event listeners.
 */
export function useLayoutEvents() {
  const [isVisible, setIsVisible] = useState(true);
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibility = () => setIsVisible(!document.hidden);
    
    // Throttled resize handler
    let timeoutId: any = null;
    const handleResize = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        timeoutId = null;
      }, 150);
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { isVisible, windowSize };
}
