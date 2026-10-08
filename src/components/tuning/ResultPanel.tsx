import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { FOC_RANGE, HEURISTIC_V0, MIN_GRAINS_PER_POUND, readPaperTear } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { Handedness } from '../../models/bow.ts'
import { tierShows, type ParameterTier } from '../../models/parameters.ts'
import type { BareShaftComparison, SimulationResult } from '../../models/simulation.ts'
import { convert } from '../../utils/units.ts'
import { bareShaftReading } from './bareShaftReading.ts'
import { PaperTearFigure } from './PaperTearFigure.tsx'
import { paperTearReading } from './paperTearReading.ts'
import { resultReading } from './resultReading.ts'

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
    // The bar belongs to the value, so it sits inside the <dd>: a group of a
    // definition list may hold nothing but its term and its description.
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-3">
      <dt className="text-ink-muted">{title}</dt>
      <dd className="contents">
        <span className="text-lg font-semibold">{word}</span>
        <div className="relative col-span-2 mt-2 pb-1" aria-hidden="true">
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
        <div className="text-ink-muted col-span-2 flex justify-between text-sm" aria-hidden="true">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </dd>
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
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-3">
      <dt className="text-ink-muted">{title}</dt>
      <dd className="contents">
        <span className="text-lg font-semibold">{word}</span>
        <div
          className="bg-ink-muted/25 col-span-2 mt-2 h-2.5 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          <div
            className="bg-ink h-full origin-left transition-transform duration-150 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${value})` }}
          />
        </div>
      </dd>
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

type SentenceProps = {
  result: SimulationResult
  /** Leave out to say nothing of the bare shaft. */
  comparison?: BareShaftComparison
  handedness: Handedness
}

/** The result in a sentence or two of plain words. */
export function ResultSentence({ result, comparison, handedness }: SentenceProps) {
  const m = useMessages()
  const reading = comparison && bareShaftReading(comparison, handedness, m)
  return (
    <p className="max-w-prose text-lg leading-snug font-medium">
      {resultReading(result, m).join(' ')}
      {reading && ` ${reading.landing}`}
    </p>
  )
}

const TABS = ['gauges', 'bareShaft', 'paper', 'numbers', 'curve'] as const
type Tab = (typeof TABS)[number]

type ResultPanelProps = {
  result: SimulationResult
  /** Leave out to hide the bare shaft test. */
  comparison?: BareShaftComparison
  handedness: Handedness
  /** How much of the detail is on offer: the paper tear and the numbers from Advanced on. */
  level?: ParameterTier
  /** mm, as entered. Given, the panel says when it is outside the range for the bow. */
  braceHeight?: number
  /** mm, as entered. Given, the panel says what limb alignment adds to it. */
  centerShot?: number
  /** Shown right under the reading: what to try next. */
  nextStep?: ReactNode
  /** The draw force curve, as a tab of its own. */
  curve?: ReactNode
}

