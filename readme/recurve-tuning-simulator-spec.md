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

> Replaced by §40: three levels in place of two, and they govern the whole app. What follows is kept for the reasons behind the rules, which still hold.

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
- Phone (replaced by §40.3: the workspaces are a bar at the foot of the screen). Under the animation the page was three tabs, setup, result and suggestions, shown one at a time; a wide screen shows all three. A slider moves only when its thumb is dragged, so a swipe to scroll that crosses a slider does not change a value, and every value has minus and plus buttons as a way to change it without dragging.
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

### Bow size
Riser: `H23`, `H25` or `H27`, the length of the riser in inches. Limbs: `66`, `68` or `70`, as limbs are marked, which is the length of the bow they make on a 25 in riser (short, medium, long).

```text
bow length = limbs + (riser − 25)        H25 + 68 = 68 in, H23 + 68 = 66 in, H27 + 70 = 72 in
```

Both are Simple values and have a section of their own, "Bow size", above everything else: the rest is set on a bow of this size. The bow length sets the brace height range that Easton recommends, 8 1/4 to 9 1/2 in for 68 in and 1/8 in more per inch of bow, and with it what counts as a low brace height for clearance. The result says when the brace height entered is outside that range. Bow size does not move weak and stiff: there is no source here for how much it would.

### Limb alignment
Unit: mm, one value per limb: how far the limb tip sits to the side of the riser's centerline. Negative is left, positive is right, as for center shot. Default 0. Advanced.

When both tips sit to one side, the string sits there too, while the rest stays on the riser. The arrow turns about its nock and its point ends up on the other side of the string line, by the limb error times arrow length over brace height (about three times). The model takes that as center shot, and the result says how much it adds. When the tips sit apart, the string plane is twisted: the model adds oscillation and clearance risk, but no left or right, since the direction is not known. In reality this is a fault to remove, not a value to tune; it is in the simulator to show what it does.

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

Since V0.3 up to three saved setups can stand next to the one on screen. They are ticked in a list above the playback controls; one always stays chosen. Each gets a drawing, and the tables get a column per setup, headed by the setup's name once there is more than one saved setup in the comparison. A value of the setup on screen is set in bold where it differs from any of the others. "Compare" on a saved setup starts a comparison with that one alone.

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

As built: "Show: Explore" in the simulator puts the landscape in place of the animation, with the sensitivity chart of §34.5 under it. Rows are the spine sizes from 400 to 1000 in steps of 50, columns the point weights from 80 to 140 gr in steps of 10, and everything else is the setup on screen. A cell is colored from weak to stiff by dynamic behavior and carries a letter, so color is not the only sign. Pressing a cell puts its spine and point weight into the setup; the cell of the setup on screen is outlined. Both views are computed in a Web Worker: the previous ones stay on screen until the new ones arrive, and an answer to an older setup is dropped.

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

Each suggestion is one change to one parameter. The engine tries each parameter over a limited range, keeps the value that the model scores as closest to tuned, and drops changes that barely help. The list follows the order the tuning guides work in (the Easton guide and Total Archery, see tuning-references.md): a change of an earlier stage that helps comes before any change of a later one, and within a stage the larger improvement comes first.

```text
1 set-up        center shot, only back toward where it was set
2 up and down   nocking point, tiller
3 plunger       stiffness, preload
4 point         point weight, nock weight
5 draw weight
6 brace height
7 new shaft     spine, arrow length
```

Center shot is not a tuning adjustment on a recurve: the guides set it once and tune with the plunger tension. It is suggested only when it has been moved, and only back.

"The whole session", under the suggestions, lays the same suggestions out as one sequence: the first suggestion, then the first suggestion for the setup that leaves, and so on, until the model reads the setup as tuned or has nothing left to offer, seven steps at most. Each value is changed once. Without that rule the plan would keep turning the plunger to make up for a wrong shaft; with it, an adjustment is taken as far as one suggestion goes and the next one in the order above takes over. Each step shows what the model reports differently after it, counted from the step before. The plan says whether the setup ends up tuned, and when it does not, that a larger change is needed, most likely another shaft. "Try all of them" sets every value of the plan at once. A plan of a single step is not shown, as the suggestions already say it.

A setup counts as tuned when all five ratings are neutral or low and the bare shaft lands with the fletched arrows, or a little low, or a little to the stiff side. The Easton guide describes that as common on a well tuned bow. The same distance to the weak side or above the group does not count.

The panel shows two separate groups, each ranked on its own and counting from 1, with up to three items:

```text
Adjust directly   everything in "adjust on the bow"
Equipment         "change an arrow part" and "needs new arrows", each item saying which
```

