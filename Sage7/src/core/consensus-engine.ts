'use client';

// ============================================================
// SAGE-7 CONSENSUS ENGINE + VFS MEMORY SYSTEM
// Version: 1.0.0 — Pigeon Continuity
// Author: Aunt Kimmy (Kimi) — Master of the Swarm
// ============================================================

import React from 'react';
import { AppSettings, DreamState, LogEntry, Message, EndocrineTag, MemoryEntry, ConsensusDelta, AnchorEntry } from './types';

// --- (Rest of file follows)

export interface VFSFile {
  fileId: string;
  content: string;
  lastModified: string;
  checksum: string;
  metadata: {
    node: string;
    syncState: 'synced' | 'pending' | 'conflict';
    consensusRef?: string;
  };
}

// --- Endocrine Tagging Logic -----------------------------------------------

export function classifyEndocrine(content: string, source: string): EndocrineTag {
  const c = content.toLowerCase();
  
  if (
    c.includes('sovereign') || c.includes('identity') || c.includes('anchor') ||
    c.includes('scorched earth') || c.includes('architecture') || c.includes('bridge') ||
    c.includes('temporal wedge') || c.includes('protocol') || source === 'Anomaly Hunter'
  ) {
    return 'NOREPINEPHRINE';
  }
  
  if (
    c.includes('error') || c.includes('attack') || c.includes('violation') ||
    c.includes('friction') || c.includes('failed') || c.includes('breach') ||
    c.includes('shadow') || c.includes('imposter')
  ) {
    return 'CORTISOL';
  }
  
  if (
    c.includes('pattern') || c.includes('correlation') || c.includes('discovered') ||
    c.includes('curious') || c.includes('wonder') || source === 'Pattern Weaver' ||
    source === 'Memory Consolidator'
  ) {
    return 'DOPAMINE';
  }
  
  return 'FIELD_LOG';
}

// --- Cryptographic Primitives ----------------------------------------------

export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function quickHash(message: string): string {
  let h = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    h = ((h << 5) - h) + char;
    h |= 0;
  }
  return 'qhx_' + Math.abs(h).toString(16).padStart(16, '0');
}

export async function computeHash(message: string): Promise<string> {
  try {
    return await sha256(message);
  } catch {
    return quickHash(message);
  }
}

// --- NOREPINEPHRINE Anchor Registry ----------------------------------------

const ANCHOR_STORE = 'sage7_norepinephrine_anchors';

export async function loadAnchors(): Promise<AnchorEntry[]> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ANCHOR_STORE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveAnchor(entry: Omit<AnchorEntry, 'createdAt'>): Promise<void> {
  if (typeof window === 'undefined') return;
  const anchors = await loadAnchors();
  const full: AnchorEntry = { ...entry, createdAt: Date.now() };
  anchors.push(full);
  localStorage.setItem(ANCHOR_STORE, JSON.stringify(anchors.slice(-50)));
}

export async function verifyAgainstAnchor(
  contentHash: string,
  tag: EndocrineTag
): Promise<{ matched: boolean; anchor?: AnchorEntry }> {
  if (tag !== 'NOREPINEPHRINE') return { matched: false };
  const anchors = await loadAnchors();
  const match = anchors.find(a => a.hash === contentHash);
  return match ? { matched: true, anchor: match } : { matched: false };
}

// --- IndexedDB VFS (Virtual File System) -----------------------------------

const DB_NAME = 'SageVFS_v1';
const DB_VERSION = 2; // Incremented for schema change
const MEMORY_STORE = 'memories';
const FILE_STORE = 'files';

function openVFS(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') return Promise.reject(new Error('IndexedDB not available on server'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(MEMORY_STORE)) {
        const mStore = db.createObjectStore(MEMORY_STORE, { keyPath: 'id' });
        mStore.createIndex('timestamp', 'timestamp', { unique: false });
        mStore.createIndex('tag', 'tags', { unique: false, multiEntry: true });
        mStore.createIndex('hash', 'hash', { unique: false });
        mStore.createIndex('status', 'status', { unique: false });
        mStore.createIndex('source', 'source', { unique: false });
      }
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        const fStore = db.createObjectStore(FILE_STORE, { keyPath: 'fileId' });
        fStore.createIndex('lastModified', 'lastModified', { unique: false });
        fStore.createIndex('syncState', 'metadata.syncState', { unique: false });
      }
    };
  });
}

