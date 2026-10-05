import type { ArrowSetup } from './arrow.ts'
import type { BowSetup } from './bow.ts'
import { defaultValues } from './parameters.ts'

export const SETUP_SCHEMA_VERSION = 1

/** Not used by the MVP model. Reserved for a later phase (spec §7). */
export type ReleaseSetup = {
  lateralReleaseError: number
  verticalReleaseError: number
  stringRotation: number
  releaseConsistency: number
}

export type TuningSetup = {
  id: string
  schemaVersion: number
  name: string
  bow: BowSetup
  arrow: ArrowSetup
  release?: ReleaseSetup
  metadata?: {
    notes?: string
    createdAt?: string
  }
}

export function createDefaultSetup(name = 'New setup'): TuningSetup {
  return {
    id: crypto.randomUUID(),
    schemaVersion: SETUP_SCHEMA_VERSION,
    name,
    ...defaultValues(),
    metadata: { createdAt: new Date().toISOString() },
  }
}
