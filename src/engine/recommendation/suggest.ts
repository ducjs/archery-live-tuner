import {
  fromDisplay,
  getParameter,
  getValue,
  setValue,
  tierShows,
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

/**
 * The order the tuning guides work in (readme/tuning-references.md §5 and
 * §9.7): what was set wrong when the bow was put together, then up and down,
 * then left and right with the plunger, the point, the draw weight and the
 * brace height, and a different shaft only when none of that is enough.
 */
const STAGES = ['setup', 'vertical', 'plunger', 'point', 'drawWeight', 'brace', 'shaft'] as const
type Stage = (typeof STAGES)[number]

type Candidate = {
  key: string
  effort: Effort
  /** A change of an earlier stage that helps is suggested before any of a later one. */
  stage: Stage
  /** Divides the improvement when ranking within a stage: a costly change must help more. */
  cost: number
  /** Largest change suggested in one go, in the parameter's display unit. */
  maxMove: number
  /**
   * Set where the value belongs to the set-up of the bow and is not a tuning
   * adjustment: it is only ever suggested back toward its default.
   */
  restoreOnly?: true
}

// The stages follow the guides. Cost and size of step are HEURISTIC.
const CANDIDATES: Candidate[] = [
  // A recurve is not tuned with the in and out position of the arrow: it is set
  // once, and the plunger tension does the rest (Easton guide, fine tuning).
  { key: 'bow.centerShot', effort: 'bow', stage: 'setup', cost: 1, maxMove: 2, restoreOnly: true },
  { key: 'bow.nockingPointHeight', effort: 'bow', stage: 'vertical', cost: 1, maxMove: 6 },
  { key: 'bow.tiller', effort: 'bow', stage: 'vertical', cost: 1.2, maxMove: 4 },
  { key: 'bow.plungerStiffness', effort: 'bow', stage: 'plunger', cost: 1, maxMove: 0.6 },
  { key: 'bow.plungerPreload', effort: 'bow', stage: 'plunger', cost: 1, maxMove: 1.5 },
  { key: 'arrow.pointWeight', effort: 'arrowPart', stage: 'point', cost: 1, maxMove: 20 },
  { key: 'arrow.nockWeight', effort: 'arrowPart', stage: 'point', cost: 1, maxMove: 4 },
  { key: 'bow.drawWeight', effort: 'bow', stage: 'drawWeight', cost: 1, maxMove: 3 },
  { key: 'bow.braceHeight', effort: 'bow', stage: 'brace', cost: 1, maxMove: 1 },
  { key: 'arrow.length', effort: 'newArrows', stage: 'shaft', cost: 1, maxMove: 1 },
  { key: 'arrow.spine', effort: 'newArrows', stage: 'shaft', cost: 1, maxMove: 150 },
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
  /**
   * True when the setup counts as tuned although the bare shaft does not land
   * with the fletched arrows: a little low, a little to the stiff side, or both.
   */
  bareShaftSlightlyOff: boolean
  /** In tuning order. Each one is a single change from the current setup, not a sequence. */
  suggestions: Suggestion[]
}

export type SuggestOptions = {
  /** Leaves out parameters that this level does not show. */
  tier?: ParameterTier
  limit?: number
  /** Parameter keys to leave alone: values that were already changed, in a plan. */
  exclude?: readonly string[]
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

/**
 * How far the bare shaft may land low or to the stiff side of the fletched
 * arrows on a tuned bow, on the -1..+1 scale of the offset. The Easton guide
 * says a well tuned bow commonly leaves it "a little low and slightly stiff"
 * and gives no number: twice the width of "together" is HEURISTIC.
 */
const SLIGHT_OFFSET = 0.1

function readTuned(
  comparison: BareShaftComparison,
  setup: SetupInput,
): Pick<TuningAdvice, 'tuned' | 'bareShaftSlightlyOff'> {
  const { classification } = comparison.fletched
  const settled =
    classification.stiffness === 'NEUTRAL' &&
    classification.lateral === 'NEUTRAL' &&
    classification.vertical === 'NEUTRAL' &&
    classification.oscillation === 'LOW' &&
    classification.clearance === 'LOW'

  // A stiff arrow sends the bare shaft to the riser side: left for a right-handed archer.
  const towardStiff = comparison.offset.lateral * (setup.bow.handedness === 'RH' ? -1 : 1)
  const slightlyStiff = towardStiff > 0 && towardStiff <= SLIGHT_OFFSET
  const slightlyLow = comparison.offset.vertical < 0 && comparison.offset.vertical >= -SLIGHT_OFFSET

  const tuned =
    settled &&
    (comparison.horizontal === 'TOGETHER' || slightlyStiff) &&
    (comparison.vertical === 'TOGETHER' || slightlyLow)
  return {
    tuned,
    bareShaftSlightlyOff:
      tuned && (comparison.horizontal !== 'TOGETHER' || comparison.vertical !== 'TOGETHER'),
  }
}

/** Snaps a display value to the parameter's step, so suggestions are values a user can set. */
function snap(parameter: NumberParameter, displayValue: number): number {
  const snapped = Math.round(displayValue / parameter.step) * parameter.step
  return Number(snapped.toFixed(6))
}

/**
 * Lists the single changes that bring the setup toward tuned, in the order the
 * tuning guides work in, and within one stage by how much they help. Every
 * suggestion is something the model itself scores as an improvement; none of
 * it is validated tuning advice.
 */
export function suggestTuning<T extends SetupInput>(
  model: SimulationModel,
  setup: T,
  options: SuggestOptions = {},
): TuningAdvice {
  const { tier = 'pro', limit = 4, exclude = [] } = options
  const comparison = model.compareBareShaft(setup)
  const tuned = readTuned(comparison, setup)
  if (tuned.tuned) return { ...tuned, suggestions: [] }

  const baseline = tuningError(model, setup)
  const ranked: {
    suggestion: Omit<Suggestion, 'after'>
    changed: T
    stage: number
    rank: number
  }[] = []

  for (const candidate of CANDIDATES) {
    const parameter = getParameter(candidate.key) as NumberParameter
    if (!tierShows(tier, parameter.tier)) continue
    if (exclude.includes(candidate.key)) continue

    const from = getValue(setup, parameter)
    const current = toDisplay(parameter, from)
    let best: { value: number; error: number; changed: T } | null = null

    for (let step = -SEARCH_STEPS; step <= SEARCH_STEPS; step++) {
      if (step === 0) continue
      const display = snap(parameter, current + (candidate.maxMove * step) / SEARCH_STEPS)
      const value = fromDisplay(parameter, display)
      if (value < parameter.min || value > parameter.max) continue
      if (Math.abs(display - snap(parameter, current)) < parameter.step / 2) continue
      if (
        candidate.restoreOnly &&
        Math.abs(value - parameter.default) >= Math.abs(from - parameter.default)
      ) {
        continue
      }

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
      stage: STAGES.indexOf(candidate.stage),
      rank: (baseline - best.error) / candidate.cost,
    })
  }

  ranked.sort((a, b) => a.stage - b.stage || b.rank - a.rank)

  return {
    tuned: false,
    bareShaftSlightlyOff: false,
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