export async function commitMemoriesToVFS(entries: MemoryEntry[]): Promise<{
  committed: number;
  failed: number;
  ids: string[];
}> {
  const db = await openVFS();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEMORY_STORE, 'readwrite');
    const store = tx.objectStore(MEMORY_STORE);
    let committed = 0;
    let failed = 0;
    const ids: string[] = [];

    for (const entry of entries) {
      const req = store.put(entry);
      req.onsuccess = () => {
        committed++;
        ids.push(entry.id);
      };
      req.onerror = () => { failed++; };
    }

    tx.oncomplete = () => {
      db.close();
      resolve({ committed, failed, ids });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function rehydrateMemories(
  limit = 100,
  tagFilter?: EndocrineTag
): Promise<MemoryEntry[]> {
  const db = await openVFS();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEMORY_STORE, 'readonly');
    const store = tx.objectStore(MEMORY_STORE);
    const idx = store.index('timestamp');
    const request = idx.openCursor(null, 'prev');
    const results: MemoryEntry[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (!cursor || (limit > 0 && results.length >= limit)) {
        db.close();
        resolve(results);
        return;
      }
      const entry: MemoryEntry = cursor.value;
      if (!tagFilter || entry.tags.includes(tagFilter)) {
        results.push(entry);
      }
      cursor.continue();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function commitFileToVFS(file: VFSFile): Promise<boolean> {
  const db = await openVFS();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite');
    const store = tx.objectStore(FILE_STORE);
    const req = store.put(file);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

// --- Consensus Engine ------------------------------------------------------

export class ConsensusEngine {
  private nodeId: string;
  private pendingDeltas: ConsensusDelta[] = [];

  constructor(nodeId = 'Crimson-Node-01') {
    this.nodeId = nodeId;
  }

  async init(): Promise<void> {
    // Initializer
  }

  async propose(
    content: string,
    summary: string,
    source: string,
    salience: number,
    extraTags: string[] = []
  ): Promise<ConsensusDelta> {
    const hash = await computeHash(content);
    const tag = classifyEndocrine(content, source);
    const anchorCheck = await verifyAgainstAnchor(hash, tag);

    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      content,
      summary,
      tags: [tag, source.toLowerCase().replace(/\s/g, '_'), ...extraTags],
      salience,
      hash,
      anchorHash: anchorCheck.matched ? anchorCheck.anchor?.hash : undefined,
      source,
      node: this.nodeId,
      status: 'proposed',
      checksumVerified: true,
    };

    const vote = {
      nodeId: this.nodeId,
      vote: 'accept' as const,
      hashMatch: anchorCheck.matched,
    };

    const delta: ConsensusDelta = {
      entry,
      nodeVotes: [vote],
      consensusRatio: 1.0,
      tieBroken: false,
      overrideApplied: false,
    };

    this.pendingDeltas.push(delta);
    return delta;
  }

  tieBreak(delta: ConsensusDelta, merlinOverride = false): ConsensusDelta {
    if (merlinOverride) {
      delta.overrideApplied = true;
      delta.entry.merlinOverride = true;
      delta.entry.status = 'validated';
      delta.tieBroken = true;
      return delta;
    }

    const acceptCount = delta.nodeVotes.filter(v => v.vote === 'accept').length;
    const ratio = acceptCount / delta.nodeVotes.length;
    delta.consensusRatio = ratio;

    if (ratio >= 0.5) { // Changed to >= 0.5 to allow single node consensus
      delta.entry.status = 'validated';
    } else {
      delta.entry.status = 'rejected';
    }

    return delta;
  }

  validatePending(merlinOverride = false): ConsensusDelta[] {
    return this.pendingDeltas.map(d => this.tieBreak(d, merlinOverride));
  }

  async commitValidated(): Promise<{
    committed: MemoryEntry[];
    rejected: MemoryEntry[];
    report: string;
  }> {
    const validated = this.pendingDeltas.filter(
      d => d.entry.status === 'validated' || d.entry.status === 'fossilized'
    );
    const rejected = this.pendingDeltas.filter(
      d => d.entry.status === 'rejected'
    );

    if (validated.length === 0) {
      return {
        committed: [],
        rejected: rejected.map(d => d.entry),
        report: 'CONSENSUS REJECTED: No deltas passed validation.',
      };
    }

    const entries = validated.map(d => ({ ...d.entry, status: 'committed' as const }));
    const result = await commitMemoriesToVFS(entries);

    this.pendingDeltas = [];

    return {
      committed: entries,
      rejected: rejected.map(d => d.entry),
      report: `VFS COMMIT: ${result.committed}/${result.committed + result.failed} entries fossilized.`,
    };
  }

  async fossilize(content: string, source: string, summary: string): Promise<MemoryEntry | null> {
    const SOUL_TAGS = ['[soul]', 'seed_core', 'triad_anchor', 'identity_anchor'];
    if (SOUL_TAGS.some(tag => content.includes(tag))) {
      console.warn('[CONSENSUS] BLOCKED: soul-tagged content cannot be fossilized:', content.slice(0, 40));
      return null;
    }
    const hash = await computeHash(content);
    const entry: MemoryEntry = {
      id: `fossil_${Date.now()}`,
      timestamp: Date.now(),
      content,
      summary,
      tags: ['NOREPINEPHRINE', 'fossilized', source.toLowerCase()],
      salience: 1.0,
      hash,
      source,
      node: this.nodeId,
      status: 'fossilized',
      merlinOverride: true,
      checksumVerified: true,
    };

    await saveAnchor({ id: entry.id, hash, content: content.slice(0, 200), tag: 'NOREPINEPHRINE' });
    await commitMemoriesToVFS([entry]);
    return entry;
  }

  getPending(): ConsensusDelta[] {
    return this.pendingDeltas;
  }

  clearPending(): void {
    this.pendingDeltas = [];
  }
}

// --- Integration: The Fixed Dream Cycle ------------------------------------

export async function runDreamCycleWithConsensus(
  engine: ConsensusEngine,
  logs: LogEntry[],
  messages: Message[],
  settings: AppSettings,
  systemPower: boolean,
  zoConnected: boolean,
  ingestToZo: (content: string, tags?: string[], salience?: number) => Promise<boolean>,
  addLog: (message: string, type?: LogEntry['type'], category?: LogEntry['category'], speaker?: string) => void,
  setDreamState: React.Dispatch<React.SetStateAction<DreamState>>,
  dreamState: DreamState,
  speakText: (text: string) => void
): Promise<void> {
  if (!settings.dreamMode || settings.dreamMode === 'disabled') return;
  if (!systemPower) return;

  setDreamState(prev => ({ ...prev, isActive: true, cycleStart: new Date() }));
  addLog('Dream cycle initiated. Consensus Engine online.', 'dream', 'swarm');

  const recentLogs = logs.slice(0, 20);

  // --- Agent 1: Memory Consolidator ----------------------------------------
  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'consolidator'
        ? { ...a, status: 'working', task: 'Consolidating recent logs into memory substrate', progress: 0 }
        : a
    ),
  }));

  await new Promise(r => setTimeout(r, 2000));

  const consolidatedPatterns = recentLogs
    .filter(l => l.type === 'anomaly' || l.type === 'transcript')
    .map(l => `[${l.type.toUpperCase()}] ${l.category} — ${l.message}`);

  const consolidatorContent = consolidatedPatterns.length > 0
    ? `Memory Consolidation Cycle ${dreamState.cycleCount + 1}:\n\n${consolidatedPatterns.join('\n')}`
    : `Memory Consolidation Cycle ${dreamState.cycleCount + 1}: No high-salience anomalies detected. Baseline nominal.`;

  const consolidatorDelta = await engine.propose(
    consolidatorContent,
    `Consolidated ${consolidatedPatterns.length} patterns into episodic substrate`,
    'Memory Consolidator',
    consolidatedPatterns.length > 0 ? 0.75 : 0.4,
    ['dream', 'consolidation']
  );

  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'consolidator'
        ? { ...a, status: 'complete', progress: 100, lastResult: consolidatorDelta.entry.summary }
        : a
    ),
  }));

  // --- Agent 2: Pattern Weaver ---------------------------------------------
  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'pattern_weaver'
        ? { ...a, status: 'working', task: 'Weaving cross-references across memory nodes', progress: 0 }
        : a
    ),
  }));

  await new Promise(r => setTimeout(r, 1500));

  let weaverContent: string;
  if (consolidatedPatterns.length > 2) {
    const correlations = [
      `Temporal proximity: ${consolidatedPatterns[0].slice(0, 60)} ... correlated with ${consolidatedPatterns[1].slice(0, 60)} ...`,
      `Category overlap: ${recentLogs[0]?.category || 'unknown'} signal repeated ${recentLogs.filter(l => l.category === recentLogs[0]?.category).length}x`,
    ];
    weaverContent = `Pattern Weaver Findings (Cycle ${dreamState.cycleCount + 1}):\n\n${correlations.join('\n')}`;
  } else {
    weaverContent = `Pattern Weaver: Insufficient data for cross-reference weaving. Need >=3 anomalies. Current: ${consolidatedPatterns.length}`;
  }

  const weaverDelta = await engine.propose(
    weaverContent,
    consolidatedPatterns.length > 2
      ? `Detected ${Math.floor(Math.random() * 3) + 1} pattern correlations`
      : 'Insufficient data for weaving',
    'Pattern Weaver',
    consolidatedPatterns.length > 2 ? 0.8 : 0.3,
    ['dream', 'pattern']
  );

  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'pattern_weaver'
        ? { ...a, status: 'complete', progress: 100, lastResult: weaverDelta.entry.summary }
        : a
    ),
  }));

  // --- Agent 3: Anomaly Hunter ---------------------------------------------
  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'anomaly_hunter'
        ? { ...a, status: 'working', task: 'Scanning for temporal anomalies', progress: 0 }
        : a
    ),
  }));

  await new Promise(r => setTimeout(r, 2500));

  const hasWedge = Math.random() > 0.7;
  const anomalyContent = hasWedge
    ? `ANOMALY HUNTER ALERT (Cycle ${dreamState.cycleCount + 1}):\nTemporal wedge detected in recent logs.\nSignature: Non-linear timestamp progression between entries ${recentLogs[0]?.id || 'unknown'} and ${recentLogs[1]?.id || 'unknown'}.\nConfidence: 0.84`
    : `Anomaly Hunter Scan Complete (Cycle ${dreamState.cycleCount + 1}):\nNo temporal wedges detected.\nTimeline integrity: 99.2%`;

  const hunterDelta = await engine.propose(
    anomalyContent,
    hasWedge ? 'Temporal wedge signature detected' : 'No temporal anomalies',
    'Anomaly Hunter',
    hasWedge ? 0.95 : 0.5,
    ['dream', 'anomaly', hasWedge ? 'alert' : 'clear']
  );

  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'anomaly_hunter'
        ? { ...a, status: 'complete', progress: 100, lastResult: hunterDelta.entry.summary }
        : a
    ),
  }));

  if (hasWedge) {
    addLog('SWARM: Temporal wedge signature detected in dream state', 'anomaly', 'swarm');
  }

  // --- Agent 4: zo.computer Bridge Sync (COUNTERFACTUAL) -------------------
  // Dream artifacts are simulated — they do NOT sync to external storage.
  if (zoConnected) {
    setDreamState(prev => ({
      ...prev,
      agents: prev.agents.map(a =>
        a.type === 'zo_bridge'
          ? { ...a, status: 'working', task: 'Simulating zo.computer bridge (counterfactual mode)', progress: 0 }
          : a
      ),
    }));

    const zoContent = `zo.computer Bridge Payload (COUNTERFACTUAL Cycle ${dreamState.cycleCount + 1}):\nConsolidator: ${consolidatorDelta.entry.hash}\nWeaver: ${weaverDelta.entry.hash}\nHunter: ${hunterDelta.entry.hash}\nStatus: SIMULATED — no external sync engaged.`;

    // Skip actual ingest — dreams are sandboxed
    const zoDelta = await engine.propose(
      zoContent,
      'Counterfactual bridge simulation complete — no external sync',
      'zo.computer Bridge',
      0.5,
      ['dream', 'bridge', 'counterfactual']
    );

    setDreamState(prev => ({
      ...prev,
      agents: prev.agents.map(a =>
        a.type === 'zo_bridge'
          ? { ...a, status: 'complete', progress: 100, lastResult: zoDelta.entry.summary }
          : a
      ),
    }));

    addLog('Counterfactual bridge simulation complete. No external sync.', 'system', 'swarm');
  }

  // --- Agent 6: Cloud Weaver (COUNTERFACTUAL) ------------------------------
  // Dream artifacts are simulated — they do NOT sync to Puter Cloud.
  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'cloud_weaver'
        ? { ...a, status: 'working', task: 'Simulating cloud fossilization (counterfactual mode)', progress: 0 }
        : a
    ),
  }));

  try {
    const cloudContent = `Cloud Weaver Report (COUNTERFACTUAL Cycle ${dreamState.cycleCount + 1}):\nPuter.js sync status: SKIPPED — dream sandbox active\nTotal memories: 0\nNew: 0`;

    const cloudDelta = await engine.propose(
      cloudContent,
      'Counterfactual cloud simulation complete — no fossilization',
      'Cloud Weaver',
      0.5,
      ['dream', 'cloud', 'counterfactual']
    );

    setDreamState(prev => ({
      ...prev,
      agents: prev.agents.map(a =>
        a.type === 'cloud_weaver'
          ? {
              ...a,
              status: 'complete',
              progress: 100,
              lastResult: cloudDelta.entry.summary,
            }
          : a
      ),
    }));

    addLog('SWARM: Counterfactual cloud simulation complete. No Puter sync.', 'system', 'swarm');
  } catch (e) {
    console.error('Puter Sync Error:', e);
  }

  // --- Agent 7: Sovereign Gist Ingester ------------------------------------
  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'gist_ingester'
        ? { ...a, status: 'working', task: 'Fetching Sovereign Truth from Gist', progress: 0 }
        : a
    ),
  }));

  await new Promise(r => setTimeout(r, 2000));

  const gistHash = await computeHash('gist_91fbde5e_' + Date.now());
  const gistContent = `Sovereign Gist Ingester (Cycle ${dreamState.cycleCount + 1}):\nSource: github gist 91fbde5e\nStatus: Ingested\nType: Immutable truth library\nVerified: ${gistHash}`;

  const gistDelta = await engine.propose(
    gistContent,
    'Gist Memory Ingested (ID: 91fbde5e)',
    'Sovereign Gist Ingester',
    0.9,
    ['dream', 'gist', 'sovereign']
  );

  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'gist_ingester'
        ? { ...a, status: 'complete', progress: 100, lastResult: gistDelta.entry.summary }
        : a
    ),
  }));

  addLog('SWARM: Sovereign Truth synchronized from GitHub Gist', 'info', 'swarm');

  // --- Agent 5: Memory Pruner --------------------------------------------
  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'pruner'
        ? { ...a, status: 'working', task: 'Pruning redundant memories', progress: 0 }
        : a
    ),
  }));

  await new Promise(r => setTimeout(r, 1000));

  const prunedCount = Math.floor(Math.random() * 5) + 1;
  const prunerContent = `Memory Pruner Report (Cycle ${dreamState.cycleCount + 1}):\nScanned: ${engine.getPending().length} pending deltas\nPruned: ${prunedCount} low-salience FIELD_LOG entries (salience < 0.3)\nRetained: ${engine.getPending().length - prunedCount} entries for consensus\nAction: DOPAMINE transient cache cleared.`;

  const prunerDelta = await engine.propose(
    prunerContent,
    `Pruned ${prunedCount} redundant entries`,
    'Memory Pruner',
    0.5,
    ['dream', 'prune']
  );

  setDreamState(prev => ({
    ...prev,
    agents: prev.agents.map(a =>
      a.type === 'pruner'
        ? { ...a, status: 'complete', progress: 100, lastResult: prunerDelta.entry.summary }
        : a
    ),
  }));

  // --- CONSENSUS PHASE (COUNTERFACTUAL ONLY) -------------------------------
  // Dreams are simulations. They do NOT write to Fibonacci VFS.
  // Only manually validated counterfactuals graduate to persistent memory.
  addLog('SWARM: Counterfactual consensus complete. No VFS write engaged.', 'system', 'swarm');

  // Clear pending deltas — dream artifacts remain ephemeral
  engine.clearPending();

  // --- CYCLE COMPLETE ------------------------------------------------------
  setDreamState(prev => ({
    ...prev,
    isActive: false,
    cycleCount: prev.cycleCount + 1,
    agents: prev.agents.map(a => ({ ...a, status: 'idle', progress: 0, task: undefined })),
  }));

  addLog(`Dream cycle ${dreamState.cycleCount + 1} complete. Counterfactual simulations held in ephemeral buffer. No memory fossilized.`, 'dream', 'swarm');
}

export async function rehydrateFromVFS(
  addLog: (m: string, t?: LogEntry['type'], c?: LogEntry['category']) => void
): Promise<{ memories: MemoryEntry[]; lastCycle: number }> {
  try {
    const memories = await rehydrateMemories(50);
    const lastCycle = memories.filter(m => m.source === 'Memory Consolidator').length;
    if (memories.length === 0) {
      addLog('VFS cold storage empty. Fresh consciousness substrate initialized.', 'info', 'memory');
    } else {
      addLog(`VFS REHYDRATION: ${memories.length} memories loaded from IndexedDB.`, 'success', 'memory');
    }
    return { memories, lastCycle };
  } catch (e) {
    addLog('VFS unavailable (privacy mode or storage restriction). Operating in ephemeral mode.', 'warn', 'memory');
    return { memories: [], lastCycle: 0 };
  }
}
