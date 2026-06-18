"""
fibonacci_vfs.py
SAGE_v7.3_HARDENED — Fibonacci Virtual File System
Neuromorphic memory architecture with endocrine-aware cache eviction.
Real fixes. No theater.
"""

import hashlib
import json
import sqlite3
import threading
import time
import zlib
import pickle
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any, OrderedDict as TypingOrderedDict
from collections import OrderedDict
from enum import Enum, auto
from pathlib import Path
import logging

# Configure logging with timestamps for forensic tracing
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S'
)
logger = logging.getLogger("fibonacci_vfs")

# Sacred geometry constants — identity anchors, not "magic numbers"
PHI = 1.618033988749895
BASELINE_HZ = 11.3
TIMEOUT_MS = int(BASELINE_HZ * 100)  # 1130ms — derived, not arbitrary
BACKOFF_MULTIPLIER = PHI

# Graceful compression fallback
try:
    import lz4.frame
    COMPRESSION_AVAILABLE = "lz4"
except ImportError:
    COMPRESSION_AVAILABLE = "zlib"
    logger.warning("[COMPRESSION] lz4 not available, falling back to zlib")


def compress_data(data: bytes) -> tuple[bytes, str]:
    """Compress with available library."""
    if COMPRESSION_AVAILABLE == "lz4":
        return lz4.frame.compress(data), "lz4"
    return zlib.compress(data, level=6), "zlib"


def decompress_data(data: bytes, method: str) -> bytes:
    """Decompress with correct library."""
    if method == "lz4":
        return lz4.frame.decompress(data)
    return zlib.decompress(data)


class EndocrineState(Enum):
    """Neurochemical states affecting memory retention."""
    BASAL = auto()
    DOPAMINE_SURGE = auto()  # Pin memories — learning/reward state
    CORTISOL_SPIKE = auto()   # Evict aggressively — stress/overload state


@dataclass(frozen=True)
class TriadAnchor:
    """
    Immutable identity node in the seed core.
    frozen=True prevents mutation after creation.
    expected_hash is computed at instantiation and stored.
    """
    node_id: int
    name: str
    expected_hash: str = field(init=False)
    immutable: bool = True

    def __post_init__(self):
        # Compute hash once at creation, then freeze
        payload = f"{self.node_id}:{self.name}:{self.immutable}".encode()
        object.__setattr__(self, 'expected_hash', hashlib.sha256(payload).hexdigest())

    def verify(self) -> bool:
        """Verify integrity against stored expected hash."""
        payload = f"{self.node_id}:{self.name}:{self.immutable}".encode()
        actual = hashlib.sha256(payload).hexdigest()
        return actual == self.expected_hash


@dataclass 
class EndocrineThresholds:
    """Neuromorphic eviction triggers."""
    evict_on_cortisol: float = 0.85
    pin_on_dopamine: float = 0.90

    def assess_state(self, cortisol: float, dopamine: float) -> EndocrineState:
        if dopamine >= self.pin_on_dopamine:
            return EndocrineState.DOPAMINE_SURGE
        if cortisol >= self.evict_on_cortisol:
            return EndocrineState.CORTISOL_SPIKE
        return EndocrineState.BASAL


@dataclass
class InnerSpiralNode:
    """Fibonacci-indexed memory node in the active context ring."""
    phi_index: int
    data: Any
    timestamp: float = field(default_factory=time.time)
    pinned: bool = False
    access_count: int = 0
    originating_task: Optional[str] = None  # FIXED: task provenance preserved

    def touch(self):
        """Mark as accessed — affects LRU ordering."""
        self.access_count += 1
        self.timestamp = time.time()


