import { NO_PERSONAL, type Personal } from '../../models/calibration.ts'
import type { Observation } from '../../models/observation.ts'
import { HEURISTIC_V0, type Coefficients } from '../coefficients/coefficients.ts'
import { compareObservation } from '../diagnosis/observation.ts'
import { createHeuristicModel, type SimulationModel } from '../simulation/simulate.ts'

// Fitting the model to one archer's observations (spec §18). No machine
// learning: three shifts, each found by a search along one line, with a pull
// toward zero so that nothing moves without a reason.

export type Calibration = {
  personal: Personal
  /** Observations that said something the fit could use. */
  used: number
  /** Things noted, over all of those, that the base model agrees with. */
  before: number
  /** The same count for the model with `personal`. */
  after: number
  total: number
  /** True when the shifted model agrees with more of what was seen than the base model. */
  better: boolean
}

/** Fewer observations than this say too little to move anything. */
export const MIN_OBSERVATIONS = 3

/** How far each shift may go: [low, high]. Beyond this the base model is simply wrong for the setup. */
const SPAN: { [Key in keyof Personal]: [number, number] } = {
  behaviorShift: [-0.35, 0.35],
  nockingPointNeutral: [-6, 8],
  centerShotNeutral: [-3, 3],
}
/** One unit of each shift, to weigh them against each other in the pull toward zero. */
const UNIT: Personal = { behaviorShift: 0.07, nockingPointNeutral: 1, centerShotNeutral: 1 }
/** How strongly a shift is pulled toward zero. Small: one clear observation outweighs it. HEURISTIC. */
const PULL = 0.02
/** How far inside its band a value should land, as a share of the band's edge. HEURISTIC. */
const MARGIN = 0.25

type Band = 'below' | 'inside' | 'above'

/** 0 when `value` is in the band it was seen in, growing with the square of how far out it is. */
function miss(value: number, edge: number, seen: Band): number {
  const margin = edge * MARGIN
  const out =
    seen === 'below'
      ? value + edge + margin
      : seen === 'above'
        ? edge + margin - value
        : Math.abs(value) - (edge - margin)
  return out > 0 ? (out / edge) ** 2 : 0
}

const HORIZONTAL = ['stiffness', 'bareHorizontal', 'lateral'] as const
const usable = (observation: Observation) =>
  HORIZONTAL.some((key) => observation.seen[key] !== undefined) ||
  observation.seen.bareVertical !== undefined

/** How badly a model misses what was seen, sideways or in height. */
function loss(
  observations: Observation[],
  model: SimulationModel,
  thresholds: Coefficients['thresholds'],
  direction: 'horizontal' | 'vertical',
): number {
  let total = 0
  for (const observation of observations) {
    const { seen } = observation
    const setup = { id: observation.setupId, bow: observation.bow, arrow: observation.arrow }
    if (direction === 'vertical') {
      if (seen.bareVertical === undefined) continue
      const band = ({ LOW: 'below', TOGETHER: 'inside', HIGH: 'above' } as const)[seen.bareVertical]
      total += miss(
        model.compareBareShaft(setup).offset.vertical,
        thresholds.bareShaftTogether,
        band,
      )
      continue
    }
    if (!HORIZONTAL.some((key) => seen[key] !== undefined)) continue
    const comparison = model.compareBareShaft(setup)
    const { metrics } = comparison.fletched
    if (seen.stiffness !== undefined) {
      const band = ({ WEAK: 'below', NEUTRAL: 'inside', STIFF: 'above' } as const)[seen.stiffness]
      total += miss(metrics.dynamicBehavior, thresholds.stiffnessNeutral, band)
    }
    if (seen.bareHorizontal !== undefined) {
      const band = ({ LEFT: 'below', TOGETHER: 'inside', RIGHT: 'above' } as const)[
        seen.bareHorizontal
      ]
      total += miss(comparison.offset.lateral, thresholds.bareShaftTogether, band)
    }
    if (seen.lateral !== undefined) {
      const band = ({ LEFT: 'below', NEUTRAL: 'inside', RIGHT: 'above' } as const)[seen.lateral]
      total += miss(metrics.lateralDeviation, thresholds.lateralNeutral, band)
    }
  }
  return total
}

/**
 * The value along one shift that misses least. The miss is flat in places and
 * stepped in others, so the span is walked first and the best stretch is then
 * narrowed.
 */
function search(key: keyof Personal, score: (value: number) => number): number {
  const [low, high] = SPAN[key]
  const steps = 28
  const width = (high - low) / steps
  const cost = (value: number) => score(value) + PULL * (value / UNIT[key]) ** 2
  let best = 0
  let bestCost = cost(0)
  for (let step = 0; step <= steps; step++) {
    const value = low + step * width
    const here = cost(value)
    if (here < bestCost - 1e-12) {
      best = value
      bestCost = here
    }
  }
  let from = Math.max(low, best - width)
  let to = Math.min(high, best + width)
  for (let i = 0; i < 12; i++) {
    const a = from + (to - from) / 3
    const b = to - (to - from) / 3
    if (cost(a) <= cost(b)) to = b
    else from = a
  }
  const refined = (from + to) / 2
  return cost(refined) < bestCost ? refined : best
}

function agreement(observations: Observation[], model: SimulationModel) {
  let matches = 0
  let total = 0
  for (const observation of observations) {
    const comparison = compareObservation(observation, model)
    matches += comparison.matches
    total += comparison.rows.length
  }
  return { matches, total }
}

/**
 * Rounds a shift, and reads one under a seventh of its unit as none: that is
 * a leftover of the search, less than any observation could show.
 */
const tidy = (key: keyof Personal, value: number, digits: number) =>
  Math.abs(value) < UNIT[key] / 7 ? 0 : Number(value.toFixed(digits))

/**
 * Finds the shifts that make the model agree best with what one archer saw.
 * Null when too few observations say anything the fit can use.
 *
 * Weak or stiff and the center shot both move the bare shaft sideways. They
 * can be told apart when the arrow's behavior was noted as well, or when the
 * observations cover different setups; otherwise the pull toward zero splits
 * the shift between them.
 */
export function fitPersonal(
  all: Observation[],
  coefficients: Coefficients = HEURISTIC_V0,
): Calibration | null {
  const observations = all.filter(usable)
  if (observations.length < MIN_OBSERVATIONS) return null
  const { thresholds } = coefficients
  const model = (personal: Personal) => createHeuristicModel(coefficients, personal)

  let personal: Personal = { ...NO_PERSONAL }
  const along = (key: keyof Personal, direction: 'horizontal' | 'vertical') => {
    personal = {
      ...personal,
      [key]: search(key, (value) =>
        loss(observations, model({ ...personal, [key]: value }), thresholds, direction),
      ),
    }
  }
  along('nockingPointNeutral', 'vertical')
  // The two sideways shifts lean on each other, so each is found again after the other.
  for (let round = 0; round < 2; round++) {
    along('behaviorShift', 'horizontal')
    along('centerShotNeutral', 'horizontal')
  }
  personal = {
    behaviorShift: tidy('behaviorShift', personal.behaviorShift, 3),
    nockingPointNeutral: tidy('nockingPointNeutral', personal.nockingPointNeutral, 1),
    centerShotNeutral: tidy('centerShotNeutral', personal.centerShotNeutral, 1),
  }

  const before = agreement(observations, model(NO_PERSONAL))
  const after = agreement(observations, model(personal))
  return {
    personal,
    used: observations.length,
    before: before.matches,
    after: after.matches,
    total: before.total,
    better: after.matches > before.matches,
  }
}
