---
name: hosting-plan
description: "d:\Fun\tuner: owner plans a private GitHub repo and Cloudflare Pages hosting instead of GitHub Pages"
metadata:
  type: project
---

On 2026-10-06 the owner said they want the GitHub repo (ducjs/archery-live-tuner) set to private and will later deploy the site on Cloudflare Pages. At that date the site still deployed to GitHub Pages through `.github/workflows/deploy.yml` on every push to `master`, and the switch was listed as a pinned owner task in `readme/ROADMAP.md`.

**Why:** the owner does not want the source public. On a free GitHub plan a private repo stops GitHub Pages, so the site is down between the switch and the first Cloudflare deploy (my reading of GitHub's plans, not checked on the account).

**How to apply:** do not change the repo visibility or remove the Pages deploy job unless the owner asks; check the pinned list for whether the move has happened. Once it has, the workflow should only lint, test and build. Cloudflare Pages settings: build command `npm run build`, output directory `dist`. See [[commit-per-feature]] for the push rule.
