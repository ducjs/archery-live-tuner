import { useEffect, useMemo, useState } from 'react'
import { compareObservation, heuristicModel } from '../../engine/index.ts'
import type { Messages } from '../../i18n/index.ts'
import { useMessages } from '../../i18n/useMessages.ts'
import { SEEN_KEYS, type Observation, type Seen } from '../../models/observation.ts'
import type { TuningSetup } from '../../models/setup.ts'
import { useObservationStore } from '../../state/observationStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { createObservation, exportObservations } from '../../utils/observations.ts'
import { buttonClass, inputClass } from '../common/styles.ts'

/** What can be noted for each thing, in the order it is offered. */
const CHOICES: { [Key in keyof Seen]-?: readonly NonNullable<Seen[Key]>[] } = {
  stiffness: ['WEAK', 'NEUTRAL', 'STIFF'],
  bareHorizontal: ['LEFT', 'TOGETHER', 'RIGHT'],
  bareVertical: ['HIGH', 'TOGETHER', 'LOW'],
  lateral: ['LEFT', 'NEUTRAL', 'RIGHT'],
  oscillation: ['LOW', 'MEDIUM', 'HIGH'],
  clearance: ['LOW', 'MEDIUM', 'HIGH'],
}

function word(m: Messages, key: keyof Seen, value: string): string {
  return (m.observation.values[key] as Record<string, string>)[value] ?? value
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** A form for what the archer saw, without a target to read it from. */
function ObservationForm({ setup }: { setup: TuningSetup }) {
  const m = useMessages()
  const text = m.observation
  const save = useObservationStore((state) => state.save)
  const [seen, setSeen] = useState<Seen>({})
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const empty = Object.keys(seen).length === 0 && notes.trim() === ''

  return (
    <form
      className="mt-3 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (empty) return
        void save(createObservation(setup, seen, { notes }))
        setSeen({})
        setNotes('')
        setStatus(text.saved)
      }}
    >
      <div className="grid gap-x-6 gap-y-3 @lg:grid-cols-2">
        {SEEN_KEYS.map((key) => (
          <label key={key} className="grid gap-1">
            <span className="font-medium">{text.labels[key]}</span>
            <select
              className={inputClass}
              value={seen[key] ?? ''}
              onChange={(event) => {
                setStatus('')
                setSeen((current) => {
                  const { [key]: _dropped, ...rest } = current
                  return event.target.value === '' ? rest : { ...rest, [key]: event.target.value }
                })
              }}
            >
              <option value="">{text.notNoted}</option>
              {CHOICES[key].map((value) => (
                <option key={value} value={value}>
                  {word(m, key, value)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className="grid gap-1">
        <span className="font-medium">{text.notes}</span>
        <textarea
          className={`${inputClass} py-2`}
          rows={2}
          maxLength={2000}
          value={notes}
          onChange={(event) => {
            setStatus('')
            setNotes(event.target.value)
          }}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={buttonClass} disabled={empty}>
          {text.save}
        </button>
        <p role="status" className="text-ink-muted text-sm">
          {status || (empty ? text.saveHint : '')}
        </p>
      </div>
    </form>
  )
}

/** One stored observation: what was seen, beside what the model says of the same values. */
function ObservationCard({ observation }: { observation: Observation }) {
  const m = useMessages()
  const text = m.observation
  const language = useTuningStore((state) => state.language)
  const remove = useObservationStore((state) => state.remove)
  const { rows, matches } = useMemo(
    () => compareObservation(observation, heuristicModel),
    [observation],
  )
  const when = new Date(observation.createdAt).toLocaleString(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <li className="border-line bg-surface rounded-lg border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-semibold">{when}</p>
        <p className="text-ink-muted text-sm">
          {observation.plot
            ? text.fromTarget((observation.plot.distance / 1000).toFixed(0))
            : text.byHand}
        </p>
      </div>
      {rows.length > 0 && (
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-ink-muted text-sm">
              <th scope="col" className="py-1 pr-2 font-normal">
                <span className="sr-only">{text.what}</span>
              </th>
              <th scope="col" className="py-1 pr-2 font-normal">
                {text.seenColumn}
              </th>
              <th scope="col" className="py-1 font-normal">
                {text.modelColumn}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-line border-t align-baseline">
                <th scope="row" className="text-ink-muted py-1.5 pr-2 font-normal">
                  {text.labels[row.key]}
                </th>
                <td className="py-1.5 pr-2 font-semibold">{word(m, row.key, row.seen)}</td>
                <td className="py-1.5">
                  {word(m, row.key, row.model)}{' '}
                  {/* Said in words too, so it does not rest on the mark alone. */}
                  <span className={row.match ? 'text-ink-muted' : 'font-semibold'}>
                    {row.match ? text.same : text.differs}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {observation.notes && <p className="mt-2 max-w-prose">{observation.notes}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-muted text-sm">
          {rows.length > 0 && text.agrees(matches, rows.length)}
        </p>
        <button
          type="button"
          className={buttonClass}
          aria-label={text.removeLabel(when)}
          onClick={() => void remove(observation.id)}
        >
          {text.remove}
        </button>
      </div>
    </li>
  )
}

/**
 * Real-world observations of the setup on screen: a form to note one, the ones
 * already kept with the model beside them, and a file of all of them.
 */
export function ObservationPanel({ setup }: { setup: TuningSetup }) {
  const text = useMessages().observation
  const observations = useObservationStore((state) => state.observations)
  const failed = useObservationStore((state) => state.failed)
  const load = useObservationStore((state) => state.load)
  const [exported, setExported] = useState('')

  useEffect(() => {
    void load()
  }, [load])

  // Newest first: the last session is the one being looked at.
  const mine = observations.filter((observation) => observation.setupId === setup.id).reverse()

  return (
    <section
      aria-labelledby="observations-heading"
      className="border-line @container border-t pt-4"
    >
      <h2 id="observations-heading" className="font-display text-xl font-semibold">
        {text.heading}
      </h2>
      <p className="text-ink-muted max-w-prose text-sm">{text.intro}</p>
      {failed && (
        <p
          role="alert"
          className="border-weak bg-weak/10 mt-3 max-w-prose rounded-md border-l-4 px-3 py-2"
        >
          {text.failed}
        </p>
      )}

      <h3 className="mt-4 font-semibold">{text.formHeading}</h3>
      <ObservationForm setup={setup} />

      <h3 className="mt-5 font-semibold">{text.listHeading(mine.length)}</h3>
      {mine.length === 0 ? (
        <p className="mt-1 max-w-prose">{text.none}</p>
      ) : (
        <ul className="mt-2 grid gap-3">
          {mine.map((observation) => (
            <ObservationCard key={observation.id} observation={observation} />
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={buttonClass}
          disabled={observations.length === 0}
          onClick={() => {
            download(text.fileName, exportObservations(observations))
            setExported(text.exported(observations.length))
          }}
        >
          {text.export}
        </button>
        <p role="status" className="text-ink-muted text-sm">
          {exported || text.exportHint(observations.length)}
        </p>
      </div>
    </section>
  )
}
