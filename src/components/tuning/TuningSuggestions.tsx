import type { TuningAdvice } from '../../engine/index.ts'
import { describeSuggestion, type Reading } from './suggestionText.ts'

type Props = {
  advice: TuningAdvice
  /** What the model reports for the current setup. */
  before: Reading
  /** Applies a suggested value to the setup. */
  onTry: (parameterKey: string, value: number) => void
}

export function TuningSuggestions({ advice, before, onTry }: Props) {
  return (
    <section aria-labelledby="suggestions-heading" className="border-line border-t pt-4">
      <h2 id="suggestions-heading" className="font-display text-xl font-semibold">
        Tuning suggestions
      </h2>

      {advice.tuned && (
        <p className="mt-2 max-w-prose">
          The model reads this setup as tuned. There is nothing to suggest.
        </p>
      )}

      {!advice.tuned && advice.suggestions.length === 0 && (
        <p className="mt-2 max-w-prose">
          No single change within reach improves this setup much. Try a different shaft or a larger
          change than one step.
        </p>
      )}

      {advice.suggestions.length > 0 && (
        <>
          <p className="text-ink-muted mt-1 max-w-prose text-sm">
            In order of priority: what helps most for the least effort. Each one is a single change
            from the setup as it is now, so try one, then look at the list again.
          </p>
          <ol className="mt-3 grid gap-3">
            {advice.suggestions.map((suggestion, index) => {
              const text = describeSuggestion(suggestion, before)
              return (
                <li
                  key={suggestion.parameterKey}
                  className="border-line bg-surface grid grid-cols-[auto_1fr] gap-x-3 rounded-lg border p-3"
                >
                  <span className="font-display text-ink-muted text-xl font-semibold">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{text.action}</p>
                    <p>{text.value}</p>
                    <p className="text-ink-muted mt-1 text-sm">{text.effects.join(' ')}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-ink-muted text-sm">{text.effort}</span>
                      <button
                        type="button"
                        onClick={() => onTry(suggestion.parameterKey, suggestion.to)}
                        aria-label={`Try it: ${text.action}`}
                        className="border-line focus-visible:outline-accent min-h-11 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        Try it
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      )}

      <p className="text-ink-muted mt-3 max-w-prose text-sm">
        Suggestions come from the same simplified model, not from tested tuning advice.
      </p>
    </section>
  )
}
