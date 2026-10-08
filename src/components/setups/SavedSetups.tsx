import { useId, useState } from 'react'
import { useMessages } from '../../i18n/useMessages.ts'
import {
  formatValue,
  getParameter,
  getValue,
  modifiedParameters,
  type NumberParameter,
} from '../../models/parameters.ts'
import { createDefaultSetup, sameSetup, type TuningSetup } from '../../models/setup.ts'
import { useLibraryStore } from '../../state/libraryStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import { buttonClass, inputClass } from '../common/styles.ts'
import { SetupTransfer } from './SetupTransfer.tsx'

// The values an archer would recognise a setup by.
const SUMMARY = ['bow.drawWeight', 'arrow.spine', 'arrow.pointWeight'].map(
  (key) => getParameter(key) as NumberParameter,
)

/** A step that needs a second press or more input before it happens. */
type Pending =
  | { kind: 'new' }
  | { kind: 'open' | 'remove'; id: string }
  | { kind: 'rename'; id: string; name: string }

type Props = {
  /** Shows a saved setup next to the one on screen. */
  onCompare: (id: string) => void
}

export function SavedSetups({ onCompare }: Props) {
  const m = useMessages()
  const text = m.setups
  const nameId = useId()

  const setup = useTuningStore((state) => state.setup)
  const units = useTuningStore((state) => state.units)
  const setName = useTuningStore((state) => state.setName)
  const openSetup = useTuningStore((state) => state.openSetup)
  const saved = useLibraryStore((state) => state.saved)
  const failed = useLibraryStore((state) => state.failed)
  const save = useLibraryStore((state) => state.save)
  const remove = useLibraryStore((state) => state.remove)

  // Text being typed. Kept apart so the setup never ends up with an empty name.
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  // The saved setups and what is done with them are one press away, in every workspace.
  const [menuOpen, setMenuOpen] = useState(false)

  const stored = saved.find((entry) => entry.id === setup.id)
  // Something on screen would be lost if another setup replaced it.
  const unsaved = stored ? !sameSetup(stored, setup) : modifiedParameters(setup).length > 0
  const status = !stored ? text.notSaved : unsaved ? text.changed : text.saved

  const trimmed = { ...setup, name: setup.name.trim() }
  const saveAsNew = () => {
    const copy = { ...trimmed, id: crypto.randomUUID(), name: text.copyName(trimmed.name) }
    openSetup(copy)
    void save(copy)
  }
  const open = (entry: TuningSetup) => {
    openSetup(entry)
    setNameDraft(null)
    setPending(null)
  }
  const startNew = () => open(createDefaultSetup(text.defaultName))
  const rename = (entry: TuningSetup, name: string) => {
    if (name.trim() === '') return
    void save({ ...entry, name: name.trim() })
    if (entry.id === setup.id) setName(name.trim())
    setPending(null)
  }

  const cancel = (
    <button type="button" className={buttonClass} onClick={() => setPending(null)}>
      {text.cancel}
    </button>
  )

  return (
    <section aria-labelledby={`${nameId}-heading`} className="border-line border-b pb-3">
      <h2 id={`${nameId}-heading`} className="sr-only">
        {text.heading}
      </h2>

      {/* The setup on screen: its name, whether it is saved, and the way to the others. */}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={nameId} className="sr-only">
          {text.name}
        </label>
        <input
          id={nameId}
          type="text"
          maxLength={100}
          value={nameDraft ?? setup.name}
          onChange={(event) => {
            setNameDraft(event.target.value)
            if (event.target.value.trim() !== '') setName(event.target.value)
          }}
          onBlur={() => setNameDraft(null)}
          className={`${inputClass} max-w-xs min-w-0 flex-1 basis-24 font-semibold`}
        />
        <span role="status" className="text-ink-muted mr-auto text-sm">
          {status}
        </span>
        <button
          type="button"
          className={buttonClass}
          disabled={Boolean(stored) && !unsaved}
          onClick={() => void save(trimmed)}
        >
          {text.save}
        </button>
        <button
          type="button"
          className={buttonClass}
          aria-expanded={menuOpen}
          aria-controls={`${nameId}-menu`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {text.menu} ({saved.length})
        </button>
      </div>

      {failed && (
        <p role="alert" className="border-accent mt-3 rounded-md border-l-4 px-3 py-2">
          {text.storageError}
        </p>
      )}

      <div id={`${nameId}-menu`} hidden={!menuOpen} className="mt-3 max-w-3xl">
        <div className="flex flex-wrap gap-2">
          {stored && (
            <button type="button" className={buttonClass} onClick={saveAsNew}>
              {text.saveAsNew}
            </button>
          )}
          <button
            type="button"
            className={buttonClass}
            onClick={() => (unsaved ? setPending({ kind: 'new' }) : startNew())}
          >
            {text.startNew}
          </button>
        </div>

        {pending?.kind === 'new' && (
          <div role="group" className="border-gold bg-gold/10 mt-3 rounded-md border-l-4 px-3 py-2">
            <p>{text.discardQuestion}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={buttonClass} onClick={startNew}>
                {text.discard}
              </button>
              {cancel}
            </div>
          </div>
        )}

        <div className="mt-3">
          <h3 className="font-medium">{text.list(saved.length)}</h3>
          {saved.length === 0 ? (
            <p className="text-ink-muted max-w-prose">{text.empty}</p>
          ) : (
            <ul className="grid gap-2">
              {saved.map((entry) => {
                const isOpen = entry.id === setup.id
                const mine = pending && 'id' in pending && pending.id === entry.id ? pending : null
                const action = (label: string) => text.rowAction(label, entry.name)
                return (
                  <li key={entry.id} className="border-line bg-surface rounded-lg border p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 font-semibold break-words">{entry.name}</p>
                      {isOpen && (
                        <span className="text-ink-muted text-sm whitespace-nowrap">
                          {text.openNow}
                        </span>
                      )}
                    </div>
                    <p className="text-ink-muted text-sm">
                      {SUMMARY.map(
                        (parameter) =>
                          `${m.parameter[parameter.key]?.label ?? parameter.label} ${formatValue(parameter, getValue(entry, parameter), units)}`,
                      ).join(', ')}
                    </p>

                    {mine?.kind === 'rename' ? (
                      <form
                        className="mt-2 flex flex-wrap gap-2"
                        onSubmit={(event) => {
                          event.preventDefault()
                          rename(entry, mine.name)
                        }}
                      >
                        <input
                          type="text"
                          autoFocus
                          maxLength={100}
                          aria-label={text.newName(entry.name)}
                          value={mine.name}
                          onChange={(event) => setPending({ ...mine, name: event.target.value })}
                          className={`${inputClass} flex-1`}
                        />
                        <button type="submit" className={buttonClass}>
                          {text.done}
                        </button>
                        {cancel}
                      </form>
                    ) : mine ? (
                      <div role="group" className="mt-2">
                        <p>
                          {mine.kind === 'remove'
                            ? text.removeQuestion(entry.name)
                            : text.discardQuestion}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={buttonClass}
                            onClick={() => {
                              if (mine.kind === 'remove') {
                                void remove(entry.id)
                                setPending(null)
                              } else open(entry)
                            }}
                          >
                            {mine.kind === 'remove' ? text.remove : text.discard}
                          </button>
                          {cancel}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={buttonClass}
                          aria-label={action(text.open)}
                          disabled={isOpen && !unsaved}
                          onClick={() =>
                            unsaved ? setPending({ kind: 'open', id: entry.id }) : open(entry)
                          }
                        >
                          {text.open}
                        </button>
                        <button
                          type="button"
                          className={buttonClass}
                          aria-label={action(text.compare)}
                          onClick={() => onCompare(entry.id)}
                        >
                          {text.compare}
                        </button>
                        <button
                          type="button"
                          className={buttonClass}
                          aria-label={action(text.rename)}
                          onClick={() =>
                            setPending({ kind: 'rename', id: entry.id, name: entry.name })
                          }
                        >
                          {text.rename}
                        </button>
                        <button
                          type="button"
                          className={buttonClass}
                          aria-label={action(text.remove)}
                          onClick={() => setPending({ kind: 'remove', id: entry.id })}
                        >
                          {text.remove}
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <p className="text-ink-muted mt-2 text-sm">{text.localOnly}</p>
        </div>
        <SetupTransfer />
      </div>
    </section>
  )
}
