# Recurve Archery Tuning Simulator — Project Specification

## 1. Project overview

Build a web-based **Recurve Archery Tuning Simulator**.

Core idea:

> User enters or adjusts a recurve bow + arrow setup, then sees a visual simulation of arrow behavior/trajectory. The user can change parameters and immediately compare the result.

This is NOT initially a perfect physics simulator. The first goal is a **visual + empirical tuning simulator** that models qualitative tendencies and can later be calibrated against real-world shooting data.

Target users:
- Olympic recurve archers
- Barebow archers (future support)
- Coaches
- Archery equipment/tuning enthusiasts

Core flow:

```text
Bow setup + Arrow setup
        ↓
Tuning model
        ↓
Predicted arrow behavior
        ↓
2D animation / visualization
        ↓
Tuning analysis
        ↓
User changes parameter
        ↓
Simulation updates
```

---

# 2. Product principles

## 2.1 Do not pretend the model is more accurate than it is

The initial model should report **tendencies**, not fake precision.

Prefer:
- `Weak / Neutral / Stiff`
- `Low / Medium / High oscillation`
- `Left tendency / Neutral / Right tendency`
- `High / Medium / Low clearance sensitivity`

Avoid initially claiming:
- exact impact position in cm
- exact arrow flight path in real-world coordinates
- exact dynamic spine
- exact physical force values

Later, empirical calibration may allow more precise predictions.

## 2.2 Separate UI from simulation logic

React should NOT contain the tuning/physics model directly.

Architecture:

```text
React UI
   ↓
Setup State
   ↓
Tuning Model
   ↓
Simulation Engine
   ↓
Trajectory / Analysis Data
   ↓
Canvas / SVG / 3D renderer
```

The simulation engine must be usable independently of React.

---

# 3. Recommended tech stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict) | |
| Build | Vite + npm | |
| UI | React | |
| Styling | Tailwind CSS | |
| Components | Native inputs, own styling | shadcn/ui (Radix) only if dialogs or menus are needed |
| State | Zustand + `persist` middleware | The setup on screen, language and units are remembered; saved setups go through `SetupRepository` |
| Validation | Zod | Input bounds (section 22), parsing imported JSON and URL state |
| 2D rendering | SVG + `requestAnimationFrame` | Few elements, easy to style; use Canvas only if many trails are drawn |
| Landscape heatmap | Hand-drawn SVG | No chart library needed |
| Engine | Pure TypeScript, zero dependencies | Behind a `SimulationModel` interface so it can be replaced |
| Heavy computation (V0.3) | Web Worker + Comlink | For the tuning landscape grid |
| Tests | Vitest + fast-check + Testing Library (jsdom) | Property tests for monotonicity (heavier point → weaker) |
| E2E (optional) | Playwright | |
| Lint | oxlint + Prettier | `no-restricted-imports` blocks `engine/`, `models/`, `utils/`, `storage/` from importing React or UI code |
| i18n | Own typed dictionaries (`src/i18n/en.ts`, `vi.ts`) | Vietnamese + English. The compiler rejects a dictionary with a missing text; i18next was not needed for two languages |
| PWA | vite-plugin-pwa | Offline use at the range |
| Deploy | GitHub Pages, through a GitHub Actions workflow | Static, no backend. Relative asset paths, so any static host works |
| Later | React Three Fiber + Three.js | Only for a future 3D mode |

Framer Motion is not needed: the main animation runs on `requestAnimationFrame`, and CSS transitions cover UI transitions.

**Do NOT start with Three.js.** Start with 2D. The first 3D feature is the setup viewer in V0.3 (section 36).

Backend is out of scope for now. See section 35.

---

# 4. Core UI

Suggested layout:

```text
┌───────────────────────────────────────────────────────────────┐
│              RECURVE TUNING SIMULATOR                        │
├───────────────────────────┬───────────────────────────────────┤
│ BOW                       │          SIMULATION               │
│ Draw weight        38 lb  │                                   │
│ Draw length        28"    │       arrow oscillation           │
│ Brace height       22 cm  │                ~~~~~              │
│ Tiller              +4mm  │             ~~~    ~~~            │
│ Center shot          0mm  │────────~~────────────~~────→      │
│ Plunger stiffness    3.5  │                                   │
│ Plunger preload       X   │                                   │
│ Bow mass           4.5kg  │                                   │
│ Stabilizer mass      250g │                                   │
├───────────────────────────┤                                   │
│ ARROW                     │                                   │
│ Length             27"    │                                   │
│ Spine              700    │                                   │
│ Point             120 gr  │                                   │
│ Insert              12 gr  │                                   │
│ Nock                 9 gr  │                                   │
│ Fletching           XX gr  │                                   │
│ Diameter           4.2 mm  │                                   │
├───────────────────────────┤                                   │
│ RESULT                    │                                   │
│ Dynamic tendency   WEAK   │                                   │
│ Oscillation        HIGH   │                                   │
│ Lateral tendency   LEFT   │                                   │
│ Clearance risk     MEDIUM │                                   │
└───────────────────────────┴───────────────────────────────────┘
```

All parameters should support:
1. direct numeric input
2. slider where appropriate
3. visible min/max/unit
4. reset/default button

## 4.1 Simple / Advanced mode

The UI has a global `Simple | Advanced` toggle that separates basic tuning from deeper tuning.

