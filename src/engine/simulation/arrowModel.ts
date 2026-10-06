import { arrowShaftMass, type ArrowSetup } from '../../models/arrow.ts'
import type { Coefficients } from '../coefficients/coefficients.ts'

// Static spine test: deflection in inches x 1000 of a shaft supported over 28 in
// with a 1.94 lbf load at the center.
const SPINE_TEST_LOAD_N = 1.94 * 4.4482216152605
const SPINE_TEST_SPAN_M = 28 * 0.0254

// (beta·L)^2 for the first bending mode of a free-free beam.
const FREE_FREE_FIRST_MODE = 22.3733

/** g, mass carried at the front of the shaft */
export function frontMass(arrow: ArrowSetup): number {
  return arrow.pointWeight + arrow.insertWeight
}

/** g, mass carried at the back of the shaft */
export function tailMass(arrow: ArrowSetup): number {
  return arrow.nockWeight + arrow.fletchingWeight
}

/** N·m², bending stiffness EI derived from the static spine rating */
export function bendingStiffness(spine: number): number {
  const deflection = (spine / 1000) * 0.0254
  return (SPINE_TEST_LOAD_N * SPINE_TEST_SPAN_M ** 3) / (48 * deflection)
}

/**
 * Hz, first bending mode of the arrow. The bare-shaft value is physical; the
 * correction for point and nock mass is a heuristic.
 */
export function bendingFrequency(arrow: ArrowSetup, coefficients: Coefficients): number {
  const length = arrow.length / 1000
  // g/mm is numerically equal to kg/m.
  const massPerLength = arrow.shaftGpi
  const bareShaft =
    (FREE_FREE_FIRST_MODE / (2 * Math.PI * length ** 2)) *
    Math.sqrt(bendingStiffness(arrow.spine) / massPerLength)

  const endMassRatio = (frontMass(arrow) + tailMass(arrow)) / arrowShaftMass(arrow)
  return bareShaft / Math.sqrt(1 + coefficients.flex.endMassFactor * endMassRatio)
}
