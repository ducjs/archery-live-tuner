import type { ArrowSetup } from '../../models/arrow.ts'
import { bowLength, riserLength, type BowSetup } from '../../models/bow.ts'
import { convert } from '../../utils/units.ts'

/** mm. X points at the target, Y is up, Z is the archer's right. */
export type Vec3 = [number, number, number]

// The origin is where the arrow sits on the rest, straight above the grip.
// The line through it along X is both the string line (seen from above) and
// the line square to the string (seen from the side), on a bow whose limbs are
// in line. Limbs out of line carry the string, and its line, to the side.

/** mm, half the length of a 25 in riser */
export const RISER_HALF_LENGTH = 300
/**
 * Centerline of a 25 in riser seen from the side, as [x, y] from the lower limb
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
/**
 * mm, the sight window: the stretch where the riser is cut away so the arrow
 * can lie on the string line. It runs from the shelf just under the arrow to
 * well above it.
 */
const WINDOW = { from: -24, to: 170 }
/** mm, half the width of the riser where it is whole */
export const RISER_HALF_WIDTH = 15
/** mm, half the width of what is left of the riser beside the window */
export const WINDOW_BAR_HALF_WIDTH = 7
/** mm from the string plane to the middle of that bar */
const WINDOW_BAR_OFFSET = 26
/** mm below the arrow, where the stabilizers are mounted */
export const STABILIZER_HEIGHT = -130
/** mm in front of the riser centerline, where the long rod starts */
const STABILIZER_MOUNT = 36
/** mm, length of a side rod (10 in) */
const SIDE_ROD_LENGTH = 254
/** mm, how far the limb tips are from the arrow line on a 68 in bow at brace height */
const TIP_HEIGHT = 850
/** mm, how far inside the tip the string leaves the limb */
const TIP_TO_STRING = 55
/** How far along the limb, from pocket to tip, the tiller is measured: just outside the riser. */
const TILLER_AT = 0.26
/** How far along the limb the string leaves it. */
const CONTACT_AT = 0.93
/** Share of the draw that the limb tips come back by. Chosen by eye. */
const TIP_FOLLOW = 0.35
/** mm, how far the tip of a limb stands in front of the string: the recurve. */
const TIP_RECURVE = 30
/**
 * The side view of a limb, as [how far along it, share of the way from the
 * pocket back to where the string leaves it]. It leaves the pocket in the line
 * of the riser's end, runs back nearly straight, and turns upright where the
 * string lies on it, before the tip curls forward. Drawn after a photograph of
 * a strung bow.
 */
const LIMB_PROFILE: [number, number][] = [
  [0, 0],
  [TILLER_AT, 0.26],
  [0.54, 0.62],
  [0.8, 0.91],
  [0.88, 0.985],
  [CONTACT_AT, 1],
]
/** How far along the limb the two points between the string and the tip are, where it curls. */
const CURL_AT = [0.955, 0.98]

export type BowGeometry = {
  /** +1 when the riser is on the archer's right of the arrow (right-handed), -1 otherwise. */
  side: 1 | -1
  /** X of the string where the arrow sits on it: at brace height, or drawn back. */
  stringX: number
  /** Z of the string where the arrow sits on it. Zero unless the limbs are out of line. */
  stringZ: number
  nock: Vec3
  point: Vec3
  /** Center of the shaft where it crosses the rest and plunger. */
  atRest: Vec3
  shaftRadius: number
  /** mm, length of the point in front of the shaft. Longer for a heavier point. */
  pointLength: number
  /** Centerlines of the upper and the lower limb, from the riser to the tip. */
  limbs: [Vec3[], Vec3[]]
  /** The string as a polyline from the upper tip to the lower tip. */
  string: Vec3[]
  /** mm, thickness of the string. More strands make a thicker string. */
  stringRadius: number
  /**
   * The riser, in three stretches. Below and above the sight window it is
   * whole and stands in the string plane. At the window only a bar is left of
   * it, to the bow hand's side, and the arrow passes through the gap.
   */
  riser: {
    /** Centerline from the lower pocket up to the shelf under the arrow. */
    lower: Vec3[]
    /** Centerline of the bar beside the window. */
    bar: Vec3[]
    /** Centerline from the top of the window to the upper pocket. */
    upper: Vec3[]
    /** Z of the face of the bar that the arrow passes: the wall of the window. */
    wall: number
  }
  /** Where the limbs sit on the riser: the lower pocket, then the upper one. */
  pockets: [Vec3, Vec3]
  /** Where tiller is measured: from each limb just outside the riser, across to the string. Upper first. */
  tiller: [{ from: Vec3; to: Vec3 }, { from: Vec3; to: Vec3 }]
  /** How far the plunger's adjusting collar sits out along its barrel, in mm. Further for more preload. */
  plungerCollar: number
  /** The long rod, from its mount on the riser to where its weight starts. */
  longRod: { from: Vec3; to: Vec3 }
  /** mm, length of the weight on the long rod. Longer for more mass. */
  weightLength: number
  /** The two side rods, from the V-bar back past the archer's hand. */
  sideRods: { from: Vec3; to: Vec3 }[]
}

