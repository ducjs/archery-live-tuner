import { Suspense, lazy, useEffect, useRef, useSyncExternalStore } from 'react'
import { SegmentedControl } from './components/common/SegmentedControl.tsx'
import type { Language } from './i18n/index.ts'
import { useMessages } from './i18n/useMessages.ts'
import { TIERS, type ParameterTier, type UnitSystem } from './models/parameters.ts'
import { isDemoHash } from './pages/demos/demoTabs.ts'
import { Simulator } from './pages/Simulator.tsx'
import { useTuningStore } from './state/tuningStore.ts'

// The pages beside the simulator are fetched when they are opened: most visits
// never leave the simulator, and a slow phone should not pay for the rest.
const Demos = lazy(() =>
  import('./pages/demos/Demos.tsx').then((page) => ({ default: page.Demos })),
)
const Guide = lazy(() =>
  import('./pages/guide/Guide.tsx').then((page) => ({ default: page.Guide })),
)
const HowItWorks = lazy(() =>
  import('./pages/how/HowItWorks.tsx').then((page) => ({ default: page.HowItWorks })),
)
const Privacy = lazy(() =>
  import('./pages/privacy/Privacy.tsx').then((page) => ({ default: page.Privacy })),
)
const Roadmap = lazy(() =>
  import('./pages/roadmap/Roadmap.tsx').then((page) => ({ default: page.Roadmap })),
)

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const ROADMAP_HASH = '#roadmap'
const HOW_HASH = '#how'
const GUIDE_HASH = '#guide'
const PRIVACY_HASH = '#privacy'

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

const footerLinkClass =
  'focus-visible:outline-accent aria-[current=page]:text-ink flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2'

function App() {
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash)
  // Anchors inside the roadmap page (#v0-1 and so on) keep that page open.
  const onRoadmap = hash === ROADMAP_HASH || /^#v\d/.test(hash)
  const onDemos = isDemoHash(hash)
  const onHow = hash === HOW_HASH
  // The pages beside the simulator are written in Vietnamese only, and have no levels.
  const onGuide = hash === GUIDE_HASH
  const onPrivacy = hash === PRIVACY_HASH
  const beside = onRoadmap || onDemos || onHow || onGuide || onPrivacy

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

  // The settings close like a menu: on Escape, and on a press anywhere else.
  const settings = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const close = (refocus: boolean) => {
      const menu = settings.current
      if (!menu?.open) return
      menu.open = false
      if (refocus) menu.querySelector('summary')?.focus()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true)
    }
    const onPress = (event: PointerEvent) => {
      if (!settings.current?.contains(event.target as Node)) close(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPress)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPress)
    }
  }, [])

  /** Takes a keyboard past the bars at the top, straight to the page. */
  const skipToContent = () => {
    const main = document.querySelector('main')
    if (!main) return
    main.tabIndex = -1
    main.focus()
  }

  return (
    <>
      <button
        type="button"
        onClick={skipToContent}
        className="bg-ink text-surface focus-visible:outline-accent sr-only z-50 rounded-md px-4 py-2 font-medium focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {m.nav.skip}
      </button>
      <div className="border-line flex flex-wrap items-center justify-between gap-x-6 border-b px-4 sm:px-6 lg:px-8">
        <nav
          aria-label={m.nav.pages}
          className="flex max-w-full gap-x-5 overflow-x-auto whitespace-nowrap"
        >
          <a href="#" aria-current={beside ? undefined : 'page'} className={linkClass}>
            {m.nav.simulator}
          </a>
          <a href={GUIDE_HASH} aria-current={onGuide ? 'page' : undefined} className={linkClass}>
            {m.nav.guide}
          </a>
          <a href={HOW_HASH} aria-current={onHow ? 'page' : undefined} className={linkClass}>
            {m.nav.how}
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
        {!beside && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1">
            <SegmentedControl
              label={m.nav.level}
              hideLabel
              options={TIERS.map((tier) => ({ value: tier, label: m.nav.levels[tier] }))}
              value={mode}
              onChange={(next) => setMode(next as ParameterTier)}
            />
            {/* Language and units are set once, so they wait behind one button. */}
            <details ref={settings} className="group relative">
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
      <Suspense
        fallback={<p className="text-ink-muted px-4 py-6 sm:px-6 lg:px-8">{m.nav.loading}</p>}
      >
        {onDemos ? (
          <Demos hash={hash} />
        ) : onRoadmap ? (
          <Roadmap />
        ) : onHow ? (
          <HowItWorks />
        ) : onGuide ? (
          <Guide />
        ) : onPrivacy ? (
          <Privacy />
        ) : (
          <Simulator />
        )}
      </Suspense>
      {/* On a phone the simulator has its workspaces at the foot of the screen: stay clear of them. */}
      <footer className="border-line text-ink-muted flex flex-wrap gap-x-5 border-t px-4 pb-24 text-sm sm:px-6 lg:px-8 lg:pb-2">
        <a
          href={PRIVACY_HASH}
          aria-current={onPrivacy ? 'page' : undefined}
          className={footerLinkClass}
        >
          {m.nav.privacy}
        </a>
      </footer>
    </>
  )
}

export default App
