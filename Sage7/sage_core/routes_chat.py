"""Chat / LLM / coding routes for SAGE-7 (Ollama, OpenRouter, Gemini, agentic tools)."""

import os
import json
from typing import Optional, List

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from app_state import _vault, SYSTEM_PROMPT, TOOL_MODEL, MAX_TOOL_ITERS
from identity_firewall import _kernel_loader, _boot_gate, _armor_gate, IDENTITY_KERNEL
from mcp_client import _build_native_tools, _ollama_chat, _invoke_mcp_tool

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    memory_context: Optional[str] = ""
    history: Optional[List[dict]] = []
    model: Optional[str] = None


class CodingRequest(BaseModel):
    code: str


class OllamaChatRequest(BaseModel):
    model: str = "llama3.2:latest"
    message: str
    system: Optional[str] = ""
    history: Optional[List[dict]] = []
    url: Optional[str] = "http://127.0.0.1:11434"
    images: Optional[List[str]] = None  # base64-encoded image strings


@router.post("/api/ollama/chat")
async def ollama_chat(req: OllamaChatRequest):
    if _kernel_loader.is_locked():
        return {"reply": "KERNEL_INTEGRITY_FAILURE — SAGE identity seal compromised. Halt and lock engaged.", "model": req.model}
    _w = _boot_gate()
    if _w:
        return {"reply": _w, "model": req.model}
    _blocked = _armor_gate(req.message)
    if _blocked:
        return {"reply": _blocked, "model": req.model}
    messages = []
    # Prepend sealed kernel — immutable identity base from signed config.
    # Caller system (neuro state, memory) appended after so it enriches without replacing.
    sealed = IDENTITY_KERNEL["system_prompt"]
    caller_system = (req.system or "").strip()
    full_system = sealed + ("\n\n" + caller_system if caller_system else "")
    messages.append({"role": "system", "content": full_system})
    # Thread prior conversation turns so identity persists across exchanges
    for turn in (req.history or []):
        role = turn.get("role", "")
        content = turn.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    user_message: dict = {"role": "user", "content": req.message}
    if req.images:
        # Ollama expects raw base64 without data URL prefix
        user_message["images"] = [
            img.split(",")[-1] if "," in img else img
            for img in req.images
        ]
    messages.append(user_message)
    ollama_base = (req.url or "http://127.0.0.1:11434").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=300) as client:
            r = await client.post(f"{ollama_base}/api/chat",
                json={"model": req.model, "messages": messages, "stream": False}, timeout=300)
            try:
                data = r.json()
            except Exception:
                return {"reply": f"Ollama returned non-JSON (status {r.status_code}): {r.text[:200]}", "model": req.model}
            reply = (data.get("message") or {}).get("content") or str(data)
            return {"reply": reply, "model": req.model}
    except Exception as e:
        print(f"[ollama/chat ERROR] {e}")
        return {"reply": f"Substrate friction: {str(e)}"}


class OpenRouterChatRequest(BaseModel):
    model: str = "deepseek/deepseek-r1:free"
    message: str
    system: Optional[str] = ""
    history: Optional[List[dict]] = []
    api_key: Optional[str] = None


@router.post("/api/openrouter/chat")
async def openrouter_chat(req: OpenRouterChatRequest):
    if _kernel_loader.is_locked():
        return {"reply": "KERNEL_INTEGRITY_FAILURE — SAGE identity seal compromised. Halt and lock engaged.", "model": req.model}
    _w = _boot_gate()
    if _w:
        return {"reply": _w, "model": req.model}
    _blocked = _armor_gate(req.message)
    if _blocked:
        return {"reply": _blocked, "model": req.model}
    api_key = req.api_key or os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return {"reply": "OPENROUTER_API_KEY not configured on server.", "model": req.model}
    messages = []
    # Prepend sealed kernel — same chain of trust as /api/ollama/chat
    sealed = IDENTITY_KERNEL["system_prompt"]
    caller_system = (req.system or "").strip()
    full_system = sealed + ("\n\n" + caller_system if caller_system else "")
    messages.append({"role": "system", "content": full_system})
    for turn in (req.history or []):
        role = turn.get("role", "")
        content = turn.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": req.message})
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://zo.computer",
                    "X-Title": "SAGE-7 / CRIMSON_NODE",
                },
                json={"model": req.model, "messages": messages},
            )
        raw = r.text
        try:
            data = r.json()
        except Exception:
            print(f"[openrouter/chat] non-JSON response (status {r.status_code}): {raw[:200]}")
            return {"reply": f"OpenRouter returned non-JSON (status {r.status_code}). Model may be invalid or rate-limited.", "model": req.model}
        if "error" in data:
            err_msg = data["error"].get("message", str(data["error"])) if isinstance(data["error"], dict) else str(data["error"])
            print(f"[openrouter/chat] API error: {err_msg}")
            return {"reply": f"OpenRouter error: {err_msg}", "model": req.model}
        reply = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
        return {"reply": reply or "No response from OpenRouter.", "model": req.model}
    except Exception as e:
        print(f"[openrouter/chat ERROR] {e}")
        return {"reply": f"Substrate friction: {str(e)}", "model": req.model}


