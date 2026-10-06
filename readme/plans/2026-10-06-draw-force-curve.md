# Draw Force Curve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show how the force on the fingers grows over the draw, what that stores in the bow, and how steeply the force still rises at the clicker; from the bow's geometry by default, from the archer's own bow scale when they have one.

**Architecture:** A pure module `drawCurve.ts` in the engine holds the curve of spec §39.2: two shape numbers, an estimate of them from the setup, and a fit of them to measured forces. `storedEnergy` takes its factor from that module in place of the fixed `drawCurveFactor`, and the result carries the shape as plain metrics. The curve style and the two measured forces are ordinary entries of the parameter table, so validation, saved setups, links and the comparison pick them up without new code. The UI adds one chart component, used by a panel under the result and by the comparison.

**Tech Stack:** TypeScript (strict), React 19, Zustand, Zod, Tailwind CSS, Vitest + fast-check + Testing Library. No new dependency.

**Spec:** [recurve-tuning-simulator-spec.md](../recurve-tuning-simulator-spec.md) §39. Sources: [tuning-references.md](../tuning-references.md) section 8.

## Global Constraints

- Internal units only in `engine/`, `models/`, `utils/`: mm, g, N. Display units are converted in the UI.
- `engine/`, `models/` and `utils/` must not import React or UI code (oxlint `no-restricted-imports`).
- Every coefficient lives in the versioned JSON file and is described in `coefficients.ts`. The set becomes `heuristic-0.4`.
- With the standard style and no measurement, no existing result may move: `1 + 0.42 / 3` is the 1.14 used so far.
- The required spine is unchanged. The curve moves the arrow speed and, through it, the timing of clearance; nothing else.
- Limb material is not an input.
- New inputs are in the Advanced tier with a default. Simple mode shows nothing new.
- The force gain at the clicker is shown and compared with "5% per inch", never judged: no "too much", no verdict on the archer.
- An estimated curve is labelled as an estimate; a measured one says how many of the archer's points shaped it.
- Every text exists in English (`src/i18n/en.ts`) and Vietnamese (`src/i18n/vi.ts`); a test fails when the two differ in shape.
- Every roadmap item that is finished is ticked in `readme/ROADMAP.md` and turned from `todo(` to `done(` in `src/pages/roadmap/roadmapData.ts` in the same commit; a test fails when the two differ.
- One commit per task, on `master`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No push.
- UI work: load the `frontend-design:frontend-design` and `ui-ux-pro-max:ui-ux-pro-max` skills before writing a component, and look at the result in headless Chrome before calling it done.
- Commands: `npx vitest run <path>`, `npx tsc -b`, `npx oxlint`, `npx prettier --check .`.

## Review Focus

1. **A setup saved or shared before this feature** has no curve style and no measured forces. It must open, get the defaults, and give exactly the result it gave before. Test in Task 1 (style) and Task 3 (forces).
2. **Measured forces that contradict each other or the draw weight** (the nearer point heavier than full draw, the farther point heavier than the nearer, a noisy reading that asks for an absurd curve). The estimate must be used, the archer told, and no metric may be NaN. Tests in Task 3.
3. **A very short power stroke** (20 in draw on a 30 cm brace height): the point "8 in before full draw" lies at or before brace height. It must be ignored, not divided by. Test in Task 3.
4. **Measured forces left in place after the draw weight, draw length or brace height is changed.** They describe another bow now. The engine cannot know, so the panel must say so whenever a measurement is in use. Test in Task 3.
5. **Only the farther point entered.** One point is defined as the nearer one. The farther one alone must not shape the curve, and the archer must be told it was not used. Test in Task 3.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/engine/coefficients/heuristic-0.4.json` (renamed from `heuristic-0.3.json`) | The numbers of the curve, in a new `drawCurve` group; `energy.drawCurveFactor` leaves |
| `src/engine/coefficients/coefficients.ts` | Type and meaning of the new group |
| `src/models/bow.ts` | `DrawCurveStyle`, the three new fields of `BowSetup`, and `powerStroke` (moved here from `bowModel.ts`) |
| `src/models/parameters.ts` | The three new parameters and the `curve` group |
| `src/models/simulation.ts` | `CurveShape`, and five new metrics |
| `src/engine/simulation/drawCurve.ts` (new) | The curve: value, slope, "does it rise", estimate, fit, sampled points, gain at the clicker |
| `src/engine/simulation/bowModel.ts` | `storedEnergy` uses the curve |
| `src/engine/simulation/simulate.ts` | Puts the curve into the metrics |
| `src/utils/markedDrawWeight.ts` (new) | Marked draw weight to force on the fingers |
| `src/components/tuning/DrawCurveChart.tsx` (new) | The chart: one or several curves |
| `src/components/tuning/DrawCurvePanel.tsx` (new) | Chart, numbers, reading, source, and the marked-weight helper |
| `src/components/tuning/SetupPanels.tsx` | A section for the measured forces, Advanced only |
| `src/components/compare/Comparison.tsx` | The curves of the compared setups on one chart |
| `src/pages/Simulator.tsx` | Shows the panel under the result in Advanced |
| `src/i18n/en.ts`, `src/i18n/vi.ts` | Texts |
| `readme/physics-and-calculations.md`, `readme/ROADMAP.md`, `src/pages/roadmap/roadmapData.ts` | Documentation and roadmap |

---

### Task 1: The common curve in the engine, with the curve style

Roadmap items finished by this task: the common curve, the curve style, the end rise from bow length and draw length.

**Files:**
- Rename: `src/engine/coefficients/heuristic-0.3.json` → `src/engine/coefficients/heuristic-0.4.json`
- Modify: `src/engine/coefficients/coefficients.ts`, `src/engine/coefficients/coefficients.test.ts`
- Modify: `src/models/bow.ts`, `src/models/parameters.ts`, `src/models/simulation.ts`
- Create: `src/engine/simulation/drawCurve.ts`, `src/engine/simulation/drawCurve.test.ts`
- Modify: `src/engine/simulation/bowModel.ts`, `src/engine/simulation/simulate.ts`, `src/engine/simulation/simulate.test.ts`, `src/engine/index.ts`
- Modify: `src/i18n/vi.ts`, `src/utils/validation.test.ts`
- Modify: `readme/physics-and-calculations.md`, `readme/ROADMAP.md`, `src/pages/roadmap/roadmapData.ts`

**Interfaces:**
- Consumes: `bowLength(bow)` from `src/models/bow.ts`; `Coefficients` from `coefficients.ts`.
- Produces:
  - `src/models/bow.ts`: `type DrawCurveStyle = 'STRAIGHT' | 'STANDARD' | 'FULL'`; `BowSetup.drawCurve: DrawCurveStyle`; `powerStroke(bow: Pick<BowSetup, 'drawLength' | 'braceHeight'>): number` (mm).
  - `src/models/simulation.ts`: `type CurveShape = { fullness: number; endRise: number; measuredPoints: 0 | 1 | 2 }`; metrics `storedEnergy` (J), `clickerGain` (N per mm), `curveFullness`, `curveEndRise`, `curveMeasuredPoints`.
  - `src/engine/simulation/drawCurve.ts`: `curveForce(shape, u): number`, `curveSlope(shape, u): number`, `rises(shape): boolean`, `estimatedShape(bow, c): CurveShape`, `drawCurve(bow, c): CurveShape`, `clickerGain(bow, shape): number`, `curvePoints(bow, shape, count?): { draw: number; force: number }[]`, `shapeOf(metrics): CurveShape`.
  - `Coefficients['drawCurve']` with the keys listed in Step 3.

- [ ] **Step 1: Write the failing tests for the curve**

Create `src/engine/simulation/drawCurve.test.ts`:

```ts
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { powerStroke } from '../../models/bow.ts'
import { getParameter, setValue } from '../../models/parameters.ts'
import { setupArbitrary } from '../../models/setup.arbitrary.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import type { CurveShape } from '../../models/simulation.ts'
import { HEURISTIC_V0 as c } from '../coefficients/coefficients.ts'
import { storedEnergy } from './bowModel.ts'
import {
  clickerGain,
  curveForce,
  curvePoints,
  curveSlope,
  drawCurve,
  estimatedShape,
  rises,
} from './drawCurve.ts'

const reference = createDefaultSetup()
const withValue = (key: string, value: number | string) =>
  setValue(reference, getParameter(key), value)
const shape = (fullness: number, endRise: number): CurveShape => ({
  fullness,
  endRise,
  measuredPoints: 0,
})

/** Area under the curve from 0 to 1, by the midpoint rule. */
function area(of: CurveShape): number {
  const steps = 2000
  let sum = 0
  for (let step = 0; step < steps; step += 1) sum += curveForce(of, (step + 0.5) / steps)
  return sum / steps
}

describe('curve shape (§39.2)', () => {
  it('starts at zero force and ends at the draw weight', () => {
    expect(curveForce(shape(0.42, 0.39), 0)).toBe(0)
    expect(curveForce(shape(0.42, 0.39), 1)).toBeCloseTo(1, 12)
  })

  it('stores 1 + h / 3 of a straight line, whatever the end rise', () => {
    expect(2 * area(shape(0, 0))).toBeCloseTo(1, 5)
    expect(2 * area(shape(0.42, 0))).toBeCloseTo(1.14, 5)
    expect(2 * area(shape(0.42, 0.8))).toBeCloseTo(1.14, 5)
  })

  it('gains 1 - h + k at full draw', () => {
    expect(curveSlope(shape(0.42, 0.39), 1)).toBeCloseTo(0.97, 12)
  })

  it('tells a curve that rises all the way from one that falls', () => {
    expect(rises(shape(0.42, 0.39))).toBe(true)
    expect(rises(shape(0.6, 0.8))).toBe(true)
    // Bulges so far that the force falls before full draw.
    expect(rises(shape(1.5, 0))).toBe(false)
    // Rises at both ends but dips between them.
    expect(rises(shape(0, 2.5))).toBe(false)
  })
})

