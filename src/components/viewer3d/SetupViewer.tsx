import { Component, Suspense, lazy, type ReactNode } from 'react'
import type { ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'
import type { Focus } from './BowScene.tsx'
import type { BowViewerState } from './useBowViewer.ts'

// three.js is large, so it is fetched only when the viewer is shown.
const BowScene = lazy(() => import('./BowScene.tsx'))

const AMPLIFY = 6

const FOCUS_BUTTONS: { focus: Focus; label: string }[] = [
  { focus: 'bow', label: 'Whole bow' },
  { focus: 'centerShot', label: 'Center shot' },
  { focus: 'nockingPoint', label: 'Nocking point' },
]

const buttonClass =
  'border-line bg-surface focus-visible:outline-accent aria-pressed:bg-ink aria-pressed:text-surface min-h-11 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2'

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="p-4">
          The 3D view could not start. It needs WebGL, which this browser or device has turned off.
          The arrow flight views work without it.
        </p>
      )
    }
    return this.props.children
  }
}

type BowViewerProps = {
  bow: BowSetup
  arrow: ArrowSetup
  viewer: BowViewerState
}

export function BowViewer({ bow, arrow, viewer }: BowViewerProps) {
  return (
    <div className="border-line bg-surface h-[38vh] min-h-56 overflow-hidden rounded-lg border lg:h-[54vh]">
      <SceneBoundary>
        <Suspense fallback={<p className="text-ink-muted p-4">Loading the 3D view.</p>}>
          <BowScene
            bow={bow}
            arrow={arrow}
            amplify={viewer.amplified ? AMPLIFY : 1}
            focus={viewer.focus}
            focusRequest={viewer.focusRequest}
          />
        </Suspense>
      </SceneBoundary>
    </div>
  )
}

export function BowViewerControls({ viewer }: { viewer: BowViewerState }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Look at">
          {FOCUS_BUTTONS.map(({ focus, label }) => (
            <button
              key={focus}
              type="button"
              onClick={() => viewer.lookAt(focus)}
              aria-pressed={viewer.focus === focus}
              className={buttonClass}
            >
              {label}
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
          Draw offsets {AMPLIFY} times larger
        </label>
      </div>
      <p className="text-ink-muted max-w-prose text-sm">
        Preview: only center shot and nocking point height move the model so far. Change either one
        and the camera goes to it. Drag to turn the bow, scroll or pinch to zoom. The dashed gold
        line is the string line from above and the line square to the string from the side. Labels
        show real values; the bow is a simplified shape, not your equipment.
      </p>
    </div>
  )
}
