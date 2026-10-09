import { useMemo } from 'react'
import { SegmentedControl } from '../../components/common/SegmentedControl.tsx'
import { buttonClass } from '../../components/common/styles.ts'
import { AssumedValues, SetupGroups } from '../../components/setup/SetupGroups.tsx'
import { FlightView, TimeScrubber } from '../../components/simulation/SimulationStage.tsx'
import {
  DEFAULT_DISTANCE,
  DEFAULT_EXAGGERATION,
  DEFAULT_IMPACT,
  DEFAULT_SPEED,
  HOLD_SECONDS,
  clipSeconds,
} from '../../components/simulation/timing.ts'
import { usePlayback } from '../../components/simulation/usePlayback.ts'
import { PredictedTarget } from '../../components/target/PredictedTarget.tsx'
import { useSight } from '../../components/target/useSight.ts'
import { AttributeSheet } from '../../components/tuning/AttributeSheet.tsx'
import { BowViewer, BowViewerControls } from '../../components/viewer3d/SetupViewer.tsx'
import { useBowViewer } from '../../components/viewer3d/useBowViewer.ts'
import { attributes, dragPerMeter } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { useTuningStore, type FlightPreview } from '../../state/tuningStore.ts'
import { useFlight } from './useFlight.ts'

/**
 * The values of the setup next to what they do: the bow in 3D, where a part can
 * be pressed to go to its value, and the flight seen from above or from the side.
 */
export function SetupWorkspace() {
  const m = useMessages()
  const mode = useTuningStore((state) => state.mode)
  const units = useTuningStore((state) => state.units)
  const bow3d = useTuningStore((state) => state.bow3d)
  const flightPreview = useTuningStore((state) => state.flightPreview)
  const setBow3d = useTuningStore((state) => state.setBow3d)
  const setFlightPreview = useTuningStore((state) => state.setFlightPreview)
  const pointTo = useTuningStore((state) => state.pointTo)

  const { setup, model, comparison, result } = useFlight(DEFAULT_DISTANCE)
  // What the setup is like, as bars that move with every value. The sight is
  // the one of the Target workspace, with the speed its marks imply when there
  // are enough of them.
  const sight = useSight(setup, result)
  const sheet = useMemo(
    () =>
      attributes({
        model,
        setup,
        comparison,
        sight: {
          speed: sight.fit?.speed ?? result.metrics.launchSpeed,
          drag: dragPerMeter(setup.arrow),
          eyeHeight: sight.entry.eyeHeight,
          extension: sight.entry.extension,
          pinDiameter: sight.entry.pinDiameter,
        },
      }),
    [model, setup, comparison, result, sight],
  )
  const viewer = useBowViewer(setup)
  const playback = usePlayback(clipSeconds(result), HOLD_SECONDS, DEFAULT_SPEED)
  const handedness = setup.bow.handedness
  /** The flight as a drawing with time in it, when that is what is shown. */
  const drawn = flightPreview === 'top' || flightPreview === 'side' ? flightPreview : null

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] sm:items-start sm:gap-5 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-8">
      <div className="order-3 min-w-0 sm:order-1">
        <SetupGroups />
      </div>

      {/* On a phone its parts are placed around the values; on a wide screen it is one column that stays in view. */}
      <div className="contents sm:sticky sm:top-4 sm:order-2 sm:grid sm:max-h-[calc(100vh-7rem)] sm:gap-3 sm:overflow-y-auto lg:max-h-[calc(100vh-2rem)]">
        {/* Only what is shown. What sets a drawing stands with that drawing. */}
        <div className="border-line bg-panel order-1 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border px-3 py-1.5">
          <span className="text-ink-muted text-sm">{m.panels.previews.show}</span>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={bow3d}
              onChange={(event) => setBow3d(event.target.checked)}
              className="accent-accent focus-visible:outline-accent size-5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            {m.panels.previews.bow}
          </label>
          <SegmentedControl
            label={m.simulator.flight}
            options={(['target', 'top', 'side', 'off'] as const).map((value) => ({
              value,
              label: m.panels.previews[value],
            }))}
            value={flightPreview}
            onChange={(next) => setFlightPreview(next as FlightPreview)}
          />
        </div>

        {/* What the values do stays in view while one of them is changed. */}
        <div className="bg-paper sticky top-0 z-10 order-2 -mx-4 grid min-w-0 gap-2 px-4 py-2 sm:static sm:m-0 sm:p-0">
          {bow3d && (
            <BowViewer
              bow={setup.bow}
              arrow={setup.arrow}
              viewer={viewer}
              units={units}
              onPick={pointTo}
              compact
              fallback={null}
              controls={<BowViewerControls viewer={viewer} onPick={pointTo} brief />}
            />
          )}
          {flightPreview === 'target' && <PredictedTarget comparison={comparison} />}
          {drawn && (
            <FlightView
              view={drawn}
              result={result}
              bare={comparison.bare}
              handedness={handedness}
              impact={DEFAULT_IMPACT}
              elapsed={playback.elapsed}
              exaggeration={DEFAULT_EXAGGERATION}
              compact
            />
          )}
          {/* Play and the place in time belong to the flight: right under its drawing. */}
          {drawn && (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={playback.toggle} className={buttonClass}>
                {playback.playing ? m.stage.pause : m.stage.play}
              </button>
              <div className="min-w-48 flex-1">
                <TimeScrubber
                  result={result}
                  elapsed={playback.elapsed}
                  flightSeconds={clipSeconds(result)}
                  onSeek={playback.seek}
                />
              </div>
            </div>
          )}
        </div>

        <div className="order-4 grid min-w-0 gap-3">
          <AttributeSheet groups={sheet} level={mode} units={units} />
          <AssumedValues />
        </div>
      </div>
    </div>
  )
}
