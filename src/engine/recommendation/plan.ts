import { getParameter, setValue, type ParameterTier } from '../../models/parameters.ts'
import type { BareShaftComparison, TuningClassification } from '../../models/simulation.ts'
import type { SetupInput, SimulationModel } from '../simulation/simulate.ts'
import { suggestTuning, type Suggestion } from './suggest.ts'

/** What the model reports for a setup, in the words a suggestion is described with. */
export type PlanReading = {
  classification: TuningClassification
  horizontal: BareShaftComparison['horizontal']
  vertical: BareShaftComparison['vertical']
}

export type PlanStep<T extends SetupInput> = {
  suggestion: Suggestion
  /** What the model reports just before this step. */
  before: PlanReading
  /** The setup once this step is taken. */
  setup: T
}

export type TuningPlan<T extends SetupInput> = {
  /** In the order to take them. Each one starts from the result of the one before. */
  steps: PlanStep<T>[]
  /** True when the model reads the setup as tuned once every step is taken. */
  tuned: boolean
}

export type PlanOptions = {
  /** `simple` leaves out parameters that Simple mode does not show. */
  tier?: ParameterTier
  /** The most steps to lay out. */
  maxSteps?: number
}

/**
 * Lays out a whole tuning session: the first suggestion, then the first
 * suggestion for the setup that leaves, and so on until the model reads the
 * setup as tuned or has nothing left to offer.
 *
 * Each value is changed once. Without that the plan would keep turning the
 * plunger to make up for a shaft that is wrong, which is not how a bow is
 * tuned: an adjustment is taken as far as it reasonably goes, and then the
 * next one in the order of the guides takes over.
 */
export function planTuning<T extends SetupInput>(
  model: SimulationModel,
  start: T,
  options: PlanOptions = {},
): TuningPlan<T> {
  const { tier = 'advanced', maxSteps = 7 } = options
  const steps: PlanStep<T>[] = []
  const changed: string[] = []
  let setup = start
  const first = model.compareBareShaft(start)
  let before: PlanReading = {
    classification: first.fletched.classification,
    horizontal: first.horizontal,
    vertical: first.vertical,
  }

  for (let step = 0; step < maxSteps; step++) {
    const advice = suggestTuning(model, setup, { tier, limit: 1, exclude: changed })
    const suggestion = advice.suggestions[0]
    if (advice.tuned || !suggestion) return { steps, tuned: advice.tuned }
    setup = setValue(setup, getParameter(suggestion.parameterKey), suggestion.to)
    steps.push({ suggestion, before, setup })
    changed.push(suggestion.parameterKey)
    before = suggestion.after
  }
  return { steps, tuned: suggestTuning(model, setup, { tier, limit: 1 }).tuned }
}
