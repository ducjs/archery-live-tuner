import { useMessages } from '../../i18n/useMessages.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { sampleTrajectory, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { AimLine, FlyingArrow, TargetEdge } from './sceneParts.tsx'
import { SCENE, drawBack, launchEase } from './timing.ts'

// Visual amplification. The drawing is not to scale.
/**
 * How many times steeper than the real launch angle the bow and the start of
 * the arc are drawn. The real angle is 1.5° at 18 m and under 8° at 90 m.
 */
const ELEVATION_GAIN = 3
/** Tallest the arc may be drawn, so a long shot from a slow bow still fits. */
const MAX_RISE_PIXELS = 105
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

  // The path is that of the nock: it starts on the string and ends an arrow's
  // length short of the target.
  const startX = SCENE.bowX
  const endX = SCENE.targetX - SCENE.arrowLength

  // Height is scaled so that the arc sets off at the real launch angle times
  // ELEVATION_GAIN. A longer shot then shows as a steeper bow and a taller arc.
  // Both arrows share the scale.
  const early = sampleTrajectory(result.trajectory, DIRECTION_STEP)
  const elevation = Math.atan2(early.y, early.x)
  const apex = Math.max(1, ...result.trajectory.map((point) => point.y))
  const rise = Math.min(
    MAX_RISE_PIXELS,
    (Math.tan(Math.max(0, elevation) * ELEVATION_GAIN) * (endX - startX)) / 4,
  )
  const pixelsPerMm = rise / apex

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
    const path = project(now.x, now.y)

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

    // The nock is on the string until it leaves, then on the path. Only the
    // attitude eases from one to the other, so the arrow does not jump.
    const nock =
      time > 0
        ? path
        : { x: SCENE.bowX - pull * Math.cos(aim), y: SCENE.centerY - pull * Math.sin(aim) }
    const angle = resting + (flying - resting) * launchEase(time)
    const half = SCENE.arrowLength / 2
    const pose: ArrowPose = {
      centerX: nock.x + half * Math.cos(angle),
      centerY: nock.y + half * Math.sin(angle),
      length: SCENE.arrowLength,
      angle,
      bend: 0,
    }
    const trail = trajectory
      .filter((point, index) => index % TRAIL_STEP === 0 && point.t <= time)
      .map((point) => project(point.x, point.y))
    return { pose, trail: time > 0 ? [...trail, nock] : [] }
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
