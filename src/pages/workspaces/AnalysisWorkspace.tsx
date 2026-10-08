import { useMemo, useState } from 'react'
import { SegmentedControl } from '../../components/common/SegmentedControl.tsx'
import {
  ComparisonFlight,
  ComparisonTable,
  MOST_COMPARED,
} from '../../components/compare/Comparison.tsx'
import { Landscape, SensitivityChart } from '../../components/explore/ExploreViews.tsx'
import { useExplore } from '../../components/explore/useExplore.ts'
import {
  PlaybackControls,
  TimeScrubber,
  type ViewSettings,
} from '../../components/simulation/SimulationStage.tsx'
import {
  DEFAULT_DISTANCE,
  DEFAULT_EXAGGERATION,
  DEFAULT_IMPACT,
  DEFAULT_SPEED,
  HOLD_SECONDS,
  clipSeconds,
} from '../../components/simulation/timing.ts'
import { usePlayback } from '../../components/simulation/usePlayback.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { tierShows } from '../../models/parameters.ts'
import { useLibraryStore } from '../../state/libraryStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { useFlight } from './useFlight.ts'

type Kind = 'compare' | 'explore'

// Two setups are drawn at once when comparing, so each gets a single view.
const COMPARE_VIEWS = ['top', 'side'] as const

const DEFAULT_VIEW: ViewSettings = {
  view: 'top',
  distance: DEFAULT_DISTANCE,
  impact: DEFAULT_IMPACT,
  speed: DEFAULT_SPEED,
  exaggeration: DEFAULT_EXAGGERATION,
}

/** The landscape and the sensitivity chart of the setup on screen. */
function Explore() {
  const setup = useTuningStore((state) => state.setup)
  const result = useExplore(setup)
  return (
    <div className="grid gap-6 @container">
      <Landscape grid={result.landscape} />
      <SensitivityChart entries={result.sensitivity} />
    </div>
  )
}

type CompareProps = {
  /** The saved setups picked to compare against. Empty for the default choice. */
  chosenIds: string[]
  onChosenIdsChange: (ids: string[]) => void
}

function Compare({ chosenIds, onChosenIdsChange }: CompareProps) {
  const m = useMessages()
  const units = useTuningStore((state) => state.units)
  const pro = useTuningStore((state) => tierShows(state.mode, 'pro'))
  const saved = useLibraryStore((state) => state.saved)
  const [settings, setSettings] = useState(DEFAULT_VIEW)
  const view = pro ? settings : { ...settings, exaggeration: DEFAULT_EXAGGERATION }
  const { setup, model, trajectory, result } = useFlight(view.distance)

  // Without a choice, against the saved copy of the setup on screen (before and
  // after), or else the first saved one.
  const others = useMemo(() => {
    const chosen = chosenIds.flatMap((id) => saved.find((entry) => entry.id === id) ?? [])
    const fallback = saved.find((entry) => entry.id === setup.id) ?? saved[0]
    return chosen.length > 0 ? chosen : fallback ? [fallback] : []
  }, [chosenIds, saved, setup.id])
  const otherResults = useMemo(
    () => others.map((other) => ({ setup: other, result: model.simulate(other, { trajectory }) })),
    [model, others, trajectory],
  )
  const toggle = (id: string) => {
    const current = others.map((other) => other.id)
    onChosenIdsChange(
      current.includes(id) ? current.filter((chosen) => chosen !== id) : [...current, id],
    )
  }

  // The slowest of the flights sets the length of the loop, so all of them finish.
  const duration = Math.max(
    clipSeconds(result),
    ...otherResults.map((other) => clipSeconds(other.result)),
  )
  const playback = usePlayback(duration, HOLD_SECONDS, view.speed)

  if (otherResults.length === 0)
    return (
      <p className="border-line bg-surface max-w-prose rounded-lg border p-4">{m.compare.empty}</p>
    )
  const compared = { saved: otherResults, now: { setup, result } }
  const drawn = view.view === 'side' ? 'side' : 'top'

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] xl:items-start xl:gap-8">
      <div className="grid min-w-0 gap-3">
        <ComparisonFlight
          {...compared}
          view={drawn}
          impact={view.impact}
          elapsed={playback.elapsed}
          exaggeration={view.exaggeration}
        />
        <TimeScrubber
          result={result}
          elapsed={playback.elapsed}
          flightSeconds={duration}
          onSeek={playback.seek}
        />
        <fieldset>
          <legend className="font-medium">
            {m.compare.with}{' '}
            <span className="text-ink-muted text-sm font-normal">
              {m.compare.upTo(MOST_COMPARED)}
            </span>
          </legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {saved.map((entry) => {
              const checked = others.some((other) => other.id === entry.id)
              return (
                <label
                  key={entry.id}
                  className="border-line bg-surface has-checked:border-ink has-focus-visible:outline-accent has-disabled:text-ink-muted flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-md border px-3 font-medium has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-disabled:cursor-default"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    // One setup always stays, and no more than fit on screen.
                    disabled={checked ? others.length === 1 : others.length >= MOST_COMPARED}
                    onChange={() => toggle(entry.id)}
                    className="accent-accent size-5 cursor-pointer disabled:cursor-default"
                  />
                  <span className="min-w-0 break-words">{entry.name}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
        <PlaybackControls
          playing={playback.playing}
          onToggle={playback.toggle}
          onRestart={playback.restart}
          settings={{ ...view, view: drawn }}
          onSettingsChange={(next) =>
            setSettings((current) => (pro ? next : { ...next, exaggeration: current.exaggeration }))
          }
          advanced={pro}
          views={COMPARE_VIEWS}
        />
      </div>
      <ComparisonTable {...compared} units={units} />
    </div>
  )
}

/** Looking at more than the one setup on screen: against saved ones, or across a range of values. */
export function AnalysisWorkspace(props: CompareProps) {
  const m = useMessages()
  const pro = useTuningStore((state) => tierShows(state.mode, 'pro'))
  const [chosen, setChosen] = useState<Kind>('compare')
  const kind = pro ? chosen : 'compare'

  return (
    <div className="grid gap-4">
      {pro && (
        <div className="justify-self-start">
          <SegmentedControl
            label={m.simulator.analysisShow}
            hideLabel
            options={[
              { value: 'compare', label: m.simulator.compare },
              { value: 'explore', label: m.simulator.explore },
            ]}
            value={kind}
            onChange={(next) => setChosen(next as Kind)}
          />
        </div>
      )}
      {kind === 'explore' ? <Explore /> : <Compare {...props} />}
    </div>
  )
}
