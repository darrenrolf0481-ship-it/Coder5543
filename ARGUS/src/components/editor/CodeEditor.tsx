import { useRef, useLayoutEffect } from 'react';

// Lightweight syntax-highlighting editor: a transparent <textarea> layered
// over a highlighted <pre>. Zero deps, no web workers, no external loads —
// safe inside the single-file classic-script bundle where Monaco's worker/
// module machinery would break. Highlights TS/JS/JSON-ish source.

const KEYWORDS =
  'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|' +
  'import|export|from|as|default|class|extends|super|new|delete|typeof|instanceof|' +
  'await|async|yield|type|interface|enum|implements|public|private|protected|readonly|' +
  'null|undefined|true|false|void|this|in|of|try|catch|finally|throw';

const TOKEN = new RegExp(
  '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' +            // 1: comments
  '|(`(?:\\\\.|[^`\\\\])*`|"(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')' + // 2: strings
  '|\\b(' + KEYWORDS + ')\\b' +                          // 3: keywords
  '|\\b(\\d[\\d_.]*)\\b',                                // 4: numbers
  'g',
);

const COLOR = { comment: '#5b7089', string: '#6ee7b7', keyword: '#7aa2f7', number: '#e0af68' };

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(code: string): string {
  const escaped = escapeHtml(code);
  const html = escaped.replace(TOKEN, (m, comment, str, kw, num) => {
    if (comment) return `<span style="color:${COLOR.comment};font-style:italic">${comment}</span>`;
    if (str) return `<span style="color:${COLOR.string}">${str}</span>`;
    if (kw) return `<span style="color:${COLOR.keyword}">${kw}</span>`;
    if (num) return `<span style="color:${COLOR.number}">${num}</span>`;
    return m;
  });
  // trailing newline so the highlight layer matches textarea height on last line
  return html + '\n';
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

const SHARED: React.CSSProperties = {
  margin: 0,
  padding: '12px',
  border: 0,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '12px',
  lineHeight: '20px',
  tabSize: 2,
  whiteSpace: 'pre',
  overflowWrap: 'normal',
};

export function CodeEditor({ value, onChange, onBlur, placeholder }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = value.split('\n').length;

  // Keep the highlight layer + gutter scroll-locked to the textarea.
  const syncScroll = () => {
    if (taRef.current && preRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
    if (taRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = taRef.current.scrollTop;
    }
  };

  useLayoutEffect(syncScroll, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.slice(0, start) + '  ' + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Line-number gutter (scroll-synced) */}
      <div
        ref={gutterRef}
        aria-hidden
        style={{
          ...SHARED,
          width: 44, flexShrink: 0, textAlign: 'right', paddingRight: 8,
          overflow: 'hidden', color: '#475569',
          background: 'rgba(2,6,23,0.4)', borderRight: '1px solid rgba(14,60,96,0.15)',
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>

      {/* Editor surface */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <pre
          ref={preRef}
          aria-hidden
          style={{
            ...SHARED,
            position: 'absolute', inset: 0, overflow: 'auto',
            color: '#cbd5e1', pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{ __html: highlight(value) }}
        />
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          spellCheck={false}
          placeholder={placeholder}
          style={{
            ...SHARED,
            position: 'absolute', inset: 0, overflow: 'auto',
            background: 'transparent', color: 'transparent',
            caretColor: '#38bdf8', outline: 'none', resize: 'none',
          }}
        />
      </div>
    </div>
  );
}