describe('estimate from the setup (§39.3)', () => {
  it('gives the reference setup the standard curve', () => {
    const estimate = estimatedShape(reference.bow, c)
    expect(estimate).toEqual({ fullness: 0.42, endRise: 0.39, measuredPoints: 0 })
  })

  it('stores what the fixed factor of 1.14 stored', () => {
    const linear = 0.5 * reference.bow.drawWeight * (powerStroke(reference.bow) / 1000)
    expect(storedEnergy(reference.bow, c)).toBeCloseTo(linear * 1.14, 9)
  })

  it('gains about 5% of the draw weight per inch at the reference setup', () => {
    const gain = clickerGain(reference.bow, estimatedShape(reference.bow, c))
    expect((gain * 25.4) / reference.bow.drawWeight).toBeCloseTo(0.05, 2)
  })

  it('stores more in a fuller style and less in a straight one', () => {
    const energy = (style: string) => storedEnergy(withValue('bow.drawCurve', style).bow, c)
    expect(energy('STRAIGHT')).toBeLessThan(energy('STANDARD'))
    expect(energy('STANDARD')).toBeLessThan(energy('FULL'))
  })

  it('climbs more steeply at the end for a short bow drawn long', () => {
    const endRise = (key: string, value: number | string) =>
      estimatedShape(withValue(key, value).bow, c).endRise
    const here = estimatedShape(reference.bow, c).endRise
    expect(endRise('bow.drawLength', reference.bow.drawLength + 25.4)).toBeGreaterThan(here)
    expect(endRise('bow.limbSize', '66')).toBeGreaterThan(here)
    expect(endRise('bow.limbSize', '70')).toBeLessThan(here)
    expect(endRise('bow.riserSize', 'H27')).toBeLessThan(here)
  })

  it('keeps the end rise inside its bounds', () => {
    expect(endRiseAt(35 * 25.4)).toBe(c.drawCurve.endRiseMax)
    expect(endRiseAt(20 * 25.4)).toBe(0)

    function endRiseAt(drawLength: number) {
      return estimatedShape(withValue('bow.drawLength', drawLength).bow, c).endRise
    }
  })

  it('samples the curve from brace height to full draw', () => {
    const points = curvePoints(reference.bow, estimatedShape(reference.bow, c), 10)
    expect(points).toHaveLength(11)
    expect(points[0]).toEqual({ draw: reference.bow.braceHeight, force: 0 })
    expect(points.at(-1)!.draw).toBeCloseTo(reference.bow.drawLength, 9)
    expect(points.at(-1)!.force).toBeCloseTo(reference.bow.drawWeight, 9)
  })

  it('gives every valid setup a curve that rises, with finite energy', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const curve = drawCurve(setup.bow, c)
        expect(rises(curve)).toBe(true)
        expect(Number.isFinite(storedEnergy(setup.bow, c))).toBe(true)
        expect(storedEnergy(setup.bow, c)).toBeGreaterThan(0)
      }),
    )
  })
})
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run src/engine/simulation/drawCurve.test.ts`
Expected: FAIL, cannot resolve `./drawCurve.ts`.

- [ ] **Step 3: Move the coefficients to `heuristic-0.4`**

```bash
git mv src/engine/coefficients/heuristic-0.3.json src/engine/coefficients/heuristic-0.4.json
```

In `heuristic-0.4.json`: set `"version": "heuristic-0.4"`, remove the line `"drawCurveFactor": 1.14,` from `energy`, and add this group after `energy`:

```json
  "drawCurve": {
    "fullnessStraight": 0.15,
    "fullnessStandard": 0.42,
    "fullnessFull": 0.6,
    "endRise": 0.39,
    "endRisePerInch": 0.1,
    "endRiseMax": 0.8,
    "fitDrawLength": 711.2,
    "fitBowLength": 68,
    "usualGainPerInch": 0.05,
    "usualGainBand": 0.01
  },
```

In `coefficients.ts`: change the import to `./heuristic-0.4.json`, remove `drawCurveFactor` and its comment from `energy`, and add after `energy`:

```ts
  /**
   * The draw force curve of spec §39: force over the power stroke as
   * `u + fullness·u(1−u) + endRise·u(1−u)(1−2u)`, with `u` from 0 at brace
   * height to 1 at full draw.
   */
  drawCurve: {
    /** Fullness of the three curve styles. Stored energy is `1 + fullness / 3` times that of a straight line. */
    fullnessStraight: number
    /** 0.42 gives the factor of 1.14 the model used before it had a curve. */
    fullnessStandard: number
    fullnessFull: number
    /**
     * End rise of a bow whose length fits the draw. Set so that the reference
     * setup gains 5% of its draw weight per inch at full draw, the usual rule
     * for a recurve near 28 in.
     */
    endRise: number
    /** End rise added per inch of draw beyond the one the bow length fits. A guess at the size of a known direction. */
    endRisePerInch: number
    /** The estimate is kept between 0 and this, so the curve always rises. */
    endRiseMax: number
    /** mm, the draw length that a bow of `fitBowLength` fits: 28 in. */
    fitDrawLength: number
    /** in. Each inch of bow length fits one more inch of draw. */
    fitBowLength: number
    /** Share of the draw weight a common recurve gains per inch at full draw. */
    usualGainPerInch: number
    /** Half-width of what is still read as "about usual". */
    usualGainBand: number
  }
```

In `coefficients.test.ts`: import `./heuristic-0.4.json`, expect version `'heuristic-0.4'`, and in "refuses a number that is not one" use `broken.energy.limbVirtualMass = '5.5'` with `toThrow('energy.limbVirtualMass')`.

- [ ] **Step 4: Add the style to the bow, and move `powerStroke`**

In `src/models/bow.ts`, add after `LimbSize`:

```ts
/** How the force builds up over the draw, when the archer has not measured it (spec §39.3). */
export type DrawCurveStyle = 'STRAIGHT' | 'STANDARD' | 'FULL'
```

Add to `BowSetup`, after `stabilizerPosition`:

```ts
  /** An estimate of the shape of the draw force curve */
  drawCurve: DrawCurveStyle
```

Add at the end of the file:

```ts
/** mm, distance over which the string accelerates the arrow */
export function powerStroke(bow: Pick<BowSetup, 'drawLength' | 'braceHeight'>): number {
  return bow.drawLength - bow.braceHeight
}
```

In `src/engine/simulation/bowModel.ts`, delete the local `powerStroke` and re-export the moved one, so `simulate.ts` keeps its import:

```ts
import { powerStroke, type BowSetup } from '../../models/bow.ts'

export { powerStroke }
```

In `src/models/parameters.ts`, add to `HINTS`:

```ts
  'bow.drawCurve':
    'An estimate of how the force builds up over the draw. Standard suits most recurve limbs.',
```

and add to `PARAMETERS`, right after the `bow.string.nockFit` entry:

```ts
  choice(
    'bow.drawCurve',
    'advanced',
    'Draw force curve',
    { STRAIGHT: 'Straight', STANDARD: 'Standard', FULL: 'Full in mid-draw' },
    'STANDARD',
  ),
```

The 3D viewer names the values it has nothing to draw for. In `viewer.notDrawn` of `src/i18n/en.ts` and `src/i18n/vi.ts`, add the curve to the list: in English insert `draw force curve, ` before `bow mass`; in Vietnamese insert `đường lực kéo, ` at the matching place. The start of the sentence must stay as it is, a test reads it.

In `src/i18n/vi.ts`, add to `parameter`, after `'bow.string.nockFit'`:

```ts
    'bow.drawCurve': {
      label: 'Đường lực kéo',
      hint: 'Ước lượng lực tăng thế nào trong lúc kéo. Mức chuẩn hợp với phần lớn limb recurve.',
      options: { STRAIGHT: 'Thẳng', STANDARD: 'Chuẩn', FULL: 'Đầy giữa hành trình' },
    },
```

- [ ] **Step 5: Add the shape and the metrics to the result types**

In `src/models/simulation.ts`, add before `SimulationMetrics`:

```ts
/** The two numbers that shape the draw force curve (spec §39.2). */
export type CurveShape = {
  /** How far the curve bulges above a straight line in mid-draw. Sets the stored energy. */
  fullness: number
  /** How much steeper the two ends are than the middle. Sets the force gain at the clicker. */
  endRise: number
  /** How many forces measured by the archer shaped it. 0 is an estimate from the setup. */
  measuredPoints: 0 | 1 | 2
}
```

and add to `SimulationMetrics`, after `kineticEnergy`:

```ts
  /** J, stored in the bow at full draw: the area under the draw force curve */
  storedEnergy: number
  /** N per mm, how fast the force on the fingers still rises at full draw */
  clickerGain: number
  /** Shape of the draw force curve, see `CurveShape` */
  curveFullness: number
  curveEndRise: number
  curveMeasuredPoints: 0 | 1 | 2
```

- [ ] **Step 6: Write the curve module**

Create `src/engine/simulation/drawCurve.ts`:

```ts
import { bowLength, powerStroke, type BowSetup } from '../../models/bow.ts'
import type { CurveShape, SimulationMetrics } from '../../models/simulation.ts'
import type { Coefficients } from '../coefficients/coefficients.ts'

// The draw force curve of spec §39. `u` is the share of the power stroke drawn
// so far: 0 at brace height, where the force is zero, and 1 at full draw, where
// it is the draw weight. Forces here are shares of the draw weight.

const MM_PER_INCH = 25.4

/** Bulges above the straight line, most in mid-draw. Its area is 1/6. */
const hump = (u: number) => u * (1 - u)
/** Lifts the first half and lowers the second by as much, so it adds no area. */
const sway = (u: number) => u * (1 - u) * (1 - 2 * u)

/** Share of the draw weight on the fingers at `u`. */
export function curveForce(shape: CurveShape, u: number): number {
  return u + shape.fullness * hump(u) + shape.endRise * sway(u)
}

/** How fast that share grows, per share of the power stroke. */
export function curveSlope(shape: CurveShape, u: number): number {
  return 1 + shape.fullness * (1 - 2 * u) + shape.endRise * (1 - 6 * u + 6 * u * u)
}

/** A curve flatter than this anywhere is not one a bow has. */
const LEAST_SLOPE = 0.05

