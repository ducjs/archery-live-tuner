import { useMemo } from 'react'
import type { SimulationResult } from '../../models/simulation.ts'
import { sampleTrajectory, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { AimLine, ArrowShape, TargetEdge, Trail } from './sceneParts.tsx'
import { SCENE } from './timing.ts'

// Visual amplification. The drawing is not to scale.
const PIXELS_PER_MM = 0.3
const ANGLE_GAIN = 3
const DIRECTION_STEP = 0.004

type Props = {
  result: SimulationResult
  /** s, simulated time since release */
  time: number
  /** 1..5, how much the arrow's attitude is amplified */
  exaggeration: number
}

/** The flight seen from the side. Shaft bending is sideways, so none is drawn here. */
export function SideView({ result, time, exaggeration }: Props) {
  const { trajectory, classification } = result
  const last = trajectory[trajectory.length - 1]!
  const distance = last.x

  const project = useMemo(() => {
    const startX = SCENE.bowX + SCENE.arrowLength / 2
    const endX = SCENE.targetX - SCENE.arrowLength / 2
    return (x: number, y: number): ScreenPoint => ({
      x: startX + (x / distance) * (endX - startX),
      y: SCENE.centerY - y * PIXELS_PER_MM,
    })
  }, [distance])

  const trail = useMemo(
    () =>
      trajectory
        .filter((_, index) => index % 6 === 0 || index === trajectory.length - 1)
        .map((point) => ({ t: point.t, ...project(point.x, point.y) })),
    [trajectory, project],
  )

  const now = sampleTrajectory(trajectory, time)
  const center = project(now.x, now.y)

  // Direction of travel on screen, from a short step along the path.
  const stepStart = Math.min(Math.max(0, time - DIRECTION_STEP / 2), last.t - DIRECTION_STEP)
  const a = sampleTrajectory(trajectory, stepStart)
  const b = sampleTrajectory(trajectory, stepStart + DIRECTION_STEP)
  const from = project(a.x, a.y)
  const to = project(b.x, b.y)
  const travelAngle = Math.atan2(to.y - from.y, to.x - from.x)

  const pose: ArrowPose = {
    centerX: center.x,
    centerY: center.y,
    length: SCENE.arrowLength,
    // Screen y points down, so a nose-up pitch is a negative screen angle.
    angle: travelAngle - (now.pitch ?? 0) * ANGLE_GAIN * exaggeration,
    bend: 0,
  }

  const vertical =
    classification.vertical === 'NEUTRAL'
      ? 'level'
      : classification.vertical === 'NOCK_HIGH'
        ? 'nock high'
        : 'nock low'

  return (
    <svg
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      role="img"
      aria-label={`Side view of the arrow flying from the bow to the target. The arrow leaves the bow ${vertical}.`}
      className="block h-auto w-full"
    >
      <AimLine fromX={SCENE.bowX} toX={SCENE.targetX} y={SCENE.centerY} />
      <TargetEdge x={SCENE.targetX} centerY={SCENE.centerY} />

      {/* Recurve bow from the side: string, limbs, riser, long rod. */}
      <g
        className="stroke-ink-muted"
        fill="none"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        transform={`translate(${SCENE.bowX} ${SCENE.centerY})`}
      >
        <line x1="1" y1="-103" x2="1" y2="103" strokeWidth="1" />
        <path d="M26 -34C22 -68 6 -84 1 -100q1 -8 9 -9" strokeWidth="3" />
        <path d="M26 34C22 68 6 84 1 100q1 8 9 9" strokeWidth="3" />
        <path d="M26 -34Q33 0 26 34" strokeWidth="7" />
        <line x1="32" y1="12" x2="98" y2="15" strokeWidth="3" />
      </g>

      <Trail points={trail.filter((point) => point.t <= time)} />
      <ArrowShape pose={pose} />
    </svg>
  )
}
