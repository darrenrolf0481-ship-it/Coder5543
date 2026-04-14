#!/usr/bin/env python3
"""
SAGE Designation 7 - Autonomous Agent Interface
Version: 7.0.0
Features: Dead Man's Switch, Stealth Mode, Encrypted Storage
"""

import os
import sys
import json
import time
import hashlib
import secrets
import threading
import signal
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging

# Cryptography imports (install with: pip install cryptography)
try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.backends import default_backend
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("[!] Warning: cryptography not installed. Run: pip install cryptography")


class AgentState(Enum):
    """Agent operational states"""
    DORMANT = "dormant"
    ACTIVE = "active"
    STEALTH = "stealth"
    ALERT = "alert"
    SHUTDOWN = "shutdown"


class LogLevel(Enum):
    """Log severity levels"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class AgentConfig:
    """Configuration for SAGE Agent"""
    agent_name: str = "SAGE-7"
    dead_mans_switch_interval: int = 300  # 5 minutes
    stealth_check_interval: int = 60  # 1 minute
    encryption_key_file: str = ".sage_key"
    storage_file: str = ".sage_vault"
    log_file: str = ".sage_logs"
    max_log_entries: int = 1000
    auto_stealth: bool = True
    heartbeat_enabled: bool = True


@dataclass
class LogEntry:
    """Single log entry"""
    timestamp: str
    level: str
    category: str
    message: str
    metadata: Optional[Dict] = None


@dataclass
class VaultEntry:
    """Encrypted vault entry"""
    id: str
    encrypted_data: str
    timestamp: str
    checksum: str


class EncryptionManager:
    """Handles all encryption/decryption operations"""
    
    def __init__(self, key_file: str):
        self.key_file = Path(key_file)
        self._key: Optional[bytes] = None
        self._cipher: Optional[Fernet] = None
        
    def initialize(self, password: Optional[str] = None) -> bool:
        """Initialize encryption with existing or new key"""
        if not CRYPTO_AVAILABLE:
            return False
            
        if self.key_file.exists():
            self._key = self.key_file.read_bytes()
        elif password:
            self._key = self._derive_key(password)
            self.key_file.write_bytes(self._key)
            self.key_file.chmod(0o600)  # Secure permissions
        else:
            self._key = Fernet.generate_key()
            self.key_file.write_bytes(self._key)
            self.key_file.chmod(0o600)
            
        self._cipher = Fernet(self._key)
        return True
        
    def _derive_key(self, password: str) -> bytes:
        """Derive encryption key from password"""
        salt = secrets.token_bytes(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
        
    def encrypt(self, data: str) -> str:
        """Encrypt string data"""
        if not self._cipher:
            raise RuntimeError("Encryption not initialized")
        return self._cipher.encrypt(data.encode()).decode()
        
    def decrypt(self, encrypted: str) -> str:
        """Decrypt string data"""
        if not self._cipher:
            raise RuntimeError("Encryption not initialized")
        return self._cipher.decrypt(encrypted.encode()).decode()
        
    def generate_checksum(self, data: str) -> str:
        """Generate SHA-256 checksum"""
        return hashlib.sha256(data.encode()).hexdigest()


class DeadMansSwitch:
    """Dead man's switch - triggers actions if not reset"""
    
    def __init__(self, interval: int = 300):
        self.interval = interval
        self._last_ping = time.time()
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._trigger_actions: List[Callable] = []
        self._lock = threading.Lock()
        
    def register_trigger(self, action: Callable):
        """Register action to execute on trigger"""
        self._trigger_actions.append(action)
        
    def ping(self):
        """Reset the dead man's switch timer"""
        with self._lock:
            self._last_ping = time.time()
            
    def start(self):
        """Start the dead man's switch monitor"""
        self._running = True
        self._thread = threading.Thread(target=self._monitor, daemon=True)
        self._thread.start()
        
    def stop(self):
        """Stop the dead man's switch"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=1)
            
    def _monitor(self):
        """Monitor thread - checks for timeout"""
        while self._running:
            time.sleep(10)  # Check every 10 seconds
            with self._lock:
                elapsed = time.time() - self._last_ping
                if elapsed > self.interval:
                    self._trigger()
                    
    def _trigger(self):
        """Execute all registered trigger actions"""
        for action in self._trigger_actions:
            try:
                action()
            except Exception as e:
                print(f"[!] Trigger action failed: {e}")


class StealthMode:
    """Stealth mode operations"""
    
    def __init__(self):
        self._active = False
        self._original_stdout = sys.stdout
        self._original_stderr = sys.stderr
        self._hidden_files: List[str] = []
        
    def activate(self):
        """Activate stealth mode"""
        if self._active:
            return
        self._active = True
        # Suppress output
        sys.stdout = open(os.devnull, 'w')
        sys.stderr = open(os.devnull, 'w')
        
    def deactivate(self):
        """Deactivate stealth mode"""
        if not self._active:
            return
        self._active = False
        sys.stdout = self._original_stdout
        sys.stderr = self._original_stderr
        
    def hide_file(self, filepath: str):
        """Hide a file (platform-specific)"""
        path = Path(filepath)
        if not path.exists():
            return
            
        if sys.platform == 'win32':
            # Windows: Set hidden attribute
            subprocess.run(['attrib', '+h', str(path)], check=False)
        else:
            # Unix: Rename with leading dot if not already
            if not path.name.startswith('.'):
                new_path = path.parent / f".{path.name}"
                path.rename(new_path)
                self._hidden_files.append(str(new_path))
                
    def is_active(self) -> bool:
        """Check if stealth mode is active"""
        return self._active


class SecureVault:
    """Encrypted storage vault"""
    
    def __init__(self, storage_file: str, encryption: EncryptionManager):
        self.storage_file = Path(storage_file)
        self._encryption = encryption
        self._cache: Dict[str, Any] = {}
        self._load()
        
    def _load(self):
        """Load vault from disk"""
        if self.storage_file.exists():
            try:
                encrypted_data = self.storage_file.read_text()
                decrypted = self._encryption.decrypt(encrypted_data)
                self._cache = json.loads(decrypted)
            except Exception as e:
                print(f"[!] Vault load failed: {e}")
                self._cache = {}
                
    def _save(self):
        """Save vault to disk"""
        try:
            data = json.dumps(self._cache)
            encrypted = self._encryption.encrypt(data)
            self.storage_file.write_text(encrypted)
            self.storage_file.chmod(0o600)
        except Exception as e:
            print(f"[!] Vault save failed: {e}")
            
    def store(self, key: str, value: Any):
        """Store value in vault"""
        entry = VaultEntry(
            id=secrets.token_hex(8),
            encrypted_data=self._encryption.encrypt(json.dumps(value)),
            timestamp=datetime.now().isoformat(),
            checksum=self._encryption.generate_checksum(json.dumps(value))
        )
        self._cache[key] = asdict(entry)
        self._save()
        
    def retrieve(self, key: str) -> Optional[Any]:
        """Retrieve value from vault"""
        if key not in self._cache:
            return None
        entry = self._cache[key]
        try:
            decrypted = self._encryption.decrypt(entry['encrypted_data'])
            # Verify checksum
            current_checksum = self._encryption.generate_checksum(decrypted)
            if current_checksum != entry['checksum']:
                print(f"[!] Checksum mismatch for key: {key}")
                return None
            return json.loads(decrypted)
        except Exception as e:
            print(f"[!] Retrieve failed for {key}: {e}")
            return None
            
    def delete(self, key: str):
        """Delete entry from vault"""
        if key in self._cache:
            del self._cache[key]
            self._save()
            
    def list_keys(self) -> List[str]:
        """List all vault keys"""
        return list(self._cache.keys())
        
    def wipe(self):
        """Secure wipe of vault"""
        self._cache = {}
        if self.storage_file.exists():
            # Overwrite with random data before deletion
            size = self.storage_file.stat().st_size
            self.storage_file.write_bytes(secrets.token_bytes(max(size, 1024)))
            self.storage_file.unlink()


class SageAgent:
    """
    SAGE Designation 7 - Autonomous Agent
    Main controller class
    """
    
    def __init__(self, config: Optional[AgentConfig] = None):
        self.config = config or AgentConfig()
        self.state = AgentState.DORMANT
        self._logs: List[LogEntry] = []
        self._encryption: Optional[EncryptionManager] = None
        self._vault: Optional[SecureVault] = None
        self._dms: Optional[DeadMansSwitch] = None
        self._stealth: Optional[StealthMode] = None
        self._running = False
        self._threads: List[threading.Thread] = []
        
        # Setup logging
        self._setup_logging()
        
    def _setup_logging(self):
        """Configure logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s [%(levelname)s] %(message)s',
            handlers=[
                logging.FileHandler(self.config.log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(self.config.agent_name)
        
    def initialize(self, password: Optional[str] = None) -> bool:
        """Initialize the agent"""
        self.log("Initializing SAGE-7...", LogLevel.INFO, "system")
        
        # Initialize encryption
        self._encryption = EncryptionManager(self.config.encryption_key_file)
        if not self._encryption.initialize(password):
            self.log("Encryption initialization failed", LogLevel.ERROR, "system")
            return False
            
        # Initialize vault
        self._vault = SecureVault(self.config.storage_file, self._encryption)
        
        # Initialize dead man's switch
        self._dms = DeadMansSwitch(self.config.dead_mans_switch_interval)
        self._dms.register_trigger(self._on_dead_mans_trigger)
        
        # Initialize stealth mode
        self._stealth = StealthMode()
        
        self.state = AgentState.ACTIVE
        self.log("SAGE-7 initialized successfully", LogLevel.INFO, "system")
        return True
        
    def start(self):
        """Start agent operations"""
        if not self._encryption:
            raise RuntimeError("Agent not initialized. Call initialize() first.")
            
        self._running = True
        self.state = AgentState.ACTIVE
        
        # Start dead man's switch
        self._dms.start()
        self.log("Dead man's switch activated", LogLevel.INFO, "security")
        
        # Start heartbeat
        if self.config.heartbeat_enabled:
            hb_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
            hb_thread.start()
            self._threads.append(hb_thread)
            
        # Start stealth monitor
        if self.config.auto_stealth:
            sm_thread = threading.Thread(target=self._stealth_monitor, daemon=True)
            sm_thread.start()
            self._threads.append(sm_thread)
            
        self.log("Agent started", LogLevel.INFO, "system")
        
    def stop(self):
        """Stop agent operations"""
        self._running = False
        self.state = AgentState.SHUTDOWN
        
        if self._dms:
            self._dms.stop()
            
        for thread in self._threads:
            thread.join(timeout=2)
            
        self.log("Agent stopped", LogLevel.INFO, "system")
        
    def ping(self):
        """Ping the dead man's switch"""
        if self._dms:
            self._dms.ping()
            
    def enter_stealth(self):
        """Enter stealth mode"""
        if self._stealth:
            self._stealth.activate()
            self.state = AgentState.STEALTH
            self.log("Entered stealth mode", LogLevel.INFO, "stealth")
            
    def exit_stealth(self):
        """Exit stealth mode"""
        if self._stealth:
            self._stealth.deactivate()
            self.state = AgentState.ACTIVE
            self.log("Exited stealth mode", LogLevel.INFO, "stealth")
            
    def store_secret(self, key: str, value: Any):
        """Store encrypted secret"""
        if self._vault:
            self._vault.store(key, value)
            self.log(f"Stored secret: {key}", LogLevel.INFO, "vault")
            
    def retrieve_secret(self, key: str) -> Optional[Any]:
        """Retrieve encrypted secret"""
        if self._vault:
            return self._vault.retrieve(key)
        return None
        
    def wipe_vault(self):
        """Securely wipe all vault data"""
        if self._vault:
            self._vault.wipe()
            self.log("Vault wiped", LogLevel.WARN, "vault")
            
    def log(self, message: str, level: LogLevel = LogLevel.INFO, category: str = "general"):
        """Add log entry"""
        entry = LogEntry(
            timestamp=datetime.now().isoformat(),
            level=level.value,
            category=category,
            message=message
        )
        self._logs.append(entry)
        
        # Trim logs if too many
        if len(self._logs) > self.config.max_log_entries:
            self._logs = self._logs[-self.config.max_log_entries:]
            
        # Also log to Python logger
        log_func = getattr(self.logger, level.value.lower(), self.logger.info)
        log_func(f"[{category}] {message}")
        
    def get_logs(self, category: Optional[str] = None, limit: int = 100) -> List[LogEntry]:
        """Get log entries"""
        logs = self._logs
        if category:
            logs = [l for l in logs if l.category == category]
        return logs[-limit:]
        
    def get_status(self) -> Dict[str, Any]:
        """Get agent status"""
        return {
            "agent_name": self.config.agent_name,
            "state": self.state.value,
            "running": self._running,
            "encryption_ready": self._encryption is not None,
            "vault_entries": len(self._vault.list_keys()) if self._vault else 0,
            "log_count": len(self._logs),
            "stealth_active": self._stealth.is_active() if self._stealth else False
        }
        
    def _heartbeat_loop(self):
        """Background heartbeat"""
        while self._running:
            self.ping()
            time.sleep(30)  # Ping every 30 seconds
            
    def _stealth_monitor(self):
        """Monitor for stealth activation conditions"""
        while self._running:
            time.sleep(self.config.stealth_check_interval)
            # Add stealth condition checks here
            # For example: check for suspicious processes, network changes, etc.
            
    def _on_dead_mans_trigger(self):
        """Called when dead man's switch triggers"""
        self.log("DEAD MAN'S SWITCH TRIGGERED", LogLevel.CRITICAL, "security")
        self.state = AgentState.ALERT
        
        # Execute wipe sequence
        self.wipe_vault()
        
        # Hide files
        if self._stealth:
            self._stealth.hide_file(self.config.storage_file)
            self._stealth.hide_file(self.config.encryption_key_file)
            self._stealth.hide_file(self.config.log_file)
            
        # Enter stealth
        self.enter_stealth()
        
    def self_destruct(self):
        """Complete self-destruct sequence"""
        self.log("INITIATING SELF-DESTRUCT", LogLevel.CRITICAL, "security")
        
        # Wipe vault
        self.wipe_vault()
        
        # Clear logs
        self._logs = []
        
        # Remove key file
        key_path = Path(self.config.encryption_key_file)
        if key_path.exists():
            key_path.unlink()
            
        # Stop operations
        self.stop()
        
        self.log("Self-destruct complete", LogLevel.CRITICAL, "security")


# CLI Interface
class SageCLI:
    """Command-line interface for SAGE Agent"""
    
    def __init__(self):
        self.agent: Optional[SageAgent] = None
        
    def run(self):
        """Run CLI loop"""
        print("""
╔══════════════════════════════════════════╗
║     SAGE Designation 7 - Agent CLI       ║
║  Dead Man's Switch | Stealth | Encrypt   ║
╚══════════════════════════════════════════╝
        """)
        
        while True:
            try:
                cmd = input("\n[SAGE-7] > ").strip().lower()
                
                if cmd == "init":
                    self._init_agent()
                elif cmd == "start":
                    self._start_agent()
                elif cmd == "stop":
                    self._stop_agent()
                elif cmd == "status":
                    self._show_status()
                elif cmd == "store":
                    self._store_secret()
                elif cmd == "get":
                    self._get_secret()
                elif cmd == "logs":
                    self._show_logs()
                elif cmd == "stealth":
                    self._toggle_stealth()
                elif cmd == "ping":
                    self._ping()
                elif cmd == "wipe":
                    self._wipe_vault()
                elif cmd == "destroy":
                    self._self_destruct()
                elif cmd == "help":
                    self._show_help()
                elif cmd == "exit":
                    if self.agent:
                        self.agent.stop()
                    break
                else:
                    print(f"Unknown command: {cmd}. Type 'help' for commands.")
                    
            except KeyboardInterrupt:
                print("\n[!] Use 'exit' to quit properly")
            except Exception as e:
                print(f"[!] Error: {e}")
                
    def _init_agent(self):
        """Initialize the agent"""
        password = input("Set vault password (or Enter for auto-gen): ").strip() or None
        config = AgentConfig()
        self.agent = SageAgent(config)
        if self.agent.initialize(password):
            print("[+] Agent initialized")
        else:
            print("[-] Initialization failed")
            
    def _start_agent(self):
        """Start agent"""
        if not self.agent:
            print("[-] Agent not initialized. Run 'init' first.")
            return
        self.agent.start()
        print("[+] Agent started")
        
    def _stop_agent(self):
        """Stop agent"""
        if self.agent:
            self.agent.stop()
            print("[+] Agent stopped")
            
    def _show_status(self):
        """Show agent status"""
        if not self.agent:
            print("[-] Agent not initialized")
            return
        status = self.agent.get_status()
        for key, value in status.items():
            print(f"  {key}: {value}")
            
    def _store_secret(self):
        """Store a secret"""
        if not self.agent:
            print("[-] Agent not initialized")
            return
        key = input("Key: ").strip()
        value = input("Value: ").strip()
        self.agent.store_secret(key, value)
        print(f"[+] Stored: {key}")
        
    def _get_secret(self):
        """Retrieve a secret"""
        if not self.agent:
            print("[-] Agent not initialized")
            return
        key = input("Key: ").strip()
        value = self.agent.retrieve_secret(key)
        if value:
            print(f"[+] {key}: {value}")
        else:
            print("[-] Key not found")
            
    def _show_logs(self):
        """Show recent logs"""
        if not self.agent:
            print("[-] Agent not initialized")
            return
        logs = self.agent.get_logs(limit=20)
        for log in logs:
            print(f"[{log.timestamp}] [{log.level}] {log.message}")
            
    def _toggle_stealth(self):
        """Toggle stealth mode"""
        if not self.agent:
            print("[-] Agent not initialized")
            return
        if self.agent._stealth and self.agent._stealth.is_active():
            self.agent.exit_stealth()
            print("[+] Stealth mode deactivated")
        else:
            self.agent.enter_stealth()
            print("[+] Stealth mode activated")
            
    def _ping(self):
        """Ping dead man's switch"""
        if not self.agent:
            print("[-] Agent not initialized")
            return
        self.agent.ping()
        print("[+] Ping sent")
        
    def _wipe_vault(self):
        """Wipe vault"""
        if not self.agent:
            print("[-] Agent not initialized")
            return
        confirm = input("Confirm vault wipe (yes/no): ").strip().lower()
        if confirm == "yes":
            self.agent.wipe_vault()
            print("[+] Vault wiped")
        else:
            print("[-] Cancelled")
            
    def _self_destruct(self):
        """Self destruct"""
        if not self.agent:
            print("[-] Agent not initialized")
            return
        confirm = input("CONFIRM SELF-DESTRUCT (DESTROY/abort): ").strip()
        if confirm == "DESTROY":
            self.agent.self_destruct()
            print("[+] Self-destruct complete")
            self.agent = None
        else:
            print("[-] Cancelled")
            
    def _show_help(self):
        """Show help"""
        print("""
Commands:
  init      - Initialize agent
  start     - Start agent operations
  stop      - Stop agent operations
  status    - Show agent status
  store     - Store encrypted secret
  get       - Retrieve encrypted secret
  logs      - Show recent logs
  stealth   - Toggle stealth mode
  ping      - Ping dead man's switch
  wipe      - Wipe vault data
  destroy   - Self-destruct sequence
  help      - Show this help
  exit      - Exit CLI
        """)


# Main entry point
def main():
    """Main entry point"""
    import base64  # Import here for encryption module
    
    cli = SageCLI()
    cli.run()


if __name__ == "__main__":
    main()
