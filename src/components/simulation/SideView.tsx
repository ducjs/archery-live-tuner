import { useMessages } from '../../i18n/useMessages.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { sampleTrajectory, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { AimLine, FlyingArrow, TargetEdge } from './sceneParts.tsx'
import { SCENE } from './timing.ts'

// Visual amplification. The drawing is not to scale.
const MAX_PIXELS_PER_MM = 0.2
/**
 * Tallest the arc may be drawn. Height is stretched far more than distance, so
 * a tall arc tilts the arrow well beyond its real launch angle of a few degrees.
 */
const MAX_RISE_PIXELS = 60
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
  const m = useMessages()
  const { classification } = result
  const distance = result.trajectory.at(-1)!.x

  // Both arrows share one vertical scale, small enough for the highest point of the arc.
  const highest = Math.max(
    ...[result, ...(bare ? [bare] : [])].flatMap((flight) =>
      flight.trajectory.map((point) => Math.abs(point.y)),
    ),
  )
  const pixelsPerMm = Math.min(MAX_PIXELS_PER_MM, MAX_RISE_PIXELS / Math.max(highest, 1))

  const startX = SCENE.bowX + SCENE.arrowLength / 2
  const endX = SCENE.targetX - SCENE.arrowLength / 2
  const project = (x: number, y: number): ScreenPoint => ({
    x: startX + (x / distance) * (endX - startX),
    y: SCENE.centerY - y * pixelsPerMm,
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
      ? m.stage.level
      : m.rating[classification.vertical].toLowerCase()

  return (
    <svg
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      role="img"
      aria-label={m.stage.sideViewLabel(vertical)}
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
        transform={`translate(${SCENE.bowX} ${SCENE.centerY}) scale(0.86)`}
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
