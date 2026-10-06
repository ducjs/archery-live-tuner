import { Component, Suspense, lazy, type ReactNode } from 'react'
import { useMessages } from '../../i18n/useMessages.ts'
import type { ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'
import type { UnitSystem } from '../../models/parameters.ts'
import { PRESETS } from './cameraShots.ts'
import type { BowViewerState } from './useBowViewer.ts'

// three.js is large, so it is fetched only when the viewer is shown.
const BowScene = lazy(() => import('./BowScene.tsx'))

const AMPLIFY = 6

const buttonClass =
  'border-line bg-surface focus-visible:outline-accent aria-pressed:bg-ink aria-pressed:text-surface min-h-11 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2'

type BoundaryProps = { children: ReactNode; fallback: ReactNode }

class SceneBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Whether this browser can draw 3D at all. Asked once: it does not change while the page is open. */
let webgl: boolean | undefined
function hasWebGL(): boolean {
  if (webgl === undefined) {
    try {
      const canvas = document.createElement('canvas')
      webgl = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
    } catch {
      webgl = false
    }
  }
  return webgl
}

type BowViewerProps = {
  bow: BowSetup
  arrow: ArrowSetup
  viewer: BowViewerState
  units: UnitSystem
  /** Shown in place of the 3D view where it cannot run: the flat drawings of the simulator. */
  fallback: ReactNode
}

export function BowViewer({ bow, arrow, viewer, units, fallback }: BowViewerProps) {
  const m = useMessages()
  const flat = (
    <div className="grid gap-2">
      <p role="status" className="border-gold bg-gold/10 rounded-md border-l-4 px-3 py-2">
        {m.viewer.failed}
      </p>
      {fallback}
    </div>
  )
  if (!hasWebGL()) return flat
  return (
    <div className="border-line bg-surface h-[46vh] min-h-64 overflow-hidden rounded-lg border lg:h-[54vh]">
      <SceneBoundary fallback={<div className="p-3">{flat}</div>}>
        <Suspense fallback={<p className="text-ink-muted p-4">{m.viewer.loading}</p>}>
          <BowScene
            bow={bow}
            arrow={arrow}
            amplify={viewer.amplified ? AMPLIFY : 1}
            drawn={viewer.drawn}
            focus={viewer.focus}
            focusRequest={viewer.focusRequest}
            units={units}
          />
        </Suspense>
      </SceneBoundary>
    </div>
  )
}

export function BowViewerControls({ viewer }: { viewer: BowViewerState }) {
  const m = useMessages()
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label={m.viewer.lookAt}>
          {PRESETS.map((focus) => (
            <button
              key={focus}
              type="button"
              onClick={() => viewer.lookAt(focus)}
              aria-pressed={viewer.focus === focus}
              className={buttonClass}
            >
              {m.viewer.focus[focus]}
            </button>
          ))}
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={viewer.amplified}
            onChange={(event) => viewer.setAmplified(event.target.checked)}
            className="accent-accent focus-visible:outline-accent size-5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          {m.viewer.amplify(AMPLIFY)}
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={viewer.drawn}
            onChange={(event) => viewer.setDrawn(event.target.checked)}
            className="accent-accent focus-visible:outline-accent size-5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          {m.viewer.drawn}
        </label>
      </div>
      <p className="text-ink-muted max-w-prose text-sm">{m.viewer.about}</p>
      <p className="text-ink-muted max-w-prose text-sm">{m.viewer.notDrawn}</p>
    </div>
  )
}
