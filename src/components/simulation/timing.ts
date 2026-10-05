import type { SimulationResult } from '../../models/simulation.ts'

// Real flight takes about a third of a second, far too fast to read.
export const SLOW_MOTION = 12

/** s, how long the arrow stays in the target before the loop restarts */
export const HOLD_SECONDS = 1.2

/** Playback rates, relative to the normal slow motion. The last one is real time. */
export const SPEEDS = [0.25, 0.5, 1, 2, SLOW_MOTION]
export const DEFAULT_SPEED = 1

/** How many times slower than real time a playback rate is. 1 means real time. */
export function slowdown(speed: number): number {
  return SLOW_MOTION / speed
}

/** m, the distances archers usually shoot and tune at */
export const DISTANCES = [18, 30, 50, 70, 90]
export const DEFAULT_DISTANCE = 18

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
