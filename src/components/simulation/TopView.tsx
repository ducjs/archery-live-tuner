import { useMemo } from 'react'
import type { Handedness } from '../../models/bow.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import {
  pointOnArrow,
  sampleTrajectory,
  shaftPath,
  type ArrowPose,
  type ScreenPoint,
} from './arrowGeometry.ts'

const WIDTH = 800
const HEIGHT = 300
const CENTER_Y = HEIGHT / 2
const BOW_X = 70
const TARGET_X = 752
const ARROW_LENGTH = 120

// Visual amplification. The drawing is not to scale.
const BEND_PIXELS = 26
const ANGLE_GAIN = 8
const DRIFT_PIXELS = 62

// World Archery target colors, from the center outward.
const TARGET_BANDS = ['#ffd23f', '#e5383b', '#2d9cdb', '#22262b', '#f5f5f5']
const BAND_HEIGHT = 16

type Props = {
  result: SimulationResult
  handedness: Handedness
  /** s, simulated time since release */
  time: number
}

function toPoints(points: ScreenPoint[]): string {
  return points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

export function TopView({ result, handedness, time }: Props) {
  const { trajectory } = result
  const last = trajectory[trajectory.length - 1]!
  const distance = last.x
  // Lateral drift at the target for a full-scale deviation; maps it to the outer ring.
  const fullDrift =
    Math.abs(last.z ?? 0) / Math.max(Math.abs(result.metrics.lateralDeviation), 1e-9)

  const project = useMemo(() => {
    const startX = BOW_X + ARROW_LENGTH / 2
    const endX = TARGET_X - ARROW_LENGTH / 2
    return (x: number, z: number): ScreenPoint => ({
      x: startX + (x / distance) * (endX - startX),
      // Shooting to the right of the screen, so the archer's right is down.
      y: CENTER_Y + (fullDrift > 0 ? z / fullDrift : 0) * DRIFT_PIXELS,
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
    length: ARROW_LENGTH,
    angle: (now.yaw ?? 0) * ANGLE_GAIN,
    bend: (now.flex ?? 0) * BEND_PIXELS,
  }

  const flown = trail.filter((point) => point.t <= time)
  const point = [
    pointOnArrow(pose, 1.03),
    pointOnArrow(pose, 0.95, 3.2),
    pointOnArrow(pose, 0.95, -3.2),
  ]
  const vanes = [-1, 1].map((sideOfShaft) => [
    pointOnArrow(pose, 0.05),
    pointOnArrow(pose, 0.07, sideOfShaft * 7),
    pointOnArrow(pose, 0.15, sideOfShaft * 7),
    pointOnArrow(pose, 0.18),
  ])

  // Seen from above, a right-handed bow has the arrow on the left of the riser.
  const riserOffset = handedness === 'RH' ? 7 : -7
  const { classification } = result

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Top view of the arrow flying from the bow to the target. The arrow is ${classification.stiffness.toLowerCase()}, with ${classification.oscillation.toLowerCase()} oscillation and a ${classification.lateral.toLowerCase()} lateral tendency.`}
      className="block h-auto w-full"
    >
      <line
        x1={BOW_X}
        y1={CENTER_Y}
        x2={TARGET_X}
        y2={CENTER_Y}
        className="stroke-line"
        strokeWidth="1.5"
        strokeDasharray="2 7"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Target, edge-on: each ring shows as a band on both sides of the center. */}
      <g>
        {TARGET_BANDS.map((color, ring) =>
          [-1, 1].map((sideOfCenter) => (
            <rect
              key={`${ring}-${sideOfCenter}`}
              x={TARGET_X}
              y={
                sideOfCenter === 1
                  ? CENTER_Y + ring * BAND_HEIGHT
                  : CENTER_Y - (ring + 1) * BAND_HEIGHT
              }
              width="12"
              height={BAND_HEIGHT}
              fill={color}
            />
          )),
        )}
        <rect
          x={TARGET_X}
          y={CENTER_Y - TARGET_BANDS.length * BAND_HEIGHT}
          width="12"
          height={TARGET_BANDS.length * BAND_HEIGHT * 2}
          fill="none"
          className="stroke-ink-muted"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </g>

      {/* Bow from above: riser, long rod forward, side rods back. */}
      <g
        className="stroke-ink-muted"
        strokeWidth="3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        transform={`translate(${BOW_X + 14} ${CENTER_Y + riserOffset})`}
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

      {flown.length > 1 && (
        <polyline
          points={toPoints(flown)}
          fill="none"
          className="stroke-accent"
          strokeWidth="1.5"
          strokeOpacity="0.45"
          vectorEffect="non-scaling-stroke"
        />
      )}

      <g className="stroke-ink" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {vanes.map((vane, index) => (
          <polygon
            key={index}
            points={toPoints(vane)}
            className="fill-accent stroke-accent"
            strokeWidth="1"
            fillOpacity="0.55"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={shaftPath(pose)} strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <polygon points={toPoints(point)} className="fill-ink" strokeWidth="1" />
      </g>
    </svg>
  )
}
