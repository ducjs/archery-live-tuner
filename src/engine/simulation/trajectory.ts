import type { SimulationMetrics, TrajectoryPoint } from '../../models/simulation.ts'
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
}

/**
 * Samples the flight from release to the target. The path is a drag-free
 * ballistic arc aimed at the target center; lateral and vertical drift are
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

  const elevation = 0.5 * Math.asin(Math.min(1, (GRAVITY * options.distance) / speed ** 2))
  const forwardSpeed = speed * Math.cos(elevation)
  const flightTime = options.distance / forwardSpeed
  const steps = Math.min(MAX_POINTS - 1, Math.ceil(flightTime / options.timeStep))

  const bendingOmega = 2 * Math.PI * metrics.oscillationFrequency
  const fishtailOmega = 2 * Math.PI * oscillation.fishtailFrequency
  const fishtailAmplitude = flexDirection * lateral.maxFishtail * metrics.oscillation
  const porpoiseAmplitude = vertical.maxPitch * verticalTendency

  const points: TrajectoryPoint[] = []
  for (let step = 0; step <= steps; step++) {
    const t = (flightTime * step) / steps
    const x = forwardSpeed * t
    const settle = Math.exp(-metrics.oscillationDecay * t)

    points.push({
      t,
      x,
      y:
        speed * Math.sin(elevation) * t -
        0.5 * GRAVITY * t ** 2 -
        verticalTendency * driftFactor * vertical.driftSlope * x,
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