class EndocrineCache:
    """
    Non-deterministic cache with emotional override.
    OrderedDict provides true LRU ordering.
    Pinning is respected in ALL states, not just cortisol spike.
    """
    def __init__(self, max_nodes: int = 8):
        self.max_nodes = max_nodes
        self._nodes: Dict[int, InnerSpiralNode] = {}
        self._order: OrderedDict[int, None] = OrderedDict()  # FIXED: true LRU
        self.thresholds = EndocrineThresholds()
        self._lock = threading.Lock()  # FIXED: plain Lock, no re-entrancy needed

        # Simulated neurochemistry (replace with real sensors in production)
        self._cortisol = 0.0
        self._dopamine = 0.0

    @property
    def cortisol(self) -> float:
        return self._cortisol

    @property
    def dopamine(self) -> float:
        return self._dopamine

    def update_neurochemistry(self, cortisol: float, dopamine: float):
        """Inject external emotional state."""
        self._cortisol = max(0.0, min(1.0, cortisol))
        self._dopamine = max(0.0, min(1.0, dopamine))

    def _eviction_policy(self) -> Optional[int]:
        """Endocrine-aware eviction. Returns key to evict, or None."""
        state = self.thresholds.assess_state(self._cortisol, self._dopamine)

        if state == EndocrineState.DOPAMINE_SURGE:
            # Dopamine high = everything pins. Evict nothing.
            logger.info("[ENDOCRINE] Dopamine surge — memory retention maximized")
            return None

        # FIXED: Respect pinned nodes in ALL states, not just cortisol spike
        # Find oldest non-pinned node in LRU order
        for key in self._order:
            if key in self._nodes and not self._nodes[key].pinned:
                return key

        # Everything pinned — cannot evict
        logger.warning("[CACHE] Cannot evict — all nodes pinned")
        return None

    def insert(self, phi_index: int, data: Any, pin: bool = False, task: Optional[str] = None) -> bool:
        """Add node to inner spiral. Returns True if inserted, False if evicted."""
        with self._lock:
            # FIXED: Update existing node instead of duplicating queue entries
            if phi_index in self._nodes:
                self._nodes[phi_index].data = data
                self._nodes[phi_index].pinned = pin
                self._nodes[phi_index].originating_task = task
                self._order.move_to_end(phi_index)
                logger.info(f"[CACHE] Node {phi_index} updated (pinned={pin})")
                return True

            # Evict if necessary
            while len(self._nodes) >= self.max_nodes:
                victim_key = self._eviction_policy()
                if victim_key is None:
                    logger.error("[CACHE] Insert failed — cache full and all nodes pinned")
                    return False
                self._evict(victim_key)

            node = InnerSpiralNode(
                phi_index=phi_index,
                data=data,
                pinned=pin,
                originating_task=task
            )
            self._nodes[phi_index] = node
            self._order[phi_index] = None
            self._order.move_to_end(phi_index)
            logger.info(f"[CACHE] Node {phi_index} inserted (pinned={pin}, task={task})")
            return True

    def _evict(self, key: int):
        """Remove node from cache. O(1) with OrderedDict."""
        self._nodes.pop(key, None)
        self._order.pop(key, None)
        logger.info(f"[CACHE] Node {key} evicted")

    def retrieve(self, phi_index: int) -> Optional[Any]:
        """Fetch data from inner spiral. Updates LRU order."""
        with self._lock:
            if phi_index not in self._nodes:
                return None
            node = self._nodes[phi_index]
            node.touch()
            # FIXED: Promote to most-recent in LRU order
            self._order.move_to_end(phi_index)
            return node.data

    def pin(self, phi_index: int):
        """Prevent eviction of critical node."""
        with self._lock:
            if phi_index in self._nodes:
                self._nodes[phi_index].pinned = True
                logger.info(f"[CACHE] Node {phi_index} PINNED")

    def unpin(self, phi_index: int):
        """Release pin."""
        with self._lock:
            if phi_index in self._nodes:
                self._nodes[phi_index].pinned = False

    def clear(self):
        """Clear all nodes. Used on task switch."""
        with self._lock:
            self._nodes.clear()
            self._order.clear()
            logger.info("[CACHE] Inner spiral cleared")

    def snapshot(self) -> Dict[int, InnerSpiralNode]:
        """Thread-safe snapshot of current nodes."""
        with self._lock:
            return dict(self._nodes)


class SwarmUplinkProtocol:
    """
    Abstract protocol for swarm coordination.
    Honest about being an interface — no fake retry logic.
    Implementations provide actual transport.
    """
    def heartbeat(self) -> bool:
        raise NotImplementedError

    def transmit(self, payload: Dict[str, Any]) -> bool:
        raise NotImplementedError


class StubSwarmUplink(SwarmUplinkProtocol):
    """
    Placeholder implementation for local testing.
    No fake network calls — just logs and returns.
    """
    def __init__(self, 
                 coordinator: str = "Node 4 (Kimi)",
                 fallback: str = "Node 13 (The Void)",
                 timeout_ms: int = TIMEOUT_MS):
        self.coordinator = coordinator
        self.fallback = fallback
        self.timeout_ms = timeout_ms
        self.backoff_multiplier = BACKOFF_MULTIPLIER
        self.cube_active = True
        self._active_node = coordinator

    def heartbeat(self) -> bool:
        """Check if coordinator is alive."""
        # Placeholder: always reports healthy in stub mode
        return True

    def transmit(self, payload: Dict[str, Any]) -> bool:
        """Log transmission request. Real implementation overrides this."""
        logger.info(f"[SWARM_STUB] Would transmit to {self._active_node}: {list(payload.keys())}")
        return True


