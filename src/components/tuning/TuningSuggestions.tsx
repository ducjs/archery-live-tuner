import { suggestionGroup, type SuggestionGroup, type TuningAdvice } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { describeSuggestion, type Reading } from './suggestionText.ts'

const GROUPS: SuggestionGroup[] = ['adjust', 'equipment']

type Props = {
  /** Every suggestion the model has, best first. */
  advice: TuningAdvice
  /** What the model reports for the current setup. */
  before: Reading
  /** Applies a suggested value to the setup. */
  onTry: (parameterKey: string, value: number) => void
  /** How many suggestions each group shows. */
  perGroup?: number
}

export function TuningSuggestions({ advice, before, onTry, perGroup = 3 }: Props) {
  const m = useMessages()
  const units = useTuningStore((state) => state.units)
  const text = m.suggestions
  return (
    <section aria-labelledby="suggestions-heading" className="border-line border-t pt-4">
      <h2 id="suggestions-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>

      {advice.tuned && <p className="mt-2 max-w-prose">{text.tuned}</p>}

      {!advice.tuned && advice.suggestions.length === 0 && (
        <p className="mt-2 max-w-prose">{text.none}</p>
      )}

      {advice.suggestions.length > 0 && (
        <>
          <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.intro}</p>
          {GROUPS.map((group) => {
            const suggestions = advice.suggestions
              .filter((suggestion) => suggestionGroup(suggestion.effort) === group)
              .slice(0, perGroup)
            return (
              <section key={group} aria-labelledby={`suggestions-${group}`} className="mt-4">
                <h3 id={`suggestions-${group}`} className="font-display text-lg font-semibold">
                  {text.groups[group].title}
                </h3>
                <p className="text-ink-muted text-sm">{text.groups[group].about}</p>
                {suggestions.length === 0 ? (
                  <p className="mt-2">{text.emptyGroup}</p>
                ) : (
                  <ol className="mt-2 grid gap-3">
                    {suggestions.map((suggestion, index) => {
                      const item = describeSuggestion(suggestion, before, m, units)
                      return (
                        <li
                          key={suggestion.parameterKey}
                          className="border-line bg-surface grid grid-cols-[auto_1fr] gap-x-3 rounded-lg border p-3"
                        >
                          <span className="font-display text-ink-muted text-xl font-semibold">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold">{item.action}</p>
                            <p>{item.value}</p>
                            <p className="text-ink-muted mt-1 text-sm">{item.effects.join(' ')}</p>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              {/* Says whether new arrows are needed. On the bow there is one kind only. */}
                              <span className="text-ink-muted text-sm">
                                {group === 'equipment' && item.effort}
                              </span>
                              <button
                                type="button"
                                onClick={() => onTry(suggestion.parameterKey, suggestion.to)}
                                aria-label={text.tryLabel(item.action)}
                                className="border-line focus-visible:outline-accent min-h-11 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                              >
                                {text.tryIt}
                              </button>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </section>
            )
          })}
        </>
      )}

      <p className="text-ink-muted mt-3 max-w-prose text-sm">{text.footnote}</p>
    </section>
  )
}