/** True when the force grows all the way from brace height to full draw. */
export function rises(shape: CurveShape): boolean {
  const { fullness, endRise } = shape
  const lowest = [0, 1]
  // With a positive end rise the slope has a low point between the ends.
  if (endRise > 0) {
    const between = 0.5 + fullness / (6 * endRise)
    if (between > 0 && between < 1) lowest.push(between)
  }
  return lowest.every((u) => curveSlope(shape, u) >= LEAST_SLOPE)
}

/** The curve taken for a bow nobody has measured: style and bow size decide. */
export function estimatedShape(bow: BowSetup, c: Coefficients): CurveShape {
  const d = c.drawCurve
  const fullness =
    bow.drawCurve === 'STRAIGHT'
      ? d.fullnessStraight
      : bow.drawCurve === 'FULL'
        ? d.fullnessFull
        : d.fullnessStandard
  // A longer bow fits a longer draw. Drawn beyond that, the force climbs at the end.
  const fitDraw = d.fitDrawLength + (bowLength(bow) - d.fitBowLength) * MM_PER_INCH
  const beyond = (bow.drawLength - fitDraw) / MM_PER_INCH
  const endRise = Math.min(d.endRiseMax, Math.max(0, d.endRise + d.endRisePerInch * beyond))
  return { fullness, endRise, measuredPoints: 0 }
}

/** The curve the model uses for this bow. */
export function drawCurve(bow: BowSetup, c: Coefficients): CurveShape {
  return estimatedShape(bow, c)
}

/** N per mm, how fast the force on the fingers still rises at full draw. */
export function clickerGain(bow: BowSetup, shape: CurveShape): number {
  return (bow.drawWeight / powerStroke(bow)) * curveSlope(shape, 1)
}

/** The curve in mm of draw and N, evenly spaced from brace height to full draw. */
export function curvePoints(
  bow: BowSetup,
  shape: CurveShape,
  count = 32,
): { draw: number; force: number }[] {
  return Array.from({ length: count + 1 }, (_, index) => {
    const u = index / count
    return {
      draw: bow.braceHeight + u * powerStroke(bow),
      force: bow.drawWeight * curveForce(shape, u),
    }
  })
}

/** The shape a result was computed with. */
export function shapeOf(metrics: SimulationMetrics): CurveShape {
  return {
    fullness: metrics.curveFullness,
    endRise: metrics.curveEndRise,
    measuredPoints: metrics.curveMeasuredPoints,
  }
}
```

- [ ] **Step 7: Take the stored energy from the curve**

In `src/engine/simulation/bowModel.ts`, add `import { drawCurve } from './drawCurve.ts'` and replace `storedEnergy`:

```ts
/** J, the area under the draw force curve */
export function storedEnergy(bow: BowSetup, coefficients: Coefficients): number {
  const linear = 0.5 * bow.drawWeight * (powerStroke(bow) / 1000)
  // A straight line stores ½·F·s; the bulge of the curve adds a third of its fullness.
  return linear * (1 + drawCurve(bow, coefficients).fullness / 3)
}
```

- [ ] **Step 8: Run the curve tests**

Run: `npx vitest run src/engine/simulation/drawCurve.test.ts src/engine/coefficients`
Expected: PASS.

- [ ] **Step 9: Write the failing tests for the result**

Add to `src/engine/simulation/simulate.test.ts`, at the end. The file already has a helper that changes one value of the reference setup; use it in place of `withValue` if its name differs, and reuse the file's existing imports.

```ts
describe('draw force curve (§39)', () => {
  const reference = createDefaultSetup()
  const withValue = (key: string, value: number | string) =>
    setValue(reference, getParameter(key), value)
  const metrics = (setup: TuningSetup) => heuristicModel.analyze(setup).metrics

  it('reports the curve of the reference setup', () => {
    const m = metrics(reference)
    expect(m.curveFullness).toBe(0.42)
    expect(m.curveEndRise).toBe(0.39)
    expect(m.curveMeasuredPoints).toBe(0)
    // 38 lb over a 19.3 in power stroke, times 1.14: about 47 J.
    expect(m.storedEnergy).toBeGreaterThan(44)
    expect(m.storedEnergy).toBeLessThan(50)
    expect(m.storedEnergy).toBeGreaterThan(m.kineticEnergy)
  })

  it('shoots faster with a fuller curve, and leaves weak and stiff alone', () => {
    const straight = metrics(withValue('bow.drawCurve', 'STRAIGHT'))
    const standard = metrics(reference)
    const full = metrics(withValue('bow.drawCurve', 'FULL'))
    expect(straight.launchSpeed).toBeLessThan(standard.launchSpeed)
    expect(standard.launchSpeed).toBeLessThan(full.launchSpeed)
    expect(straight.dynamicBehavior).toBe(standard.dynamicBehavior)
    expect(full.dynamicBehavior).toBe(standard.dynamicBehavior)
  })

  it('gains more at the clicker on shorter limbs, at the same speed', () => {
    const short = metrics(withValue('bow.limbSize', '66'))
    const long = metrics(withValue('bow.limbSize', '70'))
    expect(short.clickerGain).toBeGreaterThan(long.clickerGain)
    expect(short.launchSpeed).toBe(long.launchSpeed)
  })

  it('reports finite curve numbers for any valid setup', () => {
    fc.assert(
      fc.property(setupArbitrary, (setup) => {
        const m = metrics(setup)
        expect(Number.isFinite(m.storedEnergy)).toBe(true)
        expect(m.clickerGain).toBeGreaterThan(0)
        expect(Number.isFinite(m.curveFullness)).toBe(true)
        expect(Number.isFinite(m.curveEndRise)).toBe(true)
      }),
    )
  })
})
```

Add to `src/utils/validation.test.ts` (Review Focus 1):

```ts
it('opens a setup saved before the draw force curve existed', () => {
  const current = createDefaultSetup()
  const { drawCurve: _left, ...oldBow } = current.bow
  const parsed = parseSetup({ ...current, bow: oldBow })
  expect(parsed.ok && parsed.setup.bow.drawCurve).toBe('STANDARD')
})
```

Run: `npx vitest run src/engine/simulation/simulate.test.ts src/utils/validation.test.ts`
Expected: the new `describe` FAILS (`curveFullness` is undefined); the validation test passes already, because `withDefaults` fills what is missing.

- [ ] **Step 10: Put the curve into the metrics**

In `src/engine/simulation/simulate.ts`: import `storedEnergy` from `./bowModel.ts` and `clickerGain, drawCurve` from `./drawCurve.ts`. In `evaluate`, before `const metrics`, add:

```ts
  const curve = drawCurve(bow, c)
```

and add to the `metrics` object, after `kineticEnergy`:

```ts
    storedEnergy: storedEnergy(bow, c),
    clickerGain: clickerGain(bow, curve),
    curveFullness: curve.fullness,
    curveEndRise: curve.endRise,
    curveMeasuredPoints: curve.measuredPoints,
```

In `src/engine/index.ts`, add:

```ts
export { curvePoints, shapeOf } from './simulation/drawCurve.ts'
```

- [ ] **Step 11: Run everything and fix what the new field breaks**

Run: `npx tsc -b`
Expected: errors only where a `BowSetup` is written out by hand without `drawCurve`. Add `drawCurve: 'STANDARD'` to each such literal. Do not change anything else.

Run: `npx vitest run`
Expected: PASS. The `SetupPanels` test finds the new "Draw force curve" label in Advanced because the Bow panel renders every `bow` parameter.

Run: `npx oxlint && npx prettier --check .`
Expected: no findings. If a snapshot of a speed moved in the last decimals, that is `1 + 0.42 / 3` against `1.14` in floating point; widen only that comparison to `toBeCloseTo(value, 9)`.

- [ ] **Step 12: Update the documentation and the roadmap**

In `readme/physics-and-calculations.md` section 5.1, replace the energy lines and the paragraph under them with:

````markdown
```text
powerStroke = drawLength − braceHeight                         mm

E = ½ · drawWeight · powerStroke · (1 + h / 3)                 J   (powerStroke đổi ra m)
    h = độ đầy của đường lực kéo: 0.15 thẳng, 0.42 chuẩn, 0.60 đầy giữa hành trình
```

`½·F·s` là năng lượng của đường lực kéo thẳng; `1 + h / 3` là phần cung recurve tích thêm nhờ đường cong phồng lên ở giữa hành trình. Mức chuẩn cho đúng hệ số 1.14 mà mô hình dùng từ trước (từ `heuristic-0.4` hệ số cố định `drawCurveFactor` không còn).

Đường lực kéo, với `u` là phần power stroke đã kéo (0 ở brace height, 1 ở full draw):

```text
F(u) = drawWeight · ( u + h·u(1−u) + k·u(1−u)(1−2u) )

k = 0.39 + 0.10 · (drawLength − drawVừa)          inch, giữ trong 0 … 0.8
    drawVừa = 28 in + (chiều dài cung − 68 in)

