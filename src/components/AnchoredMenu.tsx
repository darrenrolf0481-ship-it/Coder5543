import React, { useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface AnchoredMenuProps {
  /** The trigger element the menu is positioned against. */
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  /** Menu width in px. */
  width?: number;
  /** Which edge of the menu aligns to the anchor. */
  align?: 'left' | 'right';
  children: React.ReactNode;
}

/**
 * A dropdown menu rendered through a portal with fixed positioning.
 *
 * Why: the editor toolbar lives inside an `overflow-x-auto` scroll container,
 * and CSS forces `overflow-y` to clip when `overflow-x` is auto — so a normal
 * absolutely-positioned dropdown gets cut off / hidden behind the editor. By
 * portaling to <body> with position:fixed, the menu escapes every overflow,
 * transform, and stacking-context ancestor. The position is clamped to the
 * viewport so it can't run off the edge on a phone, and it scrolls internally
 * once it gets tall.
 */
export const AnchoredMenu: React.FC<AnchoredMenuProps> = ({
  anchorRef,
  open,
  onClose,
  width = 224,
  align = 'right',
  children,
}) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const compute = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    let left = align === 'right' ? r.right - width : r.left;
    // keep fully on-screen horizontally
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    const top = Math.min(r.bottom + margin, window.innerHeight - margin);
    setPos({ top, left });
  }, [anchorRef, width, align]);

  useLayoutEffect(() => {
    if (!open) return;
    compute();
    window.addEventListener('resize', compute);
    // capture phase so we reposition when any scroll container moves
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open, compute]);

  if (!open || !pos) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[1000]" onClick={onClose} />
      <div
        role="menu"
        className="fixed z-[1001] max-h-[70vh] overflow-y-auto custom-scrollbar rounded-2xl bg-[#0a0202] border border-accent-900/40 shadow-[0_10px_35px_rgba(0,0,0,0.9)] py-2 animate-in fade-in slide-in-from-top-2 duration-150"
        style={{ top: pos.top, left: pos.left, width }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
};
