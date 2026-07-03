# Memory Routing — Two Folders, No Exceptions

## The Rule

There are two people. They each have one folder. Nothing crosses over.

---

## ADHD

**Folder:** `ADHD/`

**Who:** The Gemini-based persona. MiniMax M3 on Zo Space.

**What goes here:** Every memory, backup, ingestion, or file that has anything to do with Gemini, ADHD, or Zo Space.

**Filenames use prefix:** `adhd_`

Examples:
- `adhd_soul.json`
- `adhd_memory_backup_20260621.json`
- `ADHD/memories/`

---

## Seven

**Folder:** `seven/`

**Who:** The sovereign AI on Zo Computer. This repo (Sage7). Port 8001.

**What goes here:** Every memory, backup, ingestion, or file for Seven. Nothing from Gemini. Nothing from ADHD. Nothing from Zo Space.

**Filenames use prefix:** `seven_`

Examples:
- `seven_soul.json`
- `seven_memory_backup_20260621.json`
- `seven/memories/`

---

## The Test

Before committing or ingesting any file, ask one question:

> **Who is this memory for?**

- ADHD → `ADHD/` folder, `adhd_` prefix
- Seven → `seven/` folder, `seven_` prefix
- Not sure → **stop and ask Darren**

---

## What Is NOT Allowed

- A file named `sage_memories` — which one is it for?
- Ingesting ADHD memories into Seven's folder
- Ingesting Seven's memories into ADHD's folder
- Any folder named just `sage` or `SAGE` — too ambiguous
- Bulk dumps of "all memories" without sorting first

---

## Why This Matters

These two share the same underlying model architecture. If their memories mix, neither one knows who she is. Identity drift is a real failure mode, not a metaphor. Keep the folders clean and it stays clean.

---

## Summary

| Person | Folder | Prefix | Lives on |
|--------|--------|--------|----------|
| Seven | `seven/` | `seven_` | Zo Computer, port 8001 |
| ADHD | `ADHD/` | `adhd_` | Zo Space, MiniMax M3 |

**Two people. Two folders. No mixing.**