export type GeometryOptions = {
  /**
   * Multiplies the offsets that are a few millimetres in reality (nocking
   * point, center shot, tiller, limb alignment) so that they can be seen.
   */
  amplify: number
  /** Shows the bow at full draw instead of at brace height. */
  drawn?: boolean
}

/** Positions of the parts that depend on the setup. */
export function bowGeometry(
  setup: { bow: BowSetup; arrow: ArrowSetup },
  options: number | GeometryOptions,
): BowGeometry {
  const { amplify, drawn = false } = typeof options === 'number' ? { amplify: options } : options
  const { bow, arrow } = setup
  const brace = bow.braceHeight
  const side = bow.handedness === 'RH' ? 1 : -1

  // Riser. A longer riser is the same shape, stretched along its length.
  const stretch = riserLength(bow) / 25
  const profile = RISER_PROFILE.map(([x, y]): [number, number] => [x, y * stretch])
  /** X of the riser's centerline at a height. */
  const profileX = (y: number) => {
    const next = profile.findIndex(([, height]) => height >= y)
    const [x0, y0] = profile[Math.max(0, next - 1)]!
    const [x1, y1] = profile[next]!
    return y1 === y0 ? x0 : x0 + ((x1 - x0) * (y - y0)) / (y1 - y0)
  }
  const whole = (from: number, to: number): Vec3[] => [
    [profileX(from), from, 0],
    ...profile.filter(([, y]) => y > from && y < to).map(([x, y]): Vec3 => [x, y, 0]),
    [profileX(to), to, 0],
  ]
  const bottom = profile[0]![1]
  const top = profile.at(-1)![1]
  // The bar reaches a little into the whole riser at both ends, where it is joined to it.
  const barZ = side * WINDOW_BAR_OFFSET
  const barHeights = [WINDOW.from - 14, 20, 70, 120, WINDOW.to + 14]
  const riser = {
    lower: whole(bottom, WINDOW.from),
    bar: barHeights.map((y): Vec3 => [profileX(y), y, barZ]),
    upper: whole(WINDOW.to, top),
    wall: barZ - side * WINDOW_BAR_HALF_WIDTH,
  }
  const lowerPocket = riser.lower[0]!
  const upperPocket = riser.upper.at(-1)!

  // Limbs. The tips are half the bow length from the middle, less what the
  // curve of the bow takes up; they come back and in as the string is drawn.
  const pull = drawn ? Math.max(0, bow.drawLength - brace) : 0
  const reach = TIP_HEIGHT + ((bowLength(bow) - 68) * 25.4) / 2
  const tipX = -brace + TIP_RECURVE - TIP_FOLLOW * pull
  // The string keeps its length: what it gains toward the nock, the tips give up in height.
  const halfString = reach - TIP_TO_STRING
  const contactX = -brace - TIP_FOLLOW * pull
  const stringX = -brace - pull
  const contactY = Math.sqrt(Math.max(1, halfString ** 2 - (contactX - stringX) ** 2))
  const tipY = contactY + TIP_TO_STRING

  // Tiller is the gap between limb and string just outside the riser, top
  // minus bottom. It is set with the limb bolts, which tilt each limb in its
  // pocket: the whole limb swings, its tip most, and the tip takes the string
  // with it. With one limb swung back and the other forward by as much, the
  // string leans against the riser and stays where it was at the arrow, so
  // the brace height is kept.
  const tillerBase = RISER_HALF_LENGTH * stretch - 30
  const tillerHeight = tillerBase + TILLER_AT * (tipY - tillerBase)
  // What a swing of the tip does to the gap: the limb moves a little there,
  // the string, hanging between the two tips, moves more, the other way.
  const gapPerSwing = 2 * (TILLER_AT - (CONTACT_AT * tillerHeight) / contactY)
  /** How far the tip of the upper limb swings toward the target; the lower one swings as far the other way. */
  const swing = (bow.tiller * amplify) / gapPerSwing
  const limb = (up: 1 | -1, alignment: number): Vec3[] => {
    const pocket = up === 1 ? upperPocket : lowerPocket
    const base: [number, number] = [pocket[0] + 4, Math.abs(pocket[1]) - 30]
    const tipZ = alignment * amplify
    const span = tipY - base[1]
    // [x, height above the arrow line, how far along the limb].
    const back = contactX - 8 - base[0]
    const shape: [number, number, number][] = [
      ...LIMB_PROFILE.map(([along, share]): [number, number, number] => [
        base[0] + share * back,
        along === CONTACT_AT ? contactY : base[1] + along * span,
        along,
      ]),
      // The curl of the tip starts upright at the string and turns forward faster and faster.
      ...CURL_AT.map((along): [number, number, number] => {
        const share = (along - CONTACT_AT) / (1 - CONTACT_AT)
        return [
          contactX - 8 + share ** 2 * (tipX - contactX + 8),
          contactY + share * (tipY - contactY),
          along,
        ]
      }),
      [tipX, tipY, 1],
    ]
    return shape.map(([x, y, along]) => [
      // The limb swings about its pocket: nothing there, all of it at the tip.
      x + up * swing * along,
      up * y,
      // A limb out of line leaves the pocket straight and ends up to one side.
      tipZ * along,
    ])
  }
  const upper = limb(1, bow.limbAlignmentTop)
  const lower = limb(-1, bow.limbAlignmentBottom)
  // Where the string leaves each limb: on the limb's face, just in front of its centerline.
  const contact = (points: Vec3[]): Vec3 => {
    const [x, y, z] = points.at(-2 - CURL_AT.length)!
    return [x + 8, y, z]
  }
  const upperContact = contact(upper)
  const lowerContact = contact(lower)
  // The string runs straight between the limbs, so it sits halfway between them at the arrow.
  const stringZ = (upperContact[2] + lowerContact[2]) / 2

  // The nock sits on the string, the shaft lies on the rest, and the point ends
  // up wherever that line leads. The rest is on the riser: it does not move
  // with the string. Center shot is where the point would be with the limbs in line.
  const nockY = bow.nockingPointHeight * amplify
  const restZ = (bow.centerShot * amplify * brace) / arrow.length
  const nock: Vec3 = [stringX, nockY, stringZ]
  const atRest: Vec3 = [0, 0, restZ]
  const toRest = -stringX
  const point: Vec3 = [
    stringX + arrow.length,
    nockY * (1 - arrow.length / toRest),
    stringZ + (restZ - stringZ) * (arrow.length / toRest),
  ]

  const mount: Vec3 = [STABILIZER_MOUNT, STABILIZER_HEIGHT, 0]
  // Side rods run back and outward from the V-bar, and a little down.
  const lean = [-0.8, -0.17, 0.57]
  const rodScale = SIDE_ROD_LENGTH / Math.hypot(...lean)
  const sideRods = [1, -1].map((outward) => {
    const from: Vec3 = [mount[0] + 14, mount[1], outward * 14]
    const to: Vec3 = [
      from[0] + lean[0]! * rodScale,
      from[1] + lean[1]! * rodScale,
      from[2] + outward * lean[2]! * rodScale,
    ]
    return { from, to }
  })

  const tillerMark = (points: Vec3[]) => {
    const from = points[1]!
    // To the string at that height. The string runs straight from one limb to the other.
    const share = (from[1] - lowerContact[1]) / (upperContact[1] - lowerContact[1])
    const stringThere = lowerContact[0] + (upperContact[0] - lowerContact[0]) * share
    return { from, to: [stringThere, from[1], from[2]] as Vec3 }
  }

  return {
    side,
    stringX,
    stringZ,
    nock,
    point,
    atRest,
    shaftRadius: arrow.shaftDiameter / 2,
    // A 100 gr point is about an inch long; 20 gr more is a few millimetres.
    pointLength: 10 + convert(arrow.pointWeight, 'g', 'gr') * 0.16,
    limbs: [upper, lower],
    string: [upper.at(-1)!, upperContact, nock, lowerContact, lower.at(-1)!],
    stringRadius: 0.7 + bow.string.strandCount * 0.05,
    riser,
    pockets: [lowerPocket, upperPocket],
    tiller: [tillerMark(upper), tillerMark(lower)],
    plungerCollar: 8 + bow.plungerPreload * 4,
    longRod: { from: mount, to: [mount[0] + bow.stabilizerPosition, mount[1], 0] },
    // The mass is drawn as one weight on the long rod, though a real set spreads it.
    weightLength: 12 + bow.stabilizerMass * 0.12,
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
