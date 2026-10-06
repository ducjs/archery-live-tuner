import { HEURISTIC_V0, shapeOf } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { UnitSystem } from '../../models/parameters.ts'
import type { TuningSetup } from '../../models/setup.ts'
import type { SimulationMetrics, SimulationResult } from '../../models/simulation.ts'
import { convert, unitLabel } from '../../utils/units.ts'
import { DrawCurveChart, curveUnits } from './DrawCurveChart.tsx'

/** The gain at the clicker against what a common recurve gains. A comparison, not a verdict. */
export function gainReading(
  metrics: Pick<SimulationMetrics, 'clickerGain'>,
  drawWeight: number,
): 'USUAL' | 'GENTLER' | 'STEEPER' {
  const { usualGainPerInch, usualGainBand } = HEURISTIC_V0.drawCurve
  const sharePerInch = (metrics.clickerGain * 25.4) / drawWeight
  if (sharePerInch < usualGainPerInch - usualGainBand) return 'GENTLER'
  if (sharePerInch > usualGainPerInch + usualGainBand) return 'STEEPER'
  return 'USUAL'
}

type Props = {
  setup: TuningSetup
  result: SimulationResult
  units: UnitSystem
}

/** The draw force curve of the setup on screen: the chart, what it stores, how it ends. */
export function DrawCurvePanel({ setup, result, units }: Props) {
  const m = useMessages()
  const text = m.curve
  const { metrics } = result
  const { length, force } = curveUnits(units)
  // N per mm, shown as force per inch or per centimetre.
  const gain = convert(metrics.clickerGain, 'N', force) * convert(1, length, 'mm')

  return (
    <section aria-labelledby="draw-curve-heading" className="border-line mt-5 border-t pt-4">
      <h2 id="draw-curve-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <div className="mt-2">
        <DrawCurveChart
          curves={[{ name: setup.name, bow: setup.bow, shape: shapeOf(metrics) }]}
          units={units}
        />
      </div>
      <dl className="mt-3 grid max-w-md gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{text.storedEnergy}</dt>
          <dd className="font-semibold">{metrics.storedEnergy.toFixed(1)} J</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{text.gain}</dt>
          <dd className="font-semibold">
            {text.perLength(gain.toFixed(1), unitLabel(force), unitLabel(length))}
          </dd>
        </div>
      </dl>
      <p className="mt-2 max-w-prose">{text.reading[gainReading(metrics, setup.bow.drawWeight)]}</p>
      <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.estimated}</p>
    </section>
  )
}