export function ResultPanel({
  result,
  comparison,
  handedness,
  level = 'simple',
  braceHeight,
  centerShot,
  nextStep,
  curve,
}: ResultPanelProps) {
  const { metrics, classification } = result
  const thresholds = HEURISTIC_V0.thresholds
  const target = result.trajectory.at(-1)!
  const m = useMessages()
  const text = m.result
  const id = useId()
  const reading = comparison && bareShaftReading(comparison, handedness, m)
  const tear = comparison && readPaperTear(comparison, handedness)
  const tearReading = tear && paperTearReading(tear, handedness, m)
  const [chosen, setChosen] = useState<Tab>('gauges')
  const grainsPerPound = metrics.grainsPerPound.toFixed(1)
  const grains = (grams: number) => convert(grams, 'g', 'gr').toFixed(0)
  // Under the AMO chart the bow itself is at risk; that is said once, and louder.
  const belowMinimum = metrics.arrowMass < metrics.minimumArrowMass
  const braceOff =
    braceHeight !== undefined &&
    (braceHeight < metrics.braceHeightMin - 0.05 || braceHeight > metrics.braceHeightMax + 0.05)
  // What the limbs add to the center shot the archer entered.
  const limbShift = centerShot === undefined ? 0 : metrics.effectiveCenterShot - centerShot
  const frontOfCenter = metrics.frontOfCenter.toFixed(1)
  const focOutside = metrics.frontOfCenter < FOC_RANGE.low || metrics.frontOfCenter > FOC_RANGE.high
  const advanced = tierShows(level, 'advanced')
  const pro = tierShows(level, 'pro')

  // Only one part of the detail is on screen at a time.
  const available: Record<Tab, boolean> = {
    gauges: true,
    bareShaft: Boolean(reading),
    paper: advanced && Boolean(tear && tearReading),
    numbers: advanced,
    curve: pro && Boolean(curve),
  }
  const tabs = TABS.filter((name) => available[name])
  const tab = available[chosen] ? chosen : 'gauges'
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length]!
    setChosen(next)
    document.getElementById(`${id}-tab-${next}`)?.focus()
  }

  return (
    <section
      aria-labelledby="result-heading"
      className="border-line bg-panel rounded-xl border p-4 @container"
    >
      <h2 id="result-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <div className="mt-2">
        <ResultSentence result={result} comparison={comparison} handedness={handedness} />
      </div>
      {belowMinimum ? (
        <p
          role="alert"
          className="border-weak bg-weak/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2 font-medium"
        >
          {text.belowMinimum(grains(metrics.arrowMass), grains(metrics.minimumArrowMass))}
        </p>
      ) : (
        metrics.grainsPerPound < MIN_GRAINS_PER_POUND && (
          <p
            role="status"
            className="border-weak bg-weak/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2"
          >
            {text.tooLight(grainsPerPound, MIN_GRAINS_PER_POUND)}
          </p>
        )
      )}
      {braceOff && (
        <p className="border-gold bg-gold/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2">
          {text.braceOutside(
            metrics.bowLength,
            (metrics.braceHeightMin / 10).toFixed(1),
            (metrics.braceHeightMax / 10).toFixed(1),
          )}
        </p>
      )}
      {Math.abs(limbShift) >= 0.05 && (
        <p className="border-gold bg-gold/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2">
          {text.limbsOff(`${limbShift > 0 ? '+' : '−'}${Math.abs(limbShift).toFixed(1)}`)}
        </p>
      )}
      {nextStep && <div className="mt-4">{nextStep}</div>}

      <div
        role="tablist"
        aria-label={text.tabsLabel}
        onKeyDown={onTabKey}
        className="border-line mt-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b"
      >
        {tabs.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={`${id}-tab-${name}`}
            aria-selected={tab === name}
            aria-controls={`${id}-panel`}
            tabIndex={tab === name ? 0 : -1}
            onClick={() => setChosen(name)}
            className="text-ink-muted aria-selected:border-ink aria-selected:text-ink focus-visible:outline-accent -mb-px min-h-11 cursor-pointer border-b-2 border-transparent px-3 font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:-outline-offset-2"
          >
            {text.tabs[name]}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className="pt-4">
        {tab === 'gauges' && (
          <dl className="grid gap-x-8 gap-y-5 @lg:grid-cols-2">
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
        )}
        {tab === 'bareShaft' && reading && (
          <div>
            <h3 className="font-semibold">{text.bareShaftHeading}</h3>
            <p className="mt-1 max-w-prose">
              {reading.landing} {reading.meaning}
            </p>
            <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.bareShaftNote}</p>
          </div>
        )}
        {tab === 'paper' && tear && tearReading && (
          <div>
            <h3 className="font-semibold">{m.paperTear.heading}</h3>
            <div className="mt-2 flex items-start gap-4">
              <PaperTearFigure tear={tear} label={m.paperTear.figure(tearReading.tearing)} />
              <div className="min-w-0">
                <p className="max-w-prose">
                  {tearReading.tearing} {tearReading.meaning}
                </p>
                {tearReading.clearance && (
                  <p className="mt-1 max-w-prose">{tearReading.clearance}</p>
                )}
                <p className="text-ink-muted mt-1 max-w-prose text-sm">{m.paperTear.note}</p>
              </div>
            </div>
          </div>
        )}
        {tab === 'numbers' && (
          <>
            <p>
              <span className="text-ink-muted">{text.speed}</span>{' '}
              <span className="font-semibold">{(metrics.launchSpeed / 1000).toFixed(1)} m/s</span>
              <span className="text-ink-muted">
                {text.reaching((target.x / 1000).toFixed(0))}
              </span>{' '}
              <span className="font-semibold">{target.t.toFixed(2)} s</span>
            </p>
            <dl className="mt-3 grid max-w-md gap-1">
              {[
                [text.grainsPerPound, `${grainsPerPound} gr/lb`],
                // Front of center is a Professional number.
                ...(pro ? [[text.frontOfCenter, `${frontOfCenter} %`]] : []),
                [text.energy, `${metrics.kineticEnergy.toFixed(1)} J`],
                [text.clearanceCycles, metrics.clearanceCycles.toFixed(2)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {pro && focOutside && (
              // A note, not a warning: the guide calls its range a starting point.
              <p className="text-ink-muted mt-2 max-w-prose text-sm">
                {text.focOutside(
                  frontOfCenter,
                  FOC_RANGE.low,
                  FOC_RANGE.high,
                  metrics.frontOfCenter > FOC_RANGE.high,
                )}
              </p>
            )}
          </>
        )}
        {tab === 'curve' && curve}
      </div>
      <p className="text-ink-muted mt-4 max-w-prose text-sm">{text.note}</p>
    </section>
  )
}
