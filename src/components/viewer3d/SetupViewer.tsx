import { Component, Suspense, lazy, type ReactNode } from 'react'
import { useMessages } from '../../i18n/useMessages.ts'
import type { ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'
import type { Focus } from './BowScene.tsx'
import type { BowViewerState } from './useBowViewer.ts'

// three.js is large, so it is fetched only when the viewer is shown.
const BowScene = lazy(() => import('./BowScene.tsx'))

const AMPLIFY = 6

const FOCUSES: Focus[] = ['bow', 'centerShot', 'nockingPoint']

const buttonClass =
  'border-line bg-surface focus-visible:outline-accent aria-pressed:bg-ink aria-pressed:text-surface min-h-11 cursor-pointer rounded-md border px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2'

type BoundaryProps = { children: ReactNode; message: string }

class SceneBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return <p className="p-4">{this.props.message}</p>
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
  const m = useMessages()
  return (
    <div className="border-line bg-surface h-[38vh] min-h-56 overflow-hidden rounded-lg border lg:h-[54vh]">
      <SceneBoundary message={m.viewer.failed}>
        <Suspense fallback={<p className="text-ink-muted p-4">{m.viewer.loading}</p>}>
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
  const m = useMessages()
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label={m.viewer.lookAt}>
          {FOCUSES.map((focus) => (
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
      </div>
      <p className="text-ink-muted max-w-prose text-sm">{m.viewer.about}</p>
    </div>
  )
}
