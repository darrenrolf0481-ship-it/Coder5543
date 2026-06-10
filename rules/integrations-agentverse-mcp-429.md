# Agentverse MCP 429 Error (Rate Limiting)

**Impact: HIGH** | **Category: integrations** | **Tags:** mcp, agentverse, 429, fetch.ai, rate-limit

When integrating the Fetch.ai Agentverse MCP server, you may encounter persistent HTTP 429 (Too Many Requests) errors during initialization.

## Why This Happens
The standard Agentverse MCP server (`https://mcp.agentverse.ai/sse`) has strict per-request rate limits. When an MCP client (like Cursor, Claude Desktop, or our internal orchestrator) connects, it performs a rapid sequence of handshake requests (`initialize` -> `tools/list`). This bursting behavior triggers the 429 rate limit immediately.

## The Fix: Use the "Lite" Endpoint
Fetch.ai provides a specialized "Lite" endpoint optimized for these client handshake bursts. 

### ❌ Incorrect (Standard URL)
```json
{
  "mcpServers": {
    "agentverse": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-agentverse"],
      "env": {
        "AGENTVERSE_URL": "https://mcp.agentverse.ai/sse"
      }
    }
  }
}
```

### ✅ Correct (Lite URL)
Always use the `mcp-lite` URL for IDEs and local agents:
```json
{
  "mcpServers": {
    "agentverse": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-agentverse"],
      "env": {
        "AGENTVERSE_URL": "https://mcp-lite.agentverse.ai/mcp"
      }
    }
  }
}
```

**Additional Recovery Steps:**
If a 429 error has already been triggered, the IP/Key is placed in a temporary penalty box. Wait 1-2 minutes for the rate limit window to reset before attempting to reconnect with the Lite URL.
