import { useEffect, useMemo, useState } from 'react'
import { explore, type Exploration } from '../../engine/index.ts'
import { useModel, usePersonal } from '../../state/calibrationStore.ts'
import type { TuningSetup } from '../../models/setup.ts'
import type { ExploreAnswer, ExploreRequest } from '../../workers/explore.worker.ts'

let worker: Worker | null | undefined
let lastRequest = 0

/** One worker for the page, made on first use. Null where workers are not available. */
function exploreWorker(): Worker | null {
  if (worker === undefined) {
    try {
      worker = new Worker(new URL('../../workers/explore.worker.ts', import.meta.url), {
        type: 'module',
      })
    } catch {
      worker = null
    }
  }
  return worker
}

/**
 * The landscape and the sensitivity chart for a setup. They are computed in a
 * worker and arrive a moment after the setup changes; until then the previous
 * ones stay on screen. Without a worker they are computed in place.
 */
export function useExplore(setup: TuningSetup): Exploration {
  const { bow, arrow, id } = setup
  const background = exploreWorker()
  // The base model, or the one fitted to the archer; the worker is told which.
  const model = useModel()
  const personal = usePersonal()
  // Without a worker the views are computed here, as part of the render.
  const local = useMemo(
    () => (background ? null : explore(model, { id, bow, arrow })),
    [background, model, bow, arrow, id],
  )
  // With one, the first are computed in place too, so there is never an empty chart.
  const [answer, setAnswer] = useState(() => local ?? explore(model, { id, bow, arrow }))

  useEffect(() => {
    if (!background) return
    const request: ExploreRequest = { id: ++lastRequest, setup: { id, bow, arrow }, personal }
    const receive = (event: MessageEvent<ExploreAnswer>) => {
      // Only the answer to this request counts; an older one is out of date.
      if (event.data.id === request.id) setAnswer(event.data.result)
    }
    background.addEventListener('message', receive)
    background.postMessage(request)
    return () => background.removeEventListener('message', receive)
  }, [background, personal, bow, arrow, id])

  return local ?? answer
}
