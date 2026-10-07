import type { MouseEvent } from 'react'
import type { PlotReading } from '../../engine/index.ts'
import type { TargetPlot } from '../../models/observation.ts'

// World Archery colors, outer ring first. Each color covers two scoring rings.
const RING_COLORS = ['#f5f5f5', '#1b1e22', '#3fb4e4', '#f0483e', '#ffe552']
const RINGS = 10
/** How much of the butt around the face is shown, so a miss can be marked too. */
const MARGIN = 1.12
// Marks are drawn larger than an arrow, to be seen and told apart on a phone.
const MARK_INK = '#101418'
const MARK_LIGHT = '#ffffff'

type Props = {
  plot: TargetPlot
  reading: PlotReading
  label: string
  /** Called with where the face was tapped, in mm from its middle, x right and y up. */
  onMark: (x: number, y: number) => void
}

/** The target face, with the arrows marked so far. Tap it to mark another. */
export function TargetFace({ plot, reading, label, onMark }: Props) {
  const radius = plot.faceDiameter / 2
  const half = radius * MARGIN
  const mark = radius / 22
  const line = radius / 160

  const tap = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) return
    const x = ((event.clientX - box.left) / box.width) * 2 * half - half
    const y = -(((event.clientY - box.top) / box.height) * 2 * half - half)
    // `|| 0` keeps a tap on the middle from being stored as -0.
    onMark(Math.round(x) || 0, Math.round(y) || 0)
  }

  const group = reading.fletchedCenter
  const bare = { x: group.x + reading.offset.x, y: group.y + reading.offset.y }

  return (
    <svg
      viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
      role="img"
      aria-label={label}
      onClick={tap}
      className="bg-line/40 aspect-square w-full max-w-md cursor-crosshair touch-manipulation rounded-lg"
    >
      {Array.from({ length: RINGS }, (_, ring) => (
        <circle
          key={ring}
          r={radius * (1 - ring / RINGS)}
          fill={RING_COLORS[Math.floor(ring / 2)]}
          // The lines between rings are light on the black, dark elsewhere.
          stroke={ring === 3 ? '#f5f5f5' : '#1b1e22'}
          strokeWidth={line}
        />
      ))}
      {reading.enough && reading.offsetLength > 0 && (
        // From the middle of the fletched group to the middle of the bare shafts.
        <g stroke={MARK_LIGHT} strokeWidth={line * 5} strokeLinecap="round">
          <line x1={group.x} y1={-group.y} x2={bare.x} y2={-bare.y} />
          <line
            x1={group.x}
            y1={-group.y}
            x2={bare.x}
            y2={-bare.y}
            stroke={MARK_INK}
            strokeWidth={line * 2}
            strokeDasharray={`${line * 6} ${line * 5}`}
          />
        </g>
      )}
      {plot.marks.map((arrow, index) =>
        arrow.bare ? (
          // Bare shafts are a square outline, so they differ by shape, not only by color.
          <rect
            key={index}
            x={arrow.x - mark}
            y={-arrow.y - mark}
            width={mark * 2}
            height={mark * 2}
            fill={MARK_LIGHT}
            stroke={MARK_INK}
            strokeWidth={mark / 2}
          />
        ) : (
          <circle
            key={index}
            cx={arrow.x}
            cy={-arrow.y}
            r={mark}
            fill={MARK_INK}
            stroke={MARK_LIGHT}
            strokeWidth={mark / 3}
          />
        ),
      )}
    </svg>
  )
}
