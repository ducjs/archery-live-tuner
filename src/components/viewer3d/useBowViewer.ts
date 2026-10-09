import { useEffect, useRef, useState } from 'react'
import type { ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'
import { PARAMETERS, getValue } from '../../models/parameters.ts'
import { EQUIPMENT, focusOf, type Focus } from './cameraShots.ts'

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

type Values = { bow: BowSetup; arrow: ArrowSetup }

/** The values that have something to show on the bow, as one comparable list. */
const WATCHED = PARAMETERS.filter((parameter) => focusOf(parameter.key) !== null)
const snapshot = (setup: Values) => WATCHED.map((parameter) => getValue(setup, parameter))

/** Viewer state, plus the rule that changing a value flies the camera to the part it moves. */
export function useBowViewer(setup: Values): BowViewerState {
  const [view, setView] = useState<{ focus: Focus; request: number }>({ focus: 'bow', request: 0 })
  // True scale at first; the larger offsets are there to be asked for.
  const [amplified, setAmplified] = useState(false)
  const [drawn, setDrawn] = useState(false)

  const lookAt = (focus: Focus) => setView((current) => ({ focus, request: current.request + 1 }))

  const { bow, arrow } = setup
  const previous = useRef(snapshot(setup))
  useEffect(() => {
    const now = snapshot({ bow, arrow })
    const changed = WATCHED.filter((_, index) => now[index] !== previous.current[index])
    previous.current = now
    // One value changed: a slider was moved. Several at once is another setup
    // being opened, which is no reason to move the camera.
    if (changed.length !== 1) return
    const key = changed[0]!.key
    const shot = focusOf(key)!
    const ownShot = EQUIPMENT.find((piece) => piece.parameter === key)?.focus
    // A part that is being looked at already is left as the user has it: turned,
    // or zoomed in or out, while the value is set.
    setView((current) =>
      current.focus === shot || current.focus === ownShot
        ? current
        : { focus: shot, request: current.request + 1 },
    )
    // Draw length only shows on a drawn bow.
    if (key === 'bow.drawLength') setDrawn(true)
  }, [bow, arrow])

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
