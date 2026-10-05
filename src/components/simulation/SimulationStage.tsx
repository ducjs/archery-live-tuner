import type { Handedness } from '../../models/bow.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import { TopView } from './TopView.tsx'
import { usePlayback } from './usePlayback.ts'

// Real flight takes about a third of a second, far too fast to read.
const SLOW_MOTION = 12
const HOLD_SECONDS = 1.2

type Props = {
  result: SimulationResult
  handedness: Handedness
}

const buttonClass =
  'border-line bg-surface focus-visible:outline-accent min-h-11 min-w-24 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2'

export function SimulationStage({ result, handedness }: Props) {
  const { trajectory } = result
  const flightSeconds = trajectory[trajectory.length - 1]!.t
  const { elapsed, playing, toggle, restart } = usePlayback(
    flightSeconds * SLOW_MOTION + HOLD_SECONDS,
  )

  return (
    <section aria-label="Arrow flight, seen from above">
      <div className="border-line bg-surface relative overflow-hidden rounded-lg border">
        <TopView result={result} handedness={handedness} time={elapsed / SLOW_MOTION} />
        <span className="text-ink-muted absolute top-2 left-3 text-sm">Archer's left</span>
        <span className="text-ink-muted absolute bottom-2 left-3 text-sm">Archer's right</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex gap-2">
          <button type="button" onClick={toggle} className={buttonClass}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={restart} className={buttonClass}>
            Restart
          </button>
        </div>
        <p className="text-ink-muted max-w-prose text-sm">
          Slowed {SLOW_MOTION} times. Bending and drift are amplified, and the drawing is not to
          scale.
        </p>
      </div>
    </section>
  )
}