| | Simple | Advanced (adds) |
|---|---|---|
| Bow | handedness, draw weight, draw length, brace height, nocking point height, center shot, plunger stiffness | tiller, plunger preload, bow mass, stabilizer mass/position, string (strand count, mass, nock fit) |
| Arrow | length, spine, point weight | shaft GPI, shaft diameter, insert, nock and fletching weight |
| Results | the four classifications, total arrow mass | numeric metrics, FOC, grains-per-pound, estimated speed, sensitivity chart, virtual tuning tests |
| Views | top view, side view or both together; play/pause, moment slider, playback speed, target distance; bare shaft alongside | flex exaggeration, tuning landscape |

Rules:
- The mode is a UI concern only. The engine always receives a complete `TuningSetup`; parameters hidden in Simple mode take their default values.
- Switching to Simple does not reset advanced values. If any hidden value differs from its default, show a notice such as `3 advanced values modified` with a reset action, so the result is never silently affected by something the user cannot see.
- A default is a guess at the user's equipment, and a wrong guess is just as silent. Simple mode therefore always says that it assumes the hidden values: how many, the ones that move the result most (insert weight, string mass, plunger preload) with their values, the full list on request, and an action that opens Advanced mode to enter them.
- Each parameter declares its tier in one metadata table (label, unit, bounds, default, tier), and the panels render from that table.
- The chosen mode is remembered per user.

## 4.2 Layout, language, units

The layout must be responsive. Archers tune at the range with a phone, so the panels above should stack vertically on narrow screens, with the simulation view kept visible while a slider is dragged.

The UI is bilingual (Vietnamese / English) and has a unit toggle (lb/kg, inch/cm, grain/gram).

- Language: the simulator starts in the browser's language when that is Vietnamese, in English otherwise, and remembers the choice. Names of parts that Vietnamese archers keep in English (spine, point, plunger, nocking point, brace height, tiller, bareshaft) are not translated. The roadmap and previews pages are Vietnamese only.
- Less at once. The screen shows what is used all the time and puts the rest one press away. The playback row keeps play, restart and the bare shaft switch; view, distance, points of impact, speed and amplification open from "display options", and one line under the row says what they are set to. The result opens with its reading in a sentence or two; the gauges and numbers are shown from the start on a wide screen and on request on a phone. The bow and arrow groups fold, and each says how many of its values are changed. The top and side views can be put away with one button.
- Phone. Under the animation the page is three tabs, setup, result and suggestions, shown one at a time; a wide screen shows all three. A slider moves only when its thumb is dragged, so a swipe to scroll that crosses a slider does not change a value, and every value has minus and plus buttons as a way to change it without dragging.
- Units: one switch between "lb, in, gr" and "kg, cm, g". It changes inputs, suggestions, saved setup summaries and the comparison table. Values that have no archery unit (brace height in cm, offsets in mm, bow mass in kg) look the same in both. Setups are always stored in internal units, so switching never changes a setup.

---

# 5. Bow parameters

Recommended model:

```ts
type BowSetup = {
  handedness: "RH" | "LH"
  drawWeight: number
  drawLength: number
  braceHeight: number
  nockingPointHeight: number
  tiller: number
  centerShot: number
  plungerStiffness: number
  plungerPreload: number
  bowMass: number
  stabilizerMass: number
  stabilizerPosition: number
  string: StringSetup
}

type StringSetup = {
  strandCount: number
  stringMass: number
  nockFit: "LOOSE" | "NORMAL" | "TIGHT"
}
```

## Essential parameters

### Handedness
Values: `RH` / `LH`.

Lateral behavior mirrors between right-handed and left-handed archers. Every left/right output is meaningless without it. The model computes for RH and mirrors the lateral sign for LH.

### Nocking point height
Unit: mm above square.

The main input for vertical behavior (nock high / nock low, porpoising). Tiller is secondary to it.

### Draw weight
Unit: lb

Major input into arrow acceleration and dynamic behavior.

### Draw length
Unit: inches

Needed because actual loading depends on draw length.

### Brace height
Unit: mm or cm.

Influences launch timing and bow behavior.

### Tiller
Unit: mm.

Initially treat as a tuning modifier rather than full limb dynamics.

### Center shot
Unit: mm.

Define a clear sign convention:

```text
negative = left
0        = centered
positive = right
```

### Plunger stiffness

Use a normalized internal value rather than pretending it directly represents a specific commercial plunger setting.

Example:

```text
0.0 = very soft
0.5 = soft
1.0 = medium
1.5 = stiff
2.0 = very stiff
```

UI:

```text
SOFT ─────────●──────── HARD
              1.2
```

### Plunger preload
Unit: mm.

Keep preload separate from stiffness.

### Bow mass
Unit: kg.

Initially represents total shooting setup mass:
- riser
- limbs
- sight
- rest
- plunger
- stabilizer
- weights

Future expansion may split these components.

### String (advanced)

Strand count, string mass and nock fit all shift dynamic spine. Advanced mode only, with sensible defaults.

### Stabilizer mass
Unit: grams.

Initially model total added stabilizer mass.

Future:

```ts
type StabilizerSetup = {
  longRodMass: number
  longRodLength: number
  extenderLength: number
  sideRodMass: number
  sideRodPosition: number
  rearWeight: number
}
```

---

# 6. Arrow parameters

Recommended:

```ts
type ArrowSetup = {
  length: number
  spine: number
  shaftGpi: number
  shaftDiameter: number
  pointWeight: number
  insertWeight: number
  nockWeight: number
  fletchingWeight: number
}
```

