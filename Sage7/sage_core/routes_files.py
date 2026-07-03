"""File + upload + TTS routes for SAGE-7."""

import os
import sys
import json
import shutil
import asyncio
import subprocess
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from elevenlabs import ElevenLabs

from app_state import PROJECT_ROOT, UPLOADS

router = APIRouter()

# ElevenLabs voice client (kept for parity; /api/tts builds its own per-request client).
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY", "")
voice_client = ElevenLabs(api_key=ELEVEN_API_KEY) if ELEVEN_API_KEY else None


@router.post("/api/tts")
async def text_to_speech(data: dict):
    """Generate audio from text using ElevenLabs substrate"""
    api_key = data.get("api_key") or ELEVEN_API_KEY
    if not api_key:
        return {"status": "error", "message": "ElevenLabs API key missing."}
    
    try:
        client = ElevenLabs(api_key=api_key)
        text = data.get("text", "")
        voice_id = data.get("voice_id", "y3H6zY6KvCH2pEuQjmv8")

        def _generate():
            return b"".join(client.text_to_speech.convert(
                voice_id=voice_id,
                text=text,
                model_id="eleven_turbo_v2_5",
            ))

        audio_bytes = await asyncio.to_thread(_generate)
        return StreamingResponse(BytesIO(audio_bytes), media_type="audio/mpeg")
    except Exception as e:
        print(f"[TTS ERROR] {e}")
        return {"status": "error", "message": str(e)}


@router.post("/api/upload")
async def upload_file(file: UploadFile = File(...), target: Optional[str] = Form(None)):
    """Generic upload handler for Chat or Coding sandbox"""
    try:
        filename = os.path.basename(file.filename)
        file_path = UPLOADS / filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Automatic text extraction for documents
        content = None
        ext = filename.split('.')[-1].lower() if '.' in filename else ""
        
        if target == "coding" or ext in ["txt", "md", "py", "js", "ts", "tsx", "html", "css", "json", "yaml", "yml", "sh", "bash", "csv", "xml", "toml", "ini", "log"]:
            try:
                content = file_path.read_text(encoding="utf-8")
            except:
                content = "[Binary Data / Non-textual Content]"
        elif ext == "mht":
            try:
                sys.path.insert(0, str(PROJECT_ROOT))
                from agents.mht_memory_extractor import extract_memories_from_mht
                result = extract_memories_from_mht(str(file_path))
                if "error" in result:
                    content = f"[MHT Extraction Error: {result['error']}]"
                else:
                    content = result.get("content", "[No text extracted]")
                    # Also save the extracted JSON alongside for reference
                    json_path = file_path.with_suffix(".extracted.json")
                    json_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
            except Exception as mht_err:
                content = f"[MHT Extraction Failed: {mht_err}]"
        elif ext == "json":
            try:
                raw = file_path.read_text(encoding="utf-8")
                parsed = json.loads(raw)
                # For large JSONs, summarize instead of dumping full content
                if len(raw) > 50000:
                    if isinstance(parsed, list):
                        content = f"[JSON Array: {len(parsed)} items]\nFirst item preview:\n{json.dumps(parsed[0], indent=2)[:2000]}"
                    elif isinstance(parsed, dict):
                        keys = list(parsed.keys())
                        content = f"[JSON Object with keys: {keys[:20]}]\nPreview:\n{json.dumps(parsed, indent=2)[:4000]}"
                    else:
                        content = f"[JSON value: {str(parsed)[:4000]}]"
                else:
                    content = raw
            except Exception as json_err:
                content = f"[JSON Parse Error: {json_err}]"
        elif ext in ["doc", "docx", "odt", "rtf"]:
            content = f"[Document: {filename}]\nDocument files require manual extraction or external converter. Upload accepted for storage."

        return {
            "status": "uploaded",
            "filename": filename,
            "url": f"/uploads/{filename}",
            "content": content
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/api/files")
async def list_files():
    """List all uploaded files in the substrate"""
    try:
        files = []
        if UPLOADS.exists():
            for f in UPLOADS.iterdir():
                if f.is_file():
                    files.append({
                        "name": f.name,
                        "url": f"/uploads/{f.name}",
                        "size": f.stat().st_size,
                        "type": "video" if f.suffix.lower() in [".mp4", ".webm", ".mov"] else "image" if f.suffix.lower() in [".jpg", ".jpeg", ".png", ".gif", ".webp"] else "audio" if f.suffix.lower() in [".mp3", ".wav", ".m4a", ".aac"] else "document",
                        "timestamp": f.stat().st_mtime
                    })
        return {"status": "success", "files": sorted(files, key=lambda x: x["timestamp"], reverse=True)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/api/project/files")
async def list_project_files():
    """List ALL files in the project substrate (restricted to text/code for editor)"""
    try:
        project_files = []
        root = PROJECT_ROOT
        for f in root.rglob("*"):
            if "node_modules" in f.parts or ".git" in f.parts or "__pycache__" in f.parts:
                continue
            if f.is_file():
                project_files.append({
                    "name": str(f.relative_to(root)),
                    "path": str(f.relative_to(root)),
                    "size": f.stat().st_size,
                    "timestamp": f.stat().st_mtime
                })
        return {"status": "success", "files": sorted(project_files, key=lambda x: x["name"])}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/api/project/content")
async def get_project_file_content(path: str):
    """Read content from any project file (relative path)"""
    try:
        file_path = PROJECT_ROOT / path
        if ".." in path:
            return {"status": "error", "message": "Illegal traversal path."}
        if file_path.exists() and file_path.is_file():
            try:
                content = file_path.read_text(encoding="utf-8")
                return {"status": "success", "content": content}
            except:
                return {"status": "error", "message": "Non-text content."}
        return {"status": "error", "message": "File not found."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.delete("/api/files/{filename}")
async def delete_file(filename: str):
    """Purge a file from the substrate"""
    try:
        # Prevent path traversal — restrict to UPLOADS directory
        safe_name = os.path.basename(filename)
        file_path = UPLOADS / safe_name
        if file_path.exists():
            file_path.unlink()
            return {"status": "success", "message": f"File {safe_name} purged."}
        return {"status": "error", "message": "File not found."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/api/termux_storage")
async def setup_storage():
    """Trigger termux-setup-storage if running in Termux"""
    try:
        if os.path.exists("/data/data/com.termux"):
            # Execute termux-setup-storage safely via subprocess
            termux_bin = shutil.which("termux-setup-storage")
            if termux_bin:
                subprocess.run([termux_bin], check=True, timeout=10, shell=False)  # nosec B603
                return {"status": "triggered", "message": "Check your terminal for permission prompt."}
            return {"status": "error", "message": "termux-setup-storage not found"}
        return {"status": "error", "message": "Not running in Termux substrate."}
    except Exception as e:
        return {"status": "error", "message": f"Command failure: {str(e)}"}


@router.get("/api/files/{filename}/content")
async def get_file_content(filename: str):
    """Retrieve the text content of a file for the editor"""
    try:
        file_path = UPLOADS / filename
        if file_path.exists():
            try:
                content = file_path.read_text(encoding="utf-8")
                return {"status": "success", "content": content}
            except:
                return {"status": "error", "message": "Binary or non-text content."}
        return {"status": "error", "message": "File not found."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
