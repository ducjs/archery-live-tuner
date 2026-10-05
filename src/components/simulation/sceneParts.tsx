import { pointOnArrow, shaftPath, type ArrowPose, type ScreenPoint } from './arrowGeometry.ts'
import { EQUIPMENT_SCALE, targetFaceDiameter } from './timing.ts'

// World Archery target colors, from the center outward. Each color is two
// scoring rings, and all ten rings are equally wide.
const TARGET_COLORS = ['#ffe552', '#f0483e', '#3fb4e4', '#1b1e22', '#f5f5f5']
const TARGET_THICKNESS = 12

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

type TargetProps = {
  x: number
  centerY: number
  /** mm, distance to the target; it decides which face is shot */
  distance: number
}

/**
 * The target face seen edge-on, at the scale of the bow: each color shows as a
 * band on both sides of the center, with a line between its two rings.
 */
export function TargetEdge({ x, centerY, distance }: TargetProps) {
  const diameter = targetFaceDiameter(distance)
  const radius = (diameter * EQUIPMENT_SCALE) / 2
  const band = radius / TARGET_COLORS.length
  return (
    <g>
      {TARGET_COLORS.map((color, index) =>
        [-1, 1].map((sideOfCenter) => (
          <rect
            key={`${index}-${sideOfCenter}`}
            x={x}
            y={sideOfCenter === 1 ? centerY + index * band : centerY - (index + 1) * band}
            width={TARGET_THICKNESS}
            height={band}
            fill={color}
          />
        )),
      )}
      {/* Ring lines, left out when the face is drawn too small to show them. */}
      {band >= 8 &&
        Array.from({ length: 19 }, (_, index) => index - 9).map((ring) => (
          <line
            key={ring}
            x1={x}
            x2={x + TARGET_THICKNESS}
            y1={centerY + (ring * band) / 2}
            y2={centerY + (ring * band) / 2}
            // Black rings need a light line to show.
            stroke={Math.abs(ring) === 7 ? '#f5f5f5' : '#1b1e22'}
            strokeWidth="0.5"
            strokeOpacity="0.6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      <rect
        x={x}
        y={centerY - radius}
        width={TARGET_THICKNESS}
        height={radius * 2}
        fill="none"
        className="stroke-ink-muted"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={x + TARGET_THICKNESS}
        y={centerY + radius + 16}
        textAnchor="end"
        className="fill-ink-muted"
        fontSize="13"
      >
        {`⌀ ${diameter / 10} cm`}
      </text>
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
