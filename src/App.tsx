import { useEffect, useSyncExternalStore } from 'react'
import { SegmentedControl } from './components/common/SegmentedControl.tsx'
import type { Language } from './i18n/index.ts'
import { useMessages } from './i18n/useMessages.ts'
import { TIERS, type ParameterTier, type UnitSystem } from './models/parameters.ts'
import { Demos } from './pages/demos/Demos.tsx'
import { isDemoHash } from './pages/demos/demoTabs.ts'
import { Roadmap } from './pages/roadmap/Roadmap.tsx'
import { Simulator } from './pages/Simulator.tsx'
import { useTuningStore } from './state/tuningStore.ts'

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const ROADMAP_HASH = '#roadmap'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
]

const UNITS = [
  { value: 'archery', label: 'lb, in, gr' },
  { value: 'metric', label: 'kg, cm, g' },
]

const linkClass =
  'focus-visible:outline-accent aria-[current=page]:border-ink text-ink-muted aria-[current=page]:text-ink flex min-h-11 items-center border-b-2 border-transparent px-1 font-medium focus-visible:outline-2'

function App() {
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash)
  // Anchors inside the roadmap page (#v0-1 and so on) keep that page open.
  const onRoadmap = hash === ROADMAP_HASH || /^#v\d/.test(hash)
  const onDemos = isDemoHash(hash)

  const m = useMessages()
  const language = useTuningStore((state) => state.language)
  const units = useTuningStore((state) => state.units)
  const mode = useTuningStore((state) => state.mode)
  const setMode = useTuningStore((state) => state.setMode)
  const setLanguage = useTuningStore((state) => state.setLanguage)
  const setUnits = useTuningStore((state) => state.setUnits)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <>
      <div className="border-line flex flex-wrap items-center justify-between gap-x-6 border-b px-4 sm:px-6 lg:px-8">
        <nav aria-label={m.nav.pages} className="flex gap-5">
          <a
            href="#"
            aria-current={onRoadmap || onDemos ? undefined : 'page'}
            className={linkClass}
          >
            {m.nav.simulator}
          </a>
          <a
            href={ROADMAP_HASH}
            aria-current={onRoadmap ? 'page' : undefined}
            className={linkClass}
          >
            {m.nav.roadmap}
          </a>
          <a href="#demo-v0-1" aria-current={onDemos ? 'page' : undefined} className={linkClass}>
            {m.nav.previews}
          </a>
        </nav>
        {/* The roadmap and the previews are written in Vietnamese only, and have no levels. */}
        {!onRoadmap && !onDemos && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1">
            <SegmentedControl
              label={m.nav.level}
              hideLabel
              options={TIERS.map((tier) => ({ value: tier, label: m.nav.levels[tier] }))}
              value={mode}
              onChange={(next) => setMode(next as ParameterTier)}
            />
            {/* Language and units are set once, so they wait behind one button. */}
            <details className="group relative">
              <summary className="border-line bg-surface focus-visible:outline-accent flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border px-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
                <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
                  <path
                    d="M3 6h9M16 6h1M3 14h1M8 14h9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle cx="14" cy="6" r="2" stroke="currentColor" strokeWidth="1.8" />
                  <circle cx="6" cy="14" r="2" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span className="sr-only sm:not-sr-only">{m.nav.settings}</span>
              </summary>
              <div className="border-line bg-paper absolute right-0 z-30 mt-1 grid w-max max-w-[calc(100vw-2rem)] gap-3 rounded-lg border p-3 shadow-lg">
                <SegmentedControl
                  label={m.nav.language}
                  options={LANGUAGES}
                  value={language}
                  onChange={(next) => setLanguage(next as Language)}
                />
                <SegmentedControl
                  label={m.nav.units}
                  options={UNITS}
                  value={units}
                  onChange={(next) => setUnits(next as UnitSystem)}
                />
              </div>
            </details>
          </div>
        )}
      </div>
      {onDemos ? <Demos hash={hash} /> : onRoadmap ? <Roadmap /> : <Simulator />}
    </>
  )
}

export default App
