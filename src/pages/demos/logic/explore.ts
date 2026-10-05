import { suggestTuning, type SimulationModel, type Suggestion } from '../../../engine/index.ts'
import {
  PARAMETERS,
  fromDisplay,
  getParameter,
  getValue,
  setValue,
  type NumberParameter,
} from '../../../models/parameters.ts'
import type { TuningSetup } from '../../../models/setup.ts'
import type { TuningClassification } from '../../../models/simulation.ts'

export type LandscapeCell = {
  spine: number
  /** gr */
  pointWeight: number
  /** -1..+1 */
  behavior: number
  rating: TuningClassification['stiffness']
}

export const LANDSCAPE_SPINES = [500, 550, 600, 650, 700, 750, 800, 850, 900]
export const LANDSCAPE_POINTS = [80, 90, 100, 110, 120, 130, 140]

/** Dynamic behavior over a grid of spine and point weight, everything else as in the setup. */
export function landscape(model: SimulationModel, setup: TuningSetup): LandscapeCell[][] {
  const spine = getParameter('arrow.spine') as NumberParameter
  const point = getParameter('arrow.pointWeight') as NumberParameter
  return LANDSCAPE_SPINES.map((spineValue) =>
    LANDSCAPE_POINTS.map((pointWeight) => {
      const changed = setValue(
        setValue(setup, spine, spineValue),
        point,
        fromDisplay(point, pointWeight),
      )
      const { metrics, classification } = model.analyze(changed)
      return {
        spine: spineValue,
        pointWeight,
        behavior: metrics.dynamicBehavior,
        rating: classification.stiffness,
      }
    }),
  )
}

export type Sensitivity = {
  key: string
  label: string
  /** Change in dynamic behavior when the value goes up by a tenth of its range. Positive = stiffer. */
  effect: number
}

/** Which values move the dynamic behavior most, largest first. */
export function sensitivity(model: SimulationModel, setup: TuningSetup): Sensitivity[] {
  const base = model.analyze(setup).metrics.dynamicBehavior
  return PARAMETERS.filter((parameter): parameter is NumberParameter => parameter.kind === 'number')
    .map((parameter) => {
      const step = (parameter.max - parameter.min) / 10
      const value = getValue(setup, parameter)
      // Step down instead when there is no room to step up.
      const up = value + step <= parameter.max
      const changed = setValue(setup, parameter, up ? value + step : value - step)
      const moved = model.analyze(changed).metrics.dynamicBehavior - base
      return { key: parameter.key, label: parameter.label, effect: up ? moved : -moved }
    })
    .filter((entry) => Math.abs(entry.effect) > 0.005)
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
}

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

/** Packs a setup's values into a string that fits in a link. */
export function encodeSetup(setup: TuningSetup): string {
  const values = PARAMETERS.map((parameter) => {
    const value = getValue(setup, parameter)
    return typeof value === 'number' ? Number(value.toFixed(4)) : value
  })
  return btoa(JSON.stringify(values)).replace(/=+$/, '')
}

/** Reads a string made by `encodeSetup` back into the setup. Returns null when it does not fit. */
export function decodeSetup(base: TuningSetup, encoded: string): TuningSetup | null {
  try {
    const values: unknown = JSON.parse(atob(encoded))
    if (!Array.isArray(values) || values.length !== PARAMETERS.length) return null
    return PARAMETERS.reduce(
      (setup, parameter, index) => setValue(setup, parameter, values[index] as number | string),
      base,
    )
  } catch {
    return null
  }
}
