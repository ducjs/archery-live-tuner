import { useId, useState } from 'react'
import { parameterText } from '../../i18n/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { displayOf, fromDisplay, toDisplay, type NumberParameter } from '../../models/parameters.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { unitLabel } from '../../utils/units.ts'
import { clampValue } from '../../utils/validation.ts'

type Props = {
  parameter: NumberParameter
  /** Internal units. */
  value: number
  /** Shows the slider, the hint and reset under the row. */
  open: boolean
  /** Called when the row is taken into use, by focus or by a press. */
  onOpen: () => void
  onChange: (value: number) => void
  onReset: () => void
}

/**
 * One value on one row: label, number, unit, minus and plus. The row that is
 * in use opens to its slider, so a long list stays short.
 */
export function ValueRow({ parameter, value, open, onOpen, onChange, onReset }: Props) {
  const id = useId()
  // Text being typed. Kept apart from the value so half-typed numbers are not rejected.
  const [draft, setDraft] = useState<string | null>(null)

  const m = useMessages()
  const units = useTuningStore((state) => state.units)
  const { label, hint } = parameterText(m, parameter)

  const display = displayOf(parameter, units)
  const { decimals, min, max, step } = display
  const shownUnit = display.unit ?? undefined
  const round = (displayValue: number) => Number(displayValue.toFixed(Math.max(decimals, 2)))
  const shown = toDisplay(parameter, value, shownUnit)
  const unit = display.unit ? unitLabel(display.unit) : null
  const isDefault = Math.abs(value - parameter.default) < 1e-9
  const defaultText = `${toDisplay(parameter, parameter.default, shownUnit).toFixed(decimals)}${unit ? ` ${unit}` : ''}`

  const commit = (displayValue: number) =>
    onChange(clampValue(parameter, fromDisplay(parameter, displayValue, shownUnit)))
  // One step down or up, for changing a value without dragging.
  const nudge = (steps: number) => {
    setDraft(null)
    commit(Math.min(max, Math.max(min, round(shown + steps * step))))
  }
  const stepButton = (steps: 1 | -1) => (
    <button
      type="button"
      onClick={() => nudge(steps)}
      disabled={steps < 0 ? shown <= min + 1e-9 : shown >= max - 1e-9}
      aria-label={steps < 0 ? m.panels.decrease(label) : m.panels.increase(label)}
      className="border-line bg-surface text-ink focus-visible:outline-accent grid size-11 shrink-0 cursor-pointer place-items-center rounded-md border focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-40"
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
        <path
          d={steps < 0 ? 'M4 10h12' : 'M4 10h12M10 4v12'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )

  return (
    <div
      onFocus={onOpen}
      onClick={onOpen}
      className={`rounded-lg px-2 transition-colors duration-150 motion-reduce:transition-none ${open ? 'bg-surface border-line border py-2' : 'border border-transparent'}`}
    >
      <div className="flex min-h-11 items-center gap-2">
        <label htmlFor={`${id}-number`} className="min-w-0 flex-1 leading-tight font-medium">
          {label}
          {/* Says, without color alone, that the value is not the default. */}
          {!isDefault && (
            <span
              title={m.panels.resetTitle(defaultText)}
              className="bg-accent ml-1.5 inline-block size-2 rounded-full align-middle"
            >
              <span className="sr-only">{m.panels.changed(1)}</span>
            </span>
          )}
        </label>
        <input
          id={`${id}-number`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft ?? shown.toFixed(decimals)}
          onChange={(event) => {
            const text = event.target.value
            setDraft(text)
            const typed = Number(text)
            if (text !== '' && Number.isFinite(typed) && typed >= min && typed <= max) {
              commit(typed)
            }
          }}
          onBlur={() => {
            const typed = Number(draft)
            if (draft !== null && draft !== '' && Number.isFinite(typed)) commit(typed)
            setDraft(null)
          }}
          className="border-line bg-surface focus-visible:outline-accent h-10 w-20 rounded-md border px-2 text-right text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <span className="text-ink-muted w-7 shrink-0 text-sm">{unit}</span>
        {stepButton(-1)}
        {stepButton(1)}
      </div>

      {open && (
        <div className="mt-1">
          <input
            type="range"
            aria-label={m.panels.slider(label)}
            min={min}
            max={max}
            step={step}
            value={round(shown)}
            onChange={(event) => {
              setDraft(null)
              commit(Number(event.target.value))
            }}
            className="accent-accent focus-visible:outline-accent block h-11 w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          <div className="flex items-start justify-between gap-3">
            <p className="text-ink-muted min-w-0 text-sm">{hint}</p>
            {!isDefault && (
              <button
                type="button"
                onClick={onReset}
                aria-label={m.panels.resetLabel(label, defaultText)}
                className="text-accent focus-visible:outline-accent -my-2 min-h-11 shrink-0 cursor-pointer rounded-md text-sm font-medium whitespace-nowrap underline underline-offset-4 focus-visible:outline-2"
              >
                {m.panels.resetTitle(defaultText)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