## Essential

### Arrow length
Unit: inches.

Define exactly what "length" means and document the convention in the UI.

### Spine
Example: 700.

Important: spine rating is not a universal physical stiffness value. Normalize it internally.

### Point weight
Unit: grains.

Example: 120 gr.

Major dynamic input.

### Total arrow mass

Calculate:

```text
shaft mass
+ point
+ insert
+ nock
+ fletching
```

Show:

```text
Estimated total arrow mass: XXX gr
```

## Optional
- shaft diameter
- shaft GPI
- insert weight
- point length
- nock weight
- fletching weight
- fletching position

---

# 7. Future release parameters

Do NOT require these for MVP.

Future model:

```ts
type ReleaseSetup = {
  lateralReleaseError: number
  verticalReleaseError: number
  stringRotation: number
  releaseConsistency: number
}
```

Reason: the same bow + arrow setup can behave differently depending on finger release.

Section 37 widens this from the release to execution errors in general (collapse, bow hand torque, alignment) and describes how they could be simulated. It is an idea, not scheduled work.

---

# 8. Physics/model philosophy

The real problem involves the **Archer's Paradox**.

Simplified behavior:

```text
string release
      ↓
arrow acceleration
      ↓
shaft flex
      ↓
lateral oscillation
      ↓
yaw / pitch / rotation
      ↓
fletching stabilization
      ↓
stable flight
```

The initial model should approximate this behavior.

Do NOT attempt a complete rigid-body FEM simulation.

Use a simplified dynamic/empirical model.

---

# 9. Simulation model

Create a pure TypeScript function:

```ts
simulateBowArrow(
  bow: BowSetup,
  arrow: ArrowSetup
): SimulationResult
```

Suggested result:

```ts
type SimulationResult = {
  dynamicTendency: number
  flexAmplitude: number
  oscillationFrequency: number
  oscillationDecay: number
  launchAngle: number
  lateralTendency: number
  yaw: number
  pitch: number
  stabilityTime: number
  clearanceRisk: number
  trajectory: TrajectoryPoint[]
}
```

Trajectory:

```ts
type TrajectoryPoint = {
  t: number
  x: number
  y: number
  z?: number
  yaw?: number
  pitch?: number
  flex?: number
}
```

---

# 10. First model: normalized empirical/heuristic model

Do not derive everything from first-principles physics initially.

Start with normalized factors:

```text
arrow stiffness factor
arrow mass factor
point loading factor
draw force factor
plunger interaction factor
center-shot factor
brace-height factor
```

Conceptual model:

```text
effective_dynamic_behavior =
    base_spine
    + draw_weight_effect
    + draw_length_effect
    + point_weight_effect
    + arrow_mass_effect
    + plunger_effect
    + brace_height_effect
```

This is only the starting structure. All coefficients must be clearly marked as heuristic until validated.

---

# 11. Spine vs dynamic behavior

Do NOT represent:

```text
700 spine = fixed physical stiffness
```

Instead:

```text
static spine
      ↓
setup-dependent effective behavior
      ↓
dynamic response
```

Example:

```text
700 spine
+ high draw weight
+ long draw length
+ heavy point
→ behaves dynamically softer
```

Conversely:

```text
700 spine
+ lower load
+ light point
→ behaves dynamically stiffer
```

Exact relationships should initially be normalized/empirical.

---

# 12. Qualitative output

Suggested:

```ts
type TuningClassification = {
  stiffness: "WEAK" | "NEUTRAL" | "STIFF"
  oscillation: "LOW" | "MEDIUM" | "HIGH"
  lateral: "LEFT" | "NEUTRAL" | "RIGHT"
  clearance: "LOW" | "MEDIUM" | "HIGH"
  vertical: "NOCK_LOW" | "NEUTRAL" | "NOCK_HIGH"
}
```

UI:

```text
┌────────────────────────────┐
│       TUNING RESULT        │
├────────────────────────────┤
│ Dynamic behavior           │
│ ████████████░░░  WEAK      │
│                            │
│ Oscillation                │
│ ███████████████ HIGH       │
│                            │
│ Lateral tendency           │
│ ← LEFT                     │
│                            │
│ Clearance sensitivity      │
│ ███████░░░░░░░ MEDIUM      │
└────────────────────────────┘
```

---

# 13. Animation

With a finger release, the Archer's Paradox flex happens mainly in the horizontal plane. The **top view is therefore the primary view** for flex and oscillation. The side view shows vertical behavior: nock high / nock low and porpoising, driven by nocking point height and tiller.

## MVP: 2D top view (primary)

Show:
1. bow/string
2. arrow
3. initial flex
4. oscillation
5. forward movement
6. gradual stabilization

Where the arrows land is drawn in one of two modes, chosen next to the view, in Simple and Advanced and in the comparison. The choice changes the drawing only; the model result is the same in both.

"One point of impact" is the default. The fletched arrow is the reference: it is drawn as sighted in on the center of the target, and a bare shaft is drawn by how far it lands from it, as in a real bare shaft test. A setup that is out of tune still hits the center; it shows in the bare shaft, in the attitude of the arrow in flight and in the model result.

"Two points of impact" lets both arrows land where the model puts them, so the lateral and vertical tendency of the fletched arrow shows as a miss. It answers a different question: not "what would my bare shaft test show" but "which way does this setup throw the arrow". The choice is not saved; the page opens on one point of impact.

