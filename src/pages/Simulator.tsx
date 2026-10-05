import { useMemo, useState } from 'react'
import {
  FlightView,
  PlaybackControls,
  type ViewSettings,
} from '../components/simulation/SimulationStage.tsx'
import {
  DEFAULT_EXAGGERATION,
  DEFAULT_SPEED,
  HOLD_SECONDS,
  flightSeconds,
} from '../components/simulation/timing.ts'
import { usePlayback } from '../components/simulation/usePlayback.ts'
import { ResultPanel, ResultSummary } from '../components/tuning/ResultPanel.tsx'
import { SetupPanels } from '../components/tuning/SetupPanels.tsx'
import { heuristicModel } from '../engine/index.ts'
import { useTuningStore } from '../state/tuningStore.ts'

const DEFAULT_VIEW: ViewSettings = {
  view: 'top',
  speed: DEFAULT_SPEED,
  exaggeration: DEFAULT_EXAGGERATION,
}

export function Simulator() {
  const setup = useTuningStore((state) => state.setup)
  const mode = useTuningStore((state) => state.mode)
  const result = useMemo(() => heuristicModel.simulate(setup), [setup])

  // View settings are an Advanced feature. Simple mode always uses the defaults,
  // so a setting the user cannot see never changes what is shown.
  const [advancedView, setAdvancedView] = useState(DEFAULT_VIEW)
  const view = mode === 'advanced' ? advancedView : DEFAULT_VIEW

  const playback = usePlayback(flightSeconds(result), HOLD_SECONDS, view.speed)

  return (
    <main className="mx-auto max-w-6xl px-4 pt-5 pb-12 sm:px-6">
      <header>
        <h1 className="font-display text-3xl leading-tight font-semibold">
          Recurve tuning simulator
        </h1>
        <p className="text-ink-muted mt-1 max-w-prose">
          Change a value and watch how the arrow leaves the bow.
        </p>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-8">
        {/* One column on a wide screen. On a phone its parts are placed around the inputs. */}
        <div className="contents lg:sticky lg:top-4 lg:order-2 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          {/* The animation stays in view on a phone while a slider is dragged. */}
          <div className="bg-paper sticky top-0 z-10 order-1 -mx-4 grid min-w-0 gap-2 px-4 py-2 sm:-mx-6 sm:px-6 lg:static lg:m-0 lg:p-0">
            <FlightView
              view={view.view}
              result={result}
              handedness={setup.bow.handedness}
              elapsed={playback.elapsed}
              exaggeration={view.exaggeration}
            />
            <div className="lg:hidden">
              <ResultSummary result={result} />
            </div>
          </div>
          <div className="order-2 min-w-0 lg:mt-3">
            <PlaybackControls
              playing={playback.playing}
              onToggle={playback.toggle}
              onRestart={playback.restart}
              settings={view}
              onSettingsChange={mode === 'advanced' ? setAdvancedView : undefined}
            />
          </div>
          <div className="order-4 min-w-0 lg:mt-6">
            <ResultPanel result={result} />
          </div>
        </div>

        <div className="order-3 min-w-0 lg:order-1">
          <SetupPanels />
        </div>
      </div>
    </main>
  )
}
