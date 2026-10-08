import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { inputClass } from '../common/styles.ts'
import { parameterText } from '../../i18n/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { arrowTotalMass } from '../../models/arrow.ts'
import { bowLength } from '../../models/bow.ts'
import {
  GROUPS,
  MEASURED_FORCES,
  PARAMETERS,
  formatValue,
  getParameter,
  getValue,
  hiddenParameters,
  modifiedParameters,
  tierShows,
  visibleParameters,
  type NumberParameter,
  type Parameter,
  type ParameterGroup,
} from '../../models/parameters.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { convert } from '../../utils/units.ts'
import { ValueRow } from './ValueRow.tsx'

const linkButtonClass =
  'text-accent focus-visible:outline-accent min-h-11 cursor-pointer rounded-md px-1 font-medium underline underline-offset-4 focus-visible:outline-2'

/** s, how long an input stays marked after the page has pointed to it */
const HIGHLIGHT_SECONDS = 2.5

// What a closed group says about itself: the values an archer knows it by.
// BH, NP and CS are the short names archers use, in both languages.
const SUMMARY: Record<ParameterGroup, readonly (readonly [key: string, short: string])[]> = {
  bow: [
    ['bow.drawWeight', ''],
    ['bow.drawLength', ''],
  ],
  tuning: [
    ['bow.braceHeight', 'BH '],
    ['bow.nockingPointHeight', 'NP '],
    ['bow.centerShot', 'CS '],
  ],
  arrow: [
    ['arrow.length', ''],
    ['arrow.spine', ''],
    ['arrow.pointWeight', ''],
  ],
  string: [['bow.string.stringMass', '']],
  balance: [
    ['bow.bowMass', ''],
    ['bow.stabilizerMass', ''],
  ],
}

