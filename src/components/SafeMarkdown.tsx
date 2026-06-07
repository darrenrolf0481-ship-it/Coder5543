import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { Check, Copy } from 'lucide-react';

const PURIFY_CFG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'thead', 'tbody',
    'tr', 'th', 'td', 'hr', 'a', 'span', 'div'
  ],
  ALLOWED_ATTR: ['href', 'class', 'id', 'target', 'rel'],
  FORCE_BODY: true,
  USE_PROFILES: { html: true },
  FORBID_ATTR: ['style', 'onerror', 'onload'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object'],
  ALLOW_DATA_ATTR: false,
};

export const CodeBlock: React.FC<{ children: any; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code my-4">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 p-1.5 bg-accent-950/80 border border-accent-500/30 rounded-md text-accent-400 opacity-0 group-hover/code:opacity-100 transition-all hover:bg-accent-900 hover:text-white z-10"
        title="Copy code"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 bg-black/40 rounded-xl border border-accent-900/20">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
};

export const SafeMarkdown: React.FC<{ children: string }> = ({ children }) => {
  const clean = useMemo(() => DOMPurify.sanitize(children ?? '', PURIFY_CFG), [children]);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ node, inline, className, children, ...props }: any) => {
          return !inline ? (
            <CodeBlock className={className}>{children}</CodeBlock>
          ) : (
            <code className={`${className} bg-accent-950/30 px-1 rounded text-accent-400`} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {clean}
    </ReactMarkdown>
  );
};
