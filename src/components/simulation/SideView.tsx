import { useMessages } from '../../i18n/useMessages.ts'
import type { SimulationResult, TrajectoryPoint } from '../../models/simulation.ts'
import { sampleTrajectory, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { AimLine, FlyingArrow, TargetEdge } from './sceneParts.tsx'
import {
  EQUIPMENT_SCALE,
  SCENE,
  drawBack,
  driftPixels,
  launchEase,
  type ImpactMode,
} from './timing.ts'

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
/** Distance from the string at which the bow angle is marked, just past the long rod. */
const ANGLE_MARK = 96
/** Where the sight extension leaves the riser, in the frame of the bow. */
const RISER_FRONT = 31
/** mm above the arrow at which the sight extension is drawn: about where a sight mounts. */
const SIGHT_BAR_TOP = 130

/** The sight as it is set for the distance being shot, in mm. */
export type SightOnBow = {
  /** How far in front of the riser the pin sits. */
  extension: number
  /** The middle of the pin above the line of the arrow; negative when it would be below. */
  pinHeight: number
  pinDiameter: number
  /** How much room the vanes have under the pin. */
  status: 'clear' | 'close' | 'blocked'
}

type Props = {
  result: SimulationResult
  /** Draws the sight on the bow, with the pin where this distance puts it. */
  sight?: SightOnBow
  /** A bare shaft to fly alongside. */
  bare?: SimulationResult
  impact: ImpactMode
  /** s, simulated time since the nock left the string; negative while it is on it */
  time: number
  /** 1..5, how much the arrow's attitude is amplified */
  exaggeration: number
}

/** The flight seen from the side. Shaft bending is sideways, so none is drawn here. */
export function SideView({ result, bare, sight, impact, time, exaggeration }: Props) {
  const m = useMessages()
  const { classification } = result
  const distance = result.trajectory.at(-1)!.x

  // The path runs from the string to the face of the target. The arrow rides it
  // by its nock at the start and by its point at the end, so that it leaves the
  // string without a jump and its point lands where the path does.
  const startX = SCENE.bowX
  const endX = SCENE.targetX

  // Height is scaled so that the arc sets off at the real launch angle times
  // ELEVATION_GAIN. A longer shot then shows as a steeper bow and a taller arc.
  //
  // A flight is the arc aimed at the center plus a drift away from it that
  // grows evenly with distance. The two are drawn on scales of their own: on
  // the scale of the arc, the gap between a bare shaft and the fletched arrows
  // would be a couple of units and could not be read.
  const landing = (flight: SimulationResult) => flight.trajectory.at(-1)!.y
  const arc = (flight: SimulationResult, point: TrajectoryPoint) =>
    point.y - (landing(flight) * point.x) / distance

  const early = sampleTrajectory(result.trajectory, DIRECTION_STEP)
  const elevation = Math.atan2(arc(result, early), early.x)
  const apex = Math.max(1, ...result.trajectory.map((point) => arc(result, point)))
  const rise = Math.min(
    MAX_RISE_PIXELS,
    (Math.tan(Math.max(0, elevation) * ELEVATION_GAIN) * (endX - startX)) / 4,
  )
  const pixelsPerMm = rise / apex

  // As in the top view: with one point of impact the fletched arrows are
  // sighted in on the center, and a bare shaft is drawn by how far it lands
  // from them. With two, each lands where the model puts it.
  const driftScale = driftPixels(distance, impact) / result.fullDrift.vertical
  const sightedIn = impact === 'one' ? landing(result) : 0

  const project = (flight: SimulationResult, point: TrajectoryPoint): ScreenPoint => {
    const along = point.x / distance
    const drift = (landing(flight) - sightedIn) * driftScale * along
    return {
      x: startX + along * (endX - startX),
      y: SCENE.centerY - arc(flight, point) * pixelsPerMm - drift,
    }
  }

  // Where the bow points: up the start of the arc, as drawn.
  const aim = -Math.atan((4 * rise) / (endX - startX))
  const pull = drawBack(result, time)

  // The bow in its own frame: string at x = 1, limb tips 100 above and below.
  // Drawing the string back bends the limbs: the tips come back and inward, far
  // enough that the string keeps its length.
  const nockX = 1 - pull / BOW_SCALE
  const tipX = 1 - (0.35 * pull) / BOW_SCALE
  const tipY = Math.sqrt(100 ** 2 - (tipX - nockX) ** 2)
  const limb = (side: 1 | -1) =>
    `M26 ${side * 34}C22 ${side * 68} ${6 + 0.7 * (tipX - 1)} ${side * (84 - 0.7 * (100 - tipY))} ${tipX} ${side * tipY}q1 ${side * 8} 9 ${side * 9}`

  // The sight, in the frame of the bow: 1 unit there is BOW_SCALE drawing units.
  const perMm = EQUIPMENT_SCALE / BOW_SCALE
  const pinX = RISER_FRONT + (sight?.extension ?? 0) * perMm
  // The arrow on the bow is drawn tipped nose-down, more than it really is. The
  // pin is placed against that drawn line, so that a pin in the way of the
  // arrow is also seen to be in its way.
  // The line is that of the arrow at full draw, which is how the clip opens.
  const fullDrawNock = 1 - drawBack(result, Number.NEGATIVE_INFINITY) / BOW_SCALE
  const arrowLine = (pinX - fullDrawNock) * Math.tan(result.launch.nockAngle * exaggeration)
  const pin = sight && {
    x: pinX,
    y: arrowLine - sight.pinHeight * perMm,
    // Drawn no smaller than this, or a 12 mm ring could not be seen.
    radius: Math.max(2.2, (sight.pinDiameter / 2) * perMm),
    // The bar the pin slides on reaches from above the highest mark to the pin.
    top: arrowLine - SIGHT_BAR_TOP * perMm,
  }

  const fly = (flight: SimulationResult) => {
    const { trajectory } = flight
    const now = sampleTrajectory(trajectory, time)
    const path = project(flight, now)

    // Direction of travel on screen, from a short step along the path.
    const stepStart = Math.min(
      Math.max(0, time - DIRECTION_STEP / 2),
      trajectory.at(-1)!.t - DIRECTION_STEP,
    )
    const from = sampleTrajectory(trajectory, stepStart)
    const to = sampleTrajectory(trajectory, stepStart + DIRECTION_STEP)
    const a = project(flight, from)
    const b = project(flight, to)
    // Screen y points down, so a nose-up pitch is a negative screen angle.
    const flying = Math.atan2(b.y - a.y, b.x - a.x) - (now.pitch ?? 0) * ANGLE_GAIN * exaggeration

    // On the string the arrow lies along the bow, square to the string, tipped
    // nose-down by a nocking point above square. The nock rides the string.
    // The tip is about one degree, so it is amplified less than the flight is.
    const resting = aim + flight.launch.nockAngle * exaggeration

    // The nock is on the string until it leaves. Only the attitude eases into
    // flight, so the arrow does not jump.
    const angle = resting + (flying - resting) * launchEase(time)
    // How far along the shaft the path is held: the nock at first, the point at the end.
    const held = (now.x / distance) * SCENE.arrowLength
    const nock =
      time > 0
        ? { x: path.x - held * Math.cos(angle), y: path.y - held * Math.sin(angle) }
        : { x: SCENE.bowX - pull * Math.cos(aim), y: SCENE.centerY - pull * Math.sin(aim) }
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
      .map((point) => project(flight, point))
    return { pose, trail: time > 0 ? [...trail, path] : [] }
  }

  const vertical =
    classification.vertical === 'NEUTRAL'
      ? m.stage.level
      : m.rating[classification.vertical].toLowerCase()

  return (
    <svg
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      role="img"
      // The sight is told in words too: its state must not rest on color alone.
      aria-label={[m.stage.sideViewLabel(vertical), sight && m.sight.sightLabel[sight.status]]
        .filter(Boolean)
        .join(' ')}
      className="block h-auto w-full"
    >
      <AimLine fromX={SCENE.bowX} toX={SCENE.targetX} y={SCENE.centerY} />
      <TargetEdge x={SCENE.targetX} centerY={SCENE.centerY} distance={distance} />

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
        {pin && (
          // The sight: the extension out from the riser, the bar down from it, the pin on the bar.
          <g data-sight={sight.status}>
            <path
              d={`M${RISER_FRONT} ${pin.top}H${pin.x}V${Math.max(pin.y, pin.top + 4)}`}
              strokeWidth="1.5"
            />
            <circle
              cx={pin.x}
              cy={pin.y}
              r={pin.radius}
              strokeWidth="2"
              className={
                sight.status === 'clear'
                  ? 'stroke-ink fill-surface'
                  : sight.status === 'close'
                    ? 'stroke-gold fill-surface'
                    : 'stroke-weak fill-weak'
              }
            />
          </g>
        )}
      </g>

      {/* How far the bow is raised: the arc is drawn steeper, the number is the real angle. */}
      <path
        d={`M${SCENE.bowX + ANGLE_MARK} ${SCENE.centerY}A${ANGLE_MARK} ${ANGLE_MARK} 0 0 0 ${SCENE.bowX + ANGLE_MARK * Math.cos(aim)} ${SCENE.centerY + ANGLE_MARK * Math.sin(aim)}`}
        fill="none"
        className="stroke-accent"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={SCENE.bowX + ANGLE_MARK + 8}
        y={SCENE.centerY + 18}
        className="fill-ink"
        fontSize="13"
      >
        {m.stage.bowAngle(((Math.max(0, elevation) * 180) / Math.PI).toFixed(1))}
      </text>

      {bare && <FlyingArrow {...fly(bare)} bare />}
      <FlyingArrow {...fly(result)} />
    </svg>
  )
}
