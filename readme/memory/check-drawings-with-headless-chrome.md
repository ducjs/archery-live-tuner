---
name: check-drawings-with-headless-chrome
description: "In the recurve tuning simulator repo, look at SVG views before reporting a visual change, by rendering frames to a PNG with headless Chrome"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4c1b945c-437d-4609-a2e0-e558c6a3789c
  modified: 2026-10-05T16:55:00.290Z
---

In the recurve tuning simulator repo, a change to the flight views (top view, side view) has to be looked at before it is reported as done. On 2026-10-05 three rounds of drawing fixes were made from numbers alone, and each time the user sent a screenshot showing something still looked wrong (arrow too big for the bow, long rod pointing down, static limbs at full draw).

**Why:** tests pass on drawings that look wrong. The user judges these views by eye.

**How to apply:** no browser tool is needed. Write a temporary jsdom test that renders `FlightView` at the moments of interest, collects the `svg[role="img"]` markup into one HTML file with a small inline stylesheet for the color classes (`.stroke-ink`, `.fill-accent`, ...), then screenshot it with `"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --screenshot=<png> --window-size=<w>,<h> --user-data-dir=<temp dir> file:///<html>` and Read the PNG. Edge headless wrote no file on this machine; Chrome did. Delete the temporary test afterwards. Applies with [[ui-skills]].
