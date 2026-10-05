import { pointOnArrow, shaftPath, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'

// World Archery target colors, from the center outward.
const TARGET_BANDS = ['#ffd23f', '#e5383b', '#2d9cdb', '#22262b', '#f5f5f5']
const BAND_HEIGHT = 16

function toPoints(points: ScreenPoint[]): string {
  return points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

/** The line the arrow would follow if nothing disturbed it. */
export function AimLine({ fromX, toX, y }: { fromX: number; toX: number; y: number }) {
  return (
    <line
      x1={fromX}
      y1={y}
      x2={toX}
      y2={y}
      className="stroke-line"
      strokeWidth="1.5"
      strokeDasharray="2 7"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  )
}

/** The target seen edge-on: each ring shows as a band on both sides of the center. */
export function TargetEdge({ x, centerY }: { x: number; centerY: number }) {
  const height = TARGET_BANDS.length * BAND_HEIGHT
  return (
    <g>
      {TARGET_BANDS.map((color, ring) =>
        [-1, 1].map((sideOfCenter) => (
          <rect
            key={`${ring}-${sideOfCenter}`}
            x={x}
            y={
              sideOfCenter === 1 ? centerY + ring * BAND_HEIGHT : centerY - (ring + 1) * BAND_HEIGHT
            }
            width="12"
            height={BAND_HEIGHT}
            fill={color}
          />
        )),
      )}
      <rect
        x={x}
        y={centerY - height}
        width="12"
        height={height * 2}
        fill="none"
        className="stroke-ink-muted"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  )
}

/** The path flown so far. */
export function Trail({ points }: { points: ScreenPoint[] }) {
  if (points.length < 2) return null
  return (
    <polyline
      points={toPoints(points)}
      fill="none"
      className="stroke-accent"
      strokeWidth="1.5"
      strokeOpacity="0.45"
      vectorEffect="non-scaling-stroke"
    />
  )
}

export function ArrowShape({ pose }: { pose: ArrowPose }) {
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
  return (
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
  )
}
