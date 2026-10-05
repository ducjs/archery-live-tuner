import type { SimulationResult } from '../../models/simulation.ts'
import { sampleTrajectory, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { AimLine, FlyingArrow, TargetEdge } from './sceneParts.tsx'
import { SCENE } from './timing.ts'

// Visual amplification. The drawing is not to scale.
const PIXELS_PER_MM = 0.3
const ANGLE_GAIN = 3
const DIRECTION_STEP = 0.004
const TRAIL_STEP = 6

type Props = {
  result: SimulationResult
  /** A bare shaft to fly alongside. */
  bare?: SimulationResult
  /** s, simulated time since release */
  time: number
  /** 1..5, how much the arrow's attitude is amplified */
  exaggeration: number
}

/** The flight seen from the side. Shaft bending is sideways, so none is drawn here. */
export function SideView({ result, bare, time, exaggeration }: Props) {
  const { classification } = result
  const distance = result.trajectory.at(-1)!.x

  const startX = SCENE.bowX + SCENE.arrowLength / 2
  const endX = SCENE.targetX - SCENE.arrowLength / 2
  const project = (x: number, y: number): ScreenPoint => ({
    x: startX + (x / distance) * (endX - startX),
    y: SCENE.centerY - y * PIXELS_PER_MM,
  })

  const fly = (flight: SimulationResult) => {
    const { trajectory } = flight
    const now = sampleTrajectory(trajectory, time)
    const center = project(now.x, now.y)

    // Direction of travel on screen, from a short step along the path.
    const stepStart = Math.min(
      Math.max(0, time - DIRECTION_STEP / 2),
      trajectory.at(-1)!.t - DIRECTION_STEP,
    )
    const from = sampleTrajectory(trajectory, stepStart)
    const to = sampleTrajectory(trajectory, stepStart + DIRECTION_STEP)
    const a = project(from.x, from.y)
    const b = project(to.x, to.y)

    const pose: ArrowPose = {
      centerX: center.x,
      centerY: center.y,
      length: SCENE.arrowLength,
      // Screen y points down, so a nose-up pitch is a negative screen angle.
      angle: Math.atan2(b.y - a.y, b.x - a.x) - (now.pitch ?? 0) * ANGLE_GAIN * exaggeration,
      bend: 0,
    }
    const trail = trajectory
      .filter((point, index) => index % TRAIL_STEP === 0 && point.t <= time)
      .map((point) => project(point.x, point.y))
    return { pose, trail: [...trail, center] }
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

      {bare && <FlyingArrow {...fly(bare)} bare />}
      <FlyingArrow {...fly(result)} />
    </svg>
  )
}
