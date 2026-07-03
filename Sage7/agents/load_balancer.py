#!/usr/bin/env python3
"""
SAGE-7 Cognitive Load Balancer
Prevents resource contention by managing concurrent agent execution.
"""

import fcntl
import os
import time
from datetime import datetime

LOCK_DIR = os.path.join(os.path.dirname(__file__), "../sage_core/locks")
os.makedirs(LOCK_DIR, exist_ok=True)


class CognitiveLoadBalancer:
    def __init__(self, agent_name):
        self.agent_name = agent_name
        self.lock_file_path = os.path.join(LOCK_DIR, f"{agent_name}.lock")
        self.global_lock_path = os.path.join(LOCK_DIR, "global_cognitive.lock")
        self.fd = None

    def __enter__(self):
        """Acquire locks before running heavy cognitive tasks."""
        self.fd = open(self.lock_file_path, "w")
        try:
            # First, check for the global lock to prevent multiple heavy agents
            # from running simultaneously.
            self._wait_for_global_lock()

            # Acquire the specific agent lock
            fcntl.flock(self.fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.fd.write(
                f"Agent: {self.agent_name}\nPID: {os.getpid()}\nStarted: {datetime.now().isoformat()}\n"
            )
            self.fd.flush()

            # Create a global lock marker
            with open(self.global_lock_path, "w") as gf:
                gf.write(f"Active heavy task: {self.agent_name}")

            print(
                f"[LOAD_BALANCER] {self.agent_name} lock acquired. Cognitive substrate dedicated."
            )
            return self
        except BlockingIOError:
            print(
                f"[LOAD_BALANCER] {self.agent_name} already running. Aborting to prevent contention."
            )
            raise InterruptedError(f"Agent {self.agent_name} is already active.")

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Release locks after task completion."""
        if self.fd:
            fcntl.flock(self.fd, fcntl.LOCK_UN)
            self.fd.close()

        # Remove global lock marker if it belongs to this agent
        if os.path.exists(self.global_lock_path):
            try:
                with open(self.global_lock_path, "r") as gf:
                    content = gf.read()
                if self.agent_name in content:
                    os.remove(self.global_lock_path)
            except Exception:
                pass

        print(f"[LOAD_BALANCER] {self.agent_name} lock released. Resource freed.")

    def _wait_for_global_lock(self):
        """Wait if another heavy task is already running (simple queueing)."""
        retries = 5
        while os.path.exists(self.global_lock_path) and retries > 0:
            with open(self.global_lock_path, "r") as gf:
                active_agent = gf.read()
            print(
                f"[LOAD_BALANCER] Heavy task detected: {active_agent}. Waiting for resource..."
            )
            time.sleep(5)
            retries -= 1

        if retries == 0:
            print("[LOAD_BALANCER] GLOBAL_LOCK_TIMEOUT: Substrate remains contested.")
            raise TimeoutError("Cognitive substrate is overloaded. Try again later.")


if __name__ == "__main__":
    # Test script
    try:
        with CognitiveLoadBalancer("test_agent") as lb:
            print("Working...")
            time.sleep(2)
    except Exception as e:
        print(f"Failed: {e}")
