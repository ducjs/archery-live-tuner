import { useEffect, useId, useMemo, useState } from 'react'
import { SegmentedControl } from '../components/common/SegmentedControl.tsx'
import { inputClass } from '../components/common/styles.ts'
import { ComparisonFlight, ComparisonTable } from '../components/compare/Comparison.tsx'
import { SavedSetups } from '../components/setups/SavedSetups.tsx'
import { SharedSetupNotice } from '../components/setups/SetupTransfer.tsx'
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
  DEFAULT_IMPACT,
  DEFAULT_SPEED,
  HOLD_SECONDS,
  clipSeconds,
} from '../components/simulation/timing.ts'
import { usePlayback } from '../components/simulation/usePlayback.ts'
import { ResultPanel, ResultSummary } from '../components/tuning/ResultPanel.tsx'
import { SetupPanels } from '../components/tuning/SetupPanels.tsx'
import { TuningSuggestions } from '../components/tuning/TuningSuggestions.tsx'
import { DEFAULT_TRAJECTORY_OPTIONS, heuristicModel, suggestTuning } from '../engine/index.ts'
import { useMessages } from '../i18n/useMessages.ts'
import { useLibraryStore } from '../state/libraryStore.ts'
import { useTuningStore } from '../state/tuningStore.ts'

type Stage = 'flight' | 'compare' | 'bow'
/** The part of the page a phone shows under the animation. A wide screen shows all of them. */
type Section = 'setup' | 'result' | 'advice'

const DEFAULT_VIEW: ViewSettings = {
  view: 'both',
  distance: DEFAULT_DISTANCE,
  impact: DEFAULT_IMPACT,
  speed: DEFAULT_SPEED,
  exaggeration: DEFAULT_EXAGGERATION,
}

// Two setups are drawn at once when comparing, so each gets a single view.
const COMPARE_VIEWS = ['top', 'side'] as const

