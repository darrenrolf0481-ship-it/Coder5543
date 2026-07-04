# Neuromatix Node Studio

This contains everything you need to run your Neuromatix workspace locally.

## Run Locally

**Prerequisites:** Node.js, Ollama (optional, for local node execution)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file and add your OpenRouter API Key if utilizing the cloud endpoint:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

3. **Run the App:**
   This starts the development server and concurrently initializes the local Ollama daemon:
   ```bash
   npm run dev
   ```
