import { useState, type KeyboardEvent, type MouseEvent } from 'react'
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
  /** Names the face for someone marking with the keyboard, and says how. */
  keyboardLabel: string
  /** Where the keyboard cursor is, in words: cm to the side and cm up or down. */
  describeCursor: (x: number, y: number) => string
}

/** The target face, with the arrows marked so far. Tap it to mark another. */
export function TargetFace({ plot, reading, label, onMark, keyboardLabel, describeCursor }: Props) {
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

  // Marking without a pointer: the arrow keys move a cursor over the face,
  // Enter or Space marks an arrow under it. Shift moves in finer steps.
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [focused, setFocused] = useState(false)
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? plot.faceDiameter / 200 : plot.faceDiameter / 40
    const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[
      event.key
    ]
    if (move) {
      event.preventDefault()
      const within = (value: number) => Math.max(-half, Math.min(half, value))
      setCursor(({ x, y }) => ({
        x: Math.round(within(x + move[0]! * step)) || 0,
        y: Math.round(within(y + move[1]! * step)) || 0,
      }))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onMark(cursor.x, cursor.y)
    }
  }

  const group = reading.fletchedCenter
  const bare = { x: group.x + reading.offset.x, y: group.y + reading.offset.y }

  return (
    <div
      role="application"
      aria-label={keyboardLabel}
      tabIndex={0}
      onKeyDown={key}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="focus-visible:outline-accent w-full max-w-md rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <svg
        viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`}
        role="img"
        aria-label={label}
        onClick={tap}
        className="bg-line/40 aspect-square w-full cursor-crosshair touch-manipulation rounded-lg"
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
        {focused && (
          // The keyboard cursor: a cross with a gap in the middle, light on dark so it shows on every ring.
          <g strokeLinecap="round" data-cursor="">
            {[MARK_LIGHT, MARK_INK].map((color, layer) => (
              <path
                key={color}
                d={`M${cursor.x - mark * 3} ${-cursor.y}h${mark * 2}m${mark * 2} 0h${mark * 2}M${cursor.x} ${-cursor.y - mark * 3}v${mark * 2}m0 ${mark * 2}v${mark * 2}`}
                stroke={color}
                strokeWidth={layer === 0 ? line * 6 : line * 2.5}
                fill="none"
              />
            ))}
          </g>
        )}
      </svg>
      <p className="sr-only" aria-live="polite">
        {focused ? describeCursor(cursor.x, cursor.y) : ''}
      </p>
    </div>
  )
}
