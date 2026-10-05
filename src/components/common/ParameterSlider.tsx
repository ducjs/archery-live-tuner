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
  onChange: (value: number) => void
  onReset: () => void
}

export function ParameterSlider({ parameter, value, onChange, onReset }: Props) {
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
  const defaultText = toDisplay(parameter, parameter.default, shownUnit).toFixed(decimals)

  const commit = (displayValue: number) =>
    onChange(clampValue(parameter, fromDisplay(parameter, displayValue, shownUnit)))

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`${id}-number`} className="font-medium">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            disabled={isDefault}
            aria-label={m.panels.resetLabel(label, `${defaultText}${unit ? ` ${unit}` : ''}`)}
            title={m.panels.resetTitle(defaultText)}
            className="text-ink-muted hover:text-accent focus-visible:outline-accent grid size-11 cursor-pointer place-items-center rounded-md focus-visible:outline-2 disabled:invisible"
          >
            <svg viewBox="0 0 20 20" className="size-4.5" fill="none" aria-hidden="true">
              <path
                d="M4.5 10a5.5 5.5 0 1 0 1.8-4.07M4.5 3.5v3h3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
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
          <span className="text-ink-muted w-8 text-sm">{unit}</span>
        </div>
      </div>

      <div className="text-ink-muted -mt-1 flex items-center gap-2 text-sm">
        <span>{min}</span>
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
          className="accent-accent focus-visible:outline-accent h-11 min-w-0 flex-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <span>{max}</span>
      </div>

      {hint && <p className="text-ink-muted -mt-1 text-sm">{hint}</p>}
    </div>
  )
}
