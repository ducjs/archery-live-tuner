export type Handedness = 'RH' | 'LH'

export type NockFit = 'LOOSE' | 'NORMAL' | 'TIGHT'

/** Riser length in inches, as risers are named: H25 is the common 25 in riser. */
export type RiserSize = 'H23' | 'H25' | 'H27'

/**
 * Limb length, as limbs are marked: the length in inches of the bow they make
 * on a 25 in riser. 66 is short, 68 medium, 70 long.
 */
export type LimbSize = '66' | '68' | '70'

/** How the force builds up over the draw, when the archer has not measured it (spec §39.3). */
export type DrawCurveStyle = 'STRAIGHT' | 'STANDARD' | 'FULL'

export type StringSetup = {
  strandCount: number
  /** g */
  stringMass: number
  nockFit: NockFit
}

/** All values are in internal units (see utils/units.ts). */
export type BowSetup = {
  handedness: Handedness
  riserSize: RiserSize
  limbSize: LimbSize
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
  /** mm, how far the tip of the top limb sits to the side of the riser's centerline: negative = left, positive = right */
  limbAlignmentTop: number
  /** mm, the same for the bottom limb */
  limbAlignmentBottom: number
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
  /** An estimate of the shape of the draw force curve */
  drawCurve: DrawCurveStyle
  string: StringSetup
}

/** in, length of the riser */
export function riserLength(bow: Pick<BowSetup, 'riserSize'>): number {
  return Number(bow.riserSize.slice(1))
}

/** in, length of the bow: what the limbs make on a 25 in riser, plus what the riser adds to that */
export function bowLength(bow: Pick<BowSetup, 'riserSize' | 'limbSize'>): number {
  return Number(bow.limbSize) + (riserLength(bow) - 25)
}

/** mm of brace height that go with an inch of bow length (Easton's ranges move 1/8 in per inch). */
export const BRACE_PER_INCH = 25.4 / 8

/**
 * mm, the range of brace height Easton gives for a recurve of this length
 * (Arrow Tuning and Maintenance Guide): 21.0 to 24.1 cm for 68 in, moving with
 * the length. The guide lists 64 to 70 in; shorter and longer bows follow the
 * same line.
 */
export function braceHeightRange(bow: Pick<BowSetup, 'riserSize' | 'limbSize'>): {
  min: number
  max: number
} {
  const shift = (bowLength(bow) - 68) * BRACE_PER_INCH
  // The guide gives inches: 8 1/4 to 9 1/2 in for a 68 in bow.
  return { min: 8.25 * 25.4 + shift, max: 9.5 * 25.4 + shift }
}

/** mm, distance over which the string accelerates the arrow */
export function powerStroke(bow: Pick<BowSetup, 'drawLength' | 'braceHeight'>): number {
  return bow.drawLength - bow.braceHeight
}
