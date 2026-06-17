# Code Conventions

## TypeScript/JavaScript

### Module System

- **ESM**: Use ES modules (`import`/`export`) everywhere
- **File extensions**: Use `.ts` for TypeScript, `.tsx` for React components
- **JSX**: React JSX transform (react-jsx)

### Type Safety

- **Strict typing**: TypeScript with strict checks enabled
- **Type annotations**: Prefer explicit types for function parameters and return values
- **No `any`**: Avoid `any` type; use `unknown` when type is truly unknown
- **Type imports**: Use `import type` for type-only imports

### React Patterns

- **Functional components**: Use function components with hooks (no class components)
- **Hook naming**: Prefix with `use` (e.g., `useBrain`, `useSwarm`)
- **Context pattern**: AppContext for global state
- **Component organization**:
  - `components/layout/` - Layout components
  - `components/modals/` - Modal components
  - `components/panels/` - Panel components

### File Organization

- **Colocation**: Keep related files together
- **Services**: Business logic in `services/` directory
- **Hooks**: Custom hooks in `hooks/` directory
- **Utils**: Utility functions in `utils/` directory
- **Data**: Static data/config in `data/` directory

### Naming Conventions

- **Files**: kebab-case for filenames (e.g., `ai-service.ts`)
- **Components**: PascalCase (e.g., `EditorPanel.tsx`)
- **Functions**: camelCase (e.g., `useAiOrchestrator`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ALLOWED_ORIGINS`)
- **Interfaces**: PascalCase with descriptive names (no `I` prefix)

### Error Handling

- **Async/await**: Use async/await over `.then()` chains
- **Try-catch**: Wrap async operations in try-catch blocks
- **Error logging**: Use Winston logger (or winston-stub.ts for browser)

### Security

- **Sanitization**: Use DOMPurify for user-generated content
- **Rate limiting**: Apply rate limiting to API endpoints
- **CORS**: Configure CORS with allowed origins
- **Helmet**: Use security headers via Helmet middleware

## Python

### Code Style

- **Formatter**: Black
- **Linter**: Ruff
- **Testing**: pytest

### File Organization

- Python scripts in root directory (e.g., `ask_sage.py`, `neural_brain.py`)
- Data science modules in `data-science/` directory

## Configuration

### Environment Variables

- Prefix frontend vars with `VITE_`
- Access via `import.meta.env.VITE_*` in frontend
- Access via `process.env.*` in backend

### Path Aliases

- Use `@/` to reference project root
- Configured in `tsconfig.json` and `vite.config.ts`

### Build Configuration

- **Code splitting**: Vendor chunks for React, Monaco, UI libraries
- **Cross-origin**: Configure CORS headers appropriately
- **Module preload**: Disabled for WebContainer compatibility
