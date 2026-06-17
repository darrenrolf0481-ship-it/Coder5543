# Core Project Overview

This is a Coder5543 AI-assisted development environment with real-time collaboration capabilities.

## Architecture

- **Frontend**: React 19 SPA with Monaco Editor, real-time Socket.io updates
- **Backend**: Express 5 server with API routers (`mem:tech_stack`)
- **AI Integration**: Google GenAI, OpenRouter, swarm orchestration (`mem:services/ai`)
- **Storage**: SQLite with better-sqlite3 for persistence (`mem:services/storage`)
- **State Management**: React Context (AppContext) with custom hooks (`mem:hooks`)

## Key Entry Points

- **Frontend**: `src/index.tsx` → `src/App.tsx`
- **Backend**: `server.ts` (Express server on PORT 3002)
- **Config**: `vite.config.ts`, `tsconfig.json`

## Project Structure

```
src/
├── api/routes/          # API route handlers
├── components/          # React components (layout, modals, panels)
├── context/            # React contexts (AppContext)
├── data/               # Static data (personalities, agent registry)
├── hooks/              # Custom hooks (useBrain, useSwarm, etc.)
│   ├── editor/         # Editor-specific hooks
│   └── terminal/       # Terminal-specific hooks
├── services/           # Business logic services
│   ├── brain/          # AI brain/decision services
│   ├── bridge/         # Bridge services
│   ├── mcp/            # Model Context Protocol
│   ├── pipeline/       # Data pipelines
│   ├── storage/        # SQLite storage layer
│   └── swarm/          # Swarm orchestration
└── utils/              # Utility functions
```

## Important Files

- `AGENT_RECORD.md` - Agent self-monitoring/recovery documentation
- `GEMINI.md` - Gemini integration documentation
- `HANDOVER.md` - Project handover notes
- `SKILL.md` - Skill system documentation

## Development Commands

See `mem:suggested_commands` for common development tasks.

## Conventions

See `mem:conventions` for code style and patterns.
