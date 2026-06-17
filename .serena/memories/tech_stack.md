# Technology Stack

## Frontend

- **React**: v19.2.4 (latest)
- **Build Tool**: Vite v6.2.0
- **UI Framework**:
  - TailwindCSS v4.2.2 (with @tailwindcss/vite plugin)
  - Lucide React v0.563.0 (icons)
- **Editor**: Monaco Editor v4.7.0 (@monaco-editor/react)
- **Markdown**: react-markdown v10.1.0 with remark-gfm
- **Virtualization**: react-window v2.2.7 for performance
- **Security**: DOMPurify v3.4.0 for sanitization

## Backend

- **Runtime**: Node.js with TypeScript (ES2022 target, ESNext modules)
- **Server**: Express v5.2.1 (latest)
- **Real-time**: Socket.io v4.8.3 (server and client)
- **Database**: SQLite via better-sqlite3 v12.10.0
- **Security**:
  - Helmet v8.2.0 (security headers)
  - express-rate-limit v8.5.2 (rate limiting)
- **Logging**: Winston v3.19.0
- **File Watching**: Chokidar v5.0.0

## AI/ML Integration

- **Google GenAI**: @google/genai v1.40.0
- **MCP**: @modelcontextprotocol/sdk v1.29.0
- **Python Integration**:
  - ask_sage.py (AI queries)
  - neural_brain.py (neural processing)

## Development Tools

- **TypeScript**: v5.8.2
- **Testing**:
  - Vitest v4.1.4 (JavaScript/TypeScript)
  - pytest (Python)
- **Linting**:
  - TSC (type checking)
  - ESLint v10.4.0 with TypeScript parser
  - Ruff (Python linting)
- **Formatting**: Prettier v3.8.3, Black (Python)
- **Bundling**: Rollup (wasm-node variant for better compatibility)

## Build Configuration

- **Module System**: ESM (type: "module")
- **JSX**: react-jsx transform
- **Path Aliases**: `@/*` maps to root directory
- **Environment**: Development on PORT 3002

## Special Dependencies

- **WebContainer**: @webcontainer/api v1.6.4 (in-browser Node runtime)
- **Puppeteer**: v24.42.0 (browser automation)
- **TSX**: v4.21.0 (TypeScript execution)

## Version Constraints

- Node types: v22.14.0
- TypeScript: ~5.8.2 (pinned minor version)
