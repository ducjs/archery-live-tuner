import { useMessages } from '../../i18n/useMessages.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { sampleTrajectory, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { AimLine, FlyingArrow, TargetEdge } from './sceneParts.tsx'
import { SCENE, drawBack, launchEase } from './timing.ts'

// Visual amplification. The drawing is not to scale.
const MAX_PIXELS_PER_MM = 0.2
/**
 * Tallest the arc may be drawn. Height is stretched far more than distance, so
 * a tall arc tilts the arrow well beyond its real launch angle of a few degrees.
 */
const MAX_RISE_PIXELS = 60
const ANGLE_GAIN = 3
const DIRECTION_STEP = 0.004
/** Size of the bow drawing; with it the bow is 187 units tall (see EQUIPMENT_SCALE). */
const BOW_SCALE = 0.86
const TRAIL_STEP = 6

type Props = {
  result: SimulationResult
  /** A bare shaft to fly alongside. */
  bare?: SimulationResult
  /** s, simulated time since the nock left the string; negative while it is on it */
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

  // Where the bow points: the direction the arrow sets off in, as drawn.
  const first = project(0, 0)
  const next = sampleTrajectory(result.trajectory, DIRECTION_STEP)
  const ahead = project(next.x, next.y)
  const aim = Math.atan2(ahead.y - first.y, ahead.x - first.x)
  const pull = drawBack(result, time)

  // The bow in its own frame: string at x = 1, limb tips 100 above and below.
  // Drawing the string back bends the limbs: the tips come back and inward, far
  // enough that the string keeps its length.
  const nockX = 1 - pull / BOW_SCALE
  const tipX = 1 - (0.35 * pull) / BOW_SCALE
  const tipY = Math.sqrt(100 ** 2 - (tipX - nockX) ** 2)
  const limb = (side: 1 | -1) =>
    `M26 ${side * 34}C22 ${side * 68} ${6 + 0.7 * (tipX - 1)} ${side * (84 - 0.7 * (100 - tipY))} ${tipX} ${side * tipY}q1 ${side * 8} 9 ${side * 9}`

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
    // Screen y points down, so a nose-up pitch is a negative screen angle.
    const flying = Math.atan2(b.y - a.y, b.x - a.x) - (now.pitch ?? 0) * ANGLE_GAIN * exaggeration

    // On the string the arrow lies along the bow, square to the string, tipped
    // nose-down by a nocking point above square. The nock rides the string.
    // The tip is about one degree, so it is amplified less than the flight is.
    const resting = aim + flight.launch.nockAngle * exaggeration
    const half = SCENE.arrowLength / 2
    const onString = {
      x: SCENE.bowX - pull * Math.cos(aim) + half * Math.cos(resting),
      y: SCENE.centerY - pull * Math.sin(aim) + half * Math.sin(resting),
    }

    const away = launchEase(time)
    const pose: ArrowPose = {
      centerX: onString.x + (center.x - onString.x) * away,
      centerY: onString.y + (center.y - onString.y) * away,
      length: SCENE.arrowLength,
      angle: resting + (flying - resting) * away,
      bend: 0,
    }
    const trail = trajectory
      .filter((point, index) => index % TRAIL_STEP === 0 && point.t <= time)
      .map((point) => project(point.x, point.y))
    return { pose, trail: time > 0 ? [...trail, { x: pose.centerX, y: pose.centerY }] : [] }
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

      {/* Recurve bow from the side, tilted to where it aims: string, limbs, riser, long rod. */}
      <g
        className="stroke-ink-muted"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        transform={`rotate(${(aim * 180) / Math.PI} ${SCENE.bowX} ${SCENE.centerY}) translate(${SCENE.bowX} ${SCENE.centerY}) scale(${BOW_SCALE})`}
      >
        <polyline points={`${tipX},${-tipY} ${nockX},0 ${tipX},${tipY}`} strokeWidth="1" />
        <path d={limb(-1)} strokeWidth="3" />
        <path d={limb(1)} strokeWidth="3" />
        <path d="M26 -34Q33 0 26 34" strokeWidth="7" />
        {/* The long rod is square to the string, so it shows where the bow points. */}
        <line x1="32" y1="19" x2="98" y2="19" strokeWidth="3" />
      </g>

      {bare && <FlyingArrow {...fly(bare)} bare />}
      <FlyingArrow {...fly(result)} />
    </svg>
  )
}
