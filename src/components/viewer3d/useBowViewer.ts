import { useEffect, useRef, useState } from 'react'
import type { BowSetup } from '../../models/bow.ts'
import type { Focus } from './BowScene.tsx'

export type BowViewerState = {
  focus: Focus
  /** Goes up each time the camera should fly to `focus`, even if it is unchanged. */
  focusRequest: number
  amplified: boolean
  /** The bow is shown at full draw instead of at brace height. */
  drawn: boolean
  lookAt: (focus: Focus) => void
  setAmplified: (amplified: boolean) => void
  setDrawn: (drawn: boolean) => void
}

/** Viewer state, plus the rule that changing a value flies the camera to the part it moves. */
export function useBowViewer(bow: BowSetup): BowViewerState {
  const [view, setView] = useState<{ focus: Focus; request: number }>({ focus: 'bow', request: 0 })
  const [amplified, setAmplified] = useState(true)
  const [drawn, setDrawn] = useState(false)

  const lookAt = (focus: Focus) => setView((current) => ({ focus, request: current.request + 1 }))

  const previous = useRef({ centerShot: bow.centerShot, nockingPoint: bow.nockingPointHeight })
  useEffect(() => {
    const last = previous.current
    if (bow.centerShot !== last.centerShot) lookAt('centerShot')
    else if (bow.nockingPointHeight !== last.nockingPoint) lookAt('nockingPoint')
    previous.current = { centerShot: bow.centerShot, nockingPoint: bow.nockingPointHeight }
  }, [bow.centerShot, bow.nockingPointHeight])

  return {
    focus: view.focus,
    focusRequest: view.request,
    amplified,
    drawn,
    lookAt,
    setAmplified,
    setDrawn,
  }
}