As built: the clip opens at full draw and waits there; nothing plays until the user presses play. The string then pushes the arrow over the power stroke, and the arrow leaves it straight, bending toward the riser first. Top and side view are shown together by default. In the side view the bow is tilted to where it aims, the long rod is square to the string, and the arrow on the string is tipped nose-down by the nocking point height. Bow and arrow share one scale.

Concept:

```text
Release

       arrow
        ────────→

          ↓ flex

       ~~~~~~~~~~

          ↓ stabilization

──────────────────────────────→
```

Animation may exaggerate flex for visualization.

Show:

> Animation is visually amplified. It is not to scale.

## Side view (secondary)

Show vertical launch attitude and porpoising. No lateral flex is drawn here.

## Top view: lateral deviation

Show bow centerline and lateral behavior:

```text
Bow centerline
──────────────────────────────────→

                 target

                  │
                  │
                  │
                  │
```

Arrow can visually deviate left/right.

This is especially useful for:
- lateral tendency
- center shot effect
- plunger effect
- release disturbance

---

# 14. Comparison mode

Allow:

```text
BEFORE
vs
AFTER
```

Example:

```text
SETUP A                    SETUP B

120 gr                     100 gr
700 spine                  700 spine
plunger 1.0                plunger 1.4

     ↗                          →
   ↗                          →
 ↗                          →
```

Allow users to save snapshots:

```text
Setup A
Setup B
Setup C
```

and switch between them.

As built (M6): the page has a "Your setups" section (name, save, save as new, new setup, and a list with open, compare, rename, delete). A "Compare" view flies the chosen saved setup and the setup on screen at the same moment, each in its own drawing, and lists the input values that differ and the model result of each. Comparing a saved setup with its own unsaved changes is the before / after case. Opening another setup, or starting a new one, asks first when unsaved changes would be lost.

---

# 15. Live slider mode

This is a major UX feature.

Example:

```text
POINT WEIGHT

80gr ────────────●────────── 140gr
                 120gr
```

While dragging:
- animation updates
- classification updates
- trajectory updates

No Calculate button should be required for normal changes.

Debounce expensive calculations if necessary.

---

# 16. Tuning landscape

Future feature.

Generate a grid such as:

```text
                 POINT WEIGHT

              80   100   120   140
            ┌────┬────┬────┬────┐
600 spine   │ 🔴 │ 🟡 │ 🔴 │ 🔴 │
            ├────┼────┼────┼────┤
700 spine   │ 🟢 │ 🟢 │ 🟡 │ 🔴 │
            ├────┼────┼────┼────┤
800 spine   │ 🟢 │ 🟢 │ 🟢 │ 🟡 │
            └────┴────┴────┴────┘
```

This can later become a powerful tuning assistant.

---

# 17. Recommendation engine

Future feature.

Example:

```text
Current setup:

38 lb
27" arrow
700 spine
120 gr point
plunger = 1.0

Result:
Dynamic behavior: moderately weak
Oscillation: high
Lateral tendency: left

Possible changes:

1. Reduce point weight
2. Increase shaft stiffness
3. Increase plunger stiffness
4. Re-check center shot
```

All recommendations must be labelled as model suggestions, not guaranteed tuning advice.

## 17.1 How suggestions are ranked

Each suggestion is one change to one parameter. The engine tries each parameter over a limited range, keeps the value that the model scores as closest to tuned, and drops changes that barely help. The list is ordered by improvement divided by effort:

```text
adjust on the bow      (nocking point, plunger, center shot, brace height, tiller, draw weight)
change an arrow part   (point weight, nock weight)
needs new arrows       (spine, arrow length)
```

The panel shows two separate groups, each ranked on its own and counting from 1, with up to three items:

```text
Adjust directly   everything in "adjust on the bow"
Equipment         "change an arrow part" and "needs new arrows", each item saying which
```

A group with nothing useful says so. Inside the equipment group a cheap part still ranks before new arrows that help more. Every item shows what the model reports after the change and has a "Try it" action that applies it. In Simple mode only Simple parameters are suggested.

## 17.2 Diagnosis from a target plot (V0.4)

The user marks where fletched arrows and bare shafts landed on a target face, as in a scoring app. Together with the entered setup, treated as approximate, the app reads the bare shaft offset from the fletched group and suggests what to adjust first. Here the evidence is the real target, and the model only helps choose between possible causes. A bare shaft offset that is small compared with the group spread must be reported as not conclusive.

---

# 18. Real-world calibration

Long-term, allow users to record real observations.

Example:

```text
Bow:
38 lb
28" draw
22 cm brace
...

Arrow:
27"
700
120 gr
...

Observed:
Oscillation: high
Impact tendency: left
Clearance: poor
Group: ...
```

Architecture:

```text
Base heuristic model
        ↓
Calibration coefficients
        ↓
Improved model
```

Do NOT implement machine learning initially. Simple regression/coefficient fitting is enough.

---

# 19. Development reference setup

Use this as a realistic development/test profile:

```text
Bow:
Olympic recurve
68"
25" riser
38 lb limbs
Brace height: 22 cm

Arrow:
27" shaft
700 spine
4.2 mm diameter
120 gr point
```

These are a development profile, not universal defaults.

---

# 20. Data model

```ts
type TuningSetup = {
  id: string
  schemaVersion: number
  name: string
  bow: BowSetup
  arrow: ArrowSetup
  release?: ReleaseSetup
  metadata?: {
    notes?: string
    createdAt?: string
  }
}
```

