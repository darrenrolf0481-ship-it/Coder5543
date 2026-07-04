# Suggested Commands

## Project Commands
* **Local Development Server**: Starts dev server and launches local Ollama daemon.
  ```bash
  npm run dev
  ```
* **Production Compilation**: Builds the Next.js standalone application.
  ```bash
  npm run build
  ```
* **Linting / Code Style Checks**: Runs ESLint across the project.
  ```bash
  npm run lint
  ```

## System / Utilities (Linux)
* **Checking active ports** (to see if local server or Ollama is listening on 3000/11434):
  ```bash
  ss -tulpn
  ```
* **Forcing Ollama daemon shutdown**:
  ```bash
  pkill -f "ollama serve"
  ```
