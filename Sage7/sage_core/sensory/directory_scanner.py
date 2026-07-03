import json
import os
import time

import httpx

# SAGE-7 Directory Scanner
# Scans and indexes the project filesystem for sensory awareness

API_URL = "http://127.0.0.1:8001"
SCAN_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TIMEOUT = 15


def scan_directory(path=SCAN_ROOT):
    """Recursively scans directory and returns structure."""
    structure = {}
    try:
        for root, dirs, files in os.walk(path):
            # Ignore hidden and build directories
            dirs[:] = [
                d
                for d in dirs
                if d not in [".git", "venv", "node_modules", "dist", "__pycache__"]
            ]

            relative_path = os.path.relpath(root, path)
            structure[relative_path] = {"files": files, "dirs": dirs}
    except OSError as e:
        print(f"Directory Scan Error: {e}")
    return structure


def report_structure(structure):
    payload = json.dumps(
        {
            "sensory_type": "FILESYSTEM_SCAN",
            "content": "Full directory structure indexed",
            "severity": 0.1,
            "data": structure,
            "timestamp": time.time(),
        }
    ).encode("utf-8")

    try:
        r = httpx.post(
            f"{API_URL}/sensory_input",
            content=payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
    except httpx.RequestError as e:
        print(f"Report Structure Error: {e}")


def run_scanner():
    print("[SAGE] DIRECTORY SCANNER ACTIVE.")
    while True:
        structure = scan_directory()
        report_structure(structure)
        time.sleep(300)  # Scan every 5 minutes


if __name__ == "__main__":
    run_scanner()