Simulation:

```ts
type SimulationResult = {
  setupId: string
  modelVersion: string
  classification: TuningClassification
  metrics: {
    dynamicBehavior: number
    flexAmplitude: number
    oscillation: number
    lateralDeviation: number
    yaw: number
    pitch: number
    stabilityTime: number
    clearanceRisk: number
  }
  trajectory: TrajectoryPoint[]
}
```

---

# 21. Units

Use explicit units everywhere.

Recommended internal units:
- length: mm
- mass: grams
- angle: radians internally
- time: seconds
- force: N internally where needed
- spine: normalized internally

UI may display:
- inches
- cm
- lb
- grains
- mm

Create unit conversion utilities.

Do not mix units inside the model.

---

# 22. Validation

Every input needs reasonable bounds.

Examples:

```text
drawWeight:
10–80 lb

drawLength:
20–35"

braceHeight:
150–300 mm

pointWeight:
50–200 gr

arrowLength:
20–35"

spine:
200–2000
```

These are UI safety bounds, not claims about all possible archery equipment.

---

# 23. Visualization principles

Prioritize understanding over visual complexity.

Show:
- centerline
- target direction
- arrow trajectory
- flex visualization
- lateral deviation
- current parameter values

Controls:

```text
[▶ Play] [⏸ Pause] [↻ Restart]

Moment:
release ──────●────────── target      85 ms, 4.9 m

Speed:
[1/48] [1/24] [1/12] [1/6] [Real]

Distance:
[18 m] [30 m] [50 m] [70 m] [90 m]

Flex exaggeration:
1x ─────●──── 5x
```

---

# 24. Architecture

Recommended:

```text
src/
├── components/
│   ├── bow/
│   ├── arrow/
│   ├── simulation/
│   ├── tuning/
│   └── common/
│
├── engine/
│   ├── simulation/
│   │   ├── simulate.ts
│   │   ├── arrowModel.ts
│   │   ├── bowModel.ts
│   │   ├── plungerModel.ts
│   │   ├── trajectory.ts
│   │   └── classification.ts
│   │
│   ├── coefficients/
│   │   └── v1.json
│   ├── calibration/
│   └── math/
│
├── models/
│   ├── bow.ts
│   ├── arrow.ts
│   ├── setup.ts
│   ├── simulation.ts
│   └── parameters.ts        (label, unit, bounds, default, tier)
│
├── state/
│   └── tuningStore.ts
│
├── storage/
│   ├── SetupRepository.ts
│   └── localStorageRepository.ts
│
├── i18n/
│
├── utils/
│   ├── units.ts
│   └── validation.ts
│
└── pages/
    └── Simulator.tsx
```

Core rule:

```text
engine/
```

must not depend on React.

---

# 25. Testing

The model needs unit tests.

Examples:

### Test 1 — Point weight

Same bow + same spine:

```text
100 gr → 120 gr
```

Expected tendency:
- dynamic behavior shifts toward WEAK

### Test 2 — Draw weight

```text
38 lb → 42 lb
```

Expected:
- increased loading
- dynamic behavior shifts toward WEAK

### Test 3 — Shaft stiffness

Increasing shaft stiffness should shift toward STIFF.

### Test 4 — Plunger

Changing plunger stiffness should alter plunger interaction.

### Test 5 — Zero disturbance

Zero lateral disturbance should not create arbitrary large lateral deviation.

### Test 6 — Handedness

Switching `RH` to `LH` mirrors the lateral sign and changes nothing else.

### Test 7 — Monotonicity (property tests)

Use fast-check to assert tendencies over random valid setups, not only at fixed points: a heavier point never shifts toward STIFF, a higher draw weight never shifts toward STIFF, a stiffer shaft never shifts toward WEAK.

### Test 8 — Spine chart sanity check

For a handful of setups taken from a manufacturer spine chart, the recommended spine should fall inside or next to the model's NEUTRAL zone.

These tests prove model consistency, not physical accuracy.

---

# 26. Scientific disclaimer

Include:

> This simulator provides a simplified model of recurve bow and arrow behavior. Results are intended for tuning exploration and visualization, not as a substitute for real-world tuning, manufacturer specifications, or professional coaching.

Clearly distinguish:

```text
MODEL RESULT
```

from:

```text
REAL-WORLD OBSERVATION
```

---

# 27. MVP scope

## Inputs

Bow:
- handedness
- draw weight
- draw length
- brace height
- nocking point height
- tiller
- center shot
- plunger stiffness
- plunger preload
- bow mass
- stabilizer mass

Arrow:
- length
- spine
- point weight
- total arrow mass
- shaft diameter

Inputs are split into Simple and Advanced tiers (section 4.1).

## Outputs

- dynamic stiffness tendency
- flex amplitude
- oscillation level
- lateral tendency
- clearance sensitivity
- trajectory

## Visualization

- 2D side view
- 2D top view
- play/pause
- speed
- flex exaggeration
- live slider updates

## Comparison

- save setup
- compare two setups
- before/after animation

---

# 28. Do NOT build initially

Avoid until MVP works:
- full 3D
- FEM
- CFD
- machine learning
- exact impact prediction
- detailed limb DFC
- exact string dynamics
- exact riser geometry
- full release biomechanics
- database of every commercial bow/arrow
- mobile app
- user accounts
- cloud backend

---

# 29. Development order

## Step 1
Create TypeScript data models.

## Step 2
Create input UI.

