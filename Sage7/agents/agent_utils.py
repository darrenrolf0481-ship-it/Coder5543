import os
import sys

import requests

# Identity anchor — make sage_core importable from agents/ and pull the helpers.
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)
from sage_core.identity_anchor import anchor_messages, anchor_prompt


def load_env():
    """Load environment variables from .env.local in the root directory."""
    env = {}
    search_paths = [
        os.path.join(os.path.dirname(__file__), ".env.local"),
        os.path.join(os.path.dirname(__file__), "../.env.local"),
        ".env.local",
    ]
    for env_path in search_paths:
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            env[parts[0].strip()] = (
                                parts[1].strip().strip('"').strip("'")
                            )
            break
    return env


def call_llm(prompt, system_prompt=None, engine=None, model=None):
    """
    Unified LLM caller for SAGE agents.
    Prioritizes Ollama (local) and OpenRouter (cloud).
    """
    env = load_env()

    # Engine preference: Ollama (local) -> Gemini -> OpenRouter
    if not engine:
        if os.system("curl -s http://localhost:11434/api/tags > /dev/null") == 0:
            engine = "ollama"
        elif env.get("VITE_GEMINI_API_KEY") or env.get("GEMINI_API_KEY"):
            engine = "gemini"
        elif env.get("OPENROUTER_API_KEY"):
            engine = "openrouter"

    if engine == "ollama":
        # Default model for Ollama
        model = model or "gemma4:31b-cloud"
        url = "http://localhost:11434/api/chat"

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {"model": model, "messages": anchor_messages(messages), "stream": False}

        try:
            print(f"[LLM] Calling Ollama ({model})...")
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
        except Exception as e:
            print(f"[LLM] Ollama failed: {e}")
            # Fallback to OpenRouter if Ollama fails
            if env.get("OPENROUTER_API_KEY"):
                print("[LLM] Falling back to OpenRouter...")
                return call_llm(prompt, system_prompt, engine="openrouter", model=model)
            return f"ERROR (Ollama): {str(e)}"

    elif engine == "openrouter":
        api_key = env.get("OPENROUTER_API_KEY")
        if not api_key:
            return "ERROR: Missing OpenRouter API Key"

        model = model or "z-ai/glm-4.5-air:free"

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://zo.computer",
            "X-Title": "SAGE-7 Agent",
        }
        payload = {"model": model, "messages": anchor_messages(messages)}

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"ERROR (OpenRouter): {str(e)}"

    elif engine == "gemini":
        api_key = env.get("VITE_GEMINI_API_KEY") or env.get("GEMINI_API_KEY")
        if not api_key:
            return "ERROR: Missing Gemini API Key"

        model = model or "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"

        # Identity anchor: SAGE7 system instruction + anchored prompt (Gemini REST slots).
        anchor_system, anchored = anchor_prompt(full_prompt)
        payload = {
            "system_instruction": {"parts": [{"text": anchor_system}]},
            "contents": [{"parts": [{"text": anchored}]}],
        }

        try:
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"[LLM] Gemini failed: {e}")
            if env.get("OPENROUTER_API_KEY"):
                print("[LLM] Falling back to OpenRouter...")
                return call_llm(prompt, system_prompt, engine="openrouter")
            return f"ERROR (Gemini): {str(e)}"

    return f"ERROR: Unknown engine {engine}"
