import {
  HEURISTIC_V0,
  createHeuristicModel,
  explore,
  type Exploration,
  type SetupInput,
} from '../engine/index.ts'
import type { Personal } from '../models/calibration.ts'

// Runs the landscape and the sensitivity chart off the main thread, so a slider
// being dragged never waits for them.

export type ExploreRequest = {
  /** Echoed back, so an answer that comes late can be told from the current one. */
  id: number
  setup: SetupInput
  /** The shifts of the model the page computes with. */
  personal: Personal
}

export type ExploreAnswer = {
  id: number
  result: Exploration
}

self.onmessage = (event: MessageEvent<ExploreRequest>) => {
  const { id, setup, personal } = event.data
  const model = createHeuristicModel(HEURISTIC_V0, personal)
  const answer: ExploreAnswer = { id, result: explore(model, setup) }
  self.postMessage(answer)
}
