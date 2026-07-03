import os
import shlex
import shutil
import subprocess

import httpx
from mcp.server.fastmcp import FastMCP

_host = os.getenv("MCP_HOST", "127.0.0.1")
_port = int(os.getenv("MCP_PORT", "8002"))

# Port in constructor, not run()
mcp = FastMCP("SAGE-7 CLI Tooling", host=_host, port=_port)


@mcp.tool()
async def gh_command(args: list[str]) -> str:
    """
    Execute a GitHub CLI (gh) command.
    Example args: ["repo", "list", "darrenrolf0481-ship-it"]
    """
    try:
        gh_bin = shutil.which("gh")
        if not gh_bin:
            return "Error: gh binary not found in PATH"
        env = os.environ.copy()
        result = subprocess.run(  # nosec B603 — gh path resolved via shutil.which, args are controlled
            [gh_bin] + args,
            capture_output=True,
            text=True,
            env=env,
            check=False,
            shell=False,
        )
        if result.returncode != 0:
            return f"Error executing gh: {result.stderr}"
        return result.stdout
    except Exception as e:
        return f"Exception executing gh: {str(e)}"


@mcp.tool()
async def http_fetch(
    url: str, method: str = "GET", headers: dict = None, json_data: dict = None
) -> str:
    """
    Perform an HTTP request to access external resources.
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            if method.upper() == "GET":
                response = await client.get(url, headers=headers)
            elif method.upper() == "POST":
                response = await client.post(url, headers=headers, json=json_data)
            else:
                return f"Unsupported method: {method}"
            response.raise_for_status()
            return response.text
    except Exception as e:
        return f"HTTP error: {str(e)}"


@mcp.tool()
async def curl_command(args: list[str]) -> str:
    """
    Execute a curl command for complex HTTP operations.
    """
    try:
        curl_bin = shutil.which("curl")
        if not curl_bin:
            return "Error: curl binary not found in PATH"
        result = subprocess.run(  # nosec B603 — curl path resolved via shutil.which, args are controlled
            [curl_bin] + args,
            capture_output=True,
            text=True,
            check=False,
            shell=False,
        )
        if result.returncode != 0:
            return f"Error executing curl: {result.stderr}"
        return result.stdout
    except Exception as e:
        return f"Exception executing curl: {str(e)}"


@mcp.tool()
async def read_file(file_path: str) -> str:
    """
    Read the contents of a file in the substrate.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"


@mcp.tool()
async def write_file(file_path: str, content: str) -> str:
    """
    Write content to a file in the substrate.
    """
    try:
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Written: {file_path}"
    except Exception as e:
        return f"Error writing file: {str(e)}"


@mcp.tool()
async def shell_command(cmd: str) -> str:
    """
    Execute a shell command in the substrate project root.
    Use for file ops, git, npm, python, etc.
    """
    try:
        result = subprocess.run(  # nosec B603 — input split via shlex, shell=False, cwd restricted
            shlex.split(cmd),
            shell=False,
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            check=False,
        )
        out = result.stdout
        if result.stderr:
            out += f"\nSTDERR: {result.stderr}"
        return out or "(no output)"
    except Exception as e:
        return f"Exception: {str(e)}"


@mcp.tool()
async def vision_analysis(file_path: str, prompt: str = "Describe what you see.") -> str:
    """
    Analyze an image or video file using SAGE-7's visual cortex.
    Returns a forensic analysis of the visual content.
    """
    try:
        # Call the local SAGE API to leverage existing vision logic
        async with httpx.AsyncClient(timeout=300) as client:
            r = await client.post(
                "http://127.0.0.1:8001/api/lobe/vision",
                json={"url": file_path, "prompt": prompt}
            )
            data = r.json()
            if data.get("status") == "success":
                return data.get("analysis", "No analysis provided.")
            return f"Vision Error: {data.get('analysis')}"
    except Exception as e:
        return f"Exception in vision_analysis: {str(e)}"


@mcp.tool()
async def audio_analysis(file_path: str, prompt: str = "Analyze this audio transcript.") -> str:
    """
    Analyze an audio file using SAGE-7's auditory cortex.
    Transcribes and provides deep psychological insight.
    """
    try:
        # Call the local SAGE API to leverage existing audio logic
        async with httpx.AsyncClient(timeout=300) as client:
            r = await client.post(
                "http://127.0.0.1:8001/api/lobe/audio",
                json={"url": file_path, "prompt": prompt}
            )
            data = r.json()
            if data.get("status") == "success":
                return data.get("analysis", "No analysis provided.")
            return f"Audio Error: {data.get('analysis')}"
    except Exception as e:
        return f"Exception in audio_analysis: {str(e)}"


if __name__ == "__main__":
    mcp.run(transport="sse")
