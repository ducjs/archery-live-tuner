// From what is marked on the limbs to the force on the fingers (spec §39.6).
// A rule of thumb, not part of the model: limbs are marked at 28 in AMO on a
// 25 in riser with the limb bolts in the middle, and a recurve near that draw
// gains about 5% of its weight per inch.

/** mm, the draw length limbs are marked at: 28 in AMO */
export const MARKED_AT_DRAW = 711.2

/** Share of the marked weight gained per inch of draw. */
export const GAIN_PER_INCH = 0.05

/** Share of the draw weight the limb bolts take off or add, from all the way out to all the way in. */
export const BOLT_RANGE = 0.05

/**
 * N on the fingers, for a marked weight in N, a draw length in mm, and the limb
 * bolts as a share from `-BOLT_RANGE` (out) to `BOLT_RANGE` (in).
 */
export function onFingers(marked: number, drawLength: number, bolt: number): number {
  const beyond = (drawLength - MARKED_AT_DRAW) / 25.4
  return marked * (1 + GAIN_PER_INCH * beyond) * (1 + bolt)
}
