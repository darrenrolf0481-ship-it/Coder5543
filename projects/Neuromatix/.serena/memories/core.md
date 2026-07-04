# Neuromatix Core Source Map

This memory defines the project-wide invariants and guides agents through the workspace.

## Memory Navigation Graph
* Technical specifications and AI providers are described in `mem:tech_stack`.
* Local execution commands and system utilities are listed in `mem:suggested_commands`.
* Coding conventions, styling, and design patterns are detailed in `mem:conventions`.
* Final tasks to run prior to completing any coding assignment are listed in `mem:task_completion`.

## Project Invariants
* Default operational store is Zustand, managed in `store/useProjectStore.ts`.
* Language Server Protocol (LSP) integrations are configured in `.serena/project.yml`.
* All AI requests must bypass legacy Google Gemini libraries and execute local `ollama` or cloud `openrouter` endpoints.
