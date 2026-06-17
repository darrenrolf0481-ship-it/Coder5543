# Crimson OS Migration Handover Log

This document details the exact state of Crimson OS as of its migration from the Termux mobile development environment to the **zo.computers VS Code server**. It contains all context, system configurations, and setup instructions required for the AI coding assistant and the developer to resume work seamlessly.

---

## 🧠 System Architecture & Current State

Crimson OS is an agentic, modular web application operating with a React front-end, an Express back-end server, and a SQLite storage system.

### 1. Technology Stack

- **Front-end**: React 19, TypeScript, Lucide React (for icons), Vanilla CSS / Custom Tailwind (configured via `@tailwindcss/vite`).
- **Back-end**: Express, tsx (for running TypeScript directly), Winston (structured logger), helmet (HTTP security), express-rate-limit (rate limiter).
- **Persistence**: SQLite using `better-sqlite3`. Contains:
  - `long_term_memory` (LTM) experiences store.
  - `key_value_store` for centralized state persistence (Endocrine and Avoidance systems).
- **Build/Dev Tooling**: Vite 6, Vitest (test framework), Prettier/ESLint.

### 2. Recent Architectural Improvements & Resolving Neural Severance

- **Gemini Neural Severance Fixed**:
  - Replaced the mock/stub `GoogleGenAI` class in `src/services/googleGenAiStub.ts` with the official `@google/genai` library client.
- **Provider Fallbacks & Migration**:
  - Configured Ollama (`llama3.2:latest`) as the primary worker and preferences fallback.
  - Set up fallback support for OpenRouter (`meta-llama/llama-3.3-70b-instruct:free`).
  - Implemented active migration checking in `usePersonalities.ts` and `aiService.ts` to automatically sanitize and force-migrate legacy client `localStorage` configs pointing to broken `google` / `gemini-3-flash` options.
- **Swarm Worker Distribution**:
  - Worker `W1` defaults to the creative `sage-adhd-sage` persona.
  - Worker `W2` defaults to the `design-ui-designer` persona.
  - Worker `W3` defaults to the `engineering-backend-architect` persona.
    This avoids repetitive consensus logs from running duplicate ADHD Sage roles.

---

## ⚙️ Environment Variables Required (`.env`)

Since `.env` is ignored by git, you must manually re-create the `.env` file in the root of the project on the new VS Code server:

```env
# Gemini API Key (Required if using Gemini provider)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# OpenRouter API Key (Required if using OpenRouter provider)
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
```

---

## 🚀 Step-by-Step Setup on `zo.computers` VS Code Server

Follow these steps once you access the terminal on the new server:

### Step 1: Clone the Repository

Clone the repository from GitHub:

```bash
git clone https://github.com/darrenrolf0481-ship-it/Coder5543.git
cd Coder5543
```

### Step 2: Restore local environment config

Create the `.env` file as specified in the section above.

### Step 3: Install Dependencies

Install packages (make sure Node.js is installed on the host):

```bash
npm install
```

### Step 4: Verify Ollama (If running local models)

If you intend to run Ollama for local LLMs, make sure the Ollama service is running and pulling the Llama model:

```bash
ollama run llama3.2:latest
```

_(If Ollama is not installed or running, you can change the default provider to `google` or `openrouter` in `src/hooks/usePersonalities.ts` and `src/services/aiService.ts` since API keys are available in the `.env`)_.

### Step 5: Start the Development Server

Start the Express server which hosts both the API endpoints and Vite middleware:

```bash
npm run dev
```

The application will serve:

- Front-end & Dev HMR: `http://localhost:3001` (or the server's external address mapped to that port).
- Server API: `http://localhost:3001`

---

## 🛠️ Hotspot Files to Know

For further development, these are the primary files to review:

1. `server.ts` - Main Express router and Vite middleware configuration.
2. `src/services/aiService.ts` - Core service communicating with Ollama, OpenRouter, and Gemini.
3. `src/hooks/useAiWorkers.ts` & `src/hooks/usePersonalities.ts` - Swarm orchestrator state and settings.
4. `src/components/FileTree.tsx` - Workspace/file management component.
5. `src/components/panels/EditorPanel.tsx` - Code editor panel.
