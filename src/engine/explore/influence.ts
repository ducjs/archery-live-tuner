import { setValue, type Parameter } from '../../models/parameters.ts'
import { HEURISTIC_V0, type Coefficients } from '../coefficients/coefficients.ts'
import type { SetupInput, SimulationModel } from '../simulation/simulate.ts'
import type { Tone } from './attributes.ts'

// What one value does to where the arrow goes, over the whole of its range
// with every other value left as it is: the slider of a value, colored by
// what the setup would read with the value there.

/** The tones a setup can read as, best first. */
type Reading = Exclude<Tone, 'plain'>
const ORDER: Reading[] = ['good', 'fair', 'poor']

/**
 * How a setup reads as a whole: the worst of how far the shaft is from
 * matching the bow and how far the bare shaft lands from the fletched arrows,
 * to the side and in height. The same steps as the bars of the bare shaft
 * group (spec §41.3).
 */
export function setupTone(
  model: SimulationModel,
  setup: SetupInput,
  coefficients: Coefficients = HEURISTIC_V0,
): Reading {
  const fletched = model.analyze(setup).metrics
  const bare = model.analyze(setup, { bareShaft: true }).metrics
  const limits = coefficients.thresholds
  const step = (size: number, good: number, fair: number) =>
    size <= good ? 0 : size <= fair ? 1 : 2
  const together = limits.bareShaftTogether
  const worst = Math.max(
    step(Math.abs(fletched.dynamicBehavior), limits.stiffnessNeutral, 0.5),
    step(Math.abs(bare.lateralDeviation - fletched.lateralDeviation), together, 3 * together),
    step(Math.abs(bare.verticalTendency - fletched.verticalTendency), together, 3 * together),
  )
  return ORDER[worst]!
}

export type Influence = {
  /**
   * How the setup reads with the value at each of a row of places, from the
   * lowest to the highest for a number, option by option otherwise.
   */
  tones: Reading[]
  /** How it reads with the value where it is. */
  now: Reading
  /** False when the value makes no difference to the reading anywhere in its range. */
  lever: boolean
}

/** How many stretches the range of a number is cut into: enough to tell whether the value matters. */
export const COARSE = 12
/** The same for drawing it: the stretch in which a setup is in order can be a narrow one. */
export const FINE = 48

/** What a value does to the reading of the setup, over its whole range. */
export function influence<T extends SetupInput>(
  model: SimulationModel,
  setup: T,
  parameter: Parameter,
  stretches = COARSE,
  coefficients: Coefficients = HEURISTIC_V0,
): Influence {
  const at = (value: number | string) =>
    setupTone(model, setValue(setup, parameter, value), coefficients)
  const tones =
    parameter.kind === 'number'
      ? Array.from({ length: stretches + 1 }, (_, index) =>
          at(parameter.min + ((parameter.max - parameter.min) * index) / stretches),
        )
      : parameter.options.map((option) => at(option))
  const now = setupTone(model, setup, coefficients)
  // The value where it is counts too: it may sit between two of the places tried.
  const lever = tones.some((tone) => tone !== now)
  return { tones, now, lever }
}

/** The tone a value is written in: its own only when it can do something about it. */
export function valueTone(found: Influence): Tone {
  return found.lever ? found.now : 'plain'
}
