import { create } from 'zustand'
import type { TuningSetup } from '../models/setup.ts'
import { createLocalStorageRepository } from '../storage/localStorageRepository.ts'
import type { SetupRepository } from '../storage/SetupRepository.ts'

const repository: SetupRepository = createLocalStorageRepository()

type LibraryState = {
  /** Saved setups, oldest first. */
  saved: TuningSetup[]
  /** The last attempt to reach the storage did not work. */
  failed: boolean
  load: () => Promise<void>
  save: (setup: TuningSetup) => Promise<void>
  /** Adds several setups at once, such as the ones read from a file. */
  saveMany: (setups: TuningSetup[]) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useLibraryStore = create<LibraryState>()((set) => {
  // Every change is followed by a fresh read, so the list always shows what is stored.
  const run = async (change?: () => Promise<void>) => {
    try {
      await change?.()
      set({ saved: await repository.list(), failed: false })
    } catch {
      set({ failed: true })
    }
  }
  return {
    saved: [],
    failed: false,
    load: () => run(),
    save: (setup) => run(() => repository.save(setup)),
    saveMany: (setups) =>
      run(async () => {
        for (const setup of setups) await repository.save(setup)
      }),
    remove: (id) => run(() => repository.remove(id)),
  }
})