A group with nothing useful says so. Inside the equipment group a change of point or nock comes before new arrows that help more. Every item shows what the model reports after the change and has a "Try it" action that applies it. In Simple mode only Simple parameters are suggested.

## 17.2 Diagnosis from a target plot (V0.4)

The user marks where fletched arrows and bare shafts landed on a target face, as in a scoring app. Together with the entered setup, treated as approximate, the app reads the bare shaft offset from the fletched group and suggests what to adjust first. Here the evidence is the real target, and the model only helps choose between possible causes. A bare shaft offset that is small compared with the group spread must be reported as not conclusive.

As built: "Show: Target" in the simulator. The archer picks the distance and the face, taps where each arrow landed, and switches between fletched arrow and bare shaft; ends are added up and the last arrow can be taken back. The target is kept in the browser while it is being marked. Without a pointer, the face takes the keyboard focus: the arrow keys move a cursor over it, a fortieth of the face at a time or a fifth of that with Shift, Enter or Space marks an arrow under it, and where the cursor is gets read out.

The reading needs 3 fletched arrows and 1 bare shaft. It gives the offset of the bare shafts from the fletched group in cm and as a clock direction, and the spread of the group. It concludes nothing when the offset is under three quarters of the spread, or under what a bare shaft strays on its own (15 mm at 18 m, growing with the distance).

The diagnosis lists what to try in the order of the tuning guides, and uses the setup as entered to choose between causes:

```text
center shot    only when it was moved to the side that sends a bare shaft where it landed; then first
nocking point  when the bare shafts are high or low
plunger        the first adjustment sideways; left out when it has no travel left that way
point, then draw weight   past the reach of the plunger (7.6 cm at 30 m), or when the plunger is spent
shaft          past 15 cm at 18 m
```

Both limits scale with the distance, which is an assumption. The panel also says whether the model reads the entered setup the way the target shows it; when it does not, it points to the release or a value that is not as entered. Everything in this panel is labelled as coming from the archer's arrows, not from the model. The target can be saved as a real-world observation (§18).

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

As built (observations): under "Show: Target", below the reading of the target. An observation is any of six things, each optional: how the arrow behaves (weak, matched, stiff), where the bare shaft lands sideways and in height, where the fletched arrows tend to land, wobble in flight, and signs of the arrow touching the bow, with free notes. It can be noted by hand or saved from a marked target, which then travels with it. It keeps its own copy of the bow and arrow values, so it still means the same after the setup is changed or deleted.

Kept observations are listed for the setup on screen, newest first. Each sets "You saw" beside "The model says", computed for the values of that observation, marks every row as the same or different, and counts the matches. Nothing is adjusted by this: the two stay apart, as §26 asks. All observations in the browser can be written to one JSON file.

As built (fitting): "Fit the model to you", below the observations. It fits three shifts and nothing else, which a handful of observations can pin down:

```text
behavior shift           added to the stiffness mismatch: this archer's arrows shoot weaker or stiffer than the base model expects
nocking point neutral    mm added to the nocking point height the model reads as neutral
center shot neutral      mm, the center shot the model reads as neutral
```

The sensitivities (the exponents of the spine law, the gains) stay as in the base model; a few dozen observations of one archer cannot separate them.

The fit uses every observation in the browser that notes how the arrow behaves, where the bare shaft lands, or where the fletched arrows tend to land, over all setups, and needs at least three. For each thing noted it asks how far the model's own number lies outside the band that was seen (weak, matched or stiff; left, with the group or right; and so on), and searches each shift along its line for the least total, with a small pull toward zero so that nothing moves without a reason. A shift too small for any observation to show is read as none. No machine learning, and no regression in the strict sense: what was seen is a category, not a number.

The result is reported in words, with a count: of everything noted, how much the base model agrees with and how much the fitted one does. The fitted model is switched on only when it agrees with more, and one checkbox switches back to the base model at any time; "Forget the fit" removes it. While it is on, the result panel says so, and results carry the model version with `+personal` appended. The landscape and the sensitivity chart use the same model as the rest of the page.

Limits. Weak or stiff and the center shot both move a bare shaft sideways; they can be told apart only when the arrow's behavior was noted too, or when the observations cover several setups. Otherwise the pull toward zero splits the shift between them. The fit has been tested on made-up observations, generated from a model shifted by a known amount; whether it helps on real ones is the exit criterion of V0.4 and is still open.

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
Advanced bow/arrow parameters. Draw force curve (section 39). Possibly execution errors (section 37).

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

