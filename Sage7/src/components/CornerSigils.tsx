import { cn } from '@/lib/utils';

export default function CornerSigils() {
  return (
    <>
      <Sigil className="top-0 left-0" />
      <Sigil className="top-0 right-0 scale-x-[-1]" color="#00d4ff" />
      <Sigil className="bottom-0 left-0 scale-y-[-1]" />
      <Sigil className="bottom-0 right-0 scale-[-1]" color="#00d4ff" />
    </>
  );
}

function Sigil({ className, color = "#9b30ff" }: { className?: string, color?: string }) {
  return (
    <div className={cn("fixed w-20 h-20 pointer-events-none z-5 opacity-35", className)}>
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 5 L40 5 L5 40 Z" stroke={color} strokeWidth="0.5" fill="none" />
        <circle cx="5" cy="5" r="2" fill={color} fillOpacity="0.8" />
        <path d="M5 5 L80 5" stroke="#1a1a4a" strokeWidth="0.5" />
        <path d="M5 5 L5 80" stroke="#1a1a4a" strokeWidth="0.5" />
        <rect x="2" y="2" width="8" height="8" stroke={color} strokeWidth="0.5" fill="none" />
      </svg>
    </div>
  );
}
