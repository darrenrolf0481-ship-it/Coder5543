"""MCP / tool-calling plumbing for SAGE-7.

The bridge to the mcpo proxy: builds native function schemas from the MCP OpenAPI
specs, runs Ollama /api/chat round-trips (with a transparent retry on TOOL_MODEL
when a base model can't do tools), and invokes individual MCP tools.

Shared by the chat routes (tool turns) and the /api/mcp proxy routes, so both
import _mcp_headers / MCPO_BASE from here. Imports only app_state config.
"""

import os
import json
from typing import List

import httpx

from app_state import _MCP_SERVERS, TOOL_MODEL


MCPO_BASE = "http://127.0.0.1:3030"
MCPO_KEY = os.environ.get("ZO_MCPO_API_KEY", "")

def _mcp_headers():
    headers = {}
    if MCPO_KEY:
        headers["Authorization"] = f"Bearer {MCPO_KEY}"
    return headers


def _resolve_schema(schema: dict, components: dict) -> dict:
    """Resolve a possibly-$ref'd OpenAPI schema node into an inline JSON schema."""
    if not isinstance(schema, dict):
        return {"type": "object", "properties": {}}
    if "$ref" in schema:
        ref = schema["$ref"].split("/")[-1]
        return _resolve_schema(components.get(ref, {}), components)
    return schema


async def _build_native_tools():
    """Build Ollama/OpenAI-style function schemas from the mcpo OpenAPI specs.

    Returns (tools_list, name_map). name_map maps the flat function name
    (``server__tool``) back to (server, tool) for dispatch, since native tool
    names can't carry a slash.
    """
    tools: List[dict] = []
    name_map: dict = {}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            for server in _MCP_SERVERS:
                try:
                    docs = await client.get(f"{MCPO_BASE}/{server}/openapi.json", headers=_mcp_headers())
                    spec = docs.json()
                    components = spec.get("components", {}).get("schemas", {})
                    for path, methods in spec.get("paths", {}).items():
                        post = methods.get("post")
                        if not post:
                            continue
                        tool = path.strip("/")
                        fn_name = f"{server}__{tool}"
                        raw = (post.get("requestBody", {}).get("content", {})
                                   .get("application/json", {}).get("schema", {}))
                        resolved = _resolve_schema(raw, components)
                        # keep only the JSON-schema keys models expect
                        params = {k: v for k, v in resolved.items()
                                  if k in ("type", "properties", "required")}
                        params.setdefault("type", "object")
                        params.setdefault("properties", {})
                        tools.append({
                            "type": "function",
                            "function": {
                                "name": fn_name,
                                "description": (post.get("description") or post.get("summary")
                                                or f"{server} {tool}"),
                                "parameters": params,
                            },
                        })
                        name_map[fn_name] = (server, tool)
                except (httpx.RequestError, httpx.ConnectError, json.JSONDecodeError, KeyError, AttributeError):
                    pass
    except Exception as e:
        print(f"[_build_native_tools ERROR] {e}")
    return tools, name_map


async def _ollama_chat(client, model: str, messages: list, tools=None):
    """One /api/chat round-trip. If the model can't do tools, transparently
    retry once on TOOL_MODEL so a tool turn never dead-ends on a base model.
    Returns (data, model_used)."""
    payload = {"model": model, "messages": messages, "stream": False}
    if tools:
        payload["tools"] = tools
    r = await client.post("http://127.0.0.1:11434/api/chat", json=payload, timeout=300)
    if r.status_code == 400 and tools and "does not support tools" in r.text.lower() and model != TOOL_MODEL:
        payload["model"] = TOOL_MODEL
        r = await client.post("http://127.0.0.1:11434/api/chat", json=payload, timeout=300)
        return r.json(), TOOL_MODEL
    return r.json(), model


async def _invoke_mcp_tool(server: str, tool: str, params: dict) -> dict:
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"{MCPO_BASE}/{server}/{tool}",
                json=params,
                headers=_mcp_headers()
            )
            return {"status": "success", "result": r.json()}
    except Exception as e:
        return {"status": "error", "error": str(e)}
