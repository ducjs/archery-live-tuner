import type { TrajectoryPoint } from '../../models/simulation.ts'

export type ArrowPose = {
  /** Screen position of the middle of the shaft. */
  centerX: number
  centerY: number
  /** Screen length of the shaft. */
  length: number
  /** rad, positive turns the point toward positive screen y */
  angle: number
  /** Screen displacement of the middle of the shaft; the ends move the other way. */
  bend: number
}

export type ScreenPoint = { x: number; y: number }

function lerp(a: number, b: number, fraction: number): number {
  return a + (b - a) * fraction
}

/** Interpolates the trajectory at time `t`, clamped to its ends. Samples must be evenly spaced. */
export function sampleTrajectory(trajectory: TrajectoryPoint[], t: number): TrajectoryPoint {
  const first = trajectory[0]
  const last = trajectory[trajectory.length - 1]
  if (!first || !last) throw new Error('Trajectory is empty')
  if (t <= first.t || trajectory.length === 1) return first
  if (t >= last.t) return last

  const position = ((t - first.t) / (last.t - first.t)) * (trajectory.length - 1)
  const index = Math.floor(position)
  const a = trajectory[index]!
  const b = trajectory[index + 1]!
  const fraction = position - index
  return {
    t,
    x: lerp(a.x, b.x, fraction),
    y: lerp(a.y, b.y, fraction),
    z: lerp(a.z ?? 0, b.z ?? 0, fraction),
    yaw: lerp(a.yaw ?? 0, b.yaw ?? 0, fraction),
    pitch: lerp(a.pitch ?? 0, b.pitch ?? 0, fraction),
    flex: lerp(a.flex ?? 0, b.flex ?? 0, fraction),
  }
}

/**
 * A point on the bent shaft. `along` runs from 0 (nock) to 1 (point), `offset`
 * is a sideways distance from the shaft. The bend follows the first bending
 * mode: the middle moves one way, both ends the other.
 */
export function pointOnArrow(pose: ArrowPose, along: number, offset = 0): ScreenPoint {
  const u = (along - 0.5) * pose.length
  const v = pose.bend * Math.cos(2 * Math.PI * (along - 0.5)) + offset
  const cos = Math.cos(pose.angle)
  const sin = Math.sin(pose.angle)
  return {
    x: pose.centerX + u * cos - v * sin,
    y: pose.centerY + u * sin + v * cos,
  }
}

/** SVG path data for the shaft between two positions along it. */
export function shaftPath(pose: ArrowPose, from = 0, to = 1, segments = 24): string {
  let path = ''
  for (let index = 0; index <= segments; index++) {
    const { x, y } = pointOnArrow(pose, from + ((to - from) * index) / segments)
    path += `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return path
}