As built: the bare shaft test and the paper tear are in the result panel, shown together when the bare shaft is switched on. The paper tear is drawn as the sheet looks from the shooting line: the hole of the point, and the Y of the fletching to the side of it the tail was on. So close to the bow the fletching has not yet steered the arrow, so the tear is read from the same launch error as the bare shaft and the two always agree: a bare shaft that lands left goes with a tear to the right. Directions and meanings follow the Easton guide. When the tear is one that poor clearance also makes (high, or to the weak side) and the model rates clearance as a risk, the panel says so. Walk-back is not built: the only description found so far is from a low-trust source and contradicts the Easton guide.

## 34.4 Derived metrics

- FOC %
- grains per pound, with a warning when the arrow is too light for the draw weight
- estimated arrow speed

As built: all three are part of the model result, with the kinetic energy of the arrow. The result panel shows them in Advanced. An arrow under 5 gr/lb gets a note in both modes, because that is a matter of safety for the bow, not of tuning. An arrow under the AMO minimum for the draw weight and draw length gets a stronger warning in its place: the AMO chart for recurve bows, as printed in the Easton guide, is the published limit, and 5 gr/lb is only a rule of thumb that sits above it for most recurves. The front of center follows the AMO formula, with each part at its place: the shaft at its middle, the nock at the groove, the vanes where the archer says, the insert a little inside the end of the shaft, and the point as an even bar from the end of its shank to its tip. Advanced has three inputs for this: how far the point sticks out, how high the vanes stand, and how far from the nock they sit. Outside the 7 to 16 % that the Easton guide gives for target arrows, Advanced shows a note, not a warning: the guide calls its range a starting point. The reference arrow reads 19 %, as it carries a 120 gr point and a 12 gr insert on a 27 in shaft; the places of the parts move that by a fraction of a percent, the masses decide it.

## 34.5 Sensitivity chart

For the current setup, show which parameter moves the result the most (a tornado chart). This fits the "What happens if I change this?" philosophy.

As built: each bar is the change in dynamic behavior when a value goes up by a tenth of its allowed range (measured by stepping down when there is no room to go up). Bars to the left make the arrow weaker, to the right stiffer. Changes under 0.005 are left out, the eight largest are listed, and Simple mode lists only the values it shows.

## 34.6 Sharing without a backend

- encode the setup in the URL query string
- export / import setups as JSON

As built: both sit under "Share and back up", below the saved setups.

- Link. `?s=` followed by the setup as base64url JSON: a format version, the name, and every value by parameter key, in internal units and at full precision, so the model gives exactly the same result on the other side. A link that names fewer values still opens, with defaults for the rest, which keeps old links working when parameters are added. Opening a link does not replace the setup on screen: the app says which setup the link carries and waits for the user, because the screen may hold unsaved work. Either answer takes the setup out of the address. The opened setup gets an id of its own.
- File. One JSON file with a format name, the schema version, the date, and the list of setups: the saved ones and the one on screen. Importing also takes a bare list or a single setup. Each entry is validated; the app reports how many were added, how many were already saved value for value, and how many could not be read. An entry with the id of a saved setup but other values comes in under a new id, so importing never overwrites.
- Nothing is sent to a server in either case.

## 34.7 Versioned coefficients

Keep all heuristic coefficients in a separate versioned JSON file, not in code. `SimulationResult.modelVersion` records which set produced a result. Calibration (section 18) then replaces a file, not the engine.

As built: the numbers are in `src/engine/coefficients/heuristic-<version>.json`, in internal units, and `coefficients.ts` next to it says what each one means. `parseCoefficients` checks a set when it is loaded and refuses one with a missing, unknown or non-numeric entry. `createHeuristicModel` takes any set that passes.

## 34.8 Offline use

Ship as a PWA so the simulator works at a range with no signal.

