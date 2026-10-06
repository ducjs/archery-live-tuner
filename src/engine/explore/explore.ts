import {
  PARAMETERS,
  fromDisplay,
  getParameter,
  getValue,
  setValue,
  type NumberParameter,
} from '../../models/parameters.ts'
import type { TuningClassification } from '../../models/simulation.ts'
import type { SetupInput, SimulationModel } from '../simulation/simulate.ts'

// Looking at many setups at once instead of one (spec §16, §34.5). Both views
// only run the model over variations of the setup; they add no model of their own.

export type LandscapeCell = {
  spine: number
  /** gr */
  pointWeight: number
  /** -1..+1 */
  behavior: number
  rating: TuningClassification['stiffness']
}

/** Spine sizes shafts are sold in, stiffest first. */
export const LANDSCAPE_SPINES = [400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000]
/** gr, point weights in the steps points are sold in */
export const LANDSCAPE_POINTS = [80, 90, 100, 110, 120, 130, 140]

/** Dynamic behavior over a grid of spine and point weight, everything else as in the setup. */
export function landscape<T extends SetupInput>(
  model: SimulationModel,
  setup: T,
): LandscapeCell[][] {
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
  /** Parameter key. */
  key: string
  /** Change in dynamic behavior when the value goes up by a tenth of its range. Positive = stiffer. */
  effect: number
}

/** Effects smaller than this are left out: they would be bars too short to see. */
const SMALLEST_EFFECT = 0.005

/** Which values move the dynamic behavior most, largest first. */
export function sensitivity<T extends SetupInput>(model: SimulationModel, setup: T): Sensitivity[] {
  const base = model.analyze(setup).metrics.dynamicBehavior
  return PARAMETERS.filter((parameter): parameter is NumberParameter => parameter.kind === 'number')
    .map((parameter) => {
      const step = (parameter.max - parameter.min) / 10
      const value = getValue(setup, parameter)
      // Step down instead when there is no room to step up.
      const up = value + step <= parameter.max
      const changed = setValue(setup, parameter, up ? value + step : value - step)
      const moved = model.analyze(changed).metrics.dynamicBehavior - base
      return { key: parameter.key, effect: up ? moved : -moved }
    })
    .filter((entry) => Math.abs(entry.effect) > SMALLEST_EFFECT)
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
}

export type Exploration = {
  landscape: LandscapeCell[][]
  sensitivity: Sensitivity[]
}

/** Both views for one setup. A few hundred runs of the model, so it is done off the main thread. */
export function explore<T extends SetupInput>(model: SimulationModel, setup: T): Exploration {
  return { landscape: landscape(model, setup), sensitivity: sensitivity(model, setup) }
}
