import { useEffect, useState } from 'react'
import { SavedSetups } from '../components/setups/SavedSetups.tsx'
import { SharedSetupNotice } from '../components/setups/SetupTransfer.tsx'
import { useMessages } from '../i18n/useMessages.ts'
import { tierShows } from '../models/parameters.ts'
import { useLibraryStore } from '../state/libraryStore.ts'
import { WORKSPACES, WORKSPACE_TIER, useTuningStore, type Workspace } from '../state/tuningStore.ts'
import { AnalysisWorkspace } from './workspaces/AnalysisWorkspace.tsx'
import { SetupWorkspace } from './workspaces/SetupWorkspace.tsx'
import { SimulateWorkspace } from './workspaces/SimulateWorkspace.tsx'
import { TargetWorkspace } from './workspaces/TargetWorkspace.tsx'

/** The workspace an address asks for. `#3d` is the older address of the 3D bow, now part of Setup. */
function workspaceOf(hash: string): Workspace | null {
  const name = hash.replace(/^#/, '')
  if (name === '3d') return 'setup'
  return WORKSPACES.find((workspace) => workspace === name) ?? null
}

export function Simulator() {
  const m = useMessages()
  const mode = useTuningStore((state) => state.mode)
  const stored = useTuningStore((state) => state.workspace)
  const setWorkspace = useTuningStore((state) => state.setWorkspace)
  const setBow3d = useTuningStore((state) => state.setBow3d)
  const loadSaved = useLibraryStore((state) => state.load)
  // The saved setups picked for the comparison. Kept here: the setup menu sets them too.
  const [chosenIds, setChosenIds] = useState<string[]>([])

  useEffect(() => {
    void loadSaved()
  }, [loadSaved])

  // An address that names a workspace opens it, on arrival and on back and forward.
  useEffect(() => {
    const follow = () => {
      const asked = workspaceOf(window.location.hash)
      if (!asked) return
      setWorkspace(asked)
      if (window.location.hash === '#3d') setBow3d(true)
    }
    follow()
    window.addEventListener('hashchange', follow)
    return () => window.removeEventListener('hashchange', follow)
  }, [setWorkspace, setBow3d])

  // A workspace above the level is not on offer; the level may have been lowered since.
  const offered = WORKSPACES.filter((workspace) => tierShows(mode, WORKSPACE_TIER[workspace]))
  const workspace = offered.includes(stored) ? stored : 'setup'
  const open = (next: Workspace) => {
    setWorkspace(next)
    window.history.pushState(null, '', `#${next}`)
  }

  return (
    // On a phone the workspaces are a bar at the foot of the screen: leave it room.
    <main className="px-4 pt-3 pb-28 sm:px-6 lg:px-8 lg:pb-12">
      <h1 className="sr-only">{m.simulator.title}</h1>
      <nav
        aria-label={m.nav.workspaces}
        className="border-line bg-paper fixed inset-x-0 bottom-0 z-20 grid auto-cols-fr grid-flow-col border-t px-2 pb-[env(safe-area-inset-bottom)] lg:static lg:flex lg:gap-1 lg:border-t-0 lg:border-b lg:p-0"
      >
        {offered.map((name) => (
          <a
            key={name}
            href={`#${name}`}
            aria-current={workspace === name ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault()
              open(name)
            }}
            className="text-ink-muted aria-[current=page]:border-accent aria-[current=page]:bg-panel aria-[current=page]:text-ink focus-visible:outline-accent font-display flex min-h-13 items-center justify-center border-t-2 border-transparent px-4 text-lg font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 lg:-mb-px lg:min-h-11 lg:rounded-t-lg lg:border-t-0 lg:border-b-2 lg:px-5"
          >
            {m.nav.workspace[name]}
          </a>
        ))}
      </nav>

      <div className="mt-3">
        <SavedSetups
          onCompare={(id) => {
            setChosenIds([id])
            open('analysis')
          }}
        />
      </div>
      <SharedSetupNotice />

      <div className="mt-4">
        {workspace === 'setup' ? (
          <SetupWorkspace />
        ) : workspace === 'fly' ? (
          <SimulateWorkspace />
        ) : workspace === 'target' ? (
          <TargetWorkspace />
        ) : (
          <AnalysisWorkspace chosenIds={chosenIds} onChosenIdsChange={setChosenIds} />
        )}
      </div>

      <footer className="border-line text-ink-muted mt-10 grid max-w-prose gap-1 border-t pt-4 text-sm">
        <p>{m.simulator.disclaimer}</p>
        {workspace !== 'target' && <p>{m.simulator.modelOnly}</p>}
      </footer>
    </main>
  )
}
