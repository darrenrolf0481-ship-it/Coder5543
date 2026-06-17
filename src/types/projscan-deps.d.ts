// Ambient type declarations for projscan dependencies that do not ship their
// own types. Keeps `tsc --noEmit` clean when projscan sources are included.

declare module '@xenova/transformers' {
  export interface EmbeddingPipeline {
    (text: string | string[], options?: { pooling?: string; normalize?: boolean }): Promise<
      { data: number[] | Float32Array | number[][] }
    >;
  }
  export function pipeline(
    task: 'feature-extraction',
    model?: string,
    options?: Record<string, unknown>
  ): Promise<EmbeddingPipeline>;
  export const env: Record<string, unknown>;
}

declare module 'web-tree-sitter' {
  export class Parser {
    setLanguage(language: unknown): void;
    parse(input: string): Tree;
    delete(): void;
  }
  export class Tree {
    rootNode: SyntaxNode;
    delete(): void;
  }
  export interface SyntaxNode {
    type: string;
    text: string;
    startPosition: { row: number; column: number };
    endPosition: { row: number; column: number };
    children: SyntaxNode[];
    walk(): TreeCursor;
  }
  export interface TreeCursor {
    nodeType: string;
    nodeText: string;
    startPosition: { row: number; column: number };
    endPosition: { row: number; column: number };
    gotoFirstChild(): boolean;
    gotoNextSibling(): boolean;
    gotoParent(): boolean;
  }
  export function init(options?: { locateFile?: (path: string) => string }): Promise<void>;
}

declare module 'fast-glob' {
  interface Entry {
    path: string;
    stats?: { size: number; [key: string]: unknown };
    dirent?: unknown;
  }
  function glob(patterns: string | string[], options?: ({ stats?: false } & Record<string, unknown>)): Promise<string[]>;
  function glob(patterns: string | string[], options: ({ stats: true } & Record<string, unknown>)): Promise<Entry[]>;
  namespace glob {
    function sync(patterns: string | string[], options?: ({ stats?: false } & Record<string, unknown>)): string[];
    function sync(patterns: string | string[], options: ({ stats: true } & Record<string, unknown>)): Entry[];
  }
  export = glob;
}
