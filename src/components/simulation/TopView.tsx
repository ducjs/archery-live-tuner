import type { Handedness } from '../../models/bow.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { sampleTrajectory, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { AimLine, FlyingArrow, TargetEdge } from './sceneParts.tsx'
import { SCENE } from './timing.ts'

// Visual amplification per unit of exaggeration. The drawing is not to scale.
const BEND_PIXELS = 9
const ANGLE_GAIN = 3
const DRIFT_PIXELS = 62
const TRAIL_STEP = 6

type Props = {
  result: SimulationResult
  /** A bare shaft to fly alongside. */
  bare?: SimulationResult
  handedness: Handedness
  /** s, simulated time since release */
  time: number
  /** 1..5, how much bending and yaw are amplified */
  exaggeration: number
}

/** mm of lateral drift at the target that a full-scale deviation produces. */
function fullDrift(result: SimulationResult): number {
  const deviation = Math.abs(result.metrics.lateralDeviation)
  return deviation > 1e-9 ? Math.abs(result.trajectory.at(-1)!.z ?? 0) / deviation : 0
}

/** The flight seen from above. This is the view that shows the shaft bending. */
export function TopView({ result, bare, handedness, time, exaggeration }: Props) {
  const { classification } = result
  const distance = result.trajectory.at(-1)!.x
  // Both arrows share one scale, so their offset from each other is drawn true.
  const driftScale = Math.max(fullDrift(result), bare ? fullDrift(bare) : 0)

  const startX = SCENE.bowX + SCENE.arrowLength / 2
  const endX = SCENE.targetX - SCENE.arrowLength / 2
  const project = (x: number, z: number): ScreenPoint => ({
    x: startX + (x / distance) * (endX - startX),
    // Shooting to the right of the screen, so the archer's right is down.
    y: SCENE.centerY + (driftScale > 0 ? z / driftScale : 0) * DRIFT_PIXELS,
  })

  const fly = (flight: SimulationResult) => {
    const now = sampleTrajectory(flight.trajectory, time)
    const center = project(now.x, now.z ?? 0)
    const pose: ArrowPose = {
      centerX: center.x,
      centerY: center.y,
      length: SCENE.arrowLength,
      angle: (now.yaw ?? 0) * ANGLE_GAIN * exaggeration,
      bend: (now.flex ?? 0) * BEND_PIXELS * exaggeration,
    }
    const trail = flight.trajectory
      .filter((point, index) => index % TRAIL_STEP === 0 && point.t <= time)
      .map((point) => project(point.x, point.z ?? 0))
    return { pose, trail: [...trail, center] }
  }

  // Seen from above, a right-handed bow has the arrow on the left of the riser.
  const riserOffset = handedness === 'RH' ? 7 : -7

  return (
    <svg
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      role="img"
      aria-label={`Top view of the arrow flying from the bow to the target. The arrow is ${classification.stiffness.toLowerCase()}, with ${classification.oscillation.toLowerCase()} oscillation and a ${classification.lateral.toLowerCase()} lateral tendency.`}
      className="block h-auto w-full"
    >
      <AimLine fromX={SCENE.bowX} toX={SCENE.targetX} y={SCENE.centerY} />
      <TargetEdge x={SCENE.targetX} centerY={SCENE.centerY} />

      {/* Bow from above: riser, long rod forward, side rods back. */}
      <g
        className="stroke-ink-muted"
        strokeWidth="3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        transform={`translate(${SCENE.bowX + 14} ${SCENE.centerY + riserOffset})`}
      >
        <line x1="6" y1="0" x2="64" y2="0" />
        <line x1="-4" y1="0" x2="-30" y2="-17" />
        <line x1="-4" y1="0" x2="-30" y2="17" />
        <rect
          x="-6"
          y="-5"
          width="14"
          height="10"
          rx="2"
          className="fill-ink-muted"
          stroke="none"
        />
      </g>

      {bare && <FlyingArrow {...fly(bare)} bare />}
      <FlyingArrow {...fly(result)} />
    </svg>
  )
}
