import { useMemo, useState } from 'react'
import { MIN_MARKS, dragPerMeter, fitSightMarks } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import type { SimulationResult } from '../../models/simulation.ts'
import type { TuningSetup } from '../../models/setup.ts'
import { useObservationStore } from '../../state/observationStore.ts'
import { sightOf, useSightStore } from '../../state/sightStore.ts'
import { createObservation } from '../../utils/observations.ts'
import { buttonClass, inputClass } from '../common/styles.ts'
import { DISTANCES } from '../simulation/timing.ts'

const TO_PREDICT = DISTANCES.map((meters) => meters * 1000)

/** Reads a number an archer typed, with a comma or a point. Empty and nonsense are null. */
function typed(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'))
  return text.trim() === '' || !Number.isFinite(value) ? null : value
}

const metersPerSecond = (speed: number) => (speed / 1000).toFixed(1)

type Props = {
  setup: TuningSetup
  /** The model result for the setup, for the speed it estimates. */
  result: SimulationResult
}

/**
 * The sight marks the archer has, and the marks the model expects for the
 * other distances. The marks in are real; the marks out are a model result.
 */
export function SightMarksPanel({ setup, result }: Props) {
  const text = useMessages().sight
  const entry = useSightStore((state) => sightOf(state.bySetup, setup.id))
  const setMark = useSightStore((state) => state.setMark)
  const setEyeHeight = useSightStore((state) => state.setEyeHeight)
  const saveObservation = useObservationStore((state) => state.save)
  // The marks that were last saved, to say so until they change.
  const [saved, setSaved] = useState<typeof entry | null>(null)

  const modelSpeed = result.metrics.launchSpeed
  const fit = useMemo(
    () =>
      fitSightMarks(
        entry.marks,
        { speed: modelSpeed, drag: dragPerMeter(setup.arrow), eyeHeight: entry.eyeHeight },
        TO_PREDICT,
      ),
    [entry, modelSpeed, setup.arrow],
  )
  const fromMarks = fit?.speedFrom === 'marks'
  // A fit that misses an entered mark by this much is not to be trusted.
  const span = Math.abs((fit?.predictions.at(-1)?.mark ?? 0) - (fit?.predictions[0]?.mark ?? 0))
  const poorFit = fit !== null && fit.worstMiss > Math.max(0.5, span * 0.03)

  return (
    <section aria-labelledby="sight-heading" className="border-line @container border-t pt-4">
      <h2 id="sight-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <p className="text-ink-muted max-w-prose text-sm">{text.intro}</p>

      <table className="mt-3 w-full max-w-xl text-left">
        <thead>
          <tr className="text-ink-muted text-sm">
            <th scope="col" className="py-1 pr-3 font-normal">
              {text.distance}
            </th>
            <th scope="col" className="py-1 pr-3 font-normal">
              {text.yours}
            </th>
            <th scope="col" className="py-1 pr-3 font-normal">
              {text.predicted}
            </th>
            <th scope="col" className="py-1 font-normal">
              {text.range}
            </th>
          </tr>
        </thead>
        <tbody>
          {TO_PREDICT.map((distance) => {
            const meters = distance / 1000
            const known = entry.marks.find((mark) => mark.distance === distance)
            const prediction = fit?.predictions.find((row) => row.distance === distance)
            const reachable = prediction !== undefined && Number.isFinite(prediction.mark)
            return (
              <tr key={distance} className="border-line border-t align-baseline">
                <th scope="row" className="py-1.5 pr-3 font-semibold whitespace-nowrap">
                  {meters} m
                </th>
                <td className="py-1.5 pr-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={text.markAt(meters)}
                    className={`${inputClass} w-24`}
                    // Keyed by its value, so a mark set elsewhere shows, and typing is not fought.
                    key={`${setup.id}-${known?.mark ?? ''}`}
                    defaultValue={known?.mark ?? ''}
                    onBlur={(event) => {
                      const value = typed(event.target.value)
                      if (value !== (known?.mark ?? null)) setMark(setup.id, distance, value)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur()
                    }}
                  />
                </td>
                <td className="py-1.5 pr-3 font-semibold">
                  {!prediction ? '' : reachable ? prediction.mark.toFixed(1) : text.outOfReach}
                </td>
                <td className="text-ink-muted py-1.5">
                  {/* A mark the archer has needs no range: they shot it. */}
                  {reachable && known === undefined
                    ? text.between(prediction.low.toFixed(1), prediction.high.toFixed(1))
                    : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!fit && <p className="mt-3 max-w-prose">{text.need(MIN_MARKS)}</p>}
      {fit && (
        <>
          {poorFit && (
            <p
              role="alert"
              className="border-weak bg-weak/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2"
            >
              {text.poorFit(fit.worstMiss.toFixed(1))}
            </p>
          )}
          <p className="mt-3 max-w-prose">{text.confirm}</p>
          <dl className="mt-3 grid max-w-md gap-1">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">{text.modelSpeed}</dt>
              <dd className="text-right font-semibold">{metersPerSecond(modelSpeed)} m/s</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-ink-muted">{text.impliedSpeed}</dt>
              <dd className="text-right font-semibold">
                {fromMarks ? `${metersPerSecond(fit.speed)} m/s` : text.tooFew}
              </dd>
            </div>
          </dl>
          {fromMarks && fit.speedRange && (
            <p className="text-ink-muted mt-1 max-w-prose text-sm">
              {text.speedNote(
                metersPerSecond(fit.speedRange.low),
                metersPerSecond(fit.speedRange.high),
              )}
            </p>
          )}
        </>
      )}

      <label className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{text.eyeHeight}</span>
        <input
          type="text"
          inputMode="decimal"
          className={`${inputClass} w-20`}
          key={`${setup.id}-${entry.eyeHeight}`}
          defaultValue={entry.eyeHeight / 10}
          onBlur={(event) => {
            const centimeters = typed(event.target.value)
            // Outside what an anchor can be, the entry is put back.
            if (centimeters !== null && centimeters >= 0 && centimeters <= 30) {
              setEyeHeight(setup.id, centimeters * 10)
            } else {
              event.target.value = String(entry.eyeHeight / 10)
            }
          }}
        />
        <span className="text-ink-muted">cm</span>
      </label>
      <p className="text-ink-muted mt-1 max-w-prose text-sm">{text.eyeHeightHint}</p>

      {fit && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={buttonClass}
            disabled={saved === entry}
            onClick={() => {
              void saveObservation(
                createObservation(
                  setup,
                  {},
                  {
                    sight: {
                      marks: entry.marks,
                      eyeHeight: entry.eyeHeight,
                      ...(fromMarks && { impliedSpeed: fit.speed }),
                    },
                  },
                ),
              )
              setSaved(entry)
            }}
          >
            {text.save}
          </button>
          <p role="status" className="text-ink-muted text-sm">
            {saved === entry ? text.saved : text.saveHint}
          </p>
        </div>
      )}
      <p className="text-ink-muted mt-3 max-w-prose text-sm">{text.limits}</p>
    </section>
  )
}
