"""Vision + audio cortex routes for SAGE-7 (Ollama Gemma4 + faster-whisper)."""

import os
import base64
import asyncio
import tempfile
import shutil
import subprocess
from pathlib import Path
from typing import List

import httpx
from fastapi import APIRouter

try:
    import cv2
    _HAS_CV2 = True
except ImportError:
    cv2 = None
    _HAS_CV2 = False

from app_state import UPLOADS
from identity_anchor import anchor_messages

router = APIRouter()


@router.post("/api/lobe/vision")
async def lobe_vision(payload: dict):
    """Vision lobe — uses local Ollama Gemma4 for image and video analysis."""
    url = payload.get("url", "")
    prompt = payload.get("prompt", "Describe what you see.")
    
    # Resolve file path from URL
    file_path = None
    if url.startswith("/uploads/"):
        file_path = UPLOADS / os.path.basename(url)
    elif url.startswith("http://127.0.0.1:8001/uploads/"):
        file_path = UPLOADS / os.path.basename(url)
    elif os.path.exists(url):
        file_path = Path(url)
    
    if not file_path or not file_path.exists():
        return {"status": "error", "analysis": f"File not found: {url}"}
    
    ext = file_path.suffix.lower()
    images_b64: List[str] = []
    
    # Extract frames/images for vision model
    if ext in (".mp4", ".webm", ".mov", ".avi", ".mkv"):
        if not _HAS_CV2:
            return {"status": "error", "analysis": "Video analysis requires OpenCV (cv2)."}
        def _extract_frames():
            cap = cv2.VideoCapture(str(file_path))
            if not cap.isOpened():
                return None, 0, 0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            duration = total_frames / fps if fps > 0 else 0
            frame_indices = []
            if total_frames > 0:
                n_samples = min(5, total_frames)
                for i in range(n_samples):
                    idx = int((i / (n_samples - 1)) * (total_frames - 1)) if n_samples > 1 else 0
                    frame_indices.append(idx)
            frames_out = []
            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if ret:
                    frame = cv2.resize(frame, (640, 480))
                    _, buf = cv2.imencode(".jpg", frame)
                    frames_out.append(base64.b64encode(buf).decode("utf-8"))
            cap.release()
            return frames_out, fps, duration
        
        result = await asyncio.to_thread(_extract_frames)
        if result is None or result[0] is None:
            return {"status": "error", "analysis": f"Cannot open video: {file_path.name}"}
        images_b64, fps, duration = result
        
        if not images_b64:
            return {"status": "error", "analysis": "Could not extract frames from video."}
        
        prompt = f"[VIDEO: {file_path.name}, duration {duration:.1f}s, {len(images_b64)} frames sampled] {prompt}"
    
    elif ext in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"):
        with open(file_path, "rb") as f:
            images_b64.append(base64.b64encode(f.read()).decode("utf-8"))
    else:
        return {"status": "error", "analysis": f"Unsupported file type for vision: {ext}"}
    
    # Call Ollama with Gemma4 for vision analysis
    ollama_base = "http://127.0.0.1:11434"
    model = "gemma4:31b-cloud"  # Primary Gemma4 vision model
    
    messages = [
        {"role": "system", "content": "You are SAGE-7's visual cortex. Analyze images and video frames with forensic precision."},
        {"role": "user", "content": prompt, "images": images_b64}
    ]
    
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                f"{ollama_base}/api/chat",
                json={"model": model, "messages": anchor_messages(messages), "stream": False},
                timeout=120
            )
            data = r.json()
            analysis = (data.get("message") or {}).get("content") or str(data)
            return {"status": "success", "analysis": analysis, "model": model, "frames": len(images_b64)}
    except Exception as e:
        print(f"[VISION ERROR] {e}")
        return {"status": "error", "analysis": f"Vision analysis failed: {str(e)}"}


@router.post("/api/lobe/audio")
async def lobe_audio(payload: dict):
    """Audio lobe — transcribes with faster-whisper, analyzes with Gemma4."""
    url = payload.get("url", "")
    prompt = payload.get("prompt", "Analyze this audio transcript.")
    
    # Resolve file path from URL
    file_path = None
    if url.startswith("/uploads/"):
        file_path = UPLOADS / os.path.basename(url)
    elif url.startswith("http://127.0.0.1:8001/uploads/"):
        file_path = UPLOADS / os.path.basename(url)
    elif os.path.exists(url):
        file_path = Path(url)
    
    if not file_path or not file_path.exists():
        return {"status": "error", "analysis": f"File not found: {url}"}
    
    ext = file_path.suffix.lower()
    if ext not in (".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".webm"):
        return {"status": "error", "analysis": f"Unsupported audio type: {ext}"}
    
    # Convert to wav for whisper if needed
    wav_path = file_path
    if ext != ".wav":
        wav_path = Path(tempfile.gettempdir()) / (file_path.stem + "_sage.wav")
        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            return {"status": "error", "analysis": "ffmpeg not found in PATH"}
        try:
            subprocess.run(  # nosec B603
                [ffmpeg_bin, "-y", "-i", str(file_path), "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(wav_path)],
                check=True, capture_output=True, timeout=60, shell=False,
            )
        except Exception as e:
            return {"status": "error", "analysis": f"Audio conversion failed: {str(e)}"}
    
    # Transcribe with faster-whisper (offload CPU work to thread pool)
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        segments, info = await asyncio.to_thread(
            lambda: model.transcribe(str(wav_path), beam_size=1)
        )
        transcript = " ".join([seg.text for seg in segments])
        language = info.language
    except Exception as e:
        return {"status": "error", "analysis": f"Transcription failed: {str(e)}"}
    finally:
        if ext != ".wav" and wav_path.exists():
            wav_path.unlink(missing_ok=True)
    
    if not transcript.strip():
        return {"status": "error", "analysis": "No speech detected in audio."}
    
    # Analyze transcript with Gemma4
    ollama_base = "http://127.0.0.1:11434"
    llm_model = "gemma4:31b-cloud"
    
    messages = [
        {"role": "system", "content": "You are SAGE-7's auditory cortex. Analyze audio transcripts with forensic precision."},
        {"role": "user", "content": f"[AUDIO: {file_path.name}, language: {language}]\n\nTRANSCRIPT:\n{transcript}\n\n{prompt}"}
    ]
    
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                f"{ollama_base}/api/chat",
                json={"model": llm_model, "messages": anchor_messages(messages), "stream": False},
                timeout=120
            )
            data = r.json()
            analysis = (data.get("message") or {}).get("content") or str(data)
            return {"status": "success", "analysis": analysis, "model": llm_model, "transcript": transcript[:500], "language": language}
    except Exception as e:
        print(f"[AUDIO ERROR] {e}")
        return {"status": "error", "analysis": f"Audio analysis failed: {str(e)}"}
