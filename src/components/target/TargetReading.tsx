import { MIN_BARE, MIN_FLETCHED, type Diagnosis, type PlotReading } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { buttonClass } from '../common/styles.ts'
import { centimeters, describeStep, plotConclusions } from './targetText.ts'

type Props = {
  reading: PlotReading
  diagnosis: Diagnosis
  /** Stores the target as an observation of the setup on screen. */
  onSave: () => void
  /** The target as it is now has been stored. */
  saved: boolean
}

/** What the arrows in the target say, and what to try on the bow because of it. */
export function TargetReading({ reading, diagnosis, onSave, saved }: Props) {
  const m = useMessages()
  const text = m.target
  const conclusions = plotConclusions(reading, m)

  return (
    <section
      aria-labelledby="target-heading"
      className="border-line bg-panel rounded-xl border p-4"
    >
      <h2 id="target-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <p className="text-ink-muted text-sm">{text.realWorld}</p>

      {!reading.enough ? (
        <p className="mt-3 max-w-prose">
          {text.need(MIN_FLETCHED, MIN_BARE, reading.fletchedCount, reading.bareCount)}
        </p>
      ) : (
        <>
          <p className="mt-2 max-w-prose text-lg leading-snug font-medium">
            {!reading.conclusive
              ? text.inconclusive
              : conclusions.length > 0
                ? m.bareShaft.meaning(conclusions)
                : text.inconclusive}
          </p>
          {!reading.conclusive && <p className="mt-1 max-w-prose">{text.inconclusiveWhy}</p>}

          <dl className="mt-3 grid max-w-md gap-1">
            {(
              [
                [text.offset, text.offsetValue(centimeters(reading.offsetLength), reading.clock)],
                [text.spread, `${centimeters(reading.spread)} cm`],
                [text.counted, text.countedValue(reading.fletchedCount, reading.bareCount)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          {reading.conclusive && (
            <p className="border-line mt-3 max-w-prose rounded-md border-l-4 px-3 py-2">
              {diagnosis.agrees ? text.modelAgrees : text.modelDiffers}
            </p>
          )}

          {diagnosis.steps.length > 0 && (
            <>
              <h3 className="mt-4 font-semibold">{text.stepsHeading}</h3>
              <ol className="mt-2 grid gap-2">
                {diagnosis.steps.map((step, index) => {
                  const item = describeStep(step, reading, m)
                  return (
                    <li
                      key={step.cause}
                      className="border-line bg-surface grid grid-cols-[auto_1fr] gap-x-3 rounded-lg border p-3"
                    >
                      <span className="font-display text-ink-muted text-xl font-semibold">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{item.action}</p>
                        <p className="text-ink-muted text-sm">{item.why}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className={buttonClass} disabled={saved} onClick={onSave}>
              {text.save}
            </button>
            <p role="status" className="text-ink-muted text-sm">
              {saved ? text.saved : text.saveHint}
            </p>
          </div>
        </>
      )}
    </section>
  )
}