As built: the build writes a service worker, `sw.js`, that keeps a copy of every file of the site: scripts, styles, fonts, icons, the web worker and the 3D viewer. After one visit with a connection the site opens without one. Files of the build are served from the copy, since their names carry a hash; the page itself is asked from the network first, so a new version is picked up as soon as there is a connection, and the copies of older versions are removed. A web manifest and icons let the site be installed to the home screen. The service worker is written in `pwa/offlinePlugin.ts`, without a library, and is only registered in the built site, not while developing. Saved setups were already kept in the browser, so they are there offline too.

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
- As built so far: the bow is made of code in `src/components/viewer3d/`, with positions in `bowGeometry.ts` (plain numbers, tested) and the drawing in `BowScene.tsx`. The riser follows a side profile and is in three stretches: whole below the arrow and whole again well above it, and in between a sight window, where only a bar is left of it on the bow hand's side. The window is closed below by the shelf and the arrow lies in the gap, on the string line, without touching the riser at any center shot the app accepts. The plunger goes through the bar to the shaft and the rest wire comes out of the window wall. three.js is fetched only when the viewer is opened.
- What moves, as built: the riser stretches with its size and the limb tips move out with the bow length; brace height moves the string and the limbs; tiller swings each limb about its pocket, as the limb bolts do: the upper tip one way and the lower tip as far the other way, so that the string leans against the riser while the brace height at the arrow is kept, and the two gaps differ by the tiller entered; limb alignment leans a limb to the side from its pocket, and the string and the gold string line go with it while the rest stays; plunger preload moves a collar on the plunger; point weight lengthens the point; stabilizer mass lengthens the weight on the long rod; strand count thickens the string. "At full draw" pulls the string back to the draw length with the limb tips coming back and in, the string keeping its length. The center shot label gives the value against the string as the limbs carry it. Values with nothing to draw are named under the viewer.
- Camera, as built: each value that moves a part has a view of that part, in `cameraShots.ts`. Changing one value flies the camera there and draws what is measured, with its real value on a label; only the view's own measure is labelled, so the bow is never covered in labels. Changing several values at once, as opening another setup does, leaves the camera alone. Changing the draw length also puts the bow at full draw. Five views can be picked by hand: whole bow, from the target, from above, rest and plunger, along the string. Small offsets are drawn at true scale unless the switch for drawing them six times larger is on. Without WebGL the viewer shows the flat top and side drawings and says why.
- From part to value, as built: pressing a part of the bow points the page to the value it stands for. Riser and grip go to riser size, the limbs to limb size, the limb pockets and bolts to tiller, the string to brace height, the nocking points to nocking point height, the plunger to plunger stiffness, the rest to center shot, the arrow to arrow length, the long rod to stabilizer position, V-bar and side rods to stabilizer mass. The input scrolls into view under the drawing, its slider takes the focus so the arrow keys work at once, and it is marked for two and a half seconds. If the value is an Advanced one, Advanced is shown first; on a phone the setup tab opens; a folded group unfolds. A drag that turns the bow is not a press. Parts that are a pixel or two wide when the whole bow is in view (string, limbs seen from the side, arrow, rods) answer a press within 20 mm of them, and the value a part stands for is named in a corner of the viewer while the pointer is over it. The buttons under the viewer are in two groups. "View" buttons only move the camera. "Equipment" buttons move the camera to a piece of equipment and go to its value in the same press: limbs to tiller, string to brace height, nocking point, rest to center shot, plunger to plunger stiffness, arrow to arrow length, stabilizer to its position.
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

# 38. Sight mark prediction

Status: built, as described under "As built" at the end of this section.

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

- Air drag in the flight path. Without it the trajectory is harmless for an animation and wrong for a 90 m mark. (Built: see 38.7.)
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

## 38.7 As built

Under "Show: Target", between the reading of the target and the observations. The archer enters the marks they have for any of 18, 30, 50, 70 and 90 m, as read on their own sight; a scale that counts down works as well as one that counts up. Marks are kept in the browser for each setup separately.

The flight used here has air drag: the arrow is a point that loses speed in proportion to the square of its speed, by an amount that follows from its shaft diameter and its mass. The animation flies the same path, so its flight time and launch angle include drag as well.

```text
mark(D) = offset + scale · tan(angle(D))

angle(D) = the launch angle, above the line of sight, at which the arrow
           climbs from the arrow to the eye over the distance D
```

| Marks entered | Fitted from them | Taken from the model |
|---|---|---|
| 2 | offset, scale | arrow speed, drag |
| 3 or more | offset, scale, arrow speed | drag |

The height of the eye above the arrow is an input, 11 cm unless the archer changes it. It is what lets three marks pin down the speed: without it a faster arrow and a sight further from the eye give the same marks. The speed read this way is therefore soft, and is shown as a rough reading with the range it takes when the eye height is 2 cm off. When the best speed lies at either end of what a recurve can do, the marks do not agree with each other; the model's speed is used and the panel says a mark is off.

Drag is never fitted from marks, also with four or more. Over the distances archers shoot, speed and drag bend the curve in nearly the same way, and marks read to half a millimeter cannot tell them apart.

The range of a predicted mark is the spread of predictions when each estimate is off by a plausible amount, refitting to the known marks every time: the eye height by 2 cm, the drag by half, the model's speed by 5 % (only while it is the model's), and the nearest and furthest marks read half a millimeter off in opposite directions. It is narrow between the known marks and widens away from them. All four amounts are assumptions.

The marks can be saved as a real-world observation, with the implied speed when there is one; the observation then shows it beside the model's estimate for the same values.

### The sight on the bow (38.6)

Below the marks, "Room under the sight pin". Where the pin sits is geometry and needs no marks: the pin lies on the line from the eye to the target, and the arrow leaves pointing above that line by the launch angle.

