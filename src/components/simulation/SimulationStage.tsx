import { useId } from 'react'
import type { Handedness } from '../../models/bow.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { SegmentedControl } from '../common/SegmentedControl.tsx'
import { SideView } from './SideView.tsx'
import { MAX_EXAGGERATION, MIN_EXAGGERATION, SLOW_MOTION, SPEEDS } from './timing.ts'
import { TopView } from './TopView.tsx'

export type FlightViewKind = 'top' | 'side'

type FlightViewProps = {
  view: FlightViewKind
  result: SimulationResult
  handedness: Handedness
  /** s, time on screen since the loop started, at normal playback speed */
  elapsed: number
  exaggeration: number
}

export function FlightView({ view, result, handedness, elapsed, exaggeration }: FlightViewProps) {
  const time = elapsed / SLOW_MOTION
  return (
    <div className="border-line bg-surface relative overflow-hidden rounded-lg border">
      {view === 'top' ? (
        <TopView result={result} handedness={handedness} time={time} exaggeration={exaggeration} />
      ) : (
        <SideView result={result} time={time} exaggeration={exaggeration} />
      )}
      <span className="text-ink-muted absolute top-2 left-3 text-sm">
        {view === 'top' ? "Archer's left" : 'High'}
      </span>
      <span className="text-ink-muted absolute bottom-2 left-3 text-sm">
        {view === 'top' ? "Archer's right" : 'Low'}
      </span>
    </div>
  )
}

const VIEWS = [
  { value: 'top', label: 'Top' },
  { value: 'side', label: 'Side' },
]

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
  settings,
  onSettingsChange,
}: PlaybackControlsProps) {
  const amplifyId = useId()
  const subject = settings.view === 'top' ? 'Bending and drift are' : 'The arrow angle is'

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
