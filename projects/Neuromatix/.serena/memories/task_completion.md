# Task Completion Guide

Prior to marking any coding assignment or feature branch as completed:

1. **Lint Check**: Run `npm run lint` to verify eslint rules pass cleanly.
2. **Build Verification**: Run `npm run build` to confirm TypeScript compilation, static page generation, and bundle standalone optimization succeed without warnings or errors.
3. **Purge Check**: Verify no new imports/references to `@google/genai` or `process.env.GEMINI_API_KEY` are reintroduced.
4. **Sanity Check**: Run `serena memories check` to confirm memory graph integrity is intact.