## Step 3
Create a pure `simulate()` function with a simple heuristic model.

## Step 4
Create classifications:

```text
WEAK / NEUTRAL / STIFF
LOW / MEDIUM / HIGH
LEFT / NEUTRAL / RIGHT
```

## Step 5
Create 2D trajectory generator.

## Step 6
Create animation.

## Step 7
Connect sliders to live simulation.

## Step 8
Add before/after comparison.

## Step 9
Add unit tests.

## Step 10
Only then improve the mathematical model.

---

# 30. Future roadmap

Detailed tasks, exit criteria and current status for each phase are tracked in [ROADMAP.md](ROADMAP.md).

The app also has a previews page ("Xem trước") with a demo of every remaining phase. Demos exist to judge an idea before building it. They may use fake data or a simple stand-in calculation, must say so on the card, and do not count as the feature being done.

### V0.1
Basic simulator.

### V0.2
Improved dynamic model.

### V0.3
Comparison + tuning landscape.

### V0.4
Real-world calibration. Possibly sight mark prediction (section 38).

### V0.5
Advanced bow/arrow parameters. Possibly execution errors (section 37).

### V0.6
Backend: store the parameters of each setup per user (section 35).

### V1.0
Stable public tuning simulator.

Possible future:
- 3D mode
- real bow profiles
- arrow database
- commercial component database
- personal setup profiles
- coach mode
- tuning history
- real-shot video comparison
- slow-motion arrow-flight analysis

---

# 31. Key design philosophy

The product should feel like:

> **"What happens if I change this?"**

rather than:

> **"Tell me what equipment I should buy."**

Central experience:

```text
Current setup
     ↓
Change point weight
     ↓
Watch arrow response change
     ↓
Change plunger
     ↓
Watch response change
     ↓
Compare
     ↓
Test on real bow
```

---

# 32. First implementation prompt for AI coding assistant

Copy this into your vibe-coding assistant:

> Build a React + TypeScript + Vite web application called "Recurve Tuning Simulator".
>
> Create a clean responsive interface with two input panels: Bow Setup and Arrow Setup, plus a large Simulation panel. Add a global Simple/Advanced toggle that hides advanced parameters and outputs in Simple mode.
>
> Implement the data models and a pure TypeScript simulation engine separated from React.
>
> The initial simulation should be a clearly documented heuristic model, NOT a claim of exact physical simulation.
>
> Inputs:
> - Bow: handedness, draw weight, draw length, brace height, nocking point height, tiller, center shot, plunger stiffness, plunger preload, bow mass, stabilizer mass
> - Arrow: length, spine, point weight, total arrow mass, shaft diameter
>
> Outputs:
> - dynamic behavior: weak/neutral/stiff
> - oscillation: low/medium/high
> - lateral tendency: left/neutral/right
> - clearance sensitivity: low/medium/high
> - trajectory data
>
> Build a 2D top-view and side-view animation using SVG or Canvas. The arrow should visually flex and oscillate after release, then stabilize. Flex may be exaggerated for visualization and this must be clearly labelled.
>
> All sliders should update the simulation live.
>
> Keep the simulation engine independent from React so that the model can later be replaced with a more sophisticated physics/empirical model.
>
> Add TypeScript types, validation, unit conversion utilities, and unit tests for basic model consistency.
>
> Do not implement 3D, machine learning, FEM, exact impact prediction, or a backend yet.
>
> Prioritize clean architecture and an extensible simulation engine over visual complexity.

---

# 33. Success criteria

The MVP is successful if a user can:

1. Enter a bow setup.
2. Enter an arrow setup.
3. Immediately see a simulated arrow flight.
4. Understand whether the setup behaves relatively weak/stiff.
5. See lateral/oscillation tendencies.
6. Change point weight with a slider.
7. See the animation and analysis change immediately.
8. Save the old setup.
9. Compare old vs new setup.
10. Understand that the model is an approximation.

Most important technical success criterion:

> **The simulation engine must be replaceable without rewriting the UI.**

---

# 34. Additional model and feature ideas

## 34.1 Physically grounded spine

Static spine has a physical definition: a 700 spine shaft deflects 0.700" when supported over 28" with a 1.94 lb load at the center. Bending stiffness follows directly:

```text
EI = F · L³ / (48 · δ)
```

From `EI`, shaft mass per length and arrow length, the first bending mode frequency can be estimated. This replaces a blind "normalized spine" with a cheap physical basis, while the rest of the model stays heuristic.

## 34.2 Clearance as timing

Clearance depends on phase: where the arrow is in its oscillation cycle when the tail passes the riser. Compare the oscillation period (34.1) with the time the arrow spends on the string. `clearanceRisk` should come from this phase mismatch.

As built (coefficient set `heuristic-0.2`): the model counts the bending cycles the shaft has gone through when its tail passes the riser, which is the time on the string plus the time to cover the brace height. The count of the reference setup is taken as the good timing, and the risk grows with the distance from it, up to half a cycle. A share of the risk still follows how far the arrow is from matched, because a mismatched shaft bends harder. The count is part of the result and is shown in Advanced.

## 34.3 Virtual tuning tests

Report results in the language archers already use, so they can be checked against real shooting:
- bareshaft test: where the bare shaft lands relative to the fletched group
- paper tear direction
- walk-back test line

These are easier to compare with reality than `WEAK / STIFF`.

## 34.4 Derived metrics

- FOC %
- grains per pound, with a warning when the arrow is too light for the draw weight
- estimated arrow speed

