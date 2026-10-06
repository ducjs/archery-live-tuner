import { useId, useState } from 'react'
import { useMessages } from '../../i18n/useMessages.ts'
import type { Handedness } from '../../models/bow.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { SideView } from './SideView.tsx'
import { sampleTrajectory } from './arrowGeometry.ts'
import {
  DEFAULT_IMPACT,
  DISTANCES,
  IMPACT_MODES,
  MAX_EXAGGERATION,
  MIN_EXAGGERATION,
  clipTime,
  SPEEDS,
  slowdown,
  type ImpactMode,
} from './timing.ts'
import { TopView } from './TopView.tsx'

export type FlightViewKind = 'top' | 'side' | 'both'

type FlightViewProps = {
  view: FlightViewKind
  result: SimulationResult
  /** A bare shaft to fly alongside the fletched arrow. */
  bare?: SimulationResult
  handedness: Handedness
  /** How the landing is drawn. One point of impact when left out. */
  impact?: ImpactMode
  /** s, time on screen since the loop started, at normal playback speed */
  elapsed: number
  exaggeration: number
  /** Names the drawing, when several are shown together. */
  caption?: string
  /** Keeps the drawing short, to leave room for another one. */
  compact?: boolean
}

function LegendItem({ label, bare = false }: { label: string; bare?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg viewBox="0 0 24 8" className="h-2 w-6" aria-hidden="true">
        <line
          x1="1"
          y1="4"
          x2="23"
          y2="4"
          className={bare ? 'stroke-ink-muted' : 'stroke-ink'}
          strokeWidth={bare ? 2 : 3}
          strokeDasharray={bare ? '5 4' : undefined}
          strokeLinecap="round"
        />
      </svg>
      {label}
    </span>
  )
}

export function FlightView({
  view,
  result,
  bare,
  handedness,
  impact = DEFAULT_IMPACT,
  elapsed,
  exaggeration,
  caption,
  compact = false,
}: FlightViewProps) {
  const m = useMessages()
  // The clip opens at full draw; the views count time from the nock leaving the string.
  const time = clipTime(result, elapsed)
  const both = view === 'both'
  // Keeps the drawing from pushing everything else off a wide, short screen.
  const heightLimit = both || compact ? '[&>svg]:max-h-[30vh]' : '[&>svg]:max-h-[46vh]'
  const frameClass = `border-line bg-surface relative overflow-hidden rounded-lg border ${heightLimit}`
  const legend = bare ? (
    <div className="text-ink-muted absolute top-2 right-8 flex gap-4 text-sm">
      <LegendItem label={m.stage.fletched} />
      <LegendItem label={m.stage.bareShaft} bare />
    </div>
  ) : (
    caption && (
      <span className="absolute top-2 right-8 max-w-[55%] truncate text-sm font-semibold">
        {caption}
      </span>
    )
  )

  return (
    // Two views go one above the other, so each keeps the full width for the flight.
    <div className="@container">
      <div className={both ? 'grid gap-2' : undefined}>
        {view !== 'side' && (
          <div className={frameClass}>
            <TopView
              result={result}
              bare={bare}
              handedness={handedness}
              impact={impact}
              time={time}
              exaggeration={exaggeration}
            />
            <span className="text-ink-muted absolute top-2 left-3 text-sm">
              {m.stage.archerLeft}
            </span>
            <span className="text-ink-muted absolute bottom-2 left-3 text-sm">
              {m.stage.archerRight}
            </span>
            {legend}
          </div>
        )}
        {view !== 'top' && (
          <div className={frameClass}>
            <SideView
              result={result}
              bare={bare}
              impact={impact}
              time={time}
              exaggeration={exaggeration}
            />
            <span className="text-ink-muted absolute top-2 left-3 text-sm">{m.stage.high}</span>
            <span className="text-ink-muted absolute bottom-2 left-3 text-sm">{m.stage.low}</span>
            {!both && legend}
          </div>
        )}
      </div>
    </div>
  )
}

const VIEWS: FlightViewKind[] = ['top', 'side', 'both']

const DISTANCE_OPTIONS = DISTANCES.map((distance) => ({
  value: String(distance),
  label: `${distance} m`,
}))

type TimeScrubberProps = {
  result: SimulationResult
  /** s, time on screen since full draw, at normal playback speed */
  elapsed: number
  /** s, how long the whole clip takes on screen at normal playback speed */
  flightSeconds: number
  /** Jumps to a moment of the flight and pauses there. */
  onSeek: (elapsed: number) => void
}

/** A slider over the whole flight, to go straight to a moment without waiting for it. */
export function TimeScrubber({ result, elapsed, flightSeconds, onSeek }: TimeScrubberProps) {
  const id = useId()
  const m = useMessages()
  const time = clipTime(result, elapsed)
  const milliseconds = (time * 1000).toFixed(0).replace('-', '−')
  const travelled = sampleTrajectory(result.trajectory, time).x / 1000
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="font-medium whitespace-nowrap">
        {m.stage.moment}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={flightSeconds}
        step={flightSeconds / 500}
        value={elapsed}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-valuetext={
          time < 0
            ? m.stage.momentOnString((-time * 1000).toFixed(0))
            : m.stage.momentText(milliseconds, travelled.toFixed(1))
        }
        className="accent-accent focus-visible:outline-accent h-11 min-w-0 flex-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <span className="w-32 text-right text-sm whitespace-nowrap">
        <span className="font-semibold">{milliseconds} ms</span>
        <span className="text-ink-muted">, {travelled.toFixed(1)} m</span>
      </span>
    </div>
  )
}

export type ViewSettings = {
  view: FlightViewKind
  /** m, distance to the target */
  distance: number
  impact: ImpactMode
  speed: number
  exaggeration: number
}

