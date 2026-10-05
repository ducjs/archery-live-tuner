import {
  fromDisplay,
  getParameter,
  getValue,
  setValue,
  toDisplay,
  type NumberParameter,
  type ParameterTier,
} from '../../models/parameters.ts'
import type { BareShaftComparison, TuningClassification } from '../../models/simulation.ts'
import type { SetupInput, SimulationModel } from '../simulation/simulate.ts'

/** How much work a change is. Free adjustments are suggested before purchases. */
export type Effort = 'bow' | 'arrowPart' | 'newArrows'

/** The two kinds of advice: set something on the bow, or change what is shot. */
export type SuggestionGroup = 'adjust' | 'equipment'

export function suggestionGroup(effort: Effort): SuggestionGroup {
  return effort === 'bow' ? 'adjust' : 'equipment'
}

type Candidate = {
  key: string
  effort: Effort
  /** Divides the improvement when ranking: a costly change must help more to rank as high. */
  cost: number
  /** Largest change suggested in one go, in the parameter's display unit. */
  maxMove: number
}

// Order of effort and size of step are HEURISTIC, chosen to follow common
// tuning practice: adjust the bow first, change arrow parts next, buy last.
const CANDIDATES: Candidate[] = [
  { key: 'bow.nockingPointHeight', effort: 'bow', cost: 1, maxMove: 6 },
  { key: 'bow.plungerStiffness', effort: 'bow', cost: 1, maxMove: 0.6 },
  { key: 'bow.plungerPreload', effort: 'bow', cost: 1, maxMove: 1.5 },
  { key: 'bow.centerShot', effort: 'bow', cost: 1.2, maxMove: 2 },
  { key: 'bow.braceHeight', effort: 'bow', cost: 1.2, maxMove: 1 },
  { key: 'bow.tiller', effort: 'bow', cost: 1.2, maxMove: 4 },
  { key: 'bow.drawWeight', effort: 'bow', cost: 1.5, maxMove: 3 },
  { key: 'arrow.pointWeight', effort: 'arrowPart', cost: 1.8, maxMove: 20 },
  { key: 'arrow.nockWeight', effort: 'arrowPart', cost: 1.8, maxMove: 4 },
  { key: 'arrow.length', effort: 'newArrows', cost: 3, maxMove: 1 },
  { key: 'arrow.spine', effort: 'newArrows', cost: 3, maxMove: 150 },
]

const SEARCH_STEPS = 12
/** A change must lower the score by at least this much to be worth suggesting. */
const MIN_GAIN = 0.03

export type Suggestion = {
  parameterKey: string
  effort: Effort
  direction: 'increase' | 'decrease'
  /** Current and suggested value, in internal units. */
  from: number
  to: number
  /** 0..1, share of the tuning error that the change removes. */
  improvement: number
  /** What the model reports after the change. */
  after: {
    classification: TuningClassification
    horizontal: BareShaftComparison['horizontal']
    vertical: BareShaftComparison['vertical']
  }
}

export type TuningAdvice = {
  /** True when the model has nothing to complain about. */
  tuned: boolean
  /** Best first. Each one is a single change from the current setup, not a sequence. */
  suggestions: Suggestion[]
}

export type SuggestOptions = {
  /** `simple` leaves out parameters that Simple mode does not show. */
  tier?: ParameterTier
  limit?: number
}

/**
 * How far the setup is from tuned, as the model sees it. The bare shaft counts
 * on top of the fletched arrow because it is what an archer would read.
 */
function tuningError(model: SimulationModel, setup: SetupInput): number {
  const fletched = model.analyze(setup).metrics
  const bare = model.analyze(setup, { bareShaft: true }).metrics
  return (
    Math.abs(fletched.dynamicBehavior) +
    Math.abs(bare.lateralDeviation) +
    Math.abs(fletched.verticalTendency) +
    0.5 * fletched.clearanceRisk +
    0.3 * fletched.oscillation
  )
}

function isTuned(comparison: BareShaftComparison): boolean {
  const { classification } = comparison.fletched
  return (
    classification.stiffness === 'NEUTRAL' &&
    classification.lateral === 'NEUTRAL' &&
    classification.vertical === 'NEUTRAL' &&
    classification.oscillation === 'LOW' &&
    classification.clearance === 'LOW' &&
    comparison.horizontal === 'TOGETHER' &&
    comparison.vertical === 'TOGETHER'
  )
}

/** Snaps a display value to the parameter's step, so suggestions are values a user can set. */
function snap(parameter: NumberParameter, displayValue: number): number {
  const snapped = Math.round(displayValue / parameter.step) * parameter.step
  return Number(snapped.toFixed(6))
}

/**
 * Ranks single changes by how much they bring the setup toward tuned, relative
 * to the effort they take. Every suggestion is something the model itself
 * scores as an improvement; none of it is validated tuning advice.
 */
export function suggestTuning<T extends SetupInput>(
  model: SimulationModel,
  setup: T,
  options: SuggestOptions = {},
): TuningAdvice {
  const { tier = 'advanced', limit = 4 } = options
  const comparison = model.compareBareShaft(setup)
  if (isTuned(comparison)) return { tuned: true, suggestions: [] }

  const baseline = tuningError(model, setup)
  const ranked: { suggestion: Omit<Suggestion, 'after'>; changed: T; rank: number }[] = []

  for (const candidate of CANDIDATES) {
    const parameter = getParameter(candidate.key) as NumberParameter
    if (tier === 'simple' && parameter.tier !== 'simple') continue

    const from = getValue(setup, parameter)
    const current = toDisplay(parameter, from)
    let best: { value: number; error: number; changed: T } | null = null

    for (let step = -SEARCH_STEPS; step <= SEARCH_STEPS; step++) {
      if (step === 0) continue
      const display = snap(parameter, current + (candidate.maxMove * step) / SEARCH_STEPS)
      const value = fromDisplay(parameter, display)
      if (value < parameter.min || value > parameter.max) continue
      if (Math.abs(display - snap(parameter, current)) < parameter.step / 2) continue

      const changed = setValue(setup, parameter, value)
      const error = tuningError(model, changed)
      // On a tie the smaller change wins.
      if (
        !best ||
        error < best.error - 1e-9 ||
        (Math.abs(error - best.error) <= 1e-9 &&
          Math.abs(value - from) < Math.abs(best.value - from))
      ) {
        best = { value, error, changed }
      }
    }

    if (!best || baseline - best.error < MIN_GAIN) continue
    ranked.push({
      suggestion: {
        parameterKey: candidate.key,
        effort: candidate.effort,
        direction: best.value > from ? 'increase' : 'decrease',
        from,
        to: best.value,
        improvement: (baseline - best.error) / baseline,
      },
      changed: best.changed,
      rank: (baseline - best.error) / candidate.cost,
    })
  }

  ranked.sort((a, b) => b.rank - a.rank)

  return {
    tuned: false,
    suggestions: ranked.slice(0, limit).map(({ suggestion, changed }) => {
      const after = model.compareBareShaft(changed)
      return {
        ...suggestion,
        after: {
          classification: after.fletched.classification,
          horizontal: after.horizontal,
          vertical: after.vertical,
        },
      }
    }),
  }
}