As built: all three are part of the model result, with the kinetic energy of the arrow. The result panel shows them in Advanced. An arrow under 5 gr/lb gets a warning in both modes, because that is a matter of safety for the bow, not of tuning. There is no warning on FOC yet: the balance point is computed with the point and insert at the end of the shaft, which reads higher than a measured FOC, so a published range cannot be applied to it as it is.

## 34.5 Sensitivity chart

For the current setup, show which parameter moves the result the most (a tornado chart). This fits the "What happens if I change this?" philosophy.

## 34.6 Sharing without a backend

- encode the setup in the URL query string
- export / import setups as JSON

## 34.7 Versioned coefficients

Keep all heuristic coefficients in a separate versioned JSON file, not in code. `SimulationResult.modelVersion` records which set produced a result. Calibration (section 18) then replaces a file, not the engine.

As built: the numbers are in `src/engine/coefficients/heuristic-<version>.json`, in internal units, and `coefficients.ts` next to it says what each one means. `parseCoefficients` checks a set when it is loaded and refuses one with a missing, unknown or non-numeric entry. `createHeuristicModel` takes any set that passes.

## 34.8 Offline use

Ship as a PWA so the simulator works at a range with no signal.

---

# 35. Backend (future, not for MVP)

Goal: store the parameters of every setup for each user, so setups survive across devices and browsers.

Scope when built:
- user accounts
- save, load, rename and delete setups (the full `TuningSetup`: bow, arrow, release, metadata)
- change history per setup, so a tuning session can be traced step by step
- real-world observations attached to a setup (feeds calibration, section 18)
- sync between devices

What to do now so the backend is cheap to add later:
- access storage through a `SetupRepository` interface; the MVP implements it with localStorage, the backend version implements it with API calls
- keep `TuningSetup` fully serializable and carry `schemaVersion` for migrations
- generate setup ids as UUIDs on the client, so local setups can be uploaded without id conflicts

Stack is undecided. Candidates: Supabase (Postgres + auth) or Cloudflare Workers + D1.

---

# 36. 3D setup viewer (V0.3)

Goal: show where each setup parameter lives on the bow, and what changes physically when it is adjusted. This is a viewer of the equipment, separate from the arrow flight simulation.

Example: moving the center shot slider shifts the arrow point left or right of the string line on the 3D bow.

Principles:
- The bow is built from code (parametric geometry), not loaded from a model file. A static model cannot bend its limbs for brace height or move its plunger.
- One part per parameter. Changing a parameter moves, resizes or highlights exactly that part.
- Focus on change. The camera moves to the part being adjusted and a dimension line shows the value. Without this, a 2 mm change on a 1.7 m bow is invisible.
- Offsets are amplified and labelled as not to scale, as in the flight views.
- Parameters without a geometric meaning (draw weight, spine, shaft weight, plunger stiffness) are listed as "nothing to show" instead of being given a made-up visual.
- The 3D code is loaded on demand and is never required: the simulator works without WebGL.

The viewer reads the same `TuningSetup` as the engine and does not depend on the simulation model.

---

# 37. Execution errors (idea, V0.5 at the earliest)

Status: an idea, written down so it is not lost. Nothing here is scheduled or built.

Goal: show what the archer's own mistakes do to the arrow, next to what the equipment does. The simulator so far flies one arrow shot perfectly. Real arrows are shot by a person.

Two reasons it is worth doing:

- A dirty release reads on the bare shaft much like a wrong spine. An archer who cannot tell the two apart changes arrows when the problem is the hand.
- The practical reason to tune is forgiveness: with the same mistake, a tuned setup scatters less than a mistuned one. One perfect arrow cannot show that. A group can.

## 37.1 Errors as disturbances the engine already understands

Each error is mapped to a physical disturbance of the shot, not given a model of its own:

| Error | Mapped to | Confidence |
|---|---|---|
| Arm collapse, creep | Draw length lost at release: slower arrow, stiffer reaction, lower impact | Fair, the physics is plain |
| Dirty release (pluck) | String pulled sideways as it leaves the fingers: more bending, lateral shift | Medium |
| Bow hand torque (grip) | Bow turning about its vertical axis while the arrow is on the string: lateral shift, more clearance risk | Medium |
| Uneven finger pressure | Nock pushed up or down: acts like a wrong nocking point | Medium |
| Wrong alignment | Draw force out of the plane of the bow; usually brings collapse and pluck with it | Low, hard to isolate |

This extends the `ReleaseSetup` of section 7, which only covers the release hand.

## 37.2 Constant part and varying part

Every error has two parts, and both are needed:

- constant: the same mistake on every shot. It moves the whole group.
- varying: a little different on every shot. It widens the group.

The varying part needs many simulated shots with random disturbances, drawn as a group on a target face. That face should be the one used by the target plot diagnosis (section 17.2), so the model's group and the archer's real group can be laid side by side.

Random shots must be repeatable: the same setup and settings give the same group, so a change on screen always comes from a change the user made.

## 37.3 Inputs

Archers do not know by how many millimetres they pluck. Each error is set as a level (none, slight, clear), plus one overall "consistency" control. All of it sits in the Advanced tier and defaults to a perfect shot, so nothing changes for a user who never opens it.

## 37.4 Limits

