import type { SimulationResult } from '../../models/simulation.ts'

// Real flight takes about a third of a second, far too fast to read.
export const SLOW_MOTION = 12
const HOLD_SECONDS = 1.2

/** Wall-clock length of one loop of the animation, in seconds. */
export function loopSeconds(result: SimulationResult): number {
  const { trajectory } = result
  return trajectory[trajectory.length - 1]!.t * SLOW_MOTION + HOLD_SECONDS
}
