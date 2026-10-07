import type { Handedness } from '../../models/bow.ts'
import type { Mark, TargetPlot } from '../../models/observation.ts'
import { getParameter, type NumberParameter } from '../../models/parameters.ts'
import type { BareShaftComparison } from '../../models/simulation.ts'
import type { SetupInput, SimulationModel } from '../simulation/simulate.ts'

// Reading a real target. Nothing here is a model result: the arrows in the
// target are the evidence, and the model is only asked whether it reads the
// setup the same way. Lengths are in mm.

export type PlotReading = {
  /** How far the target was shot from. */
  distance: number
  /** Enough arrows to say anything at all. */
  enough: boolean
  fletchedCount: number
  bareCount: number
  /** Middle of the fletched group. */
  fletchedCenter: { x: number; y: number }
  /** Average distance of the fletched arrows from their own middle. */
  spread: number
  /** Bare shafts relative to the fletched group. */
  offset: { x: number; y: number }
  offsetLength: number
  /** 1..12, direction of the bare shafts from the fletched group, as on a clock face */
  clock: number
  /** False when the offset is small against the spread of the group. */
  conclusive: boolean
  horizontal: 'WEAK' | 'STIFF' | 'OK'
  vertical: 'NOCK_HIGH' | 'NOCK_LOW' | 'OK'
  /** The same reading in the words of the bare shaft test, to set beside the model. */
  bareHorizontal: BareShaftComparison['horizontal']
  bareVertical: BareShaftComparison['vertical']
}

export const MIN_FLETCHED = 3
export const MIN_BARE = 1

/**
 * An offset under this is within what a bare shaft does on its own: 15 mm at
 * 18 m, taken to grow with the distance. HEURISTIC.
 */
function leastOffset(distance: number): number {
  return 15 * (distance / 18_000)
}

/**
 * How far to the side the plunger alone will most likely bring the bare shaft
 * back. Total Archery gives 3 in at 30 m; scaling it with the distance is an
 * assumption.
 */
export function plungerReach(distance: number): number {
  return 76 * (distance / 30_000)
}

/**
 * How far to the side the bare shaft may stay, after the bow has been
 * adjusted, before the shaft is the wrong one. The Easton guide gives 6 in at
 * 20 yd (15 cm at 18 m); scaling it with the distance is an assumption.
 */
export function shaftLimit(distance: number): number {
  return 150 * (distance / 18_000)
}

function center(marks: Mark[]): { x: number; y: number } {
  const total = marks.reduce((sum, mark) => ({ x: sum.x + mark.x, y: sum.y + mark.y }), {
    x: 0,
    y: 0,
  })
  return { x: total.x / marks.length, y: total.y / marks.length }
}

/** Reads a bare shaft test from marks on a target face. Ends are added up. */
export function readPlot(plot: TargetPlot, handedness: Handedness): PlotReading {
  const fletched = plot.marks.filter((mark) => !mark.bare)
  const bare = plot.marks.filter((mark) => mark.bare)
  const enough = fletched.length >= MIN_FLETCHED && bare.length >= MIN_BARE

  const fletchedCenter = fletched.length > 0 ? center(fletched) : { x: 0, y: 0 }
  const spread =
    fletched.length > 0
      ? fletched.reduce(
          (sum, mark) => sum + Math.hypot(mark.x - fletchedCenter.x, mark.y - fletchedCenter.y),
          0,
        ) / fletched.length
      : 0
  const bareCenter = bare.length > 0 ? center(bare) : fletchedCenter
  const offset = { x: bareCenter.x - fletchedCenter.x, y: bareCenter.y - fletchedCenter.y }
  const offsetLength = Math.hypot(offset.x, offset.y)

  // 12 o'clock is straight up, 3 o'clock is to the right.
  const hours = Math.round((Math.atan2(offset.x, offset.y) / (2 * Math.PI)) * 12)
  const clock = ((hours + 11) % 12) + 1

  const conclusive = enough && offsetLength > Math.max(leastOffset(plot.distance), spread * 0.75)
  // One direction only counts when it carries a real share of the offset.
  const counts = (component: number) => conclusive && Math.abs(component) > offsetLength * 0.4
  const weakSide = handedness === 'RH' ? 1 : -1
  const sideways = counts(offset.x)
  const upDown = counts(offset.y)

  return {
    distance: plot.distance,
    enough,
    fletchedCount: fletched.length,
    bareCount: bare.length,
    fletchedCenter,
    spread,
    offset,
    offsetLength,
    clock,
    conclusive,
    horizontal: sideways ? (Math.sign(offset.x) === weakSide ? 'WEAK' : 'STIFF') : 'OK',
    vertical: upDown ? (offset.y < 0 ? 'NOCK_HIGH' : 'NOCK_LOW') : 'OK',
    bareHorizontal: sideways ? (offset.x < 0 ? 'LEFT' : 'RIGHT') : 'TOGETHER',
    bareVertical: upDown ? (offset.y < 0 ? 'LOW' : 'HIGH') : 'TOGETHER',
  }
}

