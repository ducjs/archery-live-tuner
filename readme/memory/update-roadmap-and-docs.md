---
name: update-roadmap-and-docs
description: "In d:\\Fun\\tuner, every piece of work must also update the roadmap (md + React page) and related md files"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9a29c2ec-c26c-4954-ab88-dca2817c81a4
  modified: 2026-10-05T11:38:52.113Z
---

In the recurve tuning simulator repo (d:\Fun\tuner), every time work is done, update the roadmap in both places and any related markdown files, in the same piece of work. User asked for this to be remembered on 2026-10-05.

The places (the project's md files were moved into `readme/` on 2026-10-05, at the user's request):
- `readme/ROADMAP.md` (source of truth: tick items, add new ones, update the status table)
- `src/pages/roadmap/roadmapData.ts` (Vietnamese roadmap page in the app; must mirror ROADMAP.md item for item, and `roadmapData.test.ts` fails if they differ)
- related md files: `readme/recurve-tuning-simulator-spec.md` when behavior or scope changes, `README.md` at the repo root when user-visible features or commands change

**Why:** the user tracks progress through the roadmap and reads the Vietnamese page; earlier in the session they had to ask separately for the md files to be updated after features landed.

**How to apply:** treat the doc updates as part of the feature, in the same commit, not a follow-up. Applies to features, scope changes and new ideas added to the plan. New project md files go in `readme/`. See [[commit-per-feature]] and [[mirror-memory-into-repo]].