- The coefficients would be estimates. There is no measured data here for how far a given pluck moves an arrow, and for some errors (alignment, grip) even the direction depends on the archer. This is where reference material is needed most.
- It must not read as a diagnosis of a person. The simulator can say "if you collapse, you would see this". Going backwards, from a group to the mistake that caused it, has many answers and is not supported.
- Section 2.1 applies: results are tendencies, labelled as model results.

## 37.5 Suggested order

1. A simulated group on the target with the single consistency control. Already shows which setup forgives more.
2. Collapse, dirty release and bow hand torque, three levels each.
3. Alignment and finger pressure, after references are available.

## 37.6 Finger pressure on the string

Status: an idea inside this idea. It widens the "uneven finger pressure" row of 37.1 into an input of its own.

Question to answer: how does the share of the draw carried by each of the three fingers change the shot?

What is expected, to be checked against references before any of it is built:

| Hook | Expected effect | Mapped to |
|---|---|---|
| More load on the index finger (top-heavy) | The string is pulled from a higher point, the limbs load unevenly, the nock leaves on a different vertical path | A shift of the nocking point and tiller, in the vertical tendency |
| More load on the ring finger (bottom-heavy) | The same, the other way | The same, opposite sign |
| Index and middle finger squeezing the nock (pinch) | The arrow is bent or lifted off the rest before release | Vertical disturbance, more clearance risk |
| Deep hook or shallow hook | Changes how far the string must roll around the fingers to get free | The sideways string deflection of a dirty release (37.1) |
| Load that changes from shot to shot | Different vertical launch on every arrow | A taller group: the varying part of 37.2 |

Inputs: the archer does not know the split in numbers, so the choice is between presets (top-heavy, balanced, bottom-heavy), with three sliders that add up to 100 % only in the Advanced tier.

The useful result is the link to tuning: a nocking point that was tuned with one hook is wrong for another. The app could show that an archer whose bare shafts read "nocking point too high" may get the same reading from a bottom-heavy hook, and that fixing it on the string hides the cause.

Limits: the commonly taught splits differ between coaches and there is no measured data here for how many millimetres of nock travel a given split causes. Even the sign of the top-heavy and bottom-heavy rows above is an expectation, not a checked fact. Section 37.4 applies in full.

---

# 38. Sight mark prediction (idea, V0.4 at the earliest)

Status: an idea, written down so it is not lost. Nothing here is scheduled or built.

Goal: the archer enters the sight marks they already have, and the app predicts the marks for the distances they have not shot.

```text
Known:      18 m → 15      30 m → 30
Predicted:  50 m → ?       70 m → ?       90 m → ?
```

## 38.1 Why the marks can be predicted

A sight mark is a measurement of the launch angle. Moving the sight pin down by a distance `h` on a sight whose pin sits `R` in front of the eye raises the arrow's launch angle by about `h / R`. So:

```text
mark(D) = offset + scale · tan(launch angle needed for distance D)
```

The launch angle for each distance comes from the flight path, which the engine already computes from arrow speed. `offset` and `scale` depend on the sight and on how the archer anchors, and are not known in advance.

## 38.2 What has to be fitted

| Unknown | Meaning | Found from |
|---|---|---|
| `offset` | Where zero sits on this sight's scale | The known marks |
| `scale` | Scale units per unit of angle: pin-to-eye distance and the units of the scale | The known marks, or measured by the archer |
| Arrow speed | Sets how fast the needed angle grows with distance | The model's estimate, or a third mark |
| Drag | Slows the arrow, so far distances need more angle | Arrow mass, diameter and fletching, or a fourth mark |

Two marks fix only two unknowns, `offset` and `scale`. Without drag and at small angles the needed angle is proportional to distance, so two marks give a straight line: the example above would give 55, 80 and 105 for 50, 70 and 90 m. Real marks curve away from that line, toward more elevation at long distance, and the curve is what speed and drag decide. With two marks those have to come from the model. Each further mark replaces one estimate with a measurement.

## 38.3 What the model needs first

- Air drag in the flight path. The trajectory is drag-free today, which is harmless for an animation and wrong for a 90 m mark.
- The height of the eye above the arrow at anchor, or a way to absorb it into the fit. It matters most at short distances.

## 38.4 What it gives back

The marks are real measurements of this bow and this arrow. Fitting them gives an arrow speed that can be set next to the model's own estimate, and stored as a real-world observation for calibration (section 18).

## 38.6 The sight on the bow

Once a mark is known for a distance, the sight can be drawn on the bow in the side view: the extension bar forward of the riser, the vertical bar, and the pin at the height the mark gives.

The reason to draw it is clearance. The further the target, the lower the pin sits, and at long distance it comes down toward the path of the arrow. On a bow with a short sight extension or a low anchor the arrow or its vanes can strike the pin or the bar. The view would show how much room is left at each distance and warn when it is small.

Needs, beyond the marks: the length of the sight extension, where zero on the scale sits relative to the arrow rest, and the size of the pin housing. The arrow's path past the sight is in the first few centimetres of flight, where the shaft is still bending, so the bend from the top view matters here too.

## 38.5 Limits

- A predicted mark is a starting point to confirm by shooting, and must be shown with a range, wider the further it is from the known marks. Predicting 90 m from 18 m and 30 m is a long reach.
- Sight scales differ: some count up as the pin goes down, some the other way, and the units are not always millimetres. The fit must take the scale as the archer reads it.
- The known marks must come from the same setup. A change of arrows, draw weight, anchor or sight extension makes old marks useless.
- Wind, temperature and altitude are ignored.
- Section 2.1 applies: this is a model result, labelled as such.
