import { useId } from 'react'

type Props = {
  label: string
  /** Hides the label visually. It stays available to screen readers. */
  hideLabel?: boolean
  options: readonly { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}

export function SegmentedControl({ label, hideLabel = false, options, value, onChange }: Props) {
  const name = useId()
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <legend className={hideLabel ? 'sr-only' : 'float-left font-medium'}>{label}</legend>
      <div className="border-line bg-surface inline-flex max-w-full flex-wrap rounded-md border p-0.5">
        {options.map((option) => (
          <label
            key={option.value}
            className="has-checked:bg-ink has-checked:text-surface has-focus-visible:outline-accent flex min-h-10 cursor-pointer items-center rounded px-1.5 font-medium whitespace-nowrap sm:px-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
