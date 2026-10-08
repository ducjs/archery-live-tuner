import { useDeferredValue, useMemo, useState } from 'react'
import { AssumedValues } from '../../components/setup/SetupGroups.tsx'
import {
  FlightView,
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
import { useSight } from '../../components/target/useSight.ts'
import { DrawCurvePanel } from '../../components/tuning/DrawCurvePanel.tsx'
import { NextStep } from '../../components/tuning/NextStep.tsx'
import { ResultPanel } from '../../components/tuning/ResultPanel.tsx'
import { TuningPlanPanel } from '../../components/tuning/TuningPlanPanel.tsx'
import { TuningSuggestions } from '../../components/tuning/TuningSuggestions.tsx'
import { planTuning, suggestTuning } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { tierShows } from '../../models/parameters.ts'
import { useCalibrationStore } from '../../state/calibrationStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { useFlight } from './useFlight.ts'

const DEFAULT_VIEW: ViewSettings = {
  view: 'both',
  distance: DEFAULT_DISTANCE,
  impact: DEFAULT_IMPACT,
  speed: DEFAULT_SPEED,
  exaggeration: DEFAULT_EXAGGERATION,
}

/** The arrow leaving the bow, what the model reads from it, and what to try next. */
export function SimulateWorkspace() {
  const m = useMessages()
  const mode = useTuningStore((state) => state.mode)
  const units = useTuningStore((state) => state.units)
  const setParameter = useTuningStore((state) => state.setParameter)
  const fitted = useCalibrationStore((state) => state.enabled)
  const [bareShaft, setBareShaft] = useState(true)
  const [drawingHidden, setDrawingHidden] = useState(false)

  // Amplification is a Professional feature. Below that the default is used,
  // so a setting the user cannot see never changes what is shown.
  const pro = tierShows(mode, 'pro')
  const advanced = tierShows(mode, 'advanced')
  const [settings, setSettings] = useState(DEFAULT_VIEW)
  const view = pro ? settings : { ...settings, exaggeration: DEFAULT_EXAGGERATION }
  const onSettingsChange = (next: ViewSettings) =>
    setSettings((current) => (pro ? next : { ...next, exaggeration: current.exaggeration }))

  const { setup, model, comparison, result } = useFlight(view.distance)
  // Only suggestions about values the level shows. All of them are asked for:
  // the panel sorts them into its two groups and trims each.
  // They take hundreds of setups to find, so they follow a change a moment
  // later and the reading answers at once.
  const settled = useDeferredValue(setup)
  const advice = useMemo(
    () => suggestTuning(model, settled, { tier: mode, limit: Infinity }),
    [model, settled, mode],
  )
  // The same suggestions, taken one after the other as a whole session.
  const plan = useMemo(() => planTuning(model, settled, { tier: mode }), [model, settled, mode])
  const before = {
    classification: result.classification,
    horizontal: comparison.horizontal,
    vertical: comparison.vertical,
  }

  // The sight on the bow, with its pin where the distance being shot puts it.
  const sight = useSight(setup, result)
  const pinNow = sight.pins.find((pin) => pin.distance === view.distance * 1000)
  const sightOnBow =
    pro && sight.entry.onBow && pinNow && pinNow.status !== 'unreachable'
      ? {
          extension: sight.entry.extension,
          pinHeight: pinNow.pinHeight,
          pinDiameter: sight.entry.pinDiameter,
          status: pinNow.status,
        }
      : undefined

  const duration = clipSeconds(result)
  const playback = usePlayback(duration, HOLD_SECONDS, view.speed)

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_27rem] xl:items-start xl:gap-8">
      <div className="grid min-w-0 gap-3 xl:sticky xl:top-4">
        {!drawingHidden && (
          <>
            <FlightView
              view={view.view}
              result={result}
              bare={bareShaft ? comparison.bare : undefined}
              sight={sightOnBow}
              handedness={setup.bow.handedness}
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
          </>
        )}
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
          advanced={pro}
        />
      </div>

      <div className="grid min-w-0 gap-4">
        {fitted && (
          <p className="border-accent bg-accent/10 max-w-prose rounded-md border-l-4 px-3 py-2">
            {m.calibration.active}
          </p>
        )}
        <ResultPanel
          result={result}
          comparison={bareShaft ? comparison : undefined}
          handedness={setup.bow.handedness}
          level={mode}
          braceHeight={setup.bow.braceHeight}
          centerShot={setup.bow.centerShot}
          nextStep={<NextStep advice={advice} before={before} onTry={setParameter} />}
          curve={<DrawCurvePanel setup={setup} result={result} units={units} />}
        />
        <AssumedValues />
        {advice.suggestions.length > 1 && (
          <TuningSuggestions advice={advice} before={before} onTry={setParameter} />
        )}
        {advanced && (
          <TuningPlanPanel
            plan={plan}
            onApply={(changes) => {
              for (const { parameterKey, value } of changes) setParameter(parameterKey, value)
            }}
          />
        )}
      </div>
    </div>
  )
}
