import type { ArrowSetup } from '../../models/arrow.ts'
import type { BowSetup } from '../../models/bow.ts'

/** mm. X points at the target, Y is up, Z is the archer's right. */
export type Vec3 = [number, number, number]

// The origin is where the arrow sits on the rest, straight above the grip.
// The line through it along X is both the string line (seen from above) and
// the line square to the string (seen from the side).

/** mm, half the length of a 25 in riser */
export const RISER_HALF_LENGTH = 300
/**
 * Centerline of the riser seen from the side, as [x, y] from the lower limb
 * pocket to the upper one. The middle bows away from the archer and the
 * pockets lean back, which is what sets the limbs at their angle.
 */
const RISER_PROFILE: [number, number][] = [
  [-26, -300],
  [-8, -240],
  [10, -170],
  [18, -100],
  [15, -35],
  [20, 35],
  [21, 105],
  [12, 185],
  [-6, 245],
  [-26, 300],
]
/** mm, the part of the riser that is cut away so the arrow can pass: the sight window */
const WINDOW = { from: -5, to: 150 }
/** mm, how far the sight window is set to the side of the string plane */
const WINDOW_OFFSET = 19
/** mm below the arrow, where the stabilizers are mounted */
export const STABILIZER_HEIGHT = -130
/** mm in front of the riser centerline, where the long rod starts */
const STABILIZER_MOUNT = 36
/** mm, length of a side rod (10 in) */
const SIDE_ROD_LENGTH = 254
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
  /** Centerline of the riser, from the lower pocket to the upper one. It steps aside at the sight window. */
  riser: Vec3[]
  /** Where the limbs sit on the riser: the lower pocket, then the upper one. */
  pockets: [Vec3, Vec3]
  /** The long rod, from its mount on the riser to where its weight starts. */
  longRod: { from: Vec3; to: Vec3 }
  /** The two side rods, from the V-bar back past the archer's hand. */
  sideRods: { from: Vec3; to: Vec3 }[]
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

  const side = bow.handedness === 'RH' ? 1 : -1
  // The riser stands in the string plane, except at the sight window, which is
  // set to the bow hand's side so the arrow can lie on the string line.
  const riser: Vec3[] = RISER_PROFILE.map(([x, y]) => [
    x,
    y,
    y > WINDOW.from && y < WINDOW.to ? side * WINDOW_OFFSET : 0,
  ])
  const pocket = RISER_PROFILE.at(-1)!

  const mount: Vec3 = [STABILIZER_MOUNT, STABILIZER_HEIGHT, 0]
  // Side rods run back and outward from the V-bar, and a little down.
  const lean = [-0.8, -0.17, 0.57]
  const reach = SIDE_ROD_LENGTH / Math.hypot(...lean)
  const sideRods = [1, -1].map((outward) => {
    const from: Vec3 = [mount[0] + 14, mount[1], outward * 14]
    const to: Vec3 = [
      from[0] + lean[0]! * reach,
      from[1] + lean[1]! * reach,
      from[2] + outward * lean[2]! * reach,
    ]
    return { from, to }
  })

  const tip: [number, number] = [stringX + 30, TIP_HEIGHT]
  const limb: [number, number][] = [
    [pocket[0] + 4, pocket[1] - 30],
    [-42, 430],
    [-brace * 0.45, 580],
    [-brace * 0.85, 720],
    [stringX - 8, STRING_CONTACT_HEIGHT],
    tip,
  ]

  return {
    side,
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
    riser,
    pockets: [
      [RISER_PROFILE[0]![0], RISER_PROFILE[0]![1], 0],
      [pocket[0], pocket[1], 0],
    ],
    longRod: { from: mount, to: [mount[0] + bow.stabilizerPosition, mount[1], 0] },
    sideRods,
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