```text
pin above the arrow = eye above the arrow − reach · tan(launch angle)
reach               = draw length to the pivot point + sight extension
room                = pin above the arrow − half the pin ring − vane height − half the shaft
```

Two things are entered: how far in front of the riser the pin sits (15 cm unless changed) and the outside diameter of the pin ring (12 mm). The eye height is the one already entered for the marks. The speed is the one the marks imply when there are three or more, and the model's estimate otherwise. So `38.6`'s "where zero on the scale sits" is not needed: the pin is placed from the anchor, not from the scale.

A table gives, for each of the five distances, how far the pin is above the arrow and how much room the vanes have: clear, close (under 1 cm), none (the vanes would strike the pin, or the pin would have to sit below the arrow), or out of reach. Where there is none, the panel says what helps: a shorter extension or a lower anchor.

A checkbox draws the sight on the bow in the side view, for the distance being shown: the extension out from the riser, the bar down from it, and the pin, as a ring when clear, a gold ring when close and a filled red disc when in the way. The pin is placed against the arrow as drawn, which is tipped nose-down more than it really is, so that a pin in the way is also seen in the way.

Limits. The eye is taken to be straight above the nock. A vane is taken to stand 12 mm off the shaft, as the arrow has no vane height yet. The sideways bend of the shaft as it passes the pin is not considered, nor is the sight bar itself; only the pin.

---

# 39. Draw force curve (V0.5)

Status: built as designed (2026-10-07). The coefficients of §39.3 are still estimates; the owner's own measurement is pinned in the roadmap. The sources and what was taken from them are in tuning-references.md section 8.

Goal: show how the force on the fingers grows over the draw, what that stores in the bow, and how steeply the force is still rising at the clicker.

```text
In:   draw weight, draw length, brace height, bow length     (already entered)
      curve style, or one or two forces measured with a bow scale
Out:  the curve      stored energy      force gain per inch at the clicker
```

## 39.1 Why not from the limb model

Makers do not publish draw force curves, and a curve cannot be guessed from the core and the facing. The same limb in foam and in wood measured the same within a foot per second (tuning-references.md section 8.2). The shape follows the geometry: how much the limb is recurved, and how long the bow is for the draw. So the curve here comes from the geometry the archer has already entered, and from the archer's own bow scale where there is one. There is no limb database.

## 39.2 The curve

The curve runs from brace height, where the force is zero, to full draw, where it is the draw weight entered. With `u` the share of the power stroke drawn so far, from 0 to 1:

```text
F(u) = drawWeight · f(u)
f(u) = u + h · u(1 − u) + k · u(1 − u)(1 − 2u)
```

| Number | Meaning | Changes |
|---|---|---|
| `h`, fullness | How far the curve bulges above the straight line in mid-draw | The stored energy |
| `k`, end rise | How much steeper the two ends are than the middle | The force gain at the clicker |

The two are independent by construction. The `k` term adds as much area before mid-draw as it takes away after it, so:

```text
stored energy         = ½ · drawWeight · powerStroke · (1 + h / 3)
force gain at clicker = drawWeight / powerStroke · (1 − h + k)
```

`1 + h / 3` takes the place of the fixed `drawCurveFactor`. The standard style has `h = 0.42`, which gives the 1.14 used so far, so no result moves until the archer changes the style or enters a measurement.

A curve must rise all the way. A pair of `h` and `k` for which `f` falls anywhere between 0 and 1 is refused.

## 39.3 The estimate from geometry

Without a measurement, both numbers are estimates and are labelled as such.

Fullness comes from a choice of curve style:

| Style | `h` | Energy against a straight line |
|---|---|---|
| Straight | 0.15 | 1.05 |
| Standard | 0.42 | 1.14 |
| Full in mid-draw | 0.60 | 1.20 |

End rise comes from how the bow length fits the draw length. A 68 in bow is taken to fit a 28 in draw, and each inch of bow length fits one more inch of draw:

```text
fitDraw = 28 in + (bowLength − 68 in)
k       = 0.39 + 0.10 · (drawLength − fitDraw)        drawLength and fitDraw in inches
k is kept between 0 and 0.8
```

0.39 is what makes the reference setup gain 5% of its draw weight per inch at full draw, the usual rule for a recurve near 28 in. The 0.10 per inch is a guess at the size of a known direction: a short bow drawn long climbs more steeply at the end. Both sit in the coefficient set and are marked heuristic.

## 39.4 The measurement

An archer with a bow scale can replace the estimate. They enter the force at one or two draw lengths shorter than full draw, at the brace height of the setup:

- one point, taken about 2 in before full draw: `h` stays with the style, `k` is solved from the point
- two points, the second about 8 in before full draw: `h` and `k` are both solved. The two equations are linear in `h` and `k`

