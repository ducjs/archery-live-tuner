import type { ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'
import type { Coefficients } from '../coefficients/heuristicV0.ts'
import { frontMass, tailMass } from './arrowModel.ts'

/**
 * The spine rating that would be neutral for this bow and arrow build.
 * A power law around the reference setup: heavier loading asks for a stiffer
 * shaft, which is a lower spine number.
 */
export function requiredSpine(
  bow: BowSetup,
  arrow: ArrowSetup,
  coefficients: Coefficients,
): number {
  const { reference, requiredSpine: exponent } = coefficients

  const logLoad =
    exponent.drawWeight * Math.log(bow.drawWeight / reference.drawWeight) +
    exponent.drawLength * Math.log(bow.drawLength / reference.drawLength) +
    exponent.braceHeight * Math.log(bow.braceHeight / reference.braceHeight) +
    exponent.arrowLength * Math.log(arrow.length / reference.arrowLength) +
    exponent.frontMass * Math.log(frontMass(arrow) / reference.frontMass) +
    exponent.tailMass * Math.log(tailMass(arrow) / reference.tailMass) +
    exponent.stringMass * Math.log(bow.string.stringMass / reference.stringMass) +
    exponent.strandCount * Math.log(bow.string.strandCount / reference.strandCount)

  return reference.spine * Math.exp(-logLoad)
}

/**
 * Log stiffness mismatch: 0 = matched, positive = the shaft is stiffer than
 * needed, negative = weaker than needed.
 */
export function stiffnessMismatch(
  bow: BowSetup,
  arrow: ArrowSetup,
  coefficients: Coefficients,
): number {
  return Math.log(requiredSpine(bow, arrow, coefficients) / arrow.spine)
}
