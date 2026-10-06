import { parameterText } from '../../i18n/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { PARAMETERS, formatValue, getValue, type UnitSystem } from '../../models/parameters.ts'
import type { TuningSetup } from '../../models/setup.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { FlightView } from '../simulation/SimulationStage.tsx'
import type { ImpactMode } from '../simulation/timing.ts'

/** One side of a comparison: a setup and what the model makes of it. */
export type Compared = {
  setup: TuningSetup
  result: SimulationResult
}

type FlightProps = {
  saved: Compared
  now: Compared
  view: 'top' | 'side'
  impact: ImpactMode
  /** s, time on screen since the loop started, at normal playback speed */
  elapsed: number
  exaggeration: number
}

/** The saved setup and the one on screen, flown at the same moment. */
export function ComparisonFlight({ saved, now, view, impact, elapsed, exaggeration }: FlightProps) {
  const m = useMessages()
  const sides = [
    { ...saved, title: m.compare.saved },
    { ...now, title: m.compare.now },
  ]
  return (
    <div className="@container">
      <div className="grid gap-2 @4xl:grid-cols-2">
        {sides.map(({ setup, result, title }) => (
          <FlightView
            key={title}
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

type Row = { label: string; saved: string; now: string }

function Rows({ rows }: { rows: Row[] }) {
  return (
    <tbody>
      {rows.map((row) => {
        const changed = row.saved !== row.now
        return (
          <tr key={row.label} className="border-line border-t">
            <th scope="row" className="py-1.5 pr-2 text-left font-normal">
              {row.label}
            </th>
            <td className="text-ink-muted py-1.5 pr-2 text-right">{row.saved}</td>
            <td className={`py-1.5 text-right ${changed ? 'font-semibold' : 'text-ink-muted'}`}>
              {row.now}
            </td>
          </tr>
        )
      })}
    </tbody>
  )
}

type TableProps = {
  saved: Compared
  now: Compared
  units: UnitSystem
}

/** What was changed between two setups, and what the model reports for each. */
export function ComparisonTable({ saved, now, units }: TableProps) {
  const m = useMessages()

  const inputs: Row[] = PARAMETERS.flatMap((parameter) => {
    const show = (setup: TuningSetup) =>
      parameter.kind === 'enum'
        ? (parameterText(m, parameter).options?.[getValue(setup, parameter)] ??
          getValue(setup, parameter))
        : formatValue(parameter, getValue(setup, parameter), units)
    const row = {
      label: parameterText(m, parameter).label,
      saved: show(saved.setup),
      now: show(now.setup),
    }
    return row.saved === row.now ? [] : [row]
  })

  const speed = (result: SimulationResult) =>
    `${(result.metrics.launchSpeed / 1000).toFixed(1)} m/s`
  const results: Row[] = [
    ...RATED.map((key) => ({
      label: m.result[key],
      saved: m.rating[saved.result.classification[key]],
      now: m.rating[now.result.classification[key]],
    })),
    { label: m.result.speed, saved: speed(saved.result), now: speed(now.result) },
  ]

  const head = (title: string) => (
    <thead className="text-ink-muted text-sm">
      <tr>
        <th scope="col" className="py-1 text-left font-normal">
          {title}
        </th>
        <th scope="col" className="w-1/4 py-1 pr-2 text-right font-normal">
          {m.compare.saved}
        </th>
        <th scope="col" className="w-1/4 py-1 text-right font-normal">
          {m.compare.now}
        </th>
      </tr>
    </thead>
  )

  return (
    <section aria-labelledby="compare-heading">
      <h2 id="compare-heading" className="font-display text-xl font-semibold">
        {m.compare.differences}
      </h2>
      {inputs.length === 0 ? (
        <p className="mt-2 max-w-prose">{m.compare.same}</p>
      ) : (
        <table className="mt-2 w-full">
          {head(m.compare.value)}
          <Rows rows={inputs} />
        </table>
      )}

      <h2 className="font-display mt-6 text-xl font-semibold">{m.result.heading}</h2>
      <table className="mt-2 w-full">
        {head(m.compare.value)}
        <Rows rows={results} />
      </table>
      <p className="text-ink-muted mt-3 max-w-prose text-sm">{m.compare.note}</p>
    </section>
  )
}
