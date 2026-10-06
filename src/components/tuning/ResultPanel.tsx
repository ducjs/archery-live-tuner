import { HEURISTIC_V0, MIN_GRAINS_PER_POUND } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { Handedness } from '../../models/bow.ts'
import type { BareShaftComparison, SimulationResult } from '../../models/simulation.ts'
import { bareShaftReading } from './bareShaftReading.ts'

type GaugeProps = {
  title: string
  word: string
  /** -1..+1 */
  value: number
  /** Half-width of the neutral zone, on the same -1..+1 scale. */
  neutral: number
  lowLabel: string
  highLabel: string
  /** Colors the two sides as weak and stiff. Without it both sides are plain. */
  tuningScale?: boolean
}

function DivergingGauge({
  title,
  word,
  value,
  neutral,
  lowLabel,
  highLabel,
  tuningScale = false,
}: GaugeProps) {
  const neutralWidth = neutral * 100
  const sideClass = (tuning: string) => (tuningScale ? tuning : 'bg-ink-muted/25')
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-muted">{title}</dt>
        <dd className="text-lg font-semibold">{word}</dd>
      </div>
      <div className="relative mt-2 pb-1" aria-hidden="true">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          <div className={`flex-1 ${sideClass('bg-weak/60')}`} />
          <div className="bg-gold" style={{ width: `${neutralWidth}%` }} />
          <div className={`flex-1 ${sideClass('bg-stiff/60')}`} />
        </div>
        <div
          className="bg-ink ring-surface absolute -top-1 h-4.5 w-1 -translate-x-1/2 rounded-full ring-2 transition-[left] duration-150 ease-out motion-reduce:transition-none"
          style={{ left: `${((value + 1) / 2) * 100}%` }}
        />
      </div>
      <div className="text-ink-muted flex justify-between text-sm" aria-hidden="true">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}

type MeterProps = {
  title: string
  word: string
  /** 0..1 */
  value: number
}

function LevelMeter({ title, word, value }: MeterProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-muted">{title}</dt>
        <dd className="text-lg font-semibold">{word}</dd>
      </div>
      <div className="bg-ink-muted/25 mt-2 h-2.5 overflow-hidden rounded-full" aria-hidden="true">
        <div
          className="bg-ink h-full origin-left transition-transform duration-150 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${value})` }}
        />
      </div>
    </div>
  )
}

/** One-line version for small screens, shown next to the animation. */
export function ResultSummary({ result }: { result: SimulationResult }) {
  const m = useMessages()
  const { classification } = result
  const items = [
    [m.result.short.stiffness, classification.stiffness],
    [m.result.short.oscillation, classification.oscillation],
    [m.result.short.lateral, classification.lateral],
    [m.result.short.clearance, classification.clearance],
  ] as const
  return (
    <dl aria-label={m.result.heading} className="grid grid-cols-4 gap-2">
      {items.map(([title, value]) => (
        <div key={title} className="min-w-0">
          <dt className="text-ink-muted truncate text-sm">{title}</dt>
          <dd className="font-semibold">{m.rating[value]}</dd>
        </div>
      ))}
    </dl>
  )
}

type ResultPanelProps = {
  result: SimulationResult
  /** Leave out to hide the bare shaft test. */
  comparison?: BareShaftComparison
  handedness: Handedness
  /** Shows the numbers behind the ratings: grains per pound, front of center, energy. */
  advanced?: boolean
}

export function ResultPanel({
  result,
  comparison,
  handedness,
  advanced = false,
}: ResultPanelProps) {
  const { metrics, classification } = result
  const thresholds = HEURISTIC_V0.thresholds
  const target = result.trajectory.at(-1)!
  const m = useMessages()
  const text = m.result
  const reading = comparison && bareShaftReading(comparison, handedness, m)
  const grainsPerPound = metrics.grainsPerPound.toFixed(1)
  const frontOfCenter = metrics.frontOfCenter.toFixed(1)

  return (
    <section aria-labelledby="result-heading" className="@container">
      <h2 id="result-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <dl className="mt-3 grid gap-x-8 gap-y-5 @lg:grid-cols-2">
        <DivergingGauge
          title={text.stiffness}
          word={m.rating[classification.stiffness]}
          value={metrics.dynamicBehavior}
          neutral={thresholds.stiffnessNeutral}
          lowLabel={m.rating.WEAK}
          highLabel={m.rating.STIFF}
          tuningScale
        />
        <DivergingGauge
          title={text.lateral}
          word={m.rating[classification.lateral]}
          value={metrics.lateralDeviation}
          neutral={thresholds.lateralNeutral}
          lowLabel={m.rating.LEFT}
          highLabel={m.rating.RIGHT}
        />
        <DivergingGauge
          title={text.vertical}
          word={m.rating[classification.vertical]}
          value={metrics.verticalTendency}
          neutral={thresholds.verticalNeutral}
          lowLabel={m.rating.NOCK_LOW}
          highLabel={m.rating.NOCK_HIGH}
        />
        <LevelMeter
          title={text.oscillation}
          word={m.rating[classification.oscillation]}
          value={metrics.oscillation}
        />
        <LevelMeter
          title={text.clearance}
          word={m.rating[classification.clearance]}
          value={metrics.clearanceRisk}
        />
      </dl>
      {reading && (
        <div className="border-line mt-5 border-t pt-4">
          <h3 className="font-semibold">{text.bareShaftHeading}</h3>
          <p className="mt-1 max-w-prose">
            {reading.landing} {reading.meaning}
          </p>
          <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.bareShaftNote}</p>
        </div>
      )}
      <p className="mt-5">
        <span className="text-ink-muted">{text.speed}</span>{' '}
        <span className="font-semibold">{(metrics.launchSpeed / 1000).toFixed(1)} m/s</span>
        <span className="text-ink-muted">{text.reaching((target.x / 1000).toFixed(0))}</span>{' '}
        <span className="font-semibold">{target.t.toFixed(2)} s</span>
      </p>
      {advanced && (
        <dl className="mt-3 grid max-w-md gap-1">
          {(
            [
              [text.grainsPerPound, `${grainsPerPound} gr/lb`],
              [text.frontOfCenter, `${frontOfCenter} %`],
              [text.energy, `${metrics.kineticEnergy.toFixed(1)} J`],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-muted">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {metrics.grainsPerPound < MIN_GRAINS_PER_POUND && (
        <p
          role="status"
          className="border-weak bg-weak/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2"
        >
          {text.tooLight(grainsPerPound, MIN_GRAINS_PER_POUND)}
        </p>
      )}
      <p className="text-ink-muted mt-2 max-w-prose text-sm">{text.note}</p>
    </section>
  )
}
