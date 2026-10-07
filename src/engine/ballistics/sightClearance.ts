import { launchAngleFor } from './flight.ts'

// Where the sight pin sits for a distance, and how much room the arrow has
// under it (spec §38.6). The further the target, the lower the pin: it comes
// down toward the path of the arrow, and with a long extension or a low
// anchor the vanes can strike it.
//
// This is geometry and needs no sight marks. The pin lies on the line from
// the eye to the target. The arrow leaves pointing above that line by the
// launch angle, so at the pin, which is `reach` in front of the eye, the
// arrow's line has risen toward the sight line:
//
//   pin above the arrow = eye above the arrow − reach · tan(launch angle)

/** in → mm. The AMO draw length is measured to 1.75 in past the pivot point of the grip. */
const AMO_PAST_PIVOT = 1.75 * 25.4
/** mm, room under which the pin is called close: the arrow is still settling as it passes. HEURISTIC. */
export const CLOSE_ROOM = 10

export type SightGeometry = {
  /** mm/s */
  speed: number
  /** 1/m, see `dragPerMeter` */
  drag: number
  /** mm, the eye above the arrow at anchor */
  eyeHeight: number
  /** mm, AMO draw length */
  drawLength: number
  /** mm, how far in front of the riser the pin sits */
  extension: number
  /** mm, outer diameter of the pin housing or ring */
  pinDiameter: number
  /** mm */
  shaftDiameter: number
  /** mm, how far a vane stands off the shaft */
  vaneHeight: number
}

export type PinPosition = {
  /** mm */
  distance: number
  /** mm, the middle of the pin above the line of the arrow. Negative: below it. NaN: out of reach. */
  pinHeight: number
  /** mm, between the bottom of the pin housing and the top of the vanes. Negative: they overlap. */
  room: number
  /**
   * `clear`, `close` when the room is small, `blocked` when the vanes would
   * strike the pin or the pin would have to sit below the arrow, and
   * `unreachable` when the arrow cannot get to the distance at all.
   */
  status: 'clear' | 'close' | 'blocked' | 'unreachable'
}

/** mm, from the eye to the pin. The eye is taken to be over the nock at full draw. */
export function pinReach(geometry: Pick<SightGeometry, 'drawLength' | 'extension'>): number {
  return geometry.drawLength - AMO_PAST_PIVOT + geometry.extension
}

/** Where the pin sits for one distance, and the room the arrow has under it. */
export function pinPosition(geometry: SightGeometry, distance: number): PinPosition {
  const angle = launchAngleFor(geometry.speed, geometry.drag, distance, geometry.eyeHeight)
  if (!Number.isFinite(angle)) {
    return { distance, pinHeight: Number.NaN, room: Number.NaN, status: 'unreachable' }
  }
  const pinHeight = geometry.eyeHeight - pinReach(geometry) * Math.tan(angle)
  const room =
    pinHeight - geometry.pinDiameter / 2 - geometry.vaneHeight - geometry.shaftDiameter / 2
  return {
    distance,
    pinHeight,
    room,
    status: room < 0 ? 'blocked' : room < CLOSE_ROOM ? 'close' : 'clear',
  }
}
