import { useMemo, useState } from 'react'
import { DEFAULT_DISTANCE } from '../../components/simulation/timing.ts'
import { CalibrationPanel } from '../../components/target/CalibrationPanel.tsx'
import { ObservationPanel } from '../../components/target/ObservationPanel.tsx'
import { SightMarksPanel } from '../../components/target/SightMarksPanel.tsx'
import { TargetControls } from '../../components/target/TargetControls.tsx'
import { TargetFace } from '../../components/target/TargetFace.tsx'
import { TargetReading } from '../../components/target/TargetReading.tsx'
import { useSight } from '../../components/target/useSight.ts'
import { diagnosePlot, readPlot } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { tierShows } from '../../models/parameters.ts'
import { useObservationStore } from '../../state/observationStore.ts'
import { usePlotStore } from '../../state/plotStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { createObservation } from '../../utils/observations.ts'
import { useFlight } from './useFlight.ts'

/** Real arrows in a real target, read against the setup on screen. */
export function TargetWorkspace() {
  const m = useMessages()
  const pro = useTuningStore((state) => tierShows(state.mode, 'pro'))
  const { setup, model, result } = useFlight(DEFAULT_DISTANCE)
  const sight = useSight(setup, result)

  const plot = usePlotStore((state) => state.plot)
  const addMark = usePlotStore((state) => state.addMark)
  const saveObservation = useObservationStore((state) => state.save)
  const handedness = setup.bow.handedness
  const plotReading = useMemo(() => readPlot(plot, handedness), [plot, handedness])
  const diagnosis = useMemo(
    () => diagnosePlot(plotReading, setup, model),
    [plotReading, setup, model],
  )
  // The plot that was last saved, to say so until it changes.
  const [savedPlot, setSavedPlot] = useState<typeof plot | null>(null)
  const saveTarget = () => {
    const seen = plotReading.conclusive
      ? {
          bareHorizontal: plotReading.bareHorizontal,
          bareVertical: plotReading.bareVertical,
          ...(plotReading.horizontal !== 'OK' && { stiffness: plotReading.horizontal }),
        }
      : {}
    void saveObservation(createObservation(setup, seen, { plot }))
    setSavedPlot(plot)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start lg:gap-8">
      <div className="grid min-w-0 gap-3">
        <p className="text-ink-muted max-w-prose">{m.target.how}</p>
        <TargetFace
          plot={plot}
          reading={plotReading}
          label={m.target.faceLabel(
            plot.faceDiameter / 10,
            plotReading.fletchedCount,
            plotReading.bareCount,
          )}
          onMark={addMark}
          keyboardLabel={m.target.keyboardLabel}
          describeCursor={m.target.cursor}
        />
        <TargetControls />
      </div>
      <div className="grid min-w-0 gap-6">
        <TargetReading
          reading={plotReading}
          diagnosis={diagnosis}
          onSave={saveTarget}
          saved={savedPlot === plot}
        />
        <ObservationPanel setup={setup} />
        {pro && <SightMarksPanel setup={setup} result={result} sight={sight} />}
        {pro && <CalibrationPanel />}
      </div>
    </div>
  )
}
