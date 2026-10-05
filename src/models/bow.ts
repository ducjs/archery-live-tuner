export type Handedness = 'RH' | 'LH'

export type NockFit = 'LOOSE' | 'NORMAL' | 'TIGHT'

export type StringSetup = {
  strandCount: number
  /** g */
  stringMass: number
  nockFit: NockFit
}

/** All values are in internal units (see utils/units.ts). */
export type BowSetup = {
  handedness: Handedness
  /** N, force on the fingers at full draw */
  drawWeight: number
  /** mm */
  drawLength: number
  /** mm */
  braceHeight: number
  /** mm above square */
  nockingPointHeight: number
  /** mm, top tiller minus bottom tiller */
  tiller: number
  /** mm, arrow point offset from the string line: negative = left, positive = right */
  centerShot: number
  /** normalized: 0 = very soft, 1 = medium, 2 = very stiff */
  plungerStiffness: number
  /** mm */
  plungerPreload: number
  /** g, total mass of the shooting setup */
  bowMass: number
  /** g, total added stabilizer mass */
  stabilizerMass: number
  /** mm, distance of the stabilizer mass in front of the riser */
  stabilizerPosition: number
  string: StringSetup
}
