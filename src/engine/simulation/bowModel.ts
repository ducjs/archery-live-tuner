import { arrowTotalMass, type ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'
import type { Coefficients } from '../coefficients/heuristicV0.ts'

/** mm, distance over which the string accelerates the arrow */
export function powerStroke(bow: BowSetup): number {
  return bow.drawLength - bow.braceHeight
}

/** J */
export function storedEnergy(bow: BowSetup, coefficients: Coefficients): number {
  const linear = 0.5 * bow.drawWeight * (powerStroke(bow) / 1000)
  return linear * coefficients.energy.drawCurveFactor
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
