import { useMemo } from 'react'
import type { Handedness } from '../../models/bow.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { sampleTrajectory, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { AimLine, ArrowShape, TargetEdge, Trail } from './sceneParts.tsx'
import { SCENE } from './timing.ts'

// Visual amplification per unit of exaggeration. The drawing is not to scale.
const BEND_PIXELS = 9
const ANGLE_GAIN = 3
const DRIFT_PIXELS = 62

type Props = {
  result: SimulationResult
  handedness: Handedness
  /** s, simulated time since release */
  time: number
  /** 1..5, how much bending and yaw are amplified */
  exaggeration: number
}

/** The flight seen from above. This is the view that shows the shaft bending. */
export function TopView({ result, handedness, time, exaggeration }: Props) {
  const { trajectory, classification } = result
  const last = trajectory[trajectory.length - 1]!
  const distance = last.x
  // Lateral drift at the target for a full-scale deviation; maps it to the outer ring.
  const fullDrift =
    Math.abs(last.z ?? 0) / Math.max(Math.abs(result.metrics.lateralDeviation), 1e-9)

  const project = useMemo(() => {
    const startX = SCENE.bowX + SCENE.arrowLength / 2
    const endX = SCENE.targetX - SCENE.arrowLength / 2
    return (x: number, z: number): ScreenPoint => ({
      x: startX + (x / distance) * (endX - startX),
      // Shooting to the right of the screen, so the archer's right is down.
      y: SCENE.centerY + (fullDrift > 0 ? z / fullDrift : 0) * DRIFT_PIXELS,
    })
  }, [distance, fullDrift])

  const trail = useMemo(
    () =>
      trajectory
        .filter((_, index) => index % 6 === 0 || index === trajectory.length - 1)
        .map((point) => ({ t: point.t, ...project(point.x, point.z ?? 0) })),
    [trajectory, project],
  )

  const now = sampleTrajectory(trajectory, time)
  const center = project(now.x, now.z ?? 0)
  const pose: ArrowPose = {
    centerX: center.x,
    centerY: center.y,
    length: SCENE.arrowLength,
    angle: (now.yaw ?? 0) * ANGLE_GAIN * exaggeration,
    bend: (now.flex ?? 0) * BEND_PIXELS * exaggeration,
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

      <Trail points={trail.filter((point) => point.t <= time)} />
      <ArrowShape pose={pose} />
    </svg>
  )
}
