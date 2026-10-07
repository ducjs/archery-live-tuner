import { z } from 'zod'
import {
  OBSERVATION_SCHEMA_VERSION,
  type Observation,
  type Seen,
  type SightRecord,
  type TargetPlot,
} from '../models/observation.ts'
import { SETUP_SCHEMA_VERSION, type TuningSetup } from '../models/setup.ts'
import { parseSetup } from './validation.ts'

/** Records what was seen when the setup on screen was shot, with a copy of its values. */
export function createObservation(
  setup: TuningSetup,
  seen: Seen,
  extra: { plot?: TargetPlot; sight?: SightRecord; notes?: string } = {},
  now = new Date(),
): Observation {
  const notes = extra.notes?.trim()
  return {
    id: crypto.randomUUID(),
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    setupId: setup.id,
    setupName: setup.name,
    bow: setup.bow,
    arrow: setup.arrow,
    createdAt: now.toISOString(),
    seen,
    ...(extra.plot && { plot: extra.plot }),
    ...(extra.sight && { sight: extra.sight }),
    ...(notes && { notes }),
  }
}

/** The observation as a setup the model can be run on. */
export function observedSetup(observation: Observation): Pick<TuningSetup, 'id' | 'bow' | 'arrow'> {
  return { id: observation.setupId, bow: observation.bow, arrow: observation.arrow }
}

const three = <A extends string, B extends string, C extends string>(a: A, b: B, c: C) =>
  z.enum([a, b, c]).optional()

const seenSchema = z.object({
  stiffness: three('WEAK', 'NEUTRAL', 'STIFF'),
  oscillation: three('LOW', 'MEDIUM', 'HIGH'),
  lateral: three('LEFT', 'NEUTRAL', 'RIGHT'),
  clearance: three('LOW', 'MEDIUM', 'HIGH'),
  bareHorizontal: three('LEFT', 'TOGETHER', 'RIGHT'),
  bareVertical: three('LOW', 'TOGETHER', 'HIGH'),
})

// Far wider than any target, and enough to refuse nonsense.
const onTarget = z.number().min(-5000).max(5000)

const plotSchema = z.object({
  distance: z.number().min(1000).max(150_000),
  faceDiameter: z.number().min(100).max(2000),
  marks: z
    .array(
      z.object({
        x: onTarget,
        y: onTarget,
        bare: z.boolean(),
        end: z.number().int().min(1).max(1000),
      }),
    )
    .max(2000),
})

const markSchema = z.object({
  distance: z.number().min(1000).max(150_000),
  mark: z.number().min(-10_000).max(10_000),
})

const sightSchema = z.object({
  marks: z.array(markSchema).max(50),
  eyeHeight: z.number().min(0).max(400),
  impliedSpeed: z.number().min(10_000).max(150_000).optional(),
})

/** Validates sight marks read back from storage. */
export function parseSight(input: unknown): SightRecord | null {
  const result = sightSchema.safeParse(input)
  return result.success ? result.data : null
}

/** Validates a target plot read back from storage. */
export function parsePlot(input: unknown): TargetPlot | null {
  const result = plotSchema.safeParse(input)
  return result.success ? result.data : null
}

const observationSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(OBSERVATION_SCHEMA_VERSION),
  setupId: z.string().min(1),
  setupName: z.string().trim().min(1).max(100),
  createdAt: z.string().min(1),
  seen: seenSchema,
  plot: plotSchema.optional(),
  sight: sightSchema.optional(),
  notes: z.string().max(2000).optional(),
})

/**
 * Validates untrusted input (localStorage, an imported file). The bow and
 * arrow go through the same check as a setup, so values added to the app
 * since the observation was stored get their defaults.
 */
export function parseObservation(input: unknown): Observation | null {
  const result = observationSchema.safeParse(input)
  if (!result.success) return null
  const values = input as { bow?: unknown; arrow?: unknown }
  const setup = parseSetup({
    id: result.data.setupId,
    schemaVersion: SETUP_SCHEMA_VERSION,
    name: result.data.setupName,
    bow: values.bow,
    arrow: values.arrow,
  })
  if (!setup.ok) return null
  return { ...result.data, bow: setup.setup.bow, arrow: setup.setup.arrow } as Observation
}

const EXPORT_FORMAT = 'recurve-tuning-simulator/observations'

/** The contents of a file holding these observations, to keep or to study elsewhere. */
export function exportObservations(observations: Observation[], now = new Date()): string {
  return JSON.stringify(
    {
      format: EXPORT_FORMAT,
      schemaVersion: OBSERVATION_SCHEMA_VERSION,
      exportedAt: now.toISOString(),
      observations,
    },
    null,
    2,
  )
}
