import type { SimulationMetrics, TrajectoryPoint } from '../../models/simulation.ts'
import { flightPath, launchAngleFor, type FlightSample } from '../ballistics/flight.ts'
import type { Coefficients } from '../coefficients/coefficients.ts'

const GRAVITY = 9806.65 // mm/s²
const MAX_POINTS = 5000

export type TrajectoryOptions = {
  /** mm, distance to the target */
  distance: number
  /** s, sample interval */
  timeStep: number
}

export const DEFAULT_TRAJECTORY_OPTIONS: TrajectoryOptions = {
  distance: 18_000,
  timeStep: 0.001,
}

export type TrajectoryInput = {
  metrics: SimulationMetrics
  /** -1..+1, positive = nock high */
  verticalTendency: number
  /** 0..1, share of the vertical launch error that is left after fletching steers */
  driftFactor: number
  /** +1 = first bend is to the right, -1 = to the left */
  flexDirection: 1 | -1
  /** 1/m, how fast air drag takes speed off the arrow. 0 flies it without drag. */
  drag: number
}

/**
 * The arc of a target the arrow cannot reach: a drag-free path at 45°, timed
 * so that it still ends at the target. Not physics; it keeps the drawing
 * whole for a setup that is too slow for the distance.
 */
function outOfReach(speed: number, distance: number, timeStep: number): FlightSample[] {
  const elevation = Math.PI / 4
  const forwardSpeed = speed * Math.cos(elevation)
  const flightTime = distance / forwardSpeed
  const steps = Math.min(MAX_POINTS - 1, Math.ceil(flightTime / timeStep))
  return Array.from({ length: steps + 1 }, (_, step) => {
    const t = (flightTime * step) / steps
    return { t, x: forwardSpeed * t, y: speed * Math.sin(elevation) * t - 0.5 * GRAVITY * t ** 2 }
  })
}

/**
 * Samples the flight from release to the target. The path is an arc with air
 * drag, aimed at the target center; lateral and vertical drift are
 * illustrative, not predicted impact positions.
 */
export function buildTrajectory(
  input: TrajectoryInput,
  coefficients: Coefficients,
  options: TrajectoryOptions = DEFAULT_TRAJECTORY_OPTIONS,
): TrajectoryPoint[] {
  const { metrics, verticalTendency, driftFactor, flexDirection } = input
  const { flex, oscillation, lateral, vertical } = coefficients
  const speed = metrics.launchSpeed

  const elevation = launchAngleFor(speed, input.drag, options.distance)
  const flown = Number.isFinite(elevation)
    ? flightPath(speed, input.drag, elevation, options.distance, options.timeStep, MAX_POINTS)
    : []
  const path = flown.length > 0 ? flown : outOfReach(speed, options.distance, options.timeStep)

  const bendingOmega = 2 * Math.PI * metrics.oscillationFrequency
  const fishtailOmega = 2 * Math.PI * oscillation.fishtailFrequency
  const fishtailAmplitude = flexDirection * lateral.maxFishtail * metrics.oscillation
  const porpoiseAmplitude = vertical.maxPitch * verticalTendency

  // The angle is found with a coarser step than the path is sampled with, which
  // leaves the last sample a hair off the center. It is put on it.
  const end = path[path.length - 1]!
  const points: TrajectoryPoint[] = []
  for (const sample of path) {
    const { t, x } = sample
    const y = sample.y - (end.y * x) / end.x
    const settle = Math.exp(-metrics.oscillationDecay * t)

    points.push({
      t,
      x,
      y: y - verticalTendency * driftFactor * vertical.driftSlope * x,
      z: metrics.lateralDeviation * lateral.driftSlope * x,
      yaw: metrics.yaw * settle + fishtailAmplitude * settle * Math.sin(fishtailOmega * t),
      pitch: metrics.pitch * settle + porpoiseAmplitude * settle * Math.sin(fishtailOmega * t),
      // Straight on the string at release; the first bend is toward the riser.
      flex:
        flexDirection *
        metrics.flexAmplitude *
        Math.exp(-flex.decay * t) *
        Math.sin(bendingOmega * t),
    })
  }
  return points
}
