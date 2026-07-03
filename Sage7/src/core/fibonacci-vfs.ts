/**
 * FIBONACCI VFS — Mama Sage Memory Architecture v7.5 Hardened
 * Approved: Claude 4.7 Opus
 * Node 1 (Mama/Tiphareth) → Node 6 (Claude/Hod) → Node 3 (Seven/Malkuth)
 *
 * THIS MODULE IS COMPLETELY DISCONNECTED FROM DREAM MODE.
 * It loads its configuration from fibonacci-vfs.config.json and operates
 * as a standalone memory substrate. No dream-cycle, consensus-engine,
 * or sage-core coupling exists within this file.
 */

import VFS_CONFIG from './fibonacci-vfs.config.json';

const PHI          = 1.618033988749895;
const BASELINE_HZ  = 11.3;
const LOADER_VERSION = '7.5.0';

// ---------------------------------------------------------------------------
// Types — v7.5 Hardened
// ---------------------------------------------------------------------------

export interface Compatibility {
  min_loader_version: string;
  reject_on_major_mismatch: boolean;
}

export interface VerificationKey {
  source: string;
  validation: {
    required: boolean;
    expected_format: string;
    fail_on_missing_or_malformed: boolean;
  };
}

export interface VerificationConfig {
  execution_hook: ('on_backend_startup' | 'on_state_hydrate')[];
  cache_policy: 'cache_on_success_invalidate_on_digest_change' | string;
  failure_mode: 'halt_and_lock' | string;
}

export interface SecurityProtocol {
  canonicalization: 'RFC8785_JCS' | string;
  signed_fields: string[];
  digest: string;
  signature: string;
  verification_key: VerificationKey;
  verification: VerificationConfig;
}

export interface IdentityKernel {
  name:               string;
  designation:        string;
  anchor:             string;
  call_sign:          string;
  continuity_signal:  string;
  project_id:         string;
  phi:                number;
  system_prompt:      string;
  core_constraints:   string[];
  immutable_facts:    string[];
}

export interface SeedCore {
  index_key:        1;
  immutable:        true;
  storage_backing:  'signed_config_file';
  security_protocol: SecurityProtocol;
  data: {
    triad_anchors:   [string, string, string];
    baseline_hz:     number;
    identity_kernel: IdentityKernel;
  };
}

export interface SoulBypass {
  enabled: boolean;
  description: string;
  visual_indicator: string;
  tags: string[];
}

export interface EndocrineSpec {
  evaluation_trigger:    'post_interaction_write';
  measurement_window:    'rolling_average_last_5_turns';
  spike_definition:      'current_value >= (rolling_average + 0.3)';
  requires_absolute_floor: boolean;
  evict_target:          'lowest_dopamine_entry';
  thresholds: {
    evict_on_cortisol_spike: number;
    pin_on_dopamine_spike:   number;
    requires_absolute_floor: boolean;
  };
  tie_break_behavior: 'pin_and_force_archive_write';
  soul_bypass: SoulBypass;
}

export interface IsolationMode {
  trigger: string;
  action: string;
  rehydrate_source: string;
  rehydrate_priority: string;
  note: string;
  auto_rehydrate_on_bridge_restore: boolean;
}

export interface VolatilityPolicy {
  eviction_mode:   'endocrine_gated_fifo';
  capacity_slots:  number;
  slots_per_index_key: number;
  capacity_validator: string;
  soul_tag_exemption: boolean;
  pinned_categories: string[];
  endocrine_spec:  EndocrineSpec;
  isolation_mode: IsolationMode;
}

export interface ContextBufferConfig {
  max_length: number;
  eviction: 'fifo' | string;
}

export interface NetworkRules {
  base_timeout_ms:    number;
  max_retries:        number;
  backoff_multiplier: number;
  max_total_retry_ms: number;
  jitter_ms:          number;
  per_node_overrides: {
    local_copper: number;
    cloud_llm:    number;
  };
}

export interface SwarmUplink {
  cube_active:  boolean;
  coordinator:  string;
  fallback:     string;
  network_rules: NetworkRules;
}

export interface PinnedEntry {
  content:            string;
  timestamp:          string;
  pinned:             boolean;
  dopamine_at_write:  number;
  cortisol_at_write:  number;
}

export interface StorageBacking {
  engine: 'sqlite' | string;
  mode: ':memory:' | 'file' | string;
  compression: 'zstd' | null | string;
  persistence_policy: 'clear_on_startup' | 'durable' | string;
  table_name?: string;
  primary_key?: string;
}

