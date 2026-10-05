import type { BowSetup } from '../../models/bow.ts'
import type { Coefficients } from '../coefficients/heuristicV0.ts'

/**
 * A stiffer plunger resists the arrow more, so the setup reads as stiffer.
 * Returned in the same log units as the stiffness mismatch.
 */
export function plungerBehaviorShift(bow: BowSetup, coefficients: Coefficients): number {
  const { reference, behavior } = coefficients
  return behavior.plungerShift * (bow.plungerStiffness - reference.plungerStiffness)
}

/**
 * Sideways push from plunger preload, in the right-handed frame: more preload
 * pushes the arrow away from the riser, which is to the left.
 */
export function plungerLateralPush(bow: BowSetup, coefficients: Coefficients): number {
  const { reference, lateral } = coefficients
  return -lateral.perMmPreload * (bow.plungerPreload - reference.plungerPreload)
}