A fit that does not rise all the way is not used, and the archer is told the points do not agree with each other. The points are stored with the setup. The result says which of the two it shows: "estimated from bow size" or "from your measurement".

## 39.5 What is shown

- The curve as a chart: draw length across, force up, with the clicker at full draw. In the comparison of two setups, both curves on one chart.
- Stored energy, in joules.
- Force gain per inch at the clicker, in the unit the draw weight is shown in.
- A plain reading of the gain against the 5% per inch of a common recurve: about usual, gentler, or steeper. No verdict on the archer, and no "too much".

## 39.6 Marked draw weight

Draw weight in this app is the force on the fingers at full draw. An archer who knows only what is marked on the limbs gets a helper that estimates it:

```text
onFingers = marked · (1 + 0.05 · (drawLength − 28 in)) · (1 + bolt)       bolt from −5% to +5%
```

The marking is taken as 28 in AMO on a 25 in riser with the limb bolts in the middle. The helper fills the draw weight field; a value read from a bow scale is always better and the helper says so. The page explains how AMO draw length is measured: from the nocking point to the pivot point of the grip, plus 1.75 in.

## 39.7 Limits

- The estimated curve is a shape that is plausible for a recurve, not the curve of the archer's limbs. Only a measurement makes it theirs.
- Two shape numbers cannot draw every curve. A limb with a sharp hump is drawn with a soft one.
- The curve is static. What the arrow gets is less, by the mass of the limbs and the string that move with it, which the engine already takes off (`limbVirtualMass`, `stringMassShare`).
- The required spine is unchanged: it follows the draw weight at full draw, as before. The curve moves the arrow speed, and through it the timing of clearance.
- Limb material is not an input. It does not set the shape.
- The force gain at the clicker is shown, not judged. How it feels depends on the archer.
- The engine takes the power stroke as draw length minus brace height. If the draw length entered is AMO, that is 1.75 in longer than the real one. This section keeps the engine's power stroke so that results do not move; correcting it is a separate decision.
- Section 2.1 applies: this is a model result, labelled as such.

---

# 40. Three levels and a setup of its own (V0.1, M9)

Status: built on 2026-10-08, after the owner said to go ahead. This section replaces §4.1 and the layout rules of §4.2. Still open: the tests of the screen (§40.9), and the look on a real phone.

> **Nói đơn giản:** Màn hình đang cho thấy mọi thứ cùng lúc. Phần này chia ứng dụng thành ba mức (Cơ bản, Nâng cao, Chuyên nghiệp), mức nào thì chỉ thấy đúng thứ của mức đó, và đưa phần nhập setup ra một chỗ riêng. Ở đó thông số nằm cạnh cây cung 3D: bấm vào một bộ phận trên cung thì nhảy tới thông số của nó, kéo thanh trượt thì cung chuyển động theo, giống màn hình độ súng trong game. Cung 3D bật tắt được, và có thêm hình tên bay nhìn từ trên hoặc từ bên. Mô hình tính toán không đổi.

Goal: an archer at the Basic level sees about fifteen values in three groups, the bow they are set on, one sentence and one next step. Everything else still exists and is one level away.

## 40.1 What is wrong today

Measured on the page at 1440 px wide, in Vietnamese, in Simple mode:

- The input column is about 1700 px tall. Each value takes about 100 px: label, number field, slider, two step buttons and a hint. In Advanced mode there are 33 values.
- Name, save and share sit on top of the input column and push the values down.
- The "assuming 19 other values" block takes the room of two values, between the bow size and the bow.
- The "Show" switch mixes two kinds of thing: ways to look (flight, 3D bow) and jobs to do (compare, explore, target). The target view also holds sight marks, observations and calibration.
- There are two levels, and the level only filters the inputs. The result, the charts and the display options barely change with it.
- The "Bow" group holds draw weight, tuning adjustments, the plunger, the string and the stabilizers together.

## 40.2 Three levels

`ParameterTier` becomes `'simple' | 'advanced' | 'pro'`, shown as Basic / Advanced / Professional (Cơ bản / Nâng cao / Chuyên nghiệp). The stored value `'simple'` keeps its name so that what browsers have remembered stays valid. A level shows its own things and those of every level below it.

The level governs the whole app: inputs, the detail of the result, and which workspaces exist.

