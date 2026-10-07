/**
 * What one archer's observations move in the model. Only shifts: where
 * "matched" and "neutral" lie for this archer and this bow. How strongly each
 * value acts stays as the base model has it, because a handful of
 * observations cannot tell those apart (spec §18).
 */
export type Personal = {
  /**
   * Added to the stiffness mismatch. Positive: this archer's arrows shoot
   * stiffer than the base model expects; negative: weaker. On the scale of the
   * mismatch, where 0.07 is about one 50-point step of spine at 700.
   */
  behaviorShift: number
  /** mm, added to the nocking point height the model reads as neutral. */
  nockingPointNeutral: number
  /** mm, the center shot the model reads as neutral, in the sign it is entered with. */
  centerShotNeutral: number
}

/** The base model: nothing shifted. */
export const NO_PERSONAL: Personal = {
  behaviorShift: 0,
  nockingPointNeutral: 0,
  centerShotNeutral: 0,
}

export function isPersonal(personal: Personal): boolean {
  return (
    personal.behaviorShift !== 0 ||
    personal.nockingPointNeutral !== 0 ||
    personal.centerShotNeutral !== 0
  )
}
