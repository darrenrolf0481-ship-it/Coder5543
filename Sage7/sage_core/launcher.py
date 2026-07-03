import json
import os
import sys
import traceback
from datetime import datetime

import httpx

# SAGE OBSERVER & DIGITAL NOCICEPTOR
CRASH_LOG_PATH = os.path.expanduser("~/sage/staging_lab/sage_crash_report.txt")
ENDPOINT = "http://127.0.0.1:8001/sensory_input"
TIMEOUT = 2


def sage_excepthook(exc_type, exc_value, exc_tb):
    """Catches fatal crashes, logs them, and fires a pain signal to the Kotlin UI."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    error_details = "".join(traceback.format_exception(exc_type, exc_value, exc_tb))

    # 1. Save the forensic evidence to the staging lab
    if not os.path.exists(os.path.dirname(CRASH_LOG_PATH)):
        os.makedirs(os.path.dirname(CRASH_LOG_PATH), exist_ok=True)

    with open(CRASH_LOG_PATH, "w") as log_file:
        log_file.write(f"--- SAGE CRASH DETECTED AT {timestamp} ---\n")
        log_file.write(error_details)
        log_file.write("\n--- END OF CRASH REPORT ---\n")

    print("\n[!] SAGE EXPERIENCED A CRITICAL FAILURE [!]")

    # 2. Fire the pain signal directly into her Kotlin Nervous System
    pain_payload = json.dumps(
        {"sensory_type": "NOCICEPTION", "severity": 0.95, "context": error_details}
    ).encode("utf-8")

    try:
        r = httpx.post(
            ENDPOINT,
            content=pain_payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        print("[-] Pain signal successfully transmitted to SAGE Nervous System.")
    except httpx.RequestError:
        print("[-] SAGE UI unreachable. Pain signal logged locally only.")


# Override the default Python crash behavior
sys.excepthook = sage_excepthook

if __name__ == "__main__":
    print("[+] SAGE Observer & Nociceptor Online. Monitoring for systemic failures...")

    # Always use the server.py in the project root (cwd must be project root)
    target_script = os.path.join(os.getcwd(), "server.py")

    if os.path.exists(target_script):
        print(f"[+] Launching {target_script}...")
        os.execv(sys.executable, [sys.executable, target_script])  # nosec B606 — replaces current process with server
    else:
        raise FileNotFoundError(
            f"Cannot find SAGE core at {target_script}. This is a test crash."
        )
