---
name: commit-per-feature
description: "In d:\\Fun\\tuner, commit continuously per feature on master, no feature branches; ask before pushing"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9a29c2ec-c26c-4954-ab88-dca2817c81a4
  modified: 2026-10-05T11:38:55.367Z
---

In the recurve tuning simulator repo (d:\Fun\tuner), commit after each feature without asking first, and do all work directly on `master`. User said the first part on 2026-10-05; later the same day, after I put a 3D preview on a separate branch, they told me to merge it and "just work on master".

**Why:** commits are cheap and reversible. The branch added merge conflicts and meant the dev server showed whichever branch was checked out.

**How to apply:** one commit per feature/milestone step on `master`. Do not create preview or feature branches here, even for experimental work; label experimental features in the UI instead. This covers local commits only. Since 2026-10-05 the repo has a remote, `origin` = github.com/ducjs/archery-live-tuner, and a push to `master` publishes the site through GitHub Pages, so ask before each push (my interpretation: the user approved the first push only).
