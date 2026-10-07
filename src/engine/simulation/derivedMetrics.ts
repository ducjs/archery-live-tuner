import { arrowShaftMass, arrowTotalMass, type ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'
import { convert } from '../../utils/units.ts'

// Numbers archers ask for that follow from the setup alone. They are plain
// arithmetic, not part of the heuristic model, so they have no coefficients.

/**
 * gr/lb, the arrow mass per pound of draw weight under which an arrow is
 * called light: a rule of thumb that bow makers quote, mostly for compound
 * bows. It is not the AMO minimum, which is `minimumArrowMass` below and is
 * lower for most recurve bows.
 */
export const MIN_GRAINS_PER_POUND = 5

/** in, the AMO draw lengths of the columns of the chart below. */
const AMO_DRAW_LENGTHS = [25, 26, 27, 28, 29, 30, 31, 32, 33]

/**
 * AMO minimum recommended arrow weights for recurve bows, in grains, as printed
 * in the Easton Arrow Tuning and Maintenance Guide (2nd edition, page 31).
 * Each row is the highest peak draw weight, in lb, that it covers. An arrow
 * lighter than this takes up too little of the stored energy, and what is left
 * in the limbs can break the bow.
 */
const AMO_RECURVE_MINIMUM: [maxDrawWeight: number, grains: number[]][] = [
  [33, [150, 150, 150, 150, 150, 150, 150, 150, 150]],
  [41, [150, 150, 150, 150, 150, 150, 150, 151, 165]],
  [46, [150, 150, 150, 150, 150, 163, 179, 195, 211]],
  [52, [150, 150, 150, 167, 185, 203, 222, 240, 258]],
  [58, [150, 163, 183, 203, 224, 244, 264, 285, 305]],
  [63, [172, 195, 217, 240, 262, 284, 307, 329, 352]],
  [69, [202, 227, 251, 276, 300, 325, 350, 374, 399]],
  [75, [232, 259, 286, 312, 339, 365, 392, 419, 445]],
  [81, [262, 291, 320, 348, 377, 406, 435, 463, 492]],
]

/**
 * g, the lightest arrow the AMO chart allows on this bow. A draw weight
 * between two rows takes the heavier row; a draw length between two columns
 * goes in a straight line between them, and one outside the chart takes the
 * nearest column.
 */
export function minimumArrowMass(bow: BowSetup): number {
  const drawWeight = convert(bow.drawWeight, 'N', 'lbf')
  // A hair of slack, so that 41 lb entered as newtons still reads as 41 lb.
  const row =
    AMO_RECURVE_MINIMUM.find(([maxDrawWeight]) => drawWeight <= maxDrawWeight + 1e-6) ??
    AMO_RECURVE_MINIMUM.at(-1)!
  const grains = row[1]

  const first = AMO_DRAW_LENGTHS[0]!
  const last = AMO_DRAW_LENGTHS.at(-1)!
  const drawLength = Math.min(last, Math.max(first, convert(bow.drawLength, 'mm', 'in')))
  const column = Math.min(Math.floor(drawLength - first), grains.length - 2)
  const share = drawLength - first - column
  return convert(grains[column]! + (grains[column + 1]! - grains[column]!) * share, 'gr', 'g')
}

/** Grains of arrow per pound of draw weight. Low values are hard on the bow. */
export function grainsPerPound(bow: BowSetup, arrow: ArrowSetup): number {
  return convert(arrowTotalMass(arrow), 'g', 'gr') / convert(bow.drawWeight, 'N', 'lbf')
}

/** mm, how far a target point's shank reaches into the shaft. HEURISTIC: it is not an input. */
const POINT_SHANK = 25
/** mm, how far behind the end of the shaft the middle of an insert sits. HEURISTIC. */
const INSERT_DEPTH = 10

/** %, the front of center the Easton guide gives for target arrows, over its shaft types. */
export const FOC_RANGE = { low: 7, high: 16 }

/**
 * Front of center, in percent, by the AMO formula: how far the balance point
 * of the finished arrow sits ahead of the middle of the arrow length, which
 * runs from the nock groove to the end of the shaft.
 *
 * The shaft balances at its middle and the nock sits at the groove. The vanes
 * sit where the archer says. The point is taken as an even bar from the end
 * of its shank, inside the shaft, to its tip, and the insert a little inside
 * the end of the shaft.
 */
export function frontOfCenter(arrow: ArrowSetup): number {
  const length = arrow.length
  const pointCenter = length + (arrow.pointLength - POINT_SHANK) / 2
  const moment =
    arrowShaftMass(arrow) * (length / 2) +
    arrow.pointWeight * pointCenter +
    arrow.insertWeight * (length - INSERT_DEPTH) +
    arrow.fletchingWeight * arrow.fletchingPosition
  const balance = moment / arrowTotalMass(arrow)
  return ((balance - length / 2) / length) * 100
}

/** J, for a launch speed in mm/s */
export function kineticEnergy(arrow: ArrowSetup, launchSpeed: number): number {
  return 0.5 * (arrowTotalMass(arrow) / 1000) * (launchSpeed / 1000) ** 2
}
