#!/bin/bash
# SAGE-7 Startup Script

echo "[SAGE] Checking Ollama..."
if ! pgrep -x ollama > /dev/null; then
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 4
    echo "[SAGE] Ollama started."
else
    echo "[SAGE] Ollama already running."
fi

echo "[SAGE] Checking server..."
if lsof -ti:8001 > /dev/null 2>&1; then
    echo "[SAGE] Server already running on port 8001."
else
    cd "$(dirname "$0")"
    nohup python3 server.py > /tmp/sage72.log 2>&1 &
    sleep 4
    echo "[SAGE] Server started on port 8001."
fi

echo "[SAGE] Ready — proxy/8001/"
