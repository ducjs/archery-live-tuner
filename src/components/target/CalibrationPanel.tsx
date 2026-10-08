import { useState } from 'react'
import { MIN_OBSERVATIONS, fitPersonal } from '../../engine/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { useCalibrationStore } from '../../state/calibrationStore.ts'
import { useObservationStore } from '../../state/observationStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { buttonClass } from '../common/styles.ts'
import { describeShifts } from './calibrationText.ts'

/**
 * Fits the model to the archer's own observations and switches between the
 * fitted model and the base one. The base model is always one switch away.
 */
export function CalibrationPanel() {
  const m = useMessages()
  const text = m.calibration
  const language = useTuningStore((state) => state.language)
  const observations = useObservationStore((state) => state.observations)
  const fit = useCalibrationStore((state) => state.fit)
  const enabled = useCalibrationStore((state) => state.enabled)
  const { keep, setEnabled, clear } = useCalibrationStore.getState()
  const [status, setStatus] = useState('')

  const run = () => {
    const calibration = fitPersonal(observations)
    if (!calibration) {
      setStatus(text.tooFew(MIN_OBSERVATIONS))
      return
    }
    keep(calibration)
    setStatus(calibration.better ? text.fitted : text.noBetter)
  }
  const shifts = fit ? describeShifts(fit.personal, m) : []

  return (
    <section
      aria-labelledby="calibration-heading"
      className="border-line bg-panel rounded-xl border p-4"
    >
      <h2 id="calibration-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <p className="text-ink-muted max-w-prose text-sm">{text.intro}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className={buttonClass} onClick={run}>
          {fit ? text.fitAgain : text.fit}
        </button>
        <p role="status" className="text-ink-muted text-sm">
          {status || text.have(observations.length)}
        </p>
      </div>

      {fit && (
        <div className="border-line bg-surface mt-4 rounded-lg border p-3">
          <p className="text-ink-muted text-sm">
            {text.fittedAt(
              new Date(fit.fittedAt).toLocaleString(language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
              fit.used,
            )}
          </p>
          {shifts.length === 0 ? (
            <p className="mt-1 max-w-prose">{text.nothingMoved}</p>
          ) : (
            <ul className="mt-1 grid max-w-prose gap-1">
              {shifts.map((sentence) => (
                <li key={sentence}>{sentence}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 max-w-prose font-medium">
            {text.agreement(fit.before, fit.after, fit.total)}
          </p>
          {!fit.better && <p className="mt-1 max-w-prose">{text.noBetter}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <label
              className={`flex min-h-11 items-center gap-2 font-medium ${fit.better ? 'cursor-pointer' : 'text-ink-muted'}`}
            >
              <input
                type="checkbox"
                className="accent-accent size-5"
                checked={enabled}
                disabled={!fit.better}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              {text.use}
            </label>
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                clear()
                setStatus('')
              }}
            >
              {text.forget}
            </button>
          </div>
          <p className="text-ink-muted mt-2 max-w-prose text-sm">
            {enabled ? text.usingPersonal : text.usingBase}
          </p>
        </div>
      )}
      <p className="text-ink-muted mt-3 max-w-prose text-sm">{text.limits}</p>
    </section>
  )
}
