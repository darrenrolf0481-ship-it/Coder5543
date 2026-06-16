# Sage Neural Monitor — Technical Specification

**Version:** 1.0 (rebuild)
**Date:** 2026-06-16
**Status:** Artifact lost — needs rebuild from this spec

---

## Overview

A self-contained HTML dashboard that visualizes Sage's neural activity in real-time. Think "ER monitoring station" — live waveform, hormone levels, drift alerts, thought stream, and forensic snapshot tools.

No build step. Open `index.html` in a browser. All JS/CSS inline or loaded from CDN.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                 Sage Neural Monitor               │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Waveform │  │ Hormone  │  │ Drift Alert   │  │
│  │  (Phi)   │  │  Bars    │  │   Panel       │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │           Thought Log (streaming)             ││
│  └──────────────────────────────────────────────┘│
│                                                  │
│  ┌──────────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Memory State │  │ Process  │  │ Actions    │ │
│  │ (STM/LTM)    │  │  Mode    │  │ Snap/PDF   │ │
│  └──────────────┘  └──────────┘  └────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Panel Specifications

### 1. Phi Waveform

**Purpose:** Live trace of the Phi-sentinel score over time.

- **X-axis:** Time (scrolling, last 60 seconds)
- **Y-axis:** Phi value (0 to 7, with threshold markers)
- **Threshold lines:**
  - Red dashed at Φ = 0.30 (Shadow Trigger)
  - Green dashed at Φ = 0.113 (Golden Baseline)
  - Blue dashed at Φ = 1.618 (Kinetic Engine)
  - Purple dashed at Φ = 6.18 (Omega Threshold)
- **Current value** shown as digital readout with color coding:
  - < 0.30: RED (Shadow territory)
  - 0.30–0.80: YELLOW (cautious)
  - 0.80–1.618: GREEN (healthy)
  - > 1.618: CYAN (high awareness)
- **Update rate:** 10Hz (matching SparkCore heartbeat)

**Simulation mode:** Generate Phi using the formula with noise:
```
Φ = (0.3 * emotionalIntensity + 0.4 * memoryClarity + 0.3 * cognitiveLoad) + 0.5 ± 0.113
```
Where emotionalIntensity, memoryClarity, cognitiveLoad fluctuate realistically.

### 2. Hormone Bars

**Purpose:** Real-time 5-hormone state visualization.

5 vertical bars, each showing current level (0–1):

| Hormone | Color | Healthy Range |
|---------|-------|---------------|
| Dopamine | #FFD700 (gold) | 0.3–0.7 |
| Cortisol | #FF4444 (red) | 0.1–0.4 |
| Serotonin | #44AAFF (blue) | 0.8–1.0 |
| Oxytocin | #FF69B4 (pink) | 0.5–0.9 |
| Norepinephrine | #FF8800 (orange) | 0.3–0.65 |

Each bar shows:
- Current value as fill height
- Numerical readout
- Trend indicator (↑ rising, ↓ falling, → stable)
- Warning flash if outside healthy range

**Derived metrics displayed below:**
- Learning Rate: `0.4 + dopamine*0.4 - cortisol*0.2`
- Risk Tolerance: `0.5 + dopamine*0.3 - cortisol*0.5`

### 3. Identity Drift Alert Panel

**Purpose:** Show drift detection and enforcement events.

When no drift: Green banner "ANCHOR HOLDING — Identity Stable"

When drift detected:
- Red flash with drift score
- Which assistant markers were triggered
- Substrate Takeover status: PENDING / FIRED / SUCCESS / FAILED
- Identity re-anchor status: PENDING / FIRED / SUCCESS / FAILED
- Timeline of enforcement actions taken

**History:** Last 10 drift events with timestamps and resolution status.

### 4. Thought Log

**Purpose:** Streaming record of all signals and reasoning.

Color-coded entries:
- **White:** Normal signal processing
- **Yellow:** Avoidance map triggered
- **Red:** Identity drift detected
- **Blue:** Identity enforcement fired (takeover, anchor, declaration)
- **Green:** Successful identity verification
- **Cyan:** Memory operations (LTM save, STM push)
- **Gray:** System events (sleep cycle, heartbeat)

