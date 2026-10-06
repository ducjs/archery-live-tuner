import { explore, heuristicModel, type Exploration, type SetupInput } from '../engine/index.ts'

// Runs the landscape and the sensitivity chart off the main thread, so a slider
// being dragged never waits for them.

export type ExploreRequest = {
  /** Echoed back, so an answer that comes late can be told from the current one. */
  id: number
  setup: SetupInput
}

export type ExploreAnswer = {
  id: number
  result: Exploration
}

self.onmessage = (event: MessageEvent<ExploreRequest>) => {
  const { id, setup } = event.data
  const answer: ExploreAnswer = { id, result: explore(heuristicModel, setup) }
  self.postMessage(answer)
}
