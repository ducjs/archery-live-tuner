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

type ArrowProps = {
  pose: ArrowPose
  /** Path flown so far. */
  trail: ScreenPoint[]
  /** Draws a bare shaft: no vanes, lighter line, dashed trail. */
  bare?: boolean
}

/** One arrow in flight, with the path behind it. */
export function FlyingArrow({ pose, trail, bare = false }: ArrowProps) {
  // Point and vanes keep their proportion to the shaft.
  const pointWidth = pose.length * 0.03
  const vaneHeight = pose.length * 0.06
  const point = [
    pointOnArrow(pose, 1.03),
    pointOnArrow(pose, 0.95, pointWidth),
    pointOnArrow(pose, 0.95, -pointWidth),
  ]
  const vanes = [-1, 1].map((sideOfShaft) => [
    pointOnArrow(pose, 0.05),
    pointOnArrow(pose, 0.07, sideOfShaft * vaneHeight),
    pointOnArrow(pose, 0.15, sideOfShaft * vaneHeight),
    pointOnArrow(pose, 0.18),
  ])
  const tone = bare ? 'stroke-ink-muted' : 'stroke-ink'

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {trail.length > 1 && (
        <polyline
          points={toPoints(trail)}
          className={bare ? 'stroke-ink-muted' : 'stroke-accent'}
          strokeWidth="1.5"
          strokeOpacity="0.5"
          strokeDasharray={bare ? '5 5' : undefined}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {!bare &&
        vanes.map((vane, index) => (
          <polygon
            key={index}
            points={toPoints(vane)}
            className="fill-accent stroke-accent"
            strokeWidth="1"
            fillOpacity="0.55"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      <path
        d={shaftPath(pose)}
        className={tone}
        strokeWidth={bare ? 2 : 2.5}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        points={toPoints(point)}
        className={bare ? 'fill-ink-muted stroke-ink-muted' : 'fill-ink stroke-ink'}
        strokeWidth="1"
      />
    </g>
  )
}