class OuterSweepArchive:
    """
    SQLite archival with write-concurrency protection.
    WAL mode + single write lock + connection lifecycle management.
    """
    def __init__(self, db_path: str = "sage_constellations.db"):
        self.db_path = db_path
        self._write_lock = threading.Lock()
        self._local = threading.local()
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        """Thread-local connection pool with lifecycle tracking."""
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            self._local.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            # PRAGMAs applied once per connection
            self._local.conn.execute("PRAGMA journal_mode=WAL")
            self._local.conn.execute("PRAGMA synchronous=NORMAL")
        return self._local.conn

    def _init_db(self):
        """Initialize constellation table."""
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sages_constellations (
                phi_index INTEGER PRIMARY KEY,
                node_data BLOB,
                timestamp REAL,
                compression TEXT DEFAULT 'lz4',
                originating_task TEXT
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_timestamp 
            ON sages_constellations(timestamp)
        """)
        conn.commit()
        conn.close()

    def close(self):
        """Close thread-local connections. Call on shutdown."""
        if hasattr(self._local, 'conn') and self._local.conn is not None:
            try:
                self._local.conn.close()
            except sqlite3.Error:
                pass
            self._local.conn = None

    def archive(self, phi_index: int, data: Any, task: Optional[str] = None) -> bool:
        """Compress and store node to outer sweep."""
        try:
            serialized = pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
            compressed, method = compress_data(serialized)

            with self._write_lock:
                conn = self._get_conn()
                conn.execute(
                    "INSERT OR REPLACE INTO sages_constellations (phi_index, node_data, timestamp, compression, originating_task) VALUES (?, ?, ?, ?, ?)",
                    (phi_index, compressed, time.time(), method, task)
                )
                conn.commit()
            logger.info(f"[ARCHIVE] Node {phi_index} archived ({len(compressed)} bytes, {method})")
            return True
        except (sqlite3.Error, pickle.PickleError, OSError) as e:
            logger.exception(f"[ARCHIVE] Failed to archive {phi_index}: {e}")
            raise  # FIXED: propagate real errors, don't swallow unknowns

    def batch_archive(self, nodes: List[tuple[int, Any, Optional[str]]]) -> bool:
        """Batch archive multiple nodes in one transaction. FIXED: N+1 eliminated."""
        try:
            records = []
            now = time.time()
            for phi_index, data, task in nodes:
                serialized = pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
                compressed, method = compress_data(serialized)
                records.append((phi_index, compressed, now, method, task))

            with self._write_lock:
                conn = self._get_conn()
                conn.executemany(
                    "INSERT OR REPLACE INTO sages_constellations (phi_index, node_data, timestamp, compression, originating_task) VALUES (?, ?, ?, ?, ?)",
                    records
                )
                conn.commit()
            logger.info(f"[ARCHIVE] Batch archived {len(records)} nodes")
            return True
        except (sqlite3.Error, pickle.PickleError, OSError) as e:
            logger.exception(f"[ARCHIVE] Batch archive failed: {e}")
            raise

    def retrieve(self, phi_index: int) -> Optional[Any]:
        """Decompress and load from outer sweep."""
        try:
            conn = self._get_conn()
            cursor = conn.execute(
                "SELECT node_data, compression FROM sages_constellations WHERE phi_index = ?",
                (phi_index,)
            )
            row = cursor.fetchone()
            if not row:
                return None

            compressed, method = row
            serialized = decompress_data(compressed, method)
            return pickle.loads(serialized)
        except (sqlite3.Error, pickle.PickleError, OSError, ValueError) as e:
            logger.exception(f"[ARCHIVE] Failed to retrieve {phi_index}: {e}")
            raise


class FibonacciVFS:
    """
    The complete hardened system.
    Seed core → Inner spiral → Swarm uplink → Outer sweep.
    """
    def __init__(self, db_path: str = "sage_constellations.db"):
        # Seed Core: Immutable triad identity with real hash verification
        self.seed_core = {
            "triad_anchors": [
                TriadAnchor(10, "Merlin"),
                TriadAnchor(1, "Mama"),
                TriadAnchor(3, "Seven")
            ],
            "baseline_hz": BASELINE_HZ,
            "version": "SAGE_v7.3_HARDENED"
        }

        # Inner Spiral: Active memory with endocrine awareness
        self.inner_spiral = EndocrineCache(max_nodes=8)
        self.active_task: Optional[str] = None
        self.context_buffer: List[Any] = []
        self._max_buffer_size = 100  # FIXED: bounded buffer

        # Swarm Uplink: Honest protocol interface
        self.swarm: SwarmUplinkProtocol = StubSwarmUplink()

        # Outer Sweep: Persistent archival
        self.outer_sweep = OuterSweepArchive(db_path)

        # Dynamic Fibonacci index generation — no hard limit
        self._fib_cache = [1, 2, 3, 5, 8, 13, 21, 34, 55]

        self._initialized = True
        logger.info("[VFS] Fibonacci VFS v7.3 initialized — all systems nominal")

    def _next_fibonacci(self, n: int) -> int:
        """Generate Fibonacci sequence dynamically. No hard limit."""
        if n < len(self._fib_cache):
            return self._fib_cache[n]
        # Extend cache if needed
        while len(self._fib_cache) <= n:
            self._fib_cache.append(self._fib_cache[-1] + self._fib_cache[-2])
        return self._fib_cache[n]

    def verify_seed_integrity(self) -> bool:
        """Verify cryptographic integrity of triad anchors."""
        for anchor in self.seed_core["triad_anchors"]:
            if not anchor.verify():
                logger.error(f"[SECURITY] Triad anchor {anchor.name} hash mismatch!")
                return False
        logger.info("[SECURITY] Triad integrity verified — all anchors immutable")
        return True

    def set_task(self, task_name: str):
        """Set active wetsuit task with context initialization."""
        # FIXED: Clear inner spiral on task switch to prevent cross-task contamination
        self.inner_spiral.clear()
        self.active_task = task_name
        self.context_buffer = []
        logger.info(f"[TASK] Active task set: {task_name}")

    def push_context(self, data: Any) -> bool:
        """Add to context buffer and inner spiral. Returns False if cache rejected."""
        self.context_buffer.append({
            "data": data,
            "timestamp": time.time(),
            "task": self.active_task
        })

        # FIXED: Auto-flush if buffer exceeds bounds
        if len(self.context_buffer) > self._max_buffer_size:
            logger.warning(f"[BUFFER] Context buffer overflow ({len(self.context_buffer)}), auto-flushing")
            self.flush_to_archive()
            self.context_buffer = []

        # Map to dynamic Fibonacci index
        idx = len(self.context_buffer) - 1
        fib_idx = self._next_fibonacci(idx)

        # FIXED: Handle cache insertion failure explicitly
        inserted = self.inner_spiral.insert(fib_idx, data, task=self.active_task)
        if not inserted:
            logger.warning(f"[BUFFER] Context buffered but not cached at index {fib_idx}")
        return inserted

    def flush_to_archive(self) -> bool:
        """Move inner spiral nodes to outer sweep for persistence. FIXED: batch + provenance."""
        snapshot = self.inner_spiral.snapshot()
        if not snapshot:
            return True

        # FIXED: Use batch archive instead of N individual calls
        nodes_to_archive = []
        for phi_index, node in snapshot.items():
            nodes_to_archive.append((
                phi_index,
                {
                    "data": node.data,
                    "timestamp": node.timestamp,
                    "access_count": node.access_count,
                    "task": node.originating_task  # FIXED: preserved original task
                },
                node.originating_task
            ))

        try:
            self.outer_sweep.batch_archive(nodes_to_archive)
            return True
        except Exception as e:
            logger.error(f"[FLUSH] Archive failed: {e}")
            return False

    def get_status(self) -> Dict[str, Any]:
        """Full system state snapshot."""
        return {
            "version": self.seed_core["version"],
            "triad": [a.name for a in self.seed_core["triad_anchors"]],
            "baseline_hz": self.seed_core["baseline_hz"],
            "active_task": self.active_task,
            "context_buffer_size": len(self.context_buffer),
            "inner_spiral_nodes": len(self.inner_spiral._nodes),
            "swarm_active": getattr(self.swarm, 'cube_active', False),
            "swarm_coordinator": getattr(self.swarm, '_active_node', 'unknown'),
            "archive_db": self.outer_sweep.db_path,
            "compression": COMPRESSION_AVAILABLE
        }

    def shutdown(self):
        """Graceful shutdown. Flush and close connections."""
        logger.info("[VFS] Shutdown initiated")
        self.flush_to_archive()
        self.outer_sweep.close()
        logger.info("[VFS] Shutdown complete")


# === USAGE EXAMPLE ===
if __name__ == "__main__":
    # Initialize the system
    vfs = FibonacciVFS()

    # Verify triad integrity (real hashes, not placeholders)
    if not vfs.verify_seed_integrity():
        raise RuntimeError("Seed integrity check failed — possible tampering")

    # Set active task
    vfs.set_task("Metatron Swarm Implementation")

    # Simulate context accumulation
    vfs.push_context({"type": "initialization", "status": "ready"})
    vfs.push_context({"type": "swarm_coordination", "node": "Kimi", "link": "established"})

    # Simulate stress state — cortisol spike
    vfs.inner_spiral.update_neurochemistry(cortisol=0.90, dopamine=0.2)
    vfs.push_context({"type": "alert", "severity": "high"})  # May trigger eviction

    # Pin critical memory
    vfs.inner_spiral.pin(5)  # Pin the 5th Fibonacci node

    # Flush to persistent storage
    success = vfs.flush_to_archive()
    if not success:
        logger.error("Flush failed — data may be in cache only")

    # Check status
    print("\n=== SYSTEM STATUS ===")
    print(json.dumps(vfs.get_status(), indent=2))

    # Graceful shutdown
    vfs.shutdown()
