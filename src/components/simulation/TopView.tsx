import { useMessages } from '../../i18n/useMessages.ts'
import type { Handedness } from '../../models/bow.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { sampleTrajectory, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { AimLine, FlyingArrow, TargetEdge } from './sceneParts.tsx'
import { DRIFT_PIXELS, SCENE, drawBack, launchEase } from './timing.ts'

// Visual amplification per unit of exaggeration. The drawing is not to scale.
// Sideways movement of the middle of the shaft, as a share of its length, at
// full flex. A matched arrow (flex 0.4) bends by 3 % of its length at 1×.
const BEND_SHARE = 0.075
const ANGLE_GAIN = 3
const TRAIL_STEP = 6

type Props = {
  result: SimulationResult
  /** A bare shaft to fly alongside. */
  bare?: SimulationResult
  handedness: Handedness
  /** s, simulated time since the nock left the string; negative while it is on it */
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
  const m = useMessages()
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
      centerX: center.x - drawBack(flight, time),
      centerY: center.y,
      length: SCENE.arrowLength,
      angle: (now.yaw ?? 0) * ANGLE_GAIN * exaggeration * launchEase(time),
      bend: (now.flex ?? 0) * BEND_SHARE * SCENE.arrowLength * exaggeration,
    }
    const trail = flight.trajectory
      .filter((point, index) => index % TRAIL_STEP === 0 && point.t <= time)
      .map((point) => project(point.x, point.z ?? 0))
    return { pose, trail: time > 0 ? [...trail, center] : [] }
  }

  // Seen from above, a right-handed bow has the arrow on the left of the riser.
  const riserOffset = handedness === 'RH' ? 7 : -7

  return (
    <svg
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      role="img"
      aria-label={m.stage.topViewLabel(
        m.rating[classification.stiffness].toLowerCase(),
        m.rating[classification.oscillation].toLowerCase(),
        m.rating[classification.lateral].toLowerCase(),
      )}
      className="block h-auto w-full"
    >
      <AimLine fromX={SCENE.bowX} toX={SCENE.targetX} y={SCENE.centerY} />
      <TargetEdge x={SCENE.targetX} centerY={SCENE.centerY} distance={distance} />

      {/* Bow from above: riser, long rod forward, side rods back. */}
      <g
        className="stroke-ink-muted"
        strokeWidth="3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        transform={`translate(${SCENE.bowX + 14} ${SCENE.centerY + riserOffset})`}
      >
        <line x1="6" y1="0" x2="76" y2="0" />
        <line x1="-4" y1="0" x2="-28" y2="-15" />
        <line x1="-4" y1="0" x2="-28" y2="15" />
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
