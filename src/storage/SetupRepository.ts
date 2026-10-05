import type { TuningSetup } from '../models/setup.ts'

/**
 * Where saved setups are kept. The MVP keeps them in the browser; a later
 * version can keep them on a server behind the same interface (spec §35).
 */
export type SetupRepository = {
  list(): Promise<TuningSetup[]>
  /** Adds the setup, or replaces the stored one that has the same id. */
  save(setup: TuningSetup): Promise<void>
  remove(id: string): Promise<void>
}
