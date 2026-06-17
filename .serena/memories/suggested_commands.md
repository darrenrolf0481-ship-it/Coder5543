# Suggested Commands

## Development

```bash
npm run dev
```

Start development server on PORT 3002 with hot reload.

## Production

```bash
npm run start
```

Start production server (NODE_ENV=production).

## Building

```bash
npm run build
```

Build production bundle with Vite. Output in `dist/` directory.

## Testing

```bash
npm test
```

Run Vitest test suite.

```bash
npm run py:test
```

Run Python tests with pytest.

## Linting & Type Checking

```bash
npm run lint
```

Type check with TSC (--noEmit flag).

```bash
npm run py:lint
```

Lint Python code with Ruff.

## Formatting

```bash
npm run format
```

Format code with Prettier.

```bash
npm run py:format
```

Format Python code with Black and fix Ruff issues.

## System Utilities

Standard Unix commands work as expected on Linux:

- `git` - Version control
- `ls`, `grep`, `find` - File system operations
- `cat`, `less` - File viewing

## Task Completion Checklist

After completing coding tasks, run:

1. `npm run lint` - Verify no type errors
2. `npm run format` - Ensure consistent formatting
3. `npm test` - Verify all tests pass
4. (If Python changes) `npm run py:lint && npm run py:format && npm run py:test`

## Environment Setup

Requires environment variables in `.env` file:

- `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY`
- `OPENROUTER_API_KEY` or `VITE_OPENROUTER_API_KEY` (optional)
