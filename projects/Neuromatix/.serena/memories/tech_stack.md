# Tech Stack

- Language: TypeScript
- Frontend Framework: Next.js 15.5+ (standalone)
- Component Styling: Vanilla CSS / Tailwind (if requested)
- State Management: Zustand (see [useProjectStore.ts](file:///home/workspace/install/store/useProjectStore.ts))
- LLM Frameworks & Rerouting:
  - Local node daemon: Ollama (default model `llama3` on `http://localhost:11434`)
  - Cloud provider fallback: OpenRouter (`meta-llama/llama-3-8b-instruct:free` fallback)
  - No active Google Gemini dependencies (completely purged)
