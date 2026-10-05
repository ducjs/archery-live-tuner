import type { TuningSetup } from '../models/setup.ts'
import { parseSetup } from '../utils/validation.ts'
import type { SetupRepository } from './SetupRepository.ts'

export const SETUPS_KEY = 'tuner.setups'

/**
 * Keeps setups in the browser. `storage` is read on every call, so the
 * repository can be created before the browser storage is known to work.
 */
export function createLocalStorageRepository(
  storage: () => Storage = () => localStorage,
  key = SETUPS_KEY,
): SetupRepository {
  // Stored data is untrusted: entries that no longer validate are left out.
  const read = (): TuningSetup[] => {
    const text = storage().getItem(key)
    if (!text) return []
    let stored: unknown
    try {
      stored = JSON.parse(text)
    } catch {
      return []
    }
    if (!Array.isArray(stored)) return []
    return stored.flatMap((entry) => {
      const parsed = parseSetup(entry)
      return parsed.ok ? [parsed.setup] : []
    })
  }
  const write = (setups: TuningSetup[]) => storage().setItem(key, JSON.stringify(setups))

  return {
    async list() {
      return read()
    },
    async save(setup) {
      const setups = read()
      const index = setups.findIndex((stored) => stored.id === setup.id)
      if (index === -1) setups.push(setup)
      else setups[index] = setup
      write(setups)
    },
    async remove(id) {
      write(read().filter((stored) => stored.id !== id))
    },
  }
}
