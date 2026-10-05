# Recurve Tuning Simulator — Roadmap

Phase tracker for the project. The specification lives in [recurve-tuning-simulator-spec.md](recurve-tuning-simulator-spec.md); section numbers below (§) refer to it.

How to use this file:
- tick a box when the item is merged and working
- update the status table when a phase starts or finishes
- a phase is done only when its exit criteria are met, not when all boxes are ticked

## Status

| Phase | Theme | Status |
|---|---|---|
| V0.1 | Basic simulator (MVP) | In progress (M1, M2 done; M3 next) |
| V0.2 | Improved dynamic model | Not started |
| V0.3 | Landscape, sensitivity, sharing | Not started |
| V0.4 | Real-world calibration | Not started |
| V0.5 | Advanced parameters and recommendations | Not started |
| V0.6 | Backend: setup storage | Not started |
| V1.0 | Stable public release | Not started |

**Current phase:** V0.1

---

## V0.1 — Basic simulator (MVP)

Goal: a user enters a setup, sees the arrow fly, changes a slider and sees the result change. Heuristic model only.

### M1. Project scaffold
- [x] Vite + React + TypeScript (strict) + npm
- [x] Tailwind CSS
- [ ] shadcn/ui (deferred to M4, when the first components are needed)
- [x] Vitest + fast-check
- [x] oxlint + Prettier, with `no-restricted-imports` so `engine/`, `models/`, `utils/` cannot import React or UI code
- [ ] Folder structure from §24 (folders appear as their first files are written)

### M2. Data models and utilities
- [x] `BowSetup`, `ArrowSetup`, `TuningSetup`, `SimulationResult` types (§5, §6, §20)
- [x] Parameter metadata table: label, unit, bounds, default, tier (§4.1)
- [x] Unit conversion utilities (§21)
- [x] Zod validation with bounds (§22), generated from the parameter table
- [x] Development reference setup as default profile (§19)

### M3. Engine v0
- [ ] `SimulationModel` interface
- [ ] Heuristic model with normalized factors (§10), coefficients marked as heuristic
- [ ] Handedness mirroring
- [ ] Classification: stiffness, oscillation, lateral, clearance (§12)
- [ ] Trajectory generator (§9)
- [ ] Consistency tests 1–7 (§25)

### M4. Input UI
- [ ] Bow and Arrow panels rendered from the parameter metadata
- [ ] Numeric input + slider + unit + reset per parameter
- [ ] Simple / Advanced toggle, with "advanced values modified" notice (§4.1)
- [ ] Zustand store
- [ ] Estimated total arrow mass

### M5. Visualization
- [ ] Top view: bow, string, arrow flex, oscillation, stabilization (§13)
- [ ] Side view: vertical attitude (Advanced)
- [ ] Play / pause / restart, speed, flex exaggeration (§23)
- [ ] "Not to scale" label
- [ ] Result panel (§12)
- [ ] Live update while dragging sliders (§15)

### M6. Snapshots and comparison
- [ ] `SetupRepository` interface + localStorage implementation (§35)
- [ ] Save / load / rename / delete setups
- [ ] Compare two setups, before/after animation (§14)

### M7. Release
- [ ] Responsive layout for phone (§4.2)
- [ ] i18n: Vietnamese + English
- [ ] Unit toggle
- [ ] Scientific disclaimer (§26)
- [ ] Deploy to static hosting

**Exit criteria:** all ten points of §33 pass, and the engine runs in tests without React.

---

## V0.2 — Improved dynamic model

Goal: replace the blind heuristic core with a cheap physical basis. UI changes are minimal.

- [ ] Coefficients moved to versioned JSON, `modelVersion` in results (§34.7)
- [ ] Bending stiffness `EI` from static spine (§34.1)
- [ ] First bending mode frequency from `EI`, mass and length
- [ ] Clearance from oscillation phase vs time on string (§34.2)
- [ ] String parameters feed the model (§5)
- [ ] Derived metrics: FOC, grains per pound with warning, estimated speed (§34.4)
- [ ] Virtual tuning tests: bareshaft, paper tear, walk-back (§34.3)
- [ ] Spine chart sanity test (§25 Test 8)

**Exit criteria:** the new model sits behind the same `SimulationModel` interface with no UI rewrite, all §25 tests pass, and the NEUTRAL zone agrees with a manufacturer spine chart for the reference setups.

---

## V0.3 — Landscape, sensitivity, sharing

Goal: explore many setups at once, and pass a setup to someone else.

- [ ] Tuning landscape grid, e.g. spine × point weight (§16)
- [ ] Grid computed in a Web Worker
- [ ] Sensitivity (tornado) chart for the current setup (§34.5)
- [ ] Setup encoded in URL (§34.6)
- [ ] Export / import setups as JSON
- [ ] Compare more than two snapshots
- [ ] PWA, works offline (§34.8)

**Exit criteria:** the landscape renders without blocking slider interaction, and a shared URL reproduces the exact same result on another device.

---

## V0.4 — Real-world calibration

Goal: users record what really happened, and the model adjusts to it.

- [ ] Observation form attached to a setup: oscillation, impact tendency, clearance, bareshaft result (§18)
- [ ] MODEL RESULT vs REAL-WORLD OBSERVATION shown side by side (§26)
- [ ] Coefficient fitting by simple regression, no machine learning
- [ ] Personal calibrated coefficient set, switchable with the base set
- [ ] Export observations

**Exit criteria:** after a user logs observations for several setups, the calibrated model matches those observations better than the base model, and the user can always switch back to the base model.

---

## V0.5 — Advanced parameters and recommendations

Goal: cover more equipment detail and suggest what to try next.

- [ ] Stabilizer breakdown: long rod, side rods, extender, weights (§5)
- [ ] Release parameters (§7)
- [ ] Barebow support (§1)
- [ ] Extra arrow detail: point length, fletching position (§6)
- [ ] Recommendation engine, labelled as model suggestions (§17)

**Exit criteria:** every new parameter is in the Advanced tier with a default, Simple mode is unchanged, and each recommendation is one the landscape shows as an improvement.

---

## V0.6 — Backend: setup storage

Goal: store the parameters of every setup per user, across devices (§35).

- [ ] Choose stack (candidates: Supabase, Cloudflare Workers + D1)
- [ ] User accounts
- [ ] API-backed `SetupRepository`
- [ ] Upload existing local setups on first sign-in
- [ ] Change history per setup
- [ ] Observations stored with the setup
- [ ] Sync between devices
- [ ] App still works signed out, on localStorage

**Exit criteria:** a setup saved on one device appears on another, local setups are not lost on sign-in, and the signed-out experience is identical to V0.5.

---

## V1.0 — Stable public release

- [ ] Accessibility pass (keyboard, screen reader, contrast)
- [ ] Performance pass on low-end phones
- [ ] Playwright end-to-end tests for the core flow
- [ ] User guide and model explanation page
- [ ] Privacy policy (needed once accounts exist)
- [ ] Feedback channel

**Exit criteria:** no known blocking bugs, and the model limitations are documented where users will read them.

---

## After V1.0

Not scheduled (§30):
- 3D mode
- real bow profiles, arrow database, commercial component database
- coach mode
- tuning history
- real-shot video comparison, slow-motion arrow-flight analysis