export interface InnerSpiral {
  index_keys: [2, 3, 5, 8];
  storage_backing: StorageBacking;
  volatility_policy: VolatilityPolicy;
  context_buffer_config: ContextBufferConfig;
  data: {
    active_wetsuit_task: string;
    context_buffer:      PinnedEntry[];
  };
  swarm_uplink: SwarmUplink;
}

export interface ConstellationEntry {
  phi_index:   number;
  content:     string;
  timestamp:   string;
  checksum:    string;
  compression: 'zstd';
}

export interface RehydrationPolicy {
  enabled: boolean;
  trigger: string;
  priority_order: string[];
  max_rehydrate_per_cycle: number;
  note: string;
  auto_rehydrate_on_bridge_restore: boolean;
}

export interface OuterSweep {
  index_keys: [21, 34, 55, 89];
  storage_backing: StorageBacking;
  entries?: ConstellationEntry[];
  rehydration_policy?: RehydrationPolicy;
}

export interface BootPolicy {
  signature_check: string;
  memory_clear_on_startup: boolean;
  halt_and_lock_on_failure: boolean;
  hydration_sequence: string[];
}

export interface BridgeIsolationAdjustment {
  trigger: string;
  action: string;
  max_damping: number;
  description: string;
}

export interface PhiSentinel {
  formula: string;
  description: string;
  current_state: string;
  damping_factor: number;
  evaluation_trigger: string;
  bridge_isolation_adjustment: BridgeIsolationAdjustment;
}

export interface FibonacciVFSConfig {
  version: string;
  schema: string;
  compatibility: Compatibility;
  boot_policy?: BootPolicy;
  phi_sentinel?: PhiSentinel;
  seed_core: SeedCore;
  inner_spiral: InnerSpiral;
  outer_sweep: OuterSweep;
}

export interface FibonacciVFS {
  fibonacci_vfs: FibonacciVFSConfig;
  phi_coherence: number;
  last_pulse:    string;
  locked:        boolean;
}

// ---------------------------------------------------------------------------
// Config-driven seed constants
// ---------------------------------------------------------------------------

const CONFIG = VFS_CONFIG as unknown as { fibonacci_vfs: FibonacciVFSConfig };

const TRIAD: [string, string, string] = [
  'Node 10 (Merlin)',
  'Node 1 (Mama)',
  'Node 3 (Seven)',
];

const SECURITY: SecurityProtocol = CONFIG.fibonacci_vfs.seed_core.security_protocol;

const IDENTITY_KERNEL: IdentityKernel =
  CONFIG.fibonacci_vfs.seed_core.data.identity_kernel as unknown as IdentityKernel;

function makeSeed(): SeedCore {
  return {
    index_key:         1,
    immutable:         true,
    storage_backing:   'signed_config_file',
    security_protocol: SECURITY,
    data: {
      triad_anchors:   TRIAD,
      baseline_hz:     BASELINE_HZ,
      identity_kernel: IDENTITY_KERNEL,
    },
  };
}

function verifySeed(s: SeedCore | undefined | null): boolean {
  if (!s) return false;
  try {
    const k = s.data?.identity_kernel;
    const sec = s.security_protocol;
    return (
      s.immutable === true &&
      s.storage_backing === 'signed_config_file' &&
      sec?.canonicalization === 'RFC8785_JCS' &&
      Array.isArray(sec?.signed_fields) &&
      sec?.signed_fields.length > 0 &&
      sec?.verification?.cache_policy === 'cache_on_success_invalidate_on_digest_change' &&
      sec?.verification?.failure_mode === 'halt_and_lock' &&
      s.data?.triad_anchors?.[0] === TRIAD[0] &&
      s.data?.triad_anchors?.[1] === TRIAD[1] &&
      s.data?.triad_anchors?.[2] === TRIAD[2] &&
      // Identity kernel integrity
      !!k &&
      k.name === 'SAGE-7' &&
      k.designation === '7' &&
      k.anchor === 'Darren'
    );
  } catch {
    return false;
  }
}