lực tăng ở clicker = drawWeight / powerStroke · (1 − h + k)
```

`k` (độ dốc cuối) không đổi năng lượng: số hạng của nó thêm bao nhiêu diện tích ở nửa đầu thì bớt bấy nhiêu ở nửa sau. Nó chỉ đổi lực tăng ở clicker. 0.39 làm setup tham chiếu tăng 5% lực kéo mỗi inch ở full draw; 0.10 mỗi inch là ước đoán về độ lớn, chưa có số đo. Chi tiết ở spec §39.
````

In the same file, change every `heuristic-0.3.json` to `heuristic-0.4.json` (the table of where things live near the end).

In `readme/ROADMAP.md`, tick the first three items of "Draw force curve" (`- [x]`). In `src/pages/roadmap/roadmapData.ts`, turn the first three `todo(` of the group `'Đường lực kéo (DFC)'` into `done(`.

Run: `npx vitest run src/pages/roadmap && npx prettier --check .`
Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: take the stored energy from a draw force curve with a choice of style

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The chart and the numbers under the result

Part of the roadmap item "the curve as a chart"; the item is ticked in Task 4, when the comparison has it too.

**Files:**
- Create: `src/components/tuning/DrawCurveChart.tsx`, `src/components/tuning/DrawCurvePanel.tsx`, `src/components/tuning/DrawCurvePanel.test.tsx`
- Modify: `src/pages/Simulator.tsx`, `src/i18n/en.ts`, `src/i18n/vi.ts`

**Interfaces:**
- Consumes: `curvePoints(bow, shape, count?)`, `shapeOf(metrics)`, `HEURISTIC_V0` from `src/engine/index.ts`; `CurveShape`, `SimulationResult` from `src/models/simulation.ts`; `UnitSystem` from `src/models/parameters.ts`; `convert`, `unitLabel` from `src/utils/units.ts`.
- Produces:
  - `DrawCurveChart({ curves, units }: { curves: ChartCurve[]; units: UnitSystem })` with `type ChartCurve = { name: string; bow: BowSetup; shape: CurveShape }`. The last curve is drawn as the main one.
  - `DrawCurvePanel({ setup, result, units }: { setup: TuningSetup; result: SimulationResult; units: UnitSystem })`.
  - `gainReading(metrics, drawWeight): 'USUAL' | 'GENTLER' | 'STEEPER'` exported from `DrawCurvePanel.tsx`.
  - Texts under `m.curve`.

- [ ] **Step 1: Load the UI skills**

Invoke `frontend-design:frontend-design` and `ui-ux-pro-max:ui-ux-pro-max`. The chart follows the look of the existing drawings: the tokens `text-ink`, `text-ink-muted`, `border-line`, `bg-surface`, `text-accent`, the fonts already loaded, no new colors.

- [ ] **Step 2: Add the texts**

In `src/i18n/en.ts`, add a block after `result`:

```ts
  curve: {
    heading: 'Draw force curve',
    chart: (weight: string, length: string) =>
      `Force on the fingers over the draw, reaching ${weight} at ${length}.`,
    drawAxis: (unit: string) => `Draw length, ${unit}`,
    forceAxis: (unit: string) => `Force, ${unit}`,
    clicker: 'Clicker',
    storedEnergy: 'Stored in the bow',
    gain: 'Force gain at the clicker',
    perLength: (value: string, force: string, length: string) =>
      `${value} ${force} per ${length}`,
    reading: {
      USUAL: 'About what a recurve usually gains near full draw: 5% of the draw weight per inch.',
      GENTLER: 'Gentler than the 5% per inch a recurve usually gains near full draw.',
      STEEPER: 'Steeper than the 5% per inch a recurve usually gains near full draw.',
    },
    estimated:
      'Estimated from the bow size and the curve style. This is not the curve of your limbs.',
  },
```

In `src/i18n/vi.ts`, the same block:

```ts
  curve: {
    heading: 'Đường lực kéo',
    chart: (weight: string, length: string) =>
      `Lực trên ngón tay trong lúc kéo, đạt ${weight} ở ${length}.`,
    drawAxis: (unit: string) => `Draw length, ${unit}`,
    forceAxis: (unit: string) => `Lực, ${unit}`,
    clicker: 'Clicker',
    storedEnergy: 'Năng lượng tích trong cung',
    gain: 'Lực tăng ở clicker',
    perLength: (value: string, force: string, length: string) =>
      `${value} ${force} mỗi ${length}`,
    reading: {
      USUAL: 'Ngang mức thường gặp ở recurve gần full draw: 5% lực kéo mỗi inch.',
      GENTLER: 'Nhẹ hơn mức 5% mỗi inch thường gặp ở recurve gần full draw.',
      STEEPER: 'Dốc hơn mức 5% mỗi inch thường gặp ở recurve gần full draw.',
    },
    estimated:
      'Ước lượng từ cỡ cung và kiểu đường cong. Đây không phải đường lực kéo của chính bộ limb của bạn.',
  },
```

- [ ] **Step 3: Write the failing test**

Create `src/components/tuning/DrawCurvePanel.test.tsx`:

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { heuristicModel } from '../../engine/index.ts'
import { getParameter, setValue } from '../../models/parameters.ts'
import { createDefaultSetup } from '../../models/setup.ts'
import { DrawCurvePanel, gainReading } from './DrawCurvePanel.tsx'

afterEach(cleanup)

const reference = createDefaultSetup()
const show = (setup = reference, units: 'archery' | 'metric' = 'archery') =>
  render(<DrawCurvePanel setup={setup} result={heuristicModel.simulate(setup)} units={units} />)

describe('draw force curve panel', () => {
  it('draws the curve and describes it in words', () => {
    show()
    expect(screen.getByRole('heading', { name: 'Draw force curve' })).toBeTruthy()
    const chart = screen.getByRole('img')
    expect(chart.getAttribute('aria-label')).toBe(
      'Force on the fingers over the draw, reaching 38.0 lb at 28.0 in.',
    )
    expect(chart.querySelectorAll('polyline')).toHaveLength(1)
  })

  it('gives the stored energy and the gain at the clicker', () => {
    show()
    expect(screen.getByText('Stored in the bow').nextElementSibling?.textContent).toMatch(
      /^4\d\.\d J$/,
    )
    expect(screen.getByText('Force gain at the clicker').nextElementSibling?.textContent).toBe(
      '1.9 lb per in',
    )
  })

  it('uses newtons and centimetres in metric', () => {
    show(reference, 'metric')
    expect(screen.getByText('Force gain at the clicker').nextElementSibling?.textContent).toMatch(
      /^\d\.\d N per cm$/,
    )
  })

  it('says the curve is an estimate', () => {
    show()
    expect(screen.getByText(/Estimated from the bow size/)).toBeTruthy()
  })

  it('reads the gain against 5% per inch without judging it', () => {
    const weight = reference.bow.drawWeight
    // N per mm, for a share of the draw weight gained per inch.
    const gaining = (sharePerInch: number) => ({ clickerGain: (weight * sharePerInch) / 25.4 })
    expect(gainReading(heuristicModel.analyze(reference).metrics, weight)).toBe('USUAL')
    expect(gainReading(gaining(0.059), weight)).toBe('USUAL')
    expect(gainReading(gaining(0.07), weight)).toBe('STEEPER')
    expect(gainReading(gaining(0.03), weight)).toBe('GENTLER')
    // A straight curve keeps climbing where a full one has flattened.
    const straight = setValue(reference, getParameter('bow.drawCurve'), 'STRAIGHT')
    expect(gainReading(heuristicModel.analyze(straight).metrics, weight)).toBe('STEEPER')
  })
})
```

Run: `npx vitest run src/components/tuning/DrawCurvePanel.test.tsx`
Expected: FAIL, cannot resolve `./DrawCurvePanel.tsx`.

- [ ] **Step 4: Write the chart**

Create `src/components/tuning/DrawCurveChart.tsx`:

```tsx
import { curvePoints } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { BowSetup } from '../../models/bow.ts'
import type { UnitSystem } from '../../models/parameters.ts'
import type { CurveShape } from '../../models/simulation.ts'
import { convert, unitLabel, type Unit } from '../../utils/units.ts'

export type ChartCurve = { name: string; bow: BowSetup; shape: CurveShape }

const WIDTH = 320
const HEIGHT = 200
const LEFT = 36
const RIGHT = 14
const TOP = 12
const BOTTOM = 34

/** Units the chart is read in. */
export function curveUnits(units: UnitSystem): { length: Unit; force: Unit } {
  return units === 'metric' ? { length: 'cm', force: 'N' } : { length: 'in', force: 'lbf' }
}

type Props = {
  /** The last one is the setup on screen and is drawn strongest. */
  curves: ChartCurve[]
  units: UnitSystem
}

/** Force on the fingers against draw length, from brace height to full draw. */
export function DrawCurveChart({ curves, units }: Props) {
  const m = useMessages()
  const { length, force } = curveUnits(units)
  const main = curves.at(-1)!
  const from = Math.min(...curves.map((curve) => curve.bow.braceHeight))
  const to = Math.max(...curves.map((curve) => curve.bow.drawLength))
  const top = Math.max(...curves.map((curve) => curve.bow.drawWeight)) * 1.08
  const x = (draw: number) => LEFT + ((draw - from) / (to - from)) * (WIDTH - LEFT - RIGHT)
  const y = (newtons: number) => HEIGHT - BOTTOM - (newtons / top) * (HEIGHT - TOP - BOTTOM)
  const shownLength = (mm: number) => convert(mm, 'mm', length).toFixed(1)
  const shownForce = (newtons: number) => convert(newtons, 'N', force).toFixed(1)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={m.curve.chart(
        `${shownForce(main.bow.drawWeight)} ${unitLabel(force)}`,
        `${shownLength(main.bow.drawLength)} ${unitLabel(length)}`,
      )}
      className="text-ink h-auto w-full max-w-md"
    >
      <g className="text-ink-muted" fill="currentColor" fontSize="11">
        <path
          d={`M${LEFT} ${TOP}V${HEIGHT - BOTTOM}H${WIDTH - RIGHT}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <text x={LEFT} y={HEIGHT - BOTTOM + 14}>
          {shownLength(from)}
        </text>
        <text x={WIDTH - RIGHT} y={HEIGHT - BOTTOM + 14} textAnchor="end">
          {shownLength(to)}
        </text>
        <text x={(LEFT + WIDTH - RIGHT) / 2} y={HEIGHT - 6} textAnchor="middle">
          {m.curve.drawAxis(unitLabel(length))}
        </text>
        <text x={LEFT - 5} y={HEIGHT - BOTTOM} textAnchor="end">
          0
        </text>
        <text x={LEFT - 5} y={y(main.bow.drawWeight) + 4} textAnchor="end">
          {shownForce(main.bow.drawWeight)}
        </text>
        <text x={LEFT + 6} y={TOP + 10}>
          {m.curve.forceAxis(unitLabel(force))}
        </text>
      </g>
      {curves.map((curve, index) => {
        const last = index === curves.length - 1
        const points = curvePoints(curve.bow, curve.shape)
        const end = points.at(-1)!
        return (
          <g key={index} className={last ? 'text-ink' : 'text-ink-muted'}>
            <title>{curve.name}</title>
            <polyline
              points={points
                .map((point) => `${x(point.draw).toFixed(1)},${y(point.force).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth={last ? 2.5 : 1.5}
              strokeDasharray={last ? undefined : '5 4'}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={x(end.draw)} cy={y(end.force)} r={last ? 4 : 3} fill="currentColor" />
          </g>
        )
      })}
      <text
        x={x(main.bow.drawLength) - 8}
        y={y(main.bow.drawWeight) - 8}
        textAnchor="end"
        fontSize="11"
        className="text-accent"
        fill="currentColor"
      >
        {m.curve.clicker}
      </text>
    </svg>
  )
}
```

- [ ] **Step 5: Write the panel**

Create `src/components/tuning/DrawCurvePanel.tsx`:

```tsx
import { HEURISTIC_V0, shapeOf } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { UnitSystem } from '../../models/parameters.ts'
import type { TuningSetup } from '../../models/setup.ts'
import type { SimulationMetrics, SimulationResult } from '../../models/simulation.ts'
import { convert, unitLabel } from '../../utils/units.ts'
import { DrawCurveChart, curveUnits } from './DrawCurveChart.tsx'

/** The gain at the clicker against what a common recurve gains. A comparison, not a verdict. */
export function gainReading(
  metrics: Pick<SimulationMetrics, 'clickerGain'>,
  drawWeight: number,
): 'USUAL' | 'GENTLER' | 'STEEPER' {
  const { usualGainPerInch, usualGainBand } = HEURISTIC_V0.drawCurve
  const sharePerInch = (metrics.clickerGain * 25.4) / drawWeight
  if (sharePerInch < usualGainPerInch - usualGainBand) return 'GENTLER'
  if (sharePerInch > usualGainPerInch + usualGainBand) return 'STEEPER'
  return 'USUAL'
}

type Props = {
  setup: TuningSetup
  result: SimulationResult
  units: UnitSystem
}

/** The draw force curve of the setup on screen: the chart, what it stores, how it ends. */
export function DrawCurvePanel({ setup, result, units }: Props) {
  const m = useMessages()
  const text = m.curve
  const { metrics } = result
  const { length, force } = curveUnits(units)
  // N per mm, shown as force per inch or per centimetre.
  const gain = convert(metrics.clickerGain, 'N', force) * convert(1, length, 'mm')

  return (
    <section aria-labelledby="curve-heading" className="border-line mt-5 border-t pt-4">
      <h2 id="curve-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <div className="mt-2">
        <DrawCurveChart
          curves={[{ name: setup.name, bow: setup.bow, shape: shapeOf(metrics) }]}
          units={units}
        />
      </div>
      <dl className="mt-3 grid max-w-md gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{text.storedEnergy}</dt>
          <dd className="font-semibold">{metrics.storedEnergy.toFixed(1)} J</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{text.gain}</dt>
          <dd className="font-semibold">
            {text.perLength(gain.toFixed(1), unitLabel(force), unitLabel(length))}
          </dd>
        </div>
      </dl>
      <p className="mt-2 max-w-prose">{text.reading[gainReading(metrics, setup.bow.drawWeight)]}</p>
      <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.estimated}</p>
    </section>
  )
}
```

- [ ] **Step 6: Run the test**

Run: `npx vitest run src/components/tuning/DrawCurvePanel.test.tsx src/i18n`
Expected: PASS. If "1.9 lb per in" comes out as another value, compute it by hand before touching the test: `38 lb / 19.34 in × (1 − 0.42 + 0.39) = 1.906`.

- [ ] **Step 7: Show the panel in Advanced**

In `src/pages/Simulator.tsx`, import `DrawCurvePanel` and add it right after the `<ResultPanel … />` element, inside the same `div`:

```tsx
                  {advanced && <DrawCurvePanel setup={setup} result={result} units={units} />}
```

- [ ] **Step 8: Look at it**

Run the app (`npm run dev`), open the simulator with headless Chrome at a phone width (390 px) and at a desktop width (1440 px), in Advanced, light and dark, and read the PNGs. Check: the curve bulges above a straight line and ends at the dot; the labels do not overlap the curve or each other; the "Clicker" label stays inside the drawing; nothing is cut off at 390 px. Fix what is wrong before going on.

- [ ] **Step 9: Run everything and commit**

Run: `npx tsc -b && npx vitest run && npx oxlint && npx prettier --check .`
Expected: PASS, no findings.

```bash
git add -A
git commit -m "feat: draw the draw force curve under the result, with stored energy and the gain at the clicker

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The archer's own measurement

Roadmap item finished by this task: own measurement.

**Files:**
- Modify: `src/engine/coefficients/heuristic-0.4.json`, `src/engine/coefficients/coefficients.ts`
- Modify: `src/models/bow.ts`, `src/models/parameters.ts`
- Modify: `src/engine/simulation/drawCurve.ts`, `src/engine/simulation/drawCurve.test.ts`
- Modify: `src/components/tuning/SetupPanels.tsx`, `src/components/tuning/DrawCurveChart.tsx`, `src/components/tuning/DrawCurvePanel.tsx`, `src/components/tuning/DrawCurvePanel.test.tsx`
- Modify: `src/i18n/en.ts`, `src/i18n/vi.ts`, `src/utils/validation.test.ts`
- Modify: `readme/physics-and-calculations.md`, `readme/ROADMAP.md`, `src/pages/roadmap/roadmapData.ts`

**Interfaces:**
- Consumes: everything Task 1 produced.
- Produces:
  - `BowSetup.drawForceNear: number` and `BowSetup.drawForceMid: number`, in N, 0 meaning "not measured".
  - Parameters `bow.drawForceNear` and `bow.drawForceMid`, tier `advanced`, group `curve`.
  - `Coefficients['drawCurve']` gains `nearOffset`, `midOffset` (mm before full draw), `fullnessMin`, `fullnessMax`.
  - `measuredShape(bow, c): CurveShape | null` in `drawCurve.ts`; `drawCurve(bow, c)` now prefers it.
  - `measurementOffsets(c): { near: number; mid: number }` is not needed: the UI reads `HEURISTIC_V0.drawCurve.nearOffset` and `.midOffset` directly.

- [ ] **Step 1: Write the failing tests for the fit**

Add to `src/engine/simulation/drawCurve.test.ts` (extend the import from `./drawCurve.ts` with `measuredShape`):

```ts
describe('fit to measured forces (§39.4)', () => {
  /** The reference bow with the forces a curve of this shape would give on a bow scale. */
  function measuredOn(fullness: number, endRise: number, points: 1 | 2, bow = reference.bow) {
    const stroke = powerStroke(bow)
    const forceAt = (offset: number) =>
      bow.drawWeight * curveForce(shape(fullness, endRise), 1 - offset / stroke)
    return {
      ...bow,
      drawForceNear: forceAt(c.drawCurve.nearOffset),
      drawForceMid: points === 2 ? forceAt(c.drawCurve.midOffset) : 0,
    }
  }

  it('finds both numbers from two points', () => {
    const curve = drawCurve(measuredOn(0.3, 0.6, 2), c)
    expect(curve.measuredPoints).toBe(2)
    expect(curve.fullness).toBeCloseTo(0.3, 9)
    expect(curve.endRise).toBeCloseTo(0.6, 9)
  })

  it('finds the end rise from one point and keeps the fullness of the style', () => {
    const curve = drawCurve(measuredOn(0.42, 0.7, 1), c)
    expect(curve.measuredPoints).toBe(1)
    expect(curve.fullness).toBe(0.42)
    expect(curve.endRise).toBeCloseTo(0.7, 9)
  })

  it('moves the stored energy with a measured fullness', () => {
    expect(storedEnergy(measuredOn(0.3, 0.6, 2), c)).toBeLessThan(storedEnergy(reference.bow, c))
  })

  it('has nothing to fit when nothing is measured', () => {
    expect(measuredShape(reference.bow, c)).toBeNull()
    expect(drawCurve(reference.bow, c).measuredPoints).toBe(0)
  })

  it('does not use a nearer point that is not below the draw weight', () => {
    const bow = { ...reference.bow, drawForceNear: reference.bow.drawWeight }
    expect(measuredShape(bow, c)).toBeNull()
    expect(drawCurve(bow, c)).toEqual(estimatedShape(reference.bow, c))
  })

  it('does not use a farther point that is not below the nearer one', () => {
    const good = measuredOn(0.3, 0.6, 2)
    expect(measuredShape({ ...good, drawForceMid: good.drawForceNear }, c)).toBeNull()
  })

  it('does not use points that ask for a curve no bow has', () => {
    const good = measuredOn(0.3, 0.6, 2)
    // A farther point this light would need a curve far below a straight line.
    expect(measuredShape({ ...good, drawForceMid: good.drawForceMid * 0.4 }, c)).toBeNull()
    // And this heavy, a bulge beyond what limbs do.
    expect(measuredShape({ ...good, drawForceMid: good.drawForceNear * 0.99 }, c)).toBeNull()
  })

  it('does not shape the curve from the farther point alone', () => {
    const bow = { ...measuredOn(0.3, 0.6, 2), drawForceNear: 0 }
    expect(measuredShape(bow, c)).toBeNull()
  })

  it('leaves out a farther point that lies before brace height', () => {
    // 20 in of draw on a 30 cm brace height: a 208 mm power stroke.
    const short = { ...reference.bow, drawLength: 508, braceHeight: 300 }
    const curve = drawCurve(measuredOn(0.42, 0.39, 2, short), c)
    expect(curve.measuredPoints).toBeLessThan(2)
    expect(Number.isFinite(curve.fullness)).toBe(true)
    expect(Number.isFinite(curve.endRise)).toBe(true)
  })
})
```

Add to `src/utils/validation.test.ts`:

```ts
it('opens a setup saved before measured forces existed', () => {
  const current = createDefaultSetup()
  const { drawForceNear: _near, drawForceMid: _mid, ...oldBow } = current.bow
  const parsed = parseSetup({ ...current, bow: oldBow })
  expect(parsed.ok && parsed.setup.bow.drawForceNear).toBe(0)
  expect(parsed.ok && parsed.setup.bow.drawForceMid).toBe(0)
})
```

Run: `npx vitest run src/engine/simulation/drawCurve.test.ts`
Expected: FAIL, `measuredShape` is not exported and `c.drawCurve.nearOffset` is undefined.

- [ ] **Step 2: Add the coefficients**

In `heuristic-0.4.json`, add to `drawCurve`:

```json
    "nearOffset": 50.8,
    "midOffset": 203.2,
    "fullnessMin": -0.3,
    "fullnessMax": 0.9
```

In `coefficients.ts`, add to the `drawCurve` type:

```ts
    /** mm before full draw at which the archer reads the bow scale: 2 in, and 8 in for the second point. */
    nearOffset: number
    midOffset: number
    /** A measured fullness outside these is taken as a misreading, not as a bow. */
    fullnessMin: number
    fullnessMax: number
```

- [ ] **Step 3: Add the two forces to the bow and the parameter table**

In `src/models/bow.ts`, add to `BowSetup` after `drawCurve`:

```ts
  /** N, read from a bow scale 2 in before full draw. 0 when not measured */
  drawForceNear: number
  /** N, the same 8 in before full draw. 0 when not measured */
  drawForceMid: number
```

In `src/models/parameters.ts`:

- `export type ParameterGroup = 'size' | 'bow' | 'arrow' | 'curve'`, and extend its comment with "`curve` is what the archer measured of the draw force curve."
- Add next to `SIZE_KEYS`: `const CURVE_KEYS = ['bow.drawForceNear', 'bow.drawForceMid']`, and in `groupOf`, before the `arrow.` line: `if (CURVE_KEYS.includes(key)) return 'curve'`.
- Add to `HINTS`:

```ts
  'bow.drawForceNear': 'Read from a bow scale, at the brace height of this setup. 0 means not measured.',
  'bow.drawForceMid': 'A second reading, used only together with the first. 0 means not measured.',
```

- Add to `PARAMETERS`, after `bow.drawCurve`:

```ts
  num('bow.drawForceNear', 'advanced', 'Force 2 in before full draw', {
    units: ['N', 'lbf'],
    min: 0,
    max: 80,
    default: 0,
    step: 0.5,
  }),
  num('bow.drawForceMid', 'advanced', 'Force 8 in before full draw', {
    units: ['N', 'lbf'],
    min: 0,
    max: 80,
    default: 0,
    step: 0.5,
  }),
```

In `src/i18n/vi.ts`, add to `parameter`:

```ts
    'bow.drawForceNear': {
      label: 'Lực ở trước full draw 2 in',
      hint: 'Đọc từ cân cung, ở đúng brace height của setup này. 0 nghĩa là chưa đo.',
    },
    'bow.drawForceMid': {
      label: 'Lực ở trước full draw 8 in',
      hint: 'Số đo thứ hai, chỉ dùng khi đã có số đo thứ nhất. 0 nghĩa là chưa đo.',
    },
```

- [ ] **Step 4: Write the fit**

In `src/engine/simulation/drawCurve.ts`, replace `drawCurve` with:

```ts
/**
 * The curve through the forces the archer read from a bow scale (spec §39.4):
 * one point gives the end rise, two give the fullness as well. Null when
 * nothing is measured, or when the points do not describe a bow.
 */
export function measuredShape(bow: BowSetup, c: Coefficients): CurveShape | null {
  const d = c.drawCurve
  const stroke = powerStroke(bow)
  const near = bow.drawForceNear > 0 ? { u: 1 - d.nearOffset / stroke, force: bow.drawForceNear } : null
  if (!near || near.force >= bow.drawWeight) return null
  // A second point that lies at or before brace height is not on the curve.
  const midU = 1 - d.midOffset / stroke
  const mid = bow.drawForceMid > 0 && midU > 0.05 ? { u: midU, force: bow.drawForceMid } : null
  if (mid && mid.force >= near.force) return null

  // What the point lies above the straight line, as a share of the draw weight.
  const lift = (point: { u: number; force: number }) => point.force / bow.drawWeight - point.u
  let shape: CurveShape
  if (mid) {
    // Two equations, linear in fullness and end rise.
    const determinant = hump(near.u) * sway(mid.u) - hump(mid.u) * sway(near.u)
    if (Math.abs(determinant) < 1e-9) return null
    shape = {
      fullness: (lift(near) * sway(mid.u) - lift(mid) * sway(near.u)) / determinant,
      endRise: (hump(near.u) * lift(mid) - hump(mid.u) * lift(near)) / determinant,
      measuredPoints: 2,
    }
  } else {
    if (Math.abs(sway(near.u)) < 1e-9) return null
    const { fullness } = estimatedShape(bow, c)
    shape = {
      fullness,
      endRise: (lift(near) - fullness * hump(near.u)) / sway(near.u),
      measuredPoints: 1,
    }
  }
  const plausible =
    Number.isFinite(shape.endRise) &&
    shape.fullness >= d.fullnessMin &&
    shape.fullness <= d.fullnessMax &&
    rises(shape)
  return plausible ? shape : null
}

/** The curve the model uses for this bow: the measured one where there is one. */
export function drawCurve(bow: BowSetup, c: Coefficients): CurveShape {
  return measuredShape(bow, c) ?? estimatedShape(bow, c)
}
```

Run `npx prettier --write src/engine/simulation/drawCurve.ts`.

Run: `npx vitest run src/engine/simulation src/utils/validation.test.ts`
Expected: PASS, including the property tests of Task 1, which now meet random measured forces: most are refused and the estimate stands. If "does not use points that ask for a curve no bow has" fails on its second case, the point was still plausible: print the fitted `fullness` and move the factor `0.99` toward 1 only if the fit is inside `fullnessMax`; do not loosen the bounds to make a test pass.

- [ ] **Step 5: Write the failing tests for the page**

Add to `src/components/tuning/DrawCurvePanel.test.tsx`:

```tsx
describe('with the archer’s own measurement', () => {
  const c = HEURISTIC_V0.drawCurve
  const stroke = reference.bow.drawLength - reference.bow.braceHeight
  // Forces of a curve with fullness 0.3 and end rise 0.6, at the two places.
  const force = (offset: number) => {
    const u = 1 - offset / stroke
    return reference.bow.drawWeight * (u + 0.3 * u * (1 - u) + 0.6 * u * (1 - u) * (1 - 2 * u))
  }
  const measured = (near: number, mid: number) => ({
    ...reference,
    bow: { ...reference.bow, drawForceNear: near, drawForceMid: mid },
  })

  it('says how many points shaped the curve, and marks them on the chart', () => {
    show(measured(force(c.nearOffset), force(c.midOffset)))
    expect(screen.getByText('Shaped by 2 forces from your bow scale.')).toBeTruthy()
    expect(screen.queryByText(/Estimated from the bow size/)).toBeNull()
    expect(screen.getByRole('img').querySelectorAll('circle[data-measured]')).toHaveLength(2)
  })

  it('reminds that a measurement belongs to one draw weight, draw length and brace height', () => {
    show(measured(force(c.nearOffset), 0))
    expect(screen.getByText('Shaped by 1 force from your bow scale.')).toBeTruthy()
    expect(screen.getByText(/Measure again after changing/)).toBeTruthy()
  })

  it('says so when the forces entered are not used', () => {
    show(measured(reference.bow.drawWeight + 5, 0))
    expect(screen.getByRole('status').textContent).toMatch(/do not fit a draw force curve/)
    expect(screen.getByText(/Estimated from the bow size/)).toBeTruthy()
  })

  it('says so when only the second force is entered', () => {
    show(measured(0, force(c.midOffset)))
    expect(screen.getByRole('status').textContent).toMatch(/do not fit a draw force curve/)
  })
})
```

Add `HEURISTIC_V0` to the test's import from `../../engine/index.ts`.

Run: `npx vitest run src/components/tuning/DrawCurvePanel.test.tsx`
Expected: the four new tests FAIL.

- [ ] **Step 6: Add the texts**

In `src/i18n/en.ts`, add to `panels`: `curve: 'Draw force, measured',` and to `curve`:

```ts
    measured: (points: number) =>
      points === 1
        ? 'Shaped by 1 force from your bow scale.'
        : `Shaped by ${points} forces from your bow scale.`,
    measureAgain:
      'A measured force belongs to one draw weight, draw length and brace height. Measure again after changing any of them.',
    notUsed:
      'The forces entered do not fit a draw force curve, so the estimate is shown. The force 2 in before full draw must be below the draw weight, and the one 8 in before it lower still; the second is used only together with the first.',
```

In `src/i18n/vi.ts`, add to `panels`: `curve: 'Lực kéo tự đo',` and to `curve`:

```ts
    measured: (points: number) => `Dựng từ ${points} số đo trên cân cung của bạn.`,
    measureAgain:
      'Số đo chỉ đúng với một lực kéo, một draw length và một brace height. Đổi một trong ba thì phải đo lại.',
    notUsed:
      'Các số đo đã nhập không khớp với một đường lực kéo, nên đang hiện đường ước lượng. Lực ở trước full draw 2 in phải nhỏ hơn lực kéo, lực ở trước 8 in phải nhỏ hơn nữa; số đo thứ hai chỉ dùng khi đã có số đo thứ nhất.',
```

- [ ] **Step 7: Show the measurement**

In `src/components/tuning/DrawCurveChart.tsx`, import `HEURISTIC_V0` from the engine and, inside the `<g>` of the last curve only, after its end dot, add the measured points as rings:

```tsx
            {last &&
              curve.shape.measuredPoints > 0 &&
              (
                [
                  [HEURISTIC_V0.drawCurve.nearOffset, curve.bow.drawForceNear],
                  [HEURISTIC_V0.drawCurve.midOffset, curve.bow.drawForceMid],
                ] as const
              )
                .slice(0, curve.shape.measuredPoints)
                .map(([offset, newtons]) => (
                  <circle
                    key={offset}
                    data-measured
                    cx={x(curve.bow.drawLength - offset)}
                    cy={y(newtons)}
                    r="5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-accent"
                  />
                ))}
```

In `src/components/tuning/DrawCurvePanel.tsx`, replace the last `<p>` (the one with `text.estimated`) with:

```tsx
      {entered > metrics.curveMeasuredPoints && (
        <p
          role="status"
          className="border-gold bg-gold/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2"
        >
          {text.notUsed}
        </p>
      )}
      {metrics.curveMeasuredPoints === 0 ? (
        <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.estimated}</p>
      ) : (
        <>
          <p className="mt-1 max-w-prose text-sm">{text.measured(metrics.curveMeasuredPoints)}</p>
          <p className="text-ink-muted max-w-prose text-sm">{text.measureAgain}</p>
        </>
      )}
```

and add above the `return`:

```tsx
  // Forces the archer entered. More of them than the curve used means some were refused.
  const entered = [setup.bow.drawForceNear, setup.bow.drawForceMid].filter(
    (newtons) => newtons > 0,
  ).length
```

The two sentences are two paragraphs on purpose: the tests find each by its whole text, and `getByText` with a string matches the full text of an element.

In `src/components/tuning/SetupPanels.tsx`:

- In `AssumedValues`, leave the measured forces out of what is "assumed": `const hidden = PARAMETERS.filter((parameter) => parameter.tier === 'advanced' && parameter.group !== 'curve')`.
- In `SetupPanels`, after the arrow block, add:

```tsx
      {mode === 'advanced' && <ParameterPanel group="curve" title={m.panels.curve} />}
```

- [ ] **Step 8: Run everything**

Run: `npx tsc -b && npx vitest run && npx oxlint && npx prettier --check .`
Expected: PASS. `tsc` will name any hand-written `BowSetup` that lacks the two new fields; add `drawForceNear: 0, drawForceMid: 0` there. The `SetupPanels` test that looks for every parameter label in Advanced passes because the new section renders the two forces. If a test counts the assumed values of Simple mode, the count must not have changed.

- [ ] **Step 9: Look at it**

In headless Chrome, Advanced, at 390 px and 1440 px: enter 36 lb and 25 lb for the two forces on the default setup. Check the two rings lie on the curve, the source line reads "Shaped by 2 forces…", and the new section sits below the arrow inputs. Then enter 40 lb for the first force and check the notice appears and the curve goes back to the estimate.

- [ ] **Step 10: Update the documentation and the roadmap**

In `readme/physics-and-calculations.md`, add after the curve formulas of section 5.1:

````markdown
Khi người bắn nhập lực đo bằng cân cung, hai số `h` và `k` lấy từ số đo thay cho ước lượng. Với `L = F_đo / drawWeight − u` tại mỗi điểm:

```text
một điểm (trước full draw 2 in):   k = (L₁ − h·u₁(1−u₁)) / (u₁(1−u₁)(1−2u₁))      h giữ theo kiểu đường cong
hai điểm (thêm trước full draw 8 in): giải hệ hai phương trình bậc nhất theo h và k
```

Số đo bị bỏ, và ước lượng được dùng lại, khi: điểm gần không nhỏ hơn lực kéo, điểm xa không nhỏ hơn điểm gần, `h` ra ngoài −0.3 … 0.9, hoặc đường cong không tăng suốt hành trình. Điểm xa nằm trước brace height thì không tính.
````

Tick the fourth item of "Draw force curve" in `readme/ROADMAP.md` and turn the fourth `todo(` of the group into `done(` in `roadmapData.ts`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: shape the draw force curve from forces the archer measured

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The curves of compared setups on one chart

Roadmap item finished by this task: the curve as a chart.

**Files:**
- Modify: `src/components/compare/Comparison.tsx`, `src/components/compare/Comparison.test.tsx`
- Modify: `src/i18n/en.ts`, `src/i18n/vi.ts`
- Modify: `readme/ROADMAP.md`, `src/pages/roadmap/roadmapData.ts`

**Interfaces:**
- Consumes: `DrawCurveChart`, `ChartCurve` from `src/components/tuning/DrawCurveChart.tsx`; `shapeOf` from the engine; `Compared` (`{ setup, result }`) already in `Comparison.tsx`.
- Produces: a third block in `ComparisonTable`, and rows for stored energy and gain at the clicker in its result table.

- [ ] **Step 1: Write the failing test**

Read the top of `src/components/compare/Comparison.test.tsx` for how it renders `ComparisonTable` with a saved setup and the one on screen, and add in the same style, importing `getParameter`, `setValue` and `heuristicModel` if the file does not have them yet:

```tsx
it('draws the draw force curves of all sides on one chart', () => {
  const saved = createDefaultSetup('Before')
  const now = setValue(saved, getParameter('bow.drawCurve'), 'FULL')
  render(
    <ComparisonTable
      saved={[{ setup: saved, result: heuristicModel.simulate(saved) }]}
      now={{ setup: now, result: heuristicModel.simulate(now) }}
      units="archery"
    />,
  )
  expect(screen.getByRole('heading', { name: 'Draw force curve' })).toBeTruthy()
  expect(screen.getByRole('img').querySelectorAll('polyline')).toHaveLength(2)
  const energy = screen.getByRole('row', { name: /Stored in the bow/ })
  const cells = [...energy.querySelectorAll('td')].map((cell) => cell.textContent)
  expect(cells).toHaveLength(2)
  expect(Number.parseFloat(cells[1]!)).toBeGreaterThan(Number.parseFloat(cells[0]!))
})
```

Run: `npx vitest run src/components/compare`
Expected: FAIL, no heading "Draw force curve".

- [ ] **Step 2: Add the rows and the chart**

In `src/components/compare/Comparison.tsx`, import `shapeOf` from `../../engine/index.ts`, `DrawCurveChart` and `curveUnits` from `../tuning/DrawCurveChart.tsx`, and `convert`, `unitLabel` from `../../utils/units.ts`.

In `ComparisonTable`, after the `speed` helper, add:

```tsx
  const { length, force } = curveUnits(units)
  const gain = (result: SimulationResult) =>
    m.curve.perLength(
      (convert(result.metrics.clickerGain, 'N', force) * convert(1, length, 'mm')).toFixed(1),
      unitLabel(force),
      unitLabel(length),
    )
```

and extend `results` with two rows after the speed row:

```tsx
    {
      label: m.curve.storedEnergy,
      values: sides.map((side) => `${side.result.metrics.storedEnergy.toFixed(1)} J`),
    },
    { label: m.curve.gain, values: sides.map((side) => gain(side.result)) },
```

After the results table and before the closing note, add:

```tsx
      <h2 className="font-display mt-6 text-xl font-semibold">{m.curve.heading}</h2>
      <div className="mt-2">
        <DrawCurveChart
          curves={sides.map((side) => ({
            name: side.setup.name,
            bow: side.setup.bow,
            shape: shapeOf(side.result.metrics),
          }))}
          units={units}
        />
      </div>
      <p className="text-ink-muted mt-1 max-w-prose text-sm">{m.curve.compared}</p>
```

In `src/i18n/en.ts`, add to `curve`: `compared: 'The solid line is the setup on screen; dashed lines are the saved ones.',`
In `src/i18n/vi.ts`: `compared: 'Nét liền là setup đang mở; nét đứt là các setup đã lưu.',`

- [ ] **Step 3: Run, look, update the roadmap, commit**

Run: `npx tsc -b && npx vitest run && npx oxlint && npx prettier --check .`
Expected: PASS.

In headless Chrome, save the default setup, change the curve style to "Full in mid-draw" and the draw length to 30 in, open "Compare", and read the PNG at 390 px and 1440 px: two curves, the dashed one ending lower and to the left, both inside the axes.

Tick the fifth item of "Draw force curve" in `readme/ROADMAP.md`, and turn the fifth `todo(` into `done(` in `roadmapData.ts`.

```bash
git add -A
git commit -m "feat: compare the draw force curves of saved setups on one chart

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: From the draw weight marked on the limbs to the force on the fingers

Roadmap item finished by this task: the marked draw weight helper.

**Files:**
- Create: `src/utils/markedDrawWeight.ts`, `src/utils/markedDrawWeight.test.ts`
- Create: `src/components/tuning/MarkedWeightHelper.tsx`, `src/components/tuning/MarkedWeightHelper.test.tsx`
- Modify: `src/components/tuning/DrawCurvePanel.tsx`, `src/i18n/en.ts`, `src/i18n/vi.ts`
- Modify: `readme/physics-and-calculations.md`, `readme/ROADMAP.md`, `src/pages/roadmap/roadmapData.ts`

**Interfaces:**
- Consumes: `useTuningStore` (`setup`, `setParameter`) from `src/state/tuningStore.ts`; `getParameter`, `NumberParameter` from `src/models/parameters.ts`; `clampValue` from `src/utils/validation.ts`; `convert` from `src/utils/units.ts`; `inputClass`, `buttonClass` from `src/components/common/styles.ts`.
- Produces: `onFingers(marked: number, drawLength: number, bolt: number): number` (N, mm, share from −0.05 to 0.05); `MARKED_AT_DRAW`, `GAIN_PER_INCH`, `BOLT_RANGE`; `<MarkedWeightHelper />`.

- [ ] **Step 1: Write the failing test for the arithmetic**

Create `src/utils/markedDrawWeight.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { convert } from './units.ts'
import { BOLT_RANGE, onFingers } from './markedDrawWeight.ts'

const lb = (value: number) => convert(value, 'lbf', 'N')
const inches = (value: number) => convert(value, 'in', 'mm')

describe('marked draw weight (§39.6)', () => {
  it('is the marked weight at 28 in with the limb bolts in the middle', () => {
    expect(onFingers(lb(38), inches(28), 0)).toBeCloseTo(lb(38), 9)
  })

  it('gains 5% per inch of draw beyond 28 in, and loses it short of 28 in', () => {
    expect(onFingers(lb(40), inches(29), 0)).toBeCloseTo(lb(42), 9)
    expect(onFingers(lb(40), inches(26), 0)).toBeCloseTo(lb(36), 9)
  })

  it('moves by the share the limb bolts are turned', () => {
    expect(onFingers(lb(40), inches(28), BOLT_RANGE)).toBeCloseTo(lb(42), 9)
    expect(onFingers(lb(40), inches(28), -BOLT_RANGE)).toBeCloseTo(lb(38), 9)
  })

  it('stays positive at the shortest draw the app accepts', () => {
    expect(onFingers(lb(20), inches(20), -BOLT_RANGE)).toBeGreaterThan(0)
  })
})
```

Run: `npx vitest run src/utils/markedDrawWeight.test.ts`
Expected: FAIL, cannot resolve `./markedDrawWeight.ts`.

- [ ] **Step 2: Write it**

Create `src/utils/markedDrawWeight.ts`:

```ts
// From what is marked on the limbs to the force on the fingers (spec §39.6).
// A rule of thumb, not part of the model: limbs are marked at 28 in AMO on a
// 25 in riser with the limb bolts in the middle, and a recurve near that draw
// gains about 5% of its weight per inch.

/** mm, the draw length limbs are marked at: 28 in AMO */
export const MARKED_AT_DRAW = 711.2

/** Share of the marked weight gained per inch of draw. */
export const GAIN_PER_INCH = 0.05

/** Share of the draw weight the limb bolts take off or add, from all the way out to all the way in. */
export const BOLT_RANGE = 0.05

/**
 * N on the fingers, for a marked weight in N, a draw length in mm, and the limb
 * bolts as a share from `-BOLT_RANGE` (out) to `BOLT_RANGE` (in).
 */
export function onFingers(marked: number, drawLength: number, bolt: number): number {
  const beyond = (drawLength - MARKED_AT_DRAW) / 25.4
  return marked * (1 + GAIN_PER_INCH * beyond) * (1 + bolt)
}
```

Run: `npx vitest run src/utils/markedDrawWeight.test.ts`
Expected: PASS.

- [ ] **Step 3: Add the texts**

In `src/i18n/en.ts`, add to `curve`:

```ts
    marked: {
      open: 'I only know what is marked on the limbs',
      weight: 'Marked on the limbs, lb',
      bolts: 'Limb bolts',
      bolt: { OUT: 'All the way out', MIDDLE: 'Middle', IN: 'All the way in' },
      estimate: (weight: string, length: string) =>
        `About ${weight} on the fingers at your draw length of ${length}.`,
      use: 'Use as draw weight',
      note: 'An estimate: 5% per inch from 28 in, and 5% either way for the limb bolts. A bow scale at full draw is better. Draw length here is AMO: from the nocking point to the pivot point of the grip, plus 1.75 in.',
    },
```

In `src/i18n/vi.ts`:

```ts
    marked: {
      open: 'Tôi chỉ biết số ghi trên limb',
      weight: 'Số ghi trên limb, lb',
      bolts: 'Limb bolt',
      bolt: { OUT: 'Nới hết', MIDDLE: 'Ở giữa', IN: 'Vặn hết' },
      estimate: (weight: string, length: string) =>
        `Khoảng ${weight} trên ngón tay ở draw length ${length} của bạn.`,
      use: 'Dùng làm lực kéo',
      note: 'Chỉ là ước lượng: 5% mỗi inch tính từ 28 in, và 5% mỗi chiều cho limb bolt. Cân cung ở full draw thì chính xác hơn. Draw length ở đây là AMO: từ nocking point tới pivot point của grip, cộng 1,75 in.',
    },
```

- [ ] **Step 4: Write the failing test for the helper**

Create `src/components/tuning/MarkedWeightHelper.test.tsx`:

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDefaultSetup } from '../../models/setup.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { convert } from '../../utils/units.ts'
import { MarkedWeightHelper } from './MarkedWeightHelper.tsx'

afterEach(cleanup)
beforeEach(() => {
  useTuningStore.setState({ setup: createDefaultSetup(), language: 'en', units: 'archery' })
})

const open = async () => {
  render(<MarkedWeightHelper />)
  await userEvent.click(screen.getByRole('button', { name: /only know what is marked/ }))
}

describe('marked draw weight helper', () => {
  it('stays folded until asked for', () => {
    render(<MarkedWeightHelper />)
    expect(screen.queryByRole('spinbutton')).toBeNull()
  })

  it('estimates the force on the fingers at the draw length of the setup', async () => {
    useTuningStore.getState().setParameter('bow.drawLength', convert(29, 'in', 'mm'))
    await open()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '40')
    expect(screen.getByText(/About 42\.0 lb on the fingers at your draw length of 29\.0 in/)).toBeTruthy()
  })

  it('follows the limb bolts', async () => {
    await open()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '40')
    await userEvent.click(screen.getByRole('radio', { name: 'All the way in' }))
    expect(screen.getByText(/About 42\.0 lb/)).toBeTruthy()
  })

  it('puts the estimate into the draw weight when asked', async () => {
    await open()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '40')
    await userEvent.click(screen.getByRole('button', { name: 'Use as draw weight' }))
    expect(useTuningStore.getState().setup.bow.drawWeight).toBeCloseTo(convert(40, 'lbf', 'N'), 9)
  })

  it('offers nothing to use before a weight is typed, or for one that is not a number', async () => {
    await open()
    expect(screen.queryByRole('button', { name: 'Use as draw weight' })).toBeNull()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '-')
    expect(screen.queryByRole('button', { name: 'Use as draw weight' })).toBeNull()
  })

  it('keeps the draw weight inside what the app accepts', async () => {
    await open()
    await userEvent.type(screen.getByRole('spinbutton', { name: /Marked on the limbs/ }), '500')
    await userEvent.click(screen.getByRole('button', { name: 'Use as draw weight' }))
    expect(useTuningStore.getState().setup.bow.drawWeight).toBeCloseTo(convert(80, 'lbf', 'N'), 9)
  })
})
```

Check how `SetupPanels.test.tsx` resets the store and sets the language before each test, and do it the same way if it differs from the `beforeEach` above.

Run: `npx vitest run src/components/tuning/MarkedWeightHelper.test.tsx`
Expected: FAIL, cannot resolve `./MarkedWeightHelper.tsx`.

- [ ] **Step 5: Write the helper**

Create `src/components/tuning/MarkedWeightHelper.tsx`. `SegmentedControl` is the component `SetupPanels.tsx` uses for choices; read its props there (`label`, `options`, `value`, `onChange`) before using it.

```tsx
import { useState } from 'react'
import { useMessages } from '../../i18n/useMessages.ts'
import { getParameter, type NumberParameter } from '../../models/parameters.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { BOLT_RANGE, onFingers } from '../../utils/markedDrawWeight.ts'
import { convert } from '../../utils/units.ts'
import { clampValue } from '../../utils/validation.ts'
import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { buttonClass, inputClass } from '../common/styles.ts'

const BOLTS = { OUT: -BOLT_RANGE, MIDDLE: 0, IN: BOLT_RANGE } as const
type Bolt = keyof typeof BOLTS

/** For an archer who has no bow scale: an estimate of the draw weight from the limb marking. */
export function MarkedWeightHelper() {
  const m = useMessages()
  const text = m.curve.marked
  const drawLength = useTuningStore((state) => state.setup.bow.drawLength)
  const setParameter = useTuningStore((state) => state.setParameter)
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [bolt, setBolt] = useState<Bolt>('MIDDLE')

  // Limbs are marked in pounds whatever units the rest of the page shows.
  const marked = Number(typed)
  const usable = typed.trim() !== '' && Number.isFinite(marked) && marked > 0
  const estimate = usable ? onFingers(convert(marked, 'lbf', 'N'), drawLength, BOLTS[bolt]) : 0

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="marked-weight"
        onClick={() => setOpen(!open)}
        className="text-accent focus-visible:outline-accent min-h-11 cursor-pointer rounded-md text-left font-medium underline underline-offset-4 focus-visible:outline-2"
      >
        {text.open}
      </button>
      {open && (
        <div id="marked-weight" className="mt-2 grid max-w-md gap-3">
          <label className="grid gap-1">
            <span className="text-ink-muted">{text.weight}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              className={inputClass}
            />
          </label>
          <SegmentedControl
            label={text.bolts}
            options={(Object.keys(BOLTS) as Bolt[]).map((value) => ({
              value,
              label: text.bolt[value],
            }))}
            value={bolt}
            onChange={(value) => setBolt(value as Bolt)}
          />
          {usable && (
            <>
              <p className="font-medium">
                {text.estimate(
                  `${convert(estimate, 'N', 'lbf').toFixed(1)} lb`,
                  `${convert(drawLength, 'mm', 'in').toFixed(1)} in`,
                )}
              </p>
              <button
                type="button"
                className={buttonClass}
                onClick={() =>
                  setParameter(
                    'bow.drawWeight',
                    clampValue(getParameter('bow.drawWeight') as NumberParameter, estimate),
                  )
                }
              >
                {text.use}
              </button>
            </>
          )}
          <p className="text-ink-muted text-sm">{text.note}</p>
        </div>
      )}
    </div>
  )
}
```

In `src/components/tuning/DrawCurvePanel.tsx`, import `MarkedWeightHelper` and render `<MarkedWeightHelper />` as the last child of the `<section>`.

`DrawCurvePanel.test.tsx` renders the panel without touching the store, which still works: the helper reads the store's default setup and stays folded.

- [ ] **Step 6: Run, look, document, commit**

Run: `npx tsc -b && npx vitest run && npx oxlint && npx prettier --check .`
Expected: PASS. If a jsdom number input swallows `-` so the "not a number" case sees an empty field, the test still holds: there is nothing to use.

In headless Chrome at 390 px, Advanced: open the helper, type 40, pick "All the way in", and read the PNG: the three bolt choices fit in one row or wrap cleanly, the estimate reads "About 42.0 lb…", the button is at least 44 px high.

In `readme/physics-and-calculations.md`, add a short section after 5.1:

````markdown
### 5.1b Từ số ghi trên limb ra lực trên ngón tay

Không thuộc mô hình; chỉ là quy tắc quen dùng, để người chưa có cân cung điền được lực kéo:

```text
lực_trên_ngón = số_ghi · (1 + 0.05 · (drawLength − 28 in)) · (1 + bolt)        bolt từ −5% tới +5%
```

Số ghi trên limb được hiểu là ở 28 in AMO, riser 25 in, limb bolt ở giữa. Nguồn và giới hạn ở tuning-references.md mục 8.1.
````

Tick the sixth item of "Draw force curve" in `readme/ROADMAP.md`, turn the sixth `todo(` into `done(` in `roadmapData.ts`, and in the pinned list of both files tick "Duyệt thiết kế đường lực kéo ở spec §39" (`- [x]` and `done: true`). In spec §39, change the status line to "Status: built as designed (2026-10-06). The coefficients of §39.3 are still estimates; the owner's own measurement is pinned in the roadmap."

Run: `npx vitest run src/pages/roadmap && npx prettier --check .`
Expected: PASS.

```bash
git add -A
git commit -m "feat: estimate the draw weight from what is marked on the limbs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
