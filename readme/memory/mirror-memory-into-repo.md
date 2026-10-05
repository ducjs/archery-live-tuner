---
name: mirror-memory-into-repo
description: "In d:\\Fun\\tuner, every auto-memory change is copied into readme/memory/ in the repo and committed"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9a29c2ec-c26c-4954-ab88-dca2817c81a4
  modified: 2026-10-05T11:38:47.940Z
---

In the recurve tuning simulator repo (d:\Fun\tuner), the auto-memory files are kept in the repo too, under `readme/memory/` (same file names, including `MEMORY.md`). Whenever a memory is added, changed or deleted here, make the same change there and commit it. User asked for this on 2026-10-05, in the same message that moved the project's md files into `readme/`.

**Why:** the user wants the working rules versioned with the project and readable on GitHub, not only on this machine (the second half is my interpretation).

**How to apply:** after writing to this memory directory, copy the changed files to `d:\Fun\tuner\readme\memory\` and commit on `master`, see [[commit-per-feature]]. The copy flows one way, from here into the repo; if the repo copy has been edited by hand, ask before overwriting it. The repo is on GitHub, so keep secrets and personal details out of memories. Project docs live next to it, see [[update-roadmap-and-docs]].
