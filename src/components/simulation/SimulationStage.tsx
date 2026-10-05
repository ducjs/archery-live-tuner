import type { Handedness } from '../../models/bow.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { SLOW_MOTION } from './timing.ts'
import { TopView } from './TopView.tsx'

type FlightViewProps = {
  result: SimulationResult
  handedness: Handedness
  /** s, wall-clock time since the loop started */
  elapsed: number
}

export function FlightView({ result, handedness, elapsed }: FlightViewProps) {
  return (
    <div className="border-line bg-surface relative overflow-hidden rounded-lg border">
      <TopView result={result} handedness={handedness} time={elapsed / SLOW_MOTION} />
      <span className="text-ink-muted absolute top-2 left-3 text-sm">Archer's left</span>
      <span className="text-ink-muted absolute bottom-2 left-3 text-sm">Archer's right</span>
    </div>
  )
}

type PlaybackControlsProps = {
  playing: boolean
  onToggle: () => void
  onRestart: () => void
}

const buttonClass =
  'border-line bg-surface focus-visible:outline-accent min-h-11 min-w-24 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2'

export function PlaybackControls({ playing, onToggle, onRestart }: PlaybackControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={onToggle} className={buttonClass}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={onRestart} className={buttonClass}>
          Restart
        </button>
      </div>
      <p className="text-ink-muted max-w-prose text-sm">
        Top view, slowed {SLOW_MOTION} times. Bending and drift are amplified, and the drawing is
        not to scale.
      </p>
    </div>
  )
}
