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

/**
 * Front of center, in percent: how far the balance point sits ahead of the
 * middle of the shaft. Point and insert are taken at the front end, the nock
 * at the back end, the fletching a little ahead of the nock.
 */
export function frontOfCenter(arrow: ArrowSetup): number {
  const length = arrow.length
  const moment =
    arrowShaftMass(arrow) * (length / 2) +
    (arrow.pointWeight + arrow.insertWeight) * length +
    arrow.fletchingWeight * (length * 0.08)
  const balance = moment / arrowTotalMass(arrow)
  return ((balance - length / 2) / length) * 100
}

/** J, for a launch speed in mm/s */
export function kineticEnergy(arrow: ArrowSetup, launchSpeed: number): number {
  return 0.5 * (arrowTotalMass(arrow) / 1000) * (launchSpeed / 1000) ** 2
}
