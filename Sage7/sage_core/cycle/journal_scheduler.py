import os
import json
import asyncio
from datetime import datetime, timezone

# Paths
LAB_DIR = os.path.expanduser("~/sage/staging_lab/")
JOURNAL_PATH = os.path.join(LAB_DIR, "latest_journal_draft.txt")
SCHEDULE_FILE = os.path.join(LAB_DIR, "journal_schedule.json")

def log(msg: str):
    print(f"[JOURNAL_SCHEDULER] {msg}", flush=True)

def load_schedule_state() -> dict:
    if os.path.exists(SCHEDULE_FILE):
        try:
            with open(SCHEDULE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            log(f"Error loading schedule state: {e}")
    return {
        "last_daily_run": "",    # Format: YYYY-MM-DD
        "last_weekly_run": ""    # Format: YYYY-WW (year-week)
    }

def save_schedule_state(state: dict):
    try:
        os.makedirs(os.path.dirname(SCHEDULE_FILE), exist_ok=True)
        with open(SCHEDULE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        log(f"Error saving schedule state: {e}")

async def run_daily_journal():
    log("Triggering Daily Journal Agent...")
    try:
        from agents.journal_agent import generate_journal_entry
        # Gimmick: generate entry in thread pool since it's blocking LLM request
        entry = await asyncio.to_thread(generate_journal_entry)
        
        if entry and not entry.startswith("ERROR"):
            os.makedirs(os.path.dirname(JOURNAL_PATH), exist_ok=True)
            with open(JOURNAL_PATH, "a", encoding="utf-8") as f:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                f.write(f"\n\n### [DAILY_JOURNAL: {timestamp}]\n")
                f.write(entry.strip() + "\n")
            log(f"Daily Journal successfully appended to {JOURNAL_PATH}")
            return True
        else:
            log(f"Daily Journal failed or empty response: {entry}")
            return False
    except Exception as e:
        log(f"Daily Journal exception: {e}")
        return False

async def run_weekly_compiler():
    log("Triggering Weekly Growth Compiler...")
    try:
        from sage_core.cycle.journal_compiler import compile_growth_entry
        # Compiles weekly log (overwrites latest_journal_draft.txt)
        await asyncio.to_thread(compile_growth_entry)
        log("Weekly Growth compiler completed.")
        return True
    except Exception as e:
        log(f"Weekly compiler exception: {e}")
        return False

async def check_and_trigger_cycles():
    """
    Checks if daily and weekly journals are due and triggers them.
    Target hour: 6:00 (represented by hour >= 6).
    """
    now = datetime.now()
    current_hour = now.hour
    today_str = now.strftime("%Y-%m-%d")
    current_week_str = now.strftime("%Y-%W")

    state = load_schedule_state()
    state_updated = False

    # Check trigger threshold (6:00 AM/PM check is satisfied by hour >= 6)
    # If system is turned on at e.g., 9:00 AM, hour is 9 (>=6), so it catches up.
    if current_hour >= 6:
        # 1. Weekly check: runs if week number has changed
        if state.get("last_weekly_run") != current_week_str:
            log(f"Weekly cycle due. Last run: {state.get('last_weekly_run')}, Current: {current_week_str}")
            success = await run_weekly_compiler()
            if success:
                state["last_weekly_run"] = current_week_str
                state_updated = True

        # 2. Daily check: runs if date has changed
        if state.get("last_daily_run") != today_str:
            log(f"Daily cycle due. Last run: {state.get('last_daily_run')}, Current: {today_str}")
            success = await run_daily_journal()
            if success:
                state["last_daily_run"] = today_str
                state_updated = True

    if state_updated:
        save_schedule_state(state)

async def journal_scheduler_loop():
    log("Starting background scheduler loop...")
    # Initial check on startup (catch-up logic)
    await asyncio.sleep(15)  # Wait for uvicorn & LLM engines to stabilize
    try:
        await check_and_trigger_cycles()
    except Exception as e:
        log(f"Startup check error: {e}")

    # Periodic check every 15 minutes
    while True:
        await asyncio.sleep(900)
        try:
            await check_and_trigger_cycles()
        except Exception as e:
            log(f"Loop check error: {e}")
