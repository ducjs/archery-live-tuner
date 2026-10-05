import { useSyncExternalStore } from 'react'
import { Roadmap } from './pages/roadmap/Roadmap.tsx'
import { Simulator } from './pages/Simulator.tsx'

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const ROADMAP_HASH = '#roadmap'

const linkClass =
  'focus-visible:outline-accent aria-[current=page]:border-ink text-ink-muted aria-[current=page]:text-ink flex min-h-11 items-center border-b-2 border-transparent px-1 font-medium focus-visible:outline-2'

function App() {
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash)
  // Anchors inside the roadmap page (#v0-1 and so on) keep that page open.
  const onRoadmap = hash === ROADMAP_HASH || /^#v\d/.test(hash)

  return (
    <>
      <nav aria-label="Pages" className="border-line flex gap-5 border-b px-4 sm:px-6 lg:px-8">
        <a href="#" aria-current={onRoadmap ? undefined : 'page'} className={linkClass}>
          Simulator
        </a>
        <a
          href={ROADMAP_HASH}
          lang="vi"
          aria-current={onRoadmap ? 'page' : undefined}
          className={linkClass}
        >
          Lộ trình
        </a>
      </nav>
      {onRoadmap ? <Roadmap /> : <Simulator />}
    </>
  )
}

export default App
