import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ParameterSlider } from '../common/ParameterSlider.tsx'
import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { parameterText } from '../../i18n/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { arrowTotalMass } from '../../models/arrow.ts'
import { bowLength } from '../../models/bow.ts'
import {
  PARAMETERS,
  formatValue,
  getValue,
  modifiedParameters,
  visibleParameters,
  type Parameter,
  type ParameterGroup,
  type ParameterTier,
} from '../../models/parameters.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { convert } from '../../utils/units.ts'

const linkButtonClass =
  'text-accent focus-visible:outline-accent min-h-11 cursor-pointer rounded-md px-1 font-medium underline underline-offset-4 focus-visible:outline-2'

/** s, how long an input stays marked after the page has pointed to it */
const HIGHLIGHT_SECONDS = 2.5

/**
 * Wraps the input of one value. When the page points to that value, as a press
 * on a part of the 3D bow does, the input scrolls into view, takes the focus
 * and is marked for a moment.
 */
function Highlightable({ parameterKey, children }: { parameterKey: string; children: ReactNode }) {
  const highlighted = useTuningStore((state) => state.highlighted)
  const clearHighlight = useTuningStore((state) => state.clearHighlight)
  const element = useRef<HTMLDivElement>(null)
  const active = highlighted?.key === parameterKey
  const request = highlighted?.request

  useEffect(() => {
    if (!active) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    element.current?.scrollIntoView?.({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
    // The slider, not the number field: on a phone that would open the keyboard.
    const input =
      element.current?.querySelector<HTMLElement>('input[type="range"]') ??
      element.current?.querySelector<HTMLElement>('input:checked') ??
      element.current?.querySelector<HTMLElement>('input')
    input?.focus({ preventScroll: true })
    const timer = setTimeout(clearHighlight, HIGHLIGHT_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [active, request, clearHighlight])

  return (
    <div
      ref={element}
      data-highlighted={active || undefined}
      // Half the screen is left above it: on a phone the drawing stays there while scrolling.
      className={`scroll-mt-[52vh] rounded-lg transition-[box-shadow,background-color] duration-300 motion-reduce:transition-none lg:scroll-mt-24 ${active ? 'bg-accent/10 ring-accent ring-2 ring-offset-4 ring-offset-transparent' : ''}`}
    >
      {children}
    </div>
  )
}

function ParameterPanel({ group, title }: { group: ParameterGroup; title: string }) {
  const setup = useTuningStore((state) => state.setup)
  const mode = useTuningStore((state) => state.mode)
  const setParameter = useTuningStore((state) => state.setParameter)
  const resetParameter = useTuningStore((state) => state.resetParameter)
  const m = useMessages()
  const [open, setOpen] = useState(true)

  const shown = visibleParameters(group, mode)

  // A folded group opens when the page points to one of its values.
  const highlighted = useTuningStore((state) => state.highlighted)
  const [answered, setAnswered] = useState(highlighted?.request)
  if (highlighted && highlighted.request !== answered) {
    setAnswered(highlighted.request)
    if (shown.some((parameter) => parameter.key === highlighted.key)) setOpen(true)
  }
  const changed = modifiedParameters(setup).filter((parameter) => shown.includes(parameter)).length

  return (
    <section aria-labelledby={`${group}-heading`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${group}-heading`} className="font-display text-xl font-semibold">
          {title}
        </h2>
        {/* A folded group still says how much of it differs from the defaults. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${group}-values`}
          aria-label={open ? m.panels.fold(title) : m.panels.unfold(title)}
          onClick={() => setOpen(!open)}
          className="text-ink-muted focus-visible:outline-accent flex min-h-11 flex-1 cursor-pointer items-center justify-end gap-2 rounded-md text-sm focus-visible:outline-2"
        >
          {changed > 0 && <span>{m.panels.changed(changed)}</span>}
          <svg
            viewBox="0 0 20 20"
            className={`size-5 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 8l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div
        id={`${group}-values`}
        hidden={!open}
        className={`mt-2 grid gap-4 ${group === 'size' ? 'sm:grid-cols-2 lg:grid-cols-1' : ''}`}
      >
        {shown.map((parameter) => (
          <Highlightable key={parameter.key} parameterKey={parameter.key}>
            {parameter.kind === 'enum' ? (
              <SegmentedControl
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
                parameter={parameter}
                value={getValue(setup, parameter)}
                onChange={(value) => setParameter(parameter.key, value)}
                onReset={() => resetParameter(parameter.key)}
              />
            )}
          </Highlightable>
        ))}
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

// The hidden values named up front: the two that move weak / stiff most in the
// model, and the one that most easily turns the bare shaft reading.
const ASSUMED_FIRST = ['arrow.insertWeight', 'bow.string.stringMass', 'bow.plungerPreload']

/**
 * Shown in Simple mode: the values the result is built on but the user has not
 * entered. Defaults are a guess at the equipment, and a wrong guess is silent.
 */
function AssumedValues() {
  const setup = useTuningStore((state) => state.setup)
  const units = useTuningStore((state) => state.units)
  const setMode = useTuningStore((state) => state.setMode)
  const m = useMessages()
  const [open, setOpen] = useState(false)

  const hidden = PARAMETERS.filter((parameter) => parameter.tier === 'advanced')
  const shown = (parameter: Parameter) =>
    parameter.kind === 'enum'
      ? (parameterText(m, parameter).options?.[getValue(setup, parameter)] ??
        getValue(setup, parameter))
      : formatValue(parameter, getValue(setup, parameter), units)
  const examples = hidden
    .filter((parameter) => ASSUMED_FIRST.includes(parameter.key))
    .map((parameter) => `${parameterText(m, parameter).label} ${shown(parameter)}`)
  const groups: [ParameterGroup, string][] = [
    ['bow', m.panels.bow],
    ['arrow', m.panels.arrow],
  ]

  return (
    <section aria-labelledby="assumed-heading" className="border-line rounded-md border px-3 py-2">
      <h2 id="assumed-heading" className="font-medium">
        {m.panels.assumed(hidden.length)}
      </h2>
      <p className="text-ink-muted">
        {m.panels.assumedExamples(examples, hidden.length - examples.length)}
      </p>
      <div className="flex flex-wrap gap-x-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="assumed-list"
          onClick={() => setOpen(!open)}
          className={linkButtonClass}
        >
          {open ? m.panels.assumedHide : m.panels.assumedShow}
        </button>
        <button type="button" onClick={() => setMode('advanced')} className={linkButtonClass}>
          {m.panels.assumedEnter}
        </button>
      </div>
      {open && (
        <div id="assumed-list" className="grid gap-3 pb-1 sm:grid-cols-2">
          {groups.map(([group, title]) => (
            <div key={group}>
              <h3 className="font-medium">{title}</h3>
              <dl className="grid grid-cols-[1fr_auto] gap-x-3">
                {hidden
                  .filter((parameter) => parameter.group === group)
                  .map((parameter) => (
                    <div key={parameter.key} className="contents">
                      <dt className="text-ink-muted">{parameterText(m, parameter).label}</dt>
                      <dd className="text-right tabular-nums">{shown(parameter)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function SetupPanels() {
  const mode = useTuningStore((state) => state.mode)
  const setMode = useTuningStore((state) => state.setMode)
  const arrow = useTuningStore((state) => state.setup.arrow)
  const bow = useTuningStore((state) => state.setup.bow)
  const units = useTuningStore((state) => state.units)
  const m = useMessages()
  const mass = arrowTotalMass(arrow)

  return (
    <div className="grid gap-6">
      {/* What the bow is comes first: the rest is set on a bow of this size. */}
      <div>
        <ParameterPanel group="size" title={m.panels.size} />
        <p className="text-ink-muted mt-2 text-sm">{m.panels.bowLength(bowLength(bow))}</p>
      </div>
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
      {mode === 'simple' && <AssumedValues />}
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