type PlaybackControlsProps = {
  playing: boolean
  onToggle: () => void
  onRestart: () => void
  bareShaft?: boolean
  /** Leave out to hide the bare shaft switch. */
  onBareShaftChange?: (shown: boolean) => void
  /** Whether the drawing is put away, to leave the screen to the numbers. */
  drawingHidden?: boolean
  /** Leave out to hide the button that puts the drawing away. */
  onDrawingHiddenChange?: (hidden: boolean) => void
  settings: ViewSettings
  onSettingsChange: (settings: ViewSettings) => void
  /** Shows the amplification control. View, distance and speed are always shown. */
  advanced?: boolean
  /** The views on offer. All of them when left out. */
  views?: readonly FlightViewKind[]
}

const buttonClass =
  'border-line bg-surface focus-visible:outline-accent min-h-11 min-w-24 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2'

export function PlaybackControls({
  playing,
  onToggle,
  onRestart,
  bareShaft = false,
  onBareShaftChange,
  drawingHidden = false,
  onDrawingHiddenChange,
  settings,
  onSettingsChange,
  advanced = false,
  views = VIEWS,
}: PlaybackControlsProps) {
  const id = useId()
  const m = useMessages()
  const text = m.stage
  // The options are set once in a while; the buttons next to them are used all the time.
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const speedLabel = (speed: number) => (slowdown(speed) === 1 ? text.real : `1/${slowdown(speed)}`)
  const pace =
    slowdown(settings.speed) === 1 ? text.realSpeed : text.slowed(slowdown(settings.speed))

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={onToggle} className={buttonClass}>
            {playing ? text.pause : text.play}
          </button>
          <button type="button" onClick={onRestart} className={buttonClass}>
            {text.restart}
          </button>
        </div>

        {onBareShaftChange && (
          <label className="flex min-h-11 cursor-pointer items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={bareShaft}
              onChange={(event) => onBareShaftChange(event.target.checked)}
              className="accent-accent focus-visible:outline-accent size-5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            {text.flyBare}
          </label>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-x-5">
          {onDrawingHiddenChange && (
            <button
              type="button"
              aria-pressed={drawingHidden}
              onClick={() => onDrawingHiddenChange(!drawingHidden)}
              className="text-accent focus-visible:outline-accent min-h-11 cursor-pointer rounded-md font-medium focus-visible:outline-2"
            >
              {drawingHidden ? text.showDrawing : text.hideDrawing}
            </button>
          )}

          <button
            type="button"
            aria-expanded={optionsOpen}
            aria-controls={`${id}-options`}
            onClick={() => setOptionsOpen(!optionsOpen)}
            className="text-accent focus-visible:outline-accent flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md font-medium focus-visible:outline-2"
          >
            {text.options}
            <svg
              viewBox="0 0 20 20"
              className={`size-5 transition-transform duration-150 motion-reduce:transition-none ${optionsOpen ? 'rotate-180' : ''}`}
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
      </div>

      <div
        id={`${id}-options`}
        hidden={!optionsOpen}
        className="border-line bg-surface flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border px-3 py-2"
      >
        <SegmentedControl
          label={text.view}
          options={views.map((view) => ({ value: view, label: text.views[view] }))}
          value={settings.view}
          onChange={(view) => onSettingsChange({ ...settings, view: view as FlightViewKind })}
        />

        <SegmentedControl
          label={text.distance}
          options={DISTANCE_OPTIONS}
          value={String(settings.distance)}
          onChange={(distance) => onSettingsChange({ ...settings, distance: Number(distance) })}
        />

        <SegmentedControl
          label={text.impact}
          options={IMPACT_MODES.map((impact) => ({ value: impact, label: text.impacts[impact] }))}
          value={settings.impact}
          onChange={(impact) => onSettingsChange({ ...settings, impact: impact as ImpactMode })}
        />

        <SegmentedControl
          label={text.speed}
          options={SPEEDS.map((speed) => ({ value: String(speed), label: speedLabel(speed) }))}
          value={String(settings.speed)}
          onChange={(speed) => onSettingsChange({ ...settings, speed: Number(speed) })}
        />

        {advanced && (
          <div className="flex min-w-56 flex-1 items-center gap-3">
            <label htmlFor={`${id}-amplify`} className="font-medium">
              {text.amplify}
            </label>
            <input
              id={`${id}-amplify`}
              type="range"
              min={MIN_EXAGGERATION}
              max={MAX_EXAGGERATION}
              step="0.5"
              value={settings.exaggeration}
              onChange={(event) =>
                onSettingsChange({ ...settings, exaggeration: Number(event.target.value) })
              }
              className="accent-accent focus-visible:outline-accent h-11 min-w-0 flex-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            <span className="w-8 text-right font-semibold">{settings.exaggeration}×</span>
          </div>
        )}
      </div>

      {/* One line that is always there; what it leaves out opens on request. */}
      <p className="text-ink-muted text-sm">
        {text.summary(
          text.viewNames[settings.view],
          settings.distance,
          text.impacts[settings.impact],
        )}{' '}
        {pace} {text.notToScale}{' '}
        <button
          type="button"
          aria-expanded={aboutOpen}
          aria-controls={`${id}-about`}
          onClick={() => setAboutOpen(!aboutOpen)}
          className="text-accent focus-visible:outline-accent cursor-pointer rounded-sm underline underline-offset-4 focus-visible:outline-2"
        >
          {text.about}
        </button>
      </p>
      <p id={`${id}-about`} hidden={!aboutOpen} className="text-ink-muted max-w-prose text-sm">
        {text.amplified[settings.impact][settings.view]} {text.landing[settings.impact]}
      </p>
    </div>
  )
}
