import { useDeferredValue, useMemo } from 'react'
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
import { NextStep } from '../../components/tuning/NextStep.tsx'
import { ResultSentence } from '../../components/tuning/ResultPanel.tsx'
import { BowViewer, BowViewerControls } from '../../components/viewer3d/SetupViewer.tsx'
import { useBowViewer } from '../../components/viewer3d/useBowViewer.ts'
import { suggestTuning } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { TuningSetup } from '../../models/setup.ts'
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
  const setParameter = useTuningStore((state) => state.setParameter)
  const pointTo = useTuningStore((state) => state.pointTo)

  const { setup, model, comparison, result } = useFlight(DEFAULT_DISTANCE)
  // Finding the next step tries hundreds of setups. It follows a value a moment
  // later, so the value itself and the reading answer at once.
  // On the first drawing of the page it is left out altogether, and follows.
  const settled = useDeferredValue<TuningSetup | null>(setup, null)
  const advice = useMemo(
    () => settled && suggestTuning(model, settled, { tier: mode, limit: 1 }),
    [model, settled, mode],
  )
  const viewer = useBowViewer(setup)
  const playback = usePlayback(clipSeconds(result), HOLD_SECONDS, DEFAULT_SPEED)
  const handedness = setup.bow.handedness

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="order-3 min-w-0 lg:order-1">
        <SetupGroups />
      </div>

      {/* On a phone its parts are placed around the values; on a wide screen it is one column that stays in view. */}
      <div className="contents lg:sticky lg:top-4 lg:order-2 lg:grid lg:max-h-[calc(100vh-2rem)] lg:gap-3 lg:overflow-y-auto">
        <div className="border-line bg-panel order-1 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border px-3 py-1.5">
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
            options={(['top', 'side', 'off'] as const).map((value) => ({
              value,
              label: m.panels.previews[value],
            }))}
            value={flightPreview}
            onChange={(next) => setFlightPreview(next as FlightPreview)}
          />
        </div>

        {/* What the values do stays in view while one of them is changed. */}
        <div className="bg-paper sticky top-0 z-10 order-2 -mx-4 grid min-w-0 gap-2 px-4 py-2 sm:-mx-6 sm:px-6 lg:static lg:m-0 lg:p-0">
          <ResultSentence result={result} comparison={comparison} handedness={handedness} />
          {bow3d && (
            <BowViewer
              bow={setup.bow}
              arrow={setup.arrow}
              viewer={viewer}
              units={units}
              onPick={pointTo}
              compact
              fallback={null}
            />
          )}
          {flightPreview !== 'off' && (
            <FlightView
              view={flightPreview}
              result={result}
              bare={comparison.bare}
              handedness={handedness}
              impact={DEFAULT_IMPACT}
              elapsed={playback.elapsed}
              exaggeration={DEFAULT_EXAGGERATION}
              compact
            />
          )}
        </div>

        <div className="order-4 grid min-w-0 gap-3">
          {flightPreview !== 'off' && (
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
          <NextStep
            advice={advice}
            before={{
              classification: result.classification,
              horizontal: comparison.horizontal,
              vertical: comparison.vertical,
            }}
            onTry={setParameter}
          />
          <AssumedValues />
          {bow3d && (
            <details>
              <summary className="focus-visible:outline-accent flex min-h-11 cursor-pointer items-center font-medium focus-visible:outline-2">
                {m.panels.previews.bow}: {m.stage.options.toLowerCase()}
              </summary>
              <BowViewerControls viewer={viewer} onPick={pointTo} />
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
