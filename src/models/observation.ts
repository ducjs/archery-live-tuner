import type { ArrowSetup } from './arrow.ts'
import type { BowSetup } from './bow.ts'
import type { BareShaftComparison, TuningClassification } from './simulation.ts'

export const OBSERVATION_SCHEMA_VERSION = 1

/** Where one arrow landed on the target face. */
export type Mark = {
  /** mm from the middle of the face, to the right */
  x: number
  /** mm from the middle of the face, upward */
  y: number
  /** A bare shaft, as opposed to a fletched arrow. */
  bare: boolean
  /** Which end it was shot in, counting from 1. */
  end: number
}

/** The arrows of a bare shaft test, as marked on a target face. */
export type TargetPlot = {
  /** mm, how far the target was shot from */
  distance: number
  /** mm, diameter of the target face */
  faceDiameter: number
  marks: Mark[]
}

/** A sight mark the archer has: the reading on their own sight scale that hits at a distance. */
export type KnownMark = {
  /** mm */
  distance: number
  /** In the units of the archer's sight scale, as they read it. */
  mark: number
}

/** The sight marks of a setup, with what was needed to read a speed from them. */
export type SightRecord = {
  marks: KnownMark[]
  /** mm, how far the eye is above the arrow at anchor */
  eyeHeight: number
  /** mm/s, the arrow speed the marks imply. Left out when there were too few marks to say. */
  impliedSpeed?: number
}

/**
 * What the archer saw on the range, in the same words the model reports in.
 * Everything is optional: an archer notes what they looked at.
 */
export type Seen = {
  stiffness?: TuningClassification['stiffness']
  oscillation?: TuningClassification['oscillation']
  /** Where the fletched arrows tend to land. */
  lateral?: TuningClassification['lateral']
  clearance?: TuningClassification['clearance']
  bareHorizontal?: BareShaftComparison['horizontal']
  bareVertical?: BareShaftComparison['vertical']
}

export const SEEN_KEYS = [
  'stiffness',
  'bareHorizontal',
  'bareVertical',
  'lateral',
  'oscillation',
  'clearance',
] as const satisfies readonly (keyof Seen)[]

/**
 * A real-world observation: what happened when a setup was shot. It keeps its
 * own copy of the bow and arrow values, because the setup it was made with can
 * be changed or deleted afterwards and the observation must still mean the same.
 */
export type Observation = {
  id: string
  schemaVersion: number
  /** The setup on screen when it was recorded. */
  setupId: string
  setupName: string
  bow: BowSetup
  arrow: ArrowSetup
  /** ISO date and time */
  createdAt: string
  seen: Seen
  /** The target the bare shaft result was read from, when it was. */
  plot?: TargetPlot
  /** Sight marks shot with this setup: real measurements of how it throws the arrow. */
  sight?: SightRecord
  notes?: string
}
