import { useSyncExternalStore } from 'react'
import { Demos } from './pages/demos/Demos.tsx'
import { isDemoHash } from './pages/demos/demoTabs.ts'
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
  const onDemos = isDemoHash(hash)

  return (
    <>
      <nav aria-label="Pages" className="border-line flex gap-5 border-b px-4 sm:px-6 lg:px-8">
        <a href="#" aria-current={onRoadmap || onDemos ? undefined : 'page'} className={linkClass}>
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
        <a
          href="#demo-v0-1"
          lang="vi"
          aria-current={onDemos ? 'page' : undefined}
          className={linkClass}
        >
          Xem trước
        </a>
      </nav>
      {onDemos ? <Demos hash={hash} /> : onRoadmap ? <Roadmap /> : <Simulator />}
    </>
  )
}

export default App
