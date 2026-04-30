import React from 'react';

const renderContent = (line: string): React.ReactNode => {
  if (line.startsWith('$ ')) {
    return (
      <>
        <span className="text-red-500 font-black">$ </span>
        <span className="text-red-300 font-bold">{line.substring(2)}</span>
      </>
    );
  }
  if (line.startsWith('NEURAL_LINK:')) {
    return <span className="text-red-500 font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">{line}</span>;
  }
  if (line.startsWith('COMMAND_INTEL:')) {
    return <span className="text-red-400 italic opacity-80">{line}</span>;
  }

  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  const regex = /(\[ERROR\]|\[WARN\]|\[INFO\]|\[SYSTEM\]|\[SUCCESS\]|CRIMSON OS|Kernel:|"[^"]*"|'[^']*'|\b\/(?:[\w.-]+\/)*[\w.-]+|\.\/(?:[\w.-]+\/)*[\w.-]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > currentIndex) {
      parts.push(
        <span key={`t-${currentIndex}`} className="text-red-100/60">
          {line.substring(currentIndex, match.index)}
        </span>
      );
    }
    const m = match[0];
    let cls = 'text-red-100/60';
    if (m === '[ERROR]') cls = 'text-red-500 font-black bg-red-950/50 px-1 rounded';
    else if (m === '[WARN]') cls = 'text-orange-500 font-black bg-orange-950/50 px-1 rounded';
    else if (m === '[INFO]') cls = 'text-blue-400 font-black bg-blue-950/50 px-1 rounded';
    else if (m === '[SYSTEM]') cls = 'text-purple-400 font-black bg-purple-950/50 px-1 rounded';
    else if (m === '[SUCCESS]') cls = 'text-green-400 font-black bg-green-950/50 px-1 rounded';
    else if (m === 'CRIMSON OS' || m === 'Kernel:') cls = 'text-red-500 font-black tracking-widest';
    else if (m.startsWith('"') || m.startsWith("'")) cls = 'text-green-400/80';
    else if (m.startsWith('/') || m.startsWith('./')) cls = 'text-blue-300/80 underline decoration-blue-900/50 underline-offset-2';
    parts.push(<span key={`m-${match.index}`} className={cls}>{m}</span>);
    currentIndex = regex.lastIndex;
  }

  if (currentIndex < line.length) {
    parts.push(
      <span key={`t-${currentIndex}`} className="text-red-100/60">
        {line.substring(currentIndex)}
      </span>
    );
  }

  return parts.length > 0 ? <>{parts}</> : <span className="text-red-100/60">{line}</span>;
};

export const TerminalLine = React.memo(({ line }: { line: string }) => (
  <div className="mb-3 leading-relaxed whitespace-pre-wrap">
    {renderContent(line)}
  </div>
));
