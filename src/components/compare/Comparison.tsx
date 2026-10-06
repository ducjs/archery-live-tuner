import { shapeOf } from '../../engine/index.ts'
import { parameterText } from '../../i18n/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { PARAMETERS, formatValue, getValue, type UnitSystem } from '../../models/parameters.ts'
import type { TuningSetup } from '../../models/setup.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { convert, unitLabel } from '../../utils/units.ts'
import { FlightView } from '../simulation/SimulationStage.tsx'
import type { ImpactMode } from '../simulation/timing.ts'
import { DrawCurveChart } from '../tuning/DrawCurveChart.tsx'
import { curveUnits } from '../tuning/drawCurveReading.ts'

/** One side of a comparison: a setup and what the model makes of it. */
export type Compared = {
  setup: TuningSetup
  result: SimulationResult
}

/** How many saved setups can stand next to the one on screen. More would not fit a screen. */
export const MOST_COMPARED = 3

type FlightProps = {
  saved: Compared[]
  now: Compared
  view: 'top' | 'side'
  impact: ImpactMode
  /** s, time on screen since the loop started, at normal playback speed */
  elapsed: number
  exaggeration: number
}

/** The saved setups and the one on screen, flown at the same moment. */
export function ComparisonFlight({ saved, now, view, impact, elapsed, exaggeration }: FlightProps) {
  const m = useMessages()
  const sides = [
    ...saved.map((side) => ({ ...side, title: m.compare.saved })),
    { ...now, title: m.compare.now },
  ]
  return (
    <div className="@container">
      <div className="grid gap-2 @4xl:grid-cols-2">
        {sides.map(({ setup, result, title }, index) => (
          <FlightView
            // A saved setup and the one on screen can be the same setup, before and after.
            key={`${index}-${setup.id}`}
            view={view}
            result={result}
            handedness={setup.bow.handedness}
            impact={impact}
            elapsed={elapsed}
            exaggeration={exaggeration}
            caption={`${title}: ${setup.name}`}
            compact
          />
        ))}
      </div>
    </div>
  )
}

const RATED = ['stiffness', 'lateral', 'vertical', 'oscillation', 'clearance'] as const

/** One value or result, as each compared setup has it. The setup on screen is last. */
type Row = { label: string; values: string[] }

function Rows({ rows }: { rows: Row[] }) {
  return (
    <tbody>
      {rows.map((row) => (
        <tr key={row.label} className="border-line border-t">
          <th scope="row" className="py-1.5 pr-2 text-left font-normal">
            {row.label}
          </th>
          {row.values.map((value, index) => {
            const last = index === row.values.length - 1
            // The setup on screen stands out where it differs from a saved one.
            const changed = last && row.values.some((other) => other !== value)
            return (
              <td
                key={index}
                className={`py-1.5 text-right ${last ? '' : 'pr-2'} ${changed ? 'font-semibold' : 'text-ink-muted'}`}
              >
                {value}
              </td>
            )
          })}
        </tr>
      ))}
    </tbody>
  )
}

type TableProps = {
  saved: Compared[]
  now: Compared
  units: UnitSystem
}

/** What was changed between the setups, and what the model reports for each. */
export function ComparisonTable({ saved, now, units }: TableProps) {
  const m = useMessages()
  const sides = [...saved, now]
  const several = saved.length > 1

  const inputs: Row[] = PARAMETERS.flatMap((parameter) => {
    const show = (setup: TuningSetup) =>
      parameter.kind === 'enum'
        ? (parameterText(m, parameter).options?.[getValue(setup, parameter)] ??
          getValue(setup, parameter))
        : formatValue(parameter, getValue(setup, parameter), units)
    const values = sides.map((side) => show(side.setup))
    return values.every((value) => value === values[0])
      ? []
      : [{ label: parameterText(m, parameter).label, values }]
  })

  const speed = (result: SimulationResult) =>
    `${(result.metrics.launchSpeed / 1000).toFixed(1)} m/s`
  const { length, force } = curveUnits(units)
  const gain = (result: SimulationResult) =>
    m.curve.perLength(
      (convert(result.metrics.clickerGain, 'N', force) * convert(1, length, 'mm')).toFixed(1),
      unitLabel(force),
      unitLabel(length),
    )
  const results: Row[] = [
    ...RATED.map((key) => ({
      label: m.result[key],
      values: sides.map((side) => m.rating[side.result.classification[key]]),
    })),
    { label: m.result.speed, values: sides.map((side) => speed(side.result)) },
    {
      label: m.curve.storedEnergy,
      values: sides.map((side) => `${side.result.metrics.storedEnergy.toFixed(1)} J`),
    },
    { label: m.curve.gain, values: sides.map((side) => gain(side.result)) },
  ]

  // Two setups are "saved" and "now"; more than two need their names.
  const headings = several
    ? [...saved.map((side) => side.setup.name), m.compare.now]
    : [m.compare.saved, m.compare.now]
  const head = (title: string) => (
    <thead className="text-ink-muted text-sm">
      <tr>
        <th scope="col" className="py-1 text-left font-normal">
          {title}
        </th>
        {headings.map((heading, index) => (
          <th
            key={index}
            scope="col"
            className={`max-w-28 py-1 text-right font-normal break-words ${several ? '' : 'w-1/4'} ${index === headings.length - 1 ? '' : 'pr-2'}`}
          >
            {heading}
          </th>
        ))}
      </tr>
    </thead>
  )

  return (
    <section aria-labelledby="compare-heading">
      <h2 id="compare-heading" className="font-display text-xl font-semibold">
        {m.compare.differences}
      </h2>
      {inputs.length === 0 ? (
        <p className="mt-2 max-w-prose">{several ? m.compare.sameAll : m.compare.same}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="mt-2 w-full">
            {head(m.compare.value)}
            <Rows rows={inputs} />
          </table>
        </div>
      )}

      <h2 className="font-display mt-6 text-xl font-semibold">{m.result.heading}</h2>
      <div className="overflow-x-auto">
        <table className="mt-2 w-full">
          {head(m.compare.value)}
          <Rows rows={results} />
        </table>
      </div>
      <h2 className="font-display mt-6 text-xl font-semibold">{m.curve.heading}</h2>
      <div className="mt-2">
        <DrawCurveChart
          curves={sides.map((side) => ({
            name: side.setup.name,
            bow: side.setup.bow,
            shape: shapeOf(side.result.metrics),
          }))}
          units={units}
        />
      </div>
      <p className="text-ink-muted mt-1 max-w-prose text-sm">{m.curve.compared}</p>
      <p className="text-ink-muted mt-3 max-w-prose text-sm">
        {several ? m.compare.noteAll : m.compare.note}
      </p>
    </section>
  )
}
