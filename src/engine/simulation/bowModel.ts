import { arrowTotalMass, type ArrowSetup } from '../../models/arrow.ts'
import { powerStroke, type BowSetup } from '../../models/bow.ts'
import type { Coefficients } from '../coefficients/coefficients.ts'
import { drawCurve } from './drawCurve.ts'

export { powerStroke }

/** J, the area under the draw force curve */
export function storedEnergy(bow: BowSetup, coefficients: Coefficients): number {
  const linear = 0.5 * bow.drawWeight * (powerStroke(bow) / 1000)
  // A straight line stores ½·F·s; the bulge of the curve adds a third of its fullness.
  return linear * (1 + drawCurve(bow, coefficients).fullness / 3)
}

/** mm/s, estimated launch speed from a virtual-mass energy balance */
export function launchSpeed(bow: BowSetup, arrow: ArrowSetup, coefficients: Coefficients): number {
  const { limbVirtualMass, stringMassShare } = coefficients.energy
  const movingMass =
    arrowTotalMass(arrow) + limbVirtualMass + bow.string.stringMass * stringMassShare
  const metersPerSecond = Math.sqrt((2 * storedEnergy(bow, coefficients)) / (movingMass / 1000))
  return metersPerSecond * 1000
}

/** s on the string, taking the push of the string as even over the power stroke */
export function timeOnString(bow: BowSetup, arrow: ArrowSetup, coefficients: Coefficients): number {
  return (2 * powerStroke(bow)) / launchSpeed(bow, arrow, coefficients)
}

/**
 * s from release until the tail of the arrow passes the riser. The nock leaves
 * the string at brace height, and from there it has the brace height to go.
 */
export function riserPassTime(
  bow: BowSetup,
  arrow: ArrowSetup,
  coefficients: Coefficients,
): number {
  return (
    timeOnString(bow, arrow, coefficients) + bow.braceHeight / launchSpeed(bow, arrow, coefficients)
  )
}

/** Resistance of the bow to being moved by the shot, relative to the reference bow. */
export function relativeBowInertia(bow: BowSetup, coefficients: Coefficients): number {
  const inertia = (mass: number, stabilizerMass: number, position: number) =>
    mass + stabilizerMass * (position / 500) ** 2
  const { reference } = coefficients
  return (
    inertia(bow.bowMass, bow.stabilizerMass, bow.stabilizerPosition) /
    inertia(reference.bowMass, reference.stabilizerMass, reference.stabilizerPosition)
  )
}
