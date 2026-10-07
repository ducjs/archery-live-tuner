import { SEEN_KEYS, type Observation, type Seen } from '../../models/observation.ts'
import type { SimulationModel } from '../simulation/simulate.ts'

/** One thing the archer noted, beside what the model says about the same setup. */
export type ObservationRow = {
  key: keyof Seen
  seen: string
  model: string
  match: boolean
}

export type ObservationComparison = {
  /** One row for each thing that was noted, in a fixed order. */
  rows: ObservationRow[]
  /** How many of them the model agrees with. */
  matches: number
}

/**
 * Sets a real-world observation beside the model result for the values the
 * setup had when it was shot. The two are kept apart on purpose (spec §26):
 * this only reports where they agree, it does not change either.
 */
export function compareObservation(
  observation: Observation,
  model: SimulationModel,
): ObservationComparison {
  const comparison = model.compareBareShaft({
    id: observation.setupId,
    bow: observation.bow,
    arrow: observation.arrow,
  })
  const { classification } = comparison.fletched
  const modelSays: Required<Seen> = {
    stiffness: classification.stiffness,
    oscillation: classification.oscillation,
    lateral: classification.lateral,
    clearance: classification.clearance,
    bareHorizontal: comparison.horizontal,
    bareVertical: comparison.vertical,
  }

  const rows = SEEN_KEYS.flatMap((key) => {
    const seen = observation.seen[key]
    return seen === undefined
      ? []
      : [{ key, seen, model: modelSays[key], match: seen === modelSays[key] }]
  })
  return { rows, matches: rows.filter((row) => row.match).length }
}