export type DiagnosisCause =
  'centerShot' | 'nockingPoint' | 'plunger' | 'point' | 'drawWeight' | 'shaft'

/** One thing to try on the bow, with the value it changes and which way. */
export type DiagnosisStep = {
  cause: DiagnosisCause
  parameterKey: string
  direction: 'increase' | 'decrease'
}

export type Diagnosis = {
  /** The model reads the setup, as entered, the way the target shows it. */
  agrees: boolean
  /** In the order the tuning guides work in. */
  steps: DiagnosisStep[]
}

/** Share of the plunger's range, from either end, inside which it has no travel left. */
const PLUNGER_END = 0.1

/**
 * Turns the reading of a target into things to try, in the order the tuning
 * guides work in (readme/tuning-references.md §5 and §9.7). The setup as
 * entered chooses between causes: a center shot that was moved the way the
 * target shows comes first, and a plunger with no travel left is passed over.
 */
export function diagnosePlot(
  reading: PlotReading,
  setup: SetupInput,
  model: SimulationModel,
): Diagnosis {
  if (!reading.conclusive) return { agrees: true, steps: [] }

  const comparison = model.compareBareShaft(setup)
  const agrees =
    comparison.horizontal === reading.bareHorizontal && comparison.vertical === reading.bareVertical
  const steps: DiagnosisStep[] = []

  if (reading.vertical !== 'OK') {
    steps.push({
      cause: 'nockingPoint',
      parameterKey: 'bow.nockingPointHeight',
      direction: reading.vertical === 'NOCK_HIGH' ? 'decrease' : 'increase',
    })
  }

  if (reading.horizontal !== 'OK') {
    const weak = reading.horizontal === 'WEAK'
    const { bow } = setup
    const sideways = Math.abs(reading.offset.x)
    // Toward the weak side of the target, in the direction a value has to go.
    const stiffen = weak ? 'increase' : 'decrease'
    const lighten = weak ? 'decrease' : 'increase'

    // A point set toward the riser sends the bare shaft to the weak side, and
    // away from it to the stiff side. The riser is on the right of a
    // right-handed archer's arrow, which is the positive side.
    const centerShot = getParameter('bow.centerShot') as NumberParameter
    const moved = (bow.centerShot - centerShot.default) * (bow.handedness === 'RH' ? 1 : -1)
    if (weak ? moved > 0 : moved < 0) {
      steps.unshift({
        cause: 'centerShot',
        parameterKey: centerShot.key,
        direction: bow.centerShot > centerShot.default ? 'decrease' : 'increase',
      })
    }

    const plunger = getParameter('bow.plungerStiffness') as NumberParameter
    const travel = (plunger.max - plunger.min) * PLUNGER_END
    const plungerSpent = weak
      ? bow.plungerStiffness > plunger.max - travel
      : bow.plungerStiffness < plunger.min + travel
    if (!plungerSpent) {
      steps.push({ cause: 'plunger', parameterKey: plunger.key, direction: stiffen })
    }
    if (plungerSpent || sideways > plungerReach(reading.distance)) {
      steps.push({ cause: 'point', parameterKey: 'arrow.pointWeight', direction: lighten })
      steps.push({ cause: 'drawWeight', parameterKey: 'bow.drawWeight', direction: lighten })
    }
    if (sideways > shaftLimit(reading.distance)) {
      // A stiffer shaft has a lower spine number.
      steps.push({ cause: 'shaft', parameterKey: 'arrow.spine', direction: lighten })
    }
  }

  return { agrees, steps }
}