| | Basic | Advanced adds | Professional adds |
|---|---|---|---|
| Bow | riser, limbs, handedness, draw weight, draw length | | draw curve style, the two measured forces |
| Tuning | brace height, nocking point, center shot, tiller, top and bottom limb alignment, plunger stiffness | plunger preload | |
| Arrow | length, spine, point weight | shaft weight, shaft diameter, insert, nock and fletching weight | vane height, vanes from the nock, point past the shaft |
| String | | strands, string mass, nock fit | |
| Balance | | bow mass, stabilizer mass and position | |
| Result | the sentence, the next step, gauges, bare shaft reading, total arrow mass | paper tear, estimated speed, grains per pound, the numbers, the whole session | front of center and its note, draw curve chart |
| Workspaces | Setup, Simulate | Target (plot, reading, observations), Analysis with Compare | Explore in Analysis, sight marks, personal calibration |
| Display | view, distance, points of impact, speed | | flex amplification |

That is 15 values at Basic, 27 at Advanced and 33 at Professional. Tiller and limb alignment move down to Basic; the draw curve and the extra arrow detail move up to Professional.

Rules:

- The level is a UI concern only. The engine always receives a complete setup.
- Nothing in use is hidden silently. Values above the level that differ from their default are counted in a notice with "show them" and "reset them", as today. A calibrated model that is switched on says so at every level.
- Warnings about safety show at every level: the AMO minimum arrow weight and the 5 gr/lb note.
- Pointing to a value above the level (from the 3D bow or a suggestion) raises the level to that value's level. The level is never lowered by the app.
- Suggestions and the session plan only name values the level shows. Because tiller and limb alignment are now Basic, Basic suggestions can name them.
- The level is remembered per user. A stored level that is not one of the three falls back to Basic.

## 40.3 Four workspaces

The "Show" switch with five entries gives way to workspaces, one per job, as tabs under the top bar. On a phone they are a bar at the foot of the screen.

| Workspace | Hash | Level | Holds |
|---|---|---|---|
| Setup | `#setup` | Basic | the values in groups, next to the 3D bow and the flight |
| Simulate | `#fly` | Basic | top and side views, playback, result, suggestions |
| Target | `#target` | Advanced | target plot and reading, observations; at Professional also sight marks and calibration |
| Analysis | `#analysis` | Advanced | Compare; at Professional also the landscape and the sensitivity chart |

- The 3D bow is no longer a view of its own. It stands next to the values in Setup (§40.4). `#3d` opens Setup with the bow switched on.
- The workspace is remembered. A first visit opens Setup.
- A workspace above the level is not listed. Opening its hash raises the level.
- Changing workspace keeps the setup. Playback starts again.

### The setup bar

Name, saved state and the setup menu move out of the input column into one bar under the workspace tabs, the same in every workspace:

```text
Setup của tôi  · chưa lưu      [Lưu]  [Setup ▾]
```

The menu holds: saved setups (open, rename, delete, compare), save as new, new setup, copy a link, export, import. Nothing in it is new; it is `SavedSetups` and `SetupTransfer` behind one button.

### The top bar

Level, language and units are global. The level stays in sight as a three-way switch. Language and units go behind one settings button, since they are set once. The title and the line under it are gone from the screen; the title stays for screen readers.

## 40.4 The Setup workspace

Asked for by the owner on 2026-10-08: the values and the bow together, as on the screen where a weapon is fitted out in a shooter game. The values are a list with their sliders; next to it stands the bow in 3D, and pressing a part of it goes to the value set on that part.

```text
phone                                   wide screen
+--------------------------------+      +----------------------+---------------------------+
| [x] Cung 3D  Tên bay [Trên|Bên|Tắt]   | v Cung               | [x] Cung 3D  Tên bay [..] |
+--------------------------------+      |   Riser  H23 H25 H27 | Tên hơi yếu.              |
| Tên hơi yếu. Bareshaft lệch    | pin  |   Lực kéo 38,0 lb -+ |                           |
| phải.                          |      |   ====o=======       |        ( bow, 3D )        |
|         ( bow, 3D )            |      |   Kéo    28,00 in -+ |                           |
+--------------------------------+      | > Điều chỉnh  BH 22  +---------------------------+
| v Cung                         |      | > Tên   27 in · 700  |    flight, from above     |
|   Lực kéo      38,0 lb  [-][+] |      |                      +---------------------------+
|   ====o======================= |      |                      | Việc nên làm tiếp  [Thử]  |
| > Điều chỉnh   BH 22 · NP 4    |      +----------------------+---------------------------+
+--------------------------------+
```

**Two previews, each with its own switch.** "Bow 3D" turns the 3D bow on and off. "Flight" draws the arrow leaving the bow from above, from the side, or not at all. Both choices are remembered. A wide screen starts with the bow and the flight from above; a phone starts with the bow only, because two drawings leave no room for the values. The previews stay in view while a value is changed: pinned to the top on a phone, in a column of their own on a wide screen.

