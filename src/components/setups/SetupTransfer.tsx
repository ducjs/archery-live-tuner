import { useRef, useState } from 'react'
import { useMessages } from '../../i18n/useMessages.ts'
import type { TuningSetup } from '../../models/setup.ts'
import { useLibraryStore } from '../../state/libraryStore.ts'
import { useTuningStore } from '../../state/tuningStore.ts'
import {
  LINK_PARAMETER,
  exportSetups,
  importSetups,
  readSharedSetup,
  setupLink,
} from '../../utils/setupTransfer.ts'
import { buttonClass, inputClass } from '../common/styles.ts'

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** A link to the setup on screen, and a file of the saved setups to take elsewhere. */
export function SetupTransfer() {
  const m = useMessages()
  const text = m.transfer
  const setup = useTuningStore((state) => state.setup)
  const saved = useLibraryStore((state) => state.saved)
  const saveMany = useLibraryStore((state) => state.saveMany)
  const fileInput = useRef<HTMLInputElement>(null)

  // The link is shown as well as copied, for browsers that will not let a page copy.
  const [link, setLink] = useState<string | null>(null)
  const [linkStatus, setLinkStatus] = useState('')
  const [fileStatus, setFileStatus] = useState('')

  const share = () => {
    const address = setupLink({ ...setup, name: setup.name.trim() }, window.location)
    setLink(address)
    setLinkStatus('')
    navigator.clipboard
      ?.writeText(address)
      .then(() => setLinkStatus(text.copied))
      .catch(() => setLinkStatus(text.copyByHand))
    if (!navigator.clipboard) setLinkStatus(text.copyByHand)
  }

  // The setup on screen goes into the file too, saved or not.
  const toExport: TuningSetup[] = saved.some((entry) => entry.id === setup.id)
    ? saved
    : [...saved, { ...setup, name: setup.name.trim() }]

  const readFile = async (file: File) => {
    const result = importSetups(await file.text(), saved)
    if (!result) {
      setFileStatus(text.notAFile)
      return
    }
    if (result.added.length > 0) await saveMany(result.added)
    setFileStatus(text.imported(result.added.length, result.known, result.invalid))
  }

  return (
    <details className="mt-1">
      <summary className="focus-visible:outline-accent flex min-h-11 cursor-pointer items-center font-medium focus-visible:outline-2">
        {text.heading}
      </summary>
      <div className="grid gap-3">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button type="button" className={buttonClass} onClick={share}>
              {text.copyLink}
            </button>
            {linkStatus && (
              <span role="status" className="text-ink-muted text-sm">
                {linkStatus}
              </span>
            )}
          </div>
          {link && (
            <input
              type="text"
              readOnly
              aria-label={text.link}
              value={link}
              onFocus={(event) => event.target.select()}
              className={`${inputClass} text-sm`}
            />
          )}
          <p className="text-ink-muted max-w-prose text-sm">{text.linkNote}</p>
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                download(text.fileName, exportSetups(toExport))
                setFileStatus(text.exported(toExport.length))
              }}
            >
              {text.exportFile}
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => fileInput.current?.click()}
            >
              {text.importFile}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              aria-label={text.chooseFile}
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                const file = event.target.files?.[0]
                // Cleared, so choosing the same file again is still a change.
                event.target.value = ''
                if (file) void readFile(file)
              }}
            />
          </div>
          {fileStatus && (
            <p role="status" className="text-sm">
              {fileStatus}
            </p>
          )}
          <p className="text-ink-muted max-w-prose text-sm">{text.fileNote}</p>
        </div>
      </div>
    </details>
  )
}

/** Takes the setup out of the address, so a reload does not offer it again. */
function clearLink() {
  const url = new URL(window.location.href)
  url.searchParams.delete(LINK_PARAMETER)
  window.history.replaceState(null, '', url)
}

/**
 * Shown when the page was opened from a link that carries a setup. The setup
 * is offered, not opened: what is on screen may hold unsaved work.
 */
export function SharedSetupNotice() {
  const m = useMessages()
  const text = m.transfer
  const openSetup = useTuningStore((state) => state.openSetup)
  const [shared, setShared] = useState(() => readSharedSetup(window.location.search))

  if (shared === null) return null
  const close = () => {
    clearLink()
    setShared(null)
  }

  return (
    <div role="group" className="border-gold bg-gold/10 mt-4 rounded-md border-l-4 px-3 py-2">
      {shared === 'unreadable' ? (
        <p>{text.unreadable}</p>
      ) : (
        <>
          <p className="font-medium">{text.offered(shared.name)}</p>
          <p className="text-ink-muted max-w-prose text-sm">{text.replaces}</p>
        </>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {shared !== 'unreadable' && (
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              openSetup(shared)
              close()
            }}
          >
            {text.openShared}
          </button>
        )}
        <button type="button" className={buttonClass} onClick={close}>
          {shared === 'unreadable' ? text.dismiss : text.notNow}
        </button>
      </div>
    </div>
  )
}
