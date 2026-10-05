import type { ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'

/** mm. X points at the target, Y is up, Z is the archer's right. */
export type Vec3 = [number, number, number]

// The origin is where the arrow sits on the rest, straight above the grip.
// The line through it along X is both the string line (seen from above) and
// the line square to the string (seen from the side).

/** mm, half the length of a 25 in riser */
export const RISER_HALF_LENGTH = 300
/** mm, how far the limb tips are from the arrow line on a 68 in bow */
const TIP_HEIGHT = 850
/** mm, where the string leaves the limb */
const STRING_CONTACT_HEIGHT = 795

export type BowGeometry = {
  /** +1 when the riser is on the archer's right of the arrow (right-handed), -1 otherwise. */
  side: 1 | -1
  /** X of the string at brace height. */
  stringX: number
  nock: Vec3
  point: Vec3
  /** Center of the shaft where it crosses the rest and plunger. */
  atRest: Vec3
  shaftRadius: number
  /** Upper limb centerline as [x, y] pairs, from the riser to the tip. Mirror in Y for the lower limb. */
  limb: [number, number][]
  /** The string as a polyline from the upper tip to the lower tip. */
  string: Vec3[]
}

/**
 * Positions of the parts that depend on the setup. `amplify` multiplies the
 * nocking point and center shot offsets so that a few millimetres can be seen.
 */
export function bowGeometry(
  setup: { bow: BowSetup; arrow: ArrowSetup },
  amplify: number,
): BowGeometry {
  const { bow, arrow } = setup
  const brace = bow.braceHeight
  const stringX = -brace

  // The nock sits on the string, the shaft lies on the rest at the origin, and
  // the point ends up wherever that line leads.
  const nockY = bow.nockingPointHeight * amplify
  const pointY = nockY * (1 - arrow.length / brace)

  // Center shot is measured at the point; the nock stays on the string line.
  const pointZ = bow.centerShot * amplify
  const restZ = (pointZ * brace) / arrow.length

  const tip: [number, number] = [stringX + 30, TIP_HEIGHT]
  const limb: [number, number][] = [
    [5, RISER_HALF_LENGTH],
    [-20, 430],
    [-brace * 0.45, 580],
    [-brace * 0.85, 720],
    [stringX - 8, STRING_CONTACT_HEIGHT],
    tip,
  ]

  return {
    side: bow.handedness === 'RH' ? 1 : -1,
    stringX,
    nock: [stringX, nockY, 0],
    point: [stringX + arrow.length, pointY, pointZ],
    atRest: [0, 0, restZ],
    shaftRadius: arrow.shaftDiameter / 2,
    limb,
    string: [
      [tip[0], tip[1], 0],
      [stringX, STRING_CONTACT_HEIGHT, 0],
      [stringX, -STRING_CONTACT_HEIGHT, 0],
      [tip[0], -tip[1], 0],
    ],
  }
}

/** A point on the straight line from `from` to `to`; 0 is `from`, 1 is `to`. */
export function along(from: Vec3, to: Vec3, fraction: number): Vec3 {
  return [
    from[0] + (to[0] - from[0]) * fraction,
    from[1] + (to[1] - from[1]) * fraction,
    from[2] + (to[2] - from[2]) * fraction,
  ]
}
