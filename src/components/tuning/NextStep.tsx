import type { TuningAdvice } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { describeSuggestion, type Reading } from './suggestionText.ts'

type Props = {
  /** Every suggestion the model has, best first. */
  advice: TuningAdvice
  /** What the model reports for the current setup. */
  before: Reading
  /** Applies a suggested value to the setup. */
  onTry: (parameterKey: string, value: number) => void
}

/** The one change to try next, or the word that the setup reads as tuned. */
export function NextStep({ advice, before, onTry }: Props) {
  const m = useMessages()
  const units = useTuningStore((state) => state.units)
  const text = m.suggestions
  const first = advice.suggestions[0]
  const item = first && describeSuggestion(first, before, m, units)

  return (
    <section
      aria-labelledby="next-step-heading"
      className="border-line bg-surface rounded-lg border p-3"
    >
      <h3 id="next-step-heading" className="text-ink-muted text-sm font-medium">
        {m.simulator.nextStep}
      </h3>
      {first && item ? (
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="font-semibold">{item.action}</p>
            <p>{item.value}</p>
            <p className="text-ink-muted mt-1 text-sm">{item.effects.join(' ')}</p>
          </div>
          <button
            type="button"
            onClick={() => onTry(first.parameterKey, first.to)}
            aria-label={text.tryLabel(item.action)}
            className="bg-ink text-surface focus-visible:outline-accent min-h-11 cursor-pointer rounded-md px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {text.tryIt}
          </button>
        </div>
      ) : (
        <p className="mt-1">{advice.tuned ? text.tuned : text.none}</p>
      )}
    </section>
  )
}
