import { useId, useState } from 'react'
import { fromDisplay, toDisplay, type NumberParameter } from '../../models/parameters.ts'
import { unitLabel } from '../../utils/units.ts'
import { clampValue } from '../../utils/validation.ts'

type Props = {
  parameter: NumberParameter
  /** Internal units. */
  value: number
  onChange: (value: number) => void
  onReset: () => void
}

function decimalsOf(step: number): number {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

export function ParameterSlider({ parameter, value, onChange, onReset }: Props) {
  const id = useId()
  // Text being typed. Kept apart from the value so half-typed numbers are not rejected.
  const [draft, setDraft] = useState<string | null>(null)

  const decimals = decimalsOf(parameter.step)
  const round = (displayValue: number) => Number(displayValue.toFixed(Math.max(decimals, 2)))
  const min = round(toDisplay(parameter, parameter.min))
  const max = round(toDisplay(parameter, parameter.max))
  const shown = toDisplay(parameter, value)
  const unit = parameter.displayUnit ? unitLabel(parameter.displayUnit) : null
  const isDefault = Math.abs(value - parameter.default) < 1e-9
  const defaultText = toDisplay(parameter, parameter.default).toFixed(decimals)

  const commit = (displayValue: number) =>
    onChange(clampValue(parameter, fromDisplay(parameter, displayValue)))

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`${id}-number`} className="font-medium">
          {parameter.label}
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            disabled={isDefault}
            aria-label={`Reset ${parameter.label} to ${defaultText}${unit ? ` ${unit}` : ''}`}
            title={`Reset to ${defaultText}`}
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
            step={parameter.step}
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
          <span className="text-ink-muted w-7 text-sm">{unit}</span>
        </div>
      </div>

      <div className="text-ink-muted -mt-1 flex items-center gap-2 text-sm">
        <span>{min}</span>
        <input
          type="range"
          aria-label={`${parameter.label} slider`}
          min={min}
          max={max}
          step={parameter.step}
          value={round(shown)}
          onChange={(event) => {
            setDraft(null)
            commit(Number(event.target.value))
          }}
          className="accent-accent focus-visible:outline-accent h-11 min-w-0 flex-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <span>{max}</span>
      </div>

      {parameter.hint && <p className="text-ink-muted -mt-1 text-sm">{parameter.hint}</p>}
    </div>
  )
}
