import { useMessages } from '../../i18n/useMessages.ts'
import type { BareShaftComparison } from '../../models/simulation.ts'
import { RINGS, RING_COLORS } from './rings.ts'

type Props = {
  /** The bare shaft test of the setup on screen. */
  comparison: BareShaftComparison
}

/** Half the side of the drawing, with the face one unit across its radius. */
const HALF = 1.16
/**
 * How far from the middle a bare shaft at full scale is drawn, in radii of the
 * face. The same reach as the flight seen from above has with one point of
 * impact: the model gives a lean, not centimetres.
 */
const REACH = 2.4
/** A bare shaft that would land outside the drawing is held at its edge. */
const EDGE = 1.06

/**
 * Where the model has the arrows land, on one target face: the fletched
 * arrows in the middle, as a sight set for them puts them, and the bare shaft
 * where it lands against them. A square that says in one look what the flight
 * drawn from above and from the side say in two.
 */
export function PredictedTarget({ comparison }: Props) {
  const m = useMessages()
  const text = m.panels.onTarget
  const { horizontal, vertical, offset } = comparison

  let x = offset.lateral * REACH
  let y = -offset.vertical * REACH
  const length = Math.hypot(x, y)
  const beyond = length > EDGE
  if (beyond) {
    x = (x / length) * EDGE
    y = (y / length) * EDGE
  }

  const sides = [
    horizontal === 'TOGETHER'
      ? null
      : m.attributes.ends.lateral[horizontal === 'LEFT' ? 'low' : 'high'],
    vertical === 'TOGETHER'
      ? null
      : m.attributes.ends.vertical[vertical === 'LOW' ? 'low' : 'high'],
  ].filter((side): side is string => side !== null)
  const reading = sides.length === 0 ? text.together : text.lands(sides.join(', ').toLowerCase())

  return (
    <div className="border-line bg-surface flex items-center gap-3 rounded-lg border p-2 sm:gap-4">
      <svg
        viewBox={`${-HALF} ${-HALF} ${2 * HALF} ${2 * HALF}`}
        role="img"
        aria-label={`${text.label} ${reading}`}
        className="bg-line/40 size-28 shrink-0 rounded-md sm:size-36"
      >
        {Array.from({ length: RINGS }, (_, ring) => (
          <circle
            key={ring}
            r={1 - ring / RINGS}
            fill={RING_COLORS[Math.floor(ring / 2)]}
            stroke={ring === 3 ? '#f5f5f5' : '#1b1e22'}
            strokeWidth={0.006}
          />
        ))}
        {length > 0.02 && (
          <line
            x1={0}
            y1={0}
            x2={x}
            y2={y}
            stroke="#101418"
            strokeWidth={0.02}
            strokeDasharray="0.05 0.04"
          />
        )}
        {/* Fletched: a filled mark. Bare shaft: a ring. Told apart by shape, not by color. */}
        <circle r={0.075} fill="#101418" stroke="#ffffff" strokeWidth={0.03} />
        <circle cx={x} cy={y} r={0.085} fill="#ffffff" stroke="#101418" strokeWidth={0.045} />
        {beyond && (
          // Past the edge of the drawing: an arrowhead says it goes on.
          <path
            d="M 0.16 0 L 0.06 -0.07 L 0.06 0.07 Z"
            fill="#101418"
            stroke="#ffffff"
            strokeWidth={0.015}
            transform={`translate(${x} ${y}) rotate(${(Math.atan2(y, x) * 180) / Math.PI})`}
          />
        )}
      </svg>
      <div className="grid min-w-0 gap-1">
        <p className="font-semibold">{reading}</p>
        <p className="text-ink-muted flex flex-wrap gap-x-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="bg-ink inline-block size-2.5 rounded-full" />
            {m.stage.fletched}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="border-ink inline-block size-2.5 rounded-full border-2"
            />
            {m.stage.bareShaft}
          </span>
        </p>
        <p className="text-ink-muted text-sm">{text.note}</p>
      </div>
    </div>
  )
}
