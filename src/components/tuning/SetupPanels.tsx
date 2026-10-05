import { ParameterSlider } from '../common/ParameterSlider.tsx'
import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { arrowTotalMass } from '../../models/arrow.ts'
import {
  getValue,
  modifiedParameters,
  visibleParameters,
  type ParameterGroup,
  type ParameterTier,
} from '../../models/parameters.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { convert } from '../../utils/units.ts'

const MODES = [
  { value: 'simple', label: 'Simple' },
  { value: 'advanced', label: 'Advanced' },
]

const linkButtonClass =
  'text-accent focus-visible:outline-accent min-h-11 cursor-pointer rounded-md px-1 font-medium underline underline-offset-4 focus-visible:outline-2'

function ParameterPanel({ group, title }: { group: ParameterGroup; title: string }) {
  const setup = useTuningStore((state) => state.setup)
  const mode = useTuningStore((state) => state.mode)
  const setParameter = useTuningStore((state) => state.setParameter)
  const resetParameter = useTuningStore((state) => state.resetParameter)

  return (
    <section aria-labelledby={`${group}-heading`}>
      <h2 id={`${group}-heading`} className="font-display text-xl font-semibold">
        {title}
      </h2>
      <div className="mt-2 grid gap-3">
        {visibleParameters(group, mode).map((parameter) =>
          parameter.kind === 'enum' ? (
            <SegmentedControl
              key={parameter.key}
              label={parameter.label}
              options={parameter.options.map((option) => ({
                value: option,
                label: parameter.optionLabels[option] ?? option,
              }))}
              value={getValue(setup, parameter)}
              onChange={(value) => setParameter(parameter.key, value)}
            />
          ) : (
            <ParameterSlider
              key={parameter.key}
              parameter={parameter}
              value={getValue(setup, parameter)}
              onChange={(value) => setParameter(parameter.key, value)}
              onReset={() => resetParameter(parameter.key)}
            />
          ),
        )}
      </div>
    </section>
  )
}

/** Shown in Simple mode so hidden values never change the result unnoticed. */
function AdvancedNotice() {
  const setup = useTuningStore((state) => state.setup)
  const setMode = useTuningStore((state) => state.setMode)
  const resetAdvanced = useTuningStore((state) => state.resetAdvanced)

  const count = modifiedParameters(setup, 'advanced').length
  if (count === 0) return null

  return (
    <div role="status" className="border-gold bg-gold/10 rounded-md border-l-4 px-3 py-2">
      <p>
        {count === 1
          ? '1 advanced value is changed and still affects the result.'
          : `${count} advanced values are changed and still affect the result.`}
      </p>
      <div className="flex gap-4">
        <button type="button" onClick={() => setMode('advanced')} className={linkButtonClass}>
          Show them
        </button>
        <button type="button" onClick={resetAdvanced} className={linkButtonClass}>
          Reset them
        </button>
      </div>
    </div>
  )
}

export function SetupPanels() {
  const mode = useTuningStore((state) => state.mode)
  const setMode = useTuningStore((state) => state.setMode)
  const arrow = useTuningStore((state) => state.setup.arrow)

  return (
    <div className="grid gap-6">
      <SegmentedControl
        label="Detail"
        options={MODES}
        value={mode}
        onChange={(value) => setMode(value as ParameterTier)}
      />
      {mode === 'simple' && <AdvancedNotice />}
      <ParameterPanel group="bow" title="Bow" />
      <div>
        <ParameterPanel group="arrow" title="Arrow" />
        <p className="border-line mt-4 flex justify-between border-t pt-3">
          <span className="text-ink-muted">Estimated total arrow mass</span>
          <span className="font-semibold">
            {convert(arrowTotalMass(arrow), 'g', 'gr').toFixed(0)} gr
          </span>
        </p>
      </div>
    </div>
  )
}