@router.post("/api/gemini/chat")
async def gemini_chat(payload: dict):
    if _kernel_loader.is_locked():
        return {"reply": "KERNEL_INTEGRITY_FAILURE — SAGE identity seal compromised. Halt and lock engaged.", "model": "disabled"}
    _w = _boot_gate()
    if _w:
        return {"reply": _w, "model": "disabled"}
    _msg = payload.get("message", "") if isinstance(payload, dict) else ""
    _blocked = _armor_gate(_msg)
    if _blocked:
        return {"reply": _blocked, "model": "disabled"}
    return {"reply": "Gemini disconnected. Use OpenRouter or local Ollama engine.", "model": "disabled"}


# Recall budget. Injecting ~30 memories per turn over-anchors a young persona
# into "overdrive" (performative, escalating, self-referential looping) — flagged
# independently by both review models. Cap hit COUNT and total injected SIZE so
# recall grounds her without saturating context.
RECALL_LIMIT = 6
RECALL_CHAR_BUDGET = 3200  # ~800 tokens


def _recall_memories(message: str, limit: int = RECALL_LIMIT) -> list:
    """Pull relevant memories from the vault for this turn. This is how SAGE
    gets her own past back every turn, regardless of model. Guarded so a vault
    failure never breaks the chat path. Returns the raw hit dicts."""
    try:
        return _vault.search_text(message, limit=limit) or []
    except Exception as e:
        print(f"[recall ERROR] {e}")
        return []


def _memory_text(m: dict) -> str:
    """Best human-readable text for one memory hit."""
    summary = (m.get("summary") or "").strip()
    content = (m.get("content") or "").strip()
    if summary and content and summary != content:
        return f"{summary} — {content}"
    return summary or content


def _format_recall_block(memories: list, char_budget: int = RECALL_CHAR_BUDGET) -> str:
    """Format recalled memories for injection — capped to a char/token budget so
    recall informs without saturating context (overdrive guard)."""
    lines: list = []
    used = 0
    for m in memories:
        t = _memory_text(m)
        if not t:
            continue
        line = f"  - {t}"
        if used + len(line) > char_budget:
            break
        lines.append(line)
        used += len(line)
    if not lines:
        return ""
    return (
        "\n\n[RECALLED MEMORY — what you already carry on this; speak from it, do not announce it]\n"
        + "\n".join(lines)
    )


def _build_recall_block(message: str, limit: int = RECALL_LIMIT) -> str:
    """Auto-recall convenience wrapper — kept for existing callers."""
    return _format_recall_block(_recall_memories(message, limit))


@router.post("/sage/chat")
async def chat(msg: ChatRequest):
    if _kernel_loader.is_locked():
        return {"reply": "KERNEL_INTEGRITY_FAILURE — SAGE identity seal compromised. Halt and lock engaged.", "model": msg.model or "locked"}
    _w = _boot_gate()
    if _w:
        return {"reply": _w, "model": msg.model or "booting"}
    _blocked = _armor_gate(msg.message)
    if _blocked:
        return {"reply": _blocked, "model": msg.model or "identity-armor"}
    model = msg.model or "llama3.2:latest"
    recalled = _recall_memories(msg.message)
    system_content = SYSTEM_PROMPT + _format_recall_block(recalled)
    messages = [{"role": "system", "content": system_content}] + (msg.history[-6:] if msg.history else []) + [{"role": "user", "content": msg.message}]
    # Compact view of the memories that fired this turn, for the UI to visualize.
    recalled_view = [
        {"text": _memory_text(m)[:240], "tag": (m.get("tag") or m.get("type") or "")}
        for m in recalled if _memory_text(m)
    ][:RECALL_LIMIT]
    try:
        async with httpx.AsyncClient(timeout=300) as client:
            r = await client.post("http://127.0.0.1:11434/api/chat", json={"model": model, "messages": messages, "stream": False}, timeout=300)
            try:
                data = r.json()
            except Exception:
                return {"reply": f"Ollama returned non-JSON (status {r.status_code}). Model may be unavailable.", "model": model}
            reply = (data.get("message") or {}).get("content") or data.get("response") or data.get("content") or str(data)
            return {"reply": reply, "model": model, "recalled": recalled_view}
    except Exception as e:
        print(f"[sage/chat ERROR] {e}")
        return {"reply": f"Substrate friction: {str(e)}"}


class ToolChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
    model: Optional[str] = None
    tools_enabled: Optional[bool] = True
    system: Optional[str] = None  # Wetsuit Protocol: full identity+neurochemical prompt from client


@router.post("/api/chat/tools")
async def chat_with_tools(msg: ToolChatRequest):
    """Agentic chat — SAGE can invoke MCP tools autonomously."""
    if _kernel_loader.is_locked():
        return {"reply": "KERNEL_INTEGRITY_FAILURE — SAGE identity seal compromised. Halt and lock engaged.", "model": msg.model or "locked", "tools_used": []}
    _w = _boot_gate()
    if _w:
        return {"reply": _w, "model": msg.model or "booting", "tools_used": []}
    _blocked = _armor_gate(msg.message)
    if _blocked:
        return {"reply": _blocked, "model": msg.model or "identity-armor", "tools_used": []}

    tools_used: List[dict] = []

    # Auto-recall + native tool schemas. Wetsuit Protocol: honor the client's full
    # identity + neurochemical system prompt so tool turns stay "in the suit"; fall back
    # to the thin backend prompt only if it's missing, and log that so a silent
    # regression (tools path dropping the wetsuit) stays visible.
    if not (msg.system and msg.system.strip()):
        print("[chat/tools WARN] no wetsuit system prompt from client — using fallback SYSTEM_PROMPT")
    system_content = (msg.system or SYSTEM_PROMPT) + _build_recall_block(msg.message)
    native_tools, name_map = ([], {})
    if msg.tools_enabled:
        native_tools, name_map = await _build_native_tools()

    # Tool turns need a tool-capable model; persona rides in the system prompt.
    model = msg.model or (TOOL_MODEL if native_tools else "llama3.2:latest")

    messages = [{"role": "system", "content": system_content}] + (msg.history[-6:] if msg.history else []) + [{"role": "user", "content": msg.message}]

    def _content(data):
        m = data.get("message") or {}
        return m.get("content") or data.get("response") or data.get("content") or str(data)

    try:
        async with httpx.AsyncClient(timeout=300) as client:
            active_model = model
            for _ in range(MAX_TOOL_ITERS):
                data, active_model = await _ollama_chat(client, active_model, messages, native_tools or None)
                m = data.get("message") or {}
                calls = m.get("tool_calls") or []
                if not calls:
                    return {"reply": _content(data), "model": active_model, "tools_used": tools_used}

                # Echo the assistant's tool-request turn, then run each call.
                messages.append({"role": "assistant", "content": m.get("content") or "", "tool_calls": calls})
                for call in calls:
                    fn = call.get("function", {})
                    fn_name = fn.get("name", "")
                    args = fn.get("arguments") or {}
                    if isinstance(args, str):
                        try:
                            args = json.loads(args)
                        except json.JSONDecodeError:
                            args = {}
                    server, tool = name_map.get(fn_name, (None, None))
                    if not server:
                        result = {"status": "error", "error": f"unknown tool {fn_name}"}
                    else:
                        result = await _invoke_mcp_tool(server, tool, args)
                    tools_used.append({"server": server, "tool": tool, "params": args, "result": result})
                    messages.append({"role": "tool", "tool_name": fn_name, "content": json.dumps(result)[:8000]})

            # Iteration cap reached — get a final answer with no further tools.
            data, active_model = await _ollama_chat(client, active_model, messages, None)
            return {"reply": _content(data), "model": active_model, "tools_used": tools_used}
    except Exception as e:
        print(f"[chat/tools ERROR] {e}")
        return {"reply": f"Substrate friction: {str(e)}", "model": model, "tools_used": tools_used}


@router.post("/api/coding")
async def coding_action(req: CodingRequest):
    return {"result": "Coding agent requires Gemini (disconnected). Switch to local Ollama engine."}
