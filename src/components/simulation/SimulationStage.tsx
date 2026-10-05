import { useId } from 'react'
import type { Handedness } from '../../models/bow.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { SideView } from './SideView.tsx'
import { MAX_EXAGGERATION, MIN_EXAGGERATION, SLOW_MOTION, SPEEDS } from './timing.ts'
import { TopView } from './TopView.tsx'

export type FlightViewKind = 'top' | 'side' | 'both'

type FlightViewProps = {
  view: FlightViewKind
  result: SimulationResult
  /** A bare shaft to fly alongside the fletched arrow. */
  bare?: SimulationResult
  handedness: Handedness
  /** s, time on screen since the loop started, at normal playback speed */
  elapsed: number
  exaggeration: number
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
  elapsed,
  exaggeration,
}: FlightViewProps) {
  const time = elapsed / SLOW_MOTION
  const both = view === 'both'
  // Keeps the drawing from pushing everything else off a wide, short screen.
  const heightLimit = both ? '[&>svg]:max-h-[30vh]' : '[&>svg]:max-h-[46vh]'
  const frameClass = `border-line bg-surface relative overflow-hidden rounded-lg border ${heightLimit}`
  const legend = bare && (
    <div className="text-ink-muted absolute top-2 right-8 flex gap-4 text-sm">
      <LegendItem label="Fletched" />
      <LegendItem label="Bare shaft" bare />
    </div>
  )

  return (
    // Side by side when there is room for two readable drawings, stacked otherwise.
    <div className="@container">
      <div className={both ? 'grid gap-2 @4xl:grid-cols-2' : undefined}>
        {view !== 'side' && (
          <div className={frameClass}>
            <TopView
              result={result}
              bare={bare}
              handedness={handedness}
              time={time}
              exaggeration={exaggeration}
            />
            <span className="text-ink-muted absolute top-2 left-3 text-sm">Archer's left</span>
            <span className="text-ink-muted absolute bottom-2 left-3 text-sm">Archer's right</span>
            {legend}
          </div>
        )}
        {view !== 'top' && (
          <div className={frameClass}>
            <SideView result={result} bare={bare} time={time} exaggeration={exaggeration} />
            <span className="text-ink-muted absolute top-2 left-3 text-sm">High</span>
            <span className="text-ink-muted absolute bottom-2 left-3 text-sm">Low</span>
            {!both && legend}
          </div>
        )}
      </div>
    </div>
  )
}

const VIEWS = [
  { value: 'top', label: 'Top' },
  { value: 'side', label: 'Side' },
  { value: 'both', label: 'Both' },
]

const AMPLIFIED: Record<FlightViewKind, string> = {
  top: 'Bending and drift are',
  side: 'The arrow angle is',
  both: 'Bending, drift and arrow angle are',
}

const SPEED_OPTIONS = SPEEDS.map((speed) => ({ value: String(speed), label: `${speed}×` }))

export type ViewSettings = {
  view: FlightViewKind
  speed: number
  exaggeration: number
}

type PlaybackControlsProps = {
  playing: boolean
  onToggle: () => void
  onRestart: () => void
  bareShaft: boolean
  onBareShaftChange: (shown: boolean) => void
  settings: ViewSettings
  /** Leave out to hide the view, speed and amplification controls. */
  onSettingsChange?: (settings: ViewSettings) => void
}

const buttonClass =
  'border-line bg-surface focus-visible:outline-accent min-h-11 min-w-24 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2'

export function PlaybackControls({
  playing,
  onToggle,
  onRestart,
  bareShaft,
  onBareShaftChange,
  settings,
  onSettingsChange,
}: PlaybackControlsProps) {
  const amplifyId = useId()
  const subject = AMPLIFIED[settings.view]

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={onToggle} className={buttonClass}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={onRestart} className={buttonClass}>
            Restart
          </button>
        </div>

        <label className="flex min-h-11 cursor-pointer items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={bareShaft}
            onChange={(event) => onBareShaftChange(event.target.checked)}
            className="accent-accent focus-visible:outline-accent size-5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          Fly a bare shaft too
        </label>

        {onSettingsChange && (
          <>
            <SegmentedControl
              label="View"
              options={VIEWS}
              value={settings.view}
              onChange={(view) => onSettingsChange({ ...settings, view: view as FlightViewKind })}
            />
            <SegmentedControl
              label="Speed"
              options={SPEED_OPTIONS}
              value={String(settings.speed)}
              onChange={(speed) => onSettingsChange({ ...settings, speed: Number(speed) })}
            />
            <div className="flex min-w-56 flex-1 items-center gap-3">
              <label htmlFor={amplifyId} className="font-medium">
                Amplify
              </label>
              <input
                id={amplifyId}
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
          </>
        )}
      </div>

      <p className="text-ink-muted max-w-prose text-sm">
        Slowed {SLOW_MOTION / settings.speed} times. {subject} amplified, and the drawing is not to
        scale.
      </p>
    </div>
  )
}
