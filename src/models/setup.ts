import type { ArrowSetup } from './arrow.ts'
import type { BowSetup } from './bow.ts'
import { PARAMETERS, defaultValues, getValue } from './parameters.ts'

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

/** True when two setups have the same name and the same bow and arrow values. */
export function sameSetup(a: TuningSetup, b: TuningSetup): boolean {
  const values = (setup: TuningSetup) =>
    JSON.stringify(
      PARAMETERS.map((parameter) => getValue(setup, parameter)).concat(setup.name.trim()),
    )
  return values(a) === values(b)
}