/** One value, as a row or as a choice. Marked for a moment when the page points to it. */
function Value({
  parameter,
  open,
  onOpen,
}: {
  parameter: Parameter
  open: boolean
  onOpen: () => void
}) {
  const m = useMessages()
  const setup = useTuningStore((state) => state.setup)
  const setParameter = useTuningStore((state) => state.setParameter)
  const resetParameter = useTuningStore((state) => state.resetParameter)
  const highlighted = useTuningStore((state) => state.highlighted)
  const clearHighlight = useTuningStore((state) => state.clearHighlight)
  const element = useRef<HTMLDivElement>(null)
  const active = highlighted?.key === parameter.key
  const request = highlighted?.request

  useEffect(() => {
    if (!active) return
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    element.current?.scrollIntoView?.({
      block: 'nearest',
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
      // On a phone the preview is pinned above: leave it room when scrolling to a value.
      className={`scroll-mt-[48vh] scroll-mb-24 rounded-lg transition-shadow duration-300 motion-reduce:transition-none lg:scroll-mt-24 ${active ? 'ring-accent ring-2' : ''}`}
    >
      {parameter.kind === 'enum' ? (
        <div className="px-2 py-0.5">
          <SegmentedControl
            label={parameterText(m, parameter).label}
            options={parameter.options.map((option) => ({
              value: option,
              label: parameterText(m, parameter).options?.[option] ?? option,
            }))}
            value={getValue(setup, parameter)}
            onChange={(value) => setParameter(parameter.key, value)}
          />
        </div>
      ) : (
        <ValueRow
          parameter={parameter}
          value={getValue(setup, parameter)}
          open={open}
          onOpen={onOpen}
          onChange={(value) => setParameter(parameter.key, value)}
          onReset={() => resetParameter(parameter.key)}
        />
      )}
    </div>
  )
}

/** Says that values above the level are changed, so they never act unnoticed. */
function HiddenNotice() {
  const setup = useTuningStore((state) => state.setup)
  const mode = useTuningStore((state) => state.mode)
  const setMode = useTuningStore((state) => state.setMode)
  const resetHidden = useTuningStore((state) => state.resetHidden)
  const m = useMessages()

  const changed = modifiedParameters(setup, mode)
  if (changed.length === 0) return null
  // The lowest level that shows all of them.
  const needed = changed.some((parameter) => parameter.tier === 'pro') ? 'pro' : 'advanced'

  return (
    <div role="status" className="border-gold bg-gold/10 rounded-md border-l-4 px-3 py-2">
      <p>{m.panels.hiddenChanged(changed.length)}</p>
      <div className="flex gap-4">
        <button type="button" onClick={() => setMode(needed)} className={linkButtonClass}>
          {m.panels.showThem}
        </button>
        <button type="button" onClick={resetHidden} className={linkButtonClass}>
          {m.panels.resetThem}
        </button>
      </div>
    </div>
  )
}

/**
 * The values the result is built on but the level does not show. Defaults are
 * a guess at the equipment, and a wrong guess is silent: one line says so.
 */
export function AssumedValues() {
  const setup = useTuningStore((state) => state.setup)
  const units = useTuningStore((state) => state.units)
  const mode = useTuningStore((state) => state.mode)
  const m = useMessages()
  const [open, setOpen] = useState(false)

  // A force that was not measured is not a value the model assumes.
  const hidden = hiddenParameters(mode).filter(
    (parameter) => !MEASURED_FORCES.includes(parameter.key),
  )
  if (hidden.length === 0) return null
  const shown = (parameter: Parameter) =>
    parameter.kind === 'enum'
      ? (parameterText(m, parameter).options?.[getValue(setup, parameter)] ??
        getValue(setup, parameter))
      : formatValue(parameter, getValue(setup, parameter), units)

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="assumed-list"
        onClick={() => setOpen(!open)}
        className={`${linkButtonClass} text-sm`}
      >
        {m.panels.assuming(hidden.length)}
      </button>
      {open && (
        <dl
          id="assumed-list"
          className="border-line grid max-w-md grid-cols-[1fr_auto] gap-x-3 rounded-md border px-3 py-2 text-sm"
        >
          {hidden.map((parameter) => (
            <div key={parameter.key} className="contents">
              <dt className="text-ink-muted">{parameterText(m, parameter).label}</dt>
              <dd className="text-right">{shown(parameter)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

type GroupProps = {
  group: ParameterGroup
  open: boolean
  onToggle: () => void
  openKey: string | null
  onOpenKey: (key: string) => void
  /** A line under the values: what follows from them. */
  footer?: ReactNode
}

function Group({ group, open, onToggle, openKey, onOpenKey, footer }: GroupProps) {
  const setup = useTuningStore((state) => state.setup)
  const mode = useTuningStore((state) => state.mode)
  const units = useTuningStore((state) => state.units)
  const m = useMessages()
  const title = m.panels.groups[group]

  const shown = visibleParameters(group, mode)
  if (shown.length === 0) return null
  const changed = modifiedParameters(setup).filter((parameter) => shown.includes(parameter)).length
  const summary = [
    ...(group === 'bow' ? [`${setup.bow.riserSize}/${setup.bow.limbSize}`] : []),
    ...SUMMARY[group].flatMap(([key, short]) => {
      const parameter = getParameter(key) as NumberParameter
      return shown.includes(parameter)
        ? [`${short}${formatValue(parameter, getValue(setup, parameter), units)}`]
        : []
    }),
  ].join(' · ')

  return (
    <section
      aria-labelledby={`${group}-heading`}
      className={`bg-panel rounded-xl border px-3 ${open ? 'border-accent/60' : 'border-line'}`}
    >
      <h2 id={`${group}-heading`}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${group}-values`}
          onClick={onToggle}
          className="focus-visible:outline-accent flex min-h-13 w-full cursor-pointer items-center gap-3 rounded-md text-left focus-visible:outline-2"
        >
          <span className="font-display text-xl font-semibold">{title}</span>
          {/* A folded group still says what is in it, and how much of it was changed. */}
          <span className="text-ink-muted min-w-0 flex-1 truncate text-right text-sm">
            {open ? '' : summary}
            {changed > 0 && (
              <span className="text-accent ml-2 font-medium">{m.panels.changed(changed)}</span>
            )}
          </span>
          <svg
            viewBox="0 0 20 20"
            className={`text-ink-muted size-5 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
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
      </h2>
      <div id={`${group}-values`} hidden={!open} className="-mx-2 grid gap-1 pb-4">
        {shown.map((parameter) => (
          <Value
            key={parameter.key}
            parameter={parameter}
            open={openKey === parameter.key}
            onOpen={() => onOpenKey(parameter.key)}
          />
        ))}
        {footer && <div className="px-2">{footer}</div>}
      </div>
    </section>
  )
}

/** The values of the setup, in groups that open one at a time. */
export function SetupGroups() {
  const mode = useTuningStore((state) => state.mode)
  const arrow = useTuningStore((state) => state.setup.arrow)
  const bow = useTuningStore((state) => state.setup.bow)
  const units = useTuningStore((state) => state.units)
  const m = useMessages()
  const [openGroup, setOpenGroup] = useState<ParameterGroup | null>('bow')
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // When the page points to a value, its group and its row open.
  const highlighted = useTuningStore((state) => state.highlighted)
  const [answered, setAnswered] = useState(highlighted?.request)
  if (highlighted && highlighted.request !== answered) {
    setAnswered(highlighted.request)
    setOpenGroup(getParameter(highlighted.key).group)
    setOpenKey(highlighted.key)
    setQuery('')
  }

  const mass = arrowTotalMass(arrow)
  const footers: Partial<Record<ParameterGroup, ReactNode>> = {
    bow: <p className="text-ink-muted text-sm">{m.panels.bowLength(bowLength(bow))}</p>,
    arrow: (
      <p className="border-line mt-2 flex justify-between border-t pt-3">
        <span className="text-ink-muted">{m.panels.totalMass}</span>
        <span className="font-semibold">
          {units === 'metric'
            ? `${mass.toFixed(1)} g`
            : `${convert(mass, 'g', 'gr').toFixed(0)} gr`}
        </span>
      </p>
    ),
  }

  const wanted = query.trim().toLowerCase()
  const matches = PARAMETERS.filter(
    (parameter) =>
      tierShows(mode, parameter.tier) &&
      parameterText(m, parameter).label.toLowerCase().includes(wanted),
  )

  return (
    <div className="grid gap-3">
      <HiddenNotice />
      {/* With every value on show, finding one by name is quicker than opening groups. */}
      {mode === 'pro' && (
        <input
          type="search"
          aria-label={m.panels.search}
          placeholder={m.panels.search}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={inputClass}
        />
      )}
      {wanted !== '' && mode === 'pro' ? (
        matches.length === 0 ? (
          <p className="text-ink-muted">{m.panels.searchNone}</p>
        ) : (
          <div className="-mx-2 grid gap-1">
            {matches.map((parameter) => (
              <Value
                key={parameter.key}
                parameter={parameter}
                open={openKey === parameter.key}
                onOpen={() => setOpenKey(parameter.key)}
              />
            ))}
          </div>
        )
      ) : (
        <div className="grid gap-2">
          {GROUPS.map((group) => (
            <Group
              key={group}
              group={group}
              open={openGroup === group}
              onToggle={() => setOpenGroup(openGroup === group ? null : group)}
              openKey={openKey}
              onOpenKey={setOpenKey}
              footer={footers[group]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
