import { create } from 'zustand'
import type { Observation } from '../models/observation.ts'
import {
  createLocalObservationRepository,
  type ObservationRepository,
} from '../storage/observationRepository.ts'

const repository: ObservationRepository = createLocalObservationRepository()

type ObservationState = {
  /** Every stored observation, oldest first. */
  observations: Observation[]
  /** The last attempt to reach the storage did not work. */
  failed: boolean
  load: () => Promise<void>
  save: (observation: Observation) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useObservationStore = create<ObservationState>()((set) => {
  // Every change is followed by a fresh read, so the list always shows what is stored.
  const run = async (change?: () => Promise<void>) => {
    try {
      await change?.()
      set({ observations: await repository.list(), failed: false })
    } catch {
      set({ failed: true })
    }
  }
  return {
    observations: [],
    failed: false,
    load: () => run(),
    save: (observation) => run(() => repository.save(observation)),
    remove: (id) => run(() => repository.remove(id)),
  }
})
