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

  const commit = (displayValue: number) =>
    onChange(clampValue(parameter, fromDisplay(parameter, displayValue)))

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-medium">
          {parameter.label}
        </label>
        <div className="flex items-baseline gap-1.5">
          <input
            id={`${id}-number`}
            aria-label={`${parameter.label}${unit ? ` in ${unit}` : ''}`}
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
            className="border-line bg-surface focus-visible:outline-accent h-11 w-20 rounded-md border px-2 text-right text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          {unit && <span className="text-ink-muted w-6 text-sm">{unit}</span>}
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={parameter.step}
        value={round(shown)}
        onChange={(event) => {
          setDraft(null)
          commit(Number(event.target.value))
        }}
        className="accent-accent focus-visible:outline-accent mt-1 h-11 w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
      />

      <div className="text-ink-muted flex items-center justify-between text-sm">
        <span>
          {min}
          {unit ? ` ${unit}` : ''}
        </span>
        <button
          type="button"
          onClick={onReset}
          disabled={isDefault}
          className="text-accent focus-visible:outline-accent -my-2 min-h-11 cursor-pointer rounded-md px-2 underline-offset-4 hover:underline focus-visible:outline-2 disabled:cursor-default disabled:opacity-0"
        >
          Reset to {toDisplay(parameter, parameter.default).toFixed(decimals)}
        </button>
        <span>
          {max}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  )
}
