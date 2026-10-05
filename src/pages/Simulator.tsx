import { useMemo, useState } from 'react'
import { SegmentedControl } from '../components/common/SegmentedControl.tsx'
import { BowViewer, BowViewerControls } from '../components/viewer3d/SetupViewer.tsx'
import { useBowViewer } from '../components/viewer3d/useBowViewer.ts'
import {
  FlightView,
  PlaybackControls,
  TimeScrubber,
  type ViewSettings,
} from '../components/simulation/SimulationStage.tsx'
import {
  DEFAULT_DISTANCE,
  DEFAULT_EXAGGERATION,
  DEFAULT_SPEED,
  HOLD_SECONDS,
  flightSeconds,
} from '../components/simulation/timing.ts'
import { usePlayback } from '../components/simulation/usePlayback.ts'
import { ResultPanel, ResultSummary } from '../components/tuning/ResultPanel.tsx'
import { SetupPanels } from '../components/tuning/SetupPanels.tsx'
import { TuningSuggestions } from '../components/tuning/TuningSuggestions.tsx'
import { DEFAULT_TRAJECTORY_OPTIONS, heuristicModel, suggestTuning } from '../engine/index.ts'
import { useTuningStore } from '../state/tuningStore.ts'

type Stage = 'flight' | 'bow'

const STAGES = [
  { value: 'flight', label: 'Arrow flight' },
  { value: 'bow', label: 'Bow in 3D (preview)' },
]

const DEFAULT_VIEW: ViewSettings = {
  view: 'top',
  distance: DEFAULT_DISTANCE,
  speed: DEFAULT_SPEED,
  exaggeration: DEFAULT_EXAGGERATION,
}

export function Simulator() {
  const setup = useTuningStore((state) => state.setup)
  const mode = useTuningStore((state) => state.mode)
  const setParameter = useTuningStore((state) => state.setParameter)
  const [bareShaft, setBareShaft] = useState(true)

  // Amplification is an Advanced feature. Simple mode always uses its default,
  // so a setting the user cannot see never changes what is shown.
  const advanced = mode === 'advanced'
  const [settings, setSettings] = useState(DEFAULT_VIEW)
  const view = advanced ? settings : { ...settings, exaggeration: DEFAULT_EXAGGERATION }

  const comparison = useMemo(
    () =>
      heuristicModel.compareBareShaft(setup, {
        trajectory: { ...DEFAULT_TRAJECTORY_OPTIONS, distance: view.distance * 1000 },
      }),
    [setup, view.distance],
  )
  const result = comparison.fletched
  // Simple mode only gets suggestions about values it can see.
  const advice = useMemo(() => suggestTuning(heuristicModel, setup, { tier: mode }), [setup, mode])

  const playback = usePlayback(flightSeconds(result), HOLD_SECONDS, view.speed)

  const [stage, setStage] = useState<Stage>(() =>
    window.location.hash === '#3d' ? 'bow' : 'flight',
  )
  const viewer = useBowViewer(setup.bow)

  return (
    <main className="px-4 pt-5 pb-12 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="font-display text-3xl leading-tight font-semibold">
            Recurve tuning simulator
          </h1>
          <p className="text-ink-muted mt-1 max-w-prose">
            Change a value and watch how the arrow leaves the bow.
          </p>
        </div>
        <SegmentedControl
          label="Show"
          options={STAGES}
          value={stage}
          onChange={(next) => setStage(next as Stage)}
        />
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-8">
        {/*
          On a phone its parts are placed around the inputs. On a wide screen it is one
          column, and on a very wide one the result moves beside the animation.
        */}
        <div className="contents lg:sticky lg:top-4 lg:order-2 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto 2xl:grid 2xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-rows-[auto_1fr] 2xl:items-start 2xl:gap-x-8">
          {/* The animation stays in view on a phone while a slider is dragged. */}
          <div className="bg-paper sticky top-0 z-10 order-1 -mx-4 grid min-w-0 gap-2 px-4 py-2 sm:-mx-6 sm:px-6 lg:static lg:m-0 lg:p-0">
            {stage === 'bow' ? (
              <BowViewer bow={setup.bow} arrow={setup.arrow} viewer={viewer} />
            ) : (
              <>
                <FlightView
                  view={view.view}
                  result={result}
                  bare={bareShaft ? comparison.bare : undefined}
                  handedness={setup.bow.handedness}
                  elapsed={playback.elapsed}
                  exaggeration={view.exaggeration}
                />
                <TimeScrubber
                  result={result}
                  elapsed={playback.elapsed}
                  flightSeconds={flightSeconds(result)}
                  onSeek={playback.seek}
                />
              </>
            )}
            <div className="lg:hidden">
              <ResultSummary result={result} />
            </div>
          </div>
          <div className="order-2 min-w-0 lg:mt-3">
            {stage === 'bow' ? (
              <BowViewerControls viewer={viewer} />
            ) : (
              <PlaybackControls
                playing={playback.playing}
                onToggle={playback.toggle}
                onRestart={playback.restart}
                bareShaft={bareShaft}
                onBareShaftChange={setBareShaft}
                settings={view}
                onSettingsChange={(next) =>
                  // Simple mode shows the default amplification; do not store that.
                  setSettings((current) =>
                    advanced ? next : { ...next, exaggeration: current.exaggeration },
                  )
                }
                advanced={advanced}
              />
            )}
          </div>
          <div className="order-4 min-w-0 lg:mt-6 2xl:col-start-2 2xl:row-span-2 2xl:row-start-1 2xl:mt-0">
            <ResultPanel
              result={result}
              comparison={bareShaft ? comparison : undefined}
              handedness={setup.bow.handedness}
            />
            <div className="mt-5">
              <TuningSuggestions
                advice={advice}
                before={{
                  classification: result.classification,
                  horizontal: comparison.horizontal,
                  vertical: comparison.vertical,
                }}
                onTry={setParameter}
              />
            </div>
          </div>
        </div>

        <div className="order-3 min-w-0 lg:order-1">
          <SetupPanels />
        </div>
      </div>
    </main>
  )
}
