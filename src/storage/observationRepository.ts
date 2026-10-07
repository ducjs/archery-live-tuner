import type { Observation } from '../models/observation.ts'
import { parseObservation } from '../utils/observations.ts'

/**
 * Where real-world observations are kept. Like saved setups they live in the
 * browser for now, behind an interface a server can take over later.
 */
export type ObservationRepository = {
  /** Oldest first. */
  list(): Promise<Observation[]>
  /** Adds the observation, or replaces the stored one that has the same id. */
  save(observation: Observation): Promise<void>
  remove(id: string): Promise<void>
}

export const OBSERVATIONS_KEY = 'tuner.observations'

/** Keeps observations in the browser. `storage` is read on every call. */
export function createLocalObservationRepository(
  storage: () => Storage = () => localStorage,
  key = OBSERVATIONS_KEY,
): ObservationRepository {
  // Stored data is untrusted: entries that no longer validate are left out.
  const read = (): Observation[] => {
    const text = storage().getItem(key)
    if (!text) return []
    let stored: unknown
    try {
      stored = JSON.parse(text)
    } catch {
      return []
    }
    if (!Array.isArray(stored)) return []
    return stored.flatMap((entry) => parseObservation(entry) ?? [])
  }
  const write = (observations: Observation[]) =>
    storage().setItem(key, JSON.stringify(observations))

  return {
    async list() {
      return read()
    },
    async save(observation) {
      const observations = read()
      const index = observations.findIndex((stored) => stored.id === observation.id)
      if (index === -1) observations.push(observation)
      else observations[index] = observation
      write(observations)
    },
    async remove(id) {
      write(read().filter((stored) => stored.id !== id))
    },
  }
}
