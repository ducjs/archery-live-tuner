import { shapeOf } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { UnitSystem } from '../../models/parameters.ts'
import type { TuningSetup } from '../../models/setup.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { convert, unitLabel } from '../../utils/units.ts'
import { DrawCurveChart } from './DrawCurveChart.tsx'
import { MarkedWeightHelper } from './MarkedWeightHelper.tsx'
import { curveUnits, gainReading } from './drawCurveReading.ts'

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

  // Forces the archer entered. More of them than the curve used means some were refused.
  const entered = [setup.bow.drawForceNear, setup.bow.drawForceMid].filter(
    (newtons) => newtons > 0,
  ).length

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
      {entered > metrics.curveMeasuredPoints && (
        <p
          role="status"
          className="border-gold bg-gold/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2"
        >
          {text.notUsed}
        </p>
      )}
      {metrics.curveMeasuredPoints === 0 ? (
        <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.estimated}</p>
      ) : (
        <>
          <p className="mt-1 max-w-prose text-sm">{text.measured(metrics.curveMeasuredPoints)}</p>
          <p className="text-ink-muted max-w-prose text-sm">{text.measureAgain}</p>
        </>
      )}
      <MarkedWeightHelper />
    </section>
  )
}