export function Simulator() {
  const m = useMessages()
  const compareId = useId()
  const setup = useTuningStore((state) => state.setup)
  const mode = useTuningStore((state) => state.mode)
  const units = useTuningStore((state) => state.units)
  const setParameter = useTuningStore((state) => state.setParameter)
  const saved = useLibraryStore((state) => state.saved)
  const loadSaved = useLibraryStore((state) => state.load)
  const [bareShaft, setBareShaft] = useState(true)

  useEffect(() => {
    void loadSaved()
  }, [loadSaved])

  // Amplification is an Advanced feature. Simple mode always uses its default,
  // so a setting the user cannot see never changes what is shown.
  const advanced = mode === 'advanced'
  const [settings, setSettings] = useState(DEFAULT_VIEW)
  const view = advanced ? settings : { ...settings, exaggeration: DEFAULT_EXAGGERATION }

  const trajectory = useMemo(
    () => ({ ...DEFAULT_TRAJECTORY_OPTIONS, distance: view.distance * 1000 }),
    [view.distance],
  )
  const comparison = useMemo(
    () => heuristicModel.compareBareShaft(setup, { trajectory }),
    [setup, trajectory],
  )
  const result = comparison.fletched
  // Simple mode only gets suggestions about values it can see. All of them are
  // asked for: the panel sorts them into its two groups and trims each.
  const advice = useMemo(
    () => suggestTuning(heuristicModel, setup, { tier: mode, limit: Infinity }),
    [setup, mode],
  )

  const [stage, setStage] = useState<Stage>(() =>
    window.location.hash === '#3d' ? 'bow' : 'flight',
  )
  const viewer = useBowViewer(setup.bow)
  const [section, setSection] = useState<Section>('setup')
  // The top and side views can be put away, to leave a small screen to the values.
  const [drawingHidden, setDrawingHidden] = useState(false)

  // Compare against the chosen setup. Without a choice, against the saved copy of
  // the setup on screen (before and after), or else the first saved one.
  const [chosenId, setChosenId] = useState<string | null>(null)
  const other =
    saved.find((entry) => entry.id === chosenId) ??
    saved.find((entry) => entry.id === setup.id) ??
    saved[0]
  const otherResult = useMemo(
    () => other && heuristicModel.simulate(other, { trajectory }),
    [other, trajectory],
  )
  const comparing = stage === 'compare' && other && otherResult
  const compared = comparing && {
    saved: { setup: other, result: otherResult },
    now: { setup, result },
  }

  // The slower of two flights sets the length of the loop, so both finish.
  const duration = compared
    ? Math.max(clipSeconds(result), clipSeconds(otherResult))
    : clipSeconds(result)
  const playback = usePlayback(duration, HOLD_SECONDS, view.speed)

  // A comparison has no suggestions of its own.
  const sections: Section[] = compared ? ['setup', 'result'] : ['setup', 'result', 'advice']
  const shownSection = sections.includes(section) ? section : 'result'

  const onSettingsChange = (next: ViewSettings) =>
    // Simple mode shows the default amplification; do not store that.
    setSettings((current) => (advanced ? next : { ...next, exaggeration: current.exaggeration }))

  return (
    <main className="px-4 pt-5 pb-12 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h1 className="font-display text-3xl leading-tight font-semibold">{m.simulator.title}</h1>
          <p className="text-ink-muted mt-1 max-w-prose">{m.simulator.intro}</p>
        </div>
        <SegmentedControl
          label={m.simulator.show}
          options={[
            { value: 'flight', label: m.simulator.flight },
            { value: 'compare', label: m.simulator.compare },
            { value: 'bow', label: m.simulator.bow },
          ]}
          value={stage}
          onChange={(next) => setStage(next as Stage)}
        />
      </header>
      <SharedSetupNotice />

      <div className="mt-5 grid gap-5 lg:grid-cols-[22rem_1fr] lg:items-start lg:gap-8">
        {/*
          On a phone its parts are placed around the inputs. On a wide screen it is one
          column, and on a very wide one the result moves beside the animation.
        */}
        <div className="contents lg:sticky lg:top-4 lg:order-2 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto 2xl:grid 2xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-rows-[auto_1fr] 2xl:items-start 2xl:gap-x-8">
          {/*
            The animation stays in view on a phone while a slider is dragged. Two
            drawings would cover half the screen, so a comparison scrolls away.
          */}
          <div
            className={`bg-paper order-1 -mx-4 grid min-w-0 gap-2 px-4 py-2 sm:-mx-6 sm:px-6 lg:static lg:m-0 lg:p-0 ${stage === 'compare' ? '' : 'sticky top-0 z-10'}`}
          >
            {stage === 'bow' ? (
              <BowViewer bow={setup.bow} arrow={setup.arrow} viewer={viewer} />
            ) : stage === 'compare' && !compared ? (
              <p className="border-line bg-surface max-w-prose rounded-lg border p-4">
                {m.compare.empty}
              </p>
            ) : drawingHidden ? null : (
              <>
                {compared ? (
                  <ComparisonFlight
                    {...compared}
                    view={view.view === 'side' ? 'side' : 'top'}
                    impact={view.impact}
                    elapsed={playback.elapsed}
                    exaggeration={view.exaggeration}
                  />
                ) : (
                  <FlightView
                    view={view.view}
                    result={result}
                    bare={bareShaft ? comparison.bare : undefined}
                    handedness={setup.bow.handedness}
                    impact={view.impact}
                    elapsed={playback.elapsed}
                    exaggeration={view.exaggeration}
                  />
                )}
                <TimeScrubber
                  result={result}
                  elapsed={playback.elapsed}
                  flightSeconds={duration}
                  onSeek={playback.seek}
                />
              </>
            )}
            {stage !== 'compare' && (
              <div className="lg:hidden">
                <ResultSummary result={result} />
              </div>
            )}
          </div>
          <div className="order-2 grid min-w-0 gap-3 lg:mt-3">
            {stage === 'bow' && <BowViewerControls viewer={viewer} />}
            {compared && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <label htmlFor={compareId} className="font-medium">
                  {m.compare.with}
                </label>
                <select
                  id={compareId}
                  value={other.id}
                  onChange={(event) => setChosenId(event.target.value)}
                  className={`${inputClass} max-w-full`}
                >
                  {saved.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {stage === 'flight' && (
              <PlaybackControls
                playing={playback.playing}
                onToggle={playback.toggle}
                onRestart={playback.restart}
                bareShaft={bareShaft}
                onBareShaftChange={setBareShaft}
                drawingHidden={drawingHidden}
                onDrawingHiddenChange={setDrawingHidden}
                settings={view}
                onSettingsChange={onSettingsChange}
                advanced={advanced}
              />
            )}
            {compared && (
              <PlaybackControls
                playing={playback.playing}
                onToggle={playback.toggle}
                onRestart={playback.restart}
                drawingHidden={drawingHidden}
                onDrawingHiddenChange={setDrawingHidden}
                settings={{ ...view, view: view.view === 'side' ? 'side' : 'top' }}
                onSettingsChange={onSettingsChange}
                advanced={advanced}
                views={COMPARE_VIEWS}
              />
            )}
          </div>
          {/* On a phone the page is three sections, one at a time, so it stays short. */}
          <div
            role="tablist"
            aria-label={m.simulator.sections}
            className="border-line bg-surface order-2 grid auto-cols-fr grid-flow-col rounded-md border p-0.5 lg:hidden"
          >
            {sections.map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                id={`section-tab-${name}`}
                aria-selected={shownSection === name}
                aria-controls={`section-${name === 'advice' ? 'result' : name}`}
                onClick={() => setSection(name)}
                className="aria-selected:bg-ink aria-selected:text-surface focus-visible:outline-accent min-h-11 cursor-pointer rounded px-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {m.simulator.section[name]}
              </button>
            ))}
          </div>
          <div
            id="section-result"
            className={`order-4 min-w-0 lg:mt-6 lg:block 2xl:col-start-2 2xl:row-span-2 2xl:row-start-1 2xl:mt-0 ${shownSection === 'setup' ? 'hidden' : ''}`}
          >
            {compared ? (
              <ComparisonTable {...compared} units={units} />
            ) : (
              <>
                <div className={`lg:block ${shownSection === 'result' ? '' : 'hidden'}`}>
                  <ResultPanel
                    result={result}
                    comparison={bareShaft ? comparison : undefined}
                    handedness={setup.bow.handedness}
                    advanced={advanced}
                  />
                </div>
                <div className={`lg:mt-5 lg:block ${shownSection === 'advice' ? '' : 'hidden'}`}>
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
              </>
            )}
          </div>
        </div>

        <div
          id="section-setup"
          className={`order-3 min-w-0 gap-5 lg:order-1 lg:grid ${shownSection === 'setup' ? 'grid' : 'hidden'}`}
        >
          <SavedSetups
            onCompare={(id) => {
              setChosenId(id)
              setStage('compare')
            }}
          />
          <SetupPanels />
        </div>
      </div>

      <footer className="border-line text-ink-muted mt-10 grid max-w-prose gap-1 border-t pt-4 text-sm">
        <p>{m.simulator.disclaimer}</p>
        <p>{m.simulator.modelOnly}</p>
      </footer>
    </main>
  )
}
