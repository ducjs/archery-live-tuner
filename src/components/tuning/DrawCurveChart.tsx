import { HEURISTIC_V0, curvePoints } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { BowSetup } from '../../models/bow.ts'
import type { UnitSystem } from '../../models/parameters.ts'
import type { CurveShape } from '../../models/simulation.ts'
import { convert, unitLabel } from '../../utils/units.ts'
import { curveUnits } from './drawCurveReading.ts'

export type ChartCurve = { name: string; bow: BowSetup; shape: CurveShape }

const WIDTH = 320
const HEIGHT = 200
const LEFT = 36
const RIGHT = 14
const TOP = 12
const BOTTOM = 34

type Props = {
  /** The last one is the setup on screen and is drawn strongest. */
  curves: ChartCurve[]
  units: UnitSystem
}

/** Force on the fingers against draw length, from brace height to full draw. */
export function DrawCurveChart({ curves, units }: Props) {
  const m = useMessages()
  const { length, force } = curveUnits(units)
  const main = curves.at(-1)!
  const from = Math.min(...curves.map((curve) => curve.bow.braceHeight))
  const to = Math.max(...curves.map((curve) => curve.bow.drawLength))
  const top = Math.max(...curves.map((curve) => curve.bow.drawWeight)) * 1.08
  const x = (draw: number) => LEFT + ((draw - from) / (to - from)) * (WIDTH - LEFT - RIGHT)
  const y = (newtons: number) => HEIGHT - BOTTOM - (newtons / top) * (HEIGHT - TOP - BOTTOM)
  const shownLength = (mm: number) => convert(mm, 'mm', length).toFixed(1)
  const shownForce = (newtons: number) => convert(newtons, 'N', force).toFixed(1)

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={m.curve.chart(
        `${shownForce(main.bow.drawWeight)} ${unitLabel(force)}`,
        `${shownLength(main.bow.drawLength)} ${unitLabel(length)}`,
      )}
      className="text-ink h-auto w-full max-w-md"
    >
      <g className="text-ink-muted" fill="currentColor" fontSize="11">
        <path
          d={`M${LEFT} ${TOP}V${HEIGHT - BOTTOM}H${WIDTH - RIGHT}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <text x={LEFT} y={HEIGHT - BOTTOM + 14}>
          {shownLength(from)}
        </text>
        <text x={WIDTH - RIGHT} y={HEIGHT - BOTTOM + 14} textAnchor="end">
          {shownLength(to)}
        </text>
        <text x={(LEFT + WIDTH - RIGHT) / 2} y={HEIGHT - 6} textAnchor="middle">
          {m.curve.drawAxis(unitLabel(length))}
        </text>
        <text x={LEFT - 5} y={HEIGHT - BOTTOM} textAnchor="end">
          0
        </text>
        <text x={LEFT - 5} y={y(main.bow.drawWeight) + 4} textAnchor="end">
          {shownForce(main.bow.drawWeight)}
        </text>
        <text x={LEFT + 6} y={TOP + 10}>
          {m.curve.forceAxis(unitLabel(force))}
        </text>
      </g>
      {curves.map((curve, index) => {
        const last = index === curves.length - 1
        const points = curvePoints(curve.bow, curve.shape)
        const end = points.at(-1)!
        return (
          <g key={index} className={last ? 'text-ink' : 'text-ink-muted'}>
            <title>{curve.name}</title>
            <polyline
              points={points
                .map((point) => `${x(point.draw).toFixed(1)},${y(point.force).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth={last ? 2.5 : 1.5}
              strokeDasharray={last ? undefined : '5 4'}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={x(end.draw)} cy={y(end.force)} r={last ? 4 : 3} fill="currentColor" />
            {last &&
              curve.shape.measuredPoints > 0 &&
              (
                [
                  [HEURISTIC_V0.drawCurve.nearOffset, curve.bow.drawForceNear],
                  [HEURISTIC_V0.drawCurve.midOffset, curve.bow.drawForceMid],
                ] as const
              )
                .slice(0, curve.shape.measuredPoints)
                .map(([offset, newtons]) => (
                  <circle
                    key={offset}
                    data-measured
                    cx={x(curve.bow.drawLength - offset)}
                    cy={y(newtons)}
                    r="5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-accent"
                  />
                ))}
          </g>
        )
      })}
      <text
        x={x(main.bow.drawLength) - 8}
        y={y(main.bow.drawWeight) - 8}
        textAnchor="end"
        fontSize="11"
        className="text-accent"
        fill="currentColor"
        stroke="var(--color-surface)"
        strokeWidth="3"
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {m.curve.clicker}
      </text>
    </svg>
  )
}
