import { useMemo } from 'react'
import {
  dragPerMeter,
  fitSightMarks,
  pinPosition,
  type PinPosition,
  type SightFit,
} from '../../engine/index.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import type { TuningSetup } from '../../models/setup.ts'
import { sightOf, useSightStore, type SightEntry } from '../../state/sightStore.ts'
import { DISTANCES } from '../simulation/timing.ts'

/** mm, the distances marks are entered and predicted for. */
export const SIGHT_DISTANCES = DISTANCES.map((meters) => meters * 1000)

export type Sight = {
  /** What the archer entered for this setup. */
  entry: SightEntry
  /** The sight fitted to the entered marks, or null with too few of them. */
  fit: SightFit | null
  /** Where the pin sits for each distance, and the room the arrow has under it. */
  pins: PinPosition[]
}

/**
 * The sight of the setup on screen: its marks fitted, and its pin placed for
 * every distance. The pin is placed with the speed the marks imply when there
 * are enough of them, and with the model's estimate otherwise.
 */
export function useSight(setup: TuningSetup, result: SimulationResult): Sight {
  const entry = useSightStore((state) => sightOf(state.bySetup, setup.id))
  const modelSpeed = result.metrics.launchSpeed
  const { arrow, bow } = setup

  return useMemo(() => {
    const drag = dragPerMeter(arrow)
    const fit = fitSightMarks(
      entry.marks,
      { speed: modelSpeed, drag, eyeHeight: entry.eyeHeight },
      SIGHT_DISTANCES,
    )
    const geometry = {
      speed: fit?.speed ?? modelSpeed,
      drag,
      eyeHeight: entry.eyeHeight,
      drawLength: bow.drawLength,
      extension: entry.extension,
      pinDiameter: entry.pinDiameter,
      shaftDiameter: arrow.shaftDiameter,
      vaneHeight: arrow.fletchingHeight,
    }
    return {
      entry,
      fit,
      pins: SIGHT_DISTANCES.map((distance) => pinPosition(geometry, distance)),
    }
  }, [entry, modelSpeed, arrow, bow.drawLength])
}
