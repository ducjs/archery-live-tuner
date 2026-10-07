import { arrowTotalMass, type ArrowSetup } from '../../models/arrow.ts'

// The flight of the arrow as a point with air drag: the path the animation
// draws, and the launch angles that sight marks are read from.

const GRAVITY = 9.80665
/** kg/m³, air at about 20 °C at sea level */
const AIR_DENSITY = 1.2
/**
 * Drag coefficient of a fletched target arrow, on the cross-section of its
 * shaft. HEURISTIC: wind tunnel work on arrows reports roughly 1.5 to 2.6
 * depending on how the air flows along the shaft; no source for it is in
 * readme/tuning-references.md yet, so this is a round value in that range.
 */
export const DRAG_COEFFICIENT = 2

/** s, step of the integration. The path is smooth; a finer step changes nothing that shows. */
const STEP = 0.004
/** rad, steepest launch looked at. Past it a flatter shot reaches further. */
const STEEPEST = Math.PI / 4

/**
 * 1/m, how fast drag takes speed off this arrow: it loses this share of its
 * speed for every meter flown. Thicker shafts lose more, heavier arrows less.
 */
export function dragPerMeter(arrow: ArrowSetup): number {
  const area = Math.PI * (arrow.shaftDiameter / 2000) ** 2
  return (0.5 * AIR_DENSITY * DRAG_COEFFICIENT * area) / (arrowTotalMass(arrow) / 1000)
}

/** m, height of the arrow above its launch point when it has gone `distance` m downrange. */
function heightAt(speed: number, drag: number, distance: number, angle: number): number {
  let x = 0
  let y = 0
  let vx = speed * Math.cos(angle)
  let vy = speed * Math.sin(angle)
  // Midpoint steps. Drag acts against the motion and grows with the square of the speed.
  for (let step = 0; step < 5000; step++) {
    const v = Math.hypot(vx, vy)
    const mx = vx - 0.5 * STEP * drag * v * vx
    const my = vy - 0.5 * STEP * (drag * v * vy + GRAVITY)
    const mv = Math.hypot(mx, my)
    const nextX = x + STEP * mx
    const nextY = y + STEP * my
    if (nextX >= distance) {
      // The step that crosses the target is cut where it crosses.
      return y + ((nextY - y) * (distance - x)) / (nextX - x)
    }
    x = nextX
    y = nextY
    vx -= STEP * drag * mv * mx
    vy -= STEP * (drag * mv * my + GRAVITY)
    if (vx <= 0) break
  }
  return Number.NEGATIVE_INFINITY
}

export type FlightSample = {
  /** s */
  t: number
  /** mm, downrange */
  x: number
  /** mm, above the launch point */
  y: number
}

/**
 * The path from the bow to `distance`, sampled every `timeStep`. The last
 * sample is on the target. Empty when the arrow comes to a stop before it.
 *
 * @param speed mm/s
 * @param drag 1/m, see `dragPerMeter`
 * @param angle rad above the horizontal
 * @param distance mm
 * @param timeStep s
 * @param most the most samples to make
 */
export function flightPath(
  speed: number,
  drag: number,
  angle: number,
  distance: number,
  timeStep: number,
  most: number,
): FlightSample[] {
  const d = distance / 1000
  let x = 0
  let y = 0
  let vx = (speed / 1000) * Math.cos(angle)
  let vy = (speed / 1000) * Math.sin(angle)
  const samples: FlightSample[] = [{ t: 0, x: 0, y: 0 }]
  for (let step = 1; step < most; step++) {
    const v = Math.hypot(vx, vy)
    const mx = vx - 0.5 * timeStep * drag * v * vx
    const my = vy - 0.5 * timeStep * (drag * v * vy + GRAVITY)
    const mv = Math.hypot(mx, my)
    const nextX = x + timeStep * mx
    const nextY = y + timeStep * my
    if (nextX >= d) {
      // The step that reaches the target is cut where it reaches it.
      const share = (d - x) / (nextX - x)
      samples.push({
        t: (step - 1 + share) * timeStep,
        x: distance,
        y: (y + (nextY - y) * share) * 1000,
      })
      return samples
    }
    x = nextX
    y = nextY
    vx -= timeStep * drag * mv * mx
    vy -= timeStep * (drag * mv * my + GRAVITY)
    if (vx <= 0) return []
    samples.push({ t: step * timeStep, x: x * 1000, y: y * 1000 })
  }
  return []
}

/**
 * rad, the angle above the horizontal at which the arrow has to leave to pass
 * `rise` above its launch point at `distance`. NaN when it cannot get there.
 *
 * @param speed mm/s
 * @param drag 1/m, see `dragPerMeter`
 * @param distance mm
 * @param rise mm, positive when the point to hit is above the launch point
 */
export function launchAngleFor(speed: number, drag: number, distance: number, rise = 0): number {
  const v = speed / 1000
  const d = distance / 1000
  const target = rise / 1000
  if (!(v > 0) || !(d > 0)) return Number.NaN
  if (heightAt(v, drag, d, STEEPEST) < target) return Number.NaN

  let low = -STEEPEST
  let high = STEEPEST
  for (let i = 0; i < 40; i++) {
    const middle = (low + high) / 2
    if (heightAt(v, drag, d, middle) < target) low = middle
    else high = middle
  }
  return (low + high) / 2
}
