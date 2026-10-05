import { HEURISTIC_V0 } from '../../engine/index.ts'
import type { SimulationResult } from '../../models/simulation.ts'

const WORDS: Record<string, string> = {
  WEAK: 'Weak',
  NEUTRAL: 'Neutral',
  STIFF: 'Stiff',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  LEFT: 'Left',
  RIGHT: 'Right',
}

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
  const { classification } = result
  const items = [
    ['Behavior', classification.stiffness],
    ['Oscillation', classification.oscillation],
    ['Lateral', classification.lateral],
    ['Clearance', classification.clearance],
  ] as const
  return (
    <dl aria-label="Model result" className="grid grid-cols-4 gap-2">
      {items.map(([title, value]) => (
        <div key={title} className="min-w-0">
          <dt className="text-ink-muted truncate text-sm">{title}</dt>
          <dd className="font-semibold">{WORDS[value]}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ResultPanel({ result }: { result: SimulationResult }) {
  const { metrics, classification } = result
  const thresholds = HEURISTIC_V0.thresholds

  return (
    <section aria-labelledby="result-heading">
      <h2 id="result-heading" className="font-display text-xl font-semibold">
        Model result
      </h2>
      <dl className="mt-3 grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <DivergingGauge
          title="Dynamic behavior"
          word={WORDS[classification.stiffness]!}
          value={metrics.dynamicBehavior}
          neutral={thresholds.stiffnessNeutral}
          lowLabel="Weak"
          highLabel="Stiff"
          tuningScale
        />
        <DivergingGauge
          title="Lateral tendency"
          word={WORDS[classification.lateral]!}
          value={metrics.lateralDeviation}
          neutral={thresholds.lateralNeutral}
          lowLabel="Left"
          highLabel="Right"
        />
        <LevelMeter
          title="Oscillation"
          word={WORDS[classification.oscillation]!}
          value={metrics.oscillation}
        />
        <LevelMeter
          title="Clearance sensitivity"
          word={WORDS[classification.clearance]!}
          value={metrics.clearanceRisk}
        />
      </dl>
      <p className="mt-5">
        <span className="text-ink-muted">Estimated speed</span>{' '}
        <span className="font-semibold">{(metrics.launchSpeed / 1000).toFixed(1)} m/s</span>
      </p>
      <p className="text-ink-muted mt-2 max-w-prose text-sm">
        These are tendencies from a simplified model that has not been checked against real
        shooting. Test on your own bow before changing equipment.
      </p>
    </section>
  )
}
