import type { SimulationResult } from '../../models/simulation.ts'

// Real flight takes about a third of a second, far too fast to read.
export const SLOW_MOTION = 12

/** s, how long the arrow stays in the target before the loop restarts */
export const HOLD_SECONDS = 1.2

export const SPEEDS = [0.25, 0.5, 1, 2]
export const DEFAULT_SPEED = 1

export const MIN_EXAGGERATION = 1
export const MAX_EXAGGERATION = 5
export const DEFAULT_EXAGGERATION = 3

/** Shared drawing area of the top and side views, in SVG units. */
export const SCENE = {
  width: 800,
  height: 300,
  centerY: 150,
  bowX: 70,
  targetX: 752,
  arrowLength: 120,
}

/** s, how long the flight takes on screen at normal playback speed */
export function flightSeconds(result: SimulationResult): number {
  const { trajectory } = result
  return trajectory[trajectory.length - 1]!.t * SLOW_MOTION
}
