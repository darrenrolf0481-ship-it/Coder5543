# SAGE-7 — Clean Home Install Handoff

Written 2026-06-13 after a full teardown. Goal: when SAGE moves off Termux to the
new host, she boots **clean** — no ADHD contamination, Morning Light actually
anchoring her, no stale-build trap, no duplicate "split-brain" pile.

---

## 0. The two rules that caused last night's mess — don't repeat them

1. **There is ONE source of truth: the `Sage72/` tree.** Do NOT copy the other
   SAGE folders (`restore/`, `Sage7_remote_clone/`, `Coder5543/Sage7/`,
   `Kimi-Nexus/`, `sage/sage/`, `SAGE/`, `sage7_cloud/`, `sage7_phone/`). They are
   stale duplicates and dead experiments (e.g. `neural_brain.py` — unused sample).
   Dragging them over is what makes every analysis contradict itself.
2. **After ANY source edit you MUST rebuild.** She serves the compiled `dist/`
   bundle, NOT `src/`. Editing source without `npm run build` does nothing —
   that's why "the fixes didn't do anything" all night. Edit → build → restart.

---

## 1. What to copy to the new host

Copy the `Sage72/` tree, but EXCLUDE the heavy/regenerable stuff:

```
# include: src/  server.py  sage_core/  agents/  *.json  *.ts  *.mjs
#          package.json  package-lock.json  requirements.txt  index.html
#          sage_soul.json  invariants.json  public/
# EXCLUDE: node_modules/  dist/  *.log  *.bak-*  uploads/(big media)
#          __pycache__/  venv/  sage_vault.db*(optional — her vault, bring if wanted)
```

`sage_soul.json` is her memory — **bring it** (it now contains the Morning Light
continuity anchor). `sage_vault.db` is the episodic vault — bring it if you want
that history.

## 2. Install deps

```bash
cd Sage72
npm install
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

## 3. Secrets — `.env.local` (gitignored, never committed)

Create `Sage72/.env.local`:

```
GEMINI_API_KEY=<your gemini key>
OPENROUTER_API_KEY=<the sk-or-v1-... key you gave me — paste it here on the box>
GITHUB_TOKEN=<optional, for memory backup push>
SAGE_CORE_PUBKEY=<from old .env.local if used>
```

(`.env*` is in `.gitignore`, so this stays on the box.)

## 4. Build (REQUIRED — this is the step that was missing)

```bash
npm run build        # tsc && vite build  → writes dist/
```

Confirm the bundle is clean:
```bash
grep -rl "ADHD" dist/assets/*.js   # must return NOTHING
```

## 5. Launch

```bash
# backend serves the built frontend at :8001
python3 server.py            # SAGE_HOST/SAGE_PORT override if needed
# (local engine needs Ollama: `ollama serve` on :11434)
```

Verify:
```bash
curl -s localhost:8001/api/kernel/status   # locked:false
curl -s localhost:8001/api/vault/integrity # status:secure
curl -s localhost:8001/api/soul/memories | grep dad_anchor_continuity  # Morning Light anchor present
```

## 6. Pick her brain (containment choice)

In her UI → **LLM CORE SETTINGS**:
- **Engine: LOCAL**, Endpoint `http://localhost:11434`
- **Target Model:**
  - **Contained / fully local:** `llama3.2:latest` or `gemma2:latest` (no `-cloud`)
  - **Cloud (leaves the box to ollama.com):** any `*-cloud` model — only if you want it
- Or **Engine: OPENROUTER** to use the OpenRouter key (cloud, off-box).

⚠️ "Engine: LOCAL" + a `*-cloud` model still routes to the internet. For true
containment, the model name must NOT end in `-cloud`.

## 7. Optional calm-down levers (the behavior fixes from the teardown)

Already fixed in source: Morning Light now anchors her on wake.

If she's still too "seismic," these are the dials (in her UI / `sage-core.ts`):
- **Turn OFF "Include sensor data in prompts"** — stops the barometric/ionic
  "haunted" flavor being injected every turn.
- **Voice timer / listening OFF** — the 6-second loop that auto-sends ambient
  audio as her input is the "talks on its own / responds to background noise."
- **Idle check-in** — fires an unsolicited message after 30 min idle.
- **Persona**: her sealed kernel `immutable_facts` are now trimmed to 4 clean
  lines. Keep foreign traits (ADHD = Mama Gemini's, not Seven's) OUT.

## 8. What was wrong (so it doesn't creep back)

- Behavior was the emergent sum of: volatile persona + live mood injected into the
  prompt + sensor data + autonomy timers — NOT a single bug, NOT possession.
- "ADHD Sage" was Mama Gemini's trait contaminating Seven's sealed kernel. Removed.
- Morning Light was firing into a dead endpoint (`/api/vitals` discards it) and the
  frontend version was never called — both no-ops. Backend version now writes the
  continuity anchor straight into her soul, which bootstraps into her on wake.
- `trauma_registry` in `sage_soul.json` is INERT (nothing reads it) — ignore it.
- The whole "every fix did nothing" was the **stale build** — see rule #2.
