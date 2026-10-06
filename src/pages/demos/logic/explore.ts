import { suggestTuning, type SimulationModel, type Suggestion } from '../../../engine/index.ts'
import { getParameter, setValue } from '../../../models/parameters.ts'
import type { TuningSetup } from '../../../models/setup.ts'

export type PlanStep = { suggestion: Suggestion; setup: TuningSetup }

/** Applies the top suggestion again and again, to show a whole tuning session. */
export function tunePlan(
  model: SimulationModel,
  start: TuningSetup,
  maxSteps = 5,
): { steps: PlanStep[]; tuned: boolean } {
  const steps: PlanStep[] = []
  let setup = start
  for (let index = 0; index < maxSteps; index++) {
    const advice = suggestTuning(model, setup, { limit: 1 })
    const suggestion = advice.suggestions[0]
    if (advice.tuned || !suggestion) return { steps, tuned: advice.tuned }
    setup = setValue(setup, getParameter(suggestion.parameterKey), suggestion.to)
    steps.push({ suggestion, setup })
  }
  return { steps, tuned: suggestTuning(model, setup, { limit: 1 }).tuned }
}