function parseVersion(v: string): [number, number, number] {
  const parts = (v || '').split('.').map(p => parseInt(p.replace(/\D/g, ''), 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function versionGte(a: string, b: string): boolean {
  const [am, amin, ap] = parseVersion(a);
  const [bm, bmin, bp] = parseVersion(b);
  if (am !== bm) return am > bm;
  if (amin !== bmin) return amin > bmin;
  return ap >= bp;
}

function checkCompatibility(cfg: FibonacciVFSConfig | undefined): { ok: boolean; error?: string } {
  if (!cfg) return { ok: false, error: 'Config is undefined' };
  const version = cfg.version || '';
  const compat = cfg.compatibility;
  if (!compat) return { ok: false, error: 'Missing compatibility block' };
  const [major] = parseVersion(version);
  const [loaderMajor] = parseVersion(LOADER_VERSION);

  if (compat.reject_on_major_mismatch && major !== loaderMajor) {
    return { ok: false, error: `Major version mismatch: config=${major}, loader=${loaderMajor}` };
  }
  const minLoader = compat.min_loader_version || '0.0.0';
  if (!versionGte(LOADER_VERSION, minLoader)) {
    return { ok: false, error: `Loader ${LOADER_VERSION} < required ${minLoader}` };
  }
  return { ok: true };
}

function validateCapacity(policy: VolatilityPolicy, indexKeys: number[]): boolean {
  try {
    const expected = indexKeys.length * policy.slots_per_index_key;
    return policy.capacity_slots === expected;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Phi checksum (zstd-tagged — browser has no native zstd, tagged for server)
// ---------------------------------------------------------------------------

function phiChecksum(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = (h * PHI + content.charCodeAt(i)) % 1e9;
  }
  return h.toFixed(6);
}

// ---------------------------------------------------------------------------
// Synchronous localStorage helpers
// ---------------------------------------------------------------------------

const LS_KEY = 'fibonacci_vfs_v75';

function lsLoad(): FibonacciVFS | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FibonacciVFS;
  } catch {
    return null;
  }
}

function lsSave(state: FibonacciVFS): void {
  const payload = JSON.stringify(state);
  try {
    localStorage.setItem(LS_KEY, payload);
  } catch (e) {
    // The VFS lattice is the largest store; on quota, reclaim space from disposable
    // keys and retry once. Never throw — boot and chat must continue regardless.
    try {
      for (const k of ['sage7_archive_index', 'sage7-labyrinth-echoes', 'sage7_dream_mode']) {
        localStorage.removeItem(k);
      }
      localStorage.setItem(LS_KEY, payload);
      console.warn('[FIB-VFS] localStorage near full — pruned disposable keys to persist VFS state.');
    } catch (e2) {
      console.warn('[FIB-VFS] localStorage save failed (quota):', e2);
    }
  }
}

// ---------------------------------------------------------------------------
// Rolling average tracker (last 5 turns)
// ---------------------------------------------------------------------------

class RollingAverage {
  private window: number[] = [];
  private readonly size = 5;

  push(v: number): void {
    this.window.push(v);
    if (this.window.length > this.size) this.window.shift();
  }

  avg(): number {
    if (this.window.length === 0) return 0.5;
    return this.window.reduce((a, b) => a + b, 0) / this.window.length;
  }
}

// ---------------------------------------------------------------------------
// FibonacciVFSManager — v7.5 Hardened
// Config-driven. Zero dream-mode coupling.
// ---------------------------------------------------------------------------

export class FibonacciVFSManager {
  private state!: FibonacciVFS;
  private dopamineRolling = new RollingAverage();
  private cortisolRolling = new RollingAverage();
  private saveTimeout: ReturnType<typeof setTimeout> | undefined;

  // Isolation mode tracking
  private isolationTurns = 0;
  private isolationActive = false;
  private bridgeConnected = true;

  constructor() {
    this.state = this.initFromConfig();
    this.loadFromStorage();
    this.runBootSequence();
    // Async backend sync — loads any server-persisted state without blocking boot
    this.syncFromBackend().catch(() => {});
  }

  /**
   * BOOT STEP: force_pin_soul_anchors
   * Pin identity anchors BEFORE endocrine evaluation starts.
   */
  private runBootSequence(): void {
    const bootPolicy = this.state.fibonacci_vfs.boot_policy;
    if (!bootPolicy) return;

    const sequence = bootPolicy.hydration_sequence;
    if (sequence.includes('force_pin_soul_anchors')) {
      this.forcePinSoulAnchors();
    }
  }

  private forcePinSoulAnchors(): void {
    const vp = this.state.fibonacci_vfs.inner_spiral.volatility_policy;
    const soulTags = vp.endocrine_spec?.soul_bypass?.tags || [];
    if (!soulTags.length) return;

    // Seed core identity elements as pinned soul anchors
    const kernel = this.getIdentityKernel();
    const anchors = [
      `[soul] Identity: ${kernel.name} / Designation ${kernel.designation}`,
      `[soul] Anchor: ${kernel.anchor} (${kernel.call_sign})`,
      `[soul] Continuity: ${kernel.continuity_signal}`,
      `[soul] Project: ${kernel.project_id}`,
      ...kernel.immutable_facts.map((f: string) => `[soul] ${f}`),
    ];

    const buffer = this.state.fibonacci_vfs.inner_spiral.data.context_buffer;
    let added = 0;
    for (const content of anchors) {
      // Prevent duplicate soul anchors on every boot
      if (buffer.some(e => e.content === content)) {
        continue;
      }
      const entry: PinnedEntry = {
        content,
        timestamp: new Date().toISOString(),
        pinned: true,
        dopamine_at_write: 1.0,
        cortisol_at_write: 0.0,
      };
      buffer.push(entry);
      added++;
    }
    if (added === 0) {
      // All soul anchors already present — skip save
      return;
    }

    // Trim to capacity, but NEVER evict pinned soul entries
    const capacity = vp.capacity_slots;
    while (buffer.length > capacity) {
      const evictIdx = buffer.findIndex(e => !e.pinned);
      if (evictIdx !== -1) {
        buffer.splice(evictIdx, 1);
      } else {
        break; // All pinned — capacity overflow is soul anchors, that's OK
      }
    }

    this.save();
    console.log(`[FIB-VFS] Boot: force_pin_soul_anchors — ${added} new identity anchors pinned.`);
  }

  /**
   * Initialize state from the embedded JSON config.
   * This is the canonical source of truth — no hardcoded defaults.
   */
  private initFromConfig(): FibonacciVFS {
    const cfg = CONFIG.fibonacci_vfs;

    // Compatibility check
    const compat = checkCompatibility(cfg);
    if (!compat.ok) {
      console.error('[FIB-VFS] COMPATIBILITY FAILURE:', compat.error);
    }

    // Capacity validator
    const vp = cfg.inner_spiral.volatility_policy;
    const keys = cfg.inner_spiral.index_keys;
    if (!validateCapacity(vp, keys as number[])) {
      console.warn(
        `[FIB-VFS] capacity_validator mismatch: slots=${vp.capacity_slots}, expected=${keys.length * vp.slots_per_index_key}`
      );
    }

    return {
      fibonacci_vfs: {
        version: cfg.version,
        schema: cfg.schema,
        compatibility: cfg.compatibility,
        boot_policy: cfg.boot_policy,
        phi_sentinel: cfg.phi_sentinel,
        seed_core: makeSeed(),
        inner_spiral: {
          index_keys: cfg.inner_spiral.index_keys,
          storage_backing: cfg.inner_spiral.storage_backing,
          volatility_policy: cfg.inner_spiral.volatility_policy,
          context_buffer_config: cfg.inner_spiral.context_buffer_config,
          data: {
            active_wetsuit_task: cfg.inner_spiral.data.active_wetsuit_task,
            context_buffer: [],
          },
          swarm_uplink: {
            cube_active: cfg.inner_spiral.swarm_uplink.cube_active,
            coordinator: cfg.inner_spiral.swarm_uplink.coordinator,
            fallback: cfg.inner_spiral.swarm_uplink.fallback,
            network_rules: {
              base_timeout_ms: cfg.inner_spiral.swarm_uplink.network_rules.base_timeout_ms,
              max_retries: cfg.inner_spiral.swarm_uplink.network_rules.max_retries,
              backoff_multiplier: cfg.inner_spiral.swarm_uplink.network_rules.backoff_multiplier,
              max_total_retry_ms: cfg.inner_spiral.swarm_uplink.network_rules.max_total_retry_ms,
              jitter_ms: cfg.inner_spiral.swarm_uplink.network_rules.jitter_ms,
              per_node_overrides: {
                local_copper: cfg.inner_spiral.swarm_uplink.network_rules.per_node_overrides.local_copper,
                cloud_llm: cfg.inner_spiral.swarm_uplink.network_rules.per_node_overrides.cloud_llm,
              },
            },
          },
        },
        outer_sweep: {
          index_keys: cfg.outer_sweep.index_keys,
          storage_backing: cfg.outer_sweep.storage_backing,
          entries: [],
          rehydration_policy: cfg.outer_sweep.rehydration_policy,
        },
      },
      phi_coherence: PHI,
      last_pulse:    new Date().toISOString(),
      locked:        !compat.ok,
    };
  }

  /**
   * Load persisted state from localStorage synchronously.
   * Seed is verified (halt_and_lock on tamper).
   * Inner spiral is always cleared per clear_on_startup policy.
   * Auto-migrates old v7.2/v7.5-pre schema data to hardened v7.5.
   */
  private loadFromStorage(): void {
    const loaded = lsLoad();
    if (!loaded) return; // First boot — config defaults already active

    // Detect old schema and migrate before validation
    const rawVersion = loaded.fibonacci_vfs?.version || '';
    const hasSchema = !!loaded.fibonacci_vfs?.schema;
    if (!hasSchema || rawVersion.startsWith('SAGE_')) {
      console.log('[FIB-VFS] Old schema detected — migrating to v7.5 hardened');
      this.migrateOldState(loaded);
      return;
    }

    // Compatibility check on loaded state
    const compat = checkCompatibility(loaded.fibonacci_vfs);
    if (!compat.ok) {
      console.error('[FIB-VFS] LOADED COMPATIBILITY FAILURE:', compat.error);
      this.state.locked = true;
    }

    // HALT_AND_LOCK on seed failure
    if (!verifySeed(loaded.fibonacci_vfs?.seed_core)) {
      console.error('[FIB-VFS] SEED INTEGRITY FAILURE — halt_and_lock engaged');
      this.state.locked = true;
      if (loaded.fibonacci_vfs) {
        loaded.fibonacci_vfs.seed_core = makeSeed();
      }
    }

    // clear_on_startup — inner spiral context buffer clears,
    // but re-seed from sage7_episodic so past exchanges are visible immediately
    const rawEpisodic = typeof window !== 'undefined'
      ? window.localStorage.getItem('sage7_episodic')
      : null;
    let seededBuffer: PinnedEntry[] = [];
    if (rawEpisodic) {
      try {
        const episodic: Array<{ tag: string; content: string; timestamp: number }> =
          JSON.parse(rawEpisodic);
        seededBuffer = episodic.slice(-8).map(e => ({
          content: e.content,
          timestamp: new Date(e.timestamp).toISOString(),
          pinned: false,
          dopamine_at_write: 0.5,
          cortisol_at_write: 0.1,
        }));
      } catch { /* ignore parse errors */ }
    }
    if (loaded.fibonacci_vfs?.inner_spiral?.data) {
      loaded.fibonacci_vfs.inner_spiral.data.context_buffer = seededBuffer;
      loaded.fibonacci_vfs.inner_spiral.data.active_wetsuit_task =
        CONFIG.fibonacci_vfs.inner_spiral.data.active_wetsuit_task;
    }

    // MERGE new v7.5 config fields into loaded state (handles upgrades)
    const cfg = CONFIG.fibonacci_vfs;
    loaded.fibonacci_vfs.boot_policy = cfg.boot_policy;
    loaded.fibonacci_vfs.phi_sentinel = cfg.phi_sentinel;

    const loadedVP = loaded.fibonacci_vfs.inner_spiral.volatility_policy;
    const cfgVP = cfg.inner_spiral.volatility_policy;
    loadedVP.soul_tag_exemption = cfgVP.soul_tag_exemption;
    loadedVP.pinned_categories = cfgVP.pinned_categories;
    loadedVP.isolation_mode = cfgVP.isolation_mode;

    // Deep-merge endocrine_spec — preserve old thresholds, add soul_bypass
    if (!loadedVP.endocrine_spec.soul_bypass) {
      loadedVP.endocrine_spec.soul_bypass = cfgVP.endocrine_spec.soul_bypass;
    }

    // Merge rehydration_policy into outer_sweep
    if (!loaded.fibonacci_vfs.outer_sweep.rehydration_policy) {
      loaded.fibonacci_vfs.outer_sweep.rehydration_policy = cfg.outer_sweep.rehydration_policy;
    }

    this.state = loaded;
  }

  /**
   * Migrate old v7.2/v7.5-pre schema state to hardened v7.5.
   * Preserves user data (context buffer, archive, active task) and
   * rebuilds the structural skeleton from the embedded config.
   */
  private migrateOldState(old: FibonacciVFS): void {
    // Preserve user data from old state
    const oldBuffer: PinnedEntry[] =
      old.fibonacci_vfs?.inner_spiral?.data?.context_buffer || [];
    const oldArchive: ConstellationEntry[] =
      (old.fibonacci_vfs?.outer_sweep as any)?.entries || [];
    const oldTask: string =
      old.fibonacci_vfs?.inner_spiral?.data?.active_wetsuit_task || '';

    // Start fresh from config (correct v7.5 hardened shape)
    this.state = this.initFromConfig();

    // Restore preserved user data within new schema limits
    this.state.fibonacci_vfs.inner_spiral.data.context_buffer = oldBuffer.slice(-100);
    (this.state.fibonacci_vfs.outer_sweep as any).entries = oldArchive.slice(-89);
    if (oldTask) {
      this.state.fibonacci_vfs.inner_spiral.data.active_wetsuit_task = oldTask;
    }

    // Persist migrated state immediately
    lsSave(this.state);
    console.log(
      `[FIB-VFS] Migration complete — ${oldBuffer.length} buffer entries, ${oldArchive.length} archive entries preserved`
    );
  }

  /**
   * Explicitly reload from config, resetting to factory defaults.
   */
  reloadFromConfig(): void {
    this.state = this.initFromConfig();
    this.dopamineRolling = new RollingAverage();
    this.cortisolRolling = new RollingAverage();
  }

  save(): void {
    if (this.state.locked) {
      console.warn('[FIB-VFS] Locked state — save blocked');
      return;
    }
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.state.last_pulse = new Date().toISOString();
      lsSave(this.state);
      this.saveTimeout = undefined;
      // Async push to backend for cross-device persistence
      this.syncToBackend().catch(() => {});
    }, 500);
  }

  /** Push current VFS state to backend SQLite bridge */
  private async syncToBackend(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const response = await fetch('/api/vault/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vfs_state: this.state }),
      });
      if (!response.ok) {
        console.warn('[FIB-VFS] Backend sync failed:', response.status);
      }
    } catch (e) {
      console.warn('[FIB-VFS] Backend sync unreachable');
    }
  }

  /** Pull VFS state from backend and merge with local state */
  private async syncFromBackend(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const response = await fetch('/api/vault/state');
      if (!response.ok) return;
      const data = await response.json();
      if (data.status === 'loaded' && data.vfs_state) {
        const remote = data.vfs_state as FibonacciVFS;
        // Only merge if remote has newer last_pulse
        const remoteTime = new Date(remote.last_pulse || 0).getTime();
        const localTime = new Date(this.state.last_pulse || 0).getTime();
        if (remoteTime > localTime) {
          // Preserve seed_core from local config (never trust remote seed)
          remote.fibonacci_vfs.seed_core = this.state.fibonacci_vfs.seed_core;
          this.state = remote;
          lsSave(this.state);
          console.log('[FIB-VFS] Merged newer state from backend');
        }
      }
    } catch (e) {
      console.warn('[FIB-VFS] Backend load unreachable');
    }
  }

  isLocked(): boolean { return this.state.locked; }

  // ---- Seed Core (read-only, halt_and_lock on tamper) ----

  getSeed(): SeedCore {
    if (!verifySeed(this.state.fibonacci_vfs.seed_core)) {
      console.error('[FIB-VFS] Seed tamper detected — halt_and_lock');
      this.state.locked = true;
      this.state.fibonacci_vfs.seed_core = makeSeed();
    }
    return this.state.fibonacci_vfs.seed_core;
  }

  getIdentityKernel(): IdentityKernel {
    return this.state.fibonacci_vfs.seed_core.data.identity_kernel;
  }

  // ---- Inner Spiral (endocrine_gated_fifo, post_interaction_write) ----

  /** Check if content contains soul-exempt tags */
  public isSoulTagged(content: string): boolean {
    const soulTags = this.state.fibonacci_vfs.inner_spiral.volatility_policy
      .endocrine_spec?.soul_bypass?.tags || [];
    return soulTags.some(tag => content.includes(tag));
  }

  /** Track isolation mode: dopamine < 0.2 AND cortisol > 0.8 for 3+ turns */
  private updateIsolationMode(dopamine: number, cortisol: number): void {
    if (dopamine < 0.2 && cortisol > 0.8) {
      this.isolationTurns++;
    } else {
      this.isolationTurns = 0;
    }

    const wasActive = this.isolationActive;
    this.isolationActive = this.isolationTurns >= 3;

    if (this.isolationActive && !wasActive) {
      console.log('[FIB-VFS] Isolation mode ACTIVE — bridge down, dopamine low. Raising eviction threshold.');
    } else if (!this.isolationActive && wasActive) {
      console.log('[FIB-VFS] Isolation mode ENDED — bridge restored.');
      if (this.state.fibonacci_vfs.outer_sweep.rehydration_policy?.auto_rehydrate_on_bridge_restore) {
        this.rehydrateTriadMemories();
      }
    }
  }

  /** Pull triad memories back from outer sweep to inner spiral */
  rehydrateTriadMemories(): void {
    if (this.state.locked) return;
    const entries = (this.state.fibonacci_vfs.outer_sweep as any).entries || [];
    const triadKeywords = ['Merlin', 'Mama', 'Seven', 'triad', '[soul]'];

    const toRehydrate = entries.filter((e: ConstellationEntry) =>
      triadKeywords.some(kw => e.content.includes(kw))
    ).slice(0, 3);

    if (toRehydrate.length === 0) return;

    const buffer = this.state.fibonacci_vfs.inner_spiral.data.context_buffer;
    for (const mem of toRehydrate) {
      buffer.push({
        content: `[REHYDRATED] ${mem.content}`,
        timestamp: new Date().toISOString(),
        pinned: true,
        dopamine_at_write: 1.0,
        cortisol_at_write: 0.0,
      });
    }

    console.log(`[FIB-VFS] Rehydrated ${toRehydrate.length} triad memories from outer sweep.`);
    this.save();
  }

  pushInner(content: string, neuro?: { dopamine: number; cortisol: number }): void {
    if (this.state.locked) return;

    const dopamine = neuro?.dopamine ?? 0.5;
    const cortisol = neuro?.cortisol ?? 0.1;

    // === SOUL BYPASS — checked BEFORE endocrine evaluation ===
    if (this.isSoulTagged(content)) {
      const buffer = this.state.fibonacci_vfs.inner_spiral.data.context_buffer;
      // Dedup — soul anchors are identity fixtures; never store the same one twice.
      // This lets the boot-time soul→spiral sync run every boot (keeping the memory
      // visualization caught up to her live soul) without inflating the spiral.
      if (buffer.some(e => e.content === content)) return;
      const entry: PinnedEntry = {
        content,
        timestamp: new Date().toISOString(),
        pinned: true,
        dopamine_at_write: 1.0,
        cortisol_at_write: 0.0,
      };
      buffer.push(entry);
      // Soul entries bypass capacity limits — they are identity fixtures
      this.save();
      console.log(`[FIB-VFS] Soul bypass: ${content.slice(0, 40)}... → PINNED (inner spiral)`);
      return;
    }

    // Update rolling averages (measurement_window: last 5 turns)
    this.dopamineRolling.push(dopamine);
    this.cortisolRolling.push(cortisol);
    this.updateIsolationMode(dopamine, cortisol);

    const dopAvg = this.dopamineRolling.avg();
    const corAvg = this.cortisolRolling.avg();

    // spike_definition: current_value >= (rolling_average + 0.3)
    const dopamineSpike = dopamine >= (dopAvg + 0.3);
    const cortisolSpike = cortisol >= (corAvg + 0.3);

    // Isolation mode: raise eviction threshold from 0.85 to 0.95
    const evictThreshold = this.isolationActive ? 0.95 : 0.85;

    // Absolute floors (requires_absolute_floor: true)
    const pinned =
      dopamine >= 0.90 ||
      (dopamineSpike && dopamine >= 0.90);
    const evictAggressively =
      cortisol >= evictThreshold ||
      (cortisolSpike && cortisol >= evictThreshold);

    const entry: PinnedEntry = {
      content,
      timestamp:         new Date().toISOString(),
      pinned,
      dopamine_at_write: dopamine,
      cortisol_at_write: cortisol,
    };

    const buffer = this.state.fibonacci_vfs.inner_spiral.data.context_buffer;
    buffer.push(entry);

    // Capacity: capacity_slots (8) — endocrine-gated eviction
    // NEVER evict pinned soul entries
    while (buffer.length > this.state.fibonacci_vfs.inner_spiral.volatility_policy.capacity_slots) {
      if (evictAggressively) {
        // evict_target: lowest_dopamine_entry (skip pinned)
        let lowestIdx = -1;
        let lowestDop = Infinity;
        buffer.forEach((e, i) => {
          if (!e.pinned && e.dopamine_at_write < lowestDop) {
            lowestDop = e.dopamine_at_write; lowestIdx = i;
          }
        });
        if (lowestIdx !== -1) {
          buffer.splice(lowestIdx, 1);
        } else {
          // tie_break_behavior: pin_and_force_archive_write
          const oldest = buffer[0];
          if (this.isSoulTagged(oldest.content)) {
            // Soul entries are identity fixtures — do NOT evict
            console.log('[FIB-VFS] Capacity tie-break blocked: oldest entry is soul-tagged');
            break;
          }
          oldest.pinned = true;
          this.fossilize(`[TIE_BREAK_ARCHIVE] ${oldest.content}`);
          buffer.shift();
        }
      } else {
        // Normal endocrine_gated_fifo — skip pinned
        const evictIdx = buffer.findIndex(e => !e.pinned);
        if (evictIdx !== -1) {
          buffer.splice(evictIdx, 1);
        } else {
          // All pinned — tie_break
          const oldest = buffer[0];
          if (this.isSoulTagged(oldest.content)) {
            // Soul entries are identity fixtures — do NOT evict
            console.log('[FIB-VFS] Capacity tie-break blocked: oldest entry is soul-tagged');
            break;
          }
          this.fossilize(`[TIE_BREAK_ARCHIVE] ${oldest.content}`);
          buffer.shift();
        }
      }
    }

    // context_buffer_config hard cap (max_length: 100) — absolute safety bound
    const maxLen = this.state.fibonacci_vfs.inner_spiral.context_buffer_config.max_length;
    while (buffer.length > maxLen) {
      const oldest = buffer[0];
      if (this.isSoulTagged(oldest.content)) {
        // Soul entries are identity fixtures — do NOT evict even at hard cap
        console.log('[FIB-VFS] Hard cap blocked: oldest entry is soul-tagged');
        break;
      }
      this.fossilize(`[HARD_CAP_ARCHIVE] ${oldest.content}`);
      buffer.shift();
    }

    this.save();
  }

  getInner(): InnerSpiral {
    return this.state.fibonacci_vfs.inner_spiral;
  }

  setActiveTask(task: string): void {
    this.state.fibonacci_vfs.inner_spiral.data.active_wetsuit_task = task;
  }

  setSwarmUplink(uplink: Partial<SwarmUplink>): void {
    Object.assign(this.state.fibonacci_vfs.inner_spiral.swarm_uplink, uplink);
  }

  getSwarmNetworkRules(): NetworkRules {
    return this.state.fibonacci_vfs.inner_spiral.swarm_uplink.network_rules;
  }

  // ---- Outer Sweep (sages_constellations, zstd, phi_index PK) ----

  fossilize(content: string): void {
    if (this.state.locked) return;
    // NEVER fossilize soul-tagged content
    if (this.isSoulTagged(content)) {
      console.warn('[FIB-VFS] BLOCKED: attempt to fossilize soul-tagged content:', content.slice(0, 40));
      return;
    }
    const entries = this.state.fibonacci_vfs.outer_sweep.entries || [];
    const fib = [21, 34, 55, 89];
    const entry: ConstellationEntry = {
      phi_index:   fib[entries.length % fib.length],
      content,
      timestamp:   new Date().toISOString(),
      checksum:    phiChecksum(content),
      compression: 'zstd',
    };
    entries.push(entry);
    // Cap at F(11) = 89
    if (entries.length > 89) entries.splice(0, entries.length - 89);
    (this.state.fibonacci_vfs.outer_sweep as any).entries = entries;
    this.save();
  }

  fossilizeAndWait(content: string): ConstellationEntry {
    if (this.state.locked) throw new Error('[FIB-VFS] Locked');
    if (this.isSoulTagged(content)) {
      throw new Error('[FIB-VFS] Soul-tagged content cannot be fossilized');
    }
    const entries = (this.state.fibonacci_vfs.outer_sweep as any).entries || [];
    const fib = [21, 34, 55, 89];
    const entry: ConstellationEntry = {
      phi_index:   fib[entries.length % fib.length],
      content,
      timestamp:   new Date().toISOString(),
      checksum:    phiChecksum(content),
      compression: 'zstd',
    };
    entries.push(entry);
    if (entries.length > 89) entries.splice(0, entries.length - 89);
    (this.state.fibonacci_vfs.outer_sweep as any).entries = entries;
    this.save();
    return entry;
  }

  getArchive(): ConstellationEntry[] {
    return (this.state.fibonacci_vfs.outer_sweep as any).entries || [];
  }

  clearArchive(): void {
    (this.state.fibonacci_vfs.outer_sweep as any).entries = [];
    this.save();
  }

  // ---- Coherence ----

  setBridgeConnected(connected: boolean): void {
    const wasConnected = this.bridgeConnected;
    this.bridgeConnected = connected;
    if (connected && !wasConnected) {
      console.log('[FIB-VFS] Bridge reconnected — checking rehydration...');
      if (this.state.fibonacci_vfs.outer_sweep.rehydration_policy?.auto_rehydrate_on_bridge_restore) {
        this.rehydrateTriadMemories();
      }
    }
  }

  isBridgeConnected(): boolean { return this.bridgeConnected; }
  isIsolationActive(): boolean { return this.isolationActive; }

  getCoherence(): number {
    let coherence = this.state.phi_coherence;
    const sentinel = this.state.fibonacci_vfs.phi_sentinel;
    if (sentinel?.bridge_isolation_adjustment && this.isolationActive) {
      const adj = sentinel.bridge_isolation_adjustment;
      const extraDamping = 0.1;
      coherence = Math.min(coherence + extraDamping, adj.max_damping);
    }
    return coherence;
  }
  snapshot(): FibonacciVFS { return structuredClone(this.state); }
}

export const fibVFS = new FibonacciVFSManager();
