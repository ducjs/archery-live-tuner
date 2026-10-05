import { ParameterSlider } from '../common/ParameterSlider.tsx'
import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { parameterText } from '../../i18n/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
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

const linkButtonClass =
  'text-accent focus-visible:outline-accent min-h-11 cursor-pointer rounded-md px-1 font-medium underline underline-offset-4 focus-visible:outline-2'

function ParameterPanel({ group, title }: { group: ParameterGroup; title: string }) {
  const setup = useTuningStore((state) => state.setup)
  const mode = useTuningStore((state) => state.mode)
  const setParameter = useTuningStore((state) => state.setParameter)
  const resetParameter = useTuningStore((state) => state.resetParameter)
  const m = useMessages()

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
              label={parameterText(m, parameter).label}
              options={parameter.options.map((option) => ({
                value: option,
                label: parameterText(m, parameter).options?.[option] ?? option,
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
  const m = useMessages()

  const count = modifiedParameters(setup, 'advanced').length
  if (count === 0) return null

  return (
    <div role="status" className="border-gold bg-gold/10 rounded-md border-l-4 px-3 py-2">
      <p>{m.panels.advancedChanged(count)}</p>
      <div className="flex gap-4">
        <button type="button" onClick={() => setMode('advanced')} className={linkButtonClass}>
          {m.panels.showThem}
        </button>
        <button type="button" onClick={resetAdvanced} className={linkButtonClass}>
          {m.panels.resetThem}
        </button>
      </div>
    </div>
  )
}

export function SetupPanels() {
  const mode = useTuningStore((state) => state.mode)
  const setMode = useTuningStore((state) => state.setMode)
  const arrow = useTuningStore((state) => state.setup.arrow)
  const units = useTuningStore((state) => state.units)
  const m = useMessages()
  const mass = arrowTotalMass(arrow)

  return (
    <div className="grid gap-6">
      <SegmentedControl
        label={m.panels.detail}
        options={[
          { value: 'simple', label: m.panels.simple },
          { value: 'advanced', label: m.panels.advanced },
        ]}
        value={mode}
        onChange={(value) => setMode(value as ParameterTier)}
      />
      {mode === 'simple' && <AdvancedNotice />}
      <ParameterPanel group="bow" title={m.panels.bow} />
      <div>
        <ParameterPanel group="arrow" title={m.panels.arrow} />
        <p className="border-line mt-4 flex justify-between border-t pt-3">
          <span className="text-ink-muted">{m.panels.totalMass}</span>
          <span className="font-semibold">
            {units === 'metric'
              ? `${mass.toFixed(1)} g`
              : `${convert(mass, 'g', 'gr').toFixed(0)} gr`}
          </span>
        </p>
      </div>
    </div>
  )
}
