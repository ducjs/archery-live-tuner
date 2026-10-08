import { useMemo } from 'react'
import { DEFAULT_TRAJECTORY_OPTIONS } from '../../engine/index.ts'
import { useModel } from '../../state/calibrationStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'

/** The setup on screen, flown to a target at `distance` metres: fletched arrow and bare shaft. */
export function useFlight(distance: number) {
  const setup = useTuningStore((state) => state.setup)
  // The base model, or the one fitted to the archer when that is switched on.
  const model = useModel()
  const trajectory = useMemo(
    () => ({ ...DEFAULT_TRAJECTORY_OPTIONS, distance: distance * 1000 }),
    [distance],
  )
  const comparison = useMemo(
    () => model.compareBareShaft(setup, { trajectory }),
    [model, setup, trajectory],
  )
  return { setup, model, trajectory, comparison, result: comparison.fletched }
}