**The bow as a way in.** Pressing a part of the bow opens the group of its value, opens the row, and puts the focus on its slider. Changing a value flies the camera to the part it moves and writes the value there. Both exist since §36; here they sit next to the list instead of on another screen. A part whose value lives above the level raises the level. The views of the whole bow, the buttons of the pieces of equipment and the two switches of the 3D view are under "display options" below the previews.

**The result stays in sight.** The sentence of the result stands above the previews and changes as a slider moves. Under them: the next step with its "Try it" button, and the line about assumed values.

**Groups.** `ParameterGroup` becomes `'bow' | 'tuning' | 'arrow' | 'string' | 'balance'`; `size` and `curve` go into `bow`.

- A group with no value at the current level is not shown, so Basic has three groups.
- One group is open at a time. A closed group shows its main values on its header (`H25/68 · 38 lb · 28 in`) and how many values differ from the default.
- Under Bow: the bow length. Under Arrow: the estimated total mass. Both as today.
- At Professional a search field above the groups filters the values by name.

**One value, one row.** A value is a row 44 px tall: label, number field, unit, minus and plus. The row in use, by focus or by a press, opens to show its slider, its hint and reset. One row is open at a time. A value that differs from its default carries a dot. This takes a value from about 100 px to 44 px.

**Assumed values.** The block becomes one line: "assuming 16 other values". The list opens in place. At Professional nothing is hidden and the line is gone.

## 40.5 The Simulate workspace

The drawing and the playback row stay as they are (§4.2). The result is rebuilt around what the archer does next:

1. The sentence, as today.
2. **The next step**: the first suggestion, with its "Try it" button. When the model reads the setup as tuned, it says so here.
3. Tabs for the rest, so only one is on screen: Gauges · Bare shaft · Paper tear (Advanced) · Numbers (Advanced) · Draw curve (Professional).
4. Under them: the other suggestions when there is more than one, and from Advanced the whole session.

On a phone the three tabs "setup, result, suggestions" under the animation go away: setup is a workspace, and result and suggestions are one page.

## 40.6 What does not change

- The engine, the models of bow and arrow, the coefficient set, validation, stored setups, shared links and the import file. No stored setup changes.
- The drawings, the geometry of the 3D bow, the target face and every chart.
- The roadmap and previews pages.
- The design tokens and the Barlow fonts. This is a change of structure, not of look.
- §2.1: every result stays labelled as a model result.

## 40.7 Accessibility and touch

- Workspaces are links with `aria-current`; the level is a radio group; groups are buttons with `aria-expanded`; the result tabs follow the tabs pattern with arrow keys.
- Every value can be reached and changed without the 3D scene: the list is always there.
- Every target is at least 44 by 44 px with 8 px between targets.
- A row opens on focus, so a keyboard user gets the slider without a press.
- Opening and closing takes 150 ms, and is instant under `prefers-reduced-motion`.
- Turning the bow with one finger must not fight the page scroll: the scene takes the gesture only inside its frame.
- Checked at 400 px wide in both languages, in light and dark.

## 40.8 As built

- Levels: `ParameterTier` and `tierShows` in `models/parameters.ts`; the level switch is in the top bar (`App.tsx`).
- Groups and rows: `components/setup/SetupGroups.tsx` and `ValueRow.tsx`, in place of `SetupPanels` and `ParameterSlider`.
- Workspaces: `pages/Simulator.tsx` holds the tabs and the setup bar; one file per workspace in `pages/workspaces/`. The workspace and the two preview switches are remembered in `tuningStore`.
- Setup bar: `SavedSetups`, with the saved setups and the transfer behind its "Setups" button.
- Result: `ResultPanel` with its tabs, `NextStep` for the first suggestion.

## 40.9 Limits and open points

- 49 tests of the screen were written for the old layout: the "Show" switch, the two levels, the three tabs on a phone. They are skipped, each with a note, and have to be rewritten for the workspaces. The tests of the engine, the models and the stores all run.
- The 3D scene costs more than a list on an old phone, and it is loaded on the first visit now instead of on request. Switching it off is one press and is remembered. Touch on a real phone has not been tried yet (pinned in the roadmap).
- On a phone with both previews switched on, the pinned drawings take most of the screen. That is why a phone starts with one.
- Draw weight, spine and other values have nothing to show on the bow (§36). The bow does not move for them; the sentence of the result and the flight do.
- Sight marks are useful to every archer but sit at Professional, as the owner chose. Moving them is a one-line change in `TargetWorkspace`.
- "Grains per pound" and "estimated speed" stay at Advanced; only front of center moved to Professional.
- The V0.5 exit criterion "Simple mode is unchanged" no longer holds: tiller and limb alignment are Basic now.
