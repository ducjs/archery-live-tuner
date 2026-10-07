import type { TuningPlan } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { TuningSetup } from '../../models/setup.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { buttonClass } from '../common/styles.ts'
import { describeSuggestion } from './suggestionText.ts'

type Props = {
  plan: TuningPlan<TuningSetup>
  /** Applies every step of the plan to the setup, in order. */
  onApply: (changes: { parameterKey: string; value: number }[]) => void
}

/**
 * The suggestions laid out as one tuning session: what to change first, what
 * the model then puts first, and so on. A plan of a single step says nothing
 * the suggestions do not already say, and is not shown.
 */
export function TuningPlanPanel({ plan, onApply }: Props) {
  const m = useMessages()
  const units = useTuningStore((state) => state.units)
  const text = m.plan
  if (plan.steps.length < 2) return null

  return (
    <section aria-labelledby="plan-heading" className="border-line mt-5 border-t pt-4">
      <h2 id="plan-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.intro}</p>
      <ol className="mt-3 grid gap-2">
        {plan.steps.map((step, index) => {
          const item = describeSuggestion(step.suggestion, step.before, m, units)
          return (
            <li
              key={step.suggestion.parameterKey}
              className="border-line bg-surface grid grid-cols-[auto_1fr] gap-x-3 rounded-lg border p-3"
            >
              <span className="font-display text-ink-muted text-xl font-semibold">{index + 1}</span>
              <div className="min-w-0">
                <p className="font-semibold">{item.action}</p>
                <p>{item.value}</p>
                <p className="text-ink-muted mt-1 text-sm">{item.effects.join(' ')}</p>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 max-w-prose font-medium">
        {plan.tuned ? text.tuned(plan.steps.length) : text.notTuned(plan.steps.length)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            onApply(
              plan.steps.map(({ suggestion }) => ({
                parameterKey: suggestion.parameterKey,
                value: suggestion.to,
              })),
            )
          }
        >
          {text.apply}
        </button>
        <p className="text-ink-muted text-sm">{text.applyHint}</p>
      </div>
      <p className="text-ink-muted mt-3 max-w-prose text-sm">{m.suggestions.footnote}</p>
    </section>
  )
}
