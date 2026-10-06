import { arrowShaftMass, arrowTotalMass, type ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'
import { convert } from '../../utils/units.ts'

// Numbers archers ask for that follow from the setup alone. They are plain
// arithmetic, not part of the heuristic model, so they have no coefficients.

/**
 * gr/lb, the arrow mass per pound of draw weight below which the arrow is too
 * light for the bow: the AMO minimum that bow makers commonly quote. An arrow
 * under it takes up too little of the stored energy, and the rest goes into
 * the limbs, as in a dry fire.
 */
export const MIN_GRAINS_PER_POUND = 5

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