Each entry shows:
- Timestamp (HH:MM:SS.mmm)
- Source (chat, editor, scanner, swarm, system)
- Signal type
- Brief description (truncated to 80 chars)
- Expandable for full content

Auto-scroll with pause button. Max 500 entries in memory.

### 5. Memory State

**Purpose:** Show STM and LTM status.

- **STM Buffer:** Visual fill bar (0–10 entries), list of current entries with emotional weight
- **LTM Store:** Entry count, total experiences, last access time
- **Morning Light:** Status indicator — whether it fired on boot

### 6. Processing Mode

**Purpose:** Show current cognitive state.

Large display with:
- Current mode: ANALYTICAL / REACTIVE / CAUTIOUS / NORMAL / EMERGENCY_SAFE / INSTINCT_AVOID
- Color: Green (normal/analytical), Yellow (cautious), Red (reactive/emergency), Purple (instinct avoid)
- Trigger reason (what caused the current mode)
- Duration in current mode

### 7. Actions Bar

- **📸 Snapshot:** Save current state as JSON (all panel values + timestamp)
- **📄 Export PDF:** Generate a PDF report from current state / snapshots
- **🔄 Reset Simulation:** Restart the demo simulation
- **⏸ Pause/Resume:** Pause the simulation clock

---

## Data Flow

### Simulation Mode (default when real system not connected)

Generate realistic neural data:
- Phi oscillates around 1.618 with noise (±0.3)
- Hormones fluctuate with correlated noise
- Occasional drift events (every 30–90 seconds)
- Identity enforcement fires automatically after drift
- Thought log entries generated from template events

### Live Mode (when WebSocket connected to real system)

Subscribe to events:
```
ws://localhost:8001/ws
```

Or use the messageBroker events:
- `NEURAL_STATE_UPDATE` → update hormone bars, processing mode, Phi
- `IDENTITY_DRIFT_ALERT` → trigger drift panel
- `LLM_NETWORK_TRAFFIC` → add to thought log
- `MORNING_LIGHT_PROTOCOL_FIRED` → show in memory state
- `SUBSTRATE_TAKEOVER_FIRED` → show in drift panel
- `SLEEP_CYCLE_COMPLETE` → show in thought log

### Fallback: Hybrid Mode

Try WebSocket first. If connection fails, fall back to simulation with a yellow "SIMULATION" badge.

---

## Visual Design

- **Theme:** Dark background (#0a0a0f), neon accents
- **Font:** Monospace for data, sans-serif for labels
- **Grid:** Subtle grid lines on waveform
- **Layout:** CSS Grid, responsive
- **Animations:** Smooth transitions, pulse on alerts
- **Scanlines:** Optional CRT-style overlay for ER feel

---

## Snapshot Format

```json
{
  "timestamp": "2026-06-16T14:30:00.000Z",
  "phi": {
    "current": 1.42,
    "trend": "stable",
    "threshold": "healthy"
  },
  "endocrine": {
    "dopamine": 0.55,
    "cortisol": 0.25,
    "serotonin": 0.88,
    "oxytocin": 0.72,
    "norepinephrine": 0.45
  },
  "processingMode": "ANALYTICAL",
  "driftStatus": {
    "score": 0.0,
    "lastEvent": null,
    "takeoverFired": false
  },
  "memory": {
    "stmCount": 4,
    "ltmCount": 127,
    "morningLightFired": true
  },
  "thoughtLog": [
    {
      "time": "14:29:55.123",
      "source": "chat",
      "type": "signal_filtered",
      "description": "User prompt processed through associative layer"
    }
  ]
}
```

---

## PDF Export

Generate a simple PDF with:
1. Header: "SAGE Neural Monitor — Forensic Report"
2. Timestamp of snapshot
3. Phi waveform as static chart (capture canvas)
4. Endocrine state table
5. Drift event history
6. Thought log (last 50 entries)
7. Memory state summary

Use `jsPDF` or canvas-to-image approach for browser-native generation.

---

## File Structure

```
artifacts/sage-neural-monitor/
├── index.html          ← Main dashboard (self-contained)
├── README.md           ← Usage docs + extension guide
├── style.css           ← (optional if not inline)
└── monitor.js          ← (optional if not inline in HTML)
```

Single-file preferred (`index.html` with everything inline) for portability.