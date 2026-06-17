# Task Completion Checklist

When a coding task is completed, verify the following:

## 1. Type Checking

```bash
npm run lint
```

- Must pass with no TypeScript errors
- Uses `tsc --noEmit` for type checking only
- All type errors must be resolved

## 2. Code Formatting

```bash
npm run format
```

- Formats code with Prettier
- Ensures consistent code style across the codebase
- Run before committing changes

## 3. Testing

```bash
npm test
```

- Run Vitest test suite
- All tests must pass
- Add new tests for new functionality
- Update tests if behavior changes

## 4. Python Code (if modified)

```bash
npm run py:lint && npm run py:format && npm run py:test
```

- Lint with Ruff: `npm run py:lint`
- Format with Black: `npm run py:format` (includes Ruff fixes)
- Test with pytest: `npm run py:test`

## 5. Manual Verification (Optional)

```bash
npm run dev
```

- Start development server on PORT 3002
- Verify functionality manually if needed
- Check browser console for errors

## 6. Git Workflow

After verification passes:

```bash
git add <modified-files>
git commit -m "descriptive commit message"
git push
```

## Pre-commit Checklist

- [ ] Type check passes (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Tests pass (`npm test`)
- [ ] Python tests pass (if applicable)
- [ ] Manual testing completed (if needed)
- [ ] Changes committed with clear message

## Build Verification (Optional)

```bash
npm run build
```

- Verify production build succeeds
- Check bundle size for unexpected increases
- Test production build if critical changes

## Environment Variables

Ensure `.env` file exists with required keys:

- `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY` (required)
- `VITE_OPENROUTER_API_KEY` (optional)
