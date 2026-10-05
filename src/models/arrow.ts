/** All values are in internal units (see utils/units.ts). */
export type ArrowSetup = {
  /** mm, shaft length from nock groove to the end of the shaft, point excluded */
  length: number
  /** static spine rating, e.g. 700 = 0.700" deflection */
  spine: number
  /** g/mm */
  shaftGpi: number
  /** mm, outer diameter */
  shaftDiameter: number
  /** g */
  pointWeight: number
  /** g */
  insertWeight: number
  /** g */
  nockWeight: number
  /** g, all vanes together */
  fletchingWeight: number
}

/** g */
export function arrowShaftMass(arrow: ArrowSetup): number {
  return arrow.shaftGpi * arrow.length
}

/** g */
export function arrowTotalMass(arrow: ArrowSetup): number {
  return (
    arrowShaftMass(arrow) +
    arrow.pointWeight +
    arrow.insertWeight +
    arrow.nockWeight +
    arrow.fletchingWeight
  )
}
