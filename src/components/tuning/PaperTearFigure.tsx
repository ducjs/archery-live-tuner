import type { PaperTear } from '../../models/simulation.ts'
import { SHEET, tearGeometry, type SheetPoint } from './paperTearGeometry.ts'

const HOLE_RADIUS = 6.5

const at = ({ x, y }: SheetPoint) => `${x.toFixed(1)} ${y.toFixed(1)}`

type Props = {
  tear: PaperTear
  /** What the drawing shows, for a screen reader. */
  label: string
}

/** The sheet of paper after the shot, as the archer sees it from the shooting line. */
export function PaperTearFigure({ tear, label }: Props) {
  const { hole, tail, vanes } = tearGeometry(tear.tail)
  // The opening: from the hole along the shaft to the tail, and out along each vane.
  const opening = [
    `M${at(hole)} L${at(tail)}`,
    ...vanes.map((vane) => `M${at(tail)} L${at(vane)}`),
  ].join(' ')
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${SHEET} ${SHEET}`}
      className="h-28 w-28 shrink-0"
    >
      <rect
        x="1"
        y="1"
        width={SHEET - 2}
        height={SHEET - 2}
        rx="3"
        className="fill-surface stroke-line"
        strokeWidth="2"
      />
      {/* Ruled like the sheet in the tuning guides, to judge the size of a tear by. */}
      {[40, 80].map((line) => (
        <g key={line} className="stroke-line" strokeWidth="1">
          <line x1={line} y1="2" x2={line} y2={SHEET - 2} />
          <line x1="2" y1={line} x2={SHEET - 2} y2={line} />
        </g>
      ))}
      {/* Drawn twice: a dark edge, then the opening itself, through which the backstop shows. */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={opening} className="stroke-ink" strokeWidth="7" />
        <circle cx={hole.x} cy={hole.y} r={HOLE_RADIUS + 1.5} className="fill-ink" />
        <path d={opening} className="stroke-paper" strokeWidth="4" />
        <circle cx={hole.x} cy={hole.y} r={HOLE_RADIUS} className="fill-paper" />
      </g>
    </svg>
  )
}
